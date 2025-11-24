// ============================================================
// GAME MODES TAB BUILDER
// ============================================================

function buildModeTabs(scores, teams, modeMaps) {

    const root = document.getElementById("tab-modes");
    root.innerHTML = "";

    const modes = Object.keys(modeMaps);

    modes.forEach(mode => {

        const modeID = "mode_" + mode;
        const modePrefix = "mode_";

        // ==========================
        // MODE HEADER
        // ==========================
        root.innerHTML += `
            <h2 class="modeHeader"
                onclick="collapseExcept('${modePrefix}', '${modeID}'); toggleSection('${modeID}', event)">
                ${modeNames[mode]}
            </h2>
            <div id="${modeID}" class="hidden"></div>
        `;

        const modeBox = document.getElementById(modeID);

        // ==========================
        // MAPS FOR THIS MODE
        // ==========================
        modeMaps[mode].forEach(map => {

            const mapID = modeID + "_" + map.replace(/\W/g, "_");
            const mapPrefix = modeID + "_";

            modeBox.innerHTML += `
                <h3 class="mapHeader"
                    onclick="collapseExcept('${mapPrefix}', '${mapID}'); toggleSection('${mapID}', event)">
                    ${map}
                </h3>
                <div id="${mapID}" class="hidden"></div>
            `;

            const mapBox = document.getElementById(mapID);

            // ==========================
            // TEAMS THAT HAVE SCORES
            // ==========================
            Object.keys(teams).forEach(team => {
                if (!scores[team] || !scores[team][mode] || !scores[team][mode][map])
                    return;

                const glow = glowColors[team] ?? "#fff";
                const teamID = mapID + "_" + team.replace(/\W/g, "_");
                const teamPrefix = mapID + "_";

                mapBox.innerHTML += `
                    <div class="teamBox"
                         style="--glow:${glow}"
                         onclick="collapseExcept('${teamPrefix}', '${teamID}'); toggleSection('${teamID}', event)">

                        <img src="test1/logos/${team}.webp"
                             onerror="this.onerror=null;this.src='test1/logos/${team}.png'">

                        <div class="teamTitle">${cap(team)}</div>
                        <div id="${teamID}" class="hidden"></div>
                    </div>
                `;

                const playerBox = document.getElementById(teamID);

                // ==========================
                // PLAYER TABLE
                // ==========================
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

                    const st = scores?.[team]?.[mode]?.[map]?.[player];
                    if (!st || !st.updates) return;

                    const avgK = (st.totalKills / st.updates).toFixed(1);
                    const avgD = (st.totalDeaths / st.updates).toFixed(1);

                    const kd = st.totalDeaths > 0
                        ? (st.totalKills / st.totalDeaths).toFixed(2)
                        : st.totalKills.toFixed(2);

                    const avgDmg = st.totalDamage > 0 && st.updates > 0
                        ? (st.totalDamage / st.updates).toFixed(1)
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
                playerBox.innerHTML = html;

            }); // END teams loop

        }); // END map loop

    }); // END modes loop
} // END buildModeTabs



// ============================================================
// TOGGLE HANDLER (for collapsible sections)
// ============================================================
function toggleSection(id, event) {
    if (event) event.stopPropagation();
    const el = document.getElementById(id);
    if (!el) return;

    el.style.display = (el.style.display !== "block" ? "block" : "none");
}
