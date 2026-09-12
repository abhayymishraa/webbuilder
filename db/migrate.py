"""Create the initial WebBuilder schema without deleting existing tables or data."""
import asyncio

from sqlalchemy import text

from db.base import Base, engine
import db.models  # Register the application's tables with Base.metadata.


async def migrate():
    try:
        async with engine.begin() as connection:
            await connection.execute(text("SELECT pg_advisory_xact_lock(73142026)"))
            await connection.run_sync(Base.metadata.create_all)
        print("WebBuilder initial schema is ready")
    finally:
        await engine.dispose()


if __name__ == "__main__":
    asyncio.run(migrate())
