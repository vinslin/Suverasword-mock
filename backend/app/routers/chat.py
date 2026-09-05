from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.schemas.chat import ChatHistoryResponse, ChatMessageIn, ChatResponse
from app.services.chat_agent import get_history, run_agent_turn
from app.services.seed import DEMO_COMPANY_ID

router = APIRouter(prefix="/chat", tags=["chat"])


@router.get("/history", response_model=ChatHistoryResponse)
def chat_history(limit: int = 50, db: Session = Depends(get_db)):
    return {"messages": get_history(db, DEMO_COMPANY_ID, limit=limit)}


@router.post("", response_model=ChatResponse)
def post_chat_message(payload: ChatMessageIn, db: Session = Depends(get_db)):
    return run_agent_turn(db, DEMO_COMPANY_ID, payload.text)
