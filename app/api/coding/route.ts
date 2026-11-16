import { createOpenAI } from "@ai-sdk/openai";
import { streamText, tool } from "ai"; 
import { z } from "zod";
import { Sandbox } from "@e2b/code-interpreter";

const groq = createOpenAI({
  baseURL: "https://api.groq.com/openai/v1",
  apiKey: process.env.GROQ_API_KEY,
});

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { messages, sandboxId } = await req.json();

    const sandbox = sandboxId 
      ? await Sandbox.connect(sandboxId) 
      : await Sandbox.create();

    const tools = {
      execute_terminal: tool({
        description: "Run a shell command inside the project sandbox.",
        parameters: z.object({ command: z.string() }),
        execute: async ({ command }) => {
          const result = await sandbox.commands.run(command);
          return `Exit Code: ${result.exitCode}\nStdout: ${result.stdout}\nStderr: ${result.stderr}`;
        },
      }),
      write_file: tool({
        description: "Create or overwrite a file with full content.",
        parameters: z.object({ path: z.string(), content: z.string() }),
        execute: async ({ path, content }) => {
          await sandbox.files.write(path, content);
          return `Successfully wrote to ${path}`;
        },
      }),
      read_file: tool({
        description: "Read the contents of a file.",
        parameters: z.object({ path: z.string() }),
        execute: async ({ path }) => {
          return await sandbox.files.read(path);
        },
      }),
    };

    const result = await streamText({
      model: groq("openai/gpt-oss-120b"),
      system: `You are Forge, an autonomous coding agent inside the Gyra Workspace.
      
CRITICAL RULES:
1. You have access to a real Linux terminal and file system.
2. If you need to build something, use 'write_file' to create the files.
3. Use 'execute_terminal' to run tests, install packages, or check your work.
4. If a command fails, READ the error, fix the file, and try again.
5. Keep working until the task is complete.`,
      messages,
      tools,
      maxSteps: 8,
    });

    return result.toDataStreamResponse();

  } catch (error: any) {
    console.error("Coding Agent Error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}