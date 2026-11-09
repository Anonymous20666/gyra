// LLM provider config. Defaults to Groq; override with env for a local
// OpenAI-compatible endpoint (e.g. Ollama at http://127.0.0.1:11434/v1).
export function llm() {
  const base = (process.env.GYRA_LLM_BASE_URL || "https://api.groq.com/openai/v1").replace(/\/+$/, "");
  const key = process.env.GYRA_LLM_API_KEY || process.env.GROQ_API_KEY || "";
  const model = process.env.GYRA_LLM_MODEL || "openai/gpt-oss-120b";
  const configured = Boolean(process.env.GYRA_LLM_BASE_URL || process.env.GROQ_API_KEY);
  return { base, key, model, configured };
}
