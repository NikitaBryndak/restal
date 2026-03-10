import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { connectToDatabase } from "@/lib/mongodb";
import AiRateLimit from "@/models/aiRateLimit";
import { getServerIp } from "@/lib/rate-limit";
import { AI_DAILY_RATE_LIMIT } from "@/config/constants";

const EXTRACT_PROMPT = `Ти — точний екстрактор даних. Твоє завдання: витягнути ТІЛЬКИ ту інформацію, яку користувач ЯВНО вказав у розмові. НЕ вигадуй, НЕ припускай, НЕ доповнюй з власних знань.

ПРАВИЛА:
- Якщо користувач НЕ згадував якесь поле — встанови null (не вигадуй значення)
- activities — ТІЛЬКИ якщо користувач явно просив конкретні активності (екскурсії, дайвінг тощо). Якщо не згадував — null
- hotel.preferences — ТІЛЬКИ те, що користувач прямо сказав (наприклад "хочу при морі"). НЕ додавай "з басейном" чи інше, що він не казав
- hotel.stars і hotel.mealPlan — ТІЛЬКИ якщо прямо вказано
- recommendations — ТІЛЬКИ напрямки, які AI вже порадив у розмові. НЕ додавай нові
- estimatedCost — ТІЛЬКИ якщо конкретна сума вже звучала у розмові
- notes — ТІЛЬКИ явні додаткові побажання користувача

ВАЖЛИВО: Поверни ТІЛЬКИ валідний JSON, без markdown, без \`\`\`json, без пояснень — тільки чистий JSON об'єкт.

Якщо в розмові недостатньо інформації для плану подорожі (немає жодної згадки про напрямок чи бажання поїхати кудись), поверни:
{"error": "not_enough_info"}

Формат JSON:
{
  "destination": "Назва країни/міста або null",
  "region": "Конкретний район/курорт або null",
  "dates": {
    "from": "YYYY-MM-DD або текстовий опис або null",
    "to": "YYYY-MM-DD або текстовий опис або null",
    "flexible": true/false
  },
  "travelers": {
    "adults": число або null,
    "children": число або null,
    "childrenAges": [масив віків] або null
  },
  "budget": {
    "amount": "діапазон або число або null",
    "currency": "UAH/USD/EUR або null",
    "perPerson": true/false
  },
  "tripType": "тип що вказав користувач або null",
  "hotel": {
    "stars": "зірковість або null",
    "mealPlan": "тип харчування або null",
    "preferences": ["тільки явно вказані побажання"] або null
  },
  "activities": [
    {
      "name": "Назва",
      "description": "Опис",
      "icon": "emoji"
    }
  ] або null,
  "recommendations": [
    {
      "destination": "Напрямок що вже згадано в розмові",
      "reason": "Причина з розмови",
      "highlights": ["тільки з розмови"],
      "estimatedCost": "вартість або null"
    }
  ] або null,
  "notes": "Додаткові явні побажання або null"
}`;

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Messages are required" },
        { status: 400 }
      );
    }

    if (messages.length > 50) {
      return NextResponse.json(
        { error: "Too many messages in conversation" },
        { status: 400 }
      );
    }

    const MAX_MESSAGE_LENGTH = 5000;
    for (const msg of messages) {
      if (typeof msg.content !== "string" || msg.content.length > MAX_MESSAGE_LENGTH) {
        return NextResponse.json(
          { error: `Each message must be a string of at most ${MAX_MESSAGE_LENGTH} characters` },
          { status: 400 }
        );
      }
    }

    const identifier = getServerIp(req);
    await connectToDatabase();

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let rateLimit = await AiRateLimit.findOne({ identifier });

    if (!rateLimit) {
      rateLimit = await AiRateLimit.create({ identifier, count: 0, lastReset: now });
    } else {
      if (rateLimit.lastReset < today) {
        rateLimit.count = 0;
        rateLimit.lastReset = now;
      }
    }

    if (rateLimit.count >= AI_DAILY_RATE_LIMIT) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429 }
      );
    }

    rateLimit.count += 1;
    await rateLimit.save();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini API key is not configured" },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: EXTRACT_PROMPT,
    });

    // Build the conversation as a single text block for extraction
    const conversationText = messages
      .map((msg: { role: string; content: string }) =>
        `${msg.role === "user" ? "Користувач" : "Асистент"}: ${msg.content}`
      )
      .join("\n\n");

    const result = await model.generateContent(
      `Витягни структурований план подорожі з цієї розмови:\n\n${conversationText}`
    );

    const responseText = result.response.text().trim();

    // Try to parse JSON from the response (handle possible markdown wrapping or text around JSON)
    let planData;
    try {
      // Strategy 1: Remove markdown code fences if present
      let cleaned = responseText
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();

      try {
        planData = JSON.parse(cleaned);
      } catch {
        // Strategy 2: Extract first JSON object from the response text
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("No JSON object found");
        planData = JSON.parse(jsonMatch[0]);
      }
    } catch {
      return NextResponse.json(
        { error: "Failed to parse trip plan" },
        { status: 500 }
      );
    }

    if (planData.error === "not_enough_info") {
      return NextResponse.json(
        { error: "not_enough_info" },
        { status: 400 }
      );
    }

    return NextResponse.json({ plan: planData });
  } catch (error) {
    console.error("Trip plan API error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: "Failed to generate trip plan" },
      { status: 500 }
    );
  }
}
