import { supabaseClient } from "../config/supabase-config.js";

export async function findAllSpecialPredictions() {
  const { data, error } = await supabaseClient
    .from("special_predictions")
    .select("*")
    .order("user_id", { ascending: true });

  if (error) {
    console.error("Erro ao buscar palpites especiais:", error);
    return [];
  }

  return data;
}

export async function findSpecialPredictionByUserId(userId) {
  const { data, error } = await supabaseClient
    .from("special_predictions")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Erro ao buscar palpite especial:", error);
    return null;
  }

  return data;
}

export async function upsertSpecialPrediction({
  userId,
  champion,
  runnerUp,
  topScorerId,
  topScorerName,
  topScorerTeam
}) {
  const { data, error } = await supabaseClient
    .from("special_predictions")
    .upsert(
      {
        user_id: userId,
        champion,
        runner_up: runnerUp,
        top_scorer_id: topScorerId,
        top_scorer_name: topScorerName,
        top_scorer_team: topScorerTeam,
        updated_at: new Date().toISOString()
      },
      {
        onConflict: "user_id"
      }
    )
    .select()
    .single();

  if (error) {
    console.error("Erro ao salvar palpite especial:", error);
    throw new Error("Não foi possível salvar os palpites especiais.");
  }

  return data;
}

export async function countSpecialPredictionsFromDatabase() {
  const { count, error } = await supabaseClient
    .from("special_predictions")
    .select("*", { count: "exact", head: true });

  if (error) {
    console.error("Erro ao contar palpites especiais:", error);
    return 0;
  }

  return count || 0;
}