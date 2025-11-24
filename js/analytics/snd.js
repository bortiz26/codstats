// ============================================================
// SEARCH & DESTROY MODEL (KPR-based expected kills)
// ============================================================
//
// INPUT:
//   player, kills[], deaths[], duration[], line
//
// SnD uses KPR (kills per round)
// Avg round length historically: ~100 sec (your chosen constant)
//
// RETURNS:
//   {
//      player,
//      rate,        (KPR)
//      expected,    (expected kills)
//      diff,        (expected - line)
//      prob         (probability)
//   }
// ============================================================

function runSNDModel(info) {

    const { player, kills, deaths, duration, line } = info;

    // ---------------------------------------------
    // Convert durations into "rounds"
    // Using your logic: 1 round = 100 seconds
    // ---------------------------------------------
    const roundsList = duration.map(sec => {
        if (!sec || sec <= 0) return 1;   // fallback
        return sec / 100;
    });

    // ---------------------------------------------
    // Compute total rounds and total kills
    // ---------------------------------------------
    const totalRounds = roundsList.reduce((a,b) => a+b, 0);
    const totalKills  = kills.reduce((a,b) => a+b, 0);

    // ---------------------------------------------
    // KPR = kills per round
    // ---------------------------------------------
    const kpr = totalRounds > 0
        ? (totalKills / totalRounds)
        : 0;

    // ---------------------------------------------
    // Expected kills for THIS match:
    // avgRounds × KPR
    // ---------------------------------------------
    const avgRounds = totalRounds / roundsList.length;
    const expected  = kpr * avgRounds;

    // ---------------------------------------------
    // Difference + probability
    // ---------------------------------------------
    const diff = expected - line;

    // Logistic curve exactly like your HP model
    const prob = logistic(diff, 1.5);

    return {
        player,
        rate: kpr.toFixed(2) + " KPR",
        expected,
        diff,
        prob
    };
}
