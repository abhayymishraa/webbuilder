"""Auth regression suite. Uses only a fresh, explicitly named local test database."""

import os
import unittest
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, patch

from fastapi import FastAPI, HTTPException
from fastapi.testclient import TestClient
from sqlalchemy import select, update

from auth.router import get_me, router
from auth.social import (
    social_router,
    configure_sessions,
    resolve_identity,
    verified_identity,
)
from auth.utils import create_access_token, create_refresh_token, decode_token
from auth.verification import consume_token, issue_token, token_digest
from db.base import AsyncSessionLocal, engine
from db.models import AuthToken, User


@unittest.skipUnless(
    os.getenv("RUN_DATABASE_TESTS") == "1", "Requires isolated local PostgreSQL"
)
class AuthTests(unittest.TestCase):
    def setUp(self):
        self.assertEqual(engine.url.host, "localhost")
        self.assertTrue(engine.url.database.startswith("webbuilder_test_"))
        app = FastAPI()
        configure_sessions(app)
        app.include_router(router)
        app.include_router(social_router)
        self.client = TestClient(app).__enter__()
        import uuid

        self.email = f"{uuid.uuid4().hex}@example.org"
        self.password = "test-password-only"
        self.sent = []

        async def capture(db, user, ip):
            self.sent.append(await issue_token(db, user.id, "verify_email", 30, ip))

        self.mail = patch("auth.router.send_verification", new=capture)
        self.configured = patch("auth.router.email_configured", return_value=True)
        self.mail.start()
        self.configured.start()
        response = self.client.post(
            "/auth/register",
            json={"email": self.email, "name": "A Maker", "password": self.password},
        )
        self.assertEqual(response.status_code, 201, response.text)
        self.assertNotIn("access_token", response.json())

    def tearDown(self):
        self.mail.stop()
        self.configured.stop()
        self.client.portal.call(engine.dispose)
        self.client.__exit__(None, None, None)

    def verify(self):
        result = self.client.post(
            "/auth/verification/confirm", json={"token": self.sent[-1]}
        )
        self.assertEqual(result.status_code, 200, result.text)
        return {"Authorization": "Bearer " + result.json()["access_token"]}

    def test_pending_login_then_verification_and_single_use(self):
        data = {"email": self.email.upper(), "password": self.password}
        self.assertEqual(self.client.post("/auth/login", json=data).status_code, 403)
        headers = self.verify()
        self.assertTrue(
            self.client.get("/auth/me", headers=headers).json()["email_verified"]
        )
        self.assertEqual(
            self.client.post(
                "/auth/verification/confirm", json={"token": self.sent[-1]}
            ).status_code,
            400,
        )
        self.assertEqual(self.client.post("/auth/login", json=data).status_code, 200)

    def test_unverified_existing_token_cannot_access_any_chat_transport(self):
        from main import app as application
        from db.models import Chat
        from starlette.websockets import WebSocketDisconnect
        import uuid

        async def existing():
            async with AsyncSessionLocal() as db:
                user = await db.scalar(select(User).where(User.email == self.email))
                chat = Chat(
                    id=str(uuid.uuid4()), user_id=user.id, title="Existing project"
                )
                db.add(chat)
                await db.commit()
                return user.id, chat.id

        user_id, chat_id = self.client.portal.call(existing)
        # A genuine signed token still cannot grant access without a database email proof.
        access = create_access_token({"sub": str(user_id)})
        refresh = create_refresh_token({"sub": str(user_id)})
        headers = {"Authorization": "Bearer " + access}
        # Register the real routes in the auth-only harness; don't start agent jobs.
        self.client.app.router.routes.extend(
            route
            for route in application.routes
            if route.path.startswith(("/chat", "/ws/", "/projects", "/runs/"))
        )
        with patch("main.agent_service.admit", new=AsyncMock()) as admit:
            self.assertEqual(
                self.client.post(
                    "/chat", json={"prompt": "Blocked"}, headers=headers
                ).status_code,
                403,
            )
            self.assertEqual(
                self.client.post(
                    f"/chats/{chat_id}/runs",
                    json={"prompt": "Blocked"},
                    headers=headers,
                ).status_code,
                403,
            )
            self.assertEqual(
                self.client.get(
                    f"/chats/{chat_id}/messages", headers=headers
                ).status_code,
                403,
            )
            self.assertEqual(
                self.client.get(f"/chats/{chat_id}/runs", headers=headers).status_code,
                403,
            )
            self.assertEqual(
                self.client.get("/projects", headers=headers).status_code, 403
            )
            admit.assert_not_called()
        self.assertEqual(self.client.get("/auth/me", headers=headers).status_code, 403)
        self.assertEqual(
            self.client.post(
                "/auth/refresh", json={"refresh_token": refresh}
            ).status_code,
            401,
        )
        with self.client.websocket_connect(f"/ws/{chat_id}") as ws:
            ws.send_json({"type": "auth", "token": access})
            with self.assertRaises(WebSocketDisconnect) as closed:
                ws.receive_json()
            self.assertEqual(closed.exception.code, 1008)

        async def direct_admission():
            from agent.service import Service

            service = Service()
            with patch.object(service, "execute", new=AsyncMock()):
                with self.assertRaises(HTTPException) as blocked:
                    await service.admit(user_id, "Blocked direct call")
                self.assertEqual(blocked.exception.status_code, 403)
                self.assertFalse(service.active)
            async with AsyncSessionLocal() as db:
                user = await db.get(User, user_id)
                self.assertEqual(user.tokens_remaining, 2)

        self.client.portal.call(direct_admission)
        self.verify()
        self.assertEqual(
            self.client.get(f"/chats/{chat_id}/messages", headers=headers).status_code,
            200,
        )

    def test_profile_persistence_validation_and_auth(self):
        headers = self.verify()
        self.assertEqual(
            self.client.patch("/auth/me", json={"name": "No access"}).status_code, 403
        )
        self.assertEqual(
            self.client.patch(
                "/auth/me", json={"name": "   "}, headers=headers
            ).status_code,
            422,
        )
        self.assertEqual(
            self.client.patch(
                "/auth/me", json={"name": "Maker", "bio": "x" * 281}, headers=headers
            ).status_code,
            422,
        )
        response = self.client.patch(
            "/auth/me",
            json={"name": "  New name  ", "bio": "  I make things. "},
            headers=headers,
        )
        self.assertEqual(response.status_code, 200, response.text)
        self.assertEqual(response.json()["name"], "New name")
        self.assertEqual(
            self.client.get("/auth/me", headers=headers).json()["bio"], "I make things."
        )

    def test_expiry_purpose_and_hash_storage(self):
        async def check():
            async with AsyncSessionLocal() as db:
                row = await db.get(AuthToken, token_digest(self.sent[-1]))
                self.assertIsNotNone(row)
                self.assertNotEqual(row.digest, self.sent[-1])
                with self.assertRaises(HTTPException):
                    await consume_token(db, self.sent[-1], "oauth_exchange")
                await db.execute(
                    update(AuthToken)
                    .where(AuthToken.digest == row.digest)
                    .values(
                        expires_at=datetime.now(timezone.utc) - timedelta(seconds=1)
                    )
                )
                await db.commit()

        self.client.portal.call(check)
        self.assertEqual(
            self.client.post(
                "/auth/verification/confirm", json={"token": self.sent[-1]}
            ).status_code,
            400,
        )

    def test_refresh_cannot_authenticate_or_exchange_as_email(self):
        self.verify()
        result = self.client.post(
            "/auth/login", json={"email": self.email, "password": self.password}
        ).json()
        self.assertEqual(
            self.client.get(
                "/auth/me",
                headers={"Authorization": "Bearer " + result["refresh_token"]},
            ).status_code,
            401,
        )
        self.assertEqual(
            self.client.post(
                "/auth/refresh", json={"refresh_token": result["access_token"]}
            ).status_code,
            401,
        )
        self.assertEqual(
            self.client.post(
                "/auth/refresh", json={"refresh_token": result["refresh_token"]}
            ).status_code,
            200,
        )

    def test_social_collision_requires_explicit_link_and_subject_cannot_move(self):
        async def check():
            async with AsyncSessionLocal() as db:
                user = await db.scalar(select(User).where(User.email == self.email))
                with self.assertRaisesRegex(ValueError, "link_required"):
                    await resolve_identity(
                        db, "google", self.email, self.email, "Provider name", None
                    )
                linked = await resolve_identity(
                    db, "google", self.email, self.email, "Provider name", user.id
                )
                self.assertEqual(linked.id, user.id)
                await db.commit()
                with self.assertRaisesRegex(ValueError, "account_conflict"):
                    await resolve_identity(
                        db,
                        "google",
                        self.email,
                        self.email,
                        "Provider name",
                        user.id + 999,
                    )
                returning = await resolve_identity(
                    db, "google", self.email, self.email, "Provider name", None
                )
                self.assertEqual(returning.id, user.id)

        self.client.portal.call(check)

    def test_oauth_handoff_is_single_use(self):
        headers = self.verify()
        user_id = self.client.get("/auth/me", headers=headers).json()["id"]

        async def ticket():
            async with AsyncSessionLocal() as db:
                value = await issue_token(db, user_id, "oauth_exchange", 1)
                await db.commit()
                return value

        value = self.client.portal.call(ticket)
        self.assertEqual(
            self.client.post("/auth/oauth/exchange", json={"token": value}).status_code,
            200,
        )
        self.assertEqual(
            self.client.post("/auth/oauth/exchange", json={"token": value}).status_code,
            400,
        )

    def test_disabled_providers_and_delivery(self):
        with patch.dict(
            os.environ,
            {"GOOGLE_CLIENT_ID": "", "GITHUB_CLIENT_ID": "", "RESEND_API_KEY": ""},
        ):
            self.assertEqual(
                self.client.get("/auth/options").json()["providers"],
                {"google": False, "github": False},
            )
            self.assertEqual(
                self.client.get(
                    "/auth/oauth/google", follow_redirects=False
                ).status_code,
                503,
            )
        with patch("auth.router.email_configured", return_value=False):
            response = self.client.post(
                "/auth/verification/request", json={"email": self.email}
            )
            self.assertEqual(response.status_code, 503)

    def test_oauth_state_and_pkce_without_provider_calls(self):
        from urllib.parse import parse_qs, urlparse

        with patch.dict(
            os.environ,
            {"GITHUB_CLIENT_ID": "test-client", "GITHUB_CLIENT_SECRET": "test-secret"},
        ):
            response = self.client.get("/auth/oauth/github", follow_redirects=False)
            self.assertEqual(response.status_code, 302)
            params = parse_qs(urlparse(response.headers["location"]).query)
            self.assertEqual(params["code_challenge_method"], ["S256"])
            self.assertTrue(params["state"])
            with patch(
                "httpx.AsyncClient.send",
                side_effect=AssertionError("Unexpected provider request"),
            ):
                response = self.client.get(
                    "/auth/oauth/github/callback?state=invalid&code=invalid",
                    follow_redirects=False,
                )
            self.assertEqual(response.status_code, 303)
            self.assertTrue(
                response.headers["location"].endswith("#error=oauth_failed")
            )

    def test_confirm_invalidates_other_email_links(self):
        first = self.sent[-1]
        self.client.post("/auth/verification/request", json={"email": self.email})
        self.assertEqual(len(self.sent), 2)
        self.verify()
        self.assertEqual(
            self.client.post(
                "/auth/verification/confirm", json={"token": first}
            ).status_code,
            400,
        )

    def test_delivery_failure_does_not_create_account(self):
        email = "failed-" + self.email
        with patch(
            "auth.router.send_verification",
            new=AsyncMock(side_effect=HTTPException(503, "Delivery failed")),
        ):
            response = self.client.post(
                "/auth/register",
                json={"name": "Test", "email": email, "password": self.password},
            )
        self.assertEqual(response.status_code, 503)

        async def check():
            async with AsyncSessionLocal() as db:
                self.assertIsNone(
                    await db.scalar(select(User).where(User.email == email))
                )

        self.client.portal.call(check)

    def test_oidc_signature_failure_returns_safe_error(self):
        from joserfc.errors import BadSignatureError

        client = AsyncMock()
        client.authorize_access_token.side_effect = BadSignatureError()
        with patch("auth.social.oauth_client", return_value=client):
            response = self.client.get(
                "/auth/oauth/google/callback", follow_redirects=False
            )
        self.assertEqual(response.status_code, 303)
        self.assertTrue(response.headers["location"].endswith("#error=oauth_failed"))

    def test_resend_throttle_uses_database_without_external_email(self):
        from auth.verification import send_verification

        async def check():
            async with AsyncSessionLocal() as db:
                user = await db.scalar(select(User).where(User.email == self.email))
                with (
                    patch.dict(
                        os.environ,
                        {
                            "RESEND_API_KEY": "test-only",
                            "RESEND_FROM": "test@example.org",
                        },
                    ),
                    patch("auth.verification.httpx.AsyncClient") as client,
                ):
                    await send_verification(db, user, "test-ip")
                    client.assert_not_called()  # Just issued a token; resend cooldown is active.

        self.client.portal.call(check)


class CreditDisplayTests(unittest.IsolatedAsyncioTestCase):
    async def test_profile_reports_available_credits_without_starting_a_window(self):
        now = datetime.now(timezone.utc)
        for reset_at, remaining in (
            (None, 2),
            (now - timedelta(seconds=1), 2),
            (now + timedelta(hours=2), 0),
        ):
            with self.subTest(reset_at=reset_at):
                user = User(
                    id=1, name="Maker", email="maker@example.org", bio="",
                    email_verified=True, created_at=now, tokens_remaining=0,
                    tokens_reset_at=reset_at,
                )
                db = AsyncMock()
                db.scalars.return_value = []
                result = await get_me(user, db)
                self.assertEqual(result.tokens_remaining, remaining)
                self.assertEqual(result.tokens_reset_at, reset_at if remaining == 0 else None)
                self.assertFalse(result.credits_unlimited)
                self.assertEqual(user.tokens_remaining, 0)
                self.assertEqual(user.tokens_reset_at, reset_at)
                db.commit.assert_not_awaited()

    async def test_unlimited_flag_matches_credit_admission(self):
        user = User(
            id=1, name="Owner", email="grabhaymishra@gmail.com", bio="",
            email_verified=True, created_at=datetime.now(timezone.utc),
            tokens_remaining=0,
        )
        db = AsyncMock()
        db.scalars.return_value = []
        self.assertTrue((await get_me(user, db)).credits_unlimited)
        self.assertTrue(user.use_token())
        self.assertEqual(user.tokens_remaining, 0)


class ProviderProofTests(unittest.IsolatedAsyncioTestCase):
    async def test_google_requires_verified_claim(self):
        for value in (False, "true", None):
            with self.assertRaises(ValueError):
                await verified_identity(
                    "google",
                    None,
                    {
                        "userinfo": {
                            "sub": "123",
                            "email": "a@example.org",
                            "email_verified": value,
                        }
                    },
                )
        self.assertEqual(
            (
                await verified_identity(
                    "google",
                    None,
                    {
                        "userinfo": {
                            "sub": "123",
                            "email": "A@example.org",
                            "email_verified": True,
                        }
                    },
                )
            )[:2],
            ("123", "a@example.org"),
        )

    async def test_github_requires_primary_verified_email(self):
        import httpx

        client = AsyncMock()

        def response(data):
            return httpx.Response(
                200,
                json=data,
                request=httpx.Request("GET", "https://api.github.com/user"),
            )

        client.get.side_effect = [
            response({"id": 123}),
            response([{"email": "a@example.org", "primary": True, "verified": False}]),
        ]
        with self.assertRaises(ValueError):
            await verified_identity("github", client, {})

    def test_jwt_types_are_separate(self):
        access = create_access_token({"sub": "1"})
        refresh = create_refresh_token({"sub": "1"})
        self.assertIsNone(decode_token(refresh))
        self.assertIsNone(decode_token(access, "refresh"))
        self.assertEqual(decode_token(access)["sub"], "1")
