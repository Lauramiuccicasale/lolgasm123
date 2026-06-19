import { createServerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SEED_PROFILES } from "@/lib/seed";

export async function POST() {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            try {
              cookieStore.set(name, value, options);
            } catch {
              // ignore
            }
          });
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const results: string[] = [];

  for (const profile of SEED_PROFILES) {
    let { data: uni } = await supabase
      .from("universities")
      .select("id")
      .ilike("name", profile.university_name)
      .maybeSingle();

    if (!uni) {
      const { data: newUni } = await supabase
        .from("universities")
        .insert({ name: profile.university_name })
        .select("id")
        .single();
      uni = newUni;
    }

    if (!uni) {
      results.push(`Failed to create university: ${profile.university_name}`);
      continue;
    }

    const { error } = await supabase.from("requirement_profiles").upsert(
      {
        university_id: uni.id,
        track_name: profile.track_name,
        min_award: profile.min_award,
        min_det: profile.min_det,
        min_maths: profile.min_maths,
        min_sci: profile.min_sci,
        min_arabic: profile.min_arabic,
        min_english: profile.min_english,
        min_lss: profile.min_lss,
      },
      { onConflict: "university_id,track_name" }
    );

    if (error) {
      results.push(`Error for ${profile.track_name}: ${error.message}`);
    } else {
      results.push(`Seeded: ${profile.university_name} / ${profile.track_name}`);
    }
  }

  return NextResponse.json({ results });
}
