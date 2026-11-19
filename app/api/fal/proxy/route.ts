import { createRouteHandler } from "@fal-ai/server-proxy/nextjs";
import { getUserFromToken } from "@/app/lib/subscription";

const ALLOWED_FAL_ENDPOINTS = [
  "fal-ai/flux/dev",
  "fal-ai/flux-pro/v1.1-ultra",
  "fal-ai/ltx-video-13b-distilled",
  "fal-ai/ltx-2/image-to-video/fast",
];

function extractBearerOrHeader(value: string | string[] | null | undefined): string {
  const first = Array.isArray(value) ? value[0] : value;
  if (!first) return "";
  return first.replace(/^Bearer\s+/i, "").trim();
}

const handler = createRouteHandler({
  allowedEndpoints: ALLOWED_FAL_ENDPOINTS,
  allowUnauthorizedRequests: false,
  isAuthenticated: async (behavior) => {
    const token =
      extractBearerOrHeader(behavior.getHeader("x-gyra-user-token")) ||
      extractBearerOrHeader(behavior.getHeader("authorization"));
    if (!token) return false;
    const user = await getUserFromToken(token);
    return Boolean(user);
  },
  resolveFalAuth: async () => {
    if (process.env.FAL_KEY) return `Key ${process.env.FAL_KEY}`;
    if (process.env.FAL_KEY_ID && process.env.FAL_KEY_SECRET) {
      return `Key ${process.env.FAL_KEY_ID}:${process.env.FAL_KEY_SECRET}`;
    }
    return "";
  },
});

export const { GET, POST, PUT } = handler;
