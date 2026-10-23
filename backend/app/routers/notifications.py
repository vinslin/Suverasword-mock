from datetime import date, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.company import Company
from app.models.director import Director
from app.models.document import Document
from app.models.registration import Registration

router = APIRouter(prefix="/companies/{company_id}/notifications", tags=["notifications"])

# ── Compliance deadline definitions ──────────────────────────────────────
# month is 1-indexed; year1_exempt = True means skip in the company's first FY

BASE_DEADLINES = [
    {"name": "POSH Annual Report",          "month": 1,  "day": 31, "urgency": "medium"},
    {"name": "TDS Return (26Q) — Q3",       "month": 1,  "day": 31, "urgency": "high"},
    {"name": "Advance Tax — Instalment 4",  "month": 3,  "day": 15, "urgency": "low"},
    {"name": "TDS Return (26Q) — Q4",       "month": 5,  "day": 31, "urgency": "high"},
    {"name": "Annual General Meeting (AGM)","month": 9,  "day": 30, "urgency": "medium"},
    {"name": "Director KYC (DIR-3 KYC)",    "month": 9,  "day": 30, "urgency": "medium"},
    {"name": "Financial Statements (AOC-4)","month": 10, "day": 29, "urgency": "high",   "year1_exempt": True},
    {"name": "Income Tax Return (ITR-6)",   "month": 10, "day": 31, "urgency": "high"},
    {"name": "Annual Return (MGT-7)",       "month": 11, "day": 29, "urgency": "high",   "year1_exempt": True},
    {"name": "GST Annual Return (GSTR-9)", "month": 12, "day": 31, "urgency": "medium", "year1_exempt": True},
]

WINDOW_DAYS = 45  # alert window
MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]


def _fmt_date(d: date) -> str:
    return f"{d.day} {MONTHS[d.month - 1]} {d.year}"


def _next_occurrence(month: int, day: int, today: date) -> date:
    candidate = date(today.year, month, day)
    if candidate < today:
        candidate = date(today.year + 1, month, day)
    return candidate


def _is_first_fy(inc_date_str: str | None, today: date) -> bool:
    if not inc_date_str:
        return False
    try:
        inc = date.fromisoformat(inc_date_str)
    except ValueError:
        return False
    fy_start = date(today.year, 4, 1) if today.month >= 4 else date(today.year - 1, 4, 1)
    return inc >= fy_start


def _build_notifications(
    company: Company,
    directors: list,
    doc_types: set,
    registrations: list,
    today: date,
) -> list[dict]:
    notifs = []
    first_fy = _is_first_fy(company.incorporation_date, today)

    # 1. Compliance deadlines — only relevant after incorporation (step 6+)
    for d in BASE_DEADLINES:
        if company.journey_step < 6:
            continue
        if d.get("year1_exempt") and first_fy:
            continue
        due = _next_occurrence(d["month"], d["day"], today)
        days_left = (due - today).days
        if days_left > WINDOW_DAYS:
            continue
        date_str = _fmt_date(due)

        if days_left < 0:
            notif_type = "critical"
            body = f"Was due on {date_str}. File immediately to avoid penalties."
            title = f"Overdue: {d['name']}"
        elif days_left == 0:
            notif_type = "critical"
            body = "Due today — file now to avoid late fees."
            title = f"Due Today: {d['name']}"
        elif days_left <= 7:
            notif_type = "warning"
            body = f"Due in {days_left} day{'s' if days_left != 1 else ''} ({date_str})."
            title = d["name"]
        else:
            notif_type = "info"
            body = f"Due in {days_left} days ({date_str})."
            title = d["name"]

        notifs.append({
            "id": f"deadline_{d['name'].lower().replace(' ', '_')}",
            "title": title,
            "body": body,
            "time": date_str,
            "type": notif_type,
            "category": "compliance",
        })

    # 2. Directors with no DIN
    no_din = [d for d in directors if not d.din]
    if no_din:
        names = ", ".join(d.name for d in no_din)
        notifs.append({
            "id": "din_missing",
            "title": f"DIN Missing — {len(no_din)} director{'s' if len(no_din) > 1 else ''}",
            "body": f"{names} {'have' if len(no_din) > 1 else 'has'} no DIN on file. Required before MCA filing.",
            "time": "Action needed",
            "type": "warning",
            "category": "directors",
        })

    # 3. Missing key documents (relevant from step 3 onward)
    if company.journey_step >= 3:
        missing_docs = []
        if "pan_card"     not in doc_types: missing_docs.append("PAN card of directors")
        if "aadhaar"      not in doc_types: missing_docs.append("Aadhaar of directors")
        if "address_proof"not in doc_types: missing_docs.append("Address proof document")
        if "noc"          not in doc_types: missing_docs.append("NOC / rent agreement")
        if missing_docs:
            notifs.append({
                "id": "docs_missing",
                "title": f"{len(missing_docs)} Document{'s' if len(missing_docs) > 1 else ''} Required",
                "body": f"Upload: {', '.join(missing_docs)}.",
                "time": "Pending upload",
                "type": "warning",
                "category": "documents",
            })

    # 4. Fewer than 2 directors when past step 1
    if company.journey_step >= 2 and len(directors) < 2:
        notifs.append({
            "id": "directors_count",
            "title": "Minimum Directors Not Met",
            "body": f"You have {len(directors)} director{'s' if len(directors) != 1 else ''}. A minimum of 2 is required.",
            "time": "Blocking",
            "type": "critical",
            "category": "directors",
        })

    # 5. Registrations stuck In Progress
    in_progress = [r for r in registrations if r.status == "In Progress"]
    if in_progress:
        names = ", ".join(r.name for r in in_progress)
        notifs.append({
            "id": "regs_in_progress",
            "title": f"{len(in_progress)} Registration{'s' if len(in_progress) > 1 else ''} In Progress",
            "body": f"{names} {'are' if len(in_progress) > 1 else 'is'} still in progress.",
            "time": "In progress",
            "type": "info",
            "category": "registrations",
        })

    # 6. Journey step reminder (steps 2–7)
    step_hints = {
        2: "Add at least 2 directors with DIN & PAN to proceed to Step 3.",
        3: "Provide your registered office address to proceed to Step 4.",
        4: "Upload all required documents (Aadhaar, address proof, NOC) for Step 5.",
        5: "Review the SPICe+ form and have all directors sign with DSC.",
        6: "Submit your SPICe+ application on the MCA portal.",
        7: "Complete post-incorporation registrations (GST, PAN, TAN, etc.).",
    }
    hint = step_hints.get(company.journey_step)
    if hint:
        notifs.append({
            "id": f"step_{company.journey_step}",
            "title": f"Step {company.journey_step} — Action Required",
            "body": hint,
            "time": f"Step {company.journey_step} of 8",
            "type": "info",
            "category": "journey",
        })

    return notifs


@router.get("")
def get_notifications(company_id: int, db: Session = Depends(get_db)):
    company = db.get(Company, company_id)
    if company is None:
        return []

    directors = db.query(Director).filter(Director.company_id == company_id).all()
    doc_types = {
        d.doc_type
        for d in db.query(Document.doc_type).filter(Document.company_id == company_id).all()
        if d.doc_type
    }
    registrations = db.query(Registration).filter(Registration.company_id == company_id).all()

    return _build_notifications(company, directors, doc_types, registrations, date.today())
