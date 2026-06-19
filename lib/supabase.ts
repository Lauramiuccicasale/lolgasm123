import { createClientComponentClient, createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export function getSupabaseClient() {
  return createClientComponentClient();
}

export function getSupabaseServer() {
  return createServerComponentClient({ cookies });
}
