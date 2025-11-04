// Prevents the browser from restoring the scroll position
if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

// Always scroll to the top/home on refresh
window.addEventListener("load", function () {
  window.scrollTo(0, 0);
  // Optional: Force immediate scroll top without animation
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
});

document.addEventListener("DOMContentLoaded", () => {
  const navbar = document.getElementById("main-nav");
  const hamburger = document.getElementById("hamburger");
  const navLinks = document.getElementById("nav-links");

  if (window.lucide) lucide.createIcons();
  if (!navbar || !hamburger || !navLinks) {
    console.warn("Missing navbar/hamburger/navLinks — aborting menu init");
    return;
  }

  // === Toggle mobile menu ===
  hamburger.addEventListener("click", () => {
    const isActive = navbar.classList.toggle("active");
    navLinks.classList.toggle("show", isActive);
    hamburger.classList.toggle("active", isActive);
    console.debug("hamburger click -> active:", isActive);
  });

  // === Close on nav click ===
  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navbar.classList.remove("active");
      navLinks.classList.remove("show");
      hamburger.classList.remove("active");
      console.debug("nav link clicked -> menu closed");
    });
  });

  // === Scroll background effect ===
  window.addEventListener("scroll", () => {
    navbar.classList.toggle("scrolled", window.scrollY > 30);
  });

  // === Resize cleanup ===
  let resizeTimeout;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      const width = window.innerWidth;
      if (width >= 769 && navbar.classList.contains("active")) {
        navLinks.style.opacity = "0";
        navLinks.style.transition = "opacity 0.3s ease";
        setTimeout(() => {
          navbar.classList.remove("active");
          navLinks.classList.remove("show");
          hamburger.classList.remove("active");
          navLinks.style.opacity = "";
          navLinks.style.transition = "";
        }, 300);
      }
      console.debug("window resized -> width:", width);
    }, 150);
  });
});

window.addEventListener("load", () => {
  console.info("window.load fired — starting intro sequence");
  const intro = document.querySelector(".intro-screen");
  const main = document.querySelector(".main-content");
  const navbar = document.querySelector(".navbar");
  const lastPillar = document.querySelector(".pillar.p4");
  const heroText = document.querySelector(".hero-text");
  const subtextBox = document.querySelector(".subtext-box");
  const ctaBox = document.querySelector(".cta-box");
  const creditCard = document.querySelector(".credit-card-model");
  const flipCard = document.querySelector(".card-shadow");

  function revealMainAndStart() {
    if (intro) {
      intro.style.display = "none";
      console.debug("intro hidden (display:none)");
    }

    if (main) {
      main.classList.remove("hidden");
      main.classList.add("fade-in");
      console.debug("main unhidden, fade-in applied");
    }

    if (creditCard) {
      console.debug("creditCard found — starting fade-in-up");
      creditCard.classList.add("fade-in-up");

      creditCard.addEventListener(
        "animationend",
        () => {
          console.debug("creditCard CSS fade-in-up finished");

          // 🔧 Clean all transform/animation interference
          creditCard.style.animation = "none";
          // creditCard.style.transform = "none";
          creditCard.style.transition = "none";
          creditCard.style.opacity = "1";

          creditCard.style.translate = "none";
          creditCard.style.rotate = "none";
          creditCard.style.scale = "none";
          console.debug("✅ creditCard CSS transform cleared for GSAP");

          if (flipCard) {
            flipCard.classList.add("show-shadow");
          }
          if (document.querySelector(".card-shadow")) {
            document.querySelector(".card-shadow").classList.add("show-shadow");
          }

          // Run other intro fades
          if (navbar) {
            navbar.style.animation = "none";
            void navbar.offsetHeight;
            navbar.style.animation = "fadeDown 0.8s ease forwards";
          }
          if (heroText) heroText.classList.add("fade-in-down");
          if (subtextBox) subtextBox.classList.add("fade-in-left");
          if (ctaBox) {
            ctaBox.style.opacity = "1";
            ctaBox.classList.add("fade-in-right");
          }

          console.info(
            "Intro animations done — starting ScrollTrigger setup in 800ms"
          );
          setTimeout(() => setupScrollAnimations(), 800);
        },
        { once: true }
      );
    } else {
      console.warn("creditCard missing — starting ScrollTrigger immediately");
      setupScrollAnimations();
    }
  }

  // Start intro fade
  setTimeout(() => {
    if (intro) intro.classList.add("fade-out");
    if (!lastPillar) {
      console.warn("lastPillar missing, skipping animation wait");
      revealMainAndStart();
      return;
    }
    lastPillar.addEventListener("animationend", () => {
      console.debug("lastPillar animationend fired");
      revealMainAndStart();
    });
  }, 1500);
});

// ==========================
// SCROLLTRIGGER: Credit Card Scroll Movement
// ==========================
function setupScrollAnimations() {
  console.info("setupScrollAnimations called");

  if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
    console.error("GSAP/ScrollTrigger missing");
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  const creditCard = document.querySelector(".credit-card-model");
  const home = document.querySelector(".home");
  const about = document.querySelector(".about");

  if (!creditCard || !home || !about) {
    console.error("Missing section(s):", { creditCard, home, about });
    return;
  }

  // ✅ Reset position for GSAP
  gsap.set(creditCard, {
    position: "absolute",
    left: "50%",
    top: "370px", // or whatever vertical offset looks right
    xPercent: -50,
    yPercent: 0,
  });

  console.debug("Before tween:", {
    y: gsap.getProperty(creditCard, "y"),
    transform: getComputedStyle(creditCard).transform,
  });

  // === SCROLL ANIMATION ===
  const tween = gsap.to(creditCard, {
    y: 450, // pixels instead of vh
    rotate: -15,
    scale: 1.5,
    ease: "none",
    scrollTrigger: {
      trigger: home,
      start: "center center",
      endTrigger: about,
      end: "top top",
      scrub: true,
      markers: false,
      onEnter: () => console.log("ScrollTrigger → entered"),
      onLeave: () => console.log("ScrollTrigger → left"),
      onEnterBack: () => console.log("ScrollTrigger → entered back"),
      onLeaveBack: () => console.log("ScrollTrigger → left back"),
      onUpdate: (self) => {
        console.debug(
          `Scroll progress: ${self.progress.toFixed(3)} | y=${gsap.getProperty(
            creditCard,
            "y"
          )}`
        );
      },
    },
  });

  console.info("ScrollTrigger tween created:", tween);
  ScrollTrigger.refresh();

  // Add extra debug to detect any transform overwrites
  setInterval(() => {
    const style = getComputedStyle(creditCard);
    if (style.transform.includes("matrix")) {
      console.debug("Live transform matrix:", style.transform);
    }
  }, 1000);
}

// ==========================
// CARD SHADOW HIDES WHEN SCROLLING DOWN
// AND REAPPEARS ONLY AT THE TOP
// ==========================
(function () {
  const shadow = document.querySelector(".card-shadow");
  if (!shadow) return console.warn("No .card-shadow element found!");

  shadow.style.opacity = "00";
  shadow.style.transition = "opacity 0.4s ease";

  console.log("✅ Card shadow script initialized.");

  window.addEventListener("scroll", () => {
    const scrollY = window.scrollY || window.pageYOffset;
    console.log("Scroll position:", scrollY);

    if (scrollY > 20) {
      if (shadow.style.opacity !== "0") {
        console.log("🕶️ Hiding shadow...");
        // Remove possible animation classes that reapply shadow
        shadow.classList.remove("show-shadow");
        // Force opacity with !important behavior
        shadow.style.setProperty("opacity", "0", "important");
      }
    } else {
      if (shadow.style.opacity !== "0.85") {
        console.log("💡 Showing shadow...");
        shadow.style.setProperty("opacity", "0.85", "important");
      }
    }
  });
})();

//optional: add a scroll entrance animation in the about page and team page
// also in the scroll fade out animation in every pages
