import { createServerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import NavBar from "@/components/NavBar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {
          // read-only in server components
        },
      },
    }
  );
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex flex-col min-h-screen">
      <NavBar />
      <div className="flex-1">{children}</div>
    </div>
  );
}
