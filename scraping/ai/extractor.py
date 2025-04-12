from pydantic import BaseModel
from typing import Optional
from magentic import chatprompt, SystemMessage, UserMessage, AssistantMessage


class CaptiveInfo(BaseModel):
    name: Optional[str]
    person_type: Optional[str]
    brigade: Optional[str]
    settlement: Optional[str]
    status: Optional[str]
    circumstances: Optional[str]


@chatprompt(
    SystemMessage(
        "You are a Ukrainian text analyst specialized in extracting personal status information.\n"
        "- Identify if the text is about a specific person.\n"
        "- Focus on context such as captivity, missing status, found/reunited, or deceased.\n"
        "- Do not invent names or details not clearly present.\n"
        "- If no person-related info is found, respond with: NO_RELEVANT_INFORMATION\n"
        "- Otherwise, return a structured JSON object describing the person."
    ),
    UserMessage(
        "Analyze the following Ukrainian text for person-related information:\n"
        "###\n"
        "Мовчан Олександр\n"
        "#153_бригада\n"
        "###\n"
        "Return:\n"
        "- If relevant: a JSON object with keys: name, person_type, brigade, settlement, status, circumstances\n"
        "- If not relevant: the string 'NO_RELEVANT_INFORMATION'\n"
        "- set 'person_type' always to 'military'\n"
        "- status MUST ALWAYS be one of the following: 'searching', 'informed', 'reunited', 'deceased'; set to 'informed' if no status is specified\n"
    ),
    AssistantMessage(
        {
            "name": "Мовчан Олександр",
            "person_type": "military",
            "brigade": "153",
            "status": "informed",
        }
    ),
    UserMessage(
        "Analyze the following Ukrainian text for person-related information:\n"
        "###\n"
        "Заклик до підтримки ЗСУ та молитва за перемогу України.\n"
        "###\n"
        "Return:\n"
        "- If relevant: a JSON with ALL these keys (all are required): name, person_type, brigade, settlement, status, circumstances\n"
        "- person_type MUST ALWAYS be set to 'military'\n"
        "- status MUST ALWAYS be one of the following: 'searching', 'informed', 'reunited', 'deceased'; set to 'informed' if no status is specified\n"
        "- If not relevant: the string 'NO_RELEVANT_INFORMATION'"
    ),
    AssistantMessage("NO_RELEVANT_INFORMATION"),
    UserMessage(
        "Analyze the following Ukrainian text for person-related information:\n"
        "###\n{text}\n###\n"
        "Return:\n"
        "- If relevant: a JSON with ALL these keys (all are required): name, person_type, brigade, settlement, status, circumstances\n"
        "- person_type MUST ALWAYS be set to 'military'\n"
        "- status MUST ALWAYS be one of the following: 'searching', 'informed', 'reunited', 'deceased'; set to 'informed' if no status is specified\n"
        "- If not relevant: the string 'NO_RELEVANT_INFORMATION'"
    ),
)
async def extract_person_info(text: str) -> CaptiveInfo: ...
