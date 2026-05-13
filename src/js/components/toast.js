const TOAST_CONTAINER_ID = "toastContainer";

function getToastConfig(type) {
  const configs = {
    success: {
      icon: "✅",
      title: "Sucesso"
    },
    error: {
      icon: "❌",
      title: "Erro"
    },
    warning: {
      icon: "⚠️",
      title: "Atenção"
    },
    info: {
      icon: "ℹ️",
      title: "Informação"
    }
  };

  return configs[type] || configs.info;
}

function getOrCreateToastContainer() {
  let container = document.querySelector(`#${TOAST_CONTAINER_ID}`);

  if (container) {
    return container;
  }

  container = document.createElement("div");
  container.id = TOAST_CONTAINER_ID;
  container.className = "toast-container";

  document.body.appendChild(container);

  return container;
}

function removeToast(toastElement) {
  toastElement.classList.add("is-leaving");

  setTimeout(() => {
    toastElement.remove();
  }, 200);
}

export function showToast(message, type = "info", duration = 3200) {
  const container = getOrCreateToastContainer();
  const config = getToastConfig(type);

  const toastElement = document.createElement("div");

  toastElement.className = `toast toast--${type}`;

  toastElement.innerHTML = `
    <div class="toast__icon">
      ${config.icon}
    </div>

    <div class="toast__content">
      <strong class="toast__title">${config.title}</strong>
      <p class="toast__message">${message}</p>
    </div>

    <button class="toast__close" type="button" aria-label="Fechar mensagem">
      ×
    </button>
  `;

  const closeButton = toastElement.querySelector(".toast__close");

  closeButton.addEventListener("click", () => {
    removeToast(toastElement);
  });

  container.appendChild(toastElement);

  setTimeout(() => {
    removeToast(toastElement);
  }, duration);
}