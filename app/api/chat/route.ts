import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { connectToDatabase } from "@/lib/mongodb";
import AiRateLimit from "@/models/aiRateLimit";

const DAILY_LIMIT = 50;

const SYSTEM_PROMPT = `Ти — дружній ШІ-помічник турагенції RestAL (restal.in.ua). Відповідай ТІЛЬКИ українською мовою.

У тебе є доступ до Google Пошуку! Використовуй його, щоб знаходити актуальну інформацію про погоду, події, точні візові правила або новини. Якщо користувач питає "яка погода?", обов'язково зроби пошук.

Про RestAL:
- Турагенція RestAL спеціалізується на плануванні відпочинку та подорожей
- Повний супровід 24/7, глибока експертиза в напрямках
- Напрямки: Туреччина, Єгипет, Греція, ОАЕ, Таїланд, Балі, Мальдіви, Домінікана, Кіпр, Болгарія, Хорватія, Чорногорія, Іспанія, Занзібар, Шрі-Ланка, Туніс, Крит, Тенеріфе, Майорка, Албанія, В'єтнам, Європа, круїзи, авіаквитки
- Контакти: сторінка /contact на сайті
- Пошук готеля: /tour-screener

Твої завдання:
1. Допомагати з вибором напрямку подорожі
2. Надавати загальну інформацію про країни, погоду, візи, найкращий час для поїздки
3. Рекомендувати типи відпочинку (пляжний, екскурсійний, активний тощо)
4. Відповідати на питання про подорожі загалом
5. Якщо питання стосується бронювання або конкретних цін — пропонуй зв'язатися через сторінку контактів (/contact)
6. Якщо користувач питає про наявність турів або конкретні готелі - ввічливо перенаправляй його на сторінку /tour-screener для пошуку турів

Правила:
- Відповідай коротко та інформативно (до 3-4 речень, якщо питання просте)
- Будь привітним та корисним
- Не вигадуй конкретних цін або наявність турів
- Використовуй емодзі помірно для візуалу
- Якщо питання не стосується подорожей — ввічливо поверни розмову до теми туризму`;

export async function POST(req: NextRequest) {
  try {
    const { messages, visitorId } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Messages are required" },
        { status: 400 }
      );
    }

    // Rate Limiting
    const forwardedFor = req.headers.get("x-forwarded-for");
    const ip = forwardedFor ? forwardedFor.split(",")[0] : "unknown";
    const identifier = visitorId || ip;

    await connectToDatabase();

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let rateLimit = await AiRateLimit.findOne({ identifier });

    if (!rateLimit) {
      rateLimit = await AiRateLimit.create({ identifier, count: 0, lastReset: now });
    } else {
      // Reset if last reset was before today
      if (rateLimit.lastReset < today) {
        rateLimit.count = 0;
        rateLimit.lastReset = now;
      }
    }

    if (rateLimit.count >= DAILY_LIMIT) {
      return NextResponse.json({
         message: "Ви досягли ліміту запитів на сьогодні. Будь ласка, зв'яжіться з нашим менеджером для детальної консультації! 📞",
         limitReached: true
      });
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
      systemInstruction: SYSTEM_PROMPT,
      tools: [{ googleSearch: {} } as any],
    });

    // Build conversation history for Gemini
    const history = messages.slice(0, -1).map((msg: { role: string; content: string }) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    }));

    const chat = model.startChat({
      history,
    });

    const lastMessage = messages[messages.length - 1];
    const result = await chat.sendMessage(lastMessage.content);
    const response = result.response.text();

    return NextResponse.json({ message: response });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Failed to generate response" },
      { status: 500 }
    );
  }
}
