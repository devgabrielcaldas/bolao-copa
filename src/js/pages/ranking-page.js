import { logout, requireAuth } from "../services/auth-service.js";
import { getTheme, saveTheme } from "../utils/storage-utils.js";
import { getRanking } from "../services/ranking-service.js";

const logoutButton = document.querySelector("#logoutButton");
const themeToggle = document.querySelector("#themeToggle");
const podium = document.querySelector("#podium");
const rankingTableBody = document.querySelector("#rankingTableBody");

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

function getMedalByPosition(position) {
  const medals = {
    1: "🥇",
    2: "🥈",
    3: "🥉"
  };

  return medals[position] || position;
}

function getPodiumClass(position) {
  const classes = {
    1: "podium-card--first",
    2: "podium-card--second",
    3: "podium-card--third"
  };

  return classes[position] || "";
}

function renderPodium(ranking) {
  const topThree = ranking.slice(0, 3);

  podium.innerHTML = topThree.map((participant, index) => {
    const position = index + 1;

    return `
      <article class="card podium-card ${getPodiumClass(position)}">
        <div class="podium-card__position">
          ${getMedalByPosition(position)}
        </div>

        <h2 class="podium-card__name">
          ${participant.name}
        </h2>

        <div class="podium-card__points">
          ${participant.totalPoints}
          <span>pts</span>
        </div>

        <p class="podium-card__meta">
          ${participant.exactScores} placares exatos · ${participant.correctOutcomes} acertos simples
        </p>
      </article>
    `;
  }).join("");
}

function renderRankingTable(ranking) {
  rankingTableBody.innerHTML = ranking.map((participant, index) => {
    const position = index + 1;

    return `
      <tr>
        <td>
          <span class="ranking-table__position">
            ${position}
          </span>
        </td>

        <td>
          <div class="ranking-table__participant">
            <strong>${participant.name}</strong>
            <span>${participant.role === "admin" ? "Administrador" : "Participante"}</span>
          </div>
        </td>

        <td>
          <strong class="ranking-table__total">
            ${participant.totalPoints}
          </strong>
        </td>

        <td>${participant.matchPoints}</td>
        <td>${participant.exactScores}</td>
        <td>${participant.correctOutcomes}</td>
        <td>${participant.groupPoints}</td>
        <td>${participant.specialPoints}</td>
      </tr>
    `;
  }).join("");
}

async function initRankingPage() {
  applySavedTheme();

  currentUser = requireAuth();

  if (!currentUser) {
    return;
  }

  podium.innerHTML = `
    <article class="card podium-card podium-card--first">
      <div class="podium-card__position">⏳</div>
      <h2 class="podium-card__name">Carregando ranking</h2>
      <div class="podium-card__points">
        ...
        <span>pts</span>
      </div>
      <p class="podium-card__meta">
        Buscando dados no Supabase...
      </p>
    </article>
  `;

  rankingTableBody.innerHTML = `
    <tr>
      <td colspan="8">
        Carregando classificação...
      </td>
    </tr>
  `;

  const ranking = await getRanking();

  renderPodium(ranking);
  renderRankingTable(ranking);

  logoutButton.addEventListener("click", logout);
  themeToggle.addEventListener("click", toggleTheme);
}

initRankingPage();