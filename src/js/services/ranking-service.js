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

function getUserMatchStats(userId, allPredictions, matchesWithResults) {
  const userPredictions = allPredictions.filter((prediction) => {
    return Number(prediction.userId) === Number(userId);
  });

  return userPredictions.reduce(
    (accumulator, prediction) => {
      const match = matchesWithResults.find((item) => {
        return Number(item.id) === Number(prediction.matchId);
      });

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

function getUserGroupStats(userId, allGroupPredictions, actualStandings) {
  const userGroupPredictions = allGroupPredictions.filter((prediction) => {
    return Number(prediction.userId) === Number(userId);
  });

  return userGroupPredictions.reduce(
    (accumulator, prediction) => {
      const actualStanding = actualStandings.find((standing) => {
        return standing.groupCode === prediction.groupCode;
      });

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

function getUserSpecialStats(userId, allSpecialPredictions, officialResult) {
  const specialPrediction = allSpecialPredictions.find((prediction) => {
    return Number(prediction.userId) === Number(userId);
  });

  return calculateSpecialPoints(specialPrediction, officialResult);
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
  return sortRanking(
    usersMock.map((user) => {
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
        correctGroups: 0
      };
    })
  );
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

    const ranking = usersMock.map((user) => {
      const matchStats = getUserMatchStats(
        user.id,
        allPredictions,
        matchesWithResults
      );

      const groupStats = getUserGroupStats(
        user.id,
        allGroupPredictions,
        actualStandings
      );

      const specialStats = getUserSpecialStats(
        user.id,
        allSpecialPredictions,
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
        correctGroups: groupStats.correctGroups
      };
    });

    return sortRanking(ranking);
  } catch (error) {
    console.error("Erro ao calcular ranking:", error);

    return createEmptyRanking();
  }
}