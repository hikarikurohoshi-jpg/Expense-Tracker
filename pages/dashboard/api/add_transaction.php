<?php
header('Content-Type: application/json; charset=utf-8');
ini_set('display_errors', 1);
error_reporting(E_ALL);

require_once __DIR__ . '/../../../db/config/config.php';

$data = json_decode(file_get_contents("php://input"), true);

if (
  !isset($data["user_id"]) ||
  !isset($data["type"]) ||
  !isset($data["amount"]) ||
  !isset($data["date"])
) {
  http_response_code(400);
  echo json_encode(["status" => "error", "message" => "Missing required fields"]);
  exit;
}

$user_id = (int)$data["user_id"];
$type = $data["type"]; // 'expense' or 'income'
$amount = (float)$data["amount"];
$date = $data["date"];
$note = $data["note"] ?? null;
$category = $data["category"] ?? ($type === 'income' ? 'Income' : 'Expense');

// 🔹 Get or create category ID
try {
  $stmt = $pdo->prepare("SELECT id FROM categories WHERE name = :name AND type = :type AND (user_id = :user_id OR user_id IS NULL) LIMIT 1");
  $stmt->execute([
    'name' => $category,
    'type' => $type,
    'user_id' => $user_id
  ]);
  $catId = $stmt->fetchColumn();

  if (!$catId) {
    $stmt = $pdo->prepare("INSERT INTO categories (name, type, user_id) VALUES (:name, :type, :user_id)");
    $stmt->execute(['name' => $category, 'type' => $type, 'user_id' => $user_id]);
    $catId = $pdo->lastInsertId();
  }

  // 🔹 Insert transaction
  $stmt = $pdo->prepare("
    INSERT INTO transactions (user_id, category_id, amount, date_spent, note)
    VALUES (:user_id, :category_id, :amount, :date_spent, :note)
  ");
  $stmt->execute([
    'user_id' => $user_id,
    'category_id' => $catId,
    'amount' => $amount,
    'date_spent' => $date,
    'note' => $note
  ]);

  // 🔹 Log action
  $stmt = $pdo->prepare("INSERT INTO audit_logs (user_id, action, details) VALUES (:user_id, :action, :details)");
  $stmt->execute([
    'user_id' => $user_id,
    'action' => 'Add Transaction',
    'details' => json_encode($data)
  ]);

  echo json_encode(["status" => "success", "message" => "Transaction added successfully"]);
} catch (Exception $e) {
  http_response_code(500);
  echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
