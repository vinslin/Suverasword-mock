"""Tool schemas + implementations exposed to the OpenAI tool-calling loop.

NOTE on `check_company_name_availability`: there is no public real-time MCA
(India's Ministry of Corporate Affairs) name-availability API. This tool is a
documented SIMULATED/HEURISTIC check — it looks at live web search results plus
names already used in our own DB — it is NOT a live MCA/RUN registry lookup.
Swap this out for a real registrar integration if/when one becomes available.
"""

import re
from datetime import date

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.company import Company
from app.models.director import Director
from app.models.registration import STATUS_CYCLE, Registration
from app.services.search_client import web_search

# The standard set of registrations every Indian Pvt Ltd company tracks, with
# detail text that only makes sense pre-registration (no fake CIN/ARN numbers).
# Used both to initialize a brand-new company and to reset stale detail text
# when a genuinely new name is reserved.
DEFAULT_REGISTRATIONS = [
    ("mca", "MCA Incorporation", "Incorporate with the MCA (SPICe+)"),
    ("pan", "PAN", "Apply for company PAN"),
    ("tan", "TAN", "Apply for company TAN"),
    ("gst", "GST Registration", "Register for GST"),
    ("ptax", "Professional Tax", "Register your business"),
    ("epfo", "EPFO Registration", "For employee benefits"),
    ("esic", "ESIC Registration", "For employee benefits"),
    ("shop", "Shop & Establishment", "State registration"),
    ("bank", "Bank Account", "Open current account"),
]
_DEFAULT_DETAIL_BY_ID = {rid: detail for rid, _, detail in DEFAULT_REGISTRATIONS}


def _slugify(text: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", text.strip().lower()).strip("-")
    return slug or "registration"


def build_tool_schemas(db: Session, company_id: int) -> list[dict]:
    """Build tool schemas fresh from live DB state so the model always sees the
    company's actual current registration ids — never a hardcoded list."""
    current = (
        db.query(Registration.id, Registration.name)
        .filter(Registration.company_id == company_id)
        .order_by(Registration.sort_order)
        .all()
    )
    ids_text = ", ".join(f"{rid} ({name})" for rid, name in current) if current else "(none yet)"
    company_row = db.get(Company, company_id)
    current_step = company_row.journey_step if company_row else 3

    return [
        {
            "type": "function",
            "function": {
                "name": "web_search",
                "description": (
                    "Search the live web for facts about Indian private limited company "
                    "incorporation and compliance (MCA/SPICe+, GST, PAN, TAN, DIN, DSC, fees, "
                    "deadlines, industry-specific licenses, etc). Use this for any factual "
                    "question instead of guessing."
                ),
                "parameters": {
                    "type": "object",
                    "properties": {"query": {"type": "string"}},
                    "required": ["query"],
                },
            },
        },
        {
            "type": "function",
            "function": {
                "name": "check_company_name_availability",
                "description": (
                    "Check whether one or more proposed company names appear to be available. "
                    "This is a heuristic check (web search + existing records), not a live "
                    "government registry lookup."
                ),
                "parameters": {
                    "type": "object",
                    "properties": {
                        "names": {"type": "array", "items": {"type": "string"}},
                    },
                    "required": ["names"],
                },
            },
        },
        {
            "type": "function",
            "function": {
                "name": "create_company",
                "description": (
                    "Create the user's company record. Only call this once you've explicitly "
                    "asked for and gotten: the name, the legal structure (Private Limited "
                    "Company / LLP / OPC / Partnership Firm — never assume this), and what the "
                    "business actually does (its industry/activity). Only call this if no "
                    "company exists for this conversation yet (any other tool erroring with 'no "
                    "company' confirms that); if one already exists, use reserve_company_name to "
                    "rename it instead. This also creates the standard registration tracker "
                    "(MCA, PAN, TAN, GST, Professional Tax, EPFO, ESIC, Shop & Establishment, Bank "
                    "Account), all starting at Not Started. registered_office, "
                    "incorporation_state, and the capital fields can still be omitted — those can "
                    "be filled in later — but name, type, and business_activity should be set."
                ),
                "parameters": {
                    "type": "object",
                    "properties": {
                        "name": {"type": "string"},
                        "type": {
                            "type": "string",
                            "description": "e.g. 'Private Limited Company', 'LLP', 'OPC', 'Partnership Firm'",
                        },
                        "business_activity": {
                            "type": "string",
                            "description": "what the business does, e.g. 'Construction and building contracting', 'Manufacturing — textiles', 'IT and software services'",
                        },
                        "registered_office": {"type": "string"},
                        "incorporation_state": {"type": "string"},
                        "authorized_capital": {"type": "integer"},
                        "paid_up_capital": {"type": "integer"},
                    },
                    "required": ["name", "type", "business_activity"],
                },
            },
        },
        {
            "type": "function",
            "function": {
                "name": "update_company_details",
                "description": (
                    "Save details the user gives you about their EXISTING company — business "
                    "activity/industry, legal structure, registered office, incorporation state, "
                    "authorized/paid-up capital. Call this whenever they answer a question about "
                    "one of these (including right after create_company, once they tell you what "
                    "the business actually does) so the answer is actually persisted, not just "
                    "acknowledged in text. Only pass the fields they've actually told you — omit "
                    "the rest."
                ),
                "parameters": {
                    "type": "object",
                    "properties": {
                        "type": {"type": "string"},
                        "business_activity": {"type": "string"},
                        "registered_office": {"type": "string"},
                        "incorporation_state": {"type": "string"},
                        "authorized_capital": {"type": "integer"},
                        "paid_up_capital": {"type": "integer"},
                    },
                },
            },
        },
        {
            "type": "function",
            "function": {
                "name": "reserve_company_name",
                "description": "Reserve a company name for the user's company once they've confirmed it.",
                "parameters": {
                    "type": "object",
                    "properties": {"name": {"type": "string"}},
                    "required": ["name"],
                },
            },
        },
        {
            "type": "function",
            "function": {
                "name": "advance_registration_status",
                "description": (
                    "Advance a registration item's status to the next stage "
                    "(Not Started/Pending -> In Progress -> Completed). "
                    f"registration_id must be one of this company's current registrations: {ids_text}. "
                    "If the registration you need isn't in that list yet, call add_registration_item "
                    "first to create it."
                ),
                "parameters": {
                    "type": "object",
                    "properties": {"registration_id": {"type": "string"}},
                    "required": ["registration_id"],
                },
            },
        },
        {
            "type": "function",
            "function": {
                "name": "add_registration_item",
                "description": (
                    "Add a new registration/compliance item to this company's tracker when its "
                    "actual business needs one that isn't already tracked — e.g. an FSSAI license "
                    "for a food business, an IEC code for import/export, a trademark filing, or any "
                    "other industry-specific registration. Check the current list first (via "
                    "get_registration_snapshot or the advance_registration_status description) and "
                    "don't add a duplicate of something already tracked."
                ),
                "parameters": {
                    "type": "object",
                    "properties": {
                        "name": {
                            "type": "string",
                            "description": "Human-readable name, e.g. 'FSSAI License'",
                        },
                        "detail": {
                            "type": "string",
                            "description": "Short optional note, e.g. 'Required for food businesses'",
                        },
                    },
                    "required": ["name"],
                },
            },
        },
        {
            "type": "function",
            "function": {
                "name": "advance_journey_step",
                "description": (
                    "Move the Registration Journey stepper forward to reflect actual progress "
                    "in this conversation. Steps: 1=Choose Structure & Name, 2=Directors "
                    "Information, 3=Registered Office Details, 4=Documents Upload, 5=Review & "
                    "Sign, 6=MCA Application, 7=Post Incorporation Registrations, 8=Compliance & "
                    f"Next Steps. The company is currently on step {current_step}. This only "
                    "moves forward (never backward) — call it with the step number that matches "
                    "what's just been completed, e.g. call with 4 right after reserving a "
                    "company name, or with 5 once office details and documents are settled."
                ),
                "parameters": {
                    "type": "object",
                    "properties": {"step": {"type": "integer", "minimum": 1, "maximum": 8}},
                    "required": ["step"],
                },
            },
        },
        {
            "type": "function",
            "function": {
                "name": "get_registration_snapshot",
                "description": "Get the current company details and all registration statuses.",
                "parameters": {"type": "object", "properties": {}},
            },
        },
        {
            "type": "function",
            "function": {
                "name": "add_director",
                "description": (
                    "Save a director's information to the company. Call this for each director "
                    "the user provides. At least 2 directors are required for a Private Limited "
                    "Company before Step 2 (Directors Information) can be marked complete."
                ),
                "parameters": {
                    "type": "object",
                    "properties": {
                        "name": {"type": "string", "description": "Full legal name"},
                        "din": {"type": "string", "description": "Director Identification Number (if available)"},
                        "pan": {"type": "string", "description": "PAN card number (if available)"},
                        "role": {
                            "type": "string",
                            "description": "e.g. 'Managing Director', 'Director', 'Whole-time Director'",
                        },
                        "shareholding_pct": {
                            "type": "number",
                            "description": "Ownership percentage (0–100)",
                        },
                        "appointment_date": {"type": "string", "description": "Date of appointment (DD MMM YYYY)"},
                        "email": {"type": "string"},
                        "phone": {"type": "string"},
                    },
                    "required": ["name"],
                },
            },
        },
        {
            "type": "function",
            "function": {
                "name": "get_directors_snapshot",
                "description": "Get the list of all directors currently saved for this company.",
                "parameters": {"type": "object", "properties": {}},
            },
        },
        {
            "type": "function",
            "function": {
                "name": "validate_director_requirements",
                "description": (
                    "Check whether the company has met the minimum director requirements "
                    "(at least 2 directors for a Private Limited Company). Returns whether "
                    "Step 2 can be marked complete."
                ),
                "parameters": {"type": "object", "properties": {}},
            },
        },
    ]


def _company(db: Session, company_id: int) -> Company:
    company = db.get(Company, company_id)
    if company is None:
        raise ValueError(f"No company with id {company_id}")
    return company


def tool_web_search(db: Session, company_id: int, query: str) -> dict:
    return web_search(query)


_GENERIC_NAME_WORDS = {
    "private", "limited", "pvt", "ltd", "llp", "company", "co", "the", "and", "india",
}


def _core_words(name: str) -> set[str]:
    words = set(re.findall(r"[a-z0-9]+", name.lower()))
    return {w for w in words if w not in _GENERIC_NAME_WORDS}


def tool_check_company_name_availability(db: Session, company_id: int, names: list[str]) -> dict:
    taken = {row[0].strip().lower() for row in db.query(Company.name).all()}
    results = []
    for name in names:
        normalized = name.strip().lower()
        if normalized in taken:
            results.append({"name": name, "available": False})
            continue

        search = web_search(f'"{name}" company India registered')
        distinctive = _core_words(name)
        # Only treat it as taken if a real source's own title/url actually contains
        # this name's distinctive words together — not just "a search returned
        # something", which is true for nearly every query.
        looks_taken = bool(distinctive) and any(
            distinctive.issubset(_core_words(f"{s.get('name', '')} {s.get('tag', '')}"))
            for s in search.get("sources", [])
        )
        results.append({"name": name, "available": not looks_taken})
    return {"results": results}


def tool_create_company(
    db: Session,
    company_id: int,
    name: str,
    type: str | None = None,
    business_activity: str | None = None,
    registered_office: str | None = None,
    incorporation_state: str | None = None,
    authorized_capital: int | None = None,
    paid_up_capital: int | None = None,
) -> dict:
    if db.get(Company, company_id) is not None:
        raise ValueError("A company already exists — use reserve_company_name to rename it instead")

    company = Company(
        id=company_id,
        name=name,
        status_tag="Name Reserved",
        type=type or "Private Limited Company",
        registered_office=registered_office or "",
        business_activity=business_activity or "",
        nic_code="",
        authorized_capital=authorized_capital or 0,
        paid_up_capital=paid_up_capital or 0,
        incorporation_state=incorporation_state or "",
        journey_step=1,
    )
    db.add(company)

    for order, (reg_id, reg_name, detail) in enumerate(DEFAULT_REGISTRATIONS):
        db.add(
            Registration(
                id=reg_id,
                company_id=company_id,
                name=reg_name,
                detail=detail,
                status="Not Started",
                date=None,
                sort_order=order,
            )
        )

    db.commit()
    return tool_get_registration_snapshot(db, company_id)


def tool_update_company_details(
    db: Session,
    company_id: int,
    type: str | None = None,
    business_activity: str | None = None,
    registered_office: str | None = None,
    incorporation_state: str | None = None,
    authorized_capital: int | None = None,
    paid_up_capital: int | None = None,
) -> dict:
    company = _company(db, company_id)
    if type is not None:
        company.type = type
    if business_activity is not None:
        company.business_activity = business_activity
    if registered_office is not None:
        company.registered_office = registered_office
    if incorporation_state is not None:
        company.incorporation_state = incorporation_state
    if authorized_capital is not None:
        company.authorized_capital = authorized_capital
    if paid_up_capital is not None:
        company.paid_up_capital = paid_up_capital
    db.commit()
    db.refresh(company)
    return {
        "type": company.type,
        "businessActivity": company.business_activity,
        "registeredOffice": company.registered_office,
        "incorporationState": company.incorporation_state,
        "authorizedCapital": company.authorized_capital,
        "paidUpCapital": company.paid_up_capital,
    }


def tool_reserve_company_name(db: Session, company_id: int, name: str) -> dict:
    company = _company(db, company_id)
    is_new_company = name.strip().lower() != company.name.strip().lower()

    company.name = name
    company.status_tag = "Name Reserved"

    if is_new_company:
        # A genuinely different name means this is a fresh company, not the seeded
        # demo one — nothing has actually been registered yet, so every existing
        # registration row (which may have been mid-progress for the OLD name)
        # resets to a real starting state instead of showing stale completed work.
        company.journey_step = 1
        registrations = db.query(Registration).filter(Registration.company_id == company_id).all()
        for registration in registrations:
            registration.status = "Not Started"
            registration.date = None
            if registration.id in _DEFAULT_DETAIL_BY_ID:
                registration.detail = _DEFAULT_DETAIL_BY_ID[registration.id]

    db.commit()
    db.refresh(company)
    return {"name": company.name, "statusTag": company.status_tag, "journeyStep": company.journey_step}


def tool_advance_registration_status(db: Session, company_id: int, registration_id: str) -> dict:
    registration = db.get(Registration, registration_id)
    if registration is None or registration.company_id != company_id:
        raise ValueError(f"No registration '{registration_id}' for this company")
    next_status = STATUS_CYCLE[registration.status]
    registration.status = next_status
    if next_status == "Completed":
        registration.date = date.today().strftime("%d %b %Y")
    db.commit()
    db.refresh(registration)
    return {
        "id": registration.id,
        "name": registration.name,
        "detail": registration.detail,
        "status": registration.status,
        "date": registration.date,
    }


def tool_add_registration_item(db: Session, company_id: int, name: str, detail: str | None = None) -> dict:
    existing_ids = {
        row[0] for row in db.query(Registration.id).filter(Registration.company_id == company_id).all()
    }
    base_id = _slugify(name)
    candidate = base_id
    suffix = 2
    while candidate in existing_ids:
        candidate = f"{base_id}-{suffix}"
        suffix += 1

    max_order = (
        db.query(func.max(Registration.sort_order))
        .filter(Registration.company_id == company_id)
        .scalar()
        or 0
    )

    registration = Registration(
        id=candidate,
        company_id=company_id,
        name=name,
        detail=detail,
        status="Not Started",
        date=None,
        sort_order=max_order + 1,
    )
    db.add(registration)
    db.commit()
    db.refresh(registration)
    return {
        "id": registration.id,
        "name": registration.name,
        "detail": registration.detail,
        "status": registration.status,
        "date": registration.date,
    }


def tool_advance_journey_step(db: Session, company_id: int, step: int) -> dict:
    company = _company(db, company_id)
    step = max(1, min(8, int(step)))
    company.journey_step = max(company.journey_step, step)
    db.commit()
    db.refresh(company)
    return {"journeyStep": company.journey_step}


def tool_get_registration_snapshot(db: Session, company_id: int) -> dict:
    company = _company(db, company_id)
    registrations = (
        db.query(Registration)
        .filter(Registration.company_id == company_id)
        .order_by(Registration.sort_order)
        .all()
    )
    return {
        "company": {
            "name": company.name,
            "statusTag": company.status_tag,
            "type": company.type,
            "registeredOffice": company.registered_office,
            "businessActivity": company.business_activity,
            "nicCode": company.nic_code,
            "authorizedCapital": company.authorized_capital,
            "paidUpCapital": company.paid_up_capital,
            "incorporationState": company.incorporation_state,
            "journeyStep": company.journey_step,
        },
        "registrations": [
            {
                "id": r.id,
                "name": r.name,
                "detail": r.detail,
                "status": r.status,
                "date": r.date,
            }
            for r in registrations
        ],
    }


def tool_add_director(
    db: Session,
    company_id: int,
    name: str,
    din: str | None = None,
    pan: str | None = None,
    role: str | None = None,
    shareholding_pct: float | None = None,
    appointment_date: str | None = None,
    email: str | None = None,
    phone: str | None = None,
) -> dict:
    _company(db, company_id)  # ensure company exists
    director = Director(
        company_id=company_id,
        name=name,
        din=din,
        pan=pan,
        role=role,
        shareholding_pct=shareholding_pct,
        appointment_date=appointment_date,
        email=email,
        phone=phone,
    )
    db.add(director)
    db.commit()
    db.refresh(director)
    return {
        "id": director.id,
        "name": director.name,
        "din": director.din,
        "pan": director.pan,
        "role": director.role,
        "shareholdingPct": float(director.shareholding_pct) if director.shareholding_pct is not None else None,
        "appointmentDate": director.appointment_date,
        "email": director.email,
        "phone": director.phone,
    }


def tool_get_directors_snapshot(db: Session, company_id: int) -> dict:
    _company(db, company_id)
    directors = db.query(Director).filter(Director.company_id == company_id).order_by(Director.id).all()
    return {
        "directors": [
            {
                "id": d.id,
                "name": d.name,
                "din": d.din,
                "pan": d.pan,
                "role": d.role,
                "shareholdingPct": float(d.shareholding_pct) if d.shareholding_pct is not None else None,
                "appointmentDate": d.appointment_date,
                "email": d.email,
                "phone": d.phone,
            }
            for d in directors
        ],
        "count": len(directors),
    }


def tool_validate_director_requirements(db: Session, company_id: int) -> dict:
    company = _company(db, company_id)
    count = db.query(Director).filter(Director.company_id == company_id).count()
    # Private Limited Company and Public Limited Company require ≥2 directors
    requires_two = company.type in ("Private Limited Company", "Public Limited Company")
    min_required = 2 if requires_two else 1
    met = count >= min_required
    return {
        "directorCount": count,
        "minRequired": min_required,
        "requirementsMet": met,
        "canCompleteStep2": met,
        "message": (
            f"{count} director(s) saved. Minimum {min_required} required for {company.type}. "
            + ("Step 2 can now be marked complete." if met else f"Need {min_required - count} more director(s).")
        ),
    }


TOOL_IMPLEMENTATIONS = {
    "web_search": tool_web_search,
    "check_company_name_availability": tool_check_company_name_availability,
    "create_company": tool_create_company,
    "update_company_details": tool_update_company_details,
    "reserve_company_name": tool_reserve_company_name,
    "advance_registration_status": tool_advance_registration_status,
    "add_registration_item": tool_add_registration_item,
    "advance_journey_step": tool_advance_journey_step,
    "get_registration_snapshot": tool_get_registration_snapshot,
    "add_director": tool_add_director,
    "get_directors_snapshot": tool_get_directors_snapshot,
    "validate_director_requirements": tool_validate_director_requirements,
}
