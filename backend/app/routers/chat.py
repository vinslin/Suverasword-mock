from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.schemas.chat import ChatHistoryResponse, ChatMessageIn, ChatResponse
from app.services.chat_agent import get_history, run_agent_turn

router = APIRouter(prefix="/companies/{company_id}/chat", tags=["chat"])


@router.get("/history", response_model=ChatHistoryResponse)
def chat_history(company_id: int, limit: int = 50, db: Session = Depends(get_db)):
    return {"messages": get_history(db, company_id, limit=limit)}


@router.post("", response_model=ChatResponse)
def post_chat_message(company_id: int, payload: ChatMessageIn, db: Session = Depends(get_db)):
    return run_agent_turn(db, company_id, payload.text)
