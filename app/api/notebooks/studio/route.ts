import { NextResponse } from "next/server";
import { supabase } from "../../../supabase";

export async function POST(req: Request) {
  try {
    const { notebookId, type } = await req.json();

    const { data: sources } = await supabase
      .from("notebook_sources")
      .select("content")
      .eq("notebook_id", notebookId);

    const context = sources?.map(s => s.content).join("\n\n") || "";

    if (!context) return NextResponse.json({ error: "No sources found" }, { status: 400 });

    const prompt = `Based on the following sources, generate a comprehensive, highly detailed ${type}. Format it beautifully using Markdown.\n\nSOURCES:\n${context}`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.5,
      }),
    });

    const data = await response.json();
    const output = data.choices?.[0]?.message?.content;

    if (!output) throw new Error("No output generated");

    return NextResponse.json({ output });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to generate" }, { status: 500 });
  }
}