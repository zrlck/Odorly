import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function GET(req) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Missing GEMINI_API_KEY" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const { searchParams } = new URL(req.url);
    const bo = Number(searchParams.get("bo"));

    if (isNaN(bo)) {
      return new Response(
        JSON.stringify({ error: "Invalid bo" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    let prompt =
      bo < 20
        ? `You are a friendly cheerleader. Someone’s body odor level is only ${bo}%. Give them a short, nice, encouraging one-liner under 20 words.`
        : `You are a witty roaster. Someone’s body odor level is ${bo}%. Make a short, funny, slightly offensive one-liner under 20 words.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    return new Response(
      JSON.stringify({ comment: text }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("ODOR API error:", err);
    return new Response(
      JSON.stringify({ error: "Failed to generate comment" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
