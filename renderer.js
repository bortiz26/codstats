// ============================================================
// RENDERER.JS — MAIN ENTRY POINT
// ------------------------------------------------------------
// This file ONLY:
//   • Loads all JSON data
//   • Stores globals for other modules
//   • Calls all build functions
//   • Initializes search + tabs
//
// All logic lives in:
//   js/core/, js/search/, js/tabs/, js/analytics/
// ============================================================


// -----------------------------------------------
// UNIVERSAL JSON LOADER (cache-busted)
// -----------------------------------------------
async function loadJSON(url) {
    const fullURL = url + "?v=" + Date.now();
    const res = await fetch(fullURL, { cache: "no-store" });

    if (!res.ok) {
        console.error("Failed to load:", url);
        return null;
    }
    return await res.json();
}


// ============================================================
// MAIN INIT — RUNS ON PAGE LOAD
// ============================================================
async function initPage() {

    // --------------------------
    // LOAD ALL DATA
    // --------------------------
    const scores  = await loadJSON("test1/scores.json");
    const matches = await loadJSON("test1/matches.json");
    const teams   = await loadJSON("test1/teams.json");
    const modeMaps = await loadJSON("test1/modes.json");

    // Store for global access
    window.DYNAMIC_SCORES   = scores;
    window.DYNAMIC_MATCHES  = matches;
    window.DYNAMIC_TEAMS    = teams;
    window.DYNAMIC_MODEMAPS = modeMaps;


    // Auto-calc SND rounds if missing
matches.forEach(m => {
    if (m.mode === "snd") {
        if (!m.duration) {
            m.duration = (m.teamScore || 0) + (m.oppScore || 0);
        }
    }
});



    // --------------------------
    // BUILD TABS + UI SECTIONS
    // --------------------------
    buildTabs();                       // from core/tabs.js

    buildModes(scores, teams, modeMaps);      // tabs/modes.js
    buildLast5(scores, matches, teams);       // tabs/last5.js
    buildMatches(matches, teams, modeMaps);   // tabs/matches.js
    buildBestPicks(matches, teams, modeMaps); // tabs/bestpicks.js


    // --------------------------
    // GLOBAL SEARCH
    // --------------------------
    initSearch(teams, modeMaps, matches); // search/search.js
}


// ============================================================
// RESIZE CHARTS (if any) — GLOBAL SUPPORT
// ============================================================
window.addEventListener("resize", () => {
    if (!window.chartRegistry) return;
    Object.values(window.chartRegistry).forEach(c => c?.resize?.());
});
