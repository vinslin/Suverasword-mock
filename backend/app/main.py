from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.config import settings
from app.database.base import Base
from app.database.session import engine
from app.routers import ai, chat, companies, company, directors, docgen, documents, health, notifications, registrations

app = FastAPI(title="Company Registration Assistant API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api")
app.include_router(ai.router, prefix="/api")
app.include_router(companies.router, prefix="/api")
app.include_router(company.router, prefix="/api")
app.include_router(registrations.router, prefix="/api")
app.include_router(directors.router, prefix="/api")
app.include_router(documents.router, prefix="/api")
app.include_router(notifications.router, prefix="/api")
app.include_router(docgen.router, prefix="/api")
app.include_router(chat.router, prefix="/api")


def _apply_light_migrations() -> None:
    if settings.database_url.startswith("sqlite"):
        return
    with engine.begin() as conn:
        # Add journey_step column if missing (pre-existing installs)
        conn.execute(
            text("ALTER TABLE companies ADD COLUMN IF NOT EXISTS journey_step INTEGER NOT NULL DEFAULT 3")
        )
        # Drop old FK so chat messages can be stored before a company is created
        conn.execute(
            text("ALTER TABLE chat_messages DROP CONSTRAINT IF EXISTS chat_messages_company_id_fkey")
        )
        for col in ("street", "city", "state", "pincode"):
            conn.execute(
                text(f"ALTER TABLE companies ADD COLUMN IF NOT EXISTS {col} VARCHAR NOT NULL DEFAULT ''")
            )
        # Migrate registrations to composite PK (id, company_id)
        conn.execute(
            text("ALTER TABLE registrations DROP CONSTRAINT IF EXISTS registrations_pkey")
        )
        conn.execute(
            text("ALTER TABLE registrations ADD PRIMARY KEY (id, company_id)")
        )
        conn.execute(
            text("ALTER TABLE companies ADD COLUMN IF NOT EXISTS incorporation_date VARCHAR")
        )


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
    _apply_light_migrations()
