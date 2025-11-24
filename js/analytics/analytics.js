// ============================================================
// ANALYTICS — SHARED GLOBAL HELPERS
// ============================================================

// ------------------------------------------------------------
// Capitalize helper (global UI usage)
// ------------------------------------------------------------
function cap(s) {
    if (!s) return "";
    return s.charAt(0).toUpperCase() + s.slice(1);
}

// ------------------------------------------------------------
// Logistic curve — used by HP, SND, Overload models
// ------------------------------------------------------------
function logistic(x, k = 1) {
    return 1 / (1 + Math.exp(-(x / k)));
}

// ------------------------------------------------------------
// GLOBAL MATCH COUNTER
// Used by HP model for early/mid/late weighting
// ------------------------------------------------------------
function countMatches(matches, team, player, mode, map) {
    return matches.filter(m =>
        m.team === team &&
        m.player === player &&
        m.mode === mode &&
        m.map === map
    ).length;
}

// ------------------------------------------------------------
// GLOBAL AGGREGATE STATS (can be used by any mode)
// ------------------------------------------------------------

// Average kills per second across entire league
function leagueKPS(matches) {
    let kills = 0, sec = 0;
    matches.forEach(m => {
        kills += m.kills;
        sec += m.durationSec;
    });
    if (sec <= 0) return 0.03;     // fallback baseline
    return kills / sec;
}

// Average team KPS on a specific map
function teamMapKPS(matches, team, map) {
    let kills = 0, sec = 0;
    matches.forEach(m => {
        if (m.team === team && m.map === map) {
            kills += m.kills;
            sec += m.durationSec;
        }
    });
    if (sec <= 0) return 0;
    return kills / sec;
}

// Map-wide KPS baseline
function mapBaselineKPS(matches, map) {
    let kills = 0, sec = 0;
    matches.forEach(m => {
        if (m.map === map) {
            kills += m.kills;
            sec += m.durationSec;
        }
    });
    if (sec <= 0) return 0;
    return kills / sec;
}

// Player-specific KPS on map
function playerMapKPS(matches, team, player, map) {
    let kills = 0, sec = 0;
    matches.forEach(m => {
        if (m.team === team && m.player === player && m.map === map) {
            kills += m.kills;
            sec += m.durationSec;
        }
    });
    if (sec <= 0) return 0;
    return kills / sec;
}

// ------------------------------------------------------------
// AVERAGE RATE — Used by SND / Overload if needed
// ------------------------------------------------------------
function avg(arr) {
    if (!arr || arr.length === 0) return 0;
    return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function opponentDefenseKPS(matches, opponent, map) {
    let killsAllowed = 0, sec = 0;

    matches.forEach(m => {
        if (m.team === opponent && m.map === map) {
            killsAllowed += m.deaths; 
            sec += m.durationSec;
        }
    });

    if (sec === 0) return 1.00; // neutral
    return killsAllowed / sec;  // higher = easier opponent
}
