"use client";

import { useState, useMemo, useEffect } from "react";
import {
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Search,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import { createBrowserClient } from "@supabase/auth-helpers-nextjs";
import {
  Student,
  RequirementProfile,
  University,
  EligibilityStatus,
  EligibilityResult,
  STATUS_CONFIG,
  PERFORMANCE_LABELS_SHORT,
  AWARD_LABELS,
  AwardValue,
  computeEligibility,
} from "@/lib/types";
import NotesField from "@/components/NotesField";

type SortMode = "score" | "name" | "det";

export default function DashboardPage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [universities, setUniversities] = useState<University[]>([]);
  const [profiles, setProfiles] = useState<RequirementProfile[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedUniId, setSelectedUniId] = useState<string>("");
  const [selectedProfileId, setSelectedProfileId] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<EligibilityStatus | "all">("all");
  const [sortMode, setSortMode] = useState<SortMode>("score");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const [uniRes, profileRes, studentRes] = await Promise.all([
        supabase.from("universities").select("*").order("name"),
        supabase.from("requirement_profiles").select("*, universities(name)").order("track_name"),
        supabase.from("students").select("*").order("name"),
      ]);
      const unis = (uniRes.data ?? []) as University[];
      const profs = (profileRes.data ?? []) as RequirementProfile[];
      const studs = (studentRes.data ?? []) as Student[];

      setUniversities(unis);
      setProfiles(profs);
      setStudents(studs);

      if (unis.length > 0) setSelectedUniId(unis[0].id);
      if (profs.length > 0) setSelectedProfileId(profs[0].id);

      setLoading(false);
    }
    load();
  }, [supabase]);

  const availableProfiles = profiles.filter((p) => p.university_id === selectedUniId);
  const selectedProfile = profiles.find((p) => p.id === selectedProfileId) ?? availableProfiles[0];

  const rankedStudents = useMemo(() => {
    if (!selectedProfile) return [];
    return students
      .filter((s) => s.name.toLowerCase().includes(search.toLowerCase()))
      .map((s) => ({ student: s, result: computeEligibility(s, selectedProfile) }))
      .filter(({ result }) => filterStatus === "all" || result.status === filterStatus)
      .sort((a, b) => {
        if (sortMode === "score") return b.result.score - a.result.score;
        if (sortMode === "det") return b.student.det_score - a.student.det_score;
        return a.student.name.localeCompare(b.student.name);
      });
  }, [selectedProfile, filterStatus, sortMode, search, students]);

  const counts = useMemo(() => {
    if (!selectedProfile) return { recommended: 0, negotiable: 0, ineligible: 0 };
    const all = students.map((s) => computeEligibility(s, selectedProfile));
    return {
      recommended: all.filter((r) => r.status === "recommended").length,
      negotiable: all.filter((r) => r.status === "negotiable").length,
      ineligible: all.filter((r) => r.status === "ineligible").length,
    };
  }, [selectedProfile, students]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-3rem)]">
        <Loader2 className="w-6 h-6 text-[#1B3A6B] animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-3rem)] overflow-hidden bg-[#F8F7F4]">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 bg-white border-r border-[#E2DDD6] flex flex-col overflow-y-auto">
        <div className="px-5 py-5 border-b border-[#E2DDD6]">
          <div className="flex items-center gap-2 mb-4">
            <SlidersHorizontal className="w-4 h-4 text-[#1B3A6B]" strokeWidth={1.75} />
            <span className="text-[13px] font-semibold text-[#1B3A6B]">Filters</span>
          </div>

          {/* University picker */}
          <div className="mb-4">
            <label className="block text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-1.5">
              University
            </label>
            <select
              value={selectedUniId}
              onChange={(e) => {
                setSelectedUniId(e.target.value);
                const firstProfile = profiles.find((p) => p.university_id === e.target.value);
                if (firstProfile) setSelectedProfileId(firstProfile.id);
              }}
              className="w-full h-8 px-2.5 rounded-[6px] border border-[#E2DDD6] bg-white text-[13px] text-[#374151] focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/20 focus:border-[#1B3A6B]"
            >
              {universities.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>

          {/* Track picker */}
          <div className="mb-4">
            <label className="block text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-1.5">
              Track
            </label>
            <select
              value={selectedProfileId}
              onChange={(e) => setSelectedProfileId(e.target.value)}
              className="w-full h-8 px-2.5 rounded-[6px] border border-[#E2DDD6] bg-white text-[13px] text-[#374151] focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/20 focus:border-[#1B3A6B]"
            >
              {availableProfiles.map((p) => (
                <option key={p.id} value={p.id}>{p.track_name}</option>
              ))}
            </select>
          </div>

          {/* Status filter */}
          <div className="mb-4">
            <label className="block text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-1.5">
              Status
            </label>
            {(["all", "recommended", "negotiable", "ineligible"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`w-full text-left px-2.5 h-8 rounded-[6px] text-[13px] mb-0.5 flex items-center gap-2 transition-colors ${
                  filterStatus === s
                    ? "bg-[#1B3A6B]/10 text-[#1B3A6B] font-semibold"
                    : "text-[#6B7280] hover:bg-[#F7F6F3]"
                }`}
              >
                {s !== "all" && (
                  <span className={`w-2 h-2 rounded-full ${STATUS_CONFIG[s as EligibilityStatus].dot}`} />
                )}
                {s === "all" ? "All students" : STATUS_CONFIG[s as EligibilityStatus].label}
              </button>
            ))}
          </div>

          {/* Sort */}
          <div>
            <label className="block text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-1.5">
              Sort by
            </label>
            <select
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as SortMode)}
              className="w-full h-8 px-2.5 rounded-[6px] border border-[#E2DDD6] bg-white text-[13px] text-[#374151] focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/20 focus:border-[#1B3A6B]"
            >
              <option value="score">Eligibility score</option>
              <option value="det">DET score</option>
              <option value="name">Name (A–Z)</option>
            </select>
          </div>
        </div>

        {/* Summary counts */}
        <div className="px-5 py-5">
          <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-3">Summary</p>
          {(["recommended", "negotiable", "ineligible"] as EligibilityStatus[]).map((s) => {
            const cfg = STATUS_CONFIG[s];
            return (
              <div key={s} className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                  <span className="text-[13px] text-[#6B7280]">{cfg.label}</span>
                </div>
                <span className="text-[13px] font-semibold text-[#374151]">{counts[s]}</span>
              </div>
            );
          })}
          <div className="mt-3 pt-3 border-t border-[#E2DDD6] flex items-center justify-between">
            <span className="text-[13px] text-[#6B7280]">Total</span>
            <span className="text-[13px] font-semibold text-[#374151]">{students.length}</span>
          </div>
        </div>
      </aside>

      {/* Main panel */}
      <main className="flex-1 overflow-y-auto">
        <div className="sticky top-0 bg-[#F8F7F4] border-b border-[#E2DDD6] px-6 py-3 flex items-center gap-3 z-10">
          <h1 className="text-[15px] font-semibold text-[#111827] mr-auto">
            {universities.find((u) => u.id === selectedUniId)?.name}
            <span className="text-[#9CA3AF] font-normal mx-2">·</span>
            <span className="text-[#6B7280] font-normal">{selectedProfile?.track_name}</span>
          </h1>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9CA3AF]" />
            <input
              type="text"
              placeholder="Search students…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 h-8 w-52 rounded-[6px] border border-[#E2DDD6] bg-white text-[13px] placeholder-[#9CA3AF] text-[#374151] focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/20 focus:border-[#1B3A6B]"
            />
          </div>
          <span className="text-[13px] text-[#9CA3AF]">{rankedStudents.length} students</span>
        </div>

        <div className="px-6 py-5 space-y-2.5">
          {rankedStudents.length === 0 && (
            <div className="text-center py-20 text-[#9CA3AF] text-[14px]">
              No students match the current filters.
            </div>
          )}
          {rankedStudents.map(({ student, result }, index) => (
            <StudentCard
              key={student.id}
              rank={index + 1}
              student={student}
              result={result}
              profile={selectedProfile}
              expanded={expandedId === student.id}
              onToggle={() => setExpandedId(expandedId === student.id ? null : student.id)}
            />
          ))}
        </div>
      </main>
    </div>
  );
}

function StudentCard({
  rank,
  student,
  result,
  profile,
  expanded,
  onToggle,
}: {
  rank: number;
  student: Student;
  result: EligibilityResult;
  profile: RequirementProfile;
  expanded: boolean;
  onToggle: () => void;
}) {
  const cfg = STATUS_CONFIG[result.status];
  const StatusIcon =
    result.status === "recommended" ? CheckCircle2 : result.status === "negotiable" ? AlertCircle : XCircle;

  const initials = student.name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <div
      className={`bg-white rounded-[8px] border border-[#E2DDD6] overflow-hidden transition-shadow ${
        expanded ? "shadow-card" : "hover:border-[#CBD5E0]"
      }`}
    >
      <button onClick={onToggle} className="w-full flex items-center gap-4 px-5 py-3.5 text-left group">
        <span className="w-6 text-[12px] font-semibold text-[#9CA3AF] text-right shrink-0">{rank}</span>

        <div className="w-8 h-8 rounded-full bg-[#1B3A6B]/10 flex items-center justify-center shrink-0">
          <span className="text-[11px] font-semibold text-[#1B3A6B]">{initials}</span>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-semibold text-[#111827] truncate">{student.name}</p>
          <p className="text-[12px] text-[#9CA3AF]">{student.student_code}</p>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <div className="text-right">
            <p className="text-[12px] text-[#9CA3AF]">Award</p>
            <p className="text-[13px] font-semibold text-[#374151]">{AWARD_LABELS[student.award_level]}</p>
          </div>
          <div className="text-right">
            <p className="text-[12px] text-[#9CA3AF]">DET</p>
            <p className="text-[13px] font-semibold text-[#374151]">{student.det_score}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span
            className={`px-2 py-0.5 rounded-[6px] text-[11px] font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}
          >
            {profile.track_name} · {result.score > 0 ? "+" : ""}{result.score.toFixed(1)}
          </span>
        </div>

        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] border text-[12px] font-semibold shrink-0 ${cfg.bg} ${cfg.text} ${cfg.border}`}
        >
          <StatusIcon className="w-3.5 h-3.5" strokeWidth={2} />
          {cfg.label}
          {result.status === "negotiable" && (
            <span className="ml-1 px-1.5 py-0.5 bg-[#C07400] text-white rounded text-[10px]">Negotiate</span>
          )}
        </div>

        <div className="shrink-0 text-[#9CA3AF] group-hover:text-[#374151] transition-colors">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-[#E2DDD6] px-5 py-5 bg-[#FAFAF9]">
          <div className="grid grid-cols-2 gap-6 mb-6">
            {/* Breakdown */}
            <div>
              <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-3">
                Breakdown vs {profile.track_name}
              </p>

              {/* Award row */}
              <BreakdownRow
                label="Award level"
                studentVal={AWARD_LABELS[student.award_level]}
                requiredVal={AWARD_LABELS[profile.min_award as AwardValue]}
                gap={result.awardGap}
                counted
              />
              {/* DET row */}
              <BreakdownRow
                label="DET score"
                studentVal={String(student.det_score)}
                requiredVal={`≥ ${profile.min_det}`}
                gap={result.detGap}
                counted={profile.min_det > 0}
              />
              {/* Subject rows */}
              {result.subjects.map((s) => (
                <BreakdownRow
                  key={s.key}
                  label={s.label}
                  studentVal={PERFORMANCE_LABELS_SHORT[s.studentVal]}
                  requiredVal={PERFORMANCE_LABELS_SHORT[s.requiredVal]}
                  gap={s.gap}
                  counted={s.counted}
                />
              ))}

              {/* Verdict bar */}
              <div className={`mt-4 px-4 py-2.5 rounded-[6px] ${cfg.bg} border ${cfg.border} flex items-center justify-between`}>
                <span className={`text-[13px] font-semibold ${cfg.text}`}>{cfg.label}</span>
                <span className={`text-[13px] font-semibold ${cfg.text}`}>
                  Score: {result.score > 0 ? "+" : ""}{result.score.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Advisor notes */}
            <div>
              <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" />
                Advisor notes
              </p>
              <NotesField studentId={student.id} profileId={profile.id} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BreakdownRow({
  label,
  studentVal,
  requiredVal,
  gap,
  counted,
}: {
  label: string;
  studentVal: string;
  requiredVal: string;
  gap: number;
  counted: boolean;
}) {
  const met = gap >= 0;
  return (
    <div className="flex items-center justify-between py-2 border-b border-[#E2DDD6] last:border-0">
      <span className="text-[13px] text-[#374151] flex-1">{label}</span>
      <div className="flex items-center gap-3 text-right">
        {counted && (
          <span className="text-[12px] text-[#9CA3AF] w-20">req: {requiredVal}</span>
        )}
        <span className={`text-[13px] font-semibold w-24 text-right ${!counted ? "text-[#9CA3AF]" : met ? "text-[#2D7D5A]" : "text-[#B03030]"}`}>
          {studentVal}
        </span>
        {counted ? (
          met ? (
            <CheckCircle2 className="w-4 h-4 text-[#2D7D5A]" strokeWidth={2} />
          ) : (
            <XCircle className="w-4 h-4 text-[#B03030]" strokeWidth={2} />
          )
        ) : (
          <span className="w-4 h-4 flex items-center justify-center text-[#9CA3AF] text-[11px]">—</span>
        )}
      </div>
    </div>
  );
}
