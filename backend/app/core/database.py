from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.pool import NullPool

from app.core.config import settings

# NullPool: her istek icin taze baglanti acilir, havuzlanmis baglanti
# tekrar kullanilmaz. Bu kucuk projede performans maliyeti onemsiz;
# karsiliginda TestClient gibi ayri thread/event loop kullanan
# istemcilerle yasanan "another operation is in progress" hatasi engellenir.
engine = create_async_engine(settings.database_url, poolclass=NullPool)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
