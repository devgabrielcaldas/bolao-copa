import { usersMock } from "../data/users.mock.js";
import {
  saveCurrentUser,
  getCurrentUser,
  removeCurrentUser
} from "../utils/storage-utils.js";

export function login(username, password) {
  const normalizedUsername = username.trim().toLowerCase();

  const userFound = usersMock.find((user) => {
    return (
      user.username.toLowerCase() === normalizedUsername &&
      user.password === password
    );
  });

  if (!userFound) {
    return {
      success: false,
      user: null,
      message: "Usuário ou senha inválidos."
    };
  }

  const userToSave = {
    id: userFound.id,
    name: userFound.name,
    username: userFound.username,
    role: userFound.role,
    points: userFound.points
  };

  saveCurrentUser(userToSave);

  return {
    success: true,
    user: userToSave,
    message: "Login realizado com sucesso."
  };
}

export function logout() {
  removeCurrentUser();
  window.location.href = "./index.html";
}

export function requireAuth() {
  const currentUser = getCurrentUser();

  if (!currentUser) {
    window.location.href = "./index.html";
    return null;
  }

  return currentUser;
}

export function redirectIfAuthenticated() {
  const currentUser = getCurrentUser();

  if (currentUser) {
    window.location.href = "./dashboard.html";
  }
}