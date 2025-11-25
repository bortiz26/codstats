// ============================================================
// GLOBAL UTILITIES
// ============================================================

// Safe normalize
function norm(x) {
    return x.toLowerCase()
        .replace(/[-–—]+/g, " ")
        .replace(/[()]/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

function cap(s) {
    if (!s || typeof s !== "string") return s;
    return s.charAt(0).toUpperCase() + s.slice(1);
}

// Unified logistic
function logistic(x, k = 1) {
    return 1 / (1 + Math.exp(-x / k));
}

// Collapse everything except target prefix + ID
function collapseExcept(prefix, keepID) {
    document.querySelectorAll(`[id^='${prefix}']`).forEach(el => {
        if (el.id !== keepID) el.style.display = "none";
    });
}

// Collapse all hidden sections on tab switch / search
function collapseAllSections() {
    document.querySelectorAll(".hidden").forEach(el => {
        el.style.display = "none";
    });
}

// ============================================================
// TIME HELPERS
// ============================================================

// Parse HH:MM or HH:MM:SS
function parseHMS(str) {
    if (!str) return NaN;

    str = str.trim().toLowerCase();
    const isPM = str.includes("pm");
    const isAM = str.includes("am");

    str = str.replace(/am|pm/gi, "").trim();

    const parts = str.split(":").map(Number);

    // MM:SS
    if (parts.length === 2) {
        let h = 0, m = parts[0], s = parts[1];
        if (isPM && h < 12) h += 12;
        if (isAM && h === 12) h = 0;
        return h * 3600 + m * 60 + s;
    }

    // HH:MM:SS
    if (parts.length === 3) {
        let [h, m, s] = parts;
        if (isPM && h < 12) h += 12;
        if (isAM && h === 12) h = 0;
        return h * 3600 + m * 60 + s;
    }

    return NaN;
}

function computeDuration(startStr, endStr) {
    const s = parseHMS(startStr);
    const e = parseHMS(endStr);
    if (isNaN(s) || isNaN(e)) return null;

    let d = e - s;
    if (d < 0) d += 86400; // wrap midnight
    return d;
}

// ============================================================
// JSON LOADING (cache-busted)
// ============================================================

async function loadJSON(url) {
    const full = url + "?v=" + Date.now();
    const r = await fetch(full, { cache: "no-store" });
    if (!r.ok) throw new Error("Could not load " + url);
    return await r.json();
}

// ============================================================
// SMOOTH SCROLL CENTER
// ============================================================

function smoothScrollCenter(el) {
    if (!el) return;

    let tries = 0;
    const timer = setInterval(() => {
        tries++;

        const style = window.getComputedStyle(el);
        const visible = style.display !== "none" && el.offsetHeight > 0;

        if (visible || tries > 40) {
            clearInterval(timer);

            const rect = el.getBoundingClientRect();
            const absoluteY = rect.top + window.pageYOffset;
            const y = absoluteY - (window.innerHeight / 2) + rect.height / 2;

            window.scrollTo({ top: y, behavior: "smooth" });
        }
    }, 25);
}

// ============================================================
// LAST 5 MATCHES ENGINE
// ============================================================

function getLastN(matches, player, team, mode, map, N = 5) {
    const filtered = matches.filter(m =>
        m.player === player &&
        m.team === team &&
        m.mode === mode &&
        m.map === map
    );

    filtered.sort((a, b) => b.date - a.date);
    return filtered.slice(0, N);
}

function computeLast5Stats(last5) {
    if (last5.length === 0) return { killsAvg: NaN, kpm: NaN, durationAvg: NaN };

    let kills = 0, duration = 0;
    last5.forEach(m => {
        kills += m.kills;
        duration += m.durationSec;
    });

    const avgKills = kills / last5.length;
    const avgDuration = duration / last5.length;
    const kpm = avgDuration > 0 ? (kills / (avgDuration / 60)) : NaN;

    return { killsAvg: avgKills, kpm: kpm, durationAvg: avgDuration };
}

// ============================================================
// LABELS + COLORS
// ============================================================

const modeNames = {
    hp: "Hardpoint",
    snd: "Search & Destroy",
    overload: "Overload"
};

const glowColors = {
    "thieves": "#e74c3c",
    "faze": "#FF10F0",
    "optic": "#27ae60",
    "heretics": "#e67e22",
    "royale ravens": "#3498db",
    "cloud9": "#5dade2",
    "g2": "#f1c40f",
    "guerrillas m8": "#9b59b6",
    "breach": "#2ecc71",
    "falcons": "#f39c12",
    "koi": "#8e44ad",
    "surge": "#00ffff"
};
