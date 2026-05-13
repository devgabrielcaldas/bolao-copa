import {
  findAllSpecialPredictions,
  findSpecialPredictionByUserId,
  upsertSpecialPrediction,
  countSpecialPredictionsFromDatabase
} from "../repositories/special-prediction-repository.js";

function normalizeSpecialPrediction(prediction) {
  return {
    id: prediction.id,
    userId: prediction.user_id,
    champion: prediction.champion,
    runnerUp: prediction.runner_up,
    topScorerId: prediction.top_scorer_id,
    topScorerName: prediction.top_scorer_name,
    topScorerTeam: prediction.top_scorer_team,
    createdAt: prediction.created_at,
    updatedAt: prediction.updated_at
  };
}

export async function getAllSpecialPredictions() {
  const predictions = await findAllSpecialPredictions();

  return predictions.map(normalizeSpecialPrediction);
}

export async function getSpecialPredictionByUser(userId) {
  const prediction = await findSpecialPredictionByUserId(userId);

  if (!prediction) {
    return null;
  }

  return normalizeSpecialPrediction(prediction);
}

export async function saveSpecialPrediction({
  userId,
  champion,
  runnerUp,
  topScorerId,
  topScorerName,
  topScorerTeam
}) {
  const prediction = await upsertSpecialPrediction({
    userId,
    champion,
    runnerUp,
    topScorerId,
    topScorerName,
    topScorerTeam
  });

  return normalizeSpecialPrediction(prediction);
}

export async function countSpecialPredictions() {
  return await countSpecialPredictionsFromDatabase();
}