import { GYRA_MODEL_CATALOG } from "@/app/lib/modelCatalog";

export const revalidate = 0;

export async function GET() {
  const runtimeCapabilities = {
    chatStandardConfigured: Boolean(
      process.env.GROQ_API_KEY ||
        process.env.XAI_API_KEY ||
        process.env.HUGGINGFACE_API_KEY,
    ),
    chatSuperConfigured: Boolean(process.env.DEEPSEEK_API_KEY),
    imageProxyConfigured: Boolean(
      process.env.FAL_KEY || (process.env.FAL_KEY_ID && process.env.FAL_KEY_SECRET),
    ),
    videoQueueConfigured: Boolean(
      process.env.FAL_KEY || (process.env.FAL_KEY_ID && process.env.FAL_KEY_SECRET),
    ),
  };

  return Response.json({
    models: GYRA_MODEL_CATALOG,
    runtime: runtimeCapabilities,
    updatedAt: new Date().toISOString(),
  });
}
