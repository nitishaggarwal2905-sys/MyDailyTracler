// ===== Categories =====
// type: "essential" | "productive" | "neutral" | "wasted" | "social"
const CATEGORIES = [
  { id: "sleep",      name: "Sleep",       icon: "😴", color: "#6366f1", type: "essential" },
  { id: "work",       name: "Work",        icon: "💼", color: "#10b981", type: "productive" },
  { id: "university", name: "University",  icon: "🎓", color: "#0ea5e9", type: "productive" },
  { id: "exercise",   name: "Exercise",    icon: "🏃", color: "#22c55e", type: "productive" },
  { id: "eating",     name: "Eating",      icon: "🍽️", color: "#f59e0b", type: "essential" },
  { id: "travel",     name: "Travel",      icon: "🚗", color: "#94a3b8", type: "neutral" },
  { id: "social",     name: "Friends/Out", icon: "🎉", color: "#ec4899", type: "social" },
  { id: "scrolling",  name: "Scrolling",   icon: "📱", color: "#ef4444", type: "wasted" },
  { id: "misc",       name: "Misc",        icon: "✨", color: "#a855f7", type: "neutral" },
];

const CAT_BY_ID = Object.fromEntries(CATEGORIES.map(c => [c.id, c]));

// ===== Storage =====
const STORAGE_KEY = "mydailytracler.entries.v1";
const TIMER_KEY = "mydailytracler.activeTimer.v1";

function loadEntries() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveEntries(entries) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function loadActiveTimer() {
  try {
    const raw = localStorage.getItem(TIMER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveActiveTimer(t) {
  if (t) localStorage.setItem(TIMER_KEY, JSON.stringify(t));
  else localStorage.removeItem(TIMER_KEY);
}

let entries = loadEntries();
let activeTimer = loadActiveTimer();
let reportWeekOffset = 0; // 0 = current week, -1 = last week, etc.

// ===== Utilities =====
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function fmtDuration(minutes) {
  minutes = Math.round(minutes);
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function fmtClockHMS(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map(n => String(n).padStart(2, "0")).join(":");
}

function fmtTime(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function dateKey(d) {
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
}

function fmtDayLabel(key) {
  const [y, m, d] = key.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" });
}

// Week starts Monday
function startOfWeek(d) {
  const dt = new Date(d);
  dt.setHours(0, 0, 0, 0);
  const day = dt.getDay(); // 0=Sun..6=Sat
  const diff = day === 0 ? -6 : 1 - day;
  dt.setDate(dt.getDate() + diff);
  return dt;
}

function getWeekRange(offset = 0) {
  const start = startOfWeek(new Date());
  start.setDate(start.getDate() + offset * 7);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return { start, end };
}

function fmtDateShort(d) {
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function nowLocalDatetimeInputValue() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

// ===== Tabs =====
document.querySelectorAll(".tab").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(btn.dataset.tab).classList.add("active");
    if (btn.dataset.tab === "history") renderHistory();
    if (btn.dataset.tab === "report") renderReport();
  });
});

// ===== Quick Track Grid =====
function renderQuickTrack() {
  const grid = document.getElementById("quick-track-grid");
  grid.innerHTML = "";
  CATEGORIES.forEach(cat => {
    const btn = document.createElement("button");
    btn.className = "cat-btn";
    if (activeTimer && activeTimer.categoryId === cat.id) btn.classList.add("active");
    btn.innerHTML = `<span class="cat-icon">${cat.icon}</span><span class="cat-name">${cat.name}</span>`;
    btn.style.borderColor = activeTimer && activeTimer.categoryId === cat.id ? cat.color : "";
    btn.addEventListener("click", () => startTimer(cat.id));
    grid.appendChild(btn);
  });
}

// ===== Manual Entry =====
function renderManualCategoryOptions() {
  const sel = document.getElementById("manual-category");
  sel.innerHTML = CATEGORIES.map(c => `<option value="${c.id}">${c.icon} ${c.name}</option>`).join("");
}

document.getElementById("manual-entry-form").addEventListener("submit", e => {
  e.preventDefault();
  const categoryId = document.getElementById("manual-category").value;
  const minutes = parseInt(document.getElementById("manual-minutes").value, 10);
  const whenInput = document.getElementById("manual-when").value;
  const note = document.getElementById("manual-note").value.trim();

  if (!minutes || minutes <= 0) return;

  const end = whenInput ? new Date(whenInput) : new Date();
  const start = new Date(end.getTime() - minutes * 60 * 1000);

  entries.push({
    id: uid(),
    categoryId,
    start: start.toISOString(),
    end: end.toISOString(),
    minutes,
    note,
  });
  saveEntries(entries);

  document.getElementById("manual-minutes").value = "";
  document.getElementById("manual-note").value = "";
  document.getElementById("manual-when").value = nowLocalDatetimeInputValue();

  renderToday();
});

// ===== Timer =====
function startTimer(categoryId) {
  if (activeTimer) {
    if (activeTimer.categoryId === categoryId) return;
    if (!confirm(`Switch from ${CAT_BY_ID[activeTimer.categoryId].name} to ${CAT_BY_ID[categoryId].name}? Current session will be logged.`)) return;
    stopTimer();
  }
  activeTimer = { categoryId, start: new Date().toISOString() };
  saveActiveTimer(activeTimer);
  renderQuickTrack();
  renderTimerBanner();
}

function stopTimer() {
  if (!activeTimer) return;
  const start = new Date(activeTimer.start);
  const end = new Date();
  const minutes = Math.max(1, Math.round((end - start) / 60000));
  entries.push({
    id: uid(),
    categoryId: activeTimer.categoryId,
    start: start.toISOString(),
    end: end.toISOString(),
    minutes,
    note: "",
  });
  saveEntries(entries);
  activeTimer = null;
  saveActiveTimer(null);
  renderQuickTrack();
  renderTimerBanner();
  renderToday();
}

document.getElementById("stop-timer-btn").addEventListener("click", stopTimer);

function renderTimerBanner() {
  const banner = document.getElementById("active-timer-banner");
  if (!activeTimer) {
    banner.hidden = true;
    return;
  }
  banner.hidden = false;
  const cat = CAT_BY_ID[activeTimer.categoryId];
  document.getElementById("active-timer-category").textContent = `${cat.icon} ${cat.name}`;
  updateTimerElapsed();
}

function updateTimerElapsed() {
  if (!activeTimer) return;
  const seconds = Math.floor((Date.now() - new Date(activeTimer.start).getTime()) / 1000);
  document.getElementById("active-timer-elapsed").textContent = fmtClockHMS(seconds);
}

setInterval(updateTimerElapsed, 1000);

// ===== Today View =====
function renderToday() {
  const todayKey = dateKey(new Date());
  const todays = entries
    .filter(e => dateKey(e.end) === todayKey)
    .sort((a, b) => new Date(b.start) - new Date(a.start));

  renderDaySummary(todays, document.getElementById("today-summary"));
  renderEntryList(todays, document.getElementById("today-entries"));
}

function renderDaySummary(dayEntries, container) {
  if (dayEntries.length === 0) {
    container.innerHTML = `<div class="empty-state">No entries yet. Start tracking above!</div>`;
    return;
  }
  const total = dayEntries.reduce((sum, e) => sum + e.minutes, 0);
  const byCat = {};
  dayEntries.forEach(e => {
    byCat[e.categoryId] = (byCat[e.categoryId] || 0) + e.minutes;
  });

  const segments = CATEGORIES
    .filter(c => byCat[c.id])
    .map(c => `<div style="width:${(byCat[c.id]/total*100).toFixed(2)}%; background:${c.color};" title="${c.name}: ${fmtDuration(byCat[c.id])}"></div>`)
    .join("");

  const legend = CATEGORIES
    .filter(c => byCat[c.id])
    .sort((a, b) => byCat[b.id] - byCat[a.id])
    .map(c => `<span class="legend-item"><span class="legend-dot" style="background:${c.color};"></span>${c.name} ${fmtDuration(byCat[c.id])}</span>`)
    .join("");

  container.innerHTML = `
    <div class="day-total">Total tracked: <strong>${fmtDuration(total)}</strong></div>
    <div class="bar-stack">${segments}</div>
    <div class="legend">${legend}</div>
  `;
}

function renderEntryList(list, container) {
  if (list.length === 0) {
    container.innerHTML = "";
    return;
  }
  container.innerHTML = list.map(e => {
    const cat = CAT_BY_ID[e.categoryId] || { name: "Unknown", icon: "❔", color: "#888" };
    const note = e.note ? `<span class="entry-note">"${escapeHtml(e.note)}"</span>` : "";
    return `
      <li class="entry-item">
        <span class="entry-cat" style="color:${cat.color};">
          <span class="cat-icon">${cat.icon}</span>${cat.name}
        </span>
        <span class="entry-time">${fmtTime(e.start)} – ${fmtTime(e.end)}</span>
        ${note}
        <span class="entry-duration">${fmtDuration(e.minutes)}</span>
        <span class="entry-actions">
          <button class="icon-btn" data-edit="${e.id}" title="Edit">✏️</button>
          <button class="icon-btn danger" data-delete="${e.id}" title="Delete">🗑️</button>
        </span>
      </li>
    `;
  }).join("");

  container.querySelectorAll("[data-delete]").forEach(btn => {
    btn.addEventListener("click", () => {
      if (confirm("Delete this entry?")) {
        entries = entries.filter(e => e.id !== btn.dataset.delete);
        saveEntries(entries);
        renderToday();
        renderHistory();
      }
    });
  });

  container.querySelectorAll("[data-edit]").forEach(btn => {
    btn.addEventListener("click", () => editEntry(btn.dataset.edit));
  });
}

function editEntry(id) {
  const entry = entries.find(e => e.id === id);
  if (!entry) return;
  const newMinutes = prompt(`Edit duration (minutes) for ${CAT_BY_ID[entry.categoryId].name}:`, entry.minutes);
  if (newMinutes === null) return;
  const m = parseInt(newMinutes, 10);
  if (!m || m <= 0) return alert("Enter a positive number.");
  const newNote = prompt("Edit note (optional):", entry.note || "");
  entry.minutes = m;
  if (newNote !== null) entry.note = newNote.trim();
  // Adjust end so duration matches; keep start fixed
  entry.end = new Date(new Date(entry.start).getTime() + m * 60000).toISOString();
  saveEntries(entries);
  renderToday();
  renderHistory();
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// ===== History =====
function renderHistory() {
  const container = document.getElementById("history-list");
  if (entries.length === 0) {
    container.innerHTML = `<div class="empty-state">No history yet. Start tracking on the Today tab!</div>`;
    return;
  }
  const grouped = {};
  entries.forEach(e => {
    const k = dateKey(e.end);
    (grouped[k] = grouped[k] || []).push(e);
  });
  const sortedKeys = Object.keys(grouped).sort((a, b) => b.localeCompare(a));
  container.innerHTML = "";
  sortedKeys.forEach(k => {
    const dayEntries = grouped[k].sort((a, b) => new Date(b.start) - new Date(a.start));
    const dayDiv = document.createElement("div");
    dayDiv.className = "history-day";
    dayDiv.innerHTML = `<h3>${fmtDayLabel(k)}</h3>`;
    const summary = document.createElement("div");
    summary.className = "day-summary";
    renderDaySummary(dayEntries, summary);
    dayDiv.appendChild(summary);
    const ul = document.createElement("ul");
    ul.className = "entry-list";
    renderEntryList(dayEntries, ul);
    dayDiv.appendChild(ul);
    container.appendChild(dayDiv);
  });
}

// ===== Weekly Report =====
document.getElementById("prev-week").addEventListener("click", () => { reportWeekOffset--; renderReport(); });
document.getElementById("next-week").addEventListener("click", () => { reportWeekOffset++; renderReport(); });

function renderReport() {
  const { start, end } = getWeekRange(reportWeekOffset);
  document.getElementById("week-range").textContent =
    `${fmtDateShort(start)} – ${fmtDateShort(new Date(end - 1))}`;

  document.getElementById("next-week").disabled = reportWeekOffset >= 0;
  document.getElementById("next-week").style.opacity = reportWeekOffset >= 0 ? 0.4 : 1;

  const weekEntries = entries.filter(e => {
    const t = new Date(e.end).getTime();
    return t >= start.getTime() && t < end.getTime();
  });

  const container = document.getElementById("report-content");
  if (weekEntries.length === 0) {
    container.innerHTML = `<div class="empty-state">No entries for this week.<br>Track some activities to see your report!</div>`;
    return;
  }

  const total = weekEntries.reduce((s, e) => s + e.minutes, 0);
  const byCat = {};
  const byType = { essential: 0, productive: 0, neutral: 0, wasted: 0, social: 0 };
  weekEntries.forEach(e => {
    byCat[e.categoryId] = (byCat[e.categoryId] || 0) + e.minutes;
    const cat = CAT_BY_ID[e.categoryId];
    if (cat) byType[cat.type] += e.minutes;
  });

  const daysTracked = new Set(weekEntries.map(e => dateKey(e.end))).size;
  const avgPerDay = total / Math.max(1, daysTracked);

  const productivePct = ((byType.productive / total) * 100) || 0;
  const wastedPct = ((byType.wasted / total) * 100) || 0;
  const sleepMin = byCat.sleep || 0;
  const avgSleepHrs = (sleepMin / 60) / Math.max(1, daysTracked);

  // Stat grid
  const statGrid = `
    <div class="stat-grid">
      <div class="stat-card">
        <div class="stat-label">Total tracked</div>
        <div class="stat-value">${fmtDuration(total)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Days tracked</div>
        <div class="stat-value">${daysTracked} / 7</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Avg / day</div>
        <div class="stat-value">${fmtDuration(avgPerDay)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Productive</div>
        <div class="stat-value ${productivePct >= 25 ? "good" : "warn"}">${productivePct.toFixed(0)}%</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Wasted</div>
        <div class="stat-value ${wastedPct >= 15 ? "bad" : wastedPct >= 8 ? "warn" : "good"}">${wastedPct.toFixed(0)}%</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Avg sleep</div>
        <div class="stat-value ${avgSleepHrs >= 7 ? "good" : avgSleepHrs >= 6 ? "warn" : "bad"}">${avgSleepHrs.toFixed(1)}h</div>
      </div>
    </div>
  `;

  // Category breakdown
  const sortedCats = CATEGORIES
    .filter(c => byCat[c.id])
    .sort((a, b) => byCat[b.id] - byCat[a.id]);
  const maxMin = Math.max(...sortedCats.map(c => byCat[c.id]));
  const breakdown = sortedCats.map(c => {
    const mins = byCat[c.id];
    const pct = ((mins / total) * 100).toFixed(1);
    const barW = (mins / maxMin * 100).toFixed(1);
    return `
      <div class="cat-row">
        <span class="cat-name-label" style="color:${c.color};"><span class="cat-icon">${c.icon}</span>${c.name}</span>
        <span class="cat-bar"><div style="width:${barW}%; background:${c.color};"></div></span>
        <span class="cat-time">${fmtDuration(mins)} · ${pct}%</span>
      </div>
    `;
  }).join("");

  // Insights
  const insights = generateInsights({ byCat, byType, total, daysTracked, avgSleepHrs, productivePct, wastedPct });

  container.innerHTML = `
    <div class="report-section">
      <h3>Overview</h3>
      ${statGrid}
    </div>
    <div class="report-section">
      <h3>Where your time went</h3>
      ${breakdown}
    </div>
    <div class="report-section">
      <h3>Insights & Recommendations</h3>
      <ul class="insights">
        ${insights.map(i => `<li class="${i.type}">${i.text}</li>`).join("")}
      </ul>
    </div>
  `;
}

function generateInsights({ byCat, byType, total, daysTracked, avgSleepHrs, productivePct, wastedPct }) {
  const out = [];
  const hrs = m => (m / 60).toFixed(1);

  // Sleep
  if (avgSleepHrs && avgSleepHrs < 6) {
    out.push({ type: "bad", text: `You're averaging only ${avgSleepHrs.toFixed(1)}h of sleep — that's risky for focus, mood, and health. Aim for 7–8h.` });
  } else if (avgSleepHrs >= 6 && avgSleepHrs < 7) {
    out.push({ type: "warn", text: `Sleep average is ${avgSleepHrs.toFixed(1)}h. Push toward 7+ hours to lock in better focus the next day.` });
  } else if (avgSleepHrs >= 7) {
    out.push({ type: "good", text: `Solid sleep average (${avgSleepHrs.toFixed(1)}h). Keep it up — this compounds into everything else.` });
  } else if (!byCat.sleep) {
    out.push({ type: "warn", text: `You didn't log any sleep this week. Track it — sleep is the single biggest lever on productivity.` });
  }

  // Scrolling
  const scrollMin = byCat.scrolling || 0;
  const scrollHrs = scrollMin / 60;
  if (scrollHrs > 14) {
    out.push({ type: "bad", text: `${hrs(scrollMin)}h of scrolling this week (${(scrollMin / total * 100).toFixed(0)}% of tracked time). That's ~${(scrollHrs / 7).toFixed(1)}h/day vanishing. Try a phone timer or move social apps off your home screen.` });
  } else if (scrollHrs > 7) {
    out.push({ type: "warn", text: `Scrolling consumed ${hrs(scrollMin)}h. Worth setting a daily cap (e.g. 60 min) — even cutting it in half gives you back ${(scrollHrs / 2).toFixed(1)}h next week.` });
  } else if (scrollMin > 0) {
    out.push({ type: "good", text: `Scrolling held to ${hrs(scrollMin)}h — well controlled.` });
  }

  // Productive
  if (productivePct >= 35) {
    out.push({ type: "good", text: `${productivePct.toFixed(0)}% of your tracked time was productive (work/uni/exercise). Strong week.` });
  } else if (productivePct < 20 && total > 600) {
    out.push({ type: "warn", text: `Only ${productivePct.toFixed(0)}% productive time. Block 2–3 deep-work sessions next week and protect them.` });
  }

  // Work vs Uni balance
  const workH = (byCat.work || 0) / 60;
  const uniH = (byCat.university || 0) / 60;
  if (workH + uniH > 0) {
    out.push({ type: "good", text: `Work: ${workH.toFixed(1)}h · University: ${uniH.toFixed(1)}h${workH > 50 ? " — heads up, that's a lot of work hours." : ""}` });
  }

  // Exercise
  const exMin = byCat.exercise || 0;
  if (exMin === 0) {
    out.push({ type: "warn", text: `No exercise logged. Even 3×30 min of movement next week boosts energy and sleep quality.` });
  } else if (exMin < 90) {
    out.push({ type: "warn", text: `Exercise was only ${hrs(exMin)}h. Aim for 150 min/week — proven productivity multiplier.` });
  } else {
    out.push({ type: "good", text: `${hrs(exMin)}h of exercise — great for energy and focus.` });
  }

  // Social
  const socialMin = byCat.social || 0;
  if (socialMin === 0) {
    out.push({ type: "warn", text: `No time logged with friends or going out. Don't underestimate this — social connection drives long-term wellbeing.` });
  } else if (socialMin / 60 > 20) {
    out.push({ type: "warn", text: `Social time was ${hrs(socialMin)}h. Fun is great, but watch the trade-off with sleep and work.` });
  }

  // Eating
  const eatMin = byCat.eating || 0;
  if (eatMin / 60 > 14) {
    out.push({ type: "warn", text: `Eating took ${hrs(eatMin)}h — over 2h/day. Could be social meals (good) or unconscious snacking (worth a look).` });
  }

  // Travel
  const travelMin = byCat.travel || 0;
  if (travelMin / 60 > 10) {
    out.push({ type: "warn", text: `Travel ate ${hrs(travelMin)}h. Use it: podcasts, audiobooks, planning the day, or reduce it if possible.` });
  }

  // Tracking discipline
  if (daysTracked < 5) {
    out.push({ type: "warn", text: `You only tracked ${daysTracked} day(s) this week. Consistent tracking = honest reports. Try to log every day next week.` });
  }

  // Wasted overall
  if (wastedPct >= 20) {
    out.push({ type: "bad", text: `${wastedPct.toFixed(0)}% of tracked time was in low-value activities. Replacing even 1h/day with reading, exercise, or deep work would transform your month.` });
  }

  if (out.length === 0) {
    out.push({ type: "good", text: `Balanced week. Keep tracking to spot trends over time.` });
  }

  return out;
}

// ===== Footer actions =====
document.getElementById("export-btn").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify({ entries }, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `mydailytracler-${dateKey(new Date())}.json`;
  a.click();
  URL.revokeObjectURL(url);
});

document.getElementById("import-btn").addEventListener("click", () => {
  document.getElementById("import-file").click();
});

document.getElementById("import-file").addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (!Array.isArray(data.entries)) throw new Error("Invalid file");
      if (!confirm(`Import ${data.entries.length} entries? This will merge with existing data.`)) return;
      const existingIds = new Set(entries.map(x => x.id));
      data.entries.forEach(x => { if (!existingIds.has(x.id)) entries.push(x); });
      saveEntries(entries);
      renderToday();
      renderHistory();
      alert("Import complete.");
    } catch (err) {
      alert("Could not import: " + err.message);
    }
  };
  reader.readAsText(file);
  e.target.value = "";
});

document.getElementById("clear-btn").addEventListener("click", () => {
  if (!confirm("Delete ALL entries? This cannot be undone.")) return;
  if (!confirm("Are you absolutely sure? Consider exporting first.")) return;
  entries = [];
  saveEntries(entries);
  saveActiveTimer(null);
  activeTimer = null;
  renderToday();
  renderHistory();
  renderTimerBanner();
  renderQuickTrack();
});

// ===== Init =====
function init() {
  document.getElementById("manual-when").value = nowLocalDatetimeInputValue();
  renderManualCategoryOptions();
  renderQuickTrack();
  renderTimerBanner();
  renderToday();
}

init();
