// ==================== Dashboard Loader ====================
async function loadDashboardData(userId) {
  try {
    const response = await fetch("./api/get_dashboard_data.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId }),
    });

    const result = await response.json();

    if (result.status === "success") {
      const data = result.data;

      // Update dashboard cards
      updateDashboardCards(data);

      // Populate recent transactions
      const tbody = document.getElementById("recent-transactions-body");
      if (tbody) {
        tbody.innerHTML = "";
        data.recent_transactions.forEach((tx) => {
          const row = `
            <tr>
              <td>${tx.date_spent}</td>
              <td>${tx.category}</td>
              <td>₱${parseFloat(tx.amount).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}</td>
              <td>${tx.note || ""}</td>
            </tr>
          `;
          tbody.insertAdjacentHTML("beforeend", row);
        });
      }

      // Render chart
      const canvas = document.getElementById("expenseChart");
      if (canvas) {
        const ctx = canvas.getContext("2d");
        const labels = data.chart_data.map((item) => item.month).reverse();
        const values = data.chart_data.map((item) => item.total).reverse();

        new Chart(ctx, {
          type: "line",
          data: {
            labels,
            datasets: [
              {
                label: "Monthly Expenses",
                data: values,
                borderWidth: 2,
                fill: false,
                tension: 0.3,
              },
            ],
          },
          options: { scales: { y: { beginAtZero: true } } },
        });
      }
    }
  } catch (error) {}
}

// ==================== Parse amount utility ====================
function parseAmount(str) {
  if (!str) return 0;
  return Number(str.toString().replace(/,/g, "")) || 0;
}

// ==================== Dashboard Cards ====================
function updateDashboardCards(data) {
  const base = parseAmount(data.base_balance);
  const income = parseAmount(data.total_income);
  const expenses = parseAmount(data.total_expenses);
  const currentBalance = parseAmount(data.current_balance);

  const ids = [
    ["dashboard-current-balance", currentBalance],
    ["total-expenses", expenses],
    ["total-income", income],
  ];

  ids.forEach(([id, value]) => {
    const el = document.getElementById(id);
    if (el) {
      el.textContent = `₱${value.toLocaleString("en-PH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    }
  });
}

// ==================== Balance Overview Cards ====================
function updateBalanceOverviewCards(data) {
  const baseBalance = parseAmount(data.base_balance || data.current_balance);
  const expenses = parseAmount(data.total_expenses);
  const income = parseAmount(data.total_income);

  const mapping = [
    ["balance-overview-current-balance", baseBalance],
    ["expenses", expenses],
    ["income", income],
  ];

  mapping.forEach(([id, value]) => {
    const el = document.getElementById(id);
    if (el) {
      el.textContent = `₱${value.toLocaleString("en-PH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    }
  });
}

// ==================== Load Balance Overview ====================
async function loadBalanceOverview(userId) {
  try {
    const res = await fetch("./api/get_balance_data.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId }),
    });
    const data = await res.json();

    if (data.status === "success") {
      updateBalanceOverviewCards(data);
    }
  } catch (err) {}
}

// ==================== Add Transaction ====================
function initTransactionForms(userId) {
  const expenseForm = document.getElementById("expense-form");
  if (expenseForm) {
    expenseForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const payload = {
        user_id: userId,
        type: "expense",
        category:
          document.getElementById("expense-category").value.trim() || "Expense",
        amount: parseFloat(document.getElementById("amount").value),
        note: document.getElementById("note").value,
        date: document.getElementById("date").value,
      };
      await submitTransaction(payload, expenseForm, userId);
    });
  }

  const incomeForm = document.getElementById("income-form");
  if (incomeForm) {
    incomeForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const payload = {
        user_id: userId,
        type: "income",
        category: document.getElementById("income-source").value || "Income",
        amount: parseFloat(document.getElementById("income-amount").value),
        note: document.getElementById("income-note").value,
        date: document.getElementById("income-date").value,
      };
      await submitTransaction(payload, incomeForm, userId);
    });
  }
}

async function submitTransaction(payload, form, userId) {
  try {
    const res = await fetch("./api/add_transaction.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await res.json();

    if (result.status === "success") {
      alert("✅ Transaction added successfully!");
      form.reset();
      loadDashboardData(userId);
      loadBalanceOverview(userId);
      if (typeof loadTransactionHistory === "function")
        loadTransactionHistory(userId);
    } else {
      alert("⚠️ " + result.message);
    }
  } catch (err) {
    alert("❌ Failed to add transaction. Check console for details.");
  }
}

// ==================== Update Balance Form ====================
const balanceForm = document.getElementById("balance-form");
if (balanceForm) {
  balanceForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const amount = parseFloat(document.getElementById("new-balance").value);
    if (isNaN(amount)) return alert("Enter a valid balance");

    const userId = localStorage.getItem("fynix_user_id");
    try {
      const res = await fetch("./api/update_balance.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, user_id: userId }),
      });
      const result = await res.json();

      if (result.status === "success") {
        updateBalanceOverviewCards(result);
        const dashboardData = {
          base_balance: parseAmount(result.base_balance),
          total_income: parseAmount(result.total_income),
          total_expenses: parseAmount(result.total_expenses),
          current_balance: parseAmount(result.current_balance),
        };
        updateDashboardCards(dashboardData);
        balanceForm.reset();
        alert("✅ Balance updated successfully!");
      } else {
        alert("⚠️ " + result.message);
      }
    } catch (err) {
      alert("❌ Failed to update balance");
    }
  });
}

// ==================== Load Expense History ====================
async function loadTransactionHistory(userId, filters = {}) {
  try {
    const res = await fetch("./api/get_expense_history.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId,
        start_date: filters.startDate || null,
        end_date: filters.endDate || null,
        category: filters.category || null,
      }),
    });

    const result = await res.json();
    if (result.status !== "success") return;

    const expenses = result.data || result.expenses || [];
    const tbody = document.getElementById("expense-history-tbody");
    if (!tbody) return;
    tbody.innerHTML = "";

    expenses.forEach((item) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${item.date_spent || item.date}</td>
        <td>${item.category}</td>
        <td>₱${parseFloat(item.amount).toLocaleString("en-PH", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}</td>
        <td>${item.note || ""}</td>
        <td class="action-cell">
          <button class="action-btn edit edit-btn" data-id="${
            item.id
          }" title="Edit">Edit</button>
          <button class="action-btn delete delete-btn" data-id="${
            item.id
          }" title="Delete">Delete</button>
        </td>
      `;
      tbody.appendChild(row);
    });

    document
      .querySelectorAll(".edit-btn")
      .forEach((btn) =>
        btn.addEventListener("click", () =>
          openEditModal(btn.dataset.id, userId)
        )
      );

    document
      .querySelectorAll(".delete-btn")
      .forEach((btn) =>
        btn.addEventListener("click", () =>
          deleteTransaction(btn.dataset.id, userId)
        )
      );
  } catch (err) {
    console.error("Failed to load expense history:", err);
  }
}

// ==================== Delete Transaction ====================
async function deleteTransaction(id, userId) {
  if (!confirm("Are you sure you want to delete this transaction?")) return;

  try {
    const res = await fetch("./api/delete_transaction.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, user_id: userId }),
    });
    const result = await res.json();

    if (result.status === "success") {
      alert("🗑️ Transaction deleted successfully.");
      loadTransactionHistory(userId);
      loadDashboardData(userId);
      loadBalanceOverview(userId);
    } else {
      alert("⚠️ " + result.message);
    }
  } catch (err) {
    alert("❌ Delete failed.");
  }
}

// ==================== Edit Transaction ====================
function openEditModal(id, userId) {
  const row = document
    .querySelector(`.edit-btn[data-id='${id}']`)
    ?.closest("tr");
  if (!row) return;

  // Get existing row data
  const date = row.children[1].textContent.trim();
  const category = row.children[2].textContent.trim();
  const amount = parseFloat(row.children[3].textContent.replace(/[₱,]/g, ""));
  const note = row.children[4].textContent.trim();

  // Fill modal fields
  document.getElementById("edit-id").value = id;
  document.getElementById("edit-date").value = date;
  document.getElementById("edit-category").value = category;
  document.getElementById("edit-amount").value = amount;
  document.getElementById("edit-note").value = note;

  // Show modal
  // Show modal
  document.getElementById("edit-modal").classList.remove("hidden");
  document.getElementById("edit-modal").classList.add("show");

  // Handle form submission
  const form = document.getElementById("edit-form");
  form.onsubmit = async (e) => {
    e.preventDefault();
    const updated = {
      id,
      user_id: userId,
      date: document.getElementById("edit-date").value,
      category: document.getElementById("edit-category").value.trim(),
      amount: parseFloat(document.getElementById("edit-amount").value),
      note: document.getElementById("edit-note").value.trim(),
    };

    try {
      const res = await fetch("./api/update_transaction.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });

      const result = await res.json();

      if (result.status === "success") {
        alert("✅ Transaction updated successfully!");
        document.getElementById("edit-modal").classList.add("hidden");
        loadTransactionHistory(userId);
        loadDashboardData(userId);
        loadBalanceOverview(userId);
      } else {
        alert("⚠️ " + result.message);
      }
    } catch (err) {
      console.error("Failed to update transaction:", err);
      alert("❌ Update failed.");
    }
  };
}

// ==================== Close Modal ====================
document.getElementById("close-edit-modal").addEventListener("click", () => {
  const modal = document.getElementById("edit-modal");
  modal.classList.remove("show");
  modal.classList.add("hidden");
});

// ==================== Filter Button ====================
document.getElementById("filter-btn")?.addEventListener("click", () => {
  const userId = localStorage.getItem("fynix_user_id");
  if (!userId) return;

  const start = document.getElementById("filter-start").value;
  const end = document.getElementById("filter-end").value;
  const category = document.getElementById("filter-category").value;

  loadTransactionHistory(userId, {
    startDate: start,
    endDate: end,
    category: category,
  });
});

// ==================== Auto-load on DOM ====================
document.addEventListener("DOMContentLoaded", () => {
  const userId = localStorage.getItem("fynix_user_id");
  if (!userId) return;
  loadDashboardData(userId);
  loadBalanceOverview(userId);
  loadTransactionHistory(userId);
  initTransactionForms(userId);
});

window.loadDashboardData = loadDashboardData;
window.loadBalanceOverview = loadBalanceOverview;
