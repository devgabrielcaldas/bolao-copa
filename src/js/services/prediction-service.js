import {
  findAllPredictions,
  findPredictionByUserAndMatch,
  upsertPrediction,
  countPredictionsByUserId
} from "../repositories/prediction-repository.js";

export async function getAllPredictions() {
  const predictions = await findAllPredictions();

  return predictions.map((prediction) => {
    return {
      id: prediction.id,
      userId: prediction.user_id,
      matchId: prediction.match_id,
      homeScore: prediction.home_score,
      awayScore: prediction.away_score,
      createdAt: prediction.created_at,
      updatedAt: prediction.updated_at
    };
  });
}

export async function getPredictionByUserAndMatch(userId, matchId) {
  const prediction = await findPredictionByUserAndMatch(userId, matchId);

  if (!prediction) {
    return null;
  }

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

export async function savePrediction({ userId, matchId, homeScore, awayScore }) {
  const prediction = await upsertPrediction({
    userId,
    matchId,
    homeScore,
    awayScore
  });

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

export async function countPredictionsByUser(userId) {
  return await countPredictionsByUserId(userId);
}