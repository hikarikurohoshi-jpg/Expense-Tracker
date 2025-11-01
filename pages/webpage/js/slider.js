// TEAM IMAGE CAROUSEL
const teamMembers = [
  {
    image: "assets/team_pic/jeyyem.png",
    nickname: "JEYYEMM",
    fullname: "Barlongo, John Mark C.",
  },
  {
    image: "assets/team_pic/kenneth.png",
    nickname: "NETH",
    fullname: "Alzona, John Kenneth M.",
  },
  {
    image: "assets/team_pic/merzie.png",
    nickname: "MERZIE",
    fullname: "Eulin, Merzielle Lorraine R.",
  },
  {
    image: "assets/team_pic/rhiane.png",
    nickname: "RHIANE",
    fullname: "R. Dela Cruz",
  },
];

let currentIndex = 0;

// Select elements
const imageElement = document.querySelector(".circle-image");
const nicknameElement = document.querySelector(".nickname");
const fullnameElement = document.querySelector(".fullname p");

// Buttons
const prevButton = document.querySelector(".button-left");
const nextButton = document.querySelector(".button-right");

// Function to update carousel
function updateCarousel(index) {
  const member = teamMembers[index];
  imageElement.style.opacity = 0;
  nicknameElement.style.opacity = 0;
  fullnameElement.style.opacity = 0;

  setTimeout(() => {
    imageElement.src = member.image;
    nicknameElement.textContent = member.nickname;
    fullnameElement.textContent = member.fullname;

    imageElement.style.opacity = 1;
    nicknameElement.style.opacity = 1;
    fullnameElement.style.opacity = 1;
  }, 250);
}

// Event Listeners
prevButton.addEventListener("click", () => {
  currentIndex = (currentIndex - 1 + teamMembers.length) % teamMembers.length;
  updateCarousel(currentIndex);
});

nextButton.addEventListener("click", () => {
  currentIndex = (currentIndex + 1) % teamMembers.length;
  updateCarousel(currentIndex);
});
