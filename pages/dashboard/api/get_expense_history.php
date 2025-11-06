<?php
header("Content-Type: application/json; charset=utf-8");
require_once __DIR__ . "/../../../db/config/config.php";

$data = json_decode(file_get_contents("php://input"), true);
$userId = $data["user_id"] ?? null;
$start = $data["start_date"] ?? null;
$end = $data["end_date"] ?? null;
$category = $data["category"] ?? null;

if (!$userId) {
  echo json_encode(["status" => "error", "message" => "Missing user_id"]);
  exit;
}

try {
  $sql = "
    SELECT t.id, t.date_spent, c.name AS category, t.amount, t.note
    FROM transactions t
    JOIN categories c ON t.category_id = c.id
    WHERE t.user_id = :uid AND c.type = 'expense'
  ";

  $params = ["uid" => $userId];

  if ($start && $end) {
    $sql .= " AND t.date_spent BETWEEN :start AND :end";
    $params["start"] = $start;
    $params["end"] = $end;
  }

  if ($category && $category !== "All") {
    $sql .= " AND c.name = :cat";
    $params["cat"] = $category;
  }

  $sql .= " ORDER BY t.date_spent DESC";

  $stmt = $pdo->prepare($sql);
  $stmt->execute($params);
  $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

  echo json_encode(["status" => "success", "data" => $rows]);
} catch (Exception $e) {
  echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
