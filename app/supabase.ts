import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Lazily-created Supabase client, exported as the same `supabase` binding every
 * page/route already imports.
 *
 * The client is instantiated on first use, not at module evaluation: creating
 * it at the top level with a missing NEXT_PUBLIC_SUPABASE_URL throws
 * "supabaseUrl is required" during `next build` page-data collection and kills
 * the whole build. Deferring keeps builds green without env and behaves
 * identically at runtime once the env is present.
 */
let client: SupabaseClient | null = null;

function resolve(): SupabaseClient {
  if (!client) {
    client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
  }
  return client;
}

export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    return Reflect.get(resolve(), prop, receiver);
  },
  has(_target, prop) {
    return Reflect.has(resolve(), prop);
  },
});

export async function getAccessToken(): Promise<string | null> {
  try {
    const { data } = await resolve().auth.getSession();
    return data.session?.access_token ?? null;
  } catch {
    return null;
  }
}
