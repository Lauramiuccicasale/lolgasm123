"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Trash2, Check, X, ChevronUp, ChevronDown, Loader2 } from "lucide-react";
import { createBrowserClient } from "@supabase/auth-helpers-nextjs";
import {
  Student,
  SUBJECTS,
  PERFORMANCE_LABELS,
  AWARD_LEVELS,
  AwardValue,
  PerformanceLevel,
} from "@/lib/types";

const SEED_STUDENTS = [
  { student_code: "A-A-011108", name: "Afraa Al-abdullahDistinction", award_level: 3, det_score: 125, maths: 3, sci: 4, arabic: 3, english: 4, lss: 4 },
  { student_code: "A-A-260506", name: "Abdalkhaleq Ahmad", award_level: 2, det_score: 100, maths: 4, sci: 3, arabic: 3, english: 2, lss: 2 },
  { student_code: "A-A-010805", name: "Amal Alkhalaf", award_level: 1, det_score: 90, maths: 3, sci: 2, arabic: 2, english: 2, lss: 2 },
  { student_code: "D-H-100108", name: "Dalal Hasan", award_level: 2, det_score: 95, maths: 3, sci: 4, arabic: 3, english: 3, lss: 4 },
  { student_code: "E-H-100108", name: "Elaf Houran", award_level: 1, det_score: 85, maths: 2, sci: 2, arabic: 2, english: 2, lss: 1 },
  { student_code: "F-A-120705", name: "Fatima Alissa", award_level: 1, det_score: 0, maths: 2, sci: 2, arabic: 2, english: 2, lss: 2 },
  { student_code: "F-A-010603", name: "Fatima Aljassem", award_level: 3, det_score: 100, maths: 3, sci: 4, arabic: 3, english: 4, lss: 4 },
  { student_code: "H-A-250907", name: "Hussein Alzeyab", award_level: 2, det_score: 0, maths: 2, sci: 3, arabic: 2, english: 3, lss: 4 },
  { student_code: "L-A-051006", name: "Louay Alkadro", award_level: 1, det_score: 105, maths: 2, sci: 2, arabic: 2, english: 2, lss: 2 },
  { student_code: "M-F-060208", name: "Marah Fadel", award_level: 1, det_score: 85, maths: 2, sci: 3, arabic: 3, english: 2, lss: 2 },
  { student_code: "M-A-010107", name: "Maram Alkhoder", award_level: 1, det_score: 100, maths: 2, sci: 2, arabic: 2, english: 2, lss: 4 },
  { student_code: "M-A-310503", name: "Marwa Al Omar", award_level: 1, det_score: 110, maths: 2, sci: 2, arabic: 2, english: 3, lss: 4 },
  { student_code: "N-A-010103", name: "Nour Al Issa", award_level: 1, det_score: 105, maths: 2, sci: 2, arabic: 2, english: 3, lss: 4 },
  { student_code: "N-Z-010106", name: "Nour Alhoda Zaqzaq", award_level: 2, det_score: 95, maths: 2, sci: 3, arabic: 3, english: 2, lss: 3 },
  { student_code: "O-A-010107", name: "Oula Al Khalaf", award_level: 1, det_score: 85, maths: 2, sci: 2, arabic: 2, english: 3, lss: 4 },
  { student_code: "S-A-300503", name: "Safa Alomar", award_level: 2, det_score: 110, maths: 2, sci: 4, arabic: 3, english: 2, lss: 3 },
  { student_code: "W-A-200807", name: "Wesal Aljabr", award_level: 2, det_score: 125, maths: 2, sci: 4, arabic: 3, english: 4, lss: 3 },
];

const BLANK_STUDENT = (): Omit<Student, "id" | "created_at"> => ({
  student_code: "",
  name: "",
  award_level: 1,
  det_score: 0,
  maths: 2,
  sci: 2,
  arabic: 2,
  english: 2,
  lss: 2,
});

type SortField = "name" | "det_score" | "award_level";

export default function StudentsPage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBuffer, setEditBuffer] = useState<Student | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const inputRef = useRef<HTMLInputElement>(null);

  async function loadStudents() {
    const { data } = await supabase.from("students").select("*").order("name");
    const studs = (data ?? []) as Student[];

    if (studs.length === 0) {
      const { data: seeded } = await supabase
        .from("students")
        .insert(SEED_STUDENTS)
        .select();
      setStudents((seeded ?? []) as Student[]);
    } else {
      setStudents(studs);
    }
    setLoading(false);
  }

  useEffect(() => { loadStudents(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function startEdit(student: Student) {
    setEditingId(student.id);
    setEditBuffer({ ...student });
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function cancelEdit() {
    if (editingId && editingId.startsWith("temp-")) {
      setStudents((s) => s.filter((x) => x.id !== editingId));
    }
    setEditingId(null);
    setEditBuffer(null);
  }

  async function saveEdit() {
    if (!editBuffer) return;
    setSavingId(editBuffer.id);

    const isNew = editBuffer.id.startsWith("temp-");
    const payload = {
      student_code: editBuffer.student_code,
      name: editBuffer.name,
      award_level: editBuffer.award_level,
      det_score: editBuffer.det_score,
      maths: editBuffer.maths,
      sci: editBuffer.sci,
      arabic: editBuffer.arabic,
      english: editBuffer.english,
      lss: editBuffer.lss,
    };

    if (isNew) {
      const { data } = await supabase.from("students").insert(payload).select().single();
      if (data) {
        setStudents((s) => s.map((x) => (x.id === editBuffer.id ? (data as Student) : x)));
      }
    } else {
      await supabase.from("students").update(payload).eq("id", editBuffer.id);
      setStudents((s) => s.map((x) => (x.id === editBuffer.id ? { ...editBuffer } : x)));
    }

    setSavingId(null);
    setEditingId(null);
    setEditBuffer(null);
  }

  async function deleteStudent(id: string) {
    if (!confirm("Remove this student?")) return;
    setDeletingId(id);
    await supabase.from("students").delete().eq("id", id);
    setStudents((s) => s.filter((x) => x.id !== id));
    setDeletingId(null);
  }

  function addRow() {
    const tempId = `temp-${Date.now()}`;
    const blank: Student = { id: tempId, created_at: "", ...BLANK_STUDENT() };
    setStudents((s) => [...s, blank]);
    startEdit(blank);
  }

  function updateBuffer<K extends keyof Student>(key: K, value: Student[K]) {
    setEditBuffer((b) => (b ? { ...b, [key]: value } : b));
  }

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  }

  const sorted = [...students].sort((a, b) => {
    let diff = 0;
    if (sortField === "name") diff = a.name.localeCompare(b.name);
    if (sortField === "det_score") diff = a.det_score - b.det_score;
    if (sortField === "award_level") diff = a.award_level - b.award_level;
    return sortDir === "asc" ? diff : -diff;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-3rem)]">
        <Loader2 className="w-6 h-6 text-[#1B3A6B] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-3rem)] bg-[#F8F7F4]">
      <div className="bg-white border-b border-[#E2DDD6] px-8 py-5 flex items-center justify-between">
        <div>
          <h1 className="text-[18px] font-semibold text-[#111827]">Student cohort</h1>
          <p className="text-[13px] text-[#9CA3AF] mt-0.5">
            {students.length} students · Click any row to edit inline
          </p>
        </div>
        <button
          onClick={addRow}
          className="flex items-center gap-1.5 px-4 h-8 rounded-[6px] bg-[#1B3A6B] hover:bg-[#15305A] text-white text-[13px] font-semibold transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add student
        </button>
      </div>

      <div className="px-8 py-6 overflow-x-auto">
        <div className="bg-white rounded-[8px] border border-[#E2DDD6] overflow-hidden">
          <table className="w-full text-[13px] border-collapse">
            <thead>
              <tr className="border-b border-[#E2DDD6]">
                <Th>Code</Th>
                <Th sortable onSort={() => handleSort("name")} dir={sortField === "name" ? sortDir : null}>Name</Th>
                <Th sortable onSort={() => handleSort("award_level")} dir={sortField === "award_level" ? sortDir : null}>Award</Th>
                <Th sortable onSort={() => handleSort("det_score")} dir={sortField === "det_score" ? sortDir : null}>DET</Th>
                {SUBJECTS.map(({ label }) => <Th key={label}>{label}</Th>)}
                <Th></Th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((student) => {
                const isEditing = editingId === student.id;
                const buf = isEditing ? editBuffer! : student;
                const isSaving = savingId === student.id;
                const isDeleting = deletingId === student.id;

                return (
                  <tr
                    key={student.id}
                    onClick={() => !isEditing && startEdit(student)}
                    className={`border-b border-[#E2DDD6] last:border-0 transition-colors group ${
                      isEditing ? "bg-[#EEF2F9]" : "hover:bg-[#FAFAF9] cursor-pointer"
                    }`}
                  >
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      {isEditing ? (
                        <input
                          ref={inputRef}
                          value={buf.student_code}
                          onChange={(e) => updateBuffer("student_code", e.target.value)}
                          className={cellInputCls}
                          placeholder="A-B-010101"
                        />
                      ) : (
                        <span className="text-[#9CA3AF] font-mono text-[12px]">{student.student_code}</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap font-semibold text-[#111827]">
                      {isEditing ? (
                        <input
                          value={buf.name}
                          onChange={(e) => updateBuffer("name", e.target.value)}
                          className={cellInputCls}
                          placeholder="Full name"
                        />
                      ) : (
                        student.name
                      )}
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      {isEditing ? (
                        <select
                          value={buf.award_level}
                          onChange={(e) => updateBuffer("award_level", Number(e.target.value) as AwardValue)}
                          className={cellInputCls}
                        >
                          {AWARD_LEVELS.map(({ value, label }) => (
                            <option key={value} value={value}>{label}</option>
                          ))}
                        </select>
                      ) : (
                        <AwardBadge level={student.award_level as AwardValue} />
                      )}
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap text-[#374151]">
                      {isEditing ? (
                        <input
                          type="number"
                          min={0}
                          value={buf.det_score}
                          onChange={(e) => updateBuffer("det_score", Number(e.target.value))}
                          className={`${cellInputCls} w-20`}
                        />
                      ) : (
                        student.det_score
                      )}
                    </td>
                    {SUBJECTS.map(({ key }) => {
                      const val = (isEditing ? buf : student)[key as keyof Student] as PerformanceLevel;
                      return (
                        <td key={key} className="px-4 py-2.5 whitespace-nowrap">
                          {isEditing ? (
                            <select
                              value={val}
                              onChange={(e) => updateBuffer(key as keyof Student, Number(e.target.value) as PerformanceLevel)}
                              className={cellInputCls}
                            >
                              {([4, 3, 2, 1] as PerformanceLevel[]).map((l) => (
                                <option key={l} value={l}>{PERFORMANCE_LABELS[l]}</option>
                              ))}
                            </select>
                          ) : (
                            <PerfChip level={student[key as keyof Student] as PerformanceLevel} />
                          )}
                        </td>
                      );
                    })}
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      {isEditing ? (
                        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={saveEdit}
                            disabled={isSaving}
                            className="w-7 h-7 rounded-[6px] bg-[#1B3A6B] flex items-center justify-center text-white hover:bg-[#15305A] transition-colors disabled:opacity-60"
                          >
                            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="w-7 h-7 rounded-[6px] border border-[#E2DDD6] flex items-center justify-center text-[#6B7280] hover:border-[#B03030] hover:text-[#B03030] transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteStudent(student.id); }}
                          disabled={isDeleting}
                          className="w-7 h-7 rounded-[6px] border border-transparent flex items-center justify-center text-[#9CA3AF] hover:border-[#B03030] hover:text-[#B03030] hover:bg-[#FAEAEA] transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-60"
                        >
                          {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {students.length === 0 && (
            <div className="py-16 text-center text-[14px] text-[#9CA3AF]">
              No students yet.{" "}
              <button onClick={addRow} className="text-[#1B3A6B] font-semibold hover:underline">
                Add the first student
              </button>
            </div>
          )}
        </div>
        <button
          onClick={addRow}
          className="mt-3 flex items-center gap-1.5 text-[13px] text-[#6B7280] hover:text-[#1B3A6B] transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add student
        </button>
      </div>
    </div>
  );
}

const cellInputCls =
  "h-7 px-2 rounded-[6px] border border-[#1B3A6B]/30 bg-white text-[13px] text-[#374151] focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/20 focus:border-[#1B3A6B] w-full";

function Th({ children, sortable, onSort, dir }: { children?: React.ReactNode; sortable?: boolean; onSort?: () => void; dir?: "asc" | "desc" | null }) {
  return (
    <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider bg-[#FAFAF9]">
      {sortable ? (
        <button onClick={onSort} className="flex items-center gap-1 hover:text-[#374151] transition-colors">
          {children}
          {dir === "asc" ? <ChevronUp className="w-3 h-3" /> : dir === "desc" ? <ChevronDown className="w-3 h-3" /> : <span className="w-3 h-3" />}
        </button>
      ) : children}
    </th>
  );
}

const AWARD_STYLE: Record<AwardValue, string> = {
  3: "bg-[#FFF8E0] text-[#92680A] border-[#F0C040]/50",
  2: "bg-[#F2F4F7] text-[#4B5563] border-[#D1D5DB]",
  1: "bg-[#FFF1EB] text-[#92400E] border-[#FBBF85]/50",
};

const AWARD_LABEL_SHORT: Record<AwardValue, string> = {
  3: "Distinction",
  2: "Advanced",
  1: "Secondary",
};

function AwardBadge({ level }: { level: AwardValue }) {
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-[6px] border text-[11px] font-semibold ${AWARD_STYLE[level]}`}>
      {AWARD_LABEL_SHORT[level]}
    </span>
  );
}

const PERF_STYLE: Record<PerformanceLevel, string> = {
  4: "text-[#2D7D5A]",
  3: "text-[#1B3A6B]",
  2: "text-[#C07400]",
  1: "text-[#B03030]",
};

const PERF_SHORT: Record<PerformanceLevel, string> = {
  4: "Outstanding",
  3: "Exceeds",
  2: "Meets",
  1: "Doesn't meet",
};

function PerfChip({ level }: { level: PerformanceLevel }) {
  return <span className={`text-[12px] font-semibold ${PERF_STYLE[level]}`}>{PERF_SHORT[level]}</span>;
}
