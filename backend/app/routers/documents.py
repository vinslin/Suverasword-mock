import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.company import Company
from app.models.document import Document
from app.schemas.document import DocumentOut

DOCS_STEP4_REQUIRED = {"pan_card", "aadhaar", "address_proof", "noc"}


def _sync_docs_journey_step(company_id: int, db: Session) -> None:
    company = db.get(Company, company_id)
    if company is None:
        return
    uploaded = {
        d.doc_type
        for d in db.query(Document.doc_type).filter(Document.company_id == company_id).all()
        if d.doc_type
    }
    if DOCS_STEP4_REQUIRED.issubset(uploaded):
        company.journey_step = max(company.journey_step, 5)
        db.commit()

UPLOADS_ROOT = Path(__file__).resolve().parents[3] / "uploads"

router = APIRouter(prefix="/companies/{company_id}/documents", tags=["documents"])


def _company_dir(company_id: int) -> Path:
    d = UPLOADS_ROOT / str(company_id)
    d.mkdir(parents=True, exist_ok=True)
    return d


@router.post("/upload", response_model=DocumentOut)
async def upload_document(
    company_id: int,
    file: UploadFile = File(...),
    doc_type: str | None = Form(default=None),
    linked_to: str | None = Form(default=None),
    director_id: int | None = Form(default=None),
    db: Session = Depends(get_db),
):
    suffix = Path(file.filename or "file").suffix
    stored_name = f"{uuid.uuid4().hex}{suffix}"
    dest = _company_dir(company_id) / stored_name

    content = await file.read()
    dest.write_bytes(content)

    doc = Document(
        company_id=company_id,
        director_id=director_id,
        filename=stored_name,
        original_name=file.filename or stored_name,
        file_path=str(dest),
        doc_type=doc_type,
        linked_to=linked_to,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    _sync_docs_journey_step(company_id, db)
    return doc


@router.get("", response_model=list[DocumentOut])
def list_documents(company_id: int, db: Session = Depends(get_db)):
    return (
        db.query(Document)
        .filter(Document.company_id == company_id)
        .order_by(Document.uploaded_at.desc())
        .all()
    )


@router.get("/{document_id}/download")
def download_document(company_id: int, document_id: int, db: Session = Depends(get_db)):
    doc = db.get(Document, document_id)
    if doc is None or doc.company_id != company_id:
        raise HTTPException(status_code=404, detail="Document not found")
    path = Path(doc.file_path)
    if not path.exists():
        raise HTTPException(status_code=404, detail="File missing from disk")
    return FileResponse(path=str(path), filename=doc.original_name)


@router.delete("/{document_id}")
def delete_document(company_id: int, document_id: int, db: Session = Depends(get_db)):
    doc = db.get(Document, document_id)
    if doc is None or doc.company_id != company_id:
        raise HTTPException(status_code=404, detail="Document not found")
    path = Path(doc.file_path)
    if path.exists():
        path.unlink()
    db.delete(doc)
    db.commit()
    return {"deleted": document_id}
