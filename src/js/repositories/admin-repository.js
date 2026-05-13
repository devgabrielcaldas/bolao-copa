import { supabaseClient } from "../config/supabase-config.js";

export async function findMatchResults() {
  const { data, error } = await supabaseClient
    .from("match_results")
    .select("*")
    .order("match_id", { ascending: true });

  if (error) {
    console.error("Erro ao buscar resultados dos jogos:", error);
    return [];
  }

  return data;
}

export async function findMatchResultByMatchId(matchId) {
  const { data, error } = await supabaseClient
    .from("match_results")
    .select("*")
    .eq("match_id", matchId)
    .maybeSingle();

  if (error) {
    console.error("Erro ao buscar resultado do jogo:", error);
    return null;
  }

  return data;
}

export async function upsertMatchResult({ matchId, homeScore, awayScore }) {
  const { data, error } = await supabaseClient
    .from("match_results")
    .upsert(
      {
        match_id: matchId,
        home_score: homeScore,
        away_score: awayScore,
        updated_at: new Date().toISOString()
      },
      {
        onConflict: "match_id"
      }
    )
    .select()
    .single();

  if (error) {
    console.error("Erro ao salvar resultado do jogo:", error);
    throw new Error("Não foi possível salvar o resultado do jogo.");
  }

  return data;
}

export async function findActualGroupStandings() {
  const { data, error } = await supabaseClient
    .from("actual_group_standings")
    .select("*")
    .order("group_code", { ascending: true });

  if (error) {
    console.error("Erro ao buscar classificação real dos grupos:", error);
    return [];
  }

  return data;
}

export async function findActualGroupStandingByGroup(groupCode) {
  const { data, error } = await supabaseClient
    .from("actual_group_standings")
    .select("*")
    .eq("group_code", groupCode)
    .maybeSingle();

  if (error) {
    console.error("Erro ao buscar classificação real do grupo:", error);
    return null;
  }

  return data;
}

export async function upsertActualGroupStanding({ groupCode, positions }) {
  const { data, error } = await supabaseClient
    .from("actual_group_standings")
    .upsert(
      {
        group_code: groupCode,
        positions,
        updated_at: new Date().toISOString()
      },
      {
        onConflict: "group_code"
      }
    )
    .select()
    .single();

  if (error) {
    console.error("Erro ao salvar classificação real do grupo:", error);
    throw new Error("Não foi possível salvar a classificação real do grupo.");
  }

  return data;
}

export async function findOfficialResult() {
  const { data, error } = await supabaseClient
    .from("official_results")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Erro ao buscar resultado oficial:", error);
    return null;
  }

  return data;
}

export async function upsertOfficialResult({
  champion,
  runnerUp,
  topScorerId,
  topScorerName,
  topScorerTeam
}) {
  const currentResult = await findOfficialResult();

  const payload = {
    champion,
    runner_up: runnerUp,
    top_scorer_id: topScorerId,
    top_scorer_name: topScorerName,
    top_scorer_team: topScorerTeam,
    updated_at: new Date().toISOString()
  };

  let query;

  if (currentResult?.id) {
    query = supabaseClient
      .from("official_results")
      .update(payload)
      .eq("id", currentResult.id)
      .select()
      .single();
  } else {
    query = supabaseClient
      .from("official_results")
      .insert(payload)
      .select()
      .single();
  }

  const { data, error } = await query;

  if (error) {
    console.error("Erro ao salvar resultado oficial:", error);
    throw new Error("Não foi possível salvar o resultado oficial.");
  }

  return data;
}