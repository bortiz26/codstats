// ============================================================
// TIME PARSING + DURATION HELPERS
// ============================================================

// Parse HH:MM or HH:MM:SS (with or without AM/PM)
function parseHMS(str) {
    if (!str) return NaN;

    str = str.trim().toLowerCase();

    const isPM = str.includes("pm");
    const isAM = str.includes("am");

    str = str.replace(/am|pm/gi, "").trim();
    const parts = str.split(":").map(Number);

    if (parts.length === 2) {
        let [h, m] = parts;

        if (isPM && h < 12) h += 12;
        if (isAM && h === 12) h = 0;

        return h * 3600 + m * 60;
    }

    if (parts.length === 3) {
        return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }

    return NaN;
}

// Compute duration between start / end times
function computeDuration(startStr, endStr) {
    const s = parseHMS(startStr);
    const e = parseHMS(endStr);

    if (isNaN(s) || isNaN(e)) return null;

    let d = e - s;
    if (d < 0) d += 86400; // wrap to next day

    return d;
}
