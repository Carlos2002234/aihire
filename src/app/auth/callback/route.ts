import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type UserRole = Database["public"]["Enums"]["user_role"];

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=Falta el código de autenticación`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error?.message ?? "No pudimos completar el login")}`);
  }

  const cookieStore = await cookies();
  const pendingRole = cookieStore.get("pending_signup_role")?.value as
    | UserRole
    | undefined;

  if (pendingRole) {
    await supabase
      .from("profiles")
      .update({ role: pendingRole })
      .eq("id", data.user.id);
    cookieStore.delete("pending_signup_role");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();

  return NextResponse.redirect(
    `${origin}${profile?.role === "recruiter" ? "/recruiter" : "/candidate"}`
  );
}
