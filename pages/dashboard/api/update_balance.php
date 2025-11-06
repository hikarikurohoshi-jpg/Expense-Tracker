<?php
session_start();
header("Content-Type: application/json");
require_once realpath(__DIR__ . '/../../../db/config/config.php');

$data = json_decode(file_get_contents("php://input"), true);
$user_id = $_SESSION['user_id'] ?? null;
$new_balance = $data['amount'] ?? null;

if (!$user_id) {
  echo json_encode(["status" => "error", "message" => "User not logged in"]);
  exit;
}

if ($new_balance === null || !is_numeric($new_balance)) {
  echo json_encode(["status" => "error", "message" => "Invalid balance amount"]);
  exit;
}

try {
  // Update or insert balance
  $stmt = $pdo->prepare("SELECT id FROM balances WHERE user_id = ?");
  $stmt->execute([$user_id]);
  $balance_id = $stmt->fetchColumn();

  if ($balance_id) {
    $stmt = $pdo->prepare("UPDATE balances SET amount = ?, set_at = NOW() WHERE user_id = ?");
    $stmt->execute([$new_balance, $user_id]);
  } else {
    $stmt = $pdo->prepare("INSERT INTO balances (user_id, amount) VALUES (?, ?)");
    $stmt->execute([$user_id, $new_balance]);
  }

  // 1️⃣ Total Expenses
  $stmt = $pdo->prepare("
        SELECT COALESCE(SUM(t.amount), 0) AS total_expenses
        FROM transactions t
        JOIN categories c ON t.category_id = c.id
        WHERE t.user_id = ? AND c.type = 'expense'
    ");
  $stmt->execute([$user_id]);
  $totalExpenses = (float)$stmt->fetchColumn();

  // 2️⃣ Total Income
  $stmt = $pdo->prepare("
        SELECT COALESCE(SUM(t.amount), 0) AS total_income
        FROM transactions t
        JOIN categories c ON t.category_id = c.id
        WHERE t.user_id = ? AND c.type = 'income'
    ");
  $stmt->execute([$user_id]);
  $totalIncome = (float)$stmt->fetchColumn();

  // 3️⃣ Base Wallet
  $stmt = $pdo->prepare("SELECT COALESCE(amount, 0) FROM balances WHERE user_id = ?");
  $stmt->execute([$user_id]);
  $baseBalance = (float)$stmt->fetchColumn();

  // 4️⃣ Current balance includes income
  $currentBalance = $baseBalance + $totalIncome - $totalExpenses;

  // After calculating $baseBalance
  echo json_encode([
    "status" => "success",
    "message" => "Balance updated successfully",
    "base_balance" => $baseBalance,       // raw balance for balance overview
    "current_balance" => $currentBalance, // balance + income - expenses for dashboard
    "total_expenses" => $totalExpenses,
    "total_income" => $totalIncome
  ]);
} catch (Exception $e) {
  echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
