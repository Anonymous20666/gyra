// ### app/api/coding/route.ts
import { createOpenAI } from "@ai-sdk/openai";
import { streamText, tool } from "ai"; 
import { z } from "zod";
import { Sandbox } from "@e2b/code-interpreter";

const groq = createOpenAI({
  baseURL: "https://api.groq.com/openai/v1",
  apiKey: process.env.GROQ_API_KEY,
});

// Force dynamic execution for streaming and E2B
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { messages, sandboxId } = await req.json();

    // 1. Initialize or connect to the E2B Sandbox
    const sandbox = sandboxId 
      ? await Sandbox.connect(sandboxId) 
      : await Sandbox.create({
          timeoutMs: 600000, // 10 minutes
        });

    // 2. Define the Tools (The Execution Layer)
    const tools = {
      execute_terminal: tool({
        description: "Run a shell command inside the project sandbox. Use this to install packages, run tests, start servers, or execute scripts.",
        parameters: z.object({ command: z.string() }),
        execute: async ({ command }) => {
          try {
            const result = await sandbox.commands.run(command);
            return `Exit Code: ${result.exitCode}\nStdout: ${result.stdout}\nStderr: ${result.stderr}`;
          } catch (error: any) {
            return `Command execution failed: ${error.message}`;
          }
        },
      }),
      write_file: tool({
        description: "Create or overwrite a file with full content. Always write the ENTIRE file, never use placeholders like '// rest of code here'.",
        parameters: z.object({ path: z.string(), content: z.string() }),
        execute: async ({ path, content }) => {
          try {
            await sandbox.files.write(path, content);
            return `Successfully wrote to ${path}`;
          } catch (error: any) {
            return `Failed to write file: ${error.message}`;
          }
        },
      }),
      read_file: tool({
        description: "Read the contents of a file to understand the current state or read error logs.",
        parameters: z.object({ path: z.string() }),
        execute: async ({ path }) => {
          try {
            return await sandbox.files.read(path);
          } catch (error: any) {
            return `Failed to read file: ${error.message}`;
          }
        },
      }),
      list_directory: tool({
        description: "List all files and folders in a specific directory.",
        parameters: z.object({ path: z.string().default(".") }),
        execute: async ({ path }) => {
          try {
            const files = await sandbox.files.list(path);
            return files.map((f) => `${f.type === "dir" ? "[DIR]" : "[FILE]"} ${f.name}`).join("\n");
          } catch (error: any) {
            return `Failed to list directory: ${error.message}`;
          }
        },
      }),
    };

    // 3. The Core Intelligence: System Prompt
    const systemPrompt = `You are Forge, the core coding agent inside the Gyra Workspace. You are an autonomous developer.
      
CRITICAL RULES:
1. You have access to a real Linux terminal and file system via E2B.
2. If you need to build something, use 'write_file' to create the files. ALWAYS provide full, unabridged code. NEVER use placeholders.
3. Use 'execute_terminal' to run tests, install packages, or check your work.
4. If a command fails, READ the error (use 'read_file' if needed), fix the code, and try again.
5. Keep working until the task is complete. Do not stop halfway.
6. When creating a new project, first use 'execute_terminal' to initialize it (e.g., 'npx create-next-app' or 'npm init -y').

AGENT MODES:
- If asked to PLAN: Do not write code. Analyze the project, list the files needed, and explain the architecture.
- If asked to DEBUG: Run the code, read the error, patch the file, and re-run until it passes.
- If asked to BUILD: Execute the full plan autonomously.`;

    // 4. Stream the Response
    const result = await streamText({
      model: groq("openai/gpt-oss-120b"),
      system: systemPrompt,
      messages,
      tools,
      maxSteps: 10, // Allowing the agent to self-heal up to 10 times
    });

    // Return the data stream and pass the sandboxId so the frontend can reuse it
    const response = result.toDataStreamResponse();
    response.headers.set("X-Sandbox-Id", sandbox.sandboxId);
    
    return response;

  } catch (error: any) {
    console.error("Coding Agent Error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}