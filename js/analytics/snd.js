// ============================================================
// SND PREDICTION ENGINE — FINAL VERSION (MATCHES HP ENGINE)
// Early / Mid / Late Season + Opponent + Map + Engagement
// ============================================================

// ----------------------------
// Safe division
// ----------------------------
function safeDiv(a, b) {
    return b === 0 ? 0 : (a / b);
}

// ============================================================
// Get all matches for this player/team/map/opponent
// ============================================================
function getPlayerSNDMatches(matches, team, player, map, opponent = null) {
    return matches.filter(m =>
        m.mode === "snd" &&
        m.team === team &&
        m.player === player &&
        m.map === map &&
        (!opponent || m.opponent === opponent)
    );
}

// ============================================================
// 1. Kills Per Round (KPR)
// ============================================================
function sndKPR(matches) {
    let kills = 0, rounds = 0;
    matches.forEach(m => {
        kills += m.kills;
        rounds += m.duration || 0;
    });
    return safeDiv(kills, rounds);
}

// ============================================================
// 2. Damage Per Round
// ============================================================
function sndDPR(matches) {
    let dmg = 0, rounds = 0;
    matches.forEach(m => {
        dmg += m.damage || 0;
        rounds += m.duration || 0;
    });
    return safeDiv(dmg, rounds);
}

// League average DPR ~ 450–500
function sndLeagueDPR(matches) {
    let dmg = 0, rounds = 0;
    matches.forEach(m => {
        if (m.mode === "snd") {
            dmg += m.damage || 0;
            rounds += m.duration || 0;
        }
    });
    return safeDiv(dmg, rounds);
}

// ============================================================
// 3. First Blood Rate
// ============================================================
function sndFBR(matches) {
    let fb = 0, rounds = 0;
    matches.forEach(m => {
        fb += m.firstBloods || 0;
        rounds += m.duration || 0;
    });
    return safeDiv(fb, rounds);
}

// ============================================================
// 4. Plant Rate
// ============================================================
function sndPlantRate(matches) {
    let pl = 0, rounds = 0;
    matches.forEach(m => {
        pl += m.plants || 0;
        rounds += m.duration || 0;
    });
    return safeDiv(pl, rounds);
}

// ============================================================
// 5. Engagement Rate (kills + deaths per round)
// ============================================================
function sndEngagement(matches) {
    let eng = 0, rounds = 0;
    matches.forEach(m => {
        eng += (m.kills + m.deaths);
        rounds += m.duration || 0;
    });
    return safeDiv(eng, rounds);
}

function engagementVarianceSND(rate) {
    if (rate > 1.4) return 1.15;
    if (rate > 1.1) return 1.07;
    return 1.0;
}

// ============================================================
// 6. Opponent Defensive Factor (kills allowed)
// ============================================================
function sndOpponentFactor(matches, opponent, map) {

    if (!opponent || opponent === "any") return 1.0;

    const vsOpp = matches.filter(m =>
        m.mode === "snd" &&
        m.opponent === opponent &&
        m.map === map
    );

    if (vsOpp.length < 2) return 1.0;

    // Deaths per round allowed
    let deaths = 0, rounds = 0;
    vsOpp.forEach(m => {
        deaths += m.deaths;
        rounds += m.duration;
    });

    const dpr = safeDiv(deaths / 4, rounds); // per player DPR

    // Normalize around league ~0.95 DPR
    return Math.min(1.20, Math.max(0.80, 1 + (dpr - 0.95) * 0.50));
}

// ============================================================
// 7. Map Tempo (round pace)
// ============================================================
function sndMapTempo(matches, map) {
    const arr = matches.filter(m => m.mode === "snd" && m.map === map);

    if (arr.length === 0) return 1.0;

    let tempo = 0;
    arr.forEach(m => {
        const r = m.duration || 0;
        if (r > 0) tempo += (m.kills + m.deaths) / r;
    });

    tempo = tempo / arr.length;

    // Normalize around typical CDL SND engagement rate ~1.2
    return Math.min(1.15, Math.max(0.85, tempo / 1.20));
}

// ============================================================
// 8. Last 5 Matches Boost (same as HP)
// ============================================================
function sndLast5Boost(matches, team, player, map) {

    const last5 = matches
        .filter(m =>
            m.mode === "snd" &&
            m.team === team &&
            m.player === player &&
            m.map === map
        )
        .slice(-5);

    if (last5.length === 0) return 1.0;

    let k = 0, r = 0;
    last5.forEach(m => {
        k += m.kills;
        r += m.duration || 0;
    });

    const kpr = safeDiv(k, r);

    // 12% max boost
    return 1 + Math.min(0.12, (kpr - 0.65) * 0.30);
}

// ============================================================
// 9. Progressive Season Stability (HP-style)
// ============================================================
function sndSeasonStability(matchesForPlayer) {
    const n = matchesForPlayer.length;

    if (n <= 3) return 0.55;   // Early — heavy smoothing
    if (n <= 8) return 0.72;   // Mid
    if (n <= 15) return 0.88;  // Late mid

    return 1.0; // Full trust
}

// ============================================================
// 10. Expected Kills Engine (FINAL)
// ============================================================
function expectedSNDKills(matches, team, player, map, opponent) {

    const pm = getPlayerSNDMatches(matches, team, player, map, opponent);
    if (pm.length === 0) return { raw: 0, varBoost: 1.0 };

    // Core metrics
    const kpr = sndKPR(pm);
    const dpr = sndDPR(pm);
    const leagueDPR = sndLeagueDPR(matches);

    const fbr = sndFBR(pm);
    const pr  = sndPlantRate(pm);
    const eng = sndEngagement(pm);

    const tempo = sndMapTempo(matches, map);
    const oppFactor = sndOpponentFactor(matches, opponent, map);

    // Last 5 matches
    const last5 = sndLast5Boost(matches, team, player, map);

    // Progressive trust weight
    const trust = sndSeasonStability(pm);

    // ================================================
    // Weighted Kill Per Round Formula (final)
    // ================================================
    const baseKPR =
        (kpr * 0.60 * trust) +
        (fbr * 0.25) +
        (pr  * 0.15);

    // Damage influence (normalize DPR to league)
    const dprFactor = safeDiv(dpr, leagueDPR);
    const dmgBoost = 0.75 + 0.25 * dprFactor;

    // Engagement variance
    const varBoost = engagementVarianceSND(eng);

    // CORE expectation per round
    let expPerRound =
        baseKPR *
        tempo *
        oppFactor *
        dmgBoost *
        last5;

    // Expected kills = EPR * rounds
    let avgRounds = 11; // typical CDL SND (~6–5, 6–4)
    const expKills = expPerRound * avgRounds;

    // stability mixture (same structure as HP)
    const fullExp = expKills * trust + (expKills * 0.85) * (1 - trust);

    return {
        raw: fullExp,
        varBoost
    };
}

// ============================================================
// SND Poisson Probability
// ============================================================
function poissonOverSND(lambda, line, varBoost = 1.0) {
    const adjLambda = lambda * varBoost;
    const threshold = Math.floor(line) + 1;
    let p = 0;
    for (let k = threshold; k <= adjLambda + 20; k++) {
        p += Math.exp(-adjLambda) * Math.pow(adjLambda, k) / factorial(k);
    }
    return p;
}
