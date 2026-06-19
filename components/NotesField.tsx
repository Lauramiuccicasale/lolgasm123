"use client";

import { useState, useEffect, useCallback } from "react";
import { createBrowserClient } from "@supabase/auth-helpers-nextjs";
import { Loader2, Save } from "lucide-react";

interface NotesFieldProps {
  studentId: string;
  profileId: string;
}

export default function NotesField({ studentId, profileId }: NotesFieldProps) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const { data } = await supabase
        .from("advisor_notes")
        .select("note_text")
        .eq("student_id", studentId)
        .eq("profile_id", profileId)
        .maybeSingle();

      if (!cancelled) {
        const text = data?.note_text ?? "";
        setNote(text);
        setSaved(text);
        setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [studentId, profileId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = useCallback(async () => {
    if (note === saved) return;
    setSaving(true);
    await supabase.from("advisor_notes").upsert(
      { student_id: studentId, profile_id: profileId, note_text: note },
      { onConflict: "student_id,profile_id" }
    );
    setSaved(note);
    setLastSaved(new Date());
    setSaving(false);
  }, [note, saved, studentId, profileId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="h-24 rounded-[6px] border border-[#E2DDD6] bg-white flex items-center justify-center">
        <Loader2 className="w-4 h-4 text-[#9CA3AF] animate-spin" />
      </div>
    );
  }

  const isDirty = note !== saved;

  return (
    <div className="space-y-2">
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        onBlur={handleSave}
        placeholder="Add notes about this student's application — personal statement strength, negotiation flags, context…"
        rows={5}
        className="w-full px-3 py-2.5 rounded-[6px] border border-[#E2DDD6] bg-white text-[13px] text-[#374151] placeholder-[#9CA3AF] resize-none leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/20 focus:border-[#1B3A6B] transition-colors"
      />
      <div className="flex items-center justify-between">
        <p className="text-[12px] text-[#9CA3AF]">
          {lastSaved
            ? `Saved ${lastSaved.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
            : "Auto-saves on blur"}
        </p>
        <button
          onClick={handleSave}
          disabled={!isDirty || saving}
          className={`flex items-center gap-1.5 px-3 h-7 rounded-[6px] text-[12px] font-semibold transition-colors ${
            isDirty
              ? "bg-[#1B3A6B] text-white hover:bg-[#15305A]"
              : "bg-[#F7F6F3] text-[#9CA3AF] cursor-default"
          } disabled:opacity-60`}
        >
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
          Save note
        </button>
      </div>
    </div>
  );
}
