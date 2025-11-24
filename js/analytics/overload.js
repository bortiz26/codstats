// ============================================================
// OVERLOAD MODEL  (KPM-based expected kills, same as HP)
// ============================================================
//
// INPUT:
//   player, kills[], deaths[], duration[], line
//
// Overload plays like HP (continuous time mode)
// → So it uses the same KPM logic as Hardpoint.
//
// RETURNS:
//   {
//      player,
//      rate,        (KPM)
//      expected,    (expected kills)
//      diff,
//      prob
//   }
// ============================================================

function runOverloadModel(info) {

    const { player, kills, deaths, duration, line } = info;

    // ---------------------------------------------
    // Duration fallback
    // ---------------------------------------------
    const durations = duration.map(x => (x > 0 ? x : 300));

    // ---------------------------------------------
    // Compute KPM
    // ---------------------------------------------
    const totalKills = kills.reduce((a,b)=>a+b, 0);
    const totalMinutes = durations.reduce((a,b)=>a + b/60, 0);

    const kpm = totalKills > 0 && totalMinutes > 0
        ? (totalKills / totalMinutes)
        : 0;

    // ---------------------------------------------
    // Expected kills for THIS match
    // ---------------------------------------------
    const avgDuration = durations.reduce((a,b)=>a+b, 0) / durations.length;
    const expected = kpm * (avgDuration / 60);

    // ---------------------------------------------
    // Difference + probability
    // ---------------------------------------------
    const diff = expected - line;
    const prob = logistic(diff, 1.5);

    return {
        player,
        rate: kpm.toFixed(2) + " KPM",
        expected,
        diff,
        prob
    };
}
