document.querySelector(".tablet-login").addEventListener("click", (e) => {
  e.preventDefault(); // stop the default # link
  window.location.href = "/pages/login/login.html"; // change this path to your target page
});

function goToSignup() {
  window.location.href = "pages/login/signup.html"; // Adjust the path if needed
}
