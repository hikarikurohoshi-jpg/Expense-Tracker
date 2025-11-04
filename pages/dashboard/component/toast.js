class Toast {
  constructor({ position = "top-right" } = {}) {
    this.toastContainer = document.createElement("div");
    this.toastContainer.className = `toast-container ${position}`;
    document.body.appendChild(this.toastContainer);
  }
  injectStyle() {
    // Prevent duplicate <style> injection
    if (document.getElementById("toast-style")) return;

    const style = document.createElement("style");
    style.id = "toast-style";
    style.textContent = `
      .toast-container {
        position: fixed;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .toast-container.top-right {
        top: 20px;
        right: 20px;
      }
      .toast-container.top-left {
        top: 20px;
        left: 20px;
      }
      .toast-container.bottom-right {
        bottom: 20px;
        right: 20px;
      }
      .toast-container.bottom-left {
        bottom: 20px;
        left: 20px;
      }

      .card {
        width: 330px;
        height: 80px;
        border-radius: 8px;
        box-sizing: border-box;
        padding: 10px 15px;
        background-color: #ffffff;
        box-shadow: rgba(149, 157, 165, 0.2) 0px 8px 24px;
        position: relative;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: space-around;
        gap: 15px;
        animation: fadeInUp 0.35s ease;
      }

      .wave {
        position: absolute;
        transform: rotate(90deg);
        left: -31px;
        top: 32px;
        width: 80px;
        fill: #04e4003a;
      }

      .icon-container {
        width: 35px;
        height: 35px;
        display: flex;
        justify-content: center;
        align-items: center;
        background-color: #04e40048;
        border-radius: 50%;
        margin-left: 8px;
      }

      .icon {
        width: 17px;
        height: 17px;
        color: #269b24;
      }

      .message-text-container {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: flex-start;
        flex-grow: 1;
      }

      .message-text,
      .sub-text {
        margin: 0;
        cursor: default;
      }

      .message-text {
        color: #269b24;
        font-size: 17px;
        font-weight: 700;
      }

      .sub-text {
        font-size: 14px;
        color: #555;
      }

      .cross-icon {
        width: 18px;
        height: 18px;
        color: #555;
        cursor: pointer;
      }

      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(15px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `;
    document.head.appendChild(style);
  }
  show({ message = "Success message", subText = "Everything seems great" }) {
    this.injectStyle();

    const toast = document.createElement("div");
    toast.className = "card";
    toast.innerHTML = `
      <svg class="wave" viewBox="0 0 1440 320"></svg>

      <div class="icon-container">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" stroke-width="0" fill="currentColor" stroke="currentColor" class="icon">
          <path d="M256 48a208 208 0 1 1 0 416 208 208 0 1 1 0-416zm0 464A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM369 209c9.4-9.4 9.4-24.6 0-33.9s-24.6-9.4-33.9 0l-111 111-47-47c-9.4-9.4-24.6-9.4-33.9 0s-9.4 24.6 0 33.9l64 64c9.4 9.4 24.6 9.4 33.9 0L369 209z"></path>
        </svg>
      </div>
      <div class="message-text-container">
        <p class="message-text">${message}</p>
        <p class="sub-text">${subText}</p>
      </div>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15 15" fill="none" stroke="currentColor" class="cross-icon">
        <path fill="currentColor" d="M11.78..."></path>
      </svg>
    `;

    const closeBtn = toast.querySelector(".cross-icon");
    closeBtn.onclick = () => toast.remove();

    this.toastContainer.appendChild(toast);

    setTimeout(() => toast.remove(), 4000);
  }
}

export default Toast;
