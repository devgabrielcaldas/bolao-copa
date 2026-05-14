import {
  logout,
  requireAuth
} from "../services/auth-service.js";

import { getTheme, saveTheme } from "../utils/storage-utils.js";
import { matchesMock } from "../data/matches.mock.js";
import { groupsMock } from "../data/groups.mock.js";
import { teamsMock } from "../data/teams.mock.js";
import { playersMock } from "../data/players.mock.js";

import {
  getMatchResults,
  saveMatchResult,
  getActualGroupStandings,
  saveActualGroupStanding,
  getOfficialResult,
  saveOfficialResult
} from "../services/admin-service.js";

import { formatMatchDate } from "../utils/date-utils.js";
import { showToast } from "../components/toast.js";

const logoutButton = document.querySelector("#logoutButton");
const themeToggle = document.querySelector("#themeToggle");

const adminBlockedMessage = document.querySelector("#adminBlockedMessage");
const adminContent = document.querySelector("#adminContent");

const totalMatches = document.querySelector("#totalMatches");
const totalMatchResults = document.querySelector("#totalMatchResults");
const totalGroupStandings = document.querySelector("#totalGroupStandings");

const adminMatchesList = document.querySelector("#adminMatchesList");
const adminGroupsList = document.querySelector("#adminGroupsList");

const groupFilterButtons = document.querySelectorAll("[data-group]");

const officialResultForm = document.querySelector("#officialResultForm");
const officialChampionSelect = document.querySelector("#officialChampion");
const officialRunnerUpSelect = document.querySelector("#officialRunnerUp");
const officialTopScorerSelect = document.querySelector("#officialTopScorer");

let currentUser = null;
let currentGroupFilter = "all";

let matchResults = [];
let actualGroupStandings = [];
let officialResult = null;

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

function renderAccessControl() {
  const isAdmin = currentUser.role === "admin";

  adminBlockedMessage.classList.toggle("is-visible", !isAdmin);
  adminContent.classList.toggle("is-hidden", !isAdmin);

  return isAdmin;
}

async function loadAdminData() {
  const [
    loadedMatchResults,
    loadedGroupStandings,
    loadedOfficialResult
  ] = await Promise.all([
    getMatchResults(),
    getActualGroupStandings(),
    getOfficialResult()
  ]);

  matchResults = loadedMatchResults;
  actualGroupStandings = loadedGroupStandings;
  officialResult = loadedOfficialResult;
}

function renderSummary() {
  totalMatches.textContent = matchesMock.length;
  totalMatchResults.textContent = matchResults.length;
  totalGroupStandings.textContent = actualGroupStandings.length;
}

function getTeamName(match, side) {
  if (side === "home") {
    return match.homeTeam || match.homePlaceholder || "A definir";
  }

  return match.awayTeam || match.awayPlaceholder || "A definir";
}

function getFilteredMatches() {
  if (currentGroupFilter === "all") {
    return matchesMock;
  }

  return matchesMock.filter((match) => {
    return match.group === currentGroupFilter;
  });
}

function getMatchResultById(matchId) {
  return matchResults.find((result) => {
    return Number(result.matchId) === Number(matchId);
  });
}

function createAdminMatchCard(match) {
  const result = getMatchResultById(match.id);

  const homeScore = result?.homeScore ?? "";
  const awayScore = result?.awayScore ?? "";

  return `
    <article class="admin-match-card">
      <div class="admin-match-card__top">
        <div>
          <strong>${getTeamName(match, "home")} x ${getTeamName(match, "away")}</strong>
          <span>${match.group || "Mata-mata"} · ${formatMatchDate(match.startsAt)}</span>
        </div>

        <span>
          ${result ? "Resultado cadastrado" : "Sem resultado"}
        </span>
      </div>

      <form class="admin-match-form" data-match-result-form="${match.id}">
        <div class="admin-match-form__scores">
          <input
            type="number"
            min="0"
            max="99"
            name="homeScore"
            value="${homeScore}"
            required
          >

          <strong>x</strong>

          <input
            type="number"
            min="0"
            max="99"
            name="awayScore"
            value="${awayScore}"
            required
          >
        </div>

        <button type="submit" class="button button--primary">
          Salvar resultado
        </button>
      </form>
    </article>
  `;
}

function renderMatches() {
  const matches = getFilteredMatches();

  adminMatchesList.innerHTML = matches.map(createAdminMatchCard).join("");

  attachMatchResultEvents();
}

function attachMatchResultEvents() {
  const forms = document.querySelectorAll("[data-match-result-form]");

  forms.forEach((form) => {
    form.addEventListener("submit", handleSaveMatchResult);
  });
}

async function handleSaveMatchResult(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const matchId = Number(form.dataset.matchResultForm);

  const formData = new FormData(form);

  try {
    await saveMatchResult({
      matchId,
      homeScore: Number(formData.get("homeScore")),
      awayScore: Number(formData.get("awayScore"))
    });

    matchResults = await getMatchResults();

    renderSummary();
    renderMatches();

    showToast("Resultado do jogo salvo com sucesso!", "success");
  } catch (error) {
    console.error(error);
    showToast("Não foi possível salvar o resultado do jogo.", "error");
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

function getGroupStandingByCode(groupCode) {
  return actualGroupStandings.find((standing) => {
    return standing.groupCode === groupCode;
  });
}

function createAdminGroupCard(group) {
  const standing = getGroupStandingByCode(group.code);

  const positions = standing?.positions || [
    group.teams[0],
    group.teams[1],
    group.teams[2],
    group.teams[3]
  ];

  return `
    <article class="admin-group-card">
      <h3>${group.code}</h3>

      <form class="admin-group-form" data-group-standing-form="${group.code}">
        <label class="admin-group-position">
          <span>1º</span>
          <select name="first" required>
            ${createTeamOptions(group, positions[0])}
          </select>
        </label>

        <label class="admin-group-position">
          <span>2º</span>
          <select name="second" required>
            ${createTeamOptions(group, positions[1])}
          </select>
        </label>

        <label class="admin-group-position">
          <span>3º</span>
          <select name="third" required>
            ${createTeamOptions(group, positions[2])}
          </select>
        </label>

        <label class="admin-group-position">
          <span>4º</span>
          <select name="fourth" required>
            ${createTeamOptions(group, positions[3])}
          </select>
        </label>

        <button type="submit" class="button button--primary">
          Salvar classificação
        </button>
      </form>
    </article>
  `;
}

function renderGroups() {
  adminGroupsList.innerHTML = groupsMock.map(createAdminGroupCard).join("");

  attachGroupStandingEvents();
}

function attachGroupStandingEvents() {
  const forms = document.querySelectorAll("[data-group-standing-form]");

  forms.forEach((form) => {
    form.addEventListener("submit", handleSaveGroupStanding);
  });
}

function hasRepeatedTeams(positions) {
  return new Set(positions).size !== positions.length;
}

async function handleSaveGroupStanding(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const groupCode = form.dataset.groupStandingForm;

  const formData = new FormData(form);

  const positions = [
    formData.get("first"),
    formData.get("second"),
    formData.get("third"),
    formData.get("fourth")
  ];

  if (hasRepeatedTeams(positions)) {
    showToast("A classificação oficial não pode repetir seleções.", "warning");
    return;
  }

  try {
    await saveActualGroupStanding({
      groupCode,
      positions
    });

    actualGroupStandings = await getActualGroupStandings();

    renderSummary();
    renderGroups();

    showToast("Classificação oficial salva com sucesso!", "success");
  } catch (error) {
    console.error(error);
    showToast("Não foi possível salvar a classificação oficial.", "error");
  }
}

function createOfficialTeamOptions(selectedTeam) {
  return teamsMock.map((team) => {
    const isSelected = team === selectedTeam ? "selected" : "";

    return `
      <option value="${team}" ${isSelected}>
        ${team}
      </option>
    `;
  }).join("");
}

function createOfficialPlayerOptions(selectedPlayerId) {
  return playersMock.map((player) => {
    const isSelected = Number(selectedPlayerId) === player.id ? "selected" : "";

    return `
      <option value="${player.id}" ${isSelected}>
        ${player.name} - ${player.team}
      </option>
    `;
  }).join("");
}

function renderOfficialResultForm() {
  officialChampionSelect.innerHTML = createOfficialTeamOptions(
    officialResult?.champion
  );

  officialRunnerUpSelect.innerHTML = createOfficialTeamOptions(
    officialResult?.runnerUp
  );

  officialTopScorerSelect.innerHTML = createOfficialPlayerOptions(
    officialResult?.topScorerId
  );
}

async function handleSaveOfficialResult(event) {
  event.preventDefault();

  const champion = officialChampionSelect.value;
  const runnerUp = officialRunnerUpSelect.value;
  const topScorerId = Number(officialTopScorerSelect.value);

  if (champion === runnerUp) {
    showToast("Campeão e vice-campeão não podem ser a mesma seleção.", "warning");
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
    await saveOfficialResult({
      champion,
      runnerUp,
      topScorerId,
      topScorerName: selectedPlayer.name,
      topScorerTeam: selectedPlayer.team
    });

    officialResult = await getOfficialResult();

    renderOfficialResultForm();

    showToast("Resultado oficial da Copa salvo com sucesso!", "success");
  } catch (error) {
    console.error(error);
    showToast("Não foi possível salvar o resultado oficial.", "error");
  }
}

async function initAdminPage() {
  applySavedTheme();

  currentUser = requireAuth();

  if (!currentUser) {
    return;
  }

  const isAdmin = renderAccessControl();

  logoutButton.addEventListener("click", logout);
  themeToggle.addEventListener("click", toggleTheme);

  if (!isAdmin) {
    return;
  }

  adminMatchesList.innerHTML = `
    <div class="card empty-state">
      <span>⏳</span>
      <h3>Carregando jogos</h3>
      <p>Buscando dados do Supabase...</p>
    </div>
  `;

  adminGroupsList.innerHTML = `
    <div class="card empty-state">
      <span>⏳</span>
      <h3>Carregando grupos</h3>
      <p>Buscando classificações oficiais...</p>
    </div>
  `;

  await loadAdminData();

  renderSummary();
  renderMatches();
  renderGroups();
  renderOfficialResultForm();

  groupFilterButtons.forEach((button) => {
    button.addEventListener("click", handleGroupFilterClick);
  });

  officialResultForm.addEventListener("submit", handleSaveOfficialResult);
}

initAdminPage();