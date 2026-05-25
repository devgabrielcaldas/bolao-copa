import { supabaseClient } from "../config/supabase-config.js";

export async function findAllCommunityPredictions() {
  const { data, error } = await supabaseClient
    .from("predictions")
    .select("*")
    .order("match_id", { ascending: true });

  if (error) {
    console.error("Erro ao buscar palpites da comunidade:", error);
    return [];
  }

  return data;
}