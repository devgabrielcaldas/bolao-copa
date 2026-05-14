import {
  findAllGroupPredictions,
  findGroupPredictionsByUserId,
  findGroupPredictionByUserAndGroup,
  upsertGroupPrediction,
  countGroupPredictionsByUserId
} from "../repositories/group-prediction-repository.js";

export async function getAllGroupPredictions() {
  const predictions = await findAllGroupPredictions();

  return predictions.map((prediction) => {
    return {
      id: prediction.id,
      userId: prediction.user_id,
      groupCode: prediction.group_code,
      positions: prediction.positions,
      createdAt: prediction.created_at,
      updatedAt: prediction.updated_at
    };
  });
}

export async function getGroupPredictionsByUser(userId) {
  const predictions = await findGroupPredictionsByUserId(userId);

  return predictions.map((prediction) => {
    return {
      id: prediction.id,
      userId: prediction.user_id,
      groupCode: prediction.group_code,
      positions: prediction.positions,
      createdAt: prediction.created_at,
      updatedAt: prediction.updated_at
    };
  });
}

export async function getGroupPredictionByUserAndGroup(userId, groupCode) {
  const prediction = await findGroupPredictionByUserAndGroup(userId, groupCode);

  if (!prediction) {
    return null;
  }

  return {
    id: prediction.id,
    userId: prediction.user_id,
    groupCode: prediction.group_code,
    positions: prediction.positions,
    createdAt: prediction.created_at,
    updatedAt: prediction.updated_at
  };
}

export async function saveGroupPrediction({ userId, groupCode, positions }) {
  const prediction = await upsertGroupPrediction({
    userId,
    groupCode,
    positions
  });

  return {
    id: prediction.id,
    userId: prediction.user_id,
    groupCode: prediction.group_code,
    positions: prediction.positions,
    createdAt: prediction.created_at,
    updatedAt: prediction.updated_at
  };
}

export async function countGroupPredictionsByUser(userId) {
  return await countGroupPredictionsByUserId(userId);
}