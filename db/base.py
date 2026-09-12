from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.engine import make_url
from typing import AsyncGenerator
import os
import ssl

DATABASE_URL = os.getenv(
    "DATABASE_URL", "postgresql://user:password@localhost/webbuilder"
)

database_url = make_url(DATABASE_URL).set(drivername="postgresql+psycopg")
connect_args = {
    "prepare_threshold": None,
    "connect_timeout": 10,
    "application_name": "webbuilder",
}
if database_url.query.get("sslmode") in {"require", "verify-ca", "verify-full"}:
    # Preserve libpq's channel_binding setting and verify the server certificate.
    connect_args["sslmode"] = "verify-full"
    connect_args["sslrootcert"] = ssl.get_default_verify_paths().cafile

engine = create_async_engine(
    database_url,
    echo=False,
    future=True,
    pool_pre_ping=True,  # Test connections before using them
    pool_size=2,
    max_overflow=2,
    pool_timeout=5,
    pool_recycle=3600,  # Recycle connections after 1 hour
    connect_args=connect_args,
)


# async_sessionmaker() creates a factory for new async sessions.
# Every time you call AsyncSessionLocal(), you get a new independent database session.
# class_=AsyncSession → ensures it returns async sessions (not sync ones).
# expire_on_commit=False → means objects remain “usable” even after commit.
# If it were True, SQLAlchemy would clear object state after a commit.

AsyncSessionLocal = async_sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    # Creates a database session.
    async with AsyncSessionLocal() as session:
        try:
            # “Pauses” the function and hands out the session object to whoever called get_db().
            yield session
            # When the route finishes using the session, Python returns control back to get_db() — continuing after the yield line.
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
