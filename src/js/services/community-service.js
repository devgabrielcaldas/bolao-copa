import { usersMock } from "../data/users.mock.js";
import { findAllCommunityPredictions } from "../repositories/community-repository.js";

function normalizePrediction(prediction) {
  return {
    id: prediction.id,
    userId: prediction.user_id,
    matchId: prediction.match_id,
    homeScore: prediction.home_score,
    awayScore: prediction.away_score,
    createdAt: prediction.created_at,
    updatedAt: prediction.updated_at
  };
}

export async function getCommunityPredictions() {
  const predictions = await findAllCommunityPredictions();

  return predictions.map(normalizePrediction);
}

export function getCommunityUsers() {
  return usersMock.filter((user) => {
    return !user.isDemo;
  });
}

export function getPredictionsByMatch(matchId, predictions) {
  return predictions.filter((prediction) => {
    return Number(prediction.matchId) === Number(matchId);
  });
}

export function getUserPredictionForMatch(userId, matchPredictions) {
  return matchPredictions.find((prediction) => {
    return Number(prediction.userId) === Number(userId);
  });
}