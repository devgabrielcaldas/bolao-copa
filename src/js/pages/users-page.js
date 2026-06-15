import { logout, requireAuth } from "../services/auth-service.js";
import { getTheme, saveTheme } from "../utils/storage-utils.js";
import { getUsersProfiles } from "../services/users-profile-service.js";
import { formatMatchDate } from "../utils/date-utils.js";

const logoutButton = document.querySelector("#logoutButton");
const themeToggle = document.querySelector("#themeToggle");
const usersList = document.querySelector("#usersList");

let currentUser = null;
let usersProfiles = [];

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

function createAvatarHtml(user) {
  if (user.avatarUrl) {
    return `
      <img
        class="users-avatar"
        src="${user.avatarUrl}"
        alt="Foto de ${user.name}"
        loading="lazy"
      >
    `;
  }

  return `
    <span class="users-avatar users-avatar--fallback">
      ${user.name.charAt(0).toUpperCase()}
    </span>
  `;
}

function getRoleLabel(role) {
  return role === "admin" ? "Administrador" : "Participante";
}

function createSpecialSection(profile) {
  if (!profile.specialPrediction) {
    return `
      <section class="users-profile-section">
        <h3>Especiais</h3>

        <p class="users-empty-text">
          Nenhuma aposta especial liberada para exibir.
        </p>
      </section>
    `;
  }

  return `
    <section class="users-profile-section">
      <h3>Especiais</h3>

      <div class="users-special-grid">
        <article>
          <span>🏆 Campeão</span>
          <strong>${profile.specialPrediction.champion || "Não palpitou"}</strong>
        </article>

        <article>
          <span>🥈 Vice</span>
          <strong>${profile.specialPrediction.runnerUp || "Não palpitou"}</strong>
        </article>

        <article>
          <span>⚽ Artilheiro</span>
          <strong>${profile.specialPrediction.topScorer || "Não palpitou"}</strong>
        </article>
      </div>
    </section>
  `;
}

function createGroupLine(groupPrediction) {
  if (!groupPrediction.prediction) {
    return `
      <article class="users-group-line">
        <strong>${groupPrediction.groupCode}</strong>
        <span>Não palpitou</span>
      </article>
    `;
  }

  const positions = groupPrediction.prediction.positions;

  return `
    <article class="users-group-line">
      <strong>${groupPrediction.groupCode}</strong>

      <span>
        1º ${positions[0]} | 2º ${positions[1]} | 3º ${positions[2]} | 4º ${positions[3]}
      </span>
    </article>
  `;
}

function createGroupsSection(profile) {
  if (profile.groupPredictions.length === 0) {
    return `
      <section class="users-profile-section">
        <h3>Grupos bloqueados</h3>

        <p class="users-empty-text">
          Nenhum grupo bloqueado para exibir ainda.
        </p>
      </section>
    `;
  }

  return `
    <section class="users-profile-section">
      <h3>Grupos bloqueados</h3>

      <div class="users-groups-list">
        ${profile.groupPredictions.map(createGroupLine).join("")}
      </div>
    </section>
  `;
}

function createMatchLine(matchPrediction) {
  const matchLabel = `${matchPrediction.homeTeam} x ${matchPrediction.awayTeam}`;

  if (!matchPrediction.prediction) {
    return `
      <article class="users-match-line">
        <div>
          <strong>${matchLabel}</strong>
          <span>${matchPrediction.group || "Mata-mata"} · ${formatMatchDate(matchPrediction.startsAt)}</span>
        </div>

        <strong class="users-match-line__empty">
          Não palpitou
        </strong>
      </article>
    `;
  }

  return `
    <article class="users-match-line">
      <div>
        <strong>${matchLabel}</strong>
        <span>${matchPrediction.group || "Mata-mata"} · ${formatMatchDate(matchPrediction.startsAt)}</span>
      </div>

      <strong class="users-match-line__score">
        ${matchPrediction.prediction.homeScore} x ${matchPrediction.prediction.awayScore}
      </strong>
    </article>
  `;
}

function createMatchesSection(profile) {
  if (profile.matchPredictions.length === 0) {
    return `
      <section class="users-profile-section">
        <h3>Jogos iniciados</h3>

        <p class="users-empty-text">
          Nenhum jogo iniciado para exibir ainda.
        </p>
      </section>
    `;
  }

  return `
    <section class="users-profile-section">
      <h3>Jogos iniciados</h3>

      <div class="users-matches-list">
        ${profile.matchPredictions.map(createMatchLine).join("")}
      </div>
    </section>
  `;
}

function createUserCard(profile) {
  return `
    <article class="card users-card" data-user-card="${profile.id}">
      <button class="users-card__summary" type="button" data-user-toggle="${profile.id}">
        <div class="users-card__person">
          ${createAvatarHtml(profile)}

          <div>
            <strong>${profile.name}</strong>
            <span>${getRoleLabel(profile.role)}</span>
          </div>
        </div>

        <div class="users-card__stats">
          <span>${profile.summary.matchesCount} jogos</span>
          <span>${profile.summary.groupsCount} grupos</span>
          <span>${profile.summary.hasSpecialPrediction ? "Especiais liberados" : "Sem especiais"}</span>
        </div>

        <span class="users-card__chevron">⌄</span>
      </button>

      <div class="users-card__details">
        ${createSpecialSection(profile)}
        ${createGroupsSection(profile)}
        ${createMatchesSection(profile)}
      </div>
    </article>
  `;
}

function renderUsersProfiles() {
  if (usersProfiles.length === 0) {
    usersList.innerHTML = `
      <div class="card users-empty-state">
        <span>👥</span>
        <h3>Nenhum usuário encontrado</h3>
        <p>Não encontramos participantes para exibir.</p>
      </div>
    `;

    return;
  }

  usersList.innerHTML = usersProfiles.map(createUserCard).join("");

  attachToggleEvents();
}

function attachToggleEvents() {
  const buttons = document.querySelectorAll("[data-user-toggle]");

  buttons.forEach((button) => {
    button.addEventListener("click", handleToggleUserCard);
  });
}

function handleToggleUserCard(event) {
  const userId = event.currentTarget.dataset.userToggle;
  const card = document.querySelector(`[data-user-card="${userId}"]`);

  if (!card) {
    return;
  }

  card.classList.toggle("is-open");
}

async function initUsersPage() {
  applySavedTheme();

  currentUser = requireAuth();

  if (!currentUser) {
    return;
  }

  usersList.innerHTML = `
    <div class="card users-empty-state">
      <span>⏳</span>
      <h3>Carregando usuários</h3>
      <p>Buscando palpites liberados no Supabase...</p>
    </div>
  `;

  usersProfiles = await getUsersProfiles();

  renderUsersProfiles();

  logoutButton.addEventListener("click", logout);
  themeToggle.addEventListener("click", toggleTheme);
}

initUsersPage();