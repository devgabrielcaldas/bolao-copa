import {
  logout,
  requireAuth
} from "../services/auth-service.js";

import { getTheme, saveTheme } from "../utils/storage-utils.js";
import { matchesMock } from "../data/matches.mock.js";

import {
  getPredictionsByUser,
  savePrediction
} from "../services/prediction-service.js";

import {
  formatMatchDate,
  canEditPrediction
} from "../utils/date-utils.js";

import { showToast } from "../components/toast.js";

const logoutButton = document.querySelector("#logoutButton");
const themeToggle = document.querySelector("#themeToggle");
const matchesList = document.querySelector("#matchesList");
const totalMatches = document.querySelector("#totalMatches");
const totalPredictions = document.querySelector("#totalPredictions");
const totalLocked = document.querySelector("#totalLocked");

const groupFilterButtons = document.querySelectorAll("[data-group]");
const roundFilterButtons = document.querySelectorAll("[data-round]");

let currentUser = null;
let currentGroupFilter = "all";
let currentRoundFilter = "all";
let userPredictions = [];

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

function isMatchReadyForPrediction(match) {
  return Boolean(match.homeTeam && match.awayTeam);
}

function getPredictionByMatchId(matchId) {
  return userPredictions.find((prediction) => {
    return Number(prediction.matchId) === Number(matchId);
  });
}

function getFilteredMatches() {
  return matchesMock.filter((match) => {
    const matchesGroup =
      currentGroupFilter === "all" || match.group === currentGroupFilter;

    const matchesRound =
      currentRoundFilter === "all" || String(match.round) === currentRoundFilter;

    return matchesGroup && matchesRound;
  });
}

async function loadUserPredictions() {
  userPredictions = await getPredictionsByUser(currentUser.id);
}

function renderSummary() {
  const lockedMatchesCount = matchesMock.filter((match) => {
    return !canEditPrediction(match.startsAt);
  }).length;

  totalMatches.textContent = matchesMock.length;
  totalPredictions.textContent = userPredictions.length;
  totalLocked.textContent = lockedMatchesCount;
}

function createMatchCard(match) {
  const prediction = getPredictionByMatchId(match.id);

  const canEdit = canEditPrediction(match.startsAt);
  const matchReady = isMatchReadyForPrediction(match);
  const isLocked = !canEdit || !matchReady;

  const homeValue = prediction?.homeScore ?? "";
  const awayValue = prediction?.awayScore ?? "";

  const lockedReason = !matchReady
    ? "Times ainda não definidos"
    : "Palpite bloqueado pelo horário";

  return `
    <article class="card match-card ${isLocked ? "match-card--locked" : ""}" data-match-id="${match.id}">
      <div class="match-card__top">
        <div>
          <span class="match-card__phase">
            ${match.group} · ${match.round}ª rodada
          </span>
          <p class="match-card__date">${formatMatchDate(match.startsAt)}</p>
        </div>

        <p class="match-card__status">
          ${isLocked ? lockedReason : "Aberto para palpite"}
        </p>
      </div>

      <div class="match-card__teams">
        <div class="match-card__team">
          <strong>${getTeamName(match, "home")}</strong>
          <span>${match.group || "Mata-mata"}</span>
        </div>

        <div class="match-card__versus">x</div>

        <div class="match-card__team">
          <strong>${getTeamName(match, "away")}</strong>
          <span>${match.group || "Mata-mata"}</span>
        </div>
      </div>

      <form class="match-card__form" data-match-form="${match.id}">
        <div>
          <p class="match-card__status">Seu palpite</p>
        </div>

        <div class="match-card__score-inputs">
          <input
            type="number"
            min="0"
            max="99"
            name="homeScore"
            value="${homeValue}"
            ${isLocked ? "disabled" : ""}
            required
          >

          <span>x</span>

          <input
            type="number"
            min="0"
            max="99"
            name="awayScore"
            value="${awayValue}"
            ${isLocked ? "disabled" : ""}
            required
          >
        </div>

        <button class="button button--primary" type="submit" ${isLocked ? "disabled" : ""}>
          Salvar palpite
        </button>
      </form>
    </article>
  `;
}

function renderMatches() {
  const filteredMatches = getFilteredMatches();

  if (filteredMatches.length === 0) {
    matchesList.innerHTML = `
      <div class="card empty-state">
        <span>⚽</span>
        <h3>Nenhum jogo encontrado</h3>
        <p>Altere os filtros para visualizar outros jogos da Copa.</p>
      </div>
    `;

    return;
  }

  matchesList.innerHTML = filteredMatches.map(createMatchCard).join("");

  attachPredictionFormEvents();
}

function attachPredictionFormEvents() {
  const forms = document.querySelectorAll("[data-match-form]");

  forms.forEach((form) => {
    form.addEventListener("submit", handleSavePrediction);
  });
}

async function handleSavePrediction(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const matchId = Number(form.dataset.matchForm);
  const match = matchesMock.find((item) => item.id === matchId);

  if (!match) {
    showToast("Jogo não encontrado.", "error");
    return;
  }

  if (!canEditPrediction(match.startsAt)) {
    showToast("O prazo para esse palpite já encerrou.", "warning");
    renderMatches();
    return;
  }

  if (!isMatchReadyForPrediction(match)) {
    showToast("Esse jogo ainda não possui os dois times definidos.", "warning");
    return;
  }

  const formData = new FormData(form);

  const homeScore = Number(formData.get("homeScore"));
  const awayScore = Number(formData.get("awayScore"));

  try {
    await savePrediction({
      userId: currentUser.id,
      matchId,
      homeScore,
      awayScore
    });

    await loadUserPredictions();

    renderSummary();
    renderMatches();

    showToast("Palpite salvo com sucesso!", "success");
  } catch (error) {
    console.error(error);
    showToast("Não foi possível salvar o palpite.", "error");
  }
}

function handleGroupFilterClick(event) {
  const selectedButton = event.currentTarget;

  groupFilterButtons.forEach((button) => {
    button.classList.remove("is-active");
  });

  selectedButton.classList.add("is-active");

  currentGroupFilter = selectedButton.dataset.group;

  renderMatches();
}

function handleRoundFilterClick(event) {
  const selectedButton = event.currentTarget;

  roundFilterButtons.forEach((button) => {
    button.classList.remove("is-active");
  });

  selectedButton.classList.add("is-active");

  currentRoundFilter = selectedButton.dataset.round;

  renderMatches();
}

async function initPredictionsPage() {
  applySavedTheme();

  currentUser = requireAuth();

  if (!currentUser) {
    return;
  }

  matchesList.innerHTML = `
    <div class="card empty-state">
      <span>⏳</span>
      <h3>Carregando jogos</h3>
      <p>Buscando seus palpites...</p>
    </div>
  `;

  await loadUserPredictions();

  renderSummary();
  renderMatches();

  logoutButton.addEventListener("click", logout);
  themeToggle.addEventListener("click", toggleTheme);

  groupFilterButtons.forEach((button) => {
    button.addEventListener("click", handleGroupFilterClick);
  });

  roundFilterButtons.forEach((button) => {
    button.addEventListener("click", handleRoundFilterClick);
  });
}

initPredictionsPage();