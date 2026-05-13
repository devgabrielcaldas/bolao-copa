const STORAGE_KEYS = {
  CURRENT_USER: "bolao_copa_current_user",
  THEME: "bolao_copa_theme"
};

export function saveCurrentUser(user) {
  localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
}

export function getCurrentUser() {
  const storedUser = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);

  if (!storedUser) {
    return null;
  }

  return JSON.parse(storedUser);
}

export function removeCurrentUser() {
  localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
}

export function saveTheme(theme) {
  localStorage.setItem(STORAGE_KEYS.THEME, theme);
}

export function getTheme() {
  return localStorage.getItem(STORAGE_KEYS.THEME) || "light";
}