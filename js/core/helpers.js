// ============================================================
// GLOBAL HELPER FUNCTIONS
// ============================================================

// Normalize text (for search)
function norm(x) {
    return x.toLowerCase()
        .replace(/[-–—]+/g, " ")
        .replace(/[()]/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

// Capitalize
function cap(s) {
    if (!s) return "";
    return s.charAt(0).toUpperCase() + s.slice(1);
}

// Toggle element visibility
function toggle(id, event) {
    if (event) event.stopPropagation();
    const el = document.getElementById(id);
    if (!el) return;

    el.style.display =
        (el.style.display !== "block" ? "block" : "none");
}

// Collapse everything except a specific prefix
function collapseExcept(prefix, keepID) {
    document.querySelectorAll(`[id^='${prefix}']`).forEach(el => {
        if (el.id !== keepID) el.style.display = "none";
    });
}

// Collapse all sections with .hidden class
function collapseAllSections() {
    document.querySelectorAll(".hidden").forEach(el => {
        el.style.display = "none";
    });
}
