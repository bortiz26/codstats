// ============================================================
<<<<<<< HEAD
// BEST PICKS TAB — HP ENGINE V5A + SND ENGINE
=======
// BEST PICKS TAB — HP & SND (Dual-Mode) with Full HP-Style Logic
>>>>>>> 454292ec1ab8fa17ef12087c6e862c03f9af0b31
// ============================================================

let BP_MODE = "hp";

<<<<<<< HEAD
// ------------------------------------------------------------
// Switch HP/SND mode + repopulate maps
// ------------------------------------------------------------
function setBPMODE(mode, modeMaps) {
    BP_MODE = mode;

=======
// Switch HP/SND mode + repopulate maps
function setBPMODE(mode, modeMaps) {
    BP_MODE = mode;
>>>>>>> 454292ec1ab8fa17ef12087c6e862c03f9af0b31
    const mapSelect = document.getElementById("bp-map");
    mapSelect.innerHTML = modeMaps[mode]
        .map(m => `<option value="${m}">${m}</option>`)
        .join("");
}

// ============================================================
// BUILD BEST PICKS UI
// ============================================================
function buildBestPicksTabs(matches, teams, modeMaps) {
    const root = document.getElementById("tab-bestpicks");
    root.innerHTML = `
    <div class="bp-container">

        <h2 class="bp-title">BEST PICKS</h2>

        <div class="bp-mode-toggle">
            <button id="bp-hp"  class="bp-toggle-btn active">Hardpoint</button>
            <button id="bp-snd" class="bp-toggle-btn">Search & Destroy</button>
        </div>

        <label class="bp-label">Team</label>
        <select id="bp-team">
            <option value="">Any</option>
            ${Object.keys(teams)
                .map(t => `<option value="${t}">${cap(t)}</option>`)
                .join("")}
        </select>

        <label class="bp-label">Opponent</label>
        <select id="bp-opp">
            <option value="">Any</option>
            ${Object.keys(teams)
                .map(t => `<option value="${t}">${cap(t)}</option>`)
                .join("")}
        </select>

        <label class="bp-label">Map</label>
        <select id="bp-map">
            ${modeMaps["hp"]
                .map(m => `<option value="${m}">${m}</option>`)
                .join("")}
        </select>

        <label class="bp-label">Kill Line</label>
<<<<<<< HEAD
        <input id="bp-line" type="number" placeholder="Ex: 24">
=======
        <input id="bp-line" type="number" placeholder="Ex: 7">
>>>>>>> 454292ec1ab8fa17ef12087c6e862c03f9af0b31

        <button id="bp-run" class="bp-run-btn">RUN</button>

        <div id="bp-results" class="bp-results"></div>

    </div>`;

<<<<<<< HEAD
    // Mode toggles
=======
    // Mode toggle
>>>>>>> 454292ec1ab8fa17ef12087c6e862c03f9af0b31
    document.getElementById("bp-hp").onclick = () => {
        document.getElementById("bp-hp").classList.add("active");
        document.getElementById("bp-snd").classList.remove("active");
        setBPMODE("hp", modeMaps);
    };
<<<<<<< HEAD

=======
>>>>>>> 454292ec1ab8fa17ef12087c6e862c03f9af0b31
    document.getElementById("bp-snd").onclick = () => {
        document.getElementById("bp-snd").classList.add("active");
        document.getElementById("bp-hp").classList.remove("active");
        setBPMODE("snd", modeMaps);
    };

<<<<<<< HEAD
    // Run Best Picks
=======
>>>>>>> 454292ec1ab8fa17ef12087c6e862c03f9af0b31
    document.getElementById("bp-run").onclick = () => {
        const team = document.getElementById("bp-team").value.trim();
        const opp  = document.getElementById("bp-opp").value.trim();
        const map  = document.getElementById("bp-map").value.trim();
        const line = Number(document.getElementById("bp-line").value || 0);

        document.getElementById("bp-results").innerHTML =
            runBestPicks(matches, teams, { team, opp, map, line });
    };
}

// ============================================================
<<<<<<< HEAD
// MAIN BEST PICKS ENGINE (HP V5A + SND)
=======
// BEST PICKS ENGINE (HP + NEW SND ENGINE)
>>>>>>> 454292ec1ab8fa17ef12087c6e862c03f9af0b31
// ============================================================
function runBestPicks(matches, teams, q) {

    const { team, opp, map, line } = q;
    let rows = [];

    Object.keys(teams).forEach(t => {

        if (team && t !== team) return;

        teams[t].forEach(player => {

<<<<<<< HEAD
            // ---------------------------------------
            // Filter matches belonging to this player
            // ---------------------------------------
=======
>>>>>>> 454292ec1ab8fa17ef12087c6e862c03f9af0b31
            const pm = matches.filter(m =>
                m.team === t &&
                m.player === player &&
                m.map === map &&
                m.mode === BP_MODE &&
                (opp === "" || m.opponent === opp)
            );

            if (pm.length === 0) return;

<<<<<<< HEAD
            // Auto-detect opponent if "Any"
            const opponent =
                opp ||
                pm[pm.length - 1].opponent ||
                "";

            if (!opponent) return;

            let exp, prob;

            // =======================================================
            // ⭐ HARDPOINT ENGINE V5A — RECENCY + DEFENSE-CONTROLLED
            // =======================================================
            if (BP_MODE === "hp") {

                exp = expectedHPKills(matches, t, player, map, opponent);

                prob = probOverHP(matches, t, player, map, opponent, line);

            } else {

                // =======================================================
                // ⭐ SND ENGINE (Unchanged)
                // =======================================================
                exp = expectedSNDKills(matches, t, player, map, opponent);

                prob = poissonOverSND(
                    exp.raw,
                    line,
                    exp.alpha
                );
            }

            const expected = exp.raw;
            const probPct = prob * 100;
=======
            const opponent = opp || pm[pm.length - 1].opponent || "";
            if (!opponent) return;

            let exp;
            if (BP_MODE === "hp") {
                exp = expectedHPKills(matches, t, player, map, opponent);
            } else {
                exp = expectedSNDKills(matches, t, player, map, opponent);
            }

            const expected = exp.raw;

            let prob;
            if (BP_MODE === "hp") {
                prob = poissonOver(expected, line, exp.varBoost);
            } else {
                prob = poissonOverSND(expected, line, exp.varBoost);
            }
>>>>>>> 454292ec1ab8fa17ef12087c6e862c03f9af0b31

            rows.push({
                player,
                team: t,
                expected,
                diff: expected - line,
<<<<<<< HEAD
                prob: probPct
=======
                prob: prob * 100
>>>>>>> 454292ec1ab8fa17ef12087c6e862c03f9af0b31
            });
        });
    });

    if (rows.length === 0)
        return `<p>No matching matches found for these filters.</p>`;

<<<<<<< HEAD
    // Sort by probability descending
    rows.sort((a, b) => b.prob - a.prob);

    // ------------------------------------------------------------
    // Build results table
    // ------------------------------------------------------------
=======
    rows.sort((a, b) => b.prob - a.prob);

>>>>>>> 454292ec1ab8fa17ef12087c6e862c03f9af0b31
    let html = `
    <table class="bp-table">
        <tr>
            <th>PLAYER</th>
            <th>EXPECTED</th>
            <th>LINE</th>
            <th>DIFF</th>
            <th>PROB OVER</th>
        </tr>`;

    rows.forEach(r => {
        const color =
            r.prob >= 60 ? "#2ecc71" :
            r.prob >= 40 ? "#f1c40f" :
            "#e74c3c";

        html += `
        <tr>
            <td>${cap(r.player)} (${cap(r.team)})</td>
            <td>${r.expected.toFixed(2)}</td>
            <td>${line.toFixed(1)}</td>
            <td>${r.diff.toFixed(2)}</td>
            <td style="color:${color}">${r.prob.toFixed(1)}%</td>
        </tr>`;
    });

    html += `</table>`;
    return html;
}
