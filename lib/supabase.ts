import { createBrowserClient, createServerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export function getSupabaseClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

export function getSupabaseServer() {
  const cookieStore = cookies();
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          try {
            cookieStore.set(name, value, options);
          } catch {
            // ignore in read-only contexts
          }
        });
      },
    },
  });
}
