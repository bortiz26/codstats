// ============================================================
// LAST 5 MATCHES TAB
// ============================================================

function buildLast5Tabs(scores, matches, teams, modeMaps) {

    const root = document.getElementById("tab-last5");
    root.innerHTML = "";

    const modes = Object.keys(modeMaps);

    // ============================================================
    // TEAMS
    // ============================================================
    Object.keys(teams).forEach(team => {

        const glow = glowColors[team] ?? "#fff";
        const teamID = "last5_" + team.replace(/\W/g, "_");
        const prefix = "last5_";

        // TEAM BOX
        root.innerHTML += `
            <div class="teamBox"
                 style="--glow:${glow}"
                 onclick="collapseExcept('${prefix}', '${teamID}'); toggleSection('${teamID}', event)">
                 
                <img src="test1/logos/${team}.webp"
                     onerror="this.onerror=null;this.src='test1/logos/${team}.png'">

                <div class="teamTitle">${cap(team)}</div>
                <div id="${teamID}" class="hidden"></div>
            </div>
        `;

        const teamBox = document.getElementById(teamID);

        // ============================================================
        // PLAYERS
        // ============================================================
        teams[team].forEach(player => {

            const playerID = teamID + "_" + player.replace(/\W/g, "_");

            teamBox.innerHTML += `
                <h3 class="mapHeader" onclick="toggleSection('${playerID}', event)">
                    ${cap(player)}
                </h3>
                <div id="${playerID}" class="hidden"></div>
            `;

            const playerBox = document.getElementById(playerID);

            // ============================================================
            // MODES (HP, SND, OL)
            // ============================================================
            modes.forEach(mode => {

                // Player's most recent matches (sorted newest → older)
                const recent = matches
                    .filter(m =>
                        m.team === team &&
                        m.player === player &&
                        m.mode === mode
                    )
                    .sort((a, b) => b.matchID - a.matchID)
                    .slice(0, 5)
                    .reverse(); // Oldest → newest

                if (recent.length === 0) return;

                const modeID = playerID + "_" + mode;

                playerBox.innerHTML += `
                    <h4 class="modeHeaderSmall" onclick="toggleSection('${modeID}', event)">
                        ${modeNames[mode]}
                    </h4>
                    <div id="${modeID}" class="hidden"></div>
                `;

                const modeBox = document.getElementById(modeID);

                // ============================================================
                // RENDER LAST 5 MATCH CARDS
                // ============================================================
                let html = `<div class="match-strip">`;

                recent.forEach(m => {

                    const kd =
                        m.deaths > 0
                            ? (m.kills / m.deaths).toFixed(2)
                            : m.kills.toFixed(2);

                    const kdClass = (parseFloat(kd) >= 1.0 ? "kd-good" : "kd-bad");

                    html += `
                        <div class="match-card" style="--glow:${glow}">
                            
                            <div class="card-map">${m.map} — ${modeNames[m.mode]}</div>

                            <div class="card-opponent">
                                vs <span class="oppName">${cap(m.opponent || "unknown")}</span>
                            </div>

                            <div>K: ${m.kills} &nbsp;&nbsp; D: ${m.deaths}</div>
                            <div class="${kdClass}">${kd} KD</div>

                            <div>DMG: ${m.damage ?? "-"}</div>

                            <div class="card-score">
                                ${m.teamScore} - ${m.oppScore}
                            </div>

                        </div>
                    `;
                });

                html += `</div>`;
                modeBox.innerHTML = html;
            });
        });
    });
}
