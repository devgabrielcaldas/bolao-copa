import { usersMock } from "../data/users.mock.js";
import { matchesMock } from "../data/matches.mock.js";

import { getAllPredictions } from "./prediction-service.js";
import { getAllGroupPredictions } from "./group-prediction-service.js";
import { getAllSpecialPredictions } from "./special-prediction-service.js";

import {
  getActualGroupStandings,
  getOfficialResult,
  getMatchesWithResults
} from "./admin-service.js";

import {
  calculateMatchPoints,
  calculateGroupPoints,
  calculateSpecialPoints
} from "../utils/score-utils.js";

function createEmptyUserStats(user) {
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    role: user.role,
    totalPoints: 0,
    matchPoints: 0,
    groupPoints: 0,
    specialPoints: 0,
    exactScores: 0,
    correctOutcomes: 0,
    correctGroups: 0,
    predictionsCount: 0
  };
}

function groupByUserId(items) {
  return items.reduce((accumulator, item) => {
    const userId = Number(item.userId);

    if (!accumulator.has(userId)) {
      accumulator.set(userId, []);
    }

    accumulator.get(userId).push(item);

    return accumulator;
  }, new Map());
}

function createMatchesMap(matches) {
  return matches.reduce((accumulator, match) => {
    accumulator.set(Number(match.id), match);
    return accumulator;
  }, new Map());
}

function createGroupStandingsMap(standings) {
  return standings.reduce((accumulator, standing) => {
    accumulator.set(standing.groupCode, standing);
    return accumulator;
  }, new Map());
}

function calculateUserMatchStats(userPredictions, matchesMap) {
  return userPredictions.reduce(
    (accumulator, prediction) => {
      const match = matchesMap.get(Number(prediction.matchId));

      if (!match) {
        return accumulator;
      }

      const result = calculateMatchPoints(prediction, match);

      accumulator.matchPoints += result.points;

      if (result.isExactScore) {
        accumulator.exactScores += 1;
      }

      if (result.isCorrectOutcome && !result.isExactScore) {
        accumulator.correctOutcomes += 1;
      }

      return accumulator;
    },
    {
      matchPoints: 0,
      exactScores: 0,
      correctOutcomes: 0
    }
  );
}

function calculateUserGroupStats(userGroupPredictions, groupStandingsMap) {
  return userGroupPredictions.reduce(
    (accumulator, prediction) => {
      const actualStanding = groupStandingsMap.get(prediction.groupCode);

      const points = calculateGroupPoints(prediction, actualStanding);

      accumulator.groupPoints += points;

      if (points > 0) {
        accumulator.correctGroups += 1;
      }

      return accumulator;
    },
    {
      groupPoints: 0,
      correctGroups: 0
    }
  );
}

function calculateUserSpecialStats(userSpecialPrediction, officialResult) {
  return calculateSpecialPoints(userSpecialPrediction, officialResult);
}

function sortRanking(ranking) {
  return ranking.sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) {
      return b.totalPoints - a.totalPoints;
    }

    if (b.exactScores !== a.exactScores) {
      return b.exactScores - a.exactScores;
    }

    if (b.correctOutcomes !== a.correctOutcomes) {
      return b.correctOutcomes - a.correctOutcomes;
    }

    if (b.specialPoints !== a.specialPoints) {
      return b.specialPoints - a.specialPoints;
    }

    if (b.groupPoints !== a.groupPoints) {
      return b.groupPoints - a.groupPoints;
    }

    return a.name.localeCompare(b.name);
  });
}

function createEmptyRanking() {
  return sortRanking(usersMock.map(createEmptyUserStats));
}

export async function getRanking() {
  try {
    const [
      matchesWithResults,
      allPredictions,
      allGroupPredictions,
      allSpecialPredictions,
      actualStandings,
      officialResult
    ] = await Promise.all([
      getMatchesWithResults(matchesMock),
      getAllPredictions(),
      getAllGroupPredictions(),
      getAllSpecialPredictions(),
      getActualGroupStandings(),
      getOfficialResult()
    ]);

    const matchesMap = createMatchesMap(matchesWithResults);
    const groupStandingsMap = createGroupStandingsMap(actualStandings);

    const predictionsByUserId = groupByUserId(allPredictions);
    const groupPredictionsByUserId = groupByUserId(allGroupPredictions);

    const specialPredictionByUserId = allSpecialPredictions.reduce(
      (accumulator, prediction) => {
        accumulator.set(Number(prediction.userId), prediction);
        return accumulator;
      },
      new Map()
    );

    const ranking = usersMock.map((user) => {
      const userId = Number(user.id);

      const userPredictions = predictionsByUserId.get(userId) || [];
      const userGroupPredictions = groupPredictionsByUserId.get(userId) || [];
      const userSpecialPrediction = specialPredictionByUserId.get(userId) || null;

      const matchStats = calculateUserMatchStats(userPredictions, matchesMap);

      const groupStats = calculateUserGroupStats(
        userGroupPredictions,
        groupStandingsMap
      );

      const specialStats = calculateUserSpecialStats(
        userSpecialPrediction,
        officialResult
      );

      const totalPoints =
        matchStats.matchPoints +
        groupStats.groupPoints +
        specialStats.total;

      return {
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role,
        totalPoints,
        matchPoints: matchStats.matchPoints,
        groupPoints: groupStats.groupPoints,
        specialPoints: specialStats.total,
        exactScores: matchStats.exactScores,
        correctOutcomes: matchStats.correctOutcomes,
        correctGroups: groupStats.correctGroups,
        predictionsCount: userPredictions.length
      };
    });

    return sortRanking(ranking);
  } catch (error) {
    console.error("Erro ao calcular ranking:", error);

    return createEmptyRanking();
  }
}