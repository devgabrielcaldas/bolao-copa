import {
  logout,
  requireAuth
} from "../services/auth-service.js";

import { getTheme, saveTheme } from "../utils/storage-utils.js";
import { teamsMock } from "../data/teams.mock.js";
import { playersMock } from "../data/players.mock.js";

import {
  getSpecialPredictionByUser,
  saveSpecialPrediction
} from "../services/special-prediction-service.js";

import { formatMatchDate } from "../utils/date-utils.js";
import { showToast } from "../components/toast.js";

const SPECIAL_PREDICTIONS_LOCK_AT = "2026-06-11T15:59:00";

const logoutButton = document.querySelector("#logoutButton");
const themeToggle = document.querySelector("#themeToggle");
const form = document.querySelector("#specialPredictionForm");
const championSelect = document.querySelector("#champion");
const runnerUpSelect = document.querySelector("#runnerUp");
const topScorerSelect = document.querySelector("#topScorer");
const saveButton = document.querySelector("#saveSpecialButton");
const statusBadge = document.querySelector("#statusBadge");
const lockInfo = document.querySelector("#lockInfo");

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

function canEditSpecialPredictions() {
  const now = new Date();
  const lockDate = new Date(SPECIAL_PREDICTIONS_LOCK_AT);

  return now < lockDate;
}

function createTeamOptions(selectedTeam) {
  return teamsMock.map((team) => {
    const isSelected = team === selectedTeam ? "selected" : "";

    return `
      <option value="${team}" ${isSelected}>
        ${team}
      </option>
    `;
  }).join("");
}

function createPlayerOptions(selectedPlayerId) {
  return playersMock.map((player) => {
    const isSelected = Number(selectedPlayerId) === player.id ? "selected" : "";

    return `
      <option value="${player.id}" ${isSelected}>
        ${player.name} - ${player.team}
      </option>
    `;
  }).join("");
}

async function renderForm() {
  const prediction = await getSpecialPredictionByUser(currentUser.id);

  championSelect.innerHTML = createTeamOptions(prediction?.champion);
  runnerUpSelect.innerHTML = createTeamOptions(prediction?.runnerUp);
  topScorerSelect.innerHTML = createPlayerOptions(prediction?.topScorerId);

  const canEdit = canEditSpecialPredictions();

  championSelect.disabled = !canEdit;
  runnerUpSelect.disabled = !canEdit;
  topScorerSelect.disabled = !canEdit;
  saveButton.disabled = !canEdit;

  statusBadge.textContent = canEdit ? "Aberto" : "Bloqueado";
  statusBadge.classList.toggle("special-card__badge--locked", !canEdit);

  lockInfo.textContent = `Esses palpites bloqueiam em ${formatMatchDate(SPECIAL_PREDICTIONS_LOCK_AT)}.`;
}

async function handleSaveSpecialPrediction(event) {
  event.preventDefault();

  if (!canEditSpecialPredictions()) {
    showToast("O prazo para os palpites especiais já encerrou.", "warning");
    await renderForm();
    return;
  }

  const champion = championSelect.value;
  const runnerUp = runnerUpSelect.value;
  const topScorerId = Number(topScorerSelect.value);

  if (champion === runnerUp) {
    showToast("O campeão e o vice-campeão não podem ser a mesma seleção.", "warning");
    return;
  }

  const selectedPlayer = playersMock.find((player) => {
    return player.id === topScorerId;
  });

  if (!selectedPlayer) {
    showToast("Artilheiro não encontrado.", "error");
    return;
  }

  try {
    await saveSpecialPrediction({
      userId: currentUser.id,
      champion,
      runnerUp,
      topScorerId,
      topScorerName: selectedPlayer.name,
      topScorerTeam: selectedPlayer.team
    });

    await renderForm();

    showToast("Palpites especiais salvos com sucesso no Supabase!", "success");
  } catch (error) {
    console.error(error);
    showToast("Não foi possível salvar os palpites especiais.", "error");
  }
}

async function initSpecialPredictionsPage() {
  applySavedTheme();

  currentUser = requireAuth();

  if (!currentUser) {
    return;
  }

  await renderForm();

  logoutButton.addEventListener("click", logout);
  themeToggle.addEventListener("click", toggleTheme);
  form.addEventListener("submit", handleSaveSpecialPrediction);
}

initSpecialPredictionsPage();