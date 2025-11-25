// ============================================================
// MATCHES TAB BUILDER  — with DAMAGE added
// ============================================================

function buildMatchesTabs(matches, teams, modeMaps) {

    const root = document.getElementById("tab-matches");
    root.innerHTML = "";

    const modes = Object.keys(modeMaps);

    // ============================================================
    // MODE HEADERS
    // ============================================================
    modes.forEach(mode => {

        const modeID = "matchMode_" + mode;
        const modePrefix = "matchMode_";

        root.innerHTML += `
            <h2 class="modeHeader"
                onclick="collapseExcept('${modePrefix}', '${modeID}'); toggleSection('${modeID}', event)">
                ${modeNames[mode]}
            </h2>
            <div id="${modeID}" class="hidden"></div>
        `;

        const modeBox = document.getElementById(modeID);

        // ============================================================
        // MAP HEADERS
        // ============================================================
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

            // ============================================================
            // FIND TEAMS THAT PLAYED THIS MODE/MAP
            // ============================================================
            const teamsPlayed = [...new Set(
                matches
                    .filter(m => m.mode === mode && m.map === map)
                    .map(m => m.team)
            )];

            teamsPlayed.forEach(team => {

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

                const teamBox = document.getElementById(teamID);

                // ============================================================
                // MATCH IDs involving this team/mode/map
                // ============================================================
                const teamMatches = matches
                    .filter(m =>
                        m.team === team &&
                        m.mode === mode &&
                        m.map === map
                    )
                    .sort((a, b) => b.matchID - a.matchID);

                const matchIDs = [...new Set(teamMatches.map(m => m.matchID))];

                const opponents = {};

                // ============================================================
                // GROUP MATCHES BY OPPONENT
                // ============================================================
                matchIDs.forEach(mid => {

                    const all = matches.filter(m => m.matchID === mid);

                    const myPlayers = all.filter(m => m.team === team);

                    const oppTeam =
                        [...new Set(all.map(m => m.team))]
                            .find(x => x !== team) || "Unknown";

                    const oppPlayers = all.filter(m => m.team === oppTeam);

                    const entry = {
                        date: myPlayers[0].date,
                        myScore: myPlayers[0].teamScore,
                        oppScore: myPlayers[0].oppScore,
                        myPlayers,
                        oppPlayers
                    };

                    if (!opponents[oppTeam]) opponents[oppTeam] = [];
                    opponents[oppTeam].push(entry);
                });

                // ============================================================
                // RENDER OPPONENT SECTIONS
                // ============================================================
                Object.keys(opponents).forEach(opp => {

                    const oppID = teamID + "_opp_" + opp.replace(/\W/g, "_");
                    const oppPrefix = teamID + "_opp_";

                    teamBox.innerHTML += `
                        <h4 class="mapHeader"
                            onclick="collapseExcept('${oppPrefix}', '${oppID}'); toggleSection('${oppID}', event)">
                            VS ${cap(opp)}
                        </h4>
                        <div id="${oppID}" class="hidden"></div>
                    `;

                    const oppBox = document.getElementById(oppID);
                    let html = "";

                    // ============================================================
                    // RENDER EACH MATCH (NOW WITH DAMAGE)
                    // ============================================================
                    opponents[opp].forEach(entry => {

                        html += `
                            <div class="matchCardSide" style="--glow:${glow}">

                                <!-- SCORE HEADER -->
                                <div class="matchHeader">
                                    <div class="matchScoreBig">
                                        ${entry.myScore} — ${entry.oppScore}
                                    </div>

                                    <div class="matchTeamsRow">
                                        <img class="matchLogo"
                                             src="test1/logos/${team}.webp"
                                             onerror="this.onerror=null;this.src='test1/logos/${team}.png'">

                                        <div class="matchVS">
                                            ${cap(team)}
                                            <span class="vsText">vs</span>
                                            ${cap(opp)}
                                        </div>

                                        <img class="matchLogo"
                                             src="test1/logos/${opp}.webp"
                                             onerror="this.onerror=null;this.src='test1/logos/${opp}.png'">
                                    </div>
                                </div>

                                <!-- TWO TABLES -->
                                <div class="matchTwoTables">

                                    <table class="matchTable">
                                        <tr>
                                            <th>Player</th>
                                            <th>K</th>
                                            <th>D</th>
                                            <th>K/D</th>
                                            <th>DMG</th>
                                        </tr>

                                        ${entry.myPlayers.map(p => `
                                            <tr>
                                                <td>${cap(p.player)}</td>
                                                <td>${p.kills}</td>
                                                <td>${p.deaths}</td>
                                                <td>${
                                                    p.deaths > 0
                                                        ? (p.kills/p.deaths).toFixed(2)
                                                        : p.kills.toFixed(2)
                                                }</td>
                                                <td>${p.damage ?? "-"}</td>
                                            </tr>
                                        `).join("")}
                                    </table>

                                    <table class="matchTable">
                                        <tr>
                                            <th>Player</th>
                                            <th>K</th>
                                            <th>D</th>
                                            <th>K/D</th>
                                            <th>DMG</th>
                                        </tr>

                                        ${entry.oppPlayers.map(p => `
                                            <tr>
                                                <td>${cap(p.player)}</td>
                                                <td>${p.kills}</td>
                                                <td>${p.deaths}</td>
                                                <td>${
                                                    p.deaths > 0
                                                        ? (p.kills/p.deaths).toFixed(2)
                                                        : p.kills.toFixed(2)
                                                }</td>
                                                <td>${p.damage ?? "-"}</td>
                                            </tr>
                                        `).join("")}
                                    </table>

                                </div>

                                <div class="matchDate">${entry.date}</div>

                            </div>
                        `;
                    });

                    oppBox.innerHTML = html;
                });
            });
        });
    });
}
