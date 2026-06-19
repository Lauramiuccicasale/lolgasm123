"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Save, ChevronRight, Building2, Loader2, Copy } from "lucide-react";
import { createBrowserClient } from "@supabase/auth-helpers-nextjs";
import {
  SUBJECTS,
  PERFORMANCE_LABELS,
  AWARD_LEVELS,
  AwardValue,
  RequirementProfile,
  University,
  PerformanceLevel,
} from "@/lib/types";

type FormState = {
  university_name: string;
  track_name: string;
  min_award: AwardValue;
  min_det: number;
  min_maths: PerformanceLevel;
  min_sci: PerformanceLevel;
  min_arabic: PerformanceLevel;
  min_english: PerformanceLevel;
  min_lss: PerformanceLevel;
};

const BLANK_FORM: FormState = {
  university_name: "",
  track_name: "",
  min_award: 2,
  min_det: 0,
  min_maths: 1,
  min_sci: 1,
  min_arabic: 1,
  min_english: 1,
  min_lss: 1,
};

export default function RequirementsPage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [universities, setUniversities] = useState<University[]>([]);
  const [profiles, setProfiles] = useState<RequirementProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | "new">("new");
  const [form, setForm] = useState<FormState>({ ...BLANK_FORM });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function loadData() {
    const [uniRes, profileRes] = await Promise.all([
      supabase.from("universities").select("*").order("name"),
      supabase.from("requirement_profiles").select("*, universities(name)").order("track_name"),
    ]);
    setUniversities((uniRes.data ?? []) as University[]);
    setProfiles((profileRes.data ?? []) as RequirementProfile[]);
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function selectProfile(p: RequirementProfile) {
    const uniName = (p.universities as unknown as { name: string })?.name ?? universities.find((u) => u.id === p.university_id)?.name ?? "";
    setSelectedId(p.id);
    setForm({
      university_name: uniName,
      track_name: p.track_name,
      min_award: p.min_award as AwardValue,
      min_det: p.min_det,
      min_maths: p.min_maths,
      min_sci: p.min_sci,
      min_arabic: p.min_arabic,
      min_english: p.min_english,
      min_lss: p.min_lss,
    });
  }

  function newProfile() {
    setSelectedId("new");
    setForm({ ...BLANK_FORM });
  }

  function updateForm<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function getOrCreateUniversity(name: string): Promise<string> {
    const existing = universities.find((u) => u.name.toLowerCase() === name.toLowerCase());
    if (existing) return existing.id;

    const { data, error } = await supabase
      .from("universities")
      .insert({ name: name.trim() })
      .select()
      .single();

    if (error) throw error;
    return data.id;
  }

  async function handleSave() {
    if (!form.university_name.trim() || !form.track_name.trim()) return;
    setSaving(true);

    try {
      const universityId = await getOrCreateUniversity(form.university_name);
      const payload = {
        university_id: universityId,
        track_name: form.track_name,
        min_award: form.min_award,
        min_det: form.min_det,
        min_maths: form.min_maths,
        min_sci: form.min_sci,
        min_arabic: form.min_arabic,
        min_english: form.min_english,
        min_lss: form.min_lss,
      };

      if (selectedId === "new") {
        const { data } = await supabase.from("requirement_profiles").insert(payload).select().single();
        if (data) setSelectedId(data.id);
      } else {
        await supabase.from("requirement_profiles").update(payload).eq("id", selectedId);
      }

      await loadData();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (selectedId === "new") return;
    if (!confirm("Delete this requirement profile? This cannot be undone.")) return;
    await supabase.from("requirement_profiles").delete().eq("id", selectedId);
    await loadData();
    newProfile();
  }

  async function handleDuplicate() {
    if (selectedId === "new") return;
    const p = profiles.find((x) => x.id === selectedId);
    if (!p) return;
    const uniName = (p.universities as unknown as { name: string })?.name ?? universities.find((u) => u.id === p.university_id)?.name ?? "";
    setSelectedId("new");
    setForm({
      university_name: uniName,
      track_name: `${p.track_name} (copy)`,
      min_award: p.min_award as AwardValue,
      min_det: p.min_det,
      min_maths: p.min_maths,
      min_sci: p.min_sci,
      min_arabic: p.min_arabic,
      min_english: p.min_english,
      min_lss: p.min_lss,
    });
  }

  const groupedByUni = universities.map((uni) => ({
    uni,
    profiles: profiles.filter((p) => p.university_id === uni.id),
  })).filter((g) => g.profiles.length > 0);

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
      <aside className="w-64 shrink-0 bg-white border-r border-[#E2DDD6] flex flex-col overflow-hidden">
        <div className="px-4 py-4 border-b border-[#E2DDD6] flex items-center justify-between">
          <span className="text-[13px] font-semibold text-[#1B3A6B] flex items-center gap-2">
            <Building2 className="w-4 h-4" strokeWidth={1.75} />
            Profiles
          </span>
          <button
            onClick={newProfile}
            className="w-7 h-7 rounded-[6px] bg-[#1B3A6B] flex items-center justify-center hover:bg-[#15305A] transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-white" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {selectedId === "new" && (
            <div className="px-4 py-2.5 bg-[#1B3A6B]/10 border-l-2 border-[#1B3A6B]">
              <span className="text-[13px] font-semibold text-[#1B3A6B]">New profile</span>
            </div>
          )}
          {groupedByUni.map(({ uni, profiles: uniProfiles }) => (
            <div key={uni.id} className="mb-1">
              <p className="px-4 py-1.5 text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider">
                {uni.name}
              </p>
              {uniProfiles.map((p) => (
                <button
                  key={p.id}
                  onClick={() => selectProfile(p)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors ${
                    selectedId === p.id
                      ? "bg-[#1B3A6B]/10 text-[#1B3A6B] border-l-2 border-[#1B3A6B]"
                      : "text-[#374151] hover:bg-[#F7F6F3]"
                  }`}
                >
                  <span className="text-[13px] font-semibold truncate">{p.track_name}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-[#9CA3AF] shrink-0 ml-2" />
                </button>
              ))}
            </div>
          ))}
          {groupedByUni.length === 0 && selectedId !== "new" && (
            <p className="px-4 py-4 text-[13px] text-[#9CA3AF]">No profiles yet.</p>
          )}
        </div>
      </aside>

      {/* Editor */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-8 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-[18px] font-semibold text-[#111827]">
                {selectedId === "new" ? "New requirement profile" : form.track_name || "Edit profile"}
              </h1>
              {selectedId !== "new" && form.university_name && (
                <p className="text-[13px] text-[#9CA3AF] mt-0.5">{form.university_name}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {selectedId !== "new" && (
                <>
                  <button
                    onClick={handleDuplicate}
                    className="flex items-center gap-1.5 px-3 h-8 rounded-[6px] border border-[#E2DDD6] text-[13px] text-[#6B7280] hover:bg-[#F7F6F3] transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Duplicate
                  </button>
                  <button
                    onClick={handleDelete}
                    className="flex items-center gap-1.5 px-3 h-8 rounded-[6px] border border-[#E2DDD6] text-[13px] text-[#B03030] hover:bg-[#FAEAEA] hover:border-[#B03030] transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </>
              )}
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1.5 px-4 h-8 rounded-[6px] bg-[#1B3A6B] hover:bg-[#15305A] text-white text-[13px] font-semibold transition-colors disabled:opacity-60"
              >
                {saving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : saved ? (
                  "Saved"
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    Save profile
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <Section title="Profile details">
              <div className="grid grid-cols-2 gap-4">
                <Field label="University name">
                  <input
                    type="text"
                    value={form.university_name}
                    onChange={(e) => updateForm("university_name", e.target.value)}
                    placeholder="e.g. University of Leicester"
                    className={inputCls}
                    list="universities-list"
                  />
                  <datalist id="universities-list">
                    {universities.map((u) => <option key={u.id} value={u.name} />)}
                  </datalist>
                </Field>
                <Field label="Track name">
                  <input
                    type="text"
                    value={form.track_name}
                    onChange={(e) => updateForm("track_name", e.target.value)}
                    placeholder="e.g. STEM International"
                    className={inputCls}
                  />
                </Field>
              </div>
            </Section>

            <Section title="Minimum thresholds">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Minimum award level">
                  <select
                    value={form.min_award}
                    onChange={(e) => updateForm("min_award", Number(e.target.value) as AwardValue)}
                    className={inputCls}
                  >
                    {AWARD_LEVELS.map(({ value, label }) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Minimum DET score (0 = no requirement)">
                  <input
                    type="number"
                    min={0}
                    value={form.min_det}
                    onChange={(e) => updateForm("min_det", Number(e.target.value))}
                    className={inputCls}
                  />
                </Field>
              </div>
            </Section>

            <Section
              title="Subject minimums"
              description="Set to 'Does not yet meet expectations' (1) to exclude a subject from scoring."
            >
              <div className="space-y-3">
                {SUBJECTS.map(({ key, label }) => {
                  const formKey = `min_${key}` as keyof FormState;
                  const val = form[formKey] as PerformanceLevel;
                  return (
                    <div key={key} className="flex items-center justify-between gap-4">
                      <label className="text-[14px] text-[#374151] w-36 shrink-0">{label}</label>
                      <div className="flex items-center gap-1 flex-wrap">
                        {([1, 2, 3, 4] as PerformanceLevel[]).map((level) => (
                          <button
                            key={level}
                            onClick={() => updateForm(formKey, level as FormState[keyof FormState])}
                            className={`px-2.5 py-1.5 rounded-[6px] text-[12px] font-semibold border transition-colors ${
                              val === level
                                ? "bg-[#1B3A6B] border-[#1B3A6B] text-white"
                                : "border-[#E2DDD6] text-[#6B7280] hover:border-[#1B3A6B] hover:text-[#1B3A6B]"
                            }`}
                          >
                            {level === 1 ? "None" : level === 2 ? "Meets" : level === 3 ? "Exceeds" : "Outstanding"}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Section>

            <Section title="Profile summary">
              <div className="bg-[#F8F7F4] rounded-[8px] p-4 border border-[#E2DDD6]">
                <div className="flex flex-wrap gap-2">
                  <Pill label="Award" value={AWARD_LEVELS.find((a) => a.value === form.min_award)?.label ?? ""} />
                  <Pill label="DET" value={form.min_det > 0 ? `≥ ${form.min_det}` : "No min"} />
                  {SUBJECTS.map(({ key, label }) => {
                    const val = form[`min_${key}` as keyof FormState] as PerformanceLevel;
                    return (
                      <Pill
                        key={key}
                        label={label.split(" ")[0]}
                        value={val === 1 ? "No req" : PERFORMANCE_LABELS[val]}
                      />
                    );
                  })}
                </div>
              </div>
            </Section>
          </div>
        </div>
      </main>
    </div>
  );
}

const inputCls =
  "w-full h-9 px-3 rounded-[6px] border border-[#E2DDD6] bg-white text-[14px] text-[#374151] focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/20 focus:border-[#1B3A6B] transition-colors";

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-[8px] border border-[#E2DDD6] p-6">
      <div className="mb-4">
        <h2 className="text-[14px] font-semibold text-[#111827]">{title}</h2>
        {description && <p className="text-[13px] text-[#6B7280] mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[13px] font-semibold text-[#374151]">{label}</label>
      {children}
    </div>
  );
}

function Pill({ label, value }: { label: string; value: string }) {
  return (
    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] border border-[#E2DDD6] bg-white text-[12px]">
      <span className="text-[#9CA3AF]">{label}</span>
      <span className="font-semibold text-[#374151]">{value}</span>
    </span>
  );
}
