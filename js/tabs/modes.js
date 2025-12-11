// ============================================================
// GAME MODES TAB — MODE → MAP → TEAM ORDER
// OVERALL AVG + AVG VS OPPONENT (WITH RUN BUTTON IN VS MODE)
// ============================================================

// Global match list (loaded once)
window.matchData = [];

async function loadMatchData() {
    try {
        const res = await fetch("test1/matches.json");
        const data = await res.json();
        window.matchData = data;
        console.log("Loaded matchData:", window.matchData.length, "matches");
    } catch (err) {
        console.error("Failed to load matches.json", err);
        window.matchData = [];
    }
}
loadMatchData();



function buildModeTabs(scores, teams, modeMaps) {

    const root = document.getElementById("tab-modes");

    root.innerHTML = `
        <div class="modes-container">
         <h2 class="bp-title">AVG STATS</h2>

            <!-- VIEW TOGGLES -->
            <div class="gm-view-toggle top-view-toggle">
                <button id="gm-view-overall" class="gm-view-btn active">Overall Avg</button>
                <button id="gm-view-vs" class="gm-view-btn">Avg vs Opponent</button>
            </div>

            <label class="bp-label">Game Modes:</label>

            <!-- MODE TOGGLES -->
            <div class="bp-mode-toggle">
                <button id="gm-hp"  class="bp-toggle-btn active">Hardpoint</button>
                <button id="gm-snd" class="bp-toggle-btn">Search & Destroy</button>
                <button id="gm-over" class="bp-toggle-btn">Overload</button>
            </div>

            <!-- MAP GRID -->
            <label class="bp-label">Maps:</label>
            <div id="gm-map-grid" class="gm-map-grid"></div>

            <!-- TEAM GRID (Overall Mode) -->
            <div id="team-toggle-wrapper" class="team-toggle-wrapper"></div>

            <!-- TEAM + OPPONENT ROW (VS Mode) -->
            <div id="vs-row" class="hidden vs-flex-row">

                <div class="vs-col">
                    <label class="bp-label">Team</label>
                    <select id="team-select-vs" class="team-vs-dropdown"></select>
                </div>

                <div class="vs-col">
                    <label class="bp-label">Opponent</label>
                    <select id="opponent-select" class="team-vs-dropdown"></select>
                </div>

            </div>

            <!-- RUN BUTTON -->
            <button id="gm-run-vs" class="bp-run-btn hidden">RUN</button>

            <!-- RESULTS -->
            <div id="gm-results"></div>
        </div>
    `;

    // ===================================================================
    // REFERENCES
    // ===================================================================
    const results      = document.getElementById("gm-results");
    const mapGrid      = document.getElementById("gm-map-grid");
    const teamWrapper  = document.getElementById("team-toggle-wrapper");
    const vsRow        = document.getElementById("vs-row");
    const teamSelectVS = document.getElementById("team-select-vs");
    const oppSelect    = document.getElementById("opponent-select");
    const runVSBtn     = document.getElementById("gm-run-vs");

    let GM_MODE = "hp";
    let GM_MAP  = null;
    let GM_TEAM = null;
    let GM_VIEW = "overall";

    // ===================================================================
    // MODE TOGGLES
    // ===================================================================

    const modeButtons = {
        hp: document.getElementById("gm-hp"),
        snd: document.getElementById("gm-snd"),
        overload: document.getElementById("gm-over"),
    };

    function setGMMode(mode) {
        GM_MODE = mode;

        Object.values(modeButtons).forEach(b => b.classList.remove("active"));
        modeButtons[mode].classList.add("active");

        loadMapGrid();
        GM_MAP = null;

        if (GM_VIEW === "overall") {
            results.innerHTML = `<p>Select map + team.</p>`;
        } else {
            loadTeamDropdownVS();
            results.innerHTML = `<p>Select map, team, opponent, then RUN.</p>`;
        }
    }

    modeButtons.hp.onclick       = () => setGMMode("hp");
    modeButtons.snd.onclick      = () => setGMMode("snd");
    modeButtons.overload.onclick = () => setGMMode("overload");

    // ===================================================================
    // MAP GRID — IMAGE + TITLE BUTTONS
    // ===================================================================

    function loadMapGrid() {
        mapGrid.innerHTML = "";
        GM_MAP = null;

        modeMaps[GM_MODE].forEach(map => {

            const cleanMap = map
                .trim()
                .replace(/\s+/g, "")
                .replace(/[^a-zA-Z0-9]/g, "")
                .toLowerCase();

            const card = document.createElement("div");
            card.className = "gm-map-card";

            card.innerHTML = `
                <img class="gm-map-thumb"
                     src="test1/maps/${cleanMap}.webp"
                     onerror="this.onerror=null;this.src='test1/maps/${cleanMap}.png'">
                <div class="gm-map-name">${map}</div>
            `;

            card.onclick = () => {
                GM_MAP = map;

                document.querySelectorAll(".gm-map-card")
                    .forEach(c => c.classList.remove("active"));
                card.classList.add("active");

                // AUTO-SELECT FIRST TEAM IF NONE IS PICKED
                if (!GM_TEAM) {
                    const firstTeam = Object.keys(teams)[0];
                    GM_TEAM = firstTeam;

                    document.querySelectorAll(".team-toggle-btn").forEach(b => b.classList.remove("active"));
                    const btn = document.querySelector(`.team-toggle-btn[data-team="${firstTeam}"]`);
                    if (btn) btn.classList.add("active");
                }

                if (GM_VIEW === "vsOpp") {
                    loadOpponentDropdown();
                    results.innerHTML = `<p>Select opponent then RUN.</p>`;
                    return;
                }

                renderModeMap();
            };

            mapGrid.appendChild(card);
        });
    }

    loadMapGrid();

    // ===================================================================
    // TEAM BUTTON GRID (OVERALL)
    // ===================================================================

    function loadTeamButtons() {
        teamWrapper.innerHTML = "";

        Object.keys(teams).forEach(team => {
            const glow = glowColors[team] ?? "#fff";

            const btn = document.createElement("div");
            btn.className = "team-toggle-btn";
            btn.dataset.team = team; // IMPORTANT FIX
            btn.style.setProperty("--teamGlow", glow);

            btn.innerHTML = `
                <img src="test1/logos/${team}.webp"
                     onerror="this.onerror=null;this.src='test1/logos/${team}.png'"
                     class="team-toggle-logo">
                <div class="team-toggle-name">${cap(team)}</div>
            `;

            btn.onclick = () => {
                GM_TEAM = team;

                document.querySelectorAll(".team-toggle-btn")
                    .forEach(b => b.classList.remove("active"));
                btn.classList.add("active");

                if (GM_MAP) renderModeMap();
                else results.innerHTML = `<p>Select a map.</p>`;
            };

            teamWrapper.appendChild(btn);
        });
    }

    loadTeamButtons();

    // ===================================================================
    // TEAM DROPDOWN (VS MODE)
    // ===================================================================

    function loadTeamDropdownVS() {
        teamSelectVS.innerHTML = "";

        Object.keys(teams).forEach(team => {
            teamSelectVS.innerHTML += `<option value="${team}">${cap(team)}</option>`;
        });

        teamSelectVS.onchange = () => {
            GM_TEAM = teamSelectVS.value;
            if (GM_MAP) {
                loadOpponentDropdown();
                results.innerHTML = `<p>Select opponent then RUN.</p>`;
            }
        };

        GM_TEAM = teamSelectVS.value;
    }

    // ===================================================================
    // VIEW TOGGLES
    // ===================================================================

    const viewBtns = {
        overall: document.getElementById("gm-view-overall"),
        vsOpp: document.getElementById("gm-view-vs"),
    };

    function setGMView(view) {
        GM_VIEW = view;

        viewBtns.overall.classList.remove("active");
        viewBtns.vsOpp.classList.remove("active");
        viewBtns[view === "overall" ? "overall" : "vsOpp"].classList.add("active");

        if (view === "vsOpp") {
            teamWrapper.classList.add("hidden");
            vsRow.classList.remove("hidden");
            runVSBtn.classList.remove("hidden");

            loadTeamDropdownVS();
            loadOpponentDropdown();

            results.innerHTML = `<p>Select team, map, opponent, then RUN.</p>`;
        } else {
            teamWrapper.classList.remove("hidden");
            vsRow.classList.add("hidden");
            runVSBtn.classList.add("hidden");

            GM_TEAM = null;
            results.innerHTML = "";
        }
    }

    viewBtns.overall.onclick = () => setGMView("overall");
    viewBtns.vsOpp.onclick   = () => setGMView("vsOpp");

    // ===================================================================
    // OPPONENT DROPDOWN
    // ===================================================================

    function loadOpponentDropdown() {
        oppSelect.innerHTML = "";
        if (!GM_TEAM || !GM_MAP) return;

        const opps = new Set();

        window.matchData.forEach(m => {
            if (
                norm(m.team) === norm(GM_TEAM) &&
                norm(m.mode) === norm(GM_MODE) &&
                norm(m.map) === norm(GM_MAP)
            ) {
                opps.add(norm(m.opponent));
            }
        });

        [...opps].sort().forEach(o => {
            oppSelect.innerHTML += `<option value="${o}">${cap(o)}</option>`;
        });

        oppSelect.onchange = () => {
            results.innerHTML = `<p>Press RUN to update results.</p>`;
        };
    }

    // ===================================================================
    // RUN BUTTON
    // ===================================================================

    runVSBtn.onclick = () => {
        if (!GM_TEAM) return results.innerHTML = `<p>Please select a team.</p>`;
        if (!GM_MAP)  return results.innerHTML = `<p>Please select a map.</p>`;
        if (!oppSelect.value)
            return results.innerHTML = `<p>Please select an opponent.</p>`;
        renderModeMap();
    };

    // ===================================================================
    // SUMMARY CALCULATORS
    // ===================================================================

    function computeMatchSummary(team, mode, map) {
        const rows = window.matchData.filter(m =>
            norm(m.team) === norm(team) &&
            norm(m.mode) === norm(mode) &&
            norm(m.map) === norm(map)
        );

        const unique = new Map();
        rows.forEach(m => {
            if (!unique.has(m.matchID)) {
                unique.set(m.matchID, m);
            }
        });

        const matches = [...unique.values()];
        if (matches.length === 0) {
            return { count: 0, wins: 0, losses: 0, avgLen: "-", avgRounds: "-" };
        }

        let wins = 0, losses = 0, len = 0, lenCount = 0, rnd = 0, rndCount = 0;

        matches.forEach(m => {
            if (m.teamScore > m.oppScore) wins++;
            else losses++;

            if (m.durationSec) {
                len += m.durationSec;
                lenCount++;
            }
            if (m.duration) {
                rnd += m.duration;
                rndCount++;
            }
        });

        return {
            count: matches.length,
            wins,
            losses,
            avgLen: lenCount ? (len / lenCount).toFixed(0) + " sec" : "-",
            avgRounds: rndCount ? (rnd / rndCount).toFixed(1) : "-"
        };
    }

    function computeMatchSummaryVS(team, opponent, mode, map) {
        const rows = window.matchData.filter(m =>
            norm(m.team) === norm(team) &&
            norm(m.opponent) === norm(opponent) &&
            norm(m.mode) === norm(mode) &&
            norm(m.map) === norm(map)
        );

        const unique = new Map();
        rows.forEach(m => {
            if (!unique.has(m.matchID)) unique.set(m.matchID, m);
        });

        const matches = [...unique.values()];
        if (matches.length === 0) {
            return { count: 0, wins: 0, losses: 0, avgLen: "-", avgRounds: "-" };
        }

        let wins = 0, losses = 0, len = 0, lenCount = 0, rnd = 0, rndCount = 0;

        matches.forEach(m => {
            if (m.teamScore > m.oppScore) wins++;
            else losses++;

            if (m.durationSec) {
                len += m.durationSec;
                lenCount++;
            }
            if (m.duration) {
                rnd += m.duration;
                rndCount++;
            }
        });

        return {
            count: matches.length,
            wins,
            losses,
            avgLen: lenCount ? (len / lenCount).toFixed(0) + " sec" : "-",
            avgRounds: rndCount ? (rnd / rndCount).toFixed(1) : "-"
        };
    }

    // ===================================================================
    // MAIN RENDER
    // ===================================================================

    function renderModeMap() {
        if (!GM_TEAM || !GM_MAP) return;
    
        const team = GM_TEAM;
        const map  = GM_MAP;
        const mode = GM_MODE;
        const glow = glowColors[team] ?? "#fff";
    
        let html = `
            <h3 class="mapHeader">${cap(team)} — ${map} (${modeNames[mode]})</h3>
    
            <div class="teamBox" style="--glow:${glow}">
                <img src="./test1/logos/${team}.webp"
                     onerror="this.onerror=null;this.src='./test1/logos/${team}.png'">
    
                <div class="teamTitle">${cap(team)}</div>
    
                <div class="team-player-wrapper">
                    ${renderPlayerTable(team, mode, map)}
                </div>
            </div>
        `;
    
        results.innerHTML = html;
    }
    

    // ===================================================================
    // PLAYER TABLE
    // ===================================================================

    function renderPlayerTable(team, mode, map) {

        const summary = (GM_VIEW === "overall")
            ? computeMatchSummary(team, mode, map)
            : computeMatchSummaryVS(team, oppSelect.value, mode, map);

        let html = `
            <table class="playerTable">
                <tr>
                    <th>Player</th>
                    <th>Avg Kills</th>
                    <th>Avg Deaths</th>
                    <th>K/D</th>
                    <th>Avg Damage</th>
                </tr>
        `;

        teams[team].forEach(player => {
            let filtered = window.matchData.filter(m =>
                norm(m.team) === norm(team) &&
                norm(m.mode) === norm(mode) &&
                norm(m.map) === norm(map) &&
                norm(m.player) === norm(player)
            );

            if (GM_VIEW !== "overall") {
                const opp = oppSelect.value;
                filtered = filtered.filter(m =>
                    norm(m.opponent) === norm(opp)
                );
            }

            if (filtered.length === 0) return;

            const totalKills  = filtered.reduce((a, b) => a + b.kills, 0);
            const totalDeaths = filtered.reduce((a, b) => a + b.deaths, 0);
            const totalDamage = filtered.reduce((a, b) => a + b.damage, 0);
            const updates = filtered.length;

            const avgK = (totalKills / updates).toFixed(1);
            const avgD = (totalDeaths / updates).toFixed(1);
            const kd = totalDeaths > 0
                ? (totalKills / totalDeaths).toFixed(2)
                : totalKills.toFixed(2);
            const avgDmg = totalDamage > 0
                ? (totalDamage / updates).toFixed(1)
                : "-";

            html += `
                <tr>
                    <td>${cap(player)}</td>
                    <td>${avgK}</td>
                    <td>${avgD}</td>
                    <td>${kd}</td>
                    <td>${avgDmg}</td>
                </tr>
            `;
        });

        html += `</table>`;

        // SUMMARY FOOTER
        const s = summary;
        html += `
            <div class="mode-summary-footer">
                <div><b>Matches:</b> ${s.count}</div>
                <div><b>W / L:</b> ${s.wins} - ${s.losses}</div>
                ${
                    mode === "snd"
                    ? `<div><b>Avg Rounds:</b> ${s.avgRounds}</div>`
                    : `<div><b>Avg Length:</b> ${s.avgLen}</div>`
                }
            </div>
        `;

        return html;
    }
}



// Expose globally
window.buildModeTabs = buildModeTabs;
