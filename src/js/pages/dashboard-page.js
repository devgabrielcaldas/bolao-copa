import { logout, requireAuth } from "../services/auth-service.js";
import { getTheme, saveTheme } from "../utils/storage-utils.js";

const welcomeTitle = document.querySelector("#welcomeTitle");
const userPoints = document.querySelector("#userPoints");
const logoutButton = document.querySelector("#logoutButton");
const themeToggle = document.querySelector("#themeToggle");

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

function renderUserInfo(user) {
  welcomeTitle.textContent = `Olá, ${user.name}!`;
  userPoints.textContent = user.points;
}

function initDashboardPage() {
  applySavedTheme();

  const currentUser = requireAuth();

  if (!currentUser) {
    return;
  }

  renderUserInfo(currentUser);

  logoutButton.addEventListener("click", logout);
  themeToggle.addEventListener("click", toggleTheme);
}

initDashboardPage();