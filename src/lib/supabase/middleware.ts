import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import type { Database } from "@/types/database";

const ROLE_PREFIXES = {
  candidate: "/candidate",
  recruiter: "/recruiter",
} as const;

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isProtectedPath =
    pathname.startsWith(ROLE_PREFIXES.candidate) ||
    pathname.startsWith(ROLE_PREFIXES.recruiter);

  if (!user && isProtectedPath) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (user && isProtectedPath) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = profile?.role;
    const belongsToOtherRole =
      (role === "candidate" && pathname.startsWith(ROLE_PREFIXES.recruiter)) ||
      (role === "recruiter" && pathname.startsWith(ROLE_PREFIXES.candidate));

    if (belongsToOtherRole && role) {
      return NextResponse.redirect(
        new URL(ROLE_PREFIXES[role], request.url)
      );
    }
  }

  return response;
}
