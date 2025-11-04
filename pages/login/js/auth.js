// ============== Firebase Setup ==============
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyB5L_lC4YjKyefv89DCCVgKgrFUzPBzhvo",
  authDomain: "fynix-4b66e.firebaseapp.com",
  projectId: "fynix-4b66e",
  storageBucket: "fynix-4b66e.firebasestorage.app",
  messagingSenderId: "782183039457",
  appId: "1:782183039457:web:3defe1d3c3fd0f2b4352a0",
};

const app = initializeApp(firebaseConfig);
export { app };

window.goToweb = function () {
  // For localhost (XAMPP)
  window.location.href = "/Expense-Tracker-FYNIX/index.html";

  // OR for GitHub Pages:
  // window.location.href = "/Expense-Tracker-FYNIX/index.html";
};
