// ============================
// LOAD JSON — CACHE BUST FIX
// ============================
async function loadJSON(url) {
    const fullURL = url + "?v=" + Date.now();
    const r = await fetch(fullURL, { cache: "no-store" });
    if (!r.ok) throw new Error("Failed loading " + url);
    return await r.json();
}

const chartRegistry = {};


// ===========================================================
// MODE DISPLAY NAMES (ALWAYS USE THIS)
// ===========================================================
const modeNames = {
    hp: "Hard Point",
    snd: "Search & Destroy",
    overload: "Overload"
};


// ============================
// HOT / COLD / EVEN STREAK CALC
// ============================
function getHotStreak(recentMatches) {
    if (recentMatches.length < 3) return "even";

    let kds = recentMatches.map(
        m => (m.deaths > 0 ? (m.kills / m.deaths) : m.kills)
    );

    const a = kds[kds.length - 3];
    const b = kds[kds.length - 2];
    const c = kds[kds.length - 1];

    if (a < b && b < c) return "hot";
    if (a > b && b > c) return "cold";
    return "even";
}


// ============================
// PAGE INIT
// ============================
async function initPage() {
    const scores = await loadJSON("test1/scores.json");
    const matches = await loadJSON("test1/matches.json");
    const teams = await loadJSON("test1/teams.json");
    const modeMaps = await loadJSON("test1/modes.json");

    window.DYNAMIC_TEAMS = teams;
    window.DYNAMIC_MODEMAPS = modeMaps;

    buildTabs();
    buildModes(scores, teams, modeMaps);
    buildLast5(scores, matches, teams);
    buildStreaks(matches, teams);
    buildMatches(matches, teams, modeMaps);
}


// ============================
// BASIC HELPERS
// ============================
function toggle(id, event) {
    if (event) event.stopPropagation();
    const el = document.getElementById(id);
    if (!el) return;
    el.style.display = (el.style.display !== "block") ? "block" : "none";
}

function cap(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

// Glow colors
const glowColors = {
    "thieves": "#e74c3c",
    "faze": "#FF10F0",
    "optic": "#27ae60",
    "heretics": "#e67e22",
    "royale ravens": "#3498db",
    "cloud9": "#5dade2",
    "g2": "#f1c40f",
    "guerrillas m8": "#9b59b6",
    "breach": "#2ecc71",
    "falcons": "#f39c12",
    "koi": "#8e44ad",
    "surge": "#00ffff"
};


// ============================
// COLLAPSE HELPERS
// ============================
function collapseModesExcept(idToKeep) {
    document.querySelectorAll("[id^='matchMode_']").forEach(el => {
        if (el.id !== idToKeep) el.style.display = "none";
    });
}
function collapseMapsExcept(modePrefix, idToKeep) {
    document.querySelectorAll(`[id^='${modePrefix}_']`).forEach(el => {
        if (el.id !== idToKeep) el.style.display = "none";
    });
}
function collapseTeamsExcept(mapPrefix, idToKeep) {
    document.querySelectorAll(`[id^='${mapPrefix}_']`).forEach(el => {
        if (el.id !== idToKeep) el.style.display = "none";
    });
}
function collapseOpponentsExcept(teamPrefix, idToKeep) {
    document.querySelectorAll(`[id^='${teamPrefix}_opp_']`).forEach(el => {
        if (el.id !== idToKeep) el.style.display = "none";
    });
}
function collapseAllLast5Except(idToKeep) {
    document.querySelectorAll("[id^='last5_']").forEach(el => {
        if (el.id !== idToKeep) el.style.display = "none";
    });
}


// ============================
// TABS UI
// ============================
function buildTabs() {
    const tabs = document.querySelectorAll(".tab");
    const contents = document.querySelectorAll(".tab-content");
    const underline = document.getElementById("tab-underline");

    function activate(tabName) {
        tabs.forEach(t => t.classList.toggle("active", t.dataset.tab === tabName));
        contents.forEach(c => c.classList.toggle("activeTab", c.id === "tab-" + tabName));

        const active = document.querySelector(".tab.active");
        if (active) {
            const r = active.getBoundingClientRect();
            const pr = active.parentElement.getBoundingClientRect();
            underline.style.width = r.width + "px";
            underline.style.left = (r.left - pr.left) + "px";
        }
    }

    tabs.forEach(t => t.addEventListener("click", () => activate(t.dataset.tab)));
    activate("modes");
}

// ============================
// GAME MODES TAB with FULL COLLAPSE
// ============================
function buildModes(scores, teams, modeMaps) {
    const root = document.getElementById("tab-modes");
    root.innerHTML = "";

    Object.keys(modeMaps).forEach(mode => {
        const modeID = "mode_" + mode;

        // MODE HEADER (collapses other modes)
        root.innerHTML += `
            <h2 class="modeHeader"
                onclick="collapseModesExcept('${modeID}'); toggle('${modeID}', event)">
                ${modeNames[mode] ?? cap(mode)}
            </h2>
            <div id="${modeID}" class="hidden"></div>
        `;

        const modeBox = document.getElementById(modeID);

        // MAPS
        modeMaps[mode].forEach(map => {
            const mapID = modeID + "_" + map.replace(/\W/g, "_");

            modeBox.innerHTML += `
                <h3 class="mapHeader"
                    onclick="collapseMapsExcept('${modeID}', '${mapID}'); toggle('${mapID}', event)">
                    ${map}
                </h3>
                <div id="${mapID}" class="hidden"></div>
            `;

            const mapBox = document.getElementById(mapID);

            // TEAMS for this map
            Object.keys(teams).forEach(team => {
                if (!scores[team] || !scores[team][mode] || !scores[team][mode][map]) return;

                const glow = glowColors[team] ?? "#fff";
                const teamID = mapID + "_" + team.replace(/\W/g, "_");

                mapBox.innerHTML += `
                    <div class="teamBox" style="--glow:${glow}"
                        onclick="collapseTeamsExcept('${mapID}', '${teamID}'); toggle('${teamID}', event)">
                        <img src="test1/logos/${team}.webp"
                            onerror="this.onerror=null;this.src='test1/logos/${team}.png'">
                        <div class="teamTitle">${cap(team)}</div>
                        <div id="${teamID}" class="hidden"></div>
                    </div>
                `;

                const playerBox = document.getElementById(teamID);

                let html = `
                    <table class="playerTable">
                        <tr>
                            <th>Player</th>
                            <th>Avg Kills</th>
                            <th>Avg Deaths</th>
                            <th>K/D</th>
                        </tr>
                `;

                teams[team].forEach(player => {
                    const st = scores[team][mode][map][player];
                    if (!st || st.updates === 0) return;

                    let ak = (st.totalKills / st.updates).toFixed(1);
                    let ad = (st.totalDeaths / st.updates).toFixed(1);
                    let kd = (st.totalDeaths > 0 
                             ? (st.totalKills / st.totalDeaths) 
                             : st.totalKills).toFixed(2);

                    html += `
                        <tr>
                            <td class="playerName">${cap(player)}</td>
                            <td>${ak}</td>
                            <td>${ad}</td>
                            <td>${kd}</td>
                        </tr>
                    `;
                });

                html += `</table>`;
                playerBox.innerHTML = html;
            });
        });
    });
}



// ============================
// LAST 5 MATCHES TAB
// ============================
function buildLast5(scores, matches, teams) {
    const root = document.getElementById("tab-last5");
    root.innerHTML = "";

    const modes = Object.keys(DYNAMIC_MODEMAPS);

    Object.keys(teams).forEach(team => {
        const glow = glowColors[team] ?? "#fff";
        const teamID = "last5_" + team.replace(/\W/g,"_");

        root.innerHTML += `
            <div class="teamBox" style="--glow:${glow}"
                 onclick="collapseAllLast5Except('${teamID}'); toggle('${teamID}', event);">
                <img src="test1/logos/${team}.webp"
                     onerror="this.onerror=null;this.src='test1/logos/${team}.png'">
                <div class="teamTitle">${cap(team)}</div>
                <div id="${teamID}" class="hidden"></div>
            </div>
        `;

        const teamBox = document.getElementById(teamID);

        teams[team].forEach(player => {
            const playerID = teamID + "_" + player.replace(/\W/g,"_");

            teamBox.innerHTML += `
                <h3 class="mapHeader" onclick="toggle('${playerID}', event)">
                    ${cap(player)}
                </h3>
                <div id="${playerID}" class="hidden"></div>
            `;

            const playerBox = document.getElementById(playerID);

            // compute streak emoji per mode
            const modeStreakIcon = {};

            modes.forEach(mode => {
                const recent = matches
                    .filter(m => m.team === team && m.player === player && m.mode === mode)
                    .sort((a,b)=>b.matchID - a.matchID).slice(0,5).reverse();

                if (recent.length === 0) {
                    modeStreakIcon[mode] = "";
                    return;
                }

                const streak = getHotStreak(recent);
                modeStreakIcon[mode] =
                    streak === "hot" ? "🔥" :
                    streak === "cold" ? "❄️" :
                    "⚖️";
            });

            // display per mode
            modes.forEach(mode => {
                const recent = matches
                    .filter(m => m.team === team && m.player === player && m.mode === mode)
                    .sort((a,b)=>b.matchID - a.matchID).slice(0,5).reverse();

                if (recent.length === 0) return;

                const emoji = modeStreakIcon[mode];
                const modeID = playerID + "_" + mode;

                playerBox.innerHTML += `
                    <h4 onclick="toggle('${modeID}', event)">
                        ${modeNames[mode] ?? cap(mode)} ${emoji}
                    </h4>
                    <div id="${modeID}" class="hidden"></div>
                `;

                const modeBox = document.getElementById(modeID);

                let cards = `<div class="match-strip">`;

                recent.forEach(x => {
                    const kd = x.deaths > 0 ? (x.kills/x.deaths).toFixed(2) : x.kills.toFixed(2);
                    const kdClass = kd >= 1.0 ? "kd-good" : "kd-bad";

                    cards += `
                        <div class="match-card" style="--glow:${glow}">
                            <div class="card-map">${x.map}</div>
                            <div>K: ${x.kills} &nbsp; D: ${x.deaths}</div>
                            <div class="${kdClass}">${kd} KD</div>
                        </div>
                    `;
                });

                cards += `</div>`;
                modeBox.innerHTML = cards;
            });
        });
    });
}


// ============================
// STREAKS TAB
// ============================
function buildStreaks(matches, teams) {
    const root = document.getElementById("tab-streaks");
    root.innerHTML = "";

    const modes = Object.keys(DYNAMIC_MODEMAPS);

    let modeHot={}, modeEven={}, modeCold={};
    modes.forEach(m => {
        modeHot[m]=[]; modeEven[m]=[]; modeCold[m]=[];
    });

    Object.keys(teams).forEach(team => {
        const glow = glowColors[team] ?? "#fff";

        teams[team].forEach(player => {
            modes.forEach(mode => {
                const recent = matches
                    .filter(m=>m.team===team && m.player===player && m.mode===mode)
                    .sort((a,b)=>b.matchID - a.matchID).slice(0,5).reverse();

                if (recent.length===0) return;

                const streak = getHotStreak(recent);
                const last = recent[recent.length-1];
                const lastKD = last.deaths>0 ? (last.kills/last.deaths).toFixed(2) : last.kills;

                const card = `
                    <div class="streak-card ${streak}" style="--glow:${glow}">
                        <div class="streak-player">${cap(player)}</div>
                        <div class="streak-team">${cap(team)}</div>
                        <div class="streak-kd">KD: ${lastKD}</div>
                    </div>
                `;

                if (streak==="hot") modeHot[mode].push(card);
                else if (streak==="cold") modeCold[mode].push(card);
                else modeEven[mode].push(card);
            });
        });
    });

    // RENDER
    modes.forEach(mode => {
        const sectionID = "streaks_" + mode;

        root.innerHTML += `
            <h2 class="modeHeader" onclick="openStreak('${sectionID}')">
                ${modeNames[mode] ?? cap(mode)} STREAKS
            </h2>
            <div id="${sectionID}" class="hidden"></div>
        `;

        const box = document.getElementById(sectionID);

        box.innerHTML = `
            <div class="streak-section hot">
                <div class="streak-section-title">🔥 HOT STREAKS</div>
                <div class="streak-row">${modeHot[mode].join("") || "<p>No hot streaks</p>"}</div>
            </div>

            <div class="streak-section even">
                <div class="streak-section-title">⚖️ EVEN STREAKS</div>
                <div class="streak-row">${modeEven[mode].join("") || "<p>No even streaks</p>"}</div>
            </div>

            <div class="streak-section cold">
                <div class="streak-section-title">❄️ COLD STREAKS</div>
                <div class="streak-row">${modeCold[mode].join("") || "<p>No cold streaks</p>"}</div>
            </div>
        `;
    });
}

// ensure only one streak section open
function openStreak(idToOpen) {
    document.querySelectorAll("[id^='streaks_']").forEach(div => {
        div.style.display = (div.id === idToOpen && div.style.display !== "block") ? "block" : "none";
    });
}


// ============================
// MATCHES TAB (full dynamic)
// ============================
function buildMatches(matches, teams, modeMaps) {
    const root = document.getElementById("tab-matches");
    root.innerHTML = "";

    const modes = Object.keys(modeMaps);

    modes.forEach(mode => {
        const modeID = "matchMode_" + mode;

        root.innerHTML += `
            <h2 class="modeHeader"
                onclick="collapseModesExcept('${modeID}'); toggle('${modeID}', event)">
                ${modeNames[mode] ?? cap(mode)}
            </h2>
            <div id="${modeID}" class="hidden"></div>
        `;

        const modeBox = document.getElementById(modeID);

        modeMaps[mode].forEach(map => {
            const mapID = modeID + "_" + map.replace(/\W/g,"_");

            modeBox.innerHTML += `
                <h3 class="mapHeader"
                    onclick="collapseMapsExcept('${modeID}', '${mapID}'); toggle('${mapID}', event)">
                    ${map}
                </h3>
                <div id="${mapID}" class="hidden"></div>
            `;

            const mapBox = document.getElementById(mapID);

            const teamsPlayed = [...new Set(
                matches.filter(m=>m.mode===mode && m.map===map).map(m=>m.team)
            )];

            teamsPlayed.forEach(team => {
                const glow = glowColors[team] ?? "#fff";
                const teamID = mapID + "_" + team.replace(/\W/g,"_");

                mapBox.innerHTML += `
                    <div class="teamBox" style="--glow:${glow}"
                        onclick="collapseTeamsExcept('${mapID}','${teamID}'); toggle('${teamID}', event)">
                        <img src="test1/logos/${team}.webp"
                            onerror="this.onerror=null;this.src='test1/logos/${team}.png'">
                        <div class="teamTitle">${cap(team)}</div>
                        <div id="${teamID}" class="hidden"></div>
                    </div>
                `;

                const teamBox = document.getElementById(teamID);

                const opponents = {};
                const teamMatches = matches
                    .filter(m=>m.team===team && m.mode===mode && m.map===map)
                    .sort((a,b)=>b.matchID - a.matchID);

                const matchIDs = [...new Set(teamMatches.map(m=>m.matchID))];

                matchIDs.forEach(mid => {
                    const all = matches.filter(x=>x.matchID===mid);

                    const myPlayers = all.filter(x=>x.team===team);
                    const oppTeam = [...new Set(all.map(x=>x.team))].filter(t=>t!==team)[0] || "Unknown";
                    const oppPlayers = all.filter(x=>x.team===oppTeam);

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

                Object.keys(opponents).forEach(opp => {
                    const oppID = teamID + "_opp_" + opp.replace(/\W/g,"_");

                    teamBox.innerHTML += `
                        <h4 class="mapHeader"
                            onclick="collapseOpponentsExcept('${teamID}','${oppID}'); toggle('${oppID}', event)">
                            VS ${cap(opp)}
                        </h4>
                        <div id="${oppID}" class="hidden"></div>
                    `;

                    const oppBox = document.getElementById(oppID);
                    let html = "";

                    opponents[opp].forEach(entry => {
                        let scoreColor = entry.myScore > entry.oppScore
                            ? "#4caf50" : entry.myScore < entry.oppScore
                            ? "#e74c3c" : "#bbb";

                        html += `
                            <div class="matchCardSide" style="--glow:${glowColors[team] || "#fff"}">
                                <div class="matchHeader">
                                    <img class="matchLogo" src="test1/logos/${team}.webp"
                                        onerror="this.onerror=null;this.src='test1/logos/${team}.png'">
                                    <div class="matchTeamName">${cap(team)}</div>

                                    <div class="matchScore" style="color:${scoreColor}">
                                        ${entry.myScore} — ${entry.oppScore}
                                    </div>

                                    <div class="matchTeamName">${cap(opp)}</div>
                                    <img class="matchLogo" src="test1/logos/${opp}.webp"
                                        onerror="this.onerror=null;this.src='test1/logos/${opp}.png'">
                                </div>

                                <div class="matchTwoTables">

                                    <table class="matchTable">
                                        <tr><th>Player</th><th>K</th><th>D</th><th>K/D</th></tr>
                                        ${entry.myPlayers.map(p=>`
                                            <tr>
                                                <td>${cap(p.player)}</td>
                                                <td>${p.kills}</td>
                                                <td>${p.deaths}</td>
                                                <td>${p.deaths?(p.kills/p.deaths).toFixed(2):p.kills}</td>
                                            </tr>
                                        `).join("")}
                                    </table>

                                    <table class="matchTable">
                                        <tr><th>Player</th><th>K</th><th>D</th><th>K/D</th></tr>
                                        ${entry.oppPlayers.map(p=>`
                                            <tr>
                                                <td>${cap(p.player)}</td>
                                                <td>${p.kills}</td>
                                                <td>${p.deaths}</td>
                                                <td>${p.deaths?(p.kills/p.deaths).toFixed(2):p.kills}</td>
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


// ============================
// Resize charts if needed
// ============================
window.addEventListener("resize", () => {
    Object.values(chartRegistry).forEach(c => c?.resize?.());
});
