// Initialize Lucide Icons
lucide.createIcons();

// Sidebar navigation logic (Single Page)
document.querySelectorAll(".menu-item").forEach((item) => {
  item.addEventListener("click", () => {
    // Handle logout separately
    if (item.id === "logoutBtn") return;

    // Update active class
    document
      .querySelectorAll(".menu-item")
      .forEach((i) => i.classList.remove("active"));
    item.classList.add("active");

    // Get target section ID
    const target = item.dataset.item;

    // Hide all content sections
    document.querySelectorAll(".content-section").forEach((section) => {
      section.classList.remove("active");
    });

    // Show the clicked section
    const activeSection = document.getElementById(target);
    if (activeSection) {
      activeSection.classList.add("active");
    } else {
      console.error(`Section not found: ${target}`);
    }

    console.log(`Navigated to: ${target}`);
  });
});

// Optional: Keep dashboard active on load
window.addEventListener("DOMContentLoaded", () => {
  const activeItem = document.querySelector(".menu-item.active");
  const defaultSection = activeItem ? activeItem.dataset.item : "dashboard";
  document.getElementById(defaultSection)?.classList.add("active");
});
