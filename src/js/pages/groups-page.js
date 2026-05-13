import {
  logout,
  requireAuth
} from "../services/auth-service.js";

import { getTheme, saveTheme } from "../utils/storage-utils.js";
import { groupsMock } from "../data/groups.mock.js";

import {
  getGroupPredictionByUserAndGroup,
  saveGroupPrediction,
  countGroupPredictionsByUser
} from "../services/group-prediction-service.js";

import { formatMatchDate } from "../utils/date-utils.js";
import { showToast } from "../components/toast.js";

const logoutButton = document.querySelector("#logoutButton");
const themeToggle = document.querySelector("#themeToggle");
const groupsList = document.querySelector("#groupsList");
const totalGroups = document.querySelector("#totalGroups");
const totalGroupPredictions = document.querySelector("#totalGroupPredictions");

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

function canEditGroupPrediction(lockAt) {
  const now = new Date();
  const lockDate = new Date(lockAt);

  return now < lockDate;
}

async function renderSummary() {
  totalGroups.textContent = groupsMock.length;
  totalGroupPredictions.textContent = await countGroupPredictionsByUser(
    currentUser.id
  );
}

function createTeamOptions(group, selectedTeam) {
  return group.teams.map((team) => {
    const isSelected = team === selectedTeam ? "selected" : "";

    return `
      <option value="${team}" ${isSelected}>
        ${team}
      </option>
    `;
  }).join("");
}

async function createGroupCard(group) {
  const prediction = await getGroupPredictionByUserAndGroup(
    currentUser.id,
    group.code
  );

  const canEdit = canEditGroupPrediction(group.lockAt);
  const isLocked = !canEdit;

  const positions = prediction?.positions || [
    group.teams[0],
    group.teams[1],
    group.teams[2],
    group.teams[3]
  ];

  return `
    <article class="card group-card ${isLocked ? "group-card--locked" : ""}">
      <div class="group-card__header">
        <div class="group-card__title">
          <h2>${group.code}</h2>
          <p>Bloqueia em ${formatMatchDate(group.lockAt)}</p>
        </div>

        <span class="group-card__badge ${isLocked ? "group-card__badge--locked" : ""}">
          ${isLocked ? "Bloqueado" : "Aberto"}
        </span>
      </div>

      <form class="group-form" data-group-form="${group.code}">
        <label class="group-position">
          <span class="group-position__number">1º</span>
          <select name="first" ${isLocked ? "disabled" : ""}>
            ${createTeamOptions(group, positions[0])}
          </select>
        </label>

        <label class="group-position">
          <span class="group-position__number">2º</span>
          <select name="second" ${isLocked ? "disabled" : ""}>
            ${createTeamOptions(group, positions[1])}
          </select>
        </label>

        <label class="group-position">
          <span class="group-position__number">3º</span>
          <select name="third" ${isLocked ? "disabled" : ""}>
            ${createTeamOptions(group, positions[2])}
          </select>
        </label>

        <label class="group-position">
          <span class="group-position__number">4º</span>
          <select name="fourth" ${isLocked ? "disabled" : ""}>
            ${createTeamOptions(group, positions[3])}
          </select>
        </label>

        <div class="group-card__footer">
          <p class="group-card__status">
            ${prediction ? "Palpite salvo no Supabase" : "Ainda não salvo"}
          </p>

          <button class="button button--primary" type="submit" ${isLocked ? "disabled" : ""}>
            Salvar grupo
          </button>
        </div>
      </form>
    </article>
  `;
}

async function renderGroups() {
  groupsList.innerHTML = `
    <div class="card empty-state">
      <span>⏳</span>
      <h3>Carregando grupos</h3>
      <p>Buscando seus palpites no Supabase...</p>
    </div>
  `;

  const cards = await Promise.all(
    groupsMock.map((group) => createGroupCard(group))
  );

  groupsList.innerHTML = cards.join("");

  attachGroupFormEvents();
}

function attachGroupFormEvents() {
  const forms = document.querySelectorAll("[data-group-form]");

  forms.forEach((form) => {
    form.addEventListener("submit", handleSaveGroupPrediction);
  });
}

function hasRepeatedTeams(positions) {
  return new Set(positions).size !== positions.length;
}

async function handleSaveGroupPrediction(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const groupCode = form.dataset.groupForm;

  const group = groupsMock.find((item) => item.code === groupCode);

  if (!group) {
    showToast("Grupo não encontrado.", "error");
    return;
  }

  if (!canEditGroupPrediction(group.lockAt)) {
    showToast("O prazo para esse grupo já encerrou.", "warning");
    await renderGroups();
    return;
  }

  const formData = new FormData(form);

  const positions = [
    formData.get("first"),
    formData.get("second"),
    formData.get("third"),
    formData.get("fourth")
  ];

  if (hasRepeatedTeams(positions)) {
    showToast(
      "Você não pode repetir a mesma seleção em mais de uma posição.",
      "warning"
    );
    return;
  }

  try {
    await saveGroupPrediction({
      userId: currentUser.id,
      groupCode,
      positions
    });

    await renderSummary();
    await renderGroups();

    showToast("Palpite do grupo salvo com sucesso no Supabase!", "success");
  } catch (error) {
    console.error(error);
    showToast("Não foi possível salvar o palpite do grupo.", "error");
  }
}

async function initGroupsPage() {
  applySavedTheme();

  currentUser = requireAuth();

  if (!currentUser) {
    return;
  }

  await renderSummary();
  await renderGroups();

  logoutButton.addEventListener("click", logout);
  themeToggle.addEventListener("click", toggleTheme);
}

initGroupsPage();