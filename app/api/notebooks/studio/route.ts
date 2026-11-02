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

    const prompt = `Based on the following text, generate a comprehensive ${type}.\n\nTEXT:\n${context}`;

    // Call your AI provider (non-streaming for Studio outputs)
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await response.json();
    const output = data.choices[0].message.content;

    return NextResponse.json({ output });
  } catch (error) {
    return NextResponse.json({ error: "Failed to generate" }, { status: 500 });
  }
}