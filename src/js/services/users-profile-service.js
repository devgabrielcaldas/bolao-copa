import { usersMock } from "../data/users.mock.js";
import { matchesMock } from "../data/matches.mock.js";
import { groupsMock } from "../data/groups.mock.js";
import { playersMock } from "../data/players.mock.js";

import { getAllPredictions } from "./prediction-service.js";
import { getAllGroupPredictions } from "./group-prediction-service.js";
import { getAllSpecialPredictions } from "./special-prediction-service.js";

function hasMatchStarted(match) {
  return new Date() >= new Date(match.startsAt);
}

function hasGroupLocked(group) {
  return new Date() >= new Date(group.lockAt);
}

function hasSpecialPredictionsLocked() {
  const firstMatch = [...matchesMock].sort((a, b) => {
    return new Date(a.startsAt) - new Date(b.startsAt);
  })[0];

  if (!firstMatch) {
    return false;
  }

  return new Date() >= new Date(firstMatch.startsAt);
}

function getTeamName(match, side) {
  if (side === "home") {
    return match.homeTeam || match.homePlaceholder || "A definir";
  }

  return match.awayTeam || match.awayPlaceholder || "A definir";
}

function getPlayerNameById(playerId) {
  const player = playersMock.find((item) => {
    return Number(item.id) === Number(playerId);
  });

  if (!player) {
    return "";
  }

  return `${player.name} - ${player.team}`;
}

function getAvailableMatches() {
  return matchesMock.filter(hasMatchStarted);
}

function getAvailableGroups() {
  return groupsMock.filter(hasGroupLocked);
}

function getUserMatchPredictions(userId, allPredictions) {
  const availableMatches = getAvailableMatches();

  return availableMatches.map((match) => {
    const prediction = allPredictions.find((item) => {
      return Number(item.userId) === Number(userId) &&
        Number(item.matchId) === Number(match.id);
    });

    return {
      matchId: match.id,
      group: match.group,
      round: match.round,
      startsAt: match.startsAt,
      homeTeam: getTeamName(match, "home"),
      awayTeam: getTeamName(match, "away"),
      prediction: prediction
        ? {
            homeScore: prediction.homeScore,
            awayScore: prediction.awayScore
          }
        : null
    };
  });
}

function getUserGroupPredictions(userId, allGroupPredictions) {
  const availableGroups = getAvailableGroups();

  return availableGroups.map((group) => {
    const prediction = allGroupPredictions.find((item) => {
      return Number(item.userId) === Number(userId) &&
        item.groupCode === group.code;
    });

    return {
      groupCode: group.code,
      prediction: prediction
        ? {
            positions: prediction.positions
          }
        : null
    };
  });
}

function getUserSpecialPrediction(userId, allSpecialPredictions) {
  if (!hasSpecialPredictionsLocked()) {
    return null;
  }

  const prediction = allSpecialPredictions.find((item) => {
    return Number(item.userId) === Number(userId);
  });

  if (!prediction) {
    return null;
  }

  return {
    champion: prediction.champion || "",
    runnerUp: prediction.runnerUp || "",
    topScorer:
      prediction.topScorerName ||
      getPlayerNameById(prediction.topScorerId) ||
      ""
  };
}

export async function getUsersProfiles() {
  const [
    allPredictions,
    allGroupPredictions,
    allSpecialPredictions
  ] = await Promise.all([
    getAllPredictions(),
    getAllGroupPredictions(),
    getAllSpecialPredictions()
  ]);

  const users = usersMock.filter((user) => {
    return !user.isDemo;
  });

  return users.map((user) => {
    const matchPredictions = getUserMatchPredictions(user.id, allPredictions);
    const groupPredictions = getUserGroupPredictions(
      user.id,
      allGroupPredictions
    );
    const specialPrediction = getUserSpecialPrediction(
      user.id,
      allSpecialPredictions
    );

    const visibleMatchPredictions = matchPredictions.filter((item) => {
      return item.prediction;
    });

    const visibleGroupPredictions = groupPredictions.filter((item) => {
      return item.prediction;
    });

    return {
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
      avatarUrl: user.avatarUrl || "",
      matchPredictions,
      groupPredictions,
      specialPrediction,
      summary: {
        matchesCount: visibleMatchPredictions.length,
        groupsCount: visibleGroupPredictions.length,
        hasSpecialPrediction: Boolean(specialPrediction)
      }
    };
  });
}