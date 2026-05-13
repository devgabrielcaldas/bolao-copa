import { supabaseClient } from "../config/supabase-config.js";

export async function findAllGroupPredictions() {
  const { data, error } = await supabaseClient
    .from("group_predictions")
    .select("*")
    .order("group_code", { ascending: true });

  if (error) {
    console.error("Erro ao buscar palpites dos grupos:", error);
    return [];
  }

  return data;
}

export async function findGroupPredictionByUserAndGroup(userId, groupCode) {
  const { data, error } = await supabaseClient
    .from("group_predictions")
    .select("*")
    .eq("user_id", userId)
    .eq("group_code", groupCode)
    .maybeSingle();

  if (error) {
    console.error("Erro ao buscar palpite do grupo:", error);
    return null;
  }

  return data;
}

export async function upsertGroupPrediction({ userId, groupCode, positions }) {
  const { data, error } = await supabaseClient
    .from("group_predictions")
    .upsert(
      {
        user_id: userId,
        group_code: groupCode,
        positions,
        updated_at: new Date().toISOString()
      },
      {
        onConflict: "user_id,group_code"
      }
    )
    .select()
    .single();

  if (error) {
    console.error("Erro ao salvar palpite do grupo:", error);
    throw new Error("Não foi possível salvar o palpite do grupo.");
  }

  return data;
}

export async function countGroupPredictionsByUserId(userId) {
  const { count, error } = await supabaseClient
    .from("group_predictions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) {
    console.error("Erro ao contar palpites dos grupos:", error);
    return 0;
  }

  return count || 0;
}