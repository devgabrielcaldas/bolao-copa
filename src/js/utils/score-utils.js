export function getMatchOutcome(homeScore, awayScore) {
  if (homeScore > awayScore) {
    return "HOME_WIN";
  }

  if (homeScore < awayScore) {
    return "AWAY_WIN";
  }

  return "DRAW";
}

export function calculateMatchPoints(prediction, match) {
  const matchHasResult =
    match.homeScore !== null &&
    match.awayScore !== null &&
    match.homeScore !== undefined &&
    match.awayScore !== undefined;

  if (!matchHasResult || !prediction) {
    return {
      points: 0,
      isExactScore: false,
      isCorrectOutcome: false
    };
  }

  const isExactScore =
    Number(prediction.homeScore) === Number(match.homeScore) &&
    Number(prediction.awayScore) === Number(match.awayScore);

  if (isExactScore) {
    return {
      points: 3,
      isExactScore: true,
      isCorrectOutcome: true
    };
  }

  const predictedOutcome = getMatchOutcome(
    Number(prediction.homeScore),
    Number(prediction.awayScore)
  );

  const actualOutcome = getMatchOutcome(
    Number(match.homeScore),
    Number(match.awayScore)
  );

  const isCorrectOutcome = predictedOutcome === actualOutcome;

  return {
    points: isCorrectOutcome ? 1 : 0,
    isExactScore: false,
    isCorrectOutcome
  };
}

export function calculateGroupPoints(prediction, actualStanding) {
  if (!prediction || !actualStanding) {
    return 0;
  }

  const isCorrect =
    prediction.positions[0] === actualStanding.positions[0] &&
    prediction.positions[1] === actualStanding.positions[1] &&
    prediction.positions[2] === actualStanding.positions[2] &&
    prediction.positions[3] === actualStanding.positions[3];

  return isCorrect ? 2 : 0;
}

export function calculateSpecialPoints(prediction, officialResult) {
  if (!prediction || !officialResult) {
    return {
      championPoints: 0,
      runnerUpPoints: 0,
      topScorerPoints: 0,
      total: 0
    };
  }

  const championPoints =
    prediction.champion === officialResult.champion ? 5 : 0;

  const runnerUpPoints =
    prediction.runnerUp === officialResult.runnerUp ? 2 : 0;

  const topScorerPoints =
    Number(prediction.topScorerId) === Number(officialResult.topScorerId)
      ? 5
      : 0;

  return {
    championPoints,
    runnerUpPoints,
    topScorerPoints,
    total: championPoints + runnerUpPoints + topScorerPoints
  };
}