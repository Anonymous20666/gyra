import { supabase } from "../../../supabase";

function streamResponse(stream: ReadableStream) {
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", 
    },
  });
}

function encodeEvent(data: any) {
  return new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`);
}

export async function POST(req: Request) {
  try {
    const { notebookId, messages } = await req.json();

    if (!notebookId || !Array.isArray(messages)) {
      return Response.json({ error: "Invalid request" }, { status: 400 });
    }

    // 1. Fetch Sources to build context (RAG)
    const { data: sources } = await supabase
      .from("notebook_sources")
      .select("name, content")
      .eq("notebook_id", notebookId)
      .eq("status", "ready");

    const context = sources?.map(s => `[Source: ${s.name}]\n${s.content}`).join("\n\n") || "No sources available. Tell the user to add sources first.";

    // 2. Build System Prompt
    const systemPrompt = `You are Gyra, an elite AI research assistant inside the Gyra Notebooks workspace. 
Answer the user's questions based strictly on the following sources. If the answer is not in the sources, politely say you don't know based on the provided context.

SOURCES:
${context}`;

    // 3. Create Stream
    const stream = new ReadableStream({
      async start(controller) {
        try {
          controller.enqueue(encodeEvent({ type: "status", agent: "Notebook", status: "Thinking..." }));

          const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: { 
              "Content-Type": "application/json", 
              Authorization: `Bearer ${process.env.GROQ_API_KEY}` 
            },
            body: JSON.stringify({
              model: "openai/gpt-oss-120b",
              messages: [
                { role: "system", content: systemPrompt },
                ...messages
              ],
              temperature: 0.3,
              stream: true,
            }),
          });

          if (!res.ok || !res.body) throw new Error("Groq API failed.");

          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value);
            const lines = chunk.split("\n");
            for (const line of lines) {
              if (!line.startsWith("data: ")) continue;
              const dataStr = line.slice(6).trim();
              if (dataStr === "[DONE]") break;
              try {
                const parsed = JSON.parse(dataStr);
                if (parsed.choices?.[0]?.delta?.content) {
                  controller.enqueue(encodeEvent({ type: "content", text: parsed.choices[0].delta.content }));
                }
              } catch (e) {}
            }
          }

          controller.enqueue(encodeEvent({ type: "done" }));
          controller.close();
        } catch (error) {
          console.error(error);
          controller.enqueue(encodeEvent({ type: "content", text: "⚠️ Error generating response." }));
          controller.close();
        }
      }
    });

    return streamResponse(stream);

  } catch (error) {
    console.error("API Error:", error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}