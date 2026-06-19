"use client";

import { createBrowserClient } from "@supabase/auth-helpers-nextjs";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { GraduationCap, LayoutDashboard, Table2, Settings2, LogOut } from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Rankings", icon: LayoutDashboard },
  { href: "/students", label: "Students", icon: Table2 },
  { href: "/requirements", label: "Requirements", icon: Settings2 },
];

export default function NavBar() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const router = useRouter();
  const pathname = usePathname();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="h-12 bg-white border-b border-[#E2DDD6] flex items-center px-5 gap-6 shrink-0 z-10">
      <div className="flex items-center gap-2.5 mr-4">
        <div className="w-7 h-7 rounded-[6px] bg-[#1B3A6B] flex items-center justify-center">
          <GraduationCap className="w-4 h-4 text-white" strokeWidth={1.75} />
        </div>
        <span className="text-[#1B3A6B] font-semibold text-[13px] tracking-tight hidden sm:block">
          Scholarship Mapper
        </span>
      </div>

      <nav className="flex items-center gap-1 flex-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-1.5 px-3 h-8 rounded-[6px] text-[13px] font-semibold transition-colors ${
                active
                  ? "bg-[#1B3A6B]/10 text-[#1B3A6B]"
                  : "text-[#6B7280] hover:text-[#374151] hover:bg-[#F7F6F3]"
              }`}
            >
              <Icon className="w-4 h-4" strokeWidth={1.75} />
              {label}
            </Link>
          );
        })}
      </nav>

      <button
        onClick={handleLogout}
        className="flex items-center gap-1.5 px-3 h-8 rounded-[6px] text-[13px] font-semibold text-[#6B7280] hover:text-[#B03030] hover:bg-[#FAEAEA] transition-colors ml-auto"
      >
        <LogOut className="w-4 h-4" strokeWidth={1.75} />
        <span className="hidden sm:block">Sign out</span>
      </button>
    </header>
  );
}
