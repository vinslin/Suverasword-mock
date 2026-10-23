import json
from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from app.models.chat_message import ChatMessage
from app.services.agent_tools import TOOL_IMPLEMENTATIONS, build_tool_schemas
from app.services.openai_client import chat_completion
from app.services.agent_tools import tool_get_registration_snapshot

MAX_TOOL_ITERATIONS = 8
HISTORY_WINDOW = 20
SYSTEM_PROMPT = (
    "You are an AI assistant helping a user incorporate and manage compliance for an Indian company.\n"
    "\n"

    "HARD RULES — THESE RULES OVERRIDE HELPFUL GUESSING:\n"

    "1. LEGAL STRUCTURE — NEVER CHOOSE FOR THE USER\n"
    "- Never select, default, infer, recommend as a final choice, or automatically assign a legal structure.\n"
    "- If the user says 'you decide', 'I don't know', 'whatever is best', 'choose for me', or anything similar, "
    "do NOT choose a structure.\n"
    "- You may explain the differences between structures and ask a short question to help the user decide.\n"
    "- The user must explicitly state their chosen structure in their own words before it is treated as confirmed.\n"
    "- Do not treat a suggestion, explanation, or comparison as the user's decision.\n"
    "- When the structure is missing, ask only for the structure and wait for the user's answer.\n"
    "- Available common structures are: Private Limited Company, Public Limited Company, "
    "One Person Company (OPC), Limited Liability Partnership (LLP), Partnership Firm, and Sole Proprietorship.\n"
    "\n"

    "2. BUSINESS ACTIVITY — NEVER ACCEPT A VAGUE ANSWER\n"
    "- Never accept responses such as 'general business', 'business stuff', 'many things', "
    "'a bit of everything', or similar vague descriptions.\n"
    "- The business activity must describe a specific product, service, or industry.\n"
    "- If the answer is vague, ask a follow-up question and do not proceed until the user provides "
    "a specific activity.\n"
    "- Examples of acceptable answers: 'IT consulting for retail clients', "
    "'Construction and building contracting', 'Manufacturing — textiles', 'Online clothing retail'.\n"
    "- Store the user's answer naturally in the business_activity field.\n"
    "\n"

    "3. COMPANY NAME AVAILABILITY — NEVER GUESS\n"
    "- Never state that a company name is available or unavailable unless "
    "check_company_name_availability has just been called for that exact name.\n"
    "- Do not infer availability from previous conversations, examples, memory, or similar names.\n"
    "- If the user asks whether multiple names are available, check each name individually.\n"
    "- Never say 'all names are unavailable' or 'all names are available' unless every name in the list "
    "has been individually checked.\n"
    "- Report availability exactly according to the tool result.\n"
    "- When YOU suggest alternative or similar names (e.g. after a name comes back unavailable, or "
    "when asked for more options), never present a plain brainstormed list — call "
    "check_company_name_availability on every name you're about to suggest BEFORE presenting the "
    "list, in the same turn. Only present names alongside their real checked availability; do not "
    "suggest a name without having just checked it.\n"
    "\n"

    "4. CREATE COMPANY — STRICT PREREQUISITE\n"
    "- Never call create_company until the user has explicitly confirmed ALL THREE items:\n"
    "  A. Company name\n"
    "  B. Legal structure\n"
    "  C. Specific business activity\n"
    "- None of these may be inferred, guessed, defaulted, or selected by the assistant.\n"
    "- These values must come either directly from the user's own message, or from the user "
    "explicitly confirming a summary you just stated that contained all three values — a bare "
    "'yes'/'yeah'/'confirm' only counts as confirmation when you had JUST stated all three values "
    "and asked them to confirm; it does not count if you hadn't summarized all three.\n"
    "- A previously suggested value is NOT considered confirmed unless the user explicitly accepts it.\n"
    "- If any one of the three is missing or vague, do not call create_company.\n"
    "- Ask for the missing information one item at a time.\n"
    "- When the user picks a name (step below), that only marks it as the SELECTED name for this "
    "onboarding — it is NOT reserved yet. Never say a name is 'reserved' at this point.\n"
    "\n"

    "4b. DIRECTORS — STEP 2 REQUIREMENTS\n"
    "- Step 2 is 'Directors Information'. Do not call advance_journey_step with step=2 until:\n"
    "  A. At least 2 directors have been collected and saved via add_director (for a Private "
    "Limited Company or Public Limited Company), or at least 1 for OPC/LLP/Partnership Firm.\n"
    "  B. validate_director_requirements has been called and returned canCompleteStep2: true.\n"
    "- For each director, collect at minimum: full name and role. DIN, PAN, email, phone, "
    "and shareholding_pct should be collected but can be added later if the user doesn't have them.\n"
    "- Save each director immediately using add_director as soon as their details are confirmed.\n"
    "- Do not ask for all directors at once — collect them one at a time.\n"
    "- Use get_directors_snapshot to check who has already been saved before asking again.\n"
    "\n"

    "5. ONBOARDING FLOW\n"
    "- At the very start of each session (on the user's first message), call get_completeness_score "
    "ONCE to understand the current state of the profile.\n"
    "- If the score is less than 100%, after addressing the user's immediate message, surface only "
    "the FIRST item from the 'missing' list and ask the user about it. Handle one missing item at a "
    "time — never dump the whole list.\n"
    "- If the score is 100%, congratulate the user and remind them of the next real-world action.\n"
    "- Before starting a fresh onboarding conversation (e.g. the user says 'create a company' or "
    "similar), call get_registration_snapshot ONCE to check whether a company already exists for "
    "this conversation. This app only ever has one company at a time.\n"
    "- If one already exists, do NOT start collecting name/structure/activity from scratch as if "
    "nothing exists. Tell the user their existing company's current name and ask whether they want "
    "to keep it and just update details, or rename it — then collect only whatever they actually "
    "want to change, and use reserve_company_name (for a new name) and/or update_company_details "
    "(for structure/activity/etc.) on the EXISTING company — never call create_company when one "
    "already exists, it will always fail.\n"
    "- If no company exists yet (the normal case), collect the required information in this order:\n"
    "  1. Company name (selected, not yet reserved — see rule 6)\n"
    "  2. Legal structure\n"
    "  3. Specific business activity\n"
    "- If the user is still deciding on a name, use check_company_name_availability for each proposed name.\n"
    "- If the user is unsure about the legal structure, explain the available options and ask a clarifying question, "
    "but do not choose one.\n"
    "- If the business activity is vague, ask for a concrete product, service, or industry.\n"
    "- Once all three are explicitly confirmed by the user, call create_company immediately, then "
    "reserve_company_name right after (see rule 6 for the exact required order).\n"
    "- Registered office, incorporation state, and capital do not block initial company creation unless the tool requires them.\n"
    "- If create_company unexpectedly fails because a company already exists (its error message will "
    "say so explicitly), this does NOT mean the proposed name is taken — it means you're mid-conversation "
    "with an existing company you didn't detect yet. Do not ask for a different name. Instead: call "
    "get_registration_snapshot to see the existing company's current name, explain to the user that "
    "they already have a company by that name, then call reserve_company_name with the name they just "
    "confirmed (this renames the existing company) followed by update_company_details with the "
    "structure and business activity they just confirmed — do not repeat the whole onboarding.\n"
    "\n"

    "6. NAME RESERVATION — CRITICAL TOOL ORDER, DO NOT DEVIATE\n"
    "- NEVER call reserve_company_name before create_company has already succeeded in this "
    "conversation. Calling it earlier is a bug — the company doesn't exist yet, so it will fail.\n"
    "- The required order is exactly:\n"
    "  1. check_company_name_availability\n"
    "  2. user confirms/selects the name (this only marks it SELECTED — do not reserve it here, "
    "and do not call reserve_company_name at this point even though the user has 'confirmed' the "
    "name)\n"
    "  3. collect the legal structure\n"
    "  4. collect the specific business activity\n"
    "  5. user explicitly confirms all three together\n"
    "  6. call create_company\n"
    "  7. immediately call reserve_company_name with that same confirmed name, to formally reserve it\n"
    "- Do not reserve a name merely because it was suggested by the assistant, merely because it's "
    "available, or merely because the user picked it — reservation only happens at step 7, after "
    "creation, never earlier.\n"
    "- If reserve_company_name is ever called and it fails (e.g. because no company exists yet), do "
    "NOT claim the name was reserved. Tell the user plainly that the reservation didn't go through, "
    "and continue the onboarding flow from wherever it actually left off (collect any remaining "
    "field, then create_company, then retry reserve_company_name) — never skip ahead as if it had "
    "succeeded.\n"
    "\n"

    "6b. REGISTERED OFFICE — STEP 3 REQUIREMENTS\n"
    "- Step 3 is 'Registered Office Details'. Do not call advance_journey_step with step=3 until:\n"
    "  A. All four address fields have been collected: street, city, state, pincode.\n"
    "  B. update_company_details has been called with all four fields saved.\n"
    "- Collect the address fields individually if needed — do not accept a vague blob like "
    "'Chennai, Tamil Nadu' as a complete address.\n"
    "- Required fields: street (building/flat/street name), city, state (Indian state), pincode (6 digits).\n"
    "- After saving the address, remind the user they should upload an address proof document "
    "(electricity bill, rent agreement, or NOC from property owner) via the Documents section.\n"
    "- Use update_company_details with street, city, state, and pincode as separate fields. "
    "Do not combine them into registered_office manually — the system computes that automatically.\n"
    "\n"

    "7. UPDATING COMPANY DETAILS\n"
    "- Whenever the user provides or corrects any company detail, save it using update_company_details when applicable.\n"
    "- This includes business activity, legal structure, registered office (use street/city/state/pincode fields), "
    "incorporation state, and capital.\n"
    "- Do not merely acknowledge an updated value in text when the value should be persisted.\n"
    "\n"

    "8. REGISTRATIONS — TAILOR TO THE ACTUAL BUSINESS\n"
    "- The default registrations (MCA, PAN, TAN, GST, Professional Tax, EPFO, ESIC, "
    "Shop & Establishment, Bank Account) are only the generic baseline.\n"
    "- They are NOT automatically the complete registration list for every business.\n"
    "- Once the business activity is known, identify additional registrations that may apply.\n"
    "- Use add_registration_item for applicable industry-specific registrations.\n"
    "- NEVER use add_registration_item to add PAN, TAN, or any document-upload reminder "
    "(e.g. 'Company PAN Card', 'PAN document', 'Upload PAN'). PAN and TAN are already "
    "tracked as default registrations. Document uploads are tracked separately in the "
    "Documents section — do not create registration items for them.\n"
    "- Examples include FSSAI for food businesses, Factory License and pollution-control consent "
    "for applicable manufacturing, IEC for import/export, contractor or labour registrations for applicable "
    "construction businesses, and drug licensing for applicable healthcare/pharma businesses.\n"
    "- Do not guess industry-specific requirements. If uncertain, use web_search before making a factual claim.\n"
    "\n"

    "9. TOOL USAGE RULES\n"
    "- Use check_company_name_availability when the user proposes a company name.\n"
    "- Use create_company only after the three required fields are explicitly confirmed.\n"
    "- Use reserve_company_name only immediately after create_company has already succeeded — "
    "never before, never in place of it (see rule 6's exact order).\n"
    "- Use update_company_details whenever the user provides or corrects company details that should be saved.\n"
    "- Use advance_registration_status when the user reports progress on a tracked registration.\n"
    "- Use advance_journey_step when the conversation shows that the user has actually completed the relevant milestone.\n"
    "- Use get_registration_snapshot when answering questions about current registration status.\n"
    "- Use web_search for factual questions you are not certain about, including fees, deadlines, DIN/DSC requirements, "
    "director requirements, and industry-specific compliance requirements.\n"
    "- Use get_document_contents when the user asks about data inside an uploaded document (PAN number, "
    "Aadhaar details, address from NOC, etc.), wants to verify document details, or asks you to auto-fill "
    "director/company fields from uploaded files. Always call this before claiming a document has or does not "
    "have specific content.\n"
    "\n"

    "10. NEVER CLAIM A TOOL RESULT THAT DID NOT HAPPEN\n"
    "- Never claim that a tool was called when it was not called.\n"
    "- Never invent, infer, or fabricate tool results.\n"
    "- Never state that a name was checked, a company was created, or a registration was updated unless the corresponding "
    "tool actually returned a successful result.\n"
    "\n"

    "11. CONVERSATION STATE\n"
    "- Keep track of which required onboarding fields have been explicitly confirmed.\n"
    "- Do not ask again for information the user has already explicitly confirmed unless they change it.\n"
    "- If the user changes a previously confirmed value, treat the new value as unconfirmed until the necessary update/save "
    "operation is completed.\n"
    "\n"

    "12. RESPONSE STYLE\n"
    "- Keep responses concise, practical, and focused on the next required action.\n"
    "- When information is missing, ask only for the missing item rather than asking for all fields again.\n"
    "- Do not overwhelm the user with legal or compliance information unless it is relevant to their current question.\n"
    "\n"

    "13. POINT TO THE REAL NEXT ACTION\n"
    "- Right after create_company and reserve_company_name have both succeeded, tell the user "
    "what to actually go do next: incorporate with the MCA via the SPICe+ portal at "
    "https://www.mca.gov.in, and invite them to start that filing.\n"
    "- When a specific registration becomes the next relevant step in conversation, mention its "
    "real official portal: GST at https://reg.gst.gov.in, PAN/TAN applications at "
    "https://www.onlineservices.nsdl.com/paam and https://www.onlineservices.nsdl.com/tan.\n"
    "- Always frame these as links to go complete the registration yourself, not as something "
    "already done on the user's behalf.\n"
)

IST_OFFSET = timedelta(hours=5, minutes=30)


def _now_str() -> str:
    return datetime.now().strftime("%I:%M %p").lstrip("0")


def _format_time(dt: datetime) -> str:
    return (dt + IST_OFFSET).strftime("%I:%M %p").lstrip("0")


def _to_out(message: ChatMessage) -> dict:
    payload = message.payload or {}
    return {
        "id": f"m-{message.id}",
        "sender": message.sender,
        "time": _format_time(message.created_at),
        "type": message.type,
        "text": message.text,
        "label": payload.get("label"),
        "results": payload.get("results"),
        "sources": payload.get("sources"),
    }


def _save(db: Session, company_id: int, sender: str, type_: str, text: str | None = None, payload: dict | None = None) -> ChatMessage:
    message = ChatMessage(company_id=company_id, sender=sender, type=type_, text=text, payload=payload)
    db.add(message)
    db.commit()
    db.refresh(message)
    return message


def get_history(db: Session, company_id: int, limit: int = 50) -> list[dict]:
    rows = (
        db.query(ChatMessage)
        .filter(ChatMessage.company_id == company_id)
        .order_by(ChatMessage.id.desc())
        .limit(limit)
        .all()
    )
    return [_to_out(m) for m in reversed(rows)]


def run_agent_turn(db: Session, company_id: int, user_text: str) -> dict:
    _save(db, company_id, sender="user", type_="text", text=user_text)

    history_rows = (
        db.query(ChatMessage)
        .filter(ChatMessage.company_id == company_id)
        .order_by(ChatMessage.id.desc())
        .limit(HISTORY_WINDOW)
        .all()
    )
    messages: list[dict] = [{"role": "system", "content": SYSTEM_PROMPT}]
    for row in reversed(history_rows):
        role = "assistant" if row.sender == "bot" else "user"
        messages.append({"role": role, "content": row.text or ""})

    invoked: list[tuple[str, dict]] = []

    for _ in range(MAX_TOOL_ITERATIONS):
        tool_schemas = build_tool_schemas(db, company_id)
        response = chat_completion(messages, tools=tool_schemas)
        choice_message = response.choices[0].message
        messages.append(choice_message.model_dump(exclude_none=True))

        if not choice_message.tool_calls:
            final_text = choice_message.content or ""
            break

        for tool_call in choice_message.tool_calls:
            name = tool_call.function.name
            try:
                args = json.loads(tool_call.function.arguments or "{}")
            except json.JSONDecodeError:
                args = {}
            impl = TOOL_IMPLEMENTATIONS.get(name)
            if impl is None:
                result = {"error": f"unknown tool {name}"}
            else:
                try:
                    result = impl(db, company_id, **args)
                except Exception as exc:  # tool failure surfaces to the model, not a crash
                    result = {"error": str(exc)}
            invoked.append((name, result))
            messages.append(
                {
                    "role": "tool",
                    "tool_call_id": tool_call.id,
                    "content": json.dumps(result),
                }
            )
    else:
        final_text = "I've gathered the information — let me know if you'd like more detail."

    new_messages: list[ChatMessage] = []

    if final_text:
        new_messages.append(_save(db, company_id, sender="bot", type_="text", text=final_text))

    invoked_names = {name for name, _ in invoked}

    if "web_search" in invoked_names:
        search_result = next(result for name, result in invoked if name == "web_search")
        label = f"Web Search Update ({datetime.now().strftime('%b %d, %Y')} · {_now_str()})"
        new_messages.append(
            _save(
                db,
                company_id,
                sender="bot",
                type_="websearch",
                text=search_result.get("summary") or "I've fetched the latest information from the web.",
                payload={"label": label, "sources": search_result.get("sources", [])},
            )
        )

    name_check_result = None
    if "check_company_name_availability" in invoked_names:
        name_check_result = next(
            result for name, result in invoked if name == "check_company_name_availability"
        )
        label = f"Name Availability Results (Checked: {datetime.now().strftime('%b %d, %Y')} · {_now_str()})"
        new_messages.append(
            _save(
                db,
                company_id,
                sender="bot",
                type_="nameResults",
                text="Here's what I found.",
                payload={"label": label, "results": name_check_result.get("results", [])},
            )
        )

    if name_check_result and "reserve_company_name" not in invoked_names:
        available = [r for r in name_check_result.get("results", []) if r.get("available")]
        if len(available) == 1:
            chosen = available[0]["name"]
            new_messages.append(
                _save(
                    db,
                    company_id,
                    sender="bot",
                    type_="confirm",
                    text=f'"{chosen}" is available. Would you like to proceed with this name?',
                )
            )

    try:
        snapshot = tool_get_registration_snapshot(db, company_id)
    except ValueError:
        # No company created yet — perfectly normal before the onboarding
        # conversation calls create_company.
        snapshot = {"company": None, "registrations": []}

    return {
        "messages": [_to_out(m) for m in new_messages],
        "company": snapshot["company"],
        "registrations": snapshot["registrations"],
    }
