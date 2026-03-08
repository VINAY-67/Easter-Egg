/**
 * Calculates a composite score for ranking users on the admin dashboard.
 * Higher round = higher rank. Within same round fewer tries = better.
 */
const calculateRank = (user) => {
    // Round weights: round 3 > round 2 > round 1
    const roundReached = (() => {
        if (user.HasPlayed['Round-3']) return 3;
        if (user.HasPlayed['Round-2']) return 2;
        if (user.HasPlayed['Round-1']) return 1;
        return 0;
    })();

    const totalTries =
        (user.numberofTries['Round-1'] || 0) +
        (user.numberofTries['Round-2'] || 0) +
        (user.numberofTries['Round-3'] || 0);

    // Score: round is most significant, fewer tries = better within same round
    const score = roundReached * 1000 - totalTries;
    return { roundReached, totalTries, score };
};

module.exports = { calculateRank };
