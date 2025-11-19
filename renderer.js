// Collapse EVERYTHING on the page before opening a new search result
function collapseAllSections() {
    // GAME MODES
    document.querySelectorAll("[id^='mode_']").forEach(el => el.style.display = "none");

    // MAPS
    document.querySelectorAll("[id*='_hp_'], [id*='_snd_'], [id*='_overload_']")
        .forEach(el => el.style.display = "none");

    // ALL Last5 collapsibles
    document.querySelectorAll("[id^='last5_']").forEach(el => el.style.display = "none");

    // ALL streaks sections
    //document.querySelectorAll("[id^='streaks_']").forEach(el => el.style.display = "none");

    // ALL matches sections
    document.querySelectorAll("[id^='matchMode_']").forEach(el => el.style.display = "none");

    // ALL opponent breakdowns
    document.querySelectorAll("[id*='_opp_']").forEach(el => el.style.display = "none");
}
try {
    console.log("JS Loaded OK");
} catch(e) {}

/*
// ============================================================
// BEST / WORST MAP CALCULATIONS PER PLAYER
// ============================================================
function getPlayerBestWorstMaps(matches, team, player) {
    const mapStats = {};

    matches
        .filter(m => m.team === team && m.player === player)
        .forEach(m => {
            const map = m.map;
            if (!mapStats[map]) mapStats[map] = { kills: 0, deaths: 0, games: 0, mode: m.mode };

            mapStats[map].kills += m.kills;
            mapStats[map].deaths += m.deaths;
            mapStats[map].games++;

            // overwrite mode to last used (KD is averaged across all games)
            mapStats[map].mode = m.mode;
        });

    const maps = Object.keys(mapStats);
    if (maps.length === 0) return null;

    let best = null, worst = null;

    maps.forEach(map => {
        const s = mapStats[map];
        const kd = s.deaths > 0 ? s.kills / s.deaths : s.kills;

        if (!best || kd > best.kd) best = { map, kd, mode: s.mode };
        if (!worst || kd < worst.kd) worst = { map, kd, mode: s.mode };
    });

    return { best, worst };
}
*/

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
    //buildStreaks(matches, teams);
    buildMatches(matches, teams, modeMaps);
    initSearch(teams, modeMaps, matches);

}

/* ============================================================
   BULLETPROOF CENTER SCROLL — always works
   ============================================================ */
   function smoothScrollCenter(el) {
    if (!el) return;

    let attempts = 0;

    const waitUntilVisible = setInterval(() => {
        attempts++;

        const style = window.getComputedStyle(el);
        const isVisible = style.display !== "none" && el.offsetHeight > 0;

        // If visible OR too many attempts → stop waiting and scroll
        if (isVisible || attempts > 40) {
            clearInterval(waitUntilVisible);

            const rect = el.getBoundingClientRect();
            const absoluteY = rect.top + window.pageYOffset;
            const scrollY = absoluteY - (window.innerHeight / 2) + rect.height / 2;

            window.scrollTo({
                top: scrollY,
                behavior: "smooth"
            });
        }

    }, 25); // checks every 25ms
}

/* ============================================================
   GLOBAL SEARCH ENGINE — WITH TEAM→MODE→MAP + UNIQUE MATCH SEARCH
   ============================================================ */
   async function initSearch(teams, modeMaps, matches) {
    const input = document.getElementById("globalSearch");
    const resultsBox = document.getElementById("searchResults");

    const modes = Object.keys(modeMaps);
    const maps = modes.flatMap(mode => modeMaps[mode].map(m => ({ mode, map: m })));
    const teamNames = Object.keys(teams);

    const searchItems = [];

    /* =============================
       PLAYER SEARCH ITEMS
       ============================= */
    teamNames.forEach(team => {
        teams[team].forEach(player => {
            searchItems.push({
                type: "player",
                label: `${cap(player)} (${cap(team)})`,
                team: team.toLowerCase(),
                player: player.toLowerCase()
            });
        });
    });

    /* ============================================================
   PLAYER + MODE SEARCH ITEMS (hydra hard point)
   ============================================================ */
teamNames.forEach(team => {
    teams[team].forEach(player => {
        modes.forEach(mode => {
            searchItems.push({
                type: "player_mode",
                label: `${cap(player)} — ${modeNames[mode] ?? cap(mode)}`,
                team,
                player,
                mode
            });
        });
    });
});


    /* =============================
       MODE SEARCH ITEMS
       ============================= */
    modes.forEach(mode => {
        searchItems.push({
            type: "mode",
            label: modeNames[mode] ?? cap(mode),
            mode
        });
    });

    /* =============================
       MAP SEARCH ITEMS
       ============================= */
    maps.forEach(x => {
        searchItems.push({
            type: "map",
            label: `${x.map} — ${modeNames[x.mode] ?? cap(x.mode)}`,
            mode: x.mode,
            map: x.map
        });
    });

    /* ============================================================
       TEAM → MODE → MAP SEARCH ITEMS (NEW)
       ============================================================ */
    teamNames.forEach(team => {
        const lowerTeam = team.toLowerCase();

        Object.keys(modeMaps).forEach(mode => {
            modeMaps[mode].forEach(map => {
                searchItems.push({
                    type: "team_mode_map",
                    label: `${cap(team)} — ${modeNames[mode]} — ${map}`,
                    team: lowerTeam,
                    mode,
                    map
                });
            });
        });
    });

    /* ============================================================
       UNIQUE MATCH SEARCH ITEMS (DEDUPED)
       ============================================================ */
    const seenKeys = new Set();

    matches.forEach(m => {
        const allSameMatch = matches.filter(x => x.matchID === m.matchID);
        const opponent = allSameMatch.find(x => x.team !== m.team)?.team || "Unknown";

        const teamA = m.team.toLowerCase();
        const teamB = opponent.toLowerCase();
        const mode = m.mode;
        const map = m.map;

        const key = [teamA, teamB].sort().join("_") + "_" + mode + "_" + map;

        if (seenKeys.has(key)) return;
        seenKeys.add(key);

        // NORMAL ORDER
        searchItems.push({
            type: "vs_match",
            label: `${cap(teamA)} vs ${cap(teamB)} — ${modeNames[mode]} — ${map}`,
            teamA,
            teamB,
            mode,
            map
        });

        // REVERSE ORDER SEARCH
        searchItems.push({
            type: "vs_match",
            label: `${cap(teamB)} vs ${cap(teamA)} — ${modeNames[mode]} — ${map}`,
            teamA: teamB,
            teamB: teamA,
            mode,
            map
        });
    });


    /* ============================================================
       RENDER SEARCH DROPDOWN
       ============================================================ */
    function showResults(list) {
        if (list.length === 0) {
            resultsBox.style.display = "none";
            return;
        }

        resultsBox.innerHTML = list.map(item => `
            <div class="search-item" data-data='${JSON.stringify(item)}'>
                ${item.label}
            </div>
        `).join("");

        resultsBox.style.display = "block";

        document.querySelectorAll(".search-item").forEach(el => {
            el.onclick = () => {
                const data = JSON.parse(el.dataset.data);
                resultsBox.style.display = "none";
                input.value = "";
                handleSearchSelect(data);
            };
        });
    }

    /* ============================================================
   ADVANCED SAFARI-COMPATIBLE FUZZY SEARCH
   Normalizes: —, –, -, spaces, uppercase, extra symbols
   ============================================================ */
input.addEventListener("input", () => {
    const qRaw = input.value.trim();
    if (qRaw === "") {
        resultsBox.style.display = "none";
        return;
    }

    // Normalize query
    const q = qRaw
        .toLowerCase()
        .replace(/[-–—]+/g, " ")   // convert ALL dash types to spaces
        .replace(/[()]/g, "")
        .replace(/\s+/g, " ")
        .trim();

    const parts = q.split(" ").filter(x => x.length > 0);

    const filtered = searchItems.filter(item => {
        // Normalize label the SAME way
        const lbl = item.label
            .toLowerCase()
            .replace(/[-–—]+/g, " ")  // normalize long dashes
            .replace(/[()]/g, "")
            .replace(/\s+/g, " ")
            .trim();

        // Split into words: team, vs, team, mode, map
        const words = lbl.split(" ");

        /* =====================================================
           Each search part must match at least ONE label word
           ===================================================== */
        for (const p of parts) {
            let found = false;

            for (const w of words) {
                if (w.includes(p)) {
                    found = true;
                    break;
                }
            }

            if (!found) return false;
        }

        return true;
    }).slice(0, 15);

    showResults(filtered);
});

}


/* ============================================================
   HANDLE SEARCH RESULT CLICK — Unified Logic
   ============================================================ */
function handleSearchSelect(item) {
    const openTab = name =>
        document.querySelector(`.tab[data-tab='${name}']`).click();

    collapseAllSections();

    /* PLAYER */
    if (item.type === "player") {
        openTab("last5");

        const teamID = "last5_" + item.team.replace(/\W/g, "_");
        const playerID = teamID + "_" + item.player.replace(/\W/g, "_");

        document.getElementById(teamID).style.display = "block";
        document.getElementById(playerID).style.display = "block";
        document.getElementById(playerID).scrollIntoView({ behavior: "smooth", block: "center" });
        return;
    }

    /* =============================
   PLAYER + MODE SEARCH
   (hydra hard point → open last5 → hydra → hardpoint)
   ============================= */
if (item.type === "player_mode") {
    openTab("last5");

    const teamID = "last5_" + item.team.replace(/\W/g, "_");
    const playerID = teamID + "_" + item.player.replace(/\W/g, "_");
    const modeID = playerID + "_" + item.mode;

    // Open team → player → mode
    document.getElementById(teamID).style.display = "block";
    document.getElementById(playerID).style.display = "block";
    document.getElementById(modeID).style.display = "block";

    smoothScrollCenter(document.getElementById(modeID));
    return;
}

    /* MODE */
    if (item.type === "mode") {
        openTab("modes");
        const modeID = "mode_" + item.mode;
        const div = document.getElementById(modeID);
        if (div) {
            div.style.display = "block";
            div.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        return;
    }

    /* MAP */
    if (item.type === "map") {
        openTab("modes");
        const modeID = "mode_" + item.mode;
        const mapID = modeID + "_" + item.map.replace(/\W/g, "_");

        document.getElementById(modeID).style.display = "block";

        setTimeout(() => {
            const mapDiv = document.getElementById(mapID);
            if (mapDiv) {
                mapDiv.style.display = "block";
                mapDiv.scrollIntoView({ behavior: "smooth", block: "center" });
            }
        }, 40);
        return;
    }

    /* ============================================================
       TEAM → MODE → MAP (NEW)
       ============================================================ */
    if (item.type === "team_mode_map") {
        openTab("modes");

        const modeID = "mode_" + item.mode;
        const mapID = modeID + "_" + item.map.replace(/\W/g, "_");
        const teamID = mapID + "_" + item.team.replace(/\W/g, "_");

        document.getElementById(modeID).style.display = "block";
        document.getElementById(mapID).style.display = "block";
        document.getElementById(teamID).style.display = "block";

        setTimeout(() => {
            document.getElementById(teamID).scrollIntoView({
                behavior: "smooth",
                block: "center"
            });
        }, 120);

        return;
    }

    /* ============================================================
       UNIQUE MATCH OPENING — MODE → MAP → TEAM → OPPONENT
       ============================================================ */
    if (item.type === "vs_match") {
        openTab("matches");
        collapseAllSections();

        const modeID = "matchMode_" + item.mode;
        const mapID = modeID + "_" + item.map.replace(/\W/g, "_");

        document.getElementById(modeID).style.display = "block";
        document.getElementById(mapID).style.display = "block";

        let teamA = item.teamA.toLowerCase();
        let teamB = item.teamB.toLowerCase();

        const teamsPlayed = [...new Set(
            Array.from(document.getElementById(mapID).querySelectorAll(".teamTitle"))
                .map(t => t.textContent.trim().toLowerCase())
        )];

        if (!teamsPlayed.includes(teamA) && teamsPlayed.includes(teamB)) {
            [teamA, teamB] = [teamB, teamA];
        }

        const teamID = mapID + "_" + teamA.replace(/\W/g, "_");
        const oppID = teamID + "_opp_" + teamB.replace(/\W/g, "_");

        document.getElementById(teamID).style.display = "block";
        document.getElementById(oppID).style.display = "block";

        const cards = Array.from(document.getElementById(oppID).querySelectorAll(".matchCardSide"));
        if (cards.length > 0) {
            setTimeout(() => {
                cards[0].scrollIntoView({ behavior: "smooth", block: "center" });
            }, 120);
        }

        return;
    }
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
/*
function collapseStreakSubsections(sectionPrefix, idToKeep) {
    document.querySelectorAll(`[id^='${sectionPrefix}_sub_']`).forEach(div => {
        if (div.id !== idToKeep) div.style.display = "none";
    });
}
*/


// TABS UI (with sliding animation)
// ============================
function buildTabs() {
    const tabs = document.querySelectorAll(".tab");
    const contents = document.querySelectorAll(".tab-content");
    const underline = document.getElementById("tab-underline");
    const tabBar = document.querySelector(".tab-bar");

    function activate(tabName) {
        // Activate correct tab visually
        tabs.forEach(t =>
            t.classList.toggle("active", t.dataset.tab === tabName)
        );

        // Slide / fade in active content
        contents.forEach(c => {
            if (c.id === "tab-" + tabName) {
                c.classList.add("activeTab");
                void c.offsetWidth; // restart animation
            } else {
                c.classList.remove("activeTab");
            }
        });

        // Underline animation
        const active = document.querySelector(".tab.active");
        if (active) {
            const r = active.getBoundingClientRect();
            const pr = tabBar.getBoundingClientRect();
            underline.style.width = r.width + "px";
            underline.style.left = (r.left - pr.left) + "px";

            // Auto-center the active tab in the scrollable bar
            const offset = (r.left - pr.left) - (tabBar.clientWidth / 2 - r.width / 2);
            tabBar.scrollBy({ left: offset, behavior: "smooth" });
        }
    }

    // Click events
    tabs.forEach(t =>
        t.addEventListener("click", () => activate(t.dataset.tab))
    );

    // Fade shadows based on scroll position
    tabBar.addEventListener("scroll", () => {
        if (tabBar.scrollLeft > 5) tabBar.classList.add("scrolling-left");
        else tabBar.classList.remove("scrolling-left");

        if (tabBar.scrollLeft + tabBar.clientWidth < tabBar.scrollWidth - 5)
            tabBar.classList.add("scrolling-right");
        else
            tabBar.classList.remove("scrolling-right");
    });

    // Initialize with first tab active
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

            // SHOW MODES — NO MORE STREAK EMOJIS
            modes.forEach(mode => {
                const recent = matches
                    .filter(m => m.team === team && m.player === player && m.mode === mode)
                    .sort((a,b)=>b.matchID - a.matchID)
                    .slice(0,5)
                    .reverse();

                if (recent.length === 0) return;

                const modeID = playerID + "_" + mode;

                playerBox.innerHTML += `
                    <h4 onclick="toggle('${modeID}', event)">
                        ${modeNames[mode] ?? cap(mode)}
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
/*
// ============================
// UPDATED STREAKS TAB (WITH BEST/WORST INCLUDING MODE)
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

                const bw = getPlayerBestWorstMaps(matches, team, player);

                const card = `
                    <div class="streak-card ${streak}" style="--glow:${glow}">
                        <div class="streak-player">${cap(player)}</div>
                        <div class="streak-team">${cap(team)}</div>
                        <div class="streak-kd">KD: ${lastKD}</div>

                        ${bw ? `
                        <div class="streak-bw">
                            <div class="bw-best">
                                ⭐ Best: ${bw.best.map} (${bw.best.kd.toFixed(2)}) — ${modeNames[bw.best.mode] ?? cap(bw.best.mode)}
                            </div>
                            <div class="bw-worst">
                                ❄️ Worst: ${bw.worst.map} (${bw.worst.kd.toFixed(2)}) — ${modeNames[bw.worst.mode] ?? cap(bw.worst.mode)}
                            </div>
                        </div>
                        ` : ""}
                    </div>
                `;

                if (streak==="hot") modeHot[mode].push(card);
                else if (streak==="cold") modeCold[mode].push(card);
                else modeEven[mode].push(card);
            });
        });
    });

    // RENDER EACH MODE SECTION
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
    <!-- HOT -->
    <h3 class="mapHeader"
        onclick="collapseStreakSubsections('${sectionID}', '${sectionID}_sub_hot'); toggle('${sectionID}_sub_hot', event)">
        🔥 HOT STREAKS
    </h3>
    <div id="${sectionID}_sub_hot" class="hidden">
        <div class="streak-row">${modeHot[mode].join("") || "<p>No hot streaks</p>"}</div>
    </div>

    <!-- EVEN -->
    <h3 class="mapHeader"
        onclick="collapseStreakSubsections('${sectionID}', '${sectionID}_sub_even'); toggle('${sectionID}_sub_even', event)">
        ⚖️ EVEN STREAKS
    </h3>
    <div id="${sectionID}_sub_even" class="hidden">
        <div class="streak-row">${modeEven[mode].join("") || "<p>No even streaks</p>"}</div>
    </div>

    <!-- COLD -->
    <h3 class="mapHeader"
        onclick="collapseStreakSubsections('${sectionID}', '${sectionID}_sub_cold'); toggle('${sectionID}_sub_cold', event)">
        ❄️ COLD STREAKS
    </h3>
    <div id="${sectionID}_sub_cold" class="hidden">
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

*/

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
                        let scoreColor = "#ffffff";

                        html += `
                            <div class="matchCardSide" style="--glow:${glowColors[team] || "#fff"}">

                                <!-- NEW HEADER LAYOUT -->
                                <div class="matchHeader">

                                    <div class="matchScoreBig" style="color:${scoreColor}">
                                        ${entry.myScore} — ${entry.oppScore}
                                    </div>

                                    <div class="matchTeamsRow">
                                        <img class="matchLogo" src="test1/logos/${team}.webp"
                                            onerror="this.onerror=null;this.src='test1/logos/${team}.png'">

                                        <div class="matchVS">
                                            ${cap(team)}
                                            <span class="vsText">vs</span>
                                            ${cap(opp)}
                                        </div>

                                        <img class="matchLogo" src="test1/logos/${opp}.webp"
                                            onerror="this.onerror=null;this.src='test1/logos/${opp}.png'">
                                    </div>

                                </div>
                                <!-- END HEADER -->

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
