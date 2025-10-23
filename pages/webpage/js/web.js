document.addEventListener("DOMContentLoaded", () => {
  const navbar = document.getElementById("main-nav");
  const hamburger = document.getElementById("hamburger");
  const navLinks = document.getElementById("nav-links");

  if (window.lucide) lucide.createIcons();

  if (!navbar || !hamburger || !navLinks) return;

  // === Toggle mobile menu + black background transition ===
  hamburger.addEventListener("click", () => {
    const isActive = navbar.classList.toggle("active");
    navLinks.classList.toggle("show", isActive);
    hamburger.classList.toggle("active", isActive);
  });

  // === Close menu when clicking any nav link ===
  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navbar.classList.remove("active");
      navLinks.classList.remove("show");
      hamburger.classList.remove("active");
    });
  });

  // === Scroll background effect ===
  window.addEventListener("scroll", () => {
    if (window.scrollY > 30) navbar.classList.add("scrolled");
    else navbar.classList.remove("scrolled");
  });

  // === Resize behavior ===
  let resizeTimeout;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      const width = window.innerWidth;

      // When resizing from mobile → desktop (769px+)
      if (width >= 769 && navbar.classList.contains("active")) {
        // Trigger smooth closing transition
        navLinks.style.opacity = "0";
        navLinks.style.transition = "opacity 0.3s ease";

        setTimeout(() => {
          navbar.classList.remove("active");
          navLinks.classList.remove("show");
          hamburger.classList.remove("active");

          // Reset inline styles
          navLinks.style.opacity = "";
          navLinks.style.transition = "";
        }, 300);
      }
    }, 150); // debounce resize event
  });
});

window.addEventListener("load", () => {
  const intro = document.querySelector(".intro-screen");
  const main = document.querySelector(".main-content");
  const navbar = document.querySelector(".navbar");
  const lastPillar = document.querySelector(".pillar.p4");
  const heroText = document.querySelector(".hero-text");
  const subtextBox = document.querySelector(".subtext-box");
  const ctaBox = document.querySelector(".cta-box");
  const creditCard = document.querySelector(".credit-card-model");
  const flipCard = document.querySelector(".flip-card"); // 🟩 shadow container

  // Step 1: Show intro first
  setTimeout(() => {
    intro.classList.add("fade-out");

    // Step 2: Wait for intro pillars to finish
    lastPillar.addEventListener(
      "animationend",
      () => {
        intro.style.display = "none"; // hide intro completely
        main.classList.remove("hidden");
        main.classList.add("fade-in");

        // 🟩 Step 3: Animate credit card FIRST
        if (creditCard) {
          creditCard.classList.add("fade-in-up");

          // 🟩 Step 4: Wait for credit card animation to finish
          creditCard.addEventListener(
            "animationend",
            () => {
              // ✅ Fade in the shadow AFTER credit card animation
              if (flipCard) {
                flipCard.classList.add("show-shadow");
              }

              // ✅ Trigger navbar, hero text, subtext, and CTA together
              navbar.style.animation = "none";
              navbar.offsetHeight; // reflow to restart animation
              navbar.style.animation = "fadeDown 0.8s ease forwards";

              if (heroText) heroText.classList.add("fade-in-down");
              if (subtextBox) subtextBox.classList.add("fade-in-left");
              if (ctaBox) {
                ctaBox.style.opacity = "1";
                ctaBox.classList.add("fade-in-right");
              }
            },
            { once: true }
          );
        }
      },
      { once: true }
    );
  }, 1500);
});
