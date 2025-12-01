// ============================================================
<<<<<<< HEAD
// SND PREDICTION ENGINE — BALANCED VARIANCE VERSION (Option A)
// Realistic probabilities: 15–30% for EXP ~4 on Line 7
=======
// SND PREDICTION ENGINE — FINAL VERSION (MATCHES HP ENGINE)
// Early / Mid / Late Season + Opponent + Map + Engagement
>>>>>>> 454292ec1ab8fa17ef12087c6e862c03f9af0b31
// ============================================================

// ----------------------------
// Safe division
// ----------------------------
<<<<<<< HEAD
function safeDiv(a, b) { return b === 0 ? 0 : (a / b); }

// ----------------------------
// Filters
// ----------------------------
=======
function safeDiv(a, b) {
    return b === 0 ? 0 : (a / b);
}

// ============================================================
// Get all matches for this player/team/map/opponent
// ============================================================
>>>>>>> 454292ec1ab8fa17ef12087c6e862c03f9af0b31
function getPlayerSNDMatches(matches, team, player, map, opponent = null) {
    return matches.filter(m =>
        m.mode === "snd" &&
        m.team === team &&
        m.player === player &&
        m.map === map &&
        (!opponent || m.opponent === opponent)
    );
}

<<<<<<< HEAD
// ----------------------------
// Core rates
// ----------------------------
function sndKPR(m)    { return safeDiv(m.reduce((a,x)=>a+x.kills,0),  m.reduce((a,x)=>a+x.duration,0)); }
function sndDPR(m)    { return safeDiv(m.reduce((a,x)=>a+(x.damage||0),0), m.reduce((a,x)=>a+x.duration,0)); }
function sndFBR(m)    { return safeDiv(m.reduce((a,x)=>a+(x.firstBloods||0),0), m.reduce((a,x)=>a+x.duration,0)); }
function sndPlantRate(m){return safeDiv(m.reduce((a,x)=>a+(x.plants||0),0),m.reduce((a,x)=>a+x.duration,0)); }
function sndEngagement(m){return safeDiv(m.reduce((a,x)=>a+(x.kills+x.deaths),0), m.reduce((a,x)=>a+x.duration,0)); }

function sndLeagueDPR(matches) {
    const a = matches.filter(x=>x.mode==="snd");
    return safeDiv(a.reduce((s,x)=>s+(x.damage||0),0), a.reduce((s,x)=>s+x.duration,0));
}

// ----------------------------
// Opponent Defensive Factor
// ----------------------------
function sndOpponentFactor(matches, opponent, map) {
    if (!opponent) return 1.0;

    const arr = matches.filter(m =>
=======
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
>>>>>>> 454292ec1ab8fa17ef12087c6e862c03f9af0b31
        m.mode === "snd" &&
        m.opponent === opponent &&
        m.map === map
    );

<<<<<<< HEAD
    if (arr.length < 2) return 1.0;

    const dpr = safeDiv(arr.reduce((a,x)=>a+x.deaths,0) / 4,
                        arr.reduce((a,x)=>a+x.duration,0));

    return Math.min(1.20, Math.max(0.80, 1 + (dpr - 0.95) * 0.50));
}

// ----------------------------
// Map Tempo
// ----------------------------
function sndMapTempo(matches, map) {
    const arr = matches.filter(m => m.mode === "snd" && m.map === map);
    if (arr.length === 0) return 1.0;

    let t = 0;
    arr.forEach(m => t += (m.kills + m.deaths) / (m.duration || 1));

    t /= arr.length;
    return Math.min(1.15, Math.max(0.85, t / 1.20));
}

// ----------------------------
// Balanced Map Volatility Scores
// ----------------------------
function sndMapVolatility(map) {
    map = map.toLowerCase();

    if (map === "den") return 0.38;       // slightly volatile
    if (map === "raid") return 0.22;      // structured
    if (map === "express") return 0.20;
    if (map === "colossus") return 0.30;  // mid-high
    if (map === "scar") return 0.26;

    return 0.25;
}

// ----------------------------
// Last 5 boost
// ----------------------------
function sndLast5Boost(matches, team, player, map) {
    const last5 = matches
        .filter(m => m.mode==="snd" && m.team===team && m.player===player && m.map===map)
=======
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
>>>>>>> 454292ec1ab8fa17ef12087c6e862c03f9af0b31
        .slice(-5);

    if (last5.length === 0) return 1.0;

<<<<<<< HEAD
    let k=0,r=0;
    last5.forEach(m => { k+=m.kills; r+=m.duration; });

    const kpr = safeDiv(k,r);
    return 1 + Math.min(0.12, (kpr - 0.65) * 0.30);
}

// ----------------------------
// Season stability
// ----------------------------
function sndSeasonStability(pm) {
    const n = pm.length;
    if (n <= 3) return 0.58;
    if (n <= 8) return 0.75;
    if (n <= 15) return 0.89;
    return 1.0;
}

// ============================================================
// EXPECTED KILLS (Balanced Version)
=======
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
>>>>>>> 454292ec1ab8fa17ef12087c6e862c03f9af0b31
// ============================================================
function expectedSNDKills(matches, team, player, map, opponent) {

    const pm = getPlayerSNDMatches(matches, team, player, map, opponent);
<<<<<<< HEAD
    if (pm.length === 0) return { raw: 0, alpha: 1.0 };

    const kpr       = sndKPR(pm);
    const dpr       = sndDPR(pm);
    const fbr       = sndFBR(pm);
    const pr        = sndPlantRate(pm);
    const eng       = sndEngagement(pm);

    const leagueDPR = sndLeagueDPR(matches);
    const tempo     = sndMapTempo(matches, map);
    const oppFactor = sndOpponentFactor(matches, opponent, map);
    const last5     = sndLast5Boost(matches, team, player, map);

    const trust     = sndSeasonStability(pm);
    const mapVol    = sndMapVolatility(map);

    // Base KPR
    const baseKPR =
        (kpr * 0.60) +
        (fbr * 0.25) +
        (pr  * 0.15);

    // Damage-based boost
    const dmgBoost = 0.75 + 0.25 * safeDiv(dpr, leagueDPR);

    // Player avg rounds
    const playerAvgRounds =
        pm.reduce((s,m)=>s+(m.duration||0),0) / pm.length;

    // Hybrid rounds
    const avgRounds = 0.75 * 11 + 0.25 * playerAvgRounds;

    // Expected kills
    let expKills =
=======
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
>>>>>>> 454292ec1ab8fa17ef12087c6e862c03f9af0b31
        baseKPR *
        tempo *
        oppFactor *
        dmgBoost *
<<<<<<< HEAD
        last5 *
        avgRounds;

    // Trust smoothing
    expKills = expKills * trust + expKills * 0.92 * (1 - trust);

    // ============================================================
    // BALANCED VARIANCE (Option A)
    // α controls tail fatness.
    // Produces realistic 15–30% overs for exp=4, line=7
    // ============================================================
    const alpha =
        0.35 +                // baseline
        0.40 * (1 - trust) +  // early season volatility
        0.55 * eng +          // higher engagement = higher variance
        mapVol * 0.55;        // map volatility

    return {
        raw: expKills,
        alpha: Math.max(0.3, Math.min(alpha, 2.0))
=======
        last5;

    // Expected kills = EPR * rounds
    let avgRounds = 11; // typical CDL SND (~6–5, 6–4)
    const expKills = expPerRound * avgRounds;

    // stability mixture (same structure as HP)
    const fullExp = expKills * trust + (expKills * 0.85) * (1 - trust);

    return {
        raw: fullExp,
        varBoost
>>>>>>> 454292ec1ab8fa17ef12087c6e862c03f9af0b31
    };
}

// ============================================================
<<<<<<< HEAD
// NEGATIVE BINOMIAL TAIL
// ============================================================
function poissonOverSND(lambda, line, alpha = 1.0) {

    const r = 1 / alpha;
    const threshold = Math.floor(line) + 1;
    let p = 0;

    for (let k = threshold; k <= lambda + 25; k++) {
        const p0 = r / (r + lambda);
        const logCoeff =
            logGamma(k + r) -
            logGamma(k + 1) -
            logGamma(r);

        const logTerm =
            logCoeff +
            r * Math.log(p0) +
            k * Math.log(1 - p0);

        p += Math.exp(logTerm);
    }
    return p;
}

function logGamma(z) {
    return (
        (z - 0.5) * Math.log(z + 4.5) -
        (z + 4.5) +
        0.9189385332046727 +
        (((((( -1/1680 )/(z+4)) + 1/1260)/(z+3) - 1/360)/(z+2) + 1/12)/(z+1))
    );
}
=======
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
>>>>>>> 454292ec1ab8fa17ef12087c6e862c03f9af0b31
