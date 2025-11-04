import {
  getAuth,
  createUserWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import { app } from "../js/auth.js";

const auth = getAuth(app);
const signupBtn = document.getElementById("signupBtn");
const googleSignupBtn = document.getElementById("googleSignupBtn");

// Error hint elements
const nameError = document.getElementById("name-error");
const emailError = document.getElementById("email-error");
const passwordError = document.getElementById("password-error");

// Initialize Lucide icons once (after DOM ready)
document.addEventListener("DOMContentLoaded", () => lucide.createIcons());

// ============== Manual Signup ==============
signupBtn.addEventListener("click", async () => {
  clearErrors();

  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!name || !email || !password) {
    if (!name) showError(nameError, "Please enter your full name.");
    if (!email) showError(emailError, "Please enter your email.");
    if (!password) showError(passwordError, "Please enter your password.");
    return;
  }

  try {
    const userCred = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    await updateProfile(userCred.user, { displayName: name });

    const payload = {
      uid: userCred.user.uid,
      email: userCred.user.email,
      name,
    };

    console.log("Sending signup data:", payload);

    await fetch("./api/save_user.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    // ✅ Show toast safely (no Lucide collision)
    const { default: Toast } = await import("../component/toast.js");
    const toast = new Toast({ position: "bottom-right" });
    toast.show({
      message: "Account Created!",
      subText: "Redirecting to login in 3 seconds...",
    });

    localStorage.setItem(
      "toastMessage",
      JSON.stringify({
        message: "Account Created Successfully!",
        subText: `Hi ${name}, you can now log in.`,
      })
    );

    setTimeout(() => {
      window.location.href = "login.html";
    }, 3000);
  } catch (err) {
    handleFirebaseError(err);
  }
});

function handleFirebaseError(err) {
  switch (err.code) {
    case "auth/email-already-in-use":
      showError(
        emailError,
        "This email is already in use. Try logging in instead."
      );
      break;
    case "auth/invalid-email":
      showError(emailError, "Please enter a valid email address.");
      break;
    case "auth/weak-password":
      showError(
        passwordError,
        "Password should be at least 6 characters long."
      );
      break;
    default:
      alert(err.message);
  }
}

function showError(element, message) {
  element.textContent = message;
  element.classList.add("visible");
}

function clearErrors() {
  [nameError, emailError, passwordError].forEach((el) => {
    el.textContent = "";
    el.classList.remove("visible");
  });
}

// ============== Google Signup ==============
googleSignupBtn.addEventListener("click", async () => {
  try {
    const provider = new GoogleAuthProvider();
    const userCred = await signInWithPopup(auth, provider);
    const user = userCred.user;

    const payload = {
      uid: user.uid,
      email: user.email,
      name: user.displayName || "",
      profile_photo: user.photoURL || "",
    };

    console.log("Sending Google signup data:", payload);

    const response = await fetch("./api/save_user.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (data.status !== "ok") throw new Error(data.error || "Server error");

    localStorage.setItem(
      "toastMessage",
      JSON.stringify({
        message: "Welcome!",
        subText: "Signed up successfully with Google.",
      })
    );

    const { default: Toast } = await import("../component/toast.js");
    const toast = new Toast({ position: "bottom-right" });
    toast.show({
      message: "Account Created!",
      subText: "Redirecting to Dashboard...",
    });

    setTimeout(() => {
      window.location.href = "/pages/dashboard/";
    }, 2000);
  } catch (err) {
    console.error("Google signup error:", err);
    alert(err.message);
  }
});

// ============== Password Toggle ==============
document.addEventListener("click", (e) => {
  const toggle = e.target.closest(".toggle-password");
  if (!toggle) return;

  const pwd = document.getElementById("password");
  const show = pwd.type === "password";
  pwd.type = show ? "text" : "password";

  toggle.setAttribute("data-lucide", show ? "eye" : "eye-off");
  lucide.createIcons(); // Recreate only for that toggle, not globally
});
