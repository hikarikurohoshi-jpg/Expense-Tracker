// ==================== Firebase Initialization ====================
import { app } from "./auth.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

// ==================== Initialize Services ====================
const auth = getAuth(app);
const db = getFirestore(app); // 🔥 Firestore database instance

// After successful Firebase login

// ==================== Elements ====================
const userNameEl = document.getElementById("userName");
const userEmailEl = document.getElementById("userEmail");
const userAvatarEl = document.getElementById("userAvatar");
const logoutBtn = document.getElementById("logoutBtn");

// Dashboard UI elements (optional for your data)
const dashboardContainer = document.querySelector(".dashboard-container");
const logoutModal = document.getElementById("logoutModal");
const confirmLogoutBtn = document.getElementById("confirmLogout");
const cancelLogoutBtn = document.getElementById("cancelLogout");

// ==================== Auth State Listener ====================
onAuthStateChanged(auth, async (user) => {
  if (user) {
    const firebaseUid = user.uid;
    let userId = null;

    try {
      // 🔹 Get local user_id from backend
      const response = await fetch("./api/get_user_id.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firebase_uid: firebaseUid }),
      });

      const result = await response.json();
      if (result.status === "success") {
        userId = result.user_id;
        localStorage.setItem("fynix_user_id", userId);
        console.log("✅ User ID stored:", userId);
      } else {
        console.warn("⚠️ Could not get user_id:", result.message);
      }
    } catch (error) {
      console.error("🔥 Failed to fetch user_id:", error);
    }

    // ✅ Now that we have userId, set PHP session
    if (userId) {
      try {
        const sessionResponse = await fetch("./api/set_session.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: userId }),
        });
        const sessionResult = await sessionResponse.json();
        console.log("🧠 PHP Session Set:", sessionResult);
      } catch (error) {
        console.error("❌ Error setting PHP session:", error);
      }
    }

    // ✅ Only load dashboard after PHP session is ready
    if (userId && typeof window.loadDashboardData === "function") {
      window.loadDashboardData(userId);
    }

    // ✅ Update UI info
    userNameEl.textContent = user.displayName || "User";
    userEmailEl.textContent = user.email || "No email";
    userAvatarEl.src =
      user.photoURL ||
      createLetterAvatar(user.displayName?.[0]?.toUpperCase() || "U");

    await loadUserData(user.uid);
  } else {
    window.location.href = "/Expense-Tracker-FYNIX/pages/login/login.html";
  }
});

// ==================== Load User Data from Firestore ====================
async function loadUserData(uid) {
  try {
    const userDocRef = doc(db, "users", uid);
    const docSnap = await getDoc(userDocRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      console.log("✅ User data:", data);

      // Example: display balance, category count, etc.
      if (data.balance) {
        document.querySelector(
          "#balanceDisplay"
        ).textContent = `₱${data.balance.toLocaleString()}`;
      }
    } else {
      console.log("⚠️ No user document found, creating one...");
      await setDoc(userDocRef, {
        createdAt: new Date(),
        balance: 0,
        expenses: [],
      });
    }
  } catch (error) {
    console.error("🔥 Firestore error:", error);
  }
}

// ==================== Logout Modal Logic ====================
logoutBtn.addEventListener("click", () => {
  logoutModal.classList.add("active");
  dashboardContainer.classList.add("blur");

  // Highlight logout in sidebar
  document
    .querySelectorAll(".menu-item")
    .forEach((i) => i.classList.remove("active"));
  logoutBtn.classList.add("active");
});

cancelLogoutBtn.addEventListener("click", () => {
  logoutModal.classList.remove("active");
  dashboardContainer.classList.remove("blur");

  restoreLastActiveSidebarItem();
});

confirmLogoutBtn.addEventListener("click", async () => {
  try {
    await signOut(auth);
    window.location.href = "/Expense-Tracker-FYNIX/pages/login/login.html";
  } catch (error) {
    console.error("Logout error:", error);
    alert("Failed to log out. Please try again.");
  }
});

// ==================== Avatar Generator ====================
function createLetterAvatar(letter) {
  const size = 100;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  // Background circle
  ctx.fillStyle = "#000000";
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  ctx.fill();

  // Neon glow
  ctx.shadowColor = "#00bfff";
  ctx.shadowBlur = 25;

  // Letter
  ctx.font = "bold 50px GCEpicPro, sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(letter, size / 2, size / 2 + 5);

  return canvas.toDataURL("image/png");
}

// ==================== Restore Sidebar Active Item ====================
function restoreLastActiveSidebarItem() {
  const lastActive = localStorage.getItem("activeSidebar") || "dashboard";
  const item = document.querySelector(`[data-page="${lastActive}"]`);
  if (item) item.classList.add("active");
}

// ==================== Example Function: Load Expense Data ====================
export async function loadExpenses(uid) {
  try {
    const expenseRef = collection(db, "users", uid, "expenses");
    const snapshot = await getDocs(expenseRef);
    const expenses = [];
    snapshot.forEach((doc) => {
      expenses.push({ id: doc.id, ...doc.data() });
    });
    console.log("💰 Expenses loaded:", expenses);
    return expenses;
  } catch (error) {
    console.error("Error loading expenses:", error);
  }
}
