import { logout, requireAuth } from "../services/auth-service.js";
import { getTheme, saveTheme } from "../utils/storage-utils.js";
import { getRanking } from "../services/ranking-service.js";
import { getAllPredictions } from "../services/prediction-service.js";

const welcomeTitle = document.querySelector("#welcomeTitle");
const userPoints = document.querySelector("#userPoints");
const logoutButton = document.querySelector("#logoutButton");
const themeToggle = document.querySelector("#themeToggle");

const positionCard = document.querySelector(".stat-card:nth-child(1) strong");
const predictionsCard = document.querySelector(".stat-card:nth-child(2) strong");
const exactScoresCard = document.querySelector(".stat-card:nth-child(3) strong");

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

async function getUserPredictionsCount(userId) {
  const predictions = await getAllPredictions();

  return predictions.filter((prediction) => {
    return Number(prediction.userId) === Number(userId);
  }).length;
}

async function renderDashboardData(user) {
  welcomeTitle.textContent = `Olá, ${user.name}!`;

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

  const predictionsCount = await getUserPredictionsCount(user.id);

  userPoints.textContent = userRankingData.totalPoints;
  positionCard.textContent = `#${userRankingIndex + 1}`;
  predictionsCard.textContent = predictionsCount;
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