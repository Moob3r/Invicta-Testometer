import { useState, useEffect, useMemo } from "react";

const ADMIN_PASSWORD = "ClassisInvicta2026";
const STORAGE_KEY = "testometer-tests";

const SAMPLE_TESTS = [
  { id: 1, course: "VET 401", title: "Pharmacology I", date: "2026-07-08", time: "10:00", venue: "LT1", type: "Test" },
  { id: 2, course: "VET 403", title: "Pathology II", date: "2026-07-14", time: "08:00", venue: "LT2", type: "Test" },
  { id: 3, course: "VET 405", title: "Clinical Medicine", date: "2026-07-21", time: "11:00", venue: "Seminar Room", type: "Practical" },
  { id: 4, course: "VET 407", title: "Epidemiology", date: "2026-07-28", time: "09:00", venue: "LT1", type: "Test" },
  { id: 5, course: "VET 402", title: "Surgery I", date: "2026-08-04", time: "10:00", venue: "LT3", type: "Quiz" },
];

const NAVY = "#1B2A4A";
const GOLD = "#C9A84C";
const GOLD_LIGHT = "#F5EDD0";
const CREAM = "#FAFAF8";

const TYPE_COLORS = {
  Test: { bg: "#E8EEF7", text: "#1B2A4A", dot: "#1B2A4A" },
  Practical: { bg: "#FEF3E2", text: "#92600A", dot: "#C9A84C" },
  Quiz: { bg: "#EBF5EB", text: "#1A5C1A", dot: "#2E8B2E" },
  Exam: { bg: "#F7E8E8", text: "#8B1A1A", dot: "#C0392B" },
};

function typeStyle(type) {
  return TYPE_COLORS[type] || { bg: "#EEEEEE", text: "#333", dot: "#888" };
}

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function formatDate(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function daysUntil(dateStr) {
  const today = new Date(); today.setHours(0,0,0,0);
  const d = new Date(dateStr + "T00:00:00");
  const diff = Math.round((d - today) / 86400000);
  if (diff < 0) return { label: "Done", past: true };
  if (diff === 0) return { label: "Today!", past: false, urgent: true };
  if (diff === 1) return { label: "Tomorrow", past: false, urgent: true };
  return { label: `${diff}d away`, past: false, urgent: diff <= 3 };
}

export default function Testometer() {
  const [tests, setTests] = useState(SAMPLE_TESTS);
  const [view, setView] = useState("timeline");
  const [calMonth, setCalMonth] = useState(() => { const n = new Date(); return { y: n.getFullYear(), m: n.getMonth() }; });
  const [adminOpen, setAdminOpen] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [pwInput, setPwInput] = useState("");
  const [pwError, setPwError] = useState(false);
  const [form, setForm] = useState({ course: "", title: "", date: "", time: "", venue: "", type: "Test" });
  const [editId, setEditId] = useState(null);
  const [saved, setSaved] = useState(false);
  const [filterType, setFilterType] = useState("All");

  useEffect(() => {
    (async () => {
      try {
        const r = await window.storage.get(STORAGE_KEY);
        if (r && r.value) setTests(JSON.parse(r.value));
      } catch {}
    })();
  }, []);

  async function persist(data) {
    try { await window.storage.set(STORAGE_KEY, JSON.stringify(data)); } catch {}
  }

  function handleAuth() {
    if (pwInput === ADMIN_PASSWORD) { setAuthed(true); setPwError(false); }
    else { setPwError(true); }
  }

  function handleSave() {
    if (!form.course || !form.title || !form.date) return;
    let updated;
    if (editId !== null) {
      updated = tests.map(t => t.id === editId ? { ...form, id: editId } : t);
    } else {
      updated = [...tests, { ...form, id: Date.now() }];
    }
    updated.sort((a, b) => a.date.localeCompare(b.date));
    setTests(updated);
    persist(updated);
    setForm({ course: "", title: "", date: "", time: "", venue: "", type: "Test" });
    setEditId(null);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleEdit(t) {
    setForm({ course: t.course, title: t.title, date: t.date, time: t.time, venue: t.venue, type: t.type });
    setEditId(t.id);
  }

  function handleDelete(id) {
    const updated = tests.filter(t => t.id !== id);
    setTests(updated);
    persist(updated);
    if (editId === id) { setEditId(null); setForm({ course: "", title: "", date: "", time: "", venue: "", type: "Test" }); }
  }

  const filteredTests = useMemo(() => {
    const base = tests.filter(t => filterType === "All" || t.type === filterType);
    return [...base].sort((a, b) => a.date.localeCompare(b.date));
  }, [tests, filterType]);

  // Calendar helpers
  const calDays = useMemo(() => {
    const { y, m } = calMonth;
    const first = new Date(y, m, 1).getDay();
    const total = new Date(y, m + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < first; i++) cells.push(null);
    for (let d = 1; d <= total; d++) cells.push(d);
    return cells;
  }, [calMonth]);

  function testsByDay(day) {
    if (!day) return [];
    const ds = `${calMonth.y}-${String(calMonth.m + 1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
    return tests.filter(t => t.date === ds);
  }

  const today = new Date();
  const isToday = (day) => day && today.getFullYear() === calMonth.y && today.getMonth() === calMonth.m && today.getDate() === day;

  const upcoming = filteredTests.filter(t => !daysUntil(t.date).past).slice(0, 3);

  return (
    <div style={{ minHeight: "100vh", background: CREAM, fontFamily: "'Georgia', serif" }}>

      {/* ── TOP BAR ── */}
      <div style={{ background: NAVY, color: "white", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `3px solid ${GOLD}` }}>
        <div style={{ padding: "14px 0" }}>
          <div style={{ fontSize: 11, letterSpacing: 3, color: GOLD, textTransform: "uppercase", marginBottom: 2 }}>Classis Invicta · 400 Level</div>
          <div style={{ fontSize: 22, fontWeight: "bold", letterSpacing: 1 }}>The Testometer</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 12, color: "#aaa", fontStyle: "italic" }}>{tests.length} tests scheduled</span>
          <button onClick={() => setAdminOpen(true)} style={{ background: "transparent", border: `1px solid ${GOLD}`, color: GOLD, padding: "6px 14px", borderRadius: 4, cursor: "pointer", fontSize: 12, letterSpacing: 1 }}>
            ⚙ Admin
          </button>
        </div>
      </div>

      {/* ── UPCOMING STRIP ── */}
      {upcoming.length > 0 && (
        <div style={{ background: GOLD_LIGHT, borderBottom: `1px solid ${GOLD}`, padding: "10px 24px", display: "flex", gap: 16, overflowX: "auto" }}>
          <span style={{ fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: 2, whiteSpace: "nowrap", alignSelf: "center" }}>Next Up:</span>
          {upcoming.map(t => {
            const d = daysUntil(t.date);
            return (
              <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 8, background: "white", border: `1px solid ${GOLD}`, borderRadius: 20, padding: "4px 14px", whiteSpace: "nowrap" }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: d.urgent ? "#C0392B" : NAVY, display: "inline-block" }}></span>
                <span style={{ fontSize: 13, fontWeight: "bold", color: NAVY }}>{t.course}</span>
                <span style={{ fontSize: 13, color: "#555" }}>{t.title}</span>
                <span style={{ fontSize: 11, color: d.urgent ? "#C0392B" : "#888", fontWeight: d.urgent ? "bold" : "normal" }}>{d.label}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* ── VIEW SWITCHER + FILTER ── */}
      <div style={{ padding: "20px 24px 0", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", gap: 0, border: `1px solid ${GOLD}`, borderRadius: 6, overflow: "hidden" }}>
          {["timeline", "calendar"].map(v => (
            <button key={v} onClick={() => setView(v)} style={{
              padding: "8px 22px", background: view === v ? NAVY : "white",
              color: view === v ? GOLD : NAVY, border: "none", cursor: "pointer",
              fontSize: 13, fontFamily: "Georgia, serif", letterSpacing: 0.5,
              borderRight: v === "timeline" ? `1px solid ${GOLD}` : "none",
            }}>
              {v === "timeline" ? "📋 Timeline" : "📅 Calendar"}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {["All", "Test", "Practical", "Quiz", "Exam"].map(f => (
            <button key={f} onClick={() => setFilterType(f)} style={{
              padding: "6px 14px", borderRadius: 20, border: `1px solid ${filterType === f ? NAVY : "#ccc"}`,
              background: filterType === f ? NAVY : "white", color: filterType === f ? "white" : "#555",
              cursor: "pointer", fontSize: 12, fontFamily: "Georgia, serif",
            }}>{f}</button>
          ))}
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div style={{ padding: "20px 24px 40px" }}>

        {/* TIMELINE VIEW */}
        {view === "timeline" && (
          <div style={{ maxWidth: 700 }}>
            {filteredTests.length === 0 && (
              <div style={{ textAlign: "center", color: "#aaa", padding: 60, fontStyle: "italic" }}>No tests scheduled yet.</div>
            )}
            {filteredTests.map((t, i) => {
              const d = daysUntil(t.date);
              const ts = typeStyle(t.type);
              const prevDate = i > 0 ? filteredTests[i-1].date.slice(0,7) : null;
              const thisMonth = t.date.slice(0,7);
              const showMonthHeader = thisMonth !== prevDate;
              const [yr, mo] = thisMonth.split("-");
              return (
                <div key={t.id}>
                  {showMonthHeader && (
                    <div style={{ fontSize: 11, letterSpacing: 3, color: GOLD, textTransform: "uppercase", margin: "24px 0 12px 56px", borderBottom: `1px solid ${GOLD_LIGHT}`, paddingBottom: 6 }}>
                      {MONTHS[parseInt(mo)-1]} {yr}
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 16, marginBottom: 12, opacity: d.past ? 0.45 : 1 }}>
                    {/* Date column */}
                    <div style={{ width: 40, textAlign: "center", flexShrink: 0, paddingTop: 4 }}>
                      <div style={{ fontSize: 20, fontWeight: "bold", color: isToday(new Date(t.date+"T00:00:00").getDate()) ? GOLD : NAVY, lineHeight: 1 }}>
                        {new Date(t.date+"T00:00:00").getDate()}
                      </div>
                      <div style={{ fontSize: 10, color: "#999", textTransform: "uppercase" }}>
                        {DAYS[new Date(t.date+"T00:00:00").getDay()]}
                      </div>
                    </div>
                    {/* Line */}
                    <div style={{ width: 2, background: d.past ? "#ddd" : GOLD, borderRadius: 2, flexShrink: 0 }}></div>
                    {/* Card */}
                    <div style={{ flex: 1, background: "white", border: `1px solid #e8e8e8`, borderRadius: 8, padding: "12px 16px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", borderLeft: `4px solid ${ts.dot}` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
                        <div>
                          <span style={{ fontSize: 11, fontWeight: "bold", letterSpacing: 1, color: GOLD, textTransform: "uppercase" }}>{t.course}</span>
                          <div style={{ fontSize: 16, fontWeight: "bold", color: NAVY, marginTop: 2 }}>{t.title}</div>
                        </div>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <span style={{ background: ts.bg, color: ts.text, fontSize: 11, padding: "3px 10px", borderRadius: 12, fontWeight: "bold" }}>{t.type}</span>
                          <span style={{ fontSize: 11, color: d.urgent && !d.past ? "#C0392B" : "#999", fontWeight: d.urgent ? "bold" : "normal", background: d.urgent && !d.past ? "#FEE" : "transparent", padding: "3px 8px", borderRadius: 10 }}>{d.label}</span>
                        </div>
                      </div>
                      <div style={{ marginTop: 8, display: "flex", gap: 16, fontSize: 12, color: "#777" }}>
                        {t.time && <span>🕐 {t.time}</span>}
                        {t.venue && <span>📍 {t.venue}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* CALENDAR VIEW */}
        {view === "calendar" && (
          <div style={{ maxWidth: 780 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <button onClick={() => setCalMonth(c => { const d = new Date(c.y, c.m - 1); return { y: d.getFullYear(), m: d.getMonth() }; })} style={{ background: "none", border: `1px solid ${GOLD}`, color: NAVY, padding: "6px 16px", borderRadius: 4, cursor: "pointer", fontSize: 18 }}>‹</button>
              <div style={{ fontSize: 20, fontWeight: "bold", color: NAVY, letterSpacing: 1 }}>{MONTHS[calMonth.m]} {calMonth.y}</div>
              <button onClick={() => setCalMonth(c => { const d = new Date(c.y, c.m + 1); return { y: d.getFullYear(), m: d.getMonth() }; })} style={{ background: "none", border: `1px solid ${GOLD}`, color: NAVY, padding: "6px 16px", borderRadius: 4, cursor: "pointer", fontSize: 18 }}>›</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 4 }}>
              {DAYS.map(d => <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: "bold", color: GOLD, letterSpacing: 1, textTransform: "uppercase", padding: "6px 0" }}>{d}</div>)}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3 }}>
              {calDays.map((day, i) => {
                const dayTests = testsByDay(day);
                const tod = isToday(day);
                return (
                  <div key={i} style={{
                    minHeight: 80, background: day ? "white" : "transparent",
                    border: day ? `1px solid ${tod ? GOLD : "#e8e8e8"}` : "none",
                    borderRadius: 6, padding: "6px", boxShadow: tod ? `0 0 0 2px ${GOLD}` : "none",
                    position: "relative",
                  }}>
                    {day && (
                      <>
                        <div style={{ fontSize: 12, fontWeight: tod ? "bold" : "normal", color: tod ? GOLD : "#888", marginBottom: 4 }}>{day}</div>
                        {dayTests.map(t => {
                          const ts = typeStyle(t.type);
                          return (
                            <div key={t.id} title={`${t.course} — ${t.title}\n${t.time} | ${t.venue}`} style={{
                              background: ts.bg, color: ts.text, fontSize: 10, padding: "2px 5px",
                              borderRadius: 3, marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis",
                              whiteSpace: "nowrap", cursor: "default", borderLeft: `3px solid ${ts.dot}`,
                            }}>
                              {t.course}
                            </div>
                          );
                        })}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── ADMIN MODAL ── */}
      {adminOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}>
          <div style={{ background: "white", borderRadius: 10, width: "100%", maxWidth: 640, maxHeight: "90vh", overflow: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
            {/* Modal header */}
            <div style={{ background: NAVY, padding: "16px 24px", borderRadius: "10px 10px 0 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ color: GOLD, fontSize: 11, letterSpacing: 2, textTransform: "uppercase" }}>Academic Committee</div>
                <div style={{ color: "white", fontSize: 18, fontWeight: "bold" }}>Admin Panel</div>
              </div>
              <button onClick={() => { setAdminOpen(false); setAuthed(false); setPwInput(""); }} style={{ background: "none", border: "none", color: "#aaa", fontSize: 22, cursor: "pointer" }}>✕</button>
            </div>

            <div style={{ padding: 24 }}>
              {!authed ? (
                <div style={{ textAlign: "center", padding: "20px 0" }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>🔒</div>
                  <div style={{ fontWeight: "bold", color: NAVY, marginBottom: 6 }}>Committee Access Only</div>
                  <div style={{ color: "#888", fontSize: 13, marginBottom: 20 }}>Enter the admin password to manage the testometer.</div>
                  <input type="password" value={pwInput} onChange={e => setPwInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleAuth()}
                    placeholder="Password" style={{ padding: "10px 16px", border: `2px solid ${pwError ? "#C0392B" : "#ddd"}`, borderRadius: 6, fontSize: 14, width: "100%", maxWidth: 280, outline: "none", fontFamily: "Georgia, serif", marginBottom: 8 }} />
                  {pwError && <div style={{ color: "#C0392B", fontSize: 12, marginBottom: 8 }}>Incorrect password. Try again.</div>}
                  <br/>
                  <button onClick={handleAuth} style={{ background: NAVY, color: GOLD, border: "none", padding: "10px 28px", borderRadius: 6, cursor: "pointer", fontSize: 14, fontFamily: "Georgia, serif", fontWeight: "bold", marginTop: 8 }}>Unlock</button>
                </div>
              ) : (
                <>
                  {saved && <div style={{ background: "#EBF5EB", color: "#1A5C1A", padding: "10px 16px", borderRadius: 6, marginBottom: 16, fontSize: 13, fontWeight: "bold" }}>✓ Saved successfully</div>}

                  {/* Form */}
                  <div style={{ background: GOLD_LIGHT, borderRadius: 8, padding: 16, marginBottom: 24, border: `1px solid ${GOLD}` }}>
                    <div style={{ fontWeight: "bold", color: NAVY, marginBottom: 12, fontSize: 14 }}>{editId ? "✏ Edit Test" : "＋ Add New Test"}</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      {[["course","Course Code","e.g. VET 401"], ["title","Test Title","e.g. Pharmacology I"], ["date","Date",""], ["time","Time (optional)",""], ["venue","Venue (optional)","e.g. LT1"]].map(([key, label, ph]) => (
                        <div key={key} style={{ display: "flex", flexDirection: "column", gap: 4, gridColumn: key === "title" ? "1 / -1" : "auto" }}>
                          <label style={{ fontSize: 11, fontWeight: "bold", color: NAVY, letterSpacing: 0.5 }}>{label}</label>
                          <input type={key === "date" ? "date" : key === "time" ? "time" : "text"} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                            placeholder={ph} style={{ padding: "8px 10px", border: "1px solid #ccc", borderRadius: 5, fontSize: 13, fontFamily: "Georgia, serif", outline: "none" }} />
                        </div>
                      ))}
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <label style={{ fontSize: 11, fontWeight: "bold", color: NAVY, letterSpacing: 0.5 }}>Type</label>
                        <select value={form.type} onChange=
