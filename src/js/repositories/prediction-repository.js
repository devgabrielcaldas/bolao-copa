import { supabaseClient } from "../config/supabase-config.js";

export async function findAllPredictions() {
  const { data, error } = await supabaseClient
    .from("predictions")
    .select("*")
    .order("match_id", { ascending: true });

  if (error) {
    console.error("Erro ao buscar palpites:", error);
    return [];
  }

  return data;
}

export async function findPredictionByUserAndMatch(userId, matchId) {
  const { data, error } = await supabaseClient
    .from("predictions")
    .select("*")
    .eq("user_id", userId)
    .eq("match_id", matchId)
    .maybeSingle();

  if (error) {
    console.error("Erro ao buscar palpite:", error);
    return null;
  }

  return data;
}

export async function upsertPrediction({ userId, matchId, homeScore, awayScore }) {
  const { data, error } = await supabaseClient
    .from("predictions")
    .upsert(
      {
        user_id: userId,
        match_id: matchId,
        home_score: homeScore,
        away_score: awayScore,
        updated_at: new Date().toISOString()
      },
      {
        onConflict: "user_id,match_id"
      }
    )
    .select()
    .single();

  if (error) {
    console.error("Erro ao salvar palpite:", error);
    throw new Error("Não foi possível salvar o palpite.");
  }

  return data;
}

export async function countPredictionsByUserId(userId) {
  const { count, error } = await supabaseClient
    .from("predictions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) {
    console.error("Erro ao contar palpites:", error);
    return 0;
  }

  return count || 0;
}