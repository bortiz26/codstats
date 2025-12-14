// ============================================================
// LAST 5 MATCHES — CLEAN FINAL VERSION WITH LABELS WORKING
// ============================================================

// GLOBAL STATE (must appear ONLY ONCE)
let L5_VIEW = "overall";     // overall | vs
let L5_MODE = "hp";          // hp | snd | overload
let L5_MAP = "";             // selected map or ""


// ============================================================
// BUILD TAB
// ============================================================
function buildLast5Tabs(scores, matches, teams, modeMaps) {

    const root = document.getElementById("tab-last5");

    root.innerHTML = `
        <div class="last5-container">

            <h2 class="bp-title">LAST 5 MATCHES</h2>

            <!-- VIEW TOGGLES -->
            <div class="bp-view-toggle">
                <button id="l5-view-overall" class="bp-toggle-btn active">Overall Last 5</button>
                <button id="l5-view-vs" class="bp-toggle-btn">Vs Specific Opponent</button>
            </div>

            <!-- GAME MODE LABEL -->
            <label class="bp-label" style="margin-top:12px;">Game Modes:</label>

            <!-- MODE TOGGLES -->
            <div class="bp-mode-toggle" id="l5-mode-row">
                <button id="l5-hp"        class="bp-toggle-btn active">Hardpoint</button>
                <button id="l5-snd"       class="bp-toggle-btn">Search & Destroy</button>
                <button id="l5-overload"  class="bp-toggle-btn">Overload</button>
            </div>

            <!-- MAP LABEL -->
            <label class="bp-label" style="margin-top:14px;">Maps:</label>

            <!-- MAP TOGGLES (STATIC WRAPPER) -->
            <div id="l5-map-container">
                <div id="l5-map-wrapper"></div>
            </div>

            <!-- FILTER PANEL -->
            <div id="l5-filter-panel"></div>

            <!-- RUN BUTTON -->
            <button id="l5-run" class="bp-run-btn">RUN</button>

            <!-- OUTPUT -->
            <div id="l5-output"></div>

        </div>
    `;

    setupLast5Listeners(teams, matches, modeMaps);
    renderLast5Filters(teams, matches, modeMaps);
    renderLast5MapToggles(modeMaps, matches, teams);
}



// ============================================================
// EVENT SETUP
// ============================================================
function setupLast5Listeners(teams, matches, modeMaps) {

    // VIEW CHANGE
    document.getElementById("l5-view-overall").onclick = () => {
        L5_VIEW = "overall";
        swapLast5ViewButtons();
        renderLast5Filters(teams, matches, modeMaps);
    };

    document.getElementById("l5-view-vs").onclick = () => {
        L5_VIEW = "vs";
        swapLast5ViewButtons();
        renderLast5Filters(teams, matches, modeMaps);
    };

    // MODE CHANGE
    ["hp", "snd", "overload"].forEach(mode => {
        document.getElementById("l5-" + mode).onclick = () => {
            L5_MODE = mode;
            L5_MAP = ""; // reset map
            swapLast5ModeButtons();
            renderLast5MapToggles(modeMaps, matches, teams);
            renderLast5Filters(teams, matches, modeMaps);
        };
    });

    // RUN BUTTON
    document.getElementById("l5-run").onclick = () =>
        runLast5(matches, teams, modeMaps);
}

function swapLast5ViewButtons() {
    document.getElementById("l5-view-overall").classList.toggle("active", L5_VIEW === "overall");
    document.getElementById("l5-view-vs").classList.toggle("active", L5_VIEW === "vs");
}

function swapLast5ModeButtons() {
    document.getElementById("l5-hp").classList.toggle("active", L5_MODE === "hp");
    document.getElementById("l5-snd").classList.toggle("active", L5_MODE === "snd");
    document.getElementById("l5-overload").classList.toggle("active", L5_MODE === "overload");
}



// ============================================================
// MAP TOGGLES — SAFE UPDATE (NEVER OVERWRITES LABEL)
// ============================================================
function renderLast5MapToggles(modeMaps, matches, teams) {

    const wrapper = document.getElementById("l5-map-wrapper");

    let html = `<div class="gm-map-grid">`;

    modeMaps[L5_MODE].forEach(mapName => {

        const clean = mapName
            .trim()
            .replace(/\s+/g, "")
            .replace(/[^a-zA-Z0-9]/g, "")
            .toLowerCase();

        const active = (L5_MAP === mapName) ? "active" : "";

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

    wrapper.innerHTML = html;

    // CLICK BEHAVIOR
    document.querySelectorAll("#l5-map-wrapper .gm-map-card").forEach(card => {
        card.onclick = () => {
            const clicked = card.dataset.map;

            // Toggle off
            if (L5_MAP === clicked) {
                L5_MAP = "";
                document
                    .querySelectorAll("#l5-map-wrapper .gm-map-card")
                    .forEach(c => c.classList.remove("active"));

                if (L5_VIEW === "vs") loadL5Opponents(matches, teams);
                return;
            }

            // Set selected
            L5_MAP = clicked;

            document
                .querySelectorAll("#l5-map-wrapper .gm-map-card")
                .forEach(c => c.classList.remove("active"));

            card.classList.add("active");

            if (L5_VIEW === "vs") loadL5Opponents(matches, teams);
        };
    });
}




function renderLast5Filters(teams, matches, modeMaps) {

    const root = document.getElementById("l5-filter-panel");

    const teamsHtml = Object.keys(teams)
        .map(t => `<option value="${t}">${cap(teams[t].name)}</option>`)
        .join("");

    const firstTeam = Object.keys(teams)[0];

    const playersHtml = (teams[firstTeam]?.players || [])
        .map(p => `<option value="${p}">${cap(p)}</option>`)
        .join("");

    if (L5_VIEW === "overall") {
        root.innerHTML = `
            <div class="l5-filter-row">
                <label>Team:</label>
                <select id="l5-team">${teamsHtml}</select>

                <label>Players:</label>
                <select id="l5-player">
                    <option value="all">All Players</option>
                    ${playersHtml}
                </select>
            </div>
        `;
    }

    if (L5_VIEW === "vs") {
        root.innerHTML = `
            <div class="l5-filter-row">
                <label>Team:</label>
                <select id="l5-team">${teamsHtml}</select>

                <label>Players:</label>
                <select id="l5-player">
                    <option value="all">All Players</option>
                    ${playersHtml}
                </select>

                <label>Opponent:</label>
                <select id="l5-opponent"></select>
            </div>
        `;
    }

    // Team switching updates player list
    document.getElementById("l5-team").onchange = e => {
        const team = e.target.value;

        document.getElementById("l5-player").innerHTML =
            `<option value="all">All Players</option>` +
            (teams[team]?.players || [])
                .map(p => `<option value="${p}">${cap(p)}</option>`)
                .join("");

        if (L5_VIEW === "vs") loadL5Opponents(matches, teams);
    };

    if (L5_VIEW === "vs") loadL5Opponents(matches, teams);
}




// ============================================================
// VS FILTER — OPPONENT SELECT
// ============================================================
function loadL5Opponents(matches, teams) {
    const oppSelect = document.getElementById("l5-opponent");
    const teamSel   = document.getElementById("l5-team");

    if (!oppSelect || !teamSel) return;

    const team = teamSel.value;

    oppSelect.innerHTML = "";
    const seen = new Set();

    matches.forEach(m => {
        if (
            m.team === team &&
            m.mode === L5_MODE &&
            (L5_MAP === "" || m.map === L5_MAP)
        ) {
            const o = m.opponent?.trim();
            if (o && !seen.has(o)) {
                seen.add(o);
                oppSelect.innerHTML += `<option value="${o}">${cap(o)}</option>`;
            }
        }
    });

    if (seen.size === 0) {
        oppSelect.innerHTML = `<option value="">No opponents found</option>`;
    }
}



function runLast5(matches, teams, modeMaps) {

    const out = document.getElementById("l5-output");
    out.innerHTML = "";

    const team = document.getElementById("l5-team")?.value;
    const selectedPlayer = document.getElementById("l5-player")?.value;

    if (!team) return;

    const glow = glowColors[team] ?? "#fff";

    // Determine players to show safely
    let playersToShow = [];

    if (selectedPlayer === "all") {
        playersToShow = Array.isArray(teams[team]?.players)
            ? teams[team].players
            : [];
    } else {
        playersToShow = [selectedPlayer];
    }

    let fullHTML = "";

    playersToShow.forEach(playerName => {
        let filtered = matches.filter(m =>
            m.team === team &&
            m.player === playerName &&
            m.mode === L5_MODE
        );

        if (L5_MAP !== "")
            filtered = filtered.filter(m => m.map === L5_MAP);

        if (L5_VIEW === "vs") {
            const opp = document.getElementById("l5-opponent")?.value;
            filtered = filtered.filter(m => m.opponent === opp);
        }

        const final5 = filtered
            .sort((a, b) => b.matchID - a.matchID)
            .slice(0, 5)
            .reverse();

        if (final5.length === 0) {
            fullHTML += `
                <h3 class="mapHeader" style="margin-top:25px;">
                    ${teams[team]?.players?.includes(playerName) ? teams[team].name + " — " + playerName : playerName}
                </h3>
                <div class="noData">No matches found.</div>
            `;
            return;
        }

        let html = `
            <h3 class="mapHeader" style="margin-top:25px;">
                ${teams[team]?.players?.includes(playerName) ? teams[team].name + " — " + playerName : playerName}
            </h3>
            <div class="match-strip">
        `;

        final5.forEach(m => {
            const kd = m.deaths > 0
                ? (m.kills / m.deaths).toFixed(2)
                : m.kills.toFixed(2);

            html += `
                <div class="match-card" style="--glow:${glow}">
                    <div class="card-map">${m.map} — ${cap(L5_MODE)}</div>
                    <div class="card-opponent">
                        vs <span class="oppName">${teams[m.opponent]?.name ?? m.opponent ?? "Unknown"}</span>
                    </div>
                    <div>K: ${m.kills} &nbsp;&nbsp; D: ${m.deaths}</div>
                    <div class="${parseFloat(kd) >= 1 ? "kd-good" : "kd-bad"}">${kd} KD</div>
                    <div>DMG: ${m.damage ?? "-"}</div>
                    <div class="card-score">${m.teamScore} - ${m.oppScore}</div>
                </div>
            `;
        });

        html += `</div>`;
        fullHTML += html;
    });

    out.innerHTML = fullHTML;
}

