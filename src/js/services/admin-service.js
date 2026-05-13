import {
  findMatchResults,
  findMatchResultByMatchId,
  upsertMatchResult,
  findActualGroupStandings,
  findActualGroupStandingByGroup,
  upsertActualGroupStanding,
  findOfficialResult,
  upsertOfficialResult
} from "../repositories/admin-repository.js";

function normalizeMatchResult(result) {
  return {
    id: result.id,
    matchId: result.match_id,
    homeScore: result.home_score,
    awayScore: result.away_score,
    createdAt: result.created_at,
    updatedAt: result.updated_at
  };
}

function normalizeGroupStanding(standing) {
  return {
    id: standing.id,
    groupCode: standing.group_code,
    positions: standing.positions,
    createdAt: standing.created_at,
    updatedAt: standing.updated_at
  };
}

function normalizeOfficialResult(result) {
  return {
    id: result.id,
    champion: result.champion,
    runnerUp: result.runner_up,
    topScorerId: result.top_scorer_id,
    topScorerName: result.top_scorer_name,
    topScorerTeam: result.top_scorer_team,
    createdAt: result.created_at,
    updatedAt: result.updated_at
  };
}

export async function getMatchResults() {
  const results = await findMatchResults();

  return results.map(normalizeMatchResult);
}

export async function getMatchResultByMatchId(matchId) {
  const result = await findMatchResultByMatchId(matchId);

  if (!result) {
    return null;
  }

  return normalizeMatchResult(result);
}

export async function saveMatchResult({ matchId, homeScore, awayScore }) {
  const result = await upsertMatchResult({
    matchId,
    homeScore,
    awayScore
  });

  return normalizeMatchResult(result);
}

export async function getMatchesWithResults(matches) {
  const results = await getMatchResults();

  return matches.map((match) => {
    const result = results.find((item) => item.matchId === match.id);

    if (!result) {
      return match;
    }

    return {
      ...match,
      homeScore: result.homeScore,
      awayScore: result.awayScore,
      status: "finished"
    };
  });
}

export async function getActualGroupStandings() {
  const standings = await findActualGroupStandings();

  return standings.map(normalizeGroupStanding);
}

export async function getActualGroupStandingByGroup(groupCode) {
  const standing = await findActualGroupStandingByGroup(groupCode);

  if (!standing) {
    return null;
  }

  return normalizeGroupStanding(standing);
}

export async function saveActualGroupStanding({ groupCode, positions }) {
  const standing = await upsertActualGroupStanding({
    groupCode,
    positions
  });

  return normalizeGroupStanding(standing);
}

export async function getOfficialResult() {
  const result = await findOfficialResult();

  if (!result) {
    return null;
  }

  return normalizeOfficialResult(result);
}

export async function saveOfficialResult({
  champion,
  runnerUp,
  topScorerId,
  topScorerName,
  topScorerTeam
}) {
  const result = await upsertOfficialResult({
    champion,
    runnerUp,
    topScorerId,
    topScorerName,
    topScorerTeam
  });

  return normalizeOfficialResult(result);
}