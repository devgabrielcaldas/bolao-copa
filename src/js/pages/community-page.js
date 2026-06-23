import { logout, requireAuth } from "../services/auth-service.js";
import { getTheme, saveTheme } from "../utils/storage-utils.js";
import { matchesMock } from "../data/matches.mock.js";
import { formatMatchDate } from "../utils/date-utils.js";

import {
  getCommunityPredictions,
  getCommunityUsers,
  getPredictionsByMatch,
  getUserPredictionForMatch
} from "../services/community-service.js";

const logoutButton = document.querySelector("#logoutButton");
const themeToggle = document.querySelector("#themeToggle");
const communityList = document.querySelector("#communityList");

const groupFilterButtons = document.querySelectorAll("[data-group]");
const dateFilterButtons = document.querySelectorAll("[data-date]");
const statusFilterButtons = document.querySelectorAll("[data-status]");

let currentUser = null;
let communityPredictions = [];
let communityUsers = [];

let currentGroupFilter = "all";
let currentDateFilter = "all";
let currentStatusFilter = "all";

function createCommunityAvatarHtml(user) {
  if (user.avatarUrl) {
    return `
      <img
        class="community-avatar"
        src="${user.avatarUrl}"
        alt="Foto de ${user.name}"
        loading="lazy"
      >
    `;
  }

  return `
    <span class="community-avatar community-avatar--fallback">
      ${user.name.charAt(0).toUpperCase()}
    </span>
  `;
}

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

function hasMatchStarted(match) {
  const now = new Date();
  const matchDate = new Date(match.startsAt);

  return now >= matchDate;
}

function isMatchToday(match) {
  const today = new Date();
  const matchDate = new Date(match.startsAt);

  return (
    today.getFullYear() === matchDate.getFullYear() &&
    today.getMonth() === matchDate.getMonth() &&
    today.getDate() === matchDate.getDate()
  );
}

function getFilteredMatches() {
  return matchesMock.filter((match) => {
    const matchStarted = hasMatchStarted(match);

    const matchesGroup =
      currentGroupFilter === "all" || match.group === currentGroupFilter;

    const matchesDate =
      currentDateFilter === "all" ||
      (currentDateFilter === "today" && isMatchToday(match));

    const matchesStatus =
      currentStatusFilter === "all" ||
      (currentStatusFilter === "available" && matchStarted) ||
      (currentStatusFilter === "locked" && !matchStarted);

    return matchesGroup && matchesDate && matchesStatus;
  });
}

function createPredictionRow(user, matchPredictions) {
  const prediction = getUserPredictionForMatch(user.id, matchPredictions);

  const predictionScore = prediction
    ? `${prediction.homeScore} x ${prediction.awayScore}`
    : "Não palpitou";

  const scoreClass = prediction
    ? "community-prediction__score"
    : "community-prediction__score community-prediction__empty";

  return `
    <article class="community-prediction">
      <div class="community-prediction__user">
        ${createCommunityAvatarHtml(user)}

        <div>
          <strong>${user.name}</strong>
          <span>Participante</span>
        </div>
      </div>

      <strong class="${scoreClass}">
        ${predictionScore}
      </strong>
    </article>
  `;
}

function createCommunityMatchCard(match) {
  const matchStarted = hasMatchStarted(match);
  const matchPredictions = getPredictionsByMatch(match.id, communityPredictions);

  const predictionsHtml = communityUsers.map((user) => {
    return createPredictionRow(user, matchPredictions);
  }).join("");

  const statusText = matchStarted
    ? "Palpites liberados"
    : "Bloqueado até o jogo começar";

  return `
    <article
      class="card community-match ${matchStarted ? "" : "community-match--locked"}"
      data-community-match="${match.id}"
    >
      <button
        class="community-match__button"
        type="button"
        ${matchStarted ? "" : "disabled"}
        data-community-toggle="${match.id}"
      >
        <div class="community-match__top">
          <div>
            <span class="community-match__phase">
              ${match.group || "Mata-mata"} · ${match.round || ""}ª rodada
            </span>

            <p class="community-match__date">
              ${formatMatchDate(match.startsAt)}
            </p>
          </div>

          <strong class="community-match__status ${matchStarted ? "community-match__status--available" : ""}">
            ${matchStarted ? "👀 " : "🔒 "}${statusText}
          </strong>
        </div>

        <div class="community-match__teams">
          <div class="community-match__team">
            <strong>${getTeamName(match, "home")}</strong>
            <span>${match.group || "Mata-mata"}</span>
          </div>

          <div class="community-match__versus">x</div>

          <div class="community-match__team">
            <strong>${getTeamName(match, "away")}</strong>
            <span>${match.group || "Mata-mata"}</span>
          </div>
        </div>
      </button>

      <div class="community-predictions">
        ${predictionsHtml}
      </div>
    </article>
  `;
}

function renderCommunity() {
  const filteredMatches = getFilteredMatches();

  if (filteredMatches.length === 0) {
    communityList.innerHTML = `
      <div class="card empty-state">
        <span>⚽</span>
        <h3>Nenhum jogo encontrado</h3>
        <p>Altere os filtros para visualizar outros jogos.</p>
      </div>
    `;

    return;
  }

  communityList.innerHTML = filteredMatches.map(createCommunityMatchCard).join("");

  attachToggleEvents();
}

function attachToggleEvents() {
  const buttons = document.querySelectorAll("[data-community-toggle]");

  buttons.forEach((button) => {
    button.addEventListener("click", handleToggleMatch);
  });
}

function handleToggleMatch(event) {
  const matchId = event.currentTarget.dataset.communityToggle;
  const card = document.querySelector(`[data-community-match="${matchId}"]`);

  if (!card) {
    return;
  }

  card.classList.toggle("is-open");
}

function handleGroupFilterClick(event) {
  const selectedButton = event.currentTarget;

  groupFilterButtons.forEach((button) => {
    button.classList.remove("is-active");
  });

  selectedButton.classList.add("is-active");

  currentGroupFilter = selectedButton.dataset.group;

  renderCommunity();
}

function handleDateFilterClick(event) {
  const selectedButton = event.currentTarget;

  dateFilterButtons.forEach((button) => {
    button.classList.remove("is-active");
  });

  selectedButton.classList.add("is-active");

  currentDateFilter = selectedButton.dataset.date;

  renderCommunity();
}

function handleStatusFilterClick(event) {
  const selectedButton = event.currentTarget;

  statusFilterButtons.forEach((button) => {
    button.classList.remove("is-active");
  });

  selectedButton.classList.add("is-active");

  currentStatusFilter = selectedButton.dataset.status;

  renderCommunity();
}

async function loadCommunityData() {
  const [predictions] = await Promise.all([
    getCommunityPredictions()
  ]);

  communityPredictions = predictions;
  communityUsers = getCommunityUsers();
}

async function initCommunityPage() {
  applySavedTheme();

  currentUser = requireAuth();

  if (!currentUser) {
    return;
  }

  communityList.innerHTML = `
    <div class="card empty-state">
      <span>⏳</span>
      <h3>Carregando comunidade</h3>
      <p>Buscando os palpites no Supabase...</p>
    </div>
  `;

  await loadCommunityData();

  renderCommunity();

  logoutButton.addEventListener("click", logout);
  themeToggle.addEventListener("click", toggleTheme);

  groupFilterButtons.forEach((button) => {
    button.addEventListener("click", handleGroupFilterClick);
  });

  dateFilterButtons.forEach((button) => {
    button.addEventListener("click", handleDateFilterClick);
  });

  statusFilterButtons.forEach((button) => {
    button.addEventListener("click", handleStatusFilterClick);
  });
}

initCommunityPage();