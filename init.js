// ============================================================
// INIT SYSTEM — MAIN ENTRY POINT
// ============================================================

async function initPage() {
    try {
        // ========================================
        // Load all JSON (cache-busted)
        // ========================================
        const scores  = await loadJSON("test1/scores.json");
        const matches = await loadJSON("test1/matches.json");
        const teams   = await loadJSON("test1/teams.json");
        const modes   = await loadJSON("test1/modes.json");

        // Attach to global for debugging
        window.DYNAMIC_SCORES = scores;
        window.DYNAMIC_MATCHES = matches;
        window.DYNAMIC_TEAMS = teams;
        window.DYNAMIC_MODEMAPS = modes;

        // ========================================
        // Compute durationSec if missing
        // ========================================
        matches.forEach(m => {
            if (!m.durationSec || m.durationSec <= 0) {
                if (m.start && m.end) {
                    const d = computeDuration(m.start, m.end);
                    if (d) m.durationSec = d;
                }
                if (!m.durationSec) {
                    // fallback = 5 minutes
                    m.durationSec = 300;
                }
            }
        });

        // ========================================
        // BUILD UI TABS
        // ========================================
        buildModeTabs(scores, teams, modes);
        buildLast5Tabs(scores, matches, teams, modes);
        buildMatchesTabs(matches, teams, modes);
        buildBestPicksTabs(matches, teams, modes);

        // ========================================
        // SEARCH SYSTEM
        // ========================================
        initSearch(teams, modes, matches);

        // ========================================
        // Activate tab underline + swipe behavior
        // ========================================
        initTabHeaderUI();

        console.log("%c✔ INIT COMPLETE", "color: #33ff33; font-size: 16px;");

    } catch (err) {
        console.error("INIT ERROR:", err);
        alert("Error loading JSON data. Check console.");
    }
}
// ============================================================
// TAB HEADER UI — underline, active switching, scroll centering
// ============================================================

function initTabHeaderUI() {
    const tabs = document.querySelectorAll(".tab");
    const contents = document.querySelectorAll(".tab-content");
    const underline = document.getElementById("tab-underline");
    const bar = document.querySelector(".tab-bar");

    function activate(name) {
        // Toggle .active class
        tabs.forEach(t => t.classList.toggle("active", t.dataset.tab === name));

        // Toggle tab-content visibility
        contents.forEach(c => {
            if (c.id === "tab-" + name) {
                c.classList.add("activeTab");
                void c.offsetWidth; // reflow
            } else {
                c.classList.remove("activeTab");
            }
        });

        // Move underline
        const active = document.querySelector(".tab.active");
        if (active) {
            const r = active.getBoundingClientRect();
            const pr = bar.getBoundingClientRect();

            underline.style.width = r.width + "px";
            underline.style.left = (r.left - pr.left) + "px";

            const offset =
                (r.left - pr.left) -
                (bar.clientWidth / 2 - r.width / 2);

            bar.scrollBy({ left: offset, behavior: "smooth" });
        }
    }

    // Assign click events
    tabs.forEach(t =>
        t.addEventListener("click", () => activate(t.dataset.tab))
    );

    // Scroll fade shadows
    bar.addEventListener("scroll", () => {
        bar.classList.toggle("scrolling-left", bar.scrollLeft > 5);
        bar.classList.toggle(
            "scrolling-right",
            bar.scrollLeft + bar.clientWidth < bar.scrollWidth - 5
        );
    });

    // Default tab
    activate("modes");
}
