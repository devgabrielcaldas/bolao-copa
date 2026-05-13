import { login, redirectIfAuthenticated } from "../services/auth-service.js";
import { getTheme, saveTheme } from "../utils/storage-utils.js";

const loginForm = document.querySelector("#loginForm");
const loginError = document.querySelector("#loginError");
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

function handleLogin(event) {
  event.preventDefault();

  const formData = new FormData(loginForm);

  const username = formData.get("username");
  const password = formData.get("password");

  const result = login(username, password);

  if (!result.success) {
    loginError.classList.add("is-visible");
    return;
  }

  loginError.classList.remove("is-visible");

  window.location.href = "./dashboard.html";
}

function initLoginPage() {
  applySavedTheme();
  redirectIfAuthenticated();

  loginForm.addEventListener("submit", handleLogin);
  themeToggle.addEventListener("click", toggleTheme);
}

initLoginPage();