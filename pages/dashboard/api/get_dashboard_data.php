<?php
header('Content-Type: application/json; charset=utf-8');
ini_set('display_errors', 1);
error_reporting(E_ALL);

require_once __DIR__ . '/../../../db/config/config.php';

$data = json_decode(file_get_contents("php://input"), true);
if (!isset($data["user_id"])) {
  http_response_code(400);
  echo json_encode(["status" => "error", "message" => "Missing user_id"]);
  exit;
}

$user_id = (int)$data["user_id"];

try {
  // 1️⃣ Total Expenses
  $stmt = $pdo->prepare("
    SELECT COALESCE(SUM(t.amount), 0) AS total_expenses
    FROM transactions t
    JOIN categories c ON t.category_id = c.id
    WHERE t.user_id = :user_id AND c.type = 'expense'
  ");
  $stmt->execute(['user_id' => $user_id]);
  $totalExpenses = (float)$stmt->fetchColumn();

  // 2️⃣ Total Income
  $stmt = $pdo->prepare("
    SELECT COALESCE(SUM(t.amount), 0) AS total_income
    FROM transactions t
    JOIN categories c ON t.category_id = c.id
    WHERE t.user_id = :user_id AND c.type = 'income'
  ");
  $stmt->execute(['user_id' => $user_id]);
  $totalIncome = (float)$stmt->fetchColumn();

  // 3️⃣ Base Wallet (if any)
  $stmt = $pdo->prepare("SELECT COALESCE(amount, 0) FROM balances WHERE user_id = :user_id");
  $stmt->execute(['user_id' => $user_id]);
  $baseWallet = (float)$stmt->fetchColumn();

  // 4️⃣ Current Balance = base wallet + income − expenses
  $currentBalance = $baseWallet + $totalIncome - $totalExpenses;

  // 5️⃣ Recent Transactions
  $stmt = $pdo->prepare("
    SELECT t.date_spent, c.name AS category, t.amount, t.note
    FROM transactions t
    JOIN categories c ON t.category_id = c.id
    WHERE t.user_id = :user_id
    ORDER BY t.date_spent DESC
    LIMIT 5
  ");
  $stmt->execute(['user_id' => $user_id]);
  $transactions = $stmt->fetchAll(PDO::FETCH_ASSOC);

  // 6️⃣ Monthly Expense Chart
  $stmt = $pdo->prepare("
    SELECT DATE_FORMAT(t.date_spent, '%Y-%m') AS month, SUM(t.amount) AS total
    FROM transactions t
    JOIN categories c ON t.category_id = c.id
    WHERE t.user_id = :user_id AND c.type = 'expense'
    GROUP BY month
    ORDER BY month DESC
    LIMIT 6
  ");
  $stmt->execute(['user_id' => $user_id]);
  $chartData = $stmt->fetchAll(PDO::FETCH_ASSOC);

  // ✅ Response
  echo json_encode([
    "status" => "success",
    "data" => [
      "total_expenses" => number_format($totalExpenses, 2),
      "total_income" => number_format($totalIncome, 2),
      "current_balance" => number_format($currentBalance, 2),
      "recent_transactions" => $transactions,
      "chart_data" => $chartData
    ]
  ]);
} catch (Exception $e) {
  http_response_code(500);
  echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
