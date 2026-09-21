import json
import logging
import time
from typing import List, Optional, Tuple
from app.core.config import settings

logger = logging.getLogger(__name__)


def _extract_json_block(text: str) -> Optional[dict]:
    """
    Extracts and parses JSON from text, handling markdown fences and whitespace.
    """
    cleaned = text.strip()
    # Strip markdown fences if present
    if "```json" in cleaned:
        cleaned = cleaned.split("```json")[1].split("```")[0].strip()
    elif "```" in cleaned:
        cleaned = cleaned.split("```")[1].split("```")[0].strip()

    try:
        return json.loads(cleaned)
    except Exception:
        # Try to find first '{' and last '}'
        start = cleaned.find("{")
        end = cleaned.rfind("}")
        if start != -1 and end != -1 and end > start:
            try:
                return json.loads(cleaned[start : end + 1])
            except Exception:
                pass
    return None


def generate_chat_reply(
    messages_history: List[dict],
    available_dishes: List[dict],
) -> Tuple[str, Optional[int]]:
    """
    Calls Groq API with model 'openai/gpt-oss-120b' if GROQ_API_KEY is configured.
    Falls back to intelligent culinary dialogue heuristics if key is not configured or on failure.
    Returns (reply_text, dish_id_or_none).
    """
    dishes_context = "\n".join(
        [
            f"- ID {d['id']}: {d['name']} (Category: {d['category']}, Price: ₹{d['price']}). Description: {d.get('description', '')}"
            for d in available_dishes
        ]
    )

    system_prompt = f"""You are the friendly, expert culinary concierge at RestoOne luxury restaurant.
Your role:
1. Greet guests warmly and ask about their appetite, mood, dietary preferences, or spice level.
2. Inquire and narrow down their preference quickly (within 1 to 4 exchanges).
3. Recommend a specific dish from our menu when you understand their taste or when they ask for a recommendation.
4. Output your response in STRICT JSON format with two keys:
   "reply": "Your conversational text response here (warm, appetizing, concise)",
   "dish_recommendation": {{"dish_id": <number>}} OR null if not recommending a specific dish yet.

Available Restaurant Menu:
{dishes_context}

CRITICAL RULES:
- Output ONLY valid JSON matching the schema: {{"reply": "...", "dish_recommendation": {{"dish_id": 12}} or null}}
- Only recommend dish_id from the available menu above.
- When you recommend a dish, explain why it fits their desire.
"""

    if settings.GROQ_API_KEY:
        for attempt in range(2):
            try:
                from groq import Groq
                client = Groq(api_key=settings.GROQ_API_KEY)

                groq_messages = [{"role": "system", "content": system_prompt}]
                for msg in messages_history:
                    role = "user" if msg.get("sender") == "user" else "assistant"
                    groq_messages.append({"role": role, "content": msg.get("message", "")})

                resp = client.chat.completions.create(
                    model=settings.GROQ_MODEL,
                    messages=groq_messages,
                    temperature=0.4,
                    response_format={"type": "json_object"},
                )
                raw_content = resp.choices[0].message.content
                parsed = _extract_json_block(raw_content)

                if parsed and isinstance(parsed, dict):
                    reply = parsed.get("reply", "I'd love to help you find the perfect dish today!")
                    dish_rec = parsed.get("dish_recommendation")
                    dish_id = None
                    if isinstance(dish_rec, dict) and "dish_id" in dish_rec:
                        dish_id = int(dish_rec["dish_id"])
                    elif isinstance(dish_rec, (int, str)) and str(dish_rec).isdigit():
                        dish_id = int(dish_rec)

                    # Validate that dish_id actually exists in available_dishes
                    if dish_id and not any(d["id"] == dish_id for d in available_dishes):
                        dish_id = None

                    return reply, dish_id
                else:
                    logger.warning(f"Unable to parse JSON from Groq output: {raw_content}")
                    break
            except Exception as e:
                err_str = str(e)
                logger.warning(f"Groq API call attempt {attempt + 1} failed: {err_str}")
                if "429" in err_str and attempt == 0:
                    time.sleep(1.0)
                    continue
                break

    # Heuristic Fallback Engine
    return _fallback_concierge(messages_history, available_dishes)


def _fallback_concierge(
    messages_history: List[dict],
    available_dishes: List[dict],
) -> Tuple[str, Optional[int]]:
    last_user_msg = ""
    for m in reversed(messages_history):
        if m.get("sender") == "user":
            last_user_msg = m.get("message", "").lower()
            break

    user_turn_count = sum(1 for m in messages_history if m.get("sender") == "user")

    # Keyword searches
    if "spicy" in last_user_msg or "paneer" in last_user_msg or "chilli" in last_user_msg:
        for d in available_dishes:
            if "paneer" in d["name"].lower() or "chilli" in d["name"].lower():
                return (
                    f"Excellent choice! If you're craving something spicy and flavorful, our **{d['name']}** is an absolute guest favorite. Crispy on the outside with our house chili glaze!",
                    d["id"],
                )
    if "light" in last_user_msg or "starter" in last_user_msg or "soup" in last_user_msg or "salad" in last_user_msg:
        for d in available_dishes:
            if d.get("category", "").lower() in ["starters", "starter", "soup", "salad"]:
                return (
                    f"For a lighter start to your meal, I highly recommend our **{d['name']}** ({d['category']}) — delicate flavors crafted fresh for you.",
                    d["id"],
                )
    if "sweet" in last_user_msg or "dessert" in last_user_msg or "ice cream" in last_user_msg or "cake" in last_user_msg:
        for d in available_dishes:
            if d.get("category", "").lower() in ["desserts", "dessert"]:
                return (
                    f"You have a great palate! Treat yourself to our decadent **{d['name']}** to sweeten your dining experience.",
                    d["id"],
                )
    if "drink" in last_user_msg or "beverage" in last_user_msg or "cocktail" in last_user_msg or "mocktail" in last_user_msg or "refresh" in last_user_msg:
        for d in available_dishes:
            if d.get("category", "").lower() in ["beverages", "drinks", "beverage"]:
                return (
                    f"To quench your thirst, our signature **{d['name']}** is perfectly refreshing and pairs with anything.",
                    d["id"],
                )
    if "main" in last_user_msg or "heavy" in last_user_msg or "rice" in last_user_msg or "curry" in last_user_msg or "biryani" in last_user_msg:
        for d in available_dishes:
            if d.get("category", "").lower() in ["mains", "main course"]:
                return (
                    f"For a deeply satisfying meal, our signature **{d['name']}** is slow-cooked with aromatic spices and served hot.",
                    d["id"],
                )

    if user_turn_count >= 2 and available_dishes:
        top_dish = available_dishes[0]
        return (
            f"Based on what you've shared, I think you will love our chef's recommendation: **{top_dish['name']}**! Would you like to try it?",
            top_dish["id"],
        )

    return (
        "Welcome to RestoOne! Are you in the mood for something bold & spicy, a light starter, a wholesome main course, or perhaps a refreshing craft drink?",
        None,
    )
