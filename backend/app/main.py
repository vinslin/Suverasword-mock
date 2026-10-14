from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.config import settings
from app.database.base import Base
from app.database.session import engine
from app.routers import chat, company, directors, health, registrations

app = FastAPI(title="Company Registration Assistant API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api")
app.include_router(company.router, prefix="/api")
app.include_router(registrations.router, prefix="/api")
app.include_router(directors.router, prefix="/api")
app.include_router(chat.router, prefix="/api")


def _apply_light_migrations() -> None:
    """No Alembic for this project yet — just enough to add a column that a
    prior deploy's create_all() already missed on an existing table."""
    if settings.database_url.startswith("sqlite"):
        return
    with engine.begin() as conn:
        conn.execute(
            text("ALTER TABLE companies ADD COLUMN IF NOT EXISTS journey_step INTEGER NOT NULL DEFAULT 3")
        )
        # chat_messages.company_id used to be a hard FK to companies.id, which made
        # it impossible to save the first onboarding message before a company exists.
        conn.execute(
            text("ALTER TABLE chat_messages DROP CONSTRAINT IF EXISTS chat_messages_company_id_fkey")
        )


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
    _apply_light_migrations()
