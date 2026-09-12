from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import asyncio
from anyio import CancelScope
import json
import os
import io
import zipfile
from fastapi import Depends

from sqlalchemy import select, text
from agent.service import agent_service
from agent.tools import list_files, project_path
from auth.router import router
from db.models import User, Chat, Message, Run
from auth.dependencies import get_current_user
from sqlalchemy.ext.asyncio import AsyncSession
from db.base import get_db, AsyncSessionLocal, engine

from auth.utils import decode_token


from contextlib import asynccontextmanager, suppress


@asynccontextmanager
async def lifespan(app):
    await agent_service.startup()
    try:
        yield
    finally:
        await agent_service.shutdown()
        await engine.dispose()


app = FastAPI(title="WebBuilder", lifespan=lifespan)

origins = [
    origin.strip()
    for origin in os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router=router)



class ChatPayload(BaseModel):
    prompt: str


@app.get("/")
async def get_health():
    return {"message": "Welome", "status": "Healthy"}


@app.get("/health/ready")
async def get_readiness(db: AsyncSession = Depends(get_db)):
    try:
        await asyncio.wait_for(db.execute(text("SELECT 1")), timeout=12)
    except Exception:
        raise HTTPException(status_code=503, detail="Database unavailable") from None
    return {"status": "ready"}


@app.get("/chats/{id}/messages")
async def get_chat_messages(
    id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get message history for a chat"""
    # Verify the chat exists and belongs to the user
    result = await db.execute(select(Chat).where(Chat.id == id))
    chat = result.scalar_one_or_none()

    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    if chat.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this chat")

    # Get all messages for the chat
    result = await db.execute(
        select(Message)
        .where(Message.chat_id == id)
        .order_by(Message.created_at)
    )
    messages = result.scalars().all()

    return {
        "chat": {
            "id": chat.id,
            "title": chat.title,
            "app_url": chat.app_url,
            "created_at": chat.created_at
        },
        "messages": [
            {
                "id": msg.id,
                "role": msg.role,
                "content": msg.content,
                "event_type": msg.event_type,
                "created_at": msg.created_at
            }
            for msg in messages
        ]
    }


@app.post("/chat")
async def create_project(payload: ChatPayload, current_user: User = Depends(get_current_user)):
    return await agent_service.admit(current_user.id, payload.prompt)


@app.post("/chats/{id}/runs")
async def create_run(id: str, payload: ChatPayload, current_user: User = Depends(get_current_user)):
    return await agent_service.admit(current_user.id, payload.prompt, id)


async def owned_chat(id: str, user: User, db: AsyncSession):
    chat = await db.scalar(select(Chat).where(Chat.id == id, Chat.user_id == user.id))
    if not chat:
        raise HTTPException(404, "Project not found")
    return chat


@app.get("/chats/{id}/runs")
async def get_runs(id: str, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await owned_chat(id, current_user, db)
    return {"runs": await agent_service.snapshot(id)}


@app.post("/runs/{run_id}/cancel")
async def cancel_run(run_id: str, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    run = await db.get(Run, run_id)
    if not run:
        raise HTTPException(404, "Run not found")
    await owned_chat(run.chat_id, current_user, db)
    await agent_service.cancel(run_id)
    return {"runs": await agent_service.snapshot(run.chat_id)}


@app.get("/projects/{id}/files")
async def get_project_files(id: str, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await owned_chat(id, current_user, db)
    sandbox = agent_service.sandboxes.get(id)
    if not sandbox:
        raise HTTPException(
            status_code=404, detail="Project sandbox not found or not active."
        )

    try:
        files = await list_files(sandbox)

        return {
            "project_id": id,
            "files": files,
            "sandbox_id": sandbox.sandbox_id,
            "sandbox_active": True,
        }
    except json.JSONDecodeError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to parse file list: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching files: {str(e)}"
        )


@app.get("/projects/{id}/files/{file_path:path}")
async def get_file_content(id: str, file_path: str, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await owned_chat(id, current_user, db)
    try:
        file_path = project_path(file_path)
    except ValueError as exc:
        raise HTTPException(422, str(exc)) from None
    """Get the content of a specific file from the project"""
    sandbox = agent_service.sandboxes.get(id)
    if not sandbox:
        raise HTTPException(
            status_code=404, detail="Project sandbox not found or not active."
        )

    try:
        full_path = f"/home/user/react-app/{file_path}"
        content = await sandbox.files.read(full_path)
        
        return {
            "file_path": file_path,
            "content": content,
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error reading file: {str(e)}"
        )


@app.get("/projects/{id}/download")
async def download_all_files(id: str, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await owned_chat(id, current_user, db)
    """Download all project files as a ZIP archive"""
    sandbox = agent_service.sandboxes.get(id)
    if not sandbox:
        raise HTTPException(
            status_code=404, detail="Project sandbox not found or not active."
        )

    try:
        files = await list_files(sandbox)
        
        # Create ZIP file in memory
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            for file_path in files:
                try:
                    full_path = f"/home/user/react-app/{file_path}"
                    content = await sandbox.files.read(full_path)
                    zip_file.writestr(file_path, content)
                except Exception as e:
                    print(f"Failed to add {file_path} to ZIP: {e}")
                    continue
        
        zip_buffer.seek(0)
        
        return StreamingResponse(
            zip_buffer,
            media_type="application/zip",
            headers={
                "Content-Disposition": f"attachment; filename={id}-project.zip"
            }
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error creating ZIP: {str(e)}"
        )


@app.get("/projects")
async def list_user_projects(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List all Projects per user"""
    result = await db.execute(
        select(Chat).where(Chat.user_id == current_user.id)
    )
    projects = result.scalars().all()
    return {
        "projects" : projects
    }


@app.websocket("/ws/{id}")
async def ws_listener(websocket: WebSocket, id: str):
    # Authenticate in the first frame: bearer tokens never enter URLs or access logs.
    await websocket.accept()
    try:
        first = await asyncio.wait_for(websocket.receive_json(), timeout=10)
        if not isinstance(first, dict) or not isinstance(first.get('token'), str):
            await websocket.close(code=1008)
            return
        payload = decode_token(first.get("token", "")) if first.get("type") == "auth" else None
        if not payload or not payload.get("sub"):
            await websocket.close(code=1008)
            return
        async with AsyncSessionLocal() as db:
            chat = await db.scalar(select(Chat).where(Chat.id == id, Chat.user_id == int(payload["sub"])))
            if not chat:
                await websocket.close(code=1008)
                return
    except (ValueError, TimeoutError, WebSocketDisconnect):
        with suppress(RuntimeError):
            await websocket.close(code=1008)
        return

    queue = asyncio.Queue(maxsize=64)
    agent_service.subscribers.setdefault(id, set()).add(queue)

    async def send_snapshot():
        async with AsyncSessionLocal() as db:
            chat = await db.get(Chat, id)
            messages = (await db.scalars(select(Message).where(Message.chat_id == id).order_by(Message.created_at.desc()).limit(200))).all()
            messages = list(reversed(messages))
            history = [{"id": m.id, "role": m.role, "content": m.content,
                        "event_type": m.event_type, "tool_calls": m.tool_calls,
                        "created_at": m.created_at.isoformat()} for m in messages]
            app_url = chat.app_url
        await websocket.send_json({"type": "history", "messages": history,
                                   "app_url": app_url, "runs": await agent_service.snapshot(id)})

    async def receive():
        while True:
            data = await websocket.receive_json()
            if isinstance(data, dict) and data.get("type") == "resync":
                await queue.put({"e": "resync"})

    async def send():
        await send_snapshot()
        while True:
            try:
                event = await asyncio.wait_for(queue.get(), timeout=25)
            except TimeoutError:
                await websocket.send_json({"e": "heartbeat"})
                continue
            if event.get("e") == "resync":
                await send_snapshot()
            else:
                await websocket.send_json(event)

    tasks = [asyncio.create_task(receive()), asyncio.create_task(send())]
    try:
        done, pending = await asyncio.wait(tasks, return_when=asyncio.FIRST_COMPLETED)
        for task in done:
            task.result()
    except (WebSocketDisconnect, RuntimeError, ValueError, asyncio.CancelledError):
        pass
    finally:
        for task in tasks:
            task.cancel()
        with CancelScope(shield=True):
            await asyncio.gather(*tasks, return_exceptions=True)
        agent_service.subscribers[id].discard(queue)
        if not agent_service.subscribers[id]:
            agent_service.subscribers.pop(id)
        # Generation belongs to the Run service, not this observer connection.
