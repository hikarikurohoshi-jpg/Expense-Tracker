<?php
header("Content-Type: application/json; charset=utf-8");
require_once __DIR__ . "/../../../db/config/config.php";

$data = json_decode(file_get_contents("php://input"), true);
$id = $data["id"] ?? null;
$userId = $data["user_id"] ?? null;

if (!$id || !$userId) {
  echo json_encode(["status" => "error", "message" => "Missing required data"]);
  exit;
}

try {
  $stmt = $pdo->prepare("DELETE FROM transactions WHERE id = :id AND user_id = :uid");
  $stmt->execute(["id" => $id, "uid" => $userId]);

  echo json_encode(["status" => "success"]);
} catch (Exception $e) {
  echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
