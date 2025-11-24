// ============================================================
// HP ANALYTICS — FINAL FIXED VERSION
// Opponent Normalized, Season-Smart, Stable Output
// ============================================================


// ------------------------------------------------------------
// SEASON WEIGHTS BASED ON SAMPLE SIZE
// ------------------------------------------------------------
function hpSeasonWeights(matchesCount) {

    if (matchesCount <= 5) {
        return {
            mode: "early",
            player: 0.35,
            team:   0.35,
            map:    0.20,
            league: 0.10,
            scale:  4.5
        };
    }

    if (matchesCount <= 15) {
        return {
            mode: "mid",
            player: 0.60,
            team:   0.25,
            map:    0.10,
            league: 0.05,
            scale:  3.0
        };
    }

    return {
        mode: "late",
        player: 0.80,
        team:   0.10,
        map:    0.08,
        league: 0.02,
        scale:  2.4
    };
}



// ------------------------------------------------------------
// CORE KPS HELPERS
// ------------------------------------------------------------

// Player KPS on given map
function playerHPKPS(matches, team, player, map) {
    let kills = 0, sec = 0;
    matches.forEach(m => {
        if (m.team === team && m.player === player && m.map === map) {
            kills += m.kills;
            sec   += m.durationSec;
        }
    });
    if (sec === 0) return 0;
    return kills / sec;
}

// Team KPS on map
function teamMapKPS(matches, team, map) {
    let kills = 0, sec = 0;
    matches.forEach(m => {
        if (m.team === team && m.map === map) {
            kills += m.kills;
            sec   += m.durationSec;
        }
    });
    if (sec === 0) return 0;
    return kills / sec;
}

// Map-wide KPS
function mapBaselineKPS(matches, map) {
    let kills = 0, sec = 0;
    matches.forEach(m => {
        if (m.map === map) {
            kills += m.kills;
            sec   += m.durationSec;
        }
    });
    if (sec === 0) return 0;
    return kills / sec;
}

// League KPS
function leagueHPKPS(matches) {
    let kills = 0, sec = 0;
    matches.forEach(m => {
        kills += m.kills;
        sec   += m.durationSec;
    });
    if (sec === 0) return 0.032; // fallback ~2 kills/min
    return kills / sec;
}



// ------------------------------------------------------------
// FIXED OPPONENT DEFENSIVE KPS (NORMALIZED CORRECTLY)
// ------------------------------------------------------------
// We normalize team deaths PER MATCH (not per-player sum).
// We also divide team deaths by 4 players.
// ------------------------------------------------------------
function opponentDefenseKPS(matches, opponent, map) {

    let matchesSeen = {};
    let totalTeamDeaths = 0;
    let totalDuration = 0;

    matches.forEach(m => {
        if (m.team === opponent && m.map === map) {

            const key = `${m.matchID}-${opponent}`;

            // Count match only once
            if (!matchesSeen[key]) {
                matchesSeen[key] = true;
            }

            // Add player deaths
            totalTeamDeaths += m.deaths;
            totalDuration   += m.durationSec;
        }
    });

    const matchCount = Object.keys(matchesSeen).length;
    if (matchCount === 0 || totalDuration === 0) return 1.0;

    // Normalize: team deaths per match / 4 players
    const deathsPerMatch = (totalTeamDeaths / matchCount) / 4;

    // Duration per match
    const secPerMatch = totalDuration / matchCount;

    return deathsPerMatch / secPerMatch;
}



// ============================================================
// MAIN EXPECTED KILLS ENGINE
// ============================================================
function computeHPExpected(matches, team, player, map, opponent, durationSec) {

    // Core model components
    const pKPS = playerHPKPS(matches, team, player, map);
    const tKPS = teamMapKPS(matches, team, map);
    const mKPS = mapBaselineKPS(matches, map);
    const lKPS = leagueHPKPS(matches);

    // Opponent defensive adjustment
    const oKPS = opponentDefenseKPS(matches, opponent, map);

    // Opponent multiplier (should be ~0.8–1.3)
    const oppMultiplier = (lKPS > 0 ? (oKPS / lKPS) : 1.0);

    // Season weighting
    const sampleSize = matches.filter(m =>
        m.team === team &&
        m.player === player &&
        m.mode === "hp" &&
        m.map === map
    ).length;

    const W = hpSeasonWeights(sampleSize);

    // Weighted blended KPS
    const blendedKPS =
        (pKPS * W.player) +
        (tKPS * W.team) +
        (mKPS * W.map) +
        (lKPS * W.league);

    // Apply opponent multiplier (now safe)
    const adjKPS = blendedKPS * oppMultiplier;

    if (durationSec <= 0) durationSec = 360;

    // Final expected kills
    const rawExp  = adjKPS * durationSec;
    const normExp = adjKPS * 900;      // normalized to 10 min

    return {
        raw: rawExp,
        norm: normExp,
        scale: W.scale,
        weightMode: W.mode,
        oppMultiplier,
        pKPS, tKPS, mKPS, lKPS, oKPS
    };
}



// ============================================================
// PROBABILITY ENGINE
// ============================================================
function hpProbability(expected, line, scale) {
    const x = expected - line;
    return 1 / (1 + Math.exp(-(x / scale)));
}
