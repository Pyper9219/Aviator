export function toast(message, type = 'info') {
  const colors = {
    info: 'bg-surface-container-high text-on-surface',
    success: 'bg-secondary-container text-on-secondary-container',
    error: 'bg-error-container text-error',
  };

  const el = document.createElement('div');
  el.className = `fixed top-20 left-1/2 -translate-x-1/2 z-[100] px-4 py-2 rounded-lg font-button-text ${colors[type]} shadow-xl`;
  el.textContent = message;
  el.style.transition = 'opacity 0.3s, transform 0.3s';
  document.body.appendChild(el);

  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translate(-50%, -10px)';
    setTimeout(() => el.remove(), 300);
  }, 2500);
}

window.toast = toast;