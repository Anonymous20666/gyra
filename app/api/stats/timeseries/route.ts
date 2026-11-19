import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase env vars.");
  return createClient(url, key, { auth: { persistSession: false } });
}

export const revalidate = 0;

export async function GET() {
  try {
    const supabase = getSupabase();

    const now = new Date();
    const start = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 29)
    );

    const { data, error } = await supabase
      .from("api_requests")
      .select("created_at")
      .gte("created_at", start.toISOString())
      .limit(200000);

    if (error) throw error;

    // Bucket by day (UTC)
    const buckets: Record<string, number> = {};
    for (let i = 0; i < 30; i++) {
      const d = new Date(start);
      d.setUTCDate(d.getUTCDate() + i);
      const key = d.toISOString().slice(0, 10);
      buckets[key] = 0;
    }

    for (const row of data || []) {
      const key = (row as any).created_at.slice(0, 10);
      if (key in buckets) buckets[key] += 1;
    }

    const series = Object.entries(buckets)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return Response.json({
      series,
      updatedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    return Response.json(
      { error: { message: err?.message || "Failed" } },
      { status: 500 }
    );
  }
}