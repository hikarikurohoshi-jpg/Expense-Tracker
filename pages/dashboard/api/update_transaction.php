<?php
header("Content-Type: application/json; charset=utf-8");
require_once __DIR__ . "/../../../db/config/config.php";

$data = json_decode(file_get_contents("php://input"), true);
$id = $data["id"] ?? null;
$userId = $data["user_id"] ?? null;
$category = trim($data["category"] ?? "");
$amount = $data["amount"] ?? 0;
$note = $data["note"] ?? "";
$date = $data["date"] ?? null;

if (!$id || !$userId) {
  echo json_encode(["status" => "error", "message" => "Missing required data"]);
  exit;
}

try {
  // Get or create category
  $stmt = $pdo->prepare("SELECT id FROM categories WHERE name = :name AND user_id = :uid AND type = 'expense'");
  $stmt->execute(["name" => $category, "uid" => $userId]);
  $cat = $stmt->fetch(PDO::FETCH_ASSOC);

  if (!$cat) {
    $stmt = $pdo->prepare("INSERT INTO categories (name, type, user_id) VALUES (:n, 'expense', :u)");
    $stmt->execute(["n" => $category, "u" => $userId]);
    $categoryId = $pdo->lastInsertId();
  } else {
    $categoryId = $cat["id"];
  }

  $stmt = $pdo->prepare("
    UPDATE transactions
    SET category_id = :cid, amount = :amt, note = :note, date_spent = :dt
    WHERE id = :id AND user_id = :uid
  ");
  $stmt->execute([
    "cid" => $categoryId,
    "amt" => $amount,
    "note" => $note,
    "dt" => $date,
    "id" => $id,
    "uid" => $userId
  ]);

  echo json_encode(["status" => "success"]);
} catch (Exception $e) {
  echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
