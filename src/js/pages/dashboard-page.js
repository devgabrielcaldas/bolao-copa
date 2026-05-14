import { logout, requireAuth } from "../services/auth-service.js";
import { getTheme, saveTheme } from "../utils/storage-utils.js";
import { getRanking } from "../services/ranking-service.js";
import { matchesMock } from "../data/matches.mock.js";
import { formatMatchDate } from "../utils/date-utils.js";

const welcomeTitle = document.querySelector("#welcomeTitle");
const userPoints = document.querySelector("#userPoints");
const logoutButton = document.querySelector("#logoutButton");
const themeToggle = document.querySelector("#themeToggle");

const positionCard = document.querySelector(".stat-card:nth-child(1) strong");
const predictionsCard = document.querySelector(".stat-card:nth-child(2) strong");
const exactScoresCard = document.querySelector(".stat-card:nth-child(3) strong");

const nextMatchTitle = document.querySelector(".next-match h3");
const nextMatchInfo = document.querySelector(".next-match p");

let currentUser = null;

function applySavedTheme() {
  const savedTheme = getTheme();

  if (savedTheme === "dark") {
    document.body.classList.add("dark-theme");
  }
}

function toggleTheme() {
  document.body.classList.toggle("dark-theme");

  const isDarkTheme = document.body.classList.contains("dark-theme");

  saveTheme(isDarkTheme ? "dark" : "light");
}

function getTeamName(match, side) {
  if (side === "home") {
    return match.homeTeam || match.homePlaceholder || "A definir";
  }

  return match.awayTeam || match.awayPlaceholder || "A definir";
}

function getNextMatch() {
  const now = new Date();

  const futureMatches = matchesMock
    .filter((match) => {
      return new Date(match.startsAt) > now;
    })
    .sort((a, b) => {
      return new Date(a.startsAt) - new Date(b.startsAt);
    });

  return futureMatches[0] || matchesMock[0];
}

function renderLoadingState(user) {
  welcomeTitle.textContent = `Olá, ${user.name}!`;
  userPoints.textContent = "...";
  positionCard.textContent = "...";
  predictionsCard.textContent = "...";
  exactScoresCard.textContent = "...";
}

function renderNextMatch() {
  const nextMatch = getNextMatch();

  if (!nextMatch) {
    nextMatchTitle.textContent = "Nenhum jogo encontrado";
    nextMatchInfo.textContent = "A tabela de jogos ainda não foi cadastrada.";
    return;
  }

  const homeTeam = getTeamName(nextMatch, "home");
  const awayTeam = getTeamName(nextMatch, "away");

  nextMatchTitle.textContent = `${homeTeam} x ${awayTeam}`;
  nextMatchInfo.textContent = `${nextMatch.group || "Mata-mata"} · ${formatMatchDate(nextMatch.startsAt)}`;
}

async function renderDashboardData(user) {
  renderLoadingState(user);
  renderNextMatch();

  const ranking = await getRanking();

  const userRankingIndex = ranking.findIndex((participant) => {
    return Number(participant.id) === Number(user.id);
  });

  const userRankingData = ranking[userRankingIndex];

  if (!userRankingData) {
    userPoints.textContent = "0";
    positionCard.textContent = "-";
    predictionsCard.textContent = "0";
    exactScoresCard.textContent = "0";
    return;
  }

  userPoints.textContent = userRankingData.totalPoints;
  positionCard.textContent = `#${userRankingIndex + 1}`;
  predictionsCard.textContent = userRankingData.predictionsCount || 0;
  exactScoresCard.textContent = userRankingData.exactScores;
}

async function initDashboardPage() {
  applySavedTheme();

  currentUser = requireAuth();

  if (!currentUser) {
    return;
  }

  await renderDashboardData(currentUser);

  logoutButton.addEventListener("click", logout);
  themeToggle.addEventListener("click", toggleTheme);
}

initDashboardPage();