# Project persistence

Implemented locally; the saved-file browser flow has been verified with real
PostgreSQL and MinIO. Not deployed. Live run checkpointing, GCS setup and the
updated E2B template still need verification before production rollout.

## What is saved

PostgreSQL owns users, chats, run summaries, ordered activity events and revision
metadata. Private GCS (production) or MinIO (local) holds compressed source ZIPs
and terminal activity archives. Neither reading a saved file nor downloading a
project starts E2B or calls a model.

The host saves after each completed mutating tool batch and after final
verification. Shell commands count as potentially mutating even when they fail.
Unchanged content reuses the previous revision. A save goes through
`pending → immutable upload → ready + latest pointer + checkpoint event`.
The browser receives `checkpoint_saved` only after that transaction commits.
Upload failures stop the run without overwriting the previous checkpoint or
retrying the model. Pending uploads are reconciled against their exact SHA-256.
A recovered draft never becomes the verified revision automatically.

Cancellation stops execution without waiting for another full snapshot. Only the
last acknowledged checkpoint is guaranteed recoverable; an unfinished mutation
can be lost. A completed but unacknowledged upload may be recovered by maintenance.
Background writers detected during collection make the checkpoint fail rather
than save a mixed snapshot. Arbitrary concurrently running writers are not a
transactional filesystem; generated commands should finish their mutations before
returning.

ZIPs preserve binary bytes, relative paths and deletions. Generated dependencies,
build output, Git metadata and environment files are excluded. Traversal paths,
symlinks, duplicates, conflicting paths and oversized archives are rejected.
Restoration clears template source and uses `npm ci --ignore-scripts` from the
saved lockfile. A missing lockfile stops preview restoration; source downloads
still work. A missing/corrupt archive never falls back to a blank project.

Source persistence does **not** back up a generated application's external
database or files created only at runtime. Preview URLs remain temporary.
Opening a sleeping preview starts E2B compute, without an LLM call or generation
credit. It is not permanent website hosting.

## Local commands

The ignored `.env` has local storage settings and a generated MinIO password.
For a fresh checkout, fill `MINIO_SECRET_KEY` in your private `.env` from the
example. Do not reuse production credentials.

```sh
# Dependencies only: PostgreSQL and MinIO. First run compiles pinned MinIO source.
docker compose up -d --build --wait
```

```sh
# Backend, database migration and idempotent private local bucket creation.
make backend
```

```sh
# Separate terminal: frontend.
make frontend
```

MinIO API: `http://127.0.0.1:9000`; console: `http://127.0.0.1:9001`.
Both services use named volumes. `docker compose down` preserves them;
`docker compose down -v` deletes them. The local bucket initializer refuses remote
endpoints and buckets with an existing policy instead of changing their access.

The MinIO community repository is archived. The development Dockerfile compiles
the final [security-fix release](https://github.com/minio/minio/releases/tag/RELEASE.2025-10-15T17-29-55Z)
instead of pulling the older published binary image. It is a local development
dependency, not the production storage service.

## Production configuration

1. Supply the private GCS bucket name and local service-account JSON path. Keep
   the bucket private with uniform bucket-level access and public access prevention.
   Grant this backend object create/read/delete access only to its bucket.
2. Place the credential on Oracle at `/opt/webbuilder/secrets/gcs.json`, owned by
   UID 10001 and mode 0400. The deployment mounts it read-only and fails if absent.
   Do not add it to an image, repository, frontend environment or E2B template.
3. Set `STORAGE_PROVIDER=gcs`, `STORAGE_BUCKET`, and
   `GOOGLE_APPLICATION_CREDENTIALS=/run/secrets/gcs.json` in private runtime.env.
   Native Google credentials are used; S3 HMAC keys are unnecessary.
4. Rebuild `sandbox/Dockerfile` using the existing README template command. It now
   includes Python for stdlib ZIP handling. Configure the resulting template ID.
   The backend checks archive tools before its first model call. Stored revisions
   retain their original template ID; keep those templates available.
5. Run the approved GCS contract probe and E2B restore check before deploying.
   Those checks have not been run by this implementation task.

The deployment script drains the previous API before migrating event arrays and
starting the new writer. It does not run old and new writers concurrently. This
remains a single API-worker architecture. Rollback keeps revision/event tables;
older application versions cannot serve new object-backed source or detailed
event archives, so prefer a forward fix once new revisions have been created.

## Retention and cost limits

| Resource | Enforced application limit |
| --- | --- |
| Revision | 250 files, 32 MiB expanded, 10 MiB ZIP |
| Source capacity | 200 MiB/project, 1 GiB/user, 5 GiB across this application |
| History | Newest 5 ready revisions plus pinned saved/verified revisions |
| Cleanup grace | Superseded revisions: 1 hour; uncertain pending uploads: 1 day |
| Activity | 200 events plus terminal; strings/output bounded and redacted |
| Compressed log source | At most 1 MiB expanded per run |
| Detail/history | 14-day details, 30-day events; summaries remain |
| Transfers | 2 concurrent SDK operations, 256 MiB upload and 1 GiB download/day |
| Application requests | 1,000 uploads and 10,000 reads/day, shared across users |

Transfer admission is persisted per UTC day, across API restarts. Failed attempts
consume the reservation. SDK-internal retries and conflict reads can add provider
requests beyond these byte reservations; this is **not** a hard provider billing
cap. The application request counters additionally bound tiny-object traffic. GCS
soft-deleted/noncurrent copies, network transfer, other bucket writers, database,
E2B and OpenAI billing remain separate. Do not claim zero cost.

Housekeeping runs in the existing API process, once per minute. It retries
unfinished uploads, archives logs once per terminal run, and performs
reference-aware cleanup. Active runs, pending uploads, latest saved and latest
verified revisions are protected. Expanded diagnostics are pruned only after the
archive has been verified. On storage failure, maintenance leaves records for a
later retry; retained data may exceed the normal retention duration.

`DELETE /projects/{id}` revokes owned API access immediately and queues private
objects and legacy folders for physical deletion after a 24-hour grace period.
Do not directly delete users/chats with SQL: that bypasses the cleanup queue.
No blanket object-age lifecycle rule should target source ZIPs.

## APIs and migration

- `GET /projects/{id}/files`: saved manifest and revision ID.
- `GET /projects/{id}/files/{path}?revision_id=…`: bounded text view; binary/large
  files return metadata. Add `raw=true` to download original bytes.
- `GET /projects/{id}/download?revision_id=…`: exact saved ZIP.
- `GET /projects/{id}/revisions`: retained revision history.
- `POST /projects/{id}/preview`: explicit temporary E2B restore; no model call.
- `GET /chats/{id}/runs?offset=0&limit=10`: paged run summaries/activity.
- `GET /runs/{id}/events?after_sequence=0`: ordered reconnect cursor.
- `GET /runs/{id}/logs`: bounded, redacted JSONL gzip while retained.

All routes require a verified, authenticated owner. Object keys and credentials
never become public URLs. Download responses are private/no-store.

`python -m db.migrate` backfills legacy event arrays with original event IDs.
New code writes rows only; legacy arrays are cleared once their archive is
verified. Archived runs are excluded from future backfills so expired events do
not reappear. Existing `projects/<chat>` v1/v2 snapshots are lazily imported when
that owned project is opened. Originals remain until explicit project deletion.
Previously skipped binary files cannot be recovered from old snapshots.

## Verification status

On 2026-09-13, Playwright through Node MCP exercised the local UI against the real
API, PostgreSQL and MinIO, using a temporary verified fixture account and a legacy
sample project (no mocked API responses). Sign-in, project listing, legacy source
import, text rendering, binary-file messaging and ZIP download succeeded. After
moving the original sample folder away and restarting the backend, the browser
still rendered the source and downloaded a byte-identical ZIP. The ZIP preserved
Unicode text and all 256 byte values in the binary sample.

MinIO's first build failed on network access; a retry succeeded. Local schema
migration and private bucket initialization completed. No OpenAI/E2B requests,
GCS probes, automated test suites, builds of the frontend or type-checks were run.
This browser check does not verify live generation checkpoints, log archive
recovery, preview restoration, failure recovery or production durability.

When approved, run offline archive/runner checks first. Use a separate database
whose name contains `webbuilder_test`, run migrations there, then enable
`RUN_DATABASE_TESTS=1 RUN_PERSISTENCE_TESTS=1` for integration tests. The latter use
fake object transport and real PostgreSQL to exercise upload failure, upload/commit
gaps, stale parents, binary file APIs, ownership and ordered event replay.
`RUN_MINIO_TESTS=1` separately exercises conditional writes against localhost only,
with a unique test key and cleanup. It does not test Google IAM or billing.
