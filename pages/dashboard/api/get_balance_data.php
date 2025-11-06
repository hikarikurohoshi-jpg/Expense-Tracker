<?php
session_start();
header("Content-Type: application/json");
require_once realpath(__DIR__ . '/../../../db/config/config.php');

$user_id = $_SESSION['user_id'] ?? null;
if (!$user_id) {
  echo json_encode(["status" => "error", "message" => "User not logged in"]);
  exit;
}

try {
  // Current balance
  $stmt = $pdo->prepare("SELECT amount FROM balances WHERE user_id = ?");
  $stmt->execute([$user_id]);
  $current_balance = $stmt->fetchColumn() ?: 0;

  // Total expenses
  $stmt = $pdo->prepare("SELECT SUM(amount) FROM transactions WHERE user_id = ? AND category_id IN (SELECT id FROM categories WHERE type='expense')");
  $stmt->execute([$user_id]);
  $total_expenses = $stmt->fetchColumn() ?: 0;

  // Total income
  $stmt = $pdo->prepare("SELECT SUM(amount) FROM transactions WHERE user_id = ? AND category_id IN (SELECT id FROM categories WHERE type='income')");
  $stmt->execute([$user_id]);
  $total_income = $stmt->fetchColumn() ?: 0;

  echo json_encode([
    "status" => "success",
    "current_balance" => $current_balance,
    "total_expenses" => $total_expenses,
    "total_income" => $total_income
  ]);
} catch (Exception $e) {
  echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
