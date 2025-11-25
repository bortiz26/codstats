// ============================================================
// SEARCH ENGINE
// ============================================================

// Build list + attach search listeners
async function initSearch(teams, modeMaps, matches) {

    const input = document.getElementById("globalSearch");
    const resultsBox = document.getElementById("searchResults");

    const modes = Object.keys(modeMaps);
    const maps = modes.flatMap(m =>
        modeMaps[m].map(mp => ({ mode: m, map: mp }))
    );

    const teamNames = Object.keys(teams);
    const searchItems = [];

    // ============================================================
    // PLAYER ITEMS
    // ============================================================
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

    // Player + mode
    teamNames.forEach(team => {
        teams[team].forEach(player => {
            modes.forEach(mode => {
                searchItems.push({
                    type: "player_mode",
                    label: `${cap(player)} — ${modeNames[mode]}`,
                    team,
                    player,
                    mode
                });
            });
        });
    });

    // ============================================================
    // MODE ITEMS
    // ============================================================
    modes.forEach(mode => {
        searchItems.push({
            type: "mode",
            label: modeNames[mode],
            mode
        });
    });

    // ============================================================
    // MAP ITEMS
    // ============================================================
    maps.forEach(x => {
        searchItems.push({
            type: "map",
            label: `${x.map} — ${modeNames[x.mode]}`,
            mode: x.mode,
            map: x.map
        });
    });

    // ============================================================
    // TEAM → MODE → MAP
    // ============================================================
    teamNames.forEach(team => {
        modes.forEach(mode => {
            modeMaps[mode].forEach(map => {
                searchItems.push({
                    type: "team_mode_map",
                    label: `${cap(team)} — ${modeNames[mode]} — ${map}`,
                    team: team.toLowerCase(),
                    mode,
                    map
                });
            });
        });
    });

    // ============================================================
    // VS-MATCH SEARCH
    // ============================================================
    const seen = new Set();

    matches.forEach(m => {
        const same = matches.filter(x => x.matchID === m.matchID);
        const opp = same.find(x => x.team !== m.team)?.team || "Unknown";

        const key = [m.team, opp].sort().join("_") +
                    "_" + m.mode + "_" + m.map;

        if (seen.has(key)) return;
        seen.add(key);

        // Normal direction
        searchItems.push({
            type: "vs_match",
            label: `${cap(m.team)} vs ${cap(opp)} — ${modeNames[m.mode]} — ${m.map}`,
            teamA: m.team, teamB: opp,
            mode: m.mode, map: m.map
        });

        // Reverse direction
        searchItems.push({
            type: "vs_match",
            label: `${cap(opp)} vs ${cap(m.team)} — ${modeNames[m.mode]} — ${m.map}`,
            teamA: opp, teamB: m.team,
            mode: m.mode, map: m.map
        });
    });

    // ============================================================
    // RENDER DROPDOWN
    // ============================================================
    function showResults(list) {
        if (list.length === 0) {
            resultsBox.style.display = "none";
            return;
        }

        resultsBox.innerHTML = list.map(item => `
            <div class="search-item" 
                 data-data='${JSON.stringify(item)}'>
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

    // ============================================================
    // INPUT LISTENER
    // ============================================================
    input.addEventListener("input", () => {
        const raw = input.value.trim();
        if (raw === "") {
            resultsBox.style.display = "none";
            return;
        }

        const q = norm(raw);
        const parts = q.split(" ").filter(Boolean);

        const filtered = searchItems.filter(item => {
            const lbl = norm(item.label);
            const words = lbl.split(" ");
            return parts.every(p =>
                words.some(w => w.includes(p))
            );
        }).slice(0, 15);

        showResults(filtered);
    });
}



// ============================================================
// SEARCH → OPEN SECTIONS + SCROLL
// ============================================================
function handleSearchSelect(item) {

    const openTab = t =>
        document.querySelector(`.tab[data-tab='${t}']`).click();

    collapseAllSections();

    // ============================================================
    // PLAYER
    // ============================================================
    if (item.type === "player") {
        openTab("last5");

        const teamID = "last5_" + item.team.replace(/\W/g, "_");
        const playerID = teamID + "_" + item.player.replace(/\W/g, "_");

        document.getElementById(teamID).style.display = "block";
        document.getElementById(playerID).style.display = "block";

        smoothScrollCenter(document.getElementById(playerID));
        return;
    }

    // ============================================================
    // PLAYER + MODE
    // ============================================================
    if (item.type === "player_mode") {
        openTab("last5");

        const teamID   = "last5_" + item.team.replace(/\W/g, "_");
        const playerID = teamID + "_" + item.player.replace(/\W/g, "_");
        const modeID   = playerID + "_" + item.mode;

        document.getElementById(teamID).style.display = "block";
        document.getElementById(playerID).style.display = "block";
        document.getElementById(modeID).style.display = "block";

        smoothScrollCenter(document.getElementById(modeID));
        return;
    }

    // ============================================================
    // MODE
    // ============================================================
    if (item.type === "mode") {
        openTab("modes");

        const id = "mode_" + item.mode;
        document.getElementById(id).style.display = "block";

        smoothScrollCenter(document.getElementById(id));
        return;
    }

    // ============================================================
    // MAP
    // ============================================================
    if (item.type === "map") {
        openTab("modes");

        const modeID = "mode_" + item.mode;
        const mapID  = modeID + "_" + item.map.replace(/\W/g, "_");

        document.getElementById(modeID).style.display = "block";
        setTimeout(() => {
            document.getElementById(mapID).style.display = "block";
            smoothScrollCenter(document.getElementById(mapID));
        }, 40);

        return;
    }

    // ============================================================
    // TEAM → MODE → MAP
    // ============================================================
    if (item.type === "team_mode_map") {
        openTab("modes");

        const modeID = "mode_" + item.mode;
        const mapID  = modeID + "_" + item.map.replace(/\W/g, "_");
        const teamID = mapID + "_" + item.team.replace(/\W/g, "_");

        document.getElementById(modeID).style.display = "block";
        document.getElementById(mapID).style.display = "block";
        document.getElementById(teamID).style.display = "block";

        smoothScrollCenter(document.getElementById(teamID));
        return;
    }

    // ============================================================
    // MATCH (VS)
    // ============================================================
    if (item.type === "vs_match") {

        openTab("matches");

        const modeID = "matchMode_" + item.mode;
        const mapID  = modeID + "_" + item.map.replace(/\W/g, "_");

        document.getElementById(modeID).style.display = "block";
        document.getElementById(mapID).style.display = "block";

        const teamA = item.teamA.toLowerCase();
        const teamB = item.teamB.toLowerCase();

        const teamID = `${mapID}_${teamA.replace(/\W/g, "_")}`;
        const oppID  = `${teamID}_opp_${teamB.replace(/\W/g, "_")}`;

        document.getElementById(teamID).style.display = "block";
        document.getElementById(oppID).style.display = "block";

        const cards = document.querySelectorAll(`#${oppID} .matchCardSide`);
        if (cards.length > 0) smoothScrollCenter(cards[0]);

        return;
    }
}
