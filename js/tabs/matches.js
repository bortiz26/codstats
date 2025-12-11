// ============================================================
// MATCHES TAB — QUERY SYSTEM + FULL CARD (WINNER GLOW)
// MAP IMAGE GRID ADDED (EXACT SAME SYSTEM AS modes.js + last5.js)
// ============================================================

function buildMatchesTabs(matches, teams, modeMaps) {

    const root = document.getElementById("tab-matches");
    if (!root) return;
    root.innerHTML = "";

    // ============================================================
    // TOP UI — MODES → MAPS → TEAM/OPP → RUN
    // ============================================================

    root.innerHTML = `
        <div class="vm-container">

            <h2 class="bp-title">HEAD-TO-HEAD</h2>

            <!-- GAME MODES -->
            <label class="bp-label">Game Modes:</label>
            <div id="vm-mode-toggle" class="bp-mode-toggle"></div>

            <!-- MAPS -->
            <label class="bp-label">Maps:</label>
            <div id="vm-map-wrapper"></div>

            <!-- TEAM + OPPONENT -->
            <div class="vm-flex">
                <div class="vm-col">
                    <label class="bp-label">Team:</label>
                    <select id="vm-team" class="vm-dropdown">
                        <option value="">Select Team</option>
                    </select>
                </div>

                <div class="vm-col">
                    <label class="bp-label">Opponent:</label>
                    <select id="vm-opponent" class="vm-dropdown">
                        <option value="">Select Opponent</option>
                    </select>
                </div>
            </div>

            <!-- RUN BUTTON -->
            <button id="vm-run" class="vm-run-btn">RUN</button>

            <!-- RESULTS -->
            <div id="vm-results"></div>
        </div>
    `;

    const modeBox    = document.getElementById("vm-mode-toggle");
    const mapBox     = document.getElementById("vm-map-wrapper");
    const teamDrop   = document.getElementById("vm-team");
    const oppDrop    = document.getElementById("vm-opponent");
    const runBtn     = document.getElementById("vm-run");
    const resultsBox = document.getElementById("vm-results");

    // ============================================================
    // MODE BUTTONS
    // ============================================================

    let VM_MODE = "hp";

    modeBox.innerHTML = `
        <button data-mode="hp" class="bp-toggle-btn active">Hardpoint</button>
        <button data-mode="snd" class="bp-toggle-btn">Search & Destroy</button>
        <button data-mode="overload" class="bp-toggle-btn">Overload</button>
    `;

    modeBox.querySelectorAll("button").forEach(btn => {
        btn.onclick = () => {
            modeBox.querySelectorAll("button").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            VM_MODE = btn.dataset.mode;
            loadMaps();
        };
    });

    // ============================================================
    // MAPS (IMAGE GRID)
    // ============================================================

    let VM_MAP = "";

    function loadMaps() {
        const maps = modeMaps[VM_MODE] ?? [];

        let html = `<div class="gm-map-grid">`;

        maps.forEach(mapName => {

            const clean = mapName
                .trim()
                .replace(/\s+/g, "")
                .replace(/[^a-zA-Z0-9]/g, "")
                .toLowerCase();

            const active = (VM_MAP === mapName) ? "active" : "";

            html += `
                <div class="gm-map-card ${active}" data-map="${mapName}">
                    <img class="gm-map-thumb"
                         src="test1/maps/${clean}.webp"
                         onerror="this.onerror=null;this.src='test1/maps/${clean}.png'">

                    <div class="gm-map-name">${mapName}</div>
                </div>
            `;
        });

        html += `</div>`;

        mapBox.innerHTML = html;

        VM_MAP = "";
        teamDrop.innerHTML = `<option value="">Select Team</option>`;
        oppDrop.innerHTML  = `<option value="">Select Opponent</option>`;

        // CLICK BEHAVIOR
        document.querySelectorAll("#vm-map-wrapper .gm-map-card").forEach(card => {
            card.onclick = () => {

                const clicked = card.dataset.map;

                // Toggle off
                if (VM_MAP === clicked) {
                    VM_MAP = "";
                    document
                        .querySelectorAll("#vm-map-wrapper .gm-map-card")
                        .forEach(c => c.classList.remove("active"));
                    teamDrop.innerHTML = `<option value="">Select Team</option>`;
                    oppDrop.innerHTML  = `<option value="">Select Opponent</option>`;
                    return;
                }

                // Select map
                VM_MAP = clicked;

                document
                    .querySelectorAll("#vm-map-wrapper .gm-map-card")
                    .forEach(c => c.classList.remove("active"));

                card.classList.add("active");

                loadTeams();
            };
        });
    }

    loadMaps();

    // ============================================================
    // LOAD TEAMS BASED ON MODE+MAP
    // ============================================================

    function loadTeams() {
        const filtered = matches.filter(m => m.mode === VM_MODE && m.map === VM_MAP);
        const teamList = [...new Set(filtered.map(m => m.team))];

        teamDrop.innerHTML =
            `<option value="">Select Team</option>` +
            teamList.map(t => `<option value="${t}">${cap(t)}</option>`).join("");

        oppDrop.innerHTML = `<option value="">Select Opponent</option>`;
    }

    // ============================================================
    // LOAD OPPONENTS BASED ON TEAM
    // ============================================================

    teamDrop.onchange = () => {
        const team = teamDrop.value;
        if (!team) return;

        const relevant = matches.filter(
            m => m.team === team && m.mode === VM_MODE && m.map === VM_MAP
        );

        const matchIDs = [...new Set(relevant.map(m => m.matchID))];

        let opps = [];
        matchIDs.forEach(mid => {
            const allTeams = matches.filter(m => m.matchID === mid);
            const list = [...new Set(allTeams.map(m => m.team))];
            const opponent = list.find(t => t !== team);
            if (opponent) opps.push(opponent);
        });

        opps = [...new Set(opps)];

        oppDrop.innerHTML =
            `<option value="">Select Opponent</option>` +
            opps.map(t => `<option value="${t}">${cap(t)}</option>`).join("");
    };

    // ============================================================
    // RUN — SHOW MATCH CARDS
    // ============================================================

    runBtn.onclick = () => {
        const team = teamDrop.value;
        const opp  = oppDrop.value;

        if (!team || !opp) {
            resultsBox.innerHTML = `<div class="warnBox">Select team and opponent.</div>`;
            return;
        }

        renderMatches(team, opp);
    };

    // ============================================================
    // RENDER MATCH CARDS — NEWEST FIRST
    // ============================================================

    function renderMatches(team, opp) {

        const filtered = matches.filter(
            m => m.team === team && m.mode === VM_MODE && m.map === VM_MAP
        );

        if (filtered.length === 0) {
            resultsBox.innerHTML = `<div class="warnBox">No matches found.</div>`;
            return;
        }

        const matchIDs = [...new Set(filtered.map(m => m.matchID))];
        matchIDs.sort((a, b) => b - a);

        let html = "";

        matchIDs.forEach(mid => {
            const all = matches.filter(m => m.matchID === mid);
            const my  = all.filter(m => m.team === team);
            const op  = all.filter(m => m.team === opp);

            if (!my.length || !op.length) return;

            const date     = my[0].date;
            const myScore  = my[0].teamScore;
            const oppScore = my[0].oppScore;

            const myGlow  = glowColors[team] ?? "#fff";
            const oppGlow = glowColors[opp] ?? "#fff";

            const glow =
                myScore > oppScore ? myGlow :
                oppScore > myScore ? oppGlow : "#666";

            // FULL CARD
            html += `
                <div class="matchCardFull" style="--glow:${glow}">

                    <div class="mc-score">${myScore} — ${oppScore}</div>

                    <div class="mc-header">
                        <img class="mc-logo" src="test1/logos/${team}.webp"
                             onerror="this.src='test1/logos/${team}.png'">

                        <div class="mc-vs-text">${cap(team)} VS ${cap(opp)}</div>

                        <img class="mc-logo" src="test1/logos/${opp}.webp"
                             onerror="this.src='test1/logos/${opp}.png'">
                    </div>

                    <img class="mc-mobile-logo" src="test1/logos/${team}.webp"
                         onerror="this.src='test1/logos/${team}.png'">
                    <div class="mc-table-title">${cap(team)}</div>

                    <div class="mc-tables">

                        <table class="mc-table">
                            <tr><th>PLAYER</th><th>K</th><th>D</th><th>K/D</th><th>DMG</th></tr>
                            ${my.map(p => `
                                <tr>
                                    <td>${cap(p.player)}</td>
                                    <td>${p.kills}</td>
                                    <td>${p.deaths}</td>
                                    <td>${p.deaths ? (p.kills/p.deaths).toFixed(2) : p.kills.toFixed(2)}</td>
                                    <td>${p.damage ?? "-"}</td>
                                </tr>
                            `).join("")}
                        </table>

                        <img class="mc-mobile-logo" src="test1/logos/${opp}.webp"
                             onerror="this.src='test1/logos/${opp}.png'">
                        <div class="mc-table-title">${cap(opp)}</div>

                        <table class="mc-table">
                            <tr><th>PLAYER</th><th>K</th><th>D</th><th>K/D</th><th>DMG</th></tr>
                            ${op.map(p => `
                                <tr>
                                    <td>${cap(p.player)}</td>
                                    <td>${p.kills}</td>
                                    <td>${p.deaths}</td>
                                    <td>${p.deaths ? (p.kills/p.deaths).toFixed(2) : p.kills.toFixed(2)}</td>
                                    <td>${p.damage ?? "-"}</td>
                                </tr>
                            `).join("")}
                        </table>

                    </div>

                    <div class="mc-date">${date}</div>

                </div>
            `;
        });

        resultsBox.innerHTML = html;
    }
}
