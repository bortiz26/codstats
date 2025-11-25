// ============================================================
// HARDPOINT (HP) — ADVANCED PREDICTION ENGINE V2 + LAST 5
// ============================================================

// ----------------------------
// Safe division
// ----------------------------
function safeDiv(a, b) {
    return b === 0 ? 0 : (a / b);
}

// ============================================================
// LAST 5 BLEND ENGINE
// ============================================================
function blendedHPExpected(seasonExp, last5Exp) {
    // 75% season performance, 25% last 5 matches
    if (isNaN(last5Exp)) return seasonExp;
    return (seasonExp * 0.75) + (last5Exp * 0.25);
}

// ============================================================
// 0. Extract helper: get all HP matches for player
// ============================================================
function getPlayerHPMatches(matches, team, player, map, opponent = null) {
    return matches.filter(m =>
        m.mode === "hp" &&
        m.team === team &&
        m.player === player &&
        m.map === map &&
        (!opponent || m.opponent === opponent)
    );
}

// ============================================================
// 1. PLAYER KPS (kills per second) ON MAP
// ============================================================
function playerHPKPS(matches, team, player, map) {
    let kills = 0, sec = 0;

    matches.forEach(m => {
        if (m.team === team && m.player === player &&
            m.mode === "hp" && m.map === map) {
            kills += m.kills;
            sec   += m.durationSec;
        }
    });

    return safeDiv(kills, sec);
}

// ============================================================
// 2. TEAM KPS on map
// ============================================================
function teamMapKPS(matches, team, map) {
    let kills = 0, sec = 0;

    matches.forEach(m => {
        if (m.team === team && m.mode === "hp" && m.map === map) {
            kills += m.kills;
            sec   += m.durationSec;
        }
    });

    return safeDiv(kills, sec);
}

// ============================================================
// 3. MAP baseline KPS
// ============================================================
function mapBaselineKPS(matches, map) {
    let kills = 0, sec = 0;

    matches.forEach(m => {
        if (m.mode === "hp" && m.map === map) {
            kills += m.kills;
            sec += m.durationSec;
        }
    });

    return safeDiv(kills, sec);
}

// ============================================================
// 4. LEAGUE KPS
// ============================================================
function leagueHPKPS(matches) {
    let kills = 0, sec = 0;

    matches.forEach(m => {
        if (m.mode === "hp") {
            kills += m.kills;
            sec   += m.durationSec;
        }
    });

    return sec === 0 ? 0.035 : kills / sec;
}

// ============================================================
// 5. OPPONENT defensive KPS (kills allowed)
// ============================================================
function opponentDefenseKPS(matches, opponent, map) {
    let deaths = 0, sec = 0;

    matches.forEach(m => {
        if (m.team === opponent &&
            m.mode === "hp" &&
            m.map === map) {
            deaths += m.deaths;
            sec += m.durationSec;
        }
    });

    return sec === 0 ? 0.035 : (deaths / 4) / sec;
}

// ============================================================
// 6. TRUE duration — use real match history
// ============================================================
function trueDuration(matches, team, player, map, opponent) {
    const pm = getPlayerHPMatches(matches, team, player, map, opponent);
    if (pm.length === 0) return 360;

    let total = 0;
    pm.forEach(m => total += m.durationSec);
    return total / pm.length;
}

// ============================================================
// 7. DPS — damage per second
// ============================================================
function playerDPS(matches, team, player, map, opponent) {
    const pm = getPlayerHPMatches(matches, team, player, map, opponent);
    if (pm.length === 0) return 1;

    let dmg = 0, sec = 0;
    pm.forEach(m => {
        dmg += m.damage || 0;
        sec += m.durationSec || 1;
    });

    return safeDiv(dmg, sec);
}

function leagueDPS(matches) {
    let dmg = 0, sec = 0;

    matches.forEach(m => {
        if (m.mode === "hp") {
            dmg += m.damage || 0;
            sec += m.durationSec || 1;
        }
    });

    return safeDiv(dmg, sec);
}

// ============================================================
// 8. ROLE FACTOR (hill time)
// ============================================================
function roleFactor(matches, team, player, map, opponent) {
    const pm = getPlayerHPMatches(matches, team, player, map, opponent);
    if (pm.length === 0) return 1.0;

    let total = 0;
    pm.forEach(m => total += m.hillTime || 0);
    const avg = total / pm.length;

    if (avg <= 20) return 1.12;   // slayer
    if (avg <= 60) return 1.00;   // flex
    return 0.92;                  // obj
}

// ============================================================
// 9. Engagement rate
// ============================================================
function engagementRate(matches, team, player, map, opponent) {
    const pm = getPlayerHPMatches(matches, team, player, map, opponent);
    if (pm.length === 0) return 1;

    let eng = 0, sec = 0;
    pm.forEach(m => {
        eng += (m.kills + m.deaths);
        sec += m.durationSec || 1;
    });

    return safeDiv(eng, sec);
}

function engagementVarianceFactor(rate) {
    if (rate > 0.12) return 1.10;
    if (rate > 0.09) return 1.05;
    return 1.00;
}

// ============================================================
// 10. Weighting option
// ============================================================
function hpWeightsOptionA() {
    return {
        player: 0.45,
        opp:    0.25,
        map:    0.15,
        team:   0.10,
        league: 0.05
    };
}

// ============================================================
// 11. Raw KPS calculation (v2 engine)
// ============================================================
function computeHPExpected(matches, team, player, map, opponent) {

    const kps_player = playerHPKPS(matches, team, player, map);
    const kps_team   = teamMapKPS(matches, team, map);
    const kps_map    = mapBaselineKPS(matches, map);
    const kps_opp    = opponentDefenseKPS(matches, opponent, map);
    const kps_league = leagueHPKPS(matches);

    const w = hpWeightsOptionA();

    let expKPS =
        w.player * kps_player +
        w.opp    * kps_opp +
        w.map    * kps_map +
        w.team   * kps_team +
        w.league * kps_league;

    // DPS BOOST
    const dps_player = playerDPS(matches, team, player, map, opponent);
    const dps_league = leagueDPS(matches);
    const dpsFactor  = safeDiv(dps_player, dps_league);

    expKPS *= (0.75 + 0.25 * dpsFactor);

    // ROLE BOOST / NERF
    const rf = roleFactor(matches, team, player, map, opponent);
    expKPS *= rf;

    // ENGAGEMENT BOOST (for variance)
    const erate = engagementRate(matches, team, player, map, opponent);
    const varBoost = engagementVarianceFactor(erate);

    return {
        expKPS,
        varBoost,
        components: {
            kps_player,
            kps_team,
            kps_map,
            kps_opp,
            kps_league,
            dps_player,
            dps_league,
            rf,
            erate
        }
    };
}

// ============================================================
// 12. Expected kills (NOW WITH LAST-5 BLEND)
// ============================================================
function expectedHPKills(matches, team, player, map, opponent) {

    const exp = computeHPExpected(matches, team, player, map, opponent);
    const duration = trueDuration(matches, team, player, map, opponent);

    const seasonRaw = exp.expKPS * duration;

    // -------------------------
    // LAST 5 MATCHES
    // -------------------------
    const last5 = getLastN(matches, player, team, "hp", map, 5);
    const L5 = computeLast5Stats(last5);
    const last5Kills = L5.killsAvg;

    // -------------------------
    // BLEND
    // -------------------------
    const blended = blendedHPExpected(seasonRaw, last5Kills);

    return {
        raw: blended,
        varBoost: exp.varBoost,
        duration,
        components: {
            ...exp.components,
            last5Kills
        }
    };
}

// ============================================================
// 13. Poisson OVER probability
// ============================================================
function poissonOver(lambda, line, varBoost = 1.0) {

    const adjLambda = lambda * varBoost;
    const threshold = Math.floor(line) + 1;

    let p = 0;
    for (let k = threshold; k <= adjLambda + 30; k++) {
        p += Math.exp(-adjLambda) * Math.pow(adjLambda, k) / factorial(k);
    }
    return p;
}

function factorial(n) {
    if (n < 2) return 1;
    let out = 1;
    for (let i = 2; i <= n; i++) out *= i;
    return out;
}
