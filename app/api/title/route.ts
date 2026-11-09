import { llm } from "../../lib/llm";

export async function POST(req: Request) {
  try {
    const { message } = await req.json();
    if (!message) return Response.json({ title: "New Conversation" });

    // Use Groq's fastest model specifically for generating a short title
    const res = await fetch(`${llm().base}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${llm().key}`,
      },
      body: JSON.stringify({
        model: llm().model,
        messages: [
          {
            role: "system",
            content: "You generate concise 2-4 word titles for chat conversations. Output ONLY the title, no quotes, no punctuation at the end.",
          },
          { role: "user", content: message },
        ],
        temperature: 0.3,
        max_tokens: 15,
      }),
    });

    const data = await res.json();
    let title = data.choices?.[0]?.message?.content?.trim() || "New Conversation";
    
    // Clean up any weird AI output
    title = title.replace(/["']/g, "").substring(0, 30);

    return Response.json({ title });
  } catch (e) {
    return Response.json({ title: "New Conversation" });
  }
}