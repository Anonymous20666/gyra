import { NextResponse } from "next/server";
import { supabase } from "../../../supabase"; // Adjust path if needed

export async function POST(req: Request) {
  try {
    const { notebookId, messages } = await req.json();

    // 1. Fetch Sources to build context
    const { data: sources } = await supabase
      .from("notebook_sources")
      .select("name, content")
      .eq("notebook_id", notebookId)
      .eq("status", "ready");

    const context = sources?.map(s => `[Source: ${s.name}]\n${s.content}`).join("\n\n") || "No sources available.";

    // 2. Build Prompt
    const systemPrompt = `You are an AI research assistant. Answer the user's questions based strictly on the following sources. If the answer is not in the sources, say you don't know.\n\nSOURCES:\n${context}`;
    
    const apiMessages = [
      { role: "system", content: systemPrompt },
      ...messages
    ];

    // 3. Call Groq/DeepSeek (Using your existing provider)
    // Replace this URL/KEY with your actual environment variables
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: apiMessages,
        stream: true,
      }),
    });

    // 4. Stream response back to client
    return new Response(response.body, {
      headers: { "Content-Type": "text/event-stream" }
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to chat" }, { status: 500 });
  }
}