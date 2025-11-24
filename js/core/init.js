// ============================================================
// INIT.JS — GLOBAL APP BOOTSTRAP
// ============================================================
//
// Purpose:
//   • Sets up global containers
//   • Prepares the environment
//   • Starts the app (calls initPage from renderer.js)
//
// This will grow later if you add loading screens, accounts,
// remote APIs, caching, etc.
// ============================================================


// Global registries for charts + state
window.chartRegistry = {};
window.AppState = {
    loaded: false,
    version: "1.0.0",
    lastInit: null
};


// Optional future hook — pre-init tasks
function preInit() {
    console.log("App pre-initializing…");
}


// ============================================================
// START APPLICATION
// ============================================================
window.addEventListener("DOMContentLoaded", async () => {

    preInit();

    // Main entry point from renderer.js
    await initPage();

    window.AppState.loaded = true;
    window.AppState.lastInit = Date.now();

    console.log("App initialized successfully.");
});
