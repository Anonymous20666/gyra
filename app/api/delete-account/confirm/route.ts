import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Use the Service Role Key to bypass RLS and delete the actual Auth user
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase admin credentials");
  return createClient(url, key);
}

export async function POST(req: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { token } = await req.json();

    if (!token) return NextResponse.json({ error: "Token required" }, { status: 400 });

    // 1. Find the request
    const { data: request, error: reqError } = await supabaseAdmin
      .from("deletion_requests")
      .select("*")
      .eq("token", token)
      .single();

    if (reqError || !request) {
      return NextResponse.json({ error: "Invalid or expired token." }, { status: 400 });
    }

    // 2. Find the user in Auth by email
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) throw listError;

    const user = users.find((u) => u.email === request.email);

    if (user) {
      // 3. Delete the user (This cascades to projects, chats, keys, etc. if you set up ON DELETE CASCADE)
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
      if (deleteError) throw deleteError;
    }

    // 4. Clean up the deletion request token
    await supabaseAdmin.from("deletion_requests").delete().eq("id", request.id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Deletion Error:", error);
    return NextResponse.json({ error: "Failed to delete account. Please contact support." }, { status: 500 });
  }
}