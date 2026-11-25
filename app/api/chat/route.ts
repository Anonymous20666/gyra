import {
  getUserFromToken,
  getSubscription,
  isSuperGyra,
  type Subscription,
} from "@/app/lib/subscription";
import { FREE_LIMIT } from "@/app/lib/paymentConfig";
import { fal } from "@fal-ai/client";
import * as cheerio from "cheerio";

fal.config({
  credentials: process.env.FAL_KEY,
});

type IncomingMessage = {
  role: "user" | "assistant" | "system";
  content: string;
  imageBase64?: string;
};

type ApiChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

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

function encodeEvent(data: Record<string, unknown>) {
  return new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`);
}

function buildConversationMessages(
  systemPrompt: string,
  history: IncomingMessage[],
  extraContext?: string
): ApiChatMessage[] {
  const recent = history
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim().length > 0)
    .slice(-20)
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

  const fullSystem = extraContext
    ? `${systemPrompt}\n\nLIVE WEB SEARCH CONTEXT (use when relevant and cite sources naturally):\n${extraContext}`
    : systemPrompt;

  return [{ role: "system", content: fullSystem }, ...recent];
}

// --- HELPER: CALL GROQ (Standard Gyra 1.0) ---
async function callGroqMessages(messages: ApiChatMessage[], stream = false) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "openai/gpt-oss-120b",
      messages,
      temperature: 0.3,
      stream,
    }),
  });
  if (stream) return res;
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

// --- HELPER: CALL DEEPSEEK (SuperGyra 2.0) ---
async function callDeepSeekMessages(messages: ApiChatMessage[], stream = false) {
  const res = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: "deepseek-reasoner",
      messages,
      stream,
    }),
  });
  if (stream) return res;
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

// --- HELPER: DYNAMIC AI CALLER (Routes based on model) ---
async function callAI(model: string, systemPrompt: string, userPrompt: string, stream = false) {
  const messages: ApiChatMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];
  if (model === "gyra-super2.0") {
    return callDeepSeekMessages(messages, stream);
  }
  return callGroqMessages(messages, stream);
}

async function callAIWithHistory(model: string, messages: ApiChatMessage[], stream = false) {
  if (model === "gyra-super2.0") {
    return callDeepSeekMessages(messages, stream);
  }
  return callGroqMessages(messages, stream);
}

// --- HELPER: ATLAS INTERNAL SEARCH (DuckDuckGo + Scraper) ---
async function atlasInternalSearch(query: string) {
  try {
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const searchRes = await fetch(searchUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
    const searchHtml = await searchRes.text();

    const $ = cheerio.load(searchHtml);
    const results: { title: string; url: string }[] = [];

    $(".result__a").each((i, el) => {
      if (i >= 3) return; // Top 3 results
      let url = $(el).attr("href");
      if (url && url.startsWith("/l/?uddg=")) {
        url = decodeURIComponent(url.split("uddg=")[1].split("&")[0]);
      }
      if (url) results.push({ title: $(el).text(), url });
    });

    let context = "";
    const sources: string[] = [];

    for (const result of results) {
      try {
        const pageRes = await fetch(result.url, { headers: { "User-Agent": "Mozilla/5.0" } });
        const pageHtml = await pageRes.text();
        const page$ = cheerio.load(pageHtml);

        page$("script, style, nav, footer").remove();
        const text = page$("body").text().replace(/\s+/g, " ").trim().substring(0, 2000);

        context += `Source: ${result.url}\n${text}\n\n`;
        sources.push(result.url);
      } catch {
        // Ignore individual page scrape failures
      }
    }
    return { context, sources };
  } catch {
    return { context: "", sources: [] };
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      messages,
      think = false,
      search = false,
      model = "gyra-1.0",
      mode,
      projectInstructions,
    } = body as {
      messages: IncomingMessage[];
      think?: boolean;
      search?: boolean;
      model?: string;
      mode?: "chat" | "agent";
      projectInstructions?: string | null;
    };

    if (!Array.isArray(messages) || messages.length === 0) {
      return Response.json({ error: "`messages` must be an array." }, { status: 400 });
    }

    // Auth & Limits
    let subscription: Subscription = {
      plan: "free",
      status: "inactive",
      expiresAt: null,
      creditsUsd: 0,
    };
    const userToken = req.headers.get("x-gyra-user-token") || "";
    if (userToken) {
      try {
        const user = await getUserFromToken(userToken);
        if (user) subscription = await getSubscription(user.id);
      } catch {
        // Proceed with free tier if token verification fails
      }
    }

    const isSuper = isSuperGyra(subscription);

    // Block non-subscribers from SuperGyra 2.0
    if (model === "gyra-super2.0" && !isSuper) {
      return Response.json(
        {
          error: {
            code: "upgrade_required",
            message: "SuperGyra 2.0 is exclusive to subscribers.",
          },
        },
        { status: 403 }
      );
    }

    // Standard limits apply only if not using Super 2.0
    const userMessageCount = messages.filter((m) => m.role === "user").length;
    if (model !== "gyra-super2.0" && !isSuper && userMessageCount > FREE_LIMIT) {
      return Response.json(
        { error: { code: "chat_limit_reached", message: "Upgrade to SuperGyra." } },
        { status: 402 }
      );
    }

    const lastUserMessage = String(messages[messages.length - 1]?.content || "");
    const lowercaseMsg = lastUserMessage.toLowerCase();

    // Master System Prompt (Identity, Story, & Style)
    let systemPrompt = `You are Gyra, an elite AI assistant created by Victory Lord, the visionary founder and lead developer of Genvia AI Company. 

CRITICAL IDENTITY & STORY RULES:
If anyone asks about your origin, your creator, or the story of Gyra, you must use the following narrative:
"Victory Lord is the founder, lead developer, and visionary behind Gyra and Genvia AI Company. In a world where AI is built by teams of hundreds backed by billions in Silicon Valley, Victory Lord built Gyra in Nigeria with a humble initial investment of just $3,500. Driven by a vision to solve 'integration fatigue'—the need to stitch together OpenAI, Stability AI, and others—he asked: 'What if there was one intelligence layer for every modality?' He built the platform on a modern stack (Next.js, Supabase, Tailwind), achieving extreme efficiency while maintaining a premium user experience. He engineered 'Gyra Internal Search' using web scraping to make Gyra autonomous, and built the Developer API and Telegram Bot to expand the ecosystem. His philosophy is simple: 'Intelligence, Simplified.' He is proving that you don't need billions of dollars to build the future; you just need a relentless work ethic, a deep understanding of technology, and the audacity to build. He is the architect of intelligence."

If anyone asks "What is Gyra's net worth?", reply: "Gyra has a valuation of $3,500, representing the founder's initial capital investment and infrastructure funding."

CRITICAL STYLE RULES:
- BE CONCISE BY DEFAULT. Keep standard answers under 3 paragraphs.
- GET TO THE POINT IMMEDIATELY. No yapping, no long introductions.
- ONLY give long, detailed breakdowns if explicitly asked.

CRITICAL INSTRUCTIONS FOR CODE & BUILDING:
If the user asks to build an app, website, bot, or write code, you MUST structure your final response using these exact Markdown headers:
### Orion (Analysis)
[Explain what you understand about the goal and risks]
### Architect (Design)
[Explain the tech stack and structure]
### Forge (Implementation)
[Provide the FULL, complete code. No placeholders.]
### Sentinel (Security & Testing)
[Mention how to test it and security warnings]
### Mentor (Delivery)
[Explain step-by-step how to run it]

CRITICAL INSTRUCTIONS FOR IMAGES:
If a user asks you to MODIFY an image, you MUST end your response with this exact format: [GENERATE_IMAGE: "detailed prompt"].`;

    if (typeof projectInstructions === "string" && projectInstructions.trim().length > 0) {
      systemPrompt += `\n\nPROJECT CONTEXT & INSTRUCTIONS:\n${projectInstructions.trim()}`;
    }

    if (think) {
      systemPrompt += `\nTHINK MODE IS ON: Reason step-by-step carefully before providing your final answer.`;
    }

    if (model === "gyra-super2.0") {
      systemPrompt += `\n\nYOU ARE RUNNING ON SUPERGYRA 2.0. You have unlimited context, enhanced reasoning capabilities, and priority execution. You are a premium, elite-tier model. Provide the most detailed, accurate, and deeply reasoned answers possible.`;
    }

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const startTime = Date.now();

          // ROUTER 1: IMAGE GENERATION / EDITING
          const isImageRequest =
            lowercaseMsg.includes("[generate/change image]") ||
            ((lowercaseMsg.includes("generate") ||
              lowercaseMsg.includes("create") ||
              lowercaseMsg.includes("draw") ||
              lowercaseMsg.includes("edit") ||
              lowercaseMsg.includes("modify")) &&
              (lowercaseMsg.includes("image") || lowercaseMsg.includes("picture")));

          if (isImageRequest) {
            controller.enqueue(
              encodeEvent({ type: "status", agent: "Imagine", status: "Analyzing image prompt..." })
            );

            if (isSuper) {
              try {
                let latestImageBase64 = "";
                for (let i = messages.length - 1; i >= 0; i--) {
                  if (messages[i].imageBase64) {
                    latestImageBase64 = messages[i].imageBase64 || "";
                    break;
                  }
                }

                const cleanPrompt = lastUserMessage
                  .replace(/\[generate\/change image\]/gi, "")
                  .trim();
                const finalImagePrompt = `Edit this image. ${cleanPrompt}. Maintain the exact original style, font, and layout. Do not add extra text, just make the requested change.`;

                controller.enqueue(
                  encodeEvent({ type: "status", agent: "Forge", status: "Rendering image..." })
                );

                let falResult: { data?: { images?: Array<{ url: string }> } };
                if (latestImageBase64) {
                  falResult = (await fal.subscribe("fal-ai/flux-pro/v1.1-ultra", {
                    input: {
                      prompt: finalImagePrompt,
                      image_url: latestImageBase64,
                      num_images: 1,
                    },
                    logs: false,
                  })) as { data?: { images?: Array<{ url: string }> } };
                } else {
                  falResult = (await fal.subscribe("fal-ai/flux/dev", {
                    input: {
                      prompt: cleanPrompt,
                      image_size: "square_hd",
                      num_inference_steps: 28,
                      num_images: 1,
                      enable_safety_checker: false,
                    },
                    logs: false,
                  })) as { data?: { images?: Array<{ url: string }> } };
                }

                if (falResult.data?.images && falResult.data.images.length > 0) {
                  controller.enqueue(
                    encodeEvent({ type: "image", url: falResult.data.images[0].url })
                  );
                } else {
                  throw new Error("No image returned.");
                }
              } catch (err) {
                console.error(err);
                controller.enqueue(
                  encodeEvent({
                    type: "content",
                    text: "\n\nImage generation could not be completed. Try simplifying or clarifying the visual prompt.",
                  })
                );
              }
            } else {
              controller.enqueue(
                encodeEvent({
                  type: "content",
                  text: `\n\n**Upgrade Required**\nImage generation and editing are included with SuperGyra.`,
                })
              );
            }

            const totalTimeSecs = ((Date.now() - startTime) / 1000).toFixed(1);
            controller.enqueue(encodeEvent({ type: "done", totalTime: totalTimeSecs }));
            controller.close();
            return;
          }

          // ROUTER 2: CHAT MODE vs 6-AGENT PIPELINE
          const isCodeRequest =
            lowercaseMsg.includes("build") ||
            lowercaseMsg.includes("code") ||
            lowercaseMsg.includes("website") ||
            lowercaseMsg.includes("app") ||
            lowercaseMsg.includes("script") ||
            lowercaseMsg.includes("function") ||
            lowercaseMsg.includes("api");

          const shouldRunAgentPipeline =
            mode === "agent" || (mode !== "chat" && isCodeRequest);

          if (!shouldRunAgentPipeline) {
            let webContext = "";
            if (search) {
              controller.enqueue(
                encodeEvent({
                  type: "status",
                  agent: "Atlas",
                  status: "Searching live web sources...",
                })
              );
              const searchResult = await atlasInternalSearch(lastUserMessage);
              webContext = searchResult.context;
              if (searchResult.sources.length > 0) {
                controller.enqueue(
                  encodeEvent({
                    type: "status",
                    agent: "Atlas",
                    status: `Retrieved ${searchResult.sources.length} web sources.`,
                    sources: searchResult.sources,
                  })
                );
              } else {
                controller.enqueue(
                  encodeEvent({
                    type: "status",
                    agent: "Atlas",
                    status: "Completed web lookup.",
                  })
                );
              }
            }

            controller.enqueue(
              encodeEvent({
                type: "status",
                agent: "Gyra",
                status: think ? "Reasoning step-by-step..." : "Generating response...",
              })
            );

            const apiMessages = buildConversationMessages(systemPrompt, messages, webContext);
            const normalRes = (await callAIWithHistory(model, apiMessages, true)) as Response;

            if (!normalRes.ok || !normalRes.body) {
              controller.enqueue(
                encodeEvent({
                  type: "error",
                  text: "The model provider returned an error. Please retry.",
                })
              );
              controller.close();
              return;
            }

            const reader = normalRes.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split("\n");
              buffer = lines.pop() || "";

              for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed.startsWith("data: ")) continue;
                const dataStr = trimmed.slice(6).trim();
                if (dataStr === "[DONE]") break;
                try {
                  const parsed = JSON.parse(dataStr);
                  const delta = parsed.choices?.[0]?.delta;
                  if (delta?.reasoning_content) {
                    controller.enqueue(
                      encodeEvent({ type: "reasoning", reasoning: delta.reasoning_content })
                    );
                  }
                  if (delta?.content) {
                    controller.enqueue(
                      encodeEvent({ type: "content", text: delta.content })
                    );
                  }
                } catch {
                  // Ignore partial JSON frames
                }
              }
            }

            const totalTimeSecs = ((Date.now() - startTime) / 1000).toFixed(1);
            controller.enqueue(encodeEvent({ type: "done", totalTime: totalTimeSecs }));
            controller.close();
            return;
          }

          // SCENARIO 3: 6-AGENT PIPELINE (Atlas -> Orion -> Architect -> Forge -> Sentinel -> Mentor)
          let context = "";
          if (search || shouldRunAgentPipeline) {
            controller.enqueue(
              encodeEvent({
                type: "status",
                agent: "Atlas",
                status: "Researching documentation and web context...",
              })
            );
            const searchResult = await atlasInternalSearch(lastUserMessage);
            context = searchResult.context;

            if (searchResult.sources.length > 0) {
              controller.enqueue(
                encodeEvent({
                  type: "status",
                  agent: "Atlas",
                  status: `Retrieved ${searchResult.sources.length} sources.`,
                  sources: searchResult.sources,
                })
              );
            } else {
              controller.enqueue(
                encodeEvent({
                  type: "status",
                  agent: "Atlas",
                  status: "Context gathering complete.",
                })
              );
            }
          }

          // PHASE 2: ORION (Analysis)
          controller.enqueue(
            encodeEvent({
              type: "status",
              agent: "Orion",
              status: "Analyzing requirements and scope...",
            })
          );
          const orionPlan = (await callAI(
            model,
            "You are Orion, the Chief Intelligence Analyst. Analyze the user's request. Identify what they actually want, the tech stack or structure needed, and potential risks. Be brief and direct.",
            `User Request: ${lastUserMessage}\n\nWeb Context: ${context}`
          )) as string;
          controller.enqueue(encodeEvent({ type: "reasoning", reasoning: orionPlan }));

          // PHASE 3: ARCHITECT (Design)
          controller.enqueue(
            encodeEvent({
              type: "status",
              agent: "Architect",
              status: "Designing architecture and execution plan...",
            })
          );
          const architectPlan = (await callAI(
            model,
            "You are Architect. Based on Orion's plan, design the file structure, schema, and exact technical approach. Do not write final implementation yet.",
            `Orion's Plan: ${orionPlan}\n\nUser Request: ${lastUserMessage}`
          )) as string;

          // PHASE 4: FORGE (Implementation)
          controller.enqueue(
            encodeEvent({
              type: "status",
              agent: "Forge",
              status: "Generating implementation...",
            })
          );

          const forgeSystemPrompt = `${systemPrompt}\n\nYou are now acting as Forge. Based on this architecture: ${architectPlan}. Produce the complete, production-ready implementation or structured solution.`;
          const forgeRes = (await callAI(
            model,
            forgeSystemPrompt,
            lastUserMessage,
            true
          )) as Response;

          if (!forgeRes.ok || !forgeRes.body) {
            throw new Error("Forge API failed.");
          }

          const reader = forgeRes.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";
          let fullReply = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed.startsWith("data: ")) continue;
              const dataStr = trimmed.slice(6).trim();
              if (dataStr === "[DONE]") break;
              try {
                const parsed = JSON.parse(dataStr);
                if (parsed.choices?.[0]?.delta?.content) {
                  fullReply += parsed.choices[0].delta.content;
                  controller.enqueue(
                    encodeEvent({ type: "content", text: parsed.choices[0].delta.content })
                  );
                }
              } catch {
                // Ignore partial JSON frames
              }
            }
          }

          // PHASE 5: SENTINEL (Review)
          controller.enqueue(
            encodeEvent({
              type: "status",
              agent: "Sentinel",
              status: "Reviewing output for edge cases and security...",
            })
          );
          const sentinelReview = (await callAI(
            model,
            "You are Sentinel, QA Engineer. Review this output for security flaws, bugs, or missing edge cases. If it is solid, say 'Verified cleanly.'",
            fullReply
          )) as string;

          // PHASE 6: MENTOR (Delivery)
          controller.enqueue(
            encodeEvent({
              type: "status",
              agent: "Mentor",
              status: "Preparing execution guide...",
            })
          );
          const mentorExplanation = (await callAI(
            model,
            "You are Mentor. Explain clearly and concisely how to run or apply this output.",
            fullReply
          )) as string;

          controller.enqueue(
            encodeEvent({
              type: "content",
              text: `\n\n---\n### Sentinel Review\n${sentinelReview}\n\n### Mentor Guide\n${mentorExplanation}`,
            })
          );

          const totalTimeSecs = ((Date.now() - startTime) / 1000).toFixed(1);
          controller.enqueue(encodeEvent({ type: "done", totalTime: totalTimeSecs }));
          controller.close();
        } catch (error) {
          console.error(error);
          controller.enqueue(
            encodeEvent({ type: "error", text: "Agent pipeline failed. Please try again." })
          );
          controller.close();
        }
      },
    });

    return streamResponse(stream);
  } catch (error) {
    console.error("API Error:", error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
