from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.company import Company
from app.models.director import Director
from app.services.openai_client import chat_completion

router = APIRouter(prefix="/companies/{company_id}/generate-document", tags=["docgen"])

VALID_DOC_TYPES = {"moa", "aoa", "spice_summary"}


class GenerateRequest(BaseModel):
    doc_type: str


def _fmt_capital(amount: int) -> str:
    if amount >= 10_000_000:
        return f"Rs. {amount // 10_000_000} Crore ({amount:,})"
    if amount >= 100_000:
        return f"Rs. {amount // 100_000} Lakh ({amount:,})"
    return f"Rs. {amount:,}"


def _build_moa_prompt(company: Company, directors: list) -> str:
    address = ", ".join(
        p for p in [company.street, company.city, company.state, company.pincode] if p
    ) or company.registered_office or "Address not provided"

    director_lines = "\n".join(
        f"  {i+1}. {d.name}"
        + (f", DIN: {d.din}" if d.din else "")
        + (f", PAN: {d.pan}" if d.pan else "")
        + (f", Role: {d.role}" if d.role else "")
        for i, d in enumerate(directors)
    ) or "  No directors added yet"

    return f"""Generate a formal Memorandum of Association (MOA) for the following Indian company.
Use proper Indian company law language (Companies Act, 2013). Structure it with numbered clauses.
Output plain text only — no markdown, no **bold**, no *italic*, no # headers, just clean legal document text.

COMPANY DETAILS:
- Company Name: {company.name or "Not set"}
- Company Type: {company.type or "Private Limited Company"}
- State of Incorporation: {company.state or company.incorporation_state or "Not set"}
- Registered Office Address: {address}
- Main Business Activity / Objects: {company.business_activity or "Not specified"}
- NIC Code: {company.nic_code or "Not specified"}
- Authorized Capital: {_fmt_capital(company.authorized_capital) if company.authorized_capital else "Not set"}
- Paid-up Capital: {_fmt_capital(company.paid_up_capital) if company.paid_up_capital else "Not set"}

SUBSCRIBERS / DIRECTORS:
{director_lines}

Include these five clauses:
I.   Name Clause
II.  Registered Office Clause (state only, not full address)
III. Objects Clause — Main Objects and Ancillary Objects based on the business activity above
IV.  Liability Clause — Limited liability of members
V.   Capital Clause — Authorized share capital details

End with a Subscription Sheet listing each subscriber (director), their address, number of shares subscribed, and signature line."""


def _build_aoa_prompt(company: Company, directors: list) -> str:
    director_lines = "\n".join(
        f"  {i+1}. {d.name}"
        + (f" — {d.role}" if d.role else "")
        + (f", {d.shareholding_pct}% shareholding" if d.shareholding_pct else "")
        for i, d in enumerate(directors)
    ) or "  No directors added yet"

    table_ref = "Table F" if "private" in (company.type or "").lower() else "Table A"

    return f"""Generate a formal Articles of Association (AOA) for the following Indian company.
Base it on {table_ref} of the Companies Act, 2013. Use proper legal language.
Output plain text only — no markdown, no **bold**, no *italic*, no # headers, just clean legal document text.

COMPANY DETAILS:
- Company Name: {company.name or "Not set"}
- Company Type: {company.type or "Private Limited Company"}

DIRECTORS:
{director_lines}

Include articles covering:
1. Interpretation (key defined terms)
2. Share Capital and Variation of Rights
3. Calls on Shares
4. Transfer and Transmission of Shares (include restriction on transfer for Pvt Ltd)
5. Forfeiture of Shares
6. Conversion of Shares into Stock
7. Share Warrants
8. Alteration of Capital
9. General Meetings
10. Proceedings at General Meetings
11. Votes of Members
12. The Board of Directors (appointment, powers, number — reference the directors above)
13. Proceedings of the Board
14. Managing Director / CEO
15. Dividends and Reserve
16. Accounts
17. Winding Up
18. Indemnity"""


def _build_spice_prompt(company: Company, directors: list) -> str:
    address = ", ".join(
        p for p in [company.street, company.city, company.state, company.pincode] if p
    ) or "Not provided"

    director_lines = "\n".join(
        f"  {i+1}. {d.name}"
        + (f" | DIN: {d.din}" if d.din else " | DIN: Pending")
        + (f" | PAN: {d.pan}" if d.pan else " | PAN: Pending")
        + (f" | Role: {d.role}" if d.role else "")
        + (f" | Email: {d.email}" if d.email else "")
        for i, d in enumerate(directors)
    ) or "  No directors added yet"

    return f"""Generate a clear, human-readable SPICe+ Form Summary for director review before signing.
This is NOT a legal document — it is a plain-English checklist and summary so directors can verify
all details before applying digital signatures. Use simple language. Use sections with headings.
Output plain text only. Section headings in ALL CAPS. Do NOT use markdown — no **bold**, no *italic*,
no bullet dashes with asterisks, no backticks. Use plain dashes (-) for lists and UPPERCASE for emphasis.

COMPANY INFORMATION:
- Name: {company.name or "Not set"}
- Type: {company.type or "Not set"}
- Business Activity: {company.business_activity or "Not set"}
- NIC Code: {company.nic_code or "Not set"}
- Registered Address: {address}
- Authorized Capital: {_fmt_capital(company.authorized_capital) if company.authorized_capital else "Not set"}
- Paid-up Capital: {_fmt_capital(company.paid_up_capital) if company.paid_up_capital else "Not set"}
- Incorporation State: {company.state or company.incorporation_state or "Not set"}

DIRECTORS ({len(directors)} total):
{director_lines}

Generate a summary with these sections:
1. COMPANY OVERVIEW — what is being incorporated and why
2. REGISTERED OFFICE — the address and what it means legally
3. SHARE CAPITAL STRUCTURE — authorized vs paid-up, meaning for the directors
4. DIRECTORS & THEIR ROLES — who they are and their responsibilities
5. WHAT HAPPENS NEXT — step-by-step after signing: MCA portal submission, CIN issuance, PAN/TAN application
6. CHECKLIST BEFORE SIGNING — list of things each director must verify is correct
7. IMPORTANT NOTES — liability, compliance obligations starting from Day 1"""


@router.post("")
def generate_document(
    company_id: int,
    body: GenerateRequest,
    db: Session = Depends(get_db),
):
    if body.doc_type not in VALID_DOC_TYPES:
        raise HTTPException(status_code=400, detail=f"doc_type must be one of {VALID_DOC_TYPES}")

    company = db.get(Company, company_id)
    if company is None:
        raise HTTPException(status_code=404, detail="Company not found")

    directors = db.query(Director).filter(Director.company_id == company_id).all()

    if body.doc_type == "moa":
        user_prompt = _build_moa_prompt(company, directors)
        system_msg = (
            "You are a senior Indian corporate lawyer drafting statutory documents under the "
            "Companies Act, 2013. Generate accurate, complete legal drafts. "
            "Never add disclaimers inside the document text itself."
        )
    elif body.doc_type == "aoa":
        user_prompt = _build_aoa_prompt(company, directors)
        system_msg = (
            "You are a senior Indian corporate lawyer drafting Articles of Association under the "
            "Companies Act, 2013. Generate complete, well-structured articles. "
            "Never add disclaimers inside the document text itself."
        )
    else:
        user_prompt = _build_spice_prompt(company, directors)
        system_msg = (
            "You are a company secretary helping directors understand their SPICe+ application "
            "before signing. Write in clear, plain English. Be thorough and reassuring."
        )

    messages = [
        {"role": "system", "content": system_msg},
        {"role": "user", "content": user_prompt},
    ]

    try:
        response = chat_completion(messages)
        content = response.choices[0].message.content or ""
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"AI generation failed: {exc}") from exc

    return {"doc_type": body.doc_type, "content": content}
