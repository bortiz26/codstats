// ============================================================
// BEST PICKS TAB (UI + ENGINE)
// ============================================================

// MAIN ENTRY FROM init.js
function buildBestPicksTabs(matches, teams, modeMaps) {

    const root = document.getElementById("tab-bestpicks");
    root.innerHTML = "";

    const modes = Object.keys(modeMaps);

    root.innerHTML = `
        <div class="bp-container">
            <h2 class="bp-title">BEST PICKS ANALYZER</h2>

            <label class="bp-label">Team</label>
            <select id="bp-team">
                <option value="">Any</option>
                ${Object.keys(teams).map(t =>
                    `<option value="${t}">${cap(t)}</option>`
                ).join("")}
            </select>

            <label class="bp-label">Mode</label>
            <select id="bp-mode">
                ${modes.map(m =>
                    `<option value="${m}">${modeNames[m]}</option>`
                ).join("")}
            </select>

            <label class="bp-label">Map</label>
            <select id="bp-map">
                ${
                    modes.flatMap(m =>
                        modeMaps[m].map(mp =>
                            `<option value="${mp}">${mp} (${modeNames[m]})</option>`
                        )
                    ).join("")
                }
            </select>

            <label class="bp-label">Line</label>
            <input id="bp-line" type="number" placeholder="Enter kill line">

            <button id="bp-run" class="bp-btn">RUN BEST PICKS</button>

            <div id="bp-results" class="bp-results"></div>
        </div>
    `;

    document.getElementById("bp-run").onclick = () => {

        const team = document.getElementById("bp-team").value;
        const mode = document.getElementById("bp-mode").value;
        const map  = document.getElementById("bp-map").value;
        const line = Number(document.getElementById("bp-line").value || 0);

        const out = document.getElementById("bp-results");

        const html = runBestPicks(matches, teams, {
            team, mode, map, line
        });

        out.innerHTML = html;
    };
}



// ============================================================
// CORE BEST PICKS ENGINE
// ============================================================

function runBestPicks(matches, teams, q) {

    const { team, mode, map, line } = q;

    if (mode !== "hp") {
        return `<div class="bp-results-note">HP MODEL ONLY</div>`;
    }

    let rows = [];

    Object.keys(teams).forEach(t => {

        if (team && t !== team) return;

        teams[t].forEach(player => {

            const pm = matches.filter(m =>
                m.team === t &&
                m.player === player &&
                m.mode === "hp" &&
                m.map === map
            );

            if (pm.length === 0) return;

            const last = pm[pm.length - 1];
            const dur = last.durationSec || 360;

            const exp = computeHPExpected(matches, t, player, map, last.opponent, dur);
            const prob = hpProbability(exp.raw, line, exp.scale);

            rows.push({
                player,
                team: t,
                raw: exp.raw,
                norm: exp.norm,
                diff: exp.raw - line,
                prob: prob * 100,
                season: exp.weightMode
            });
        });

    });

    if (rows.length === 0) {
        return `<div class="bp-results-note">NO MATCHES FOUND</div>`;
    }

    rows.sort((a, b) => b.prob - a.prob);

    let html = `
    <table class="bp-table">
        <tr>
            <th>PLAYER</th>
            <th>RAW</th>
            <th>NORM</th>
            <th>DIFF</th>
            <th>PROB</th>
            <th>CONF</th>
        </tr>
    `;

    rows.forEach(r => {

        const color =
            r.prob >= 60 ? "#4cd137" :
            r.prob >= 45 ? "#fbc531" :
                           "#e84118";

        html += `
        <tr>
            <td>${cap(r.player)} (${cap(r.team)})</td>
            <td>${r.raw.toFixed(2)}</td>
            <td>${r.norm.toFixed(2)}</td>
            <td>${r.diff.toFixed(2)}</td>
            <td style="color:${color}">${r.prob.toFixed(1)}%</td>
            <td>${r.season}</td>
        </tr>`;
    });

    html += `</table>`;
    return html;
}
