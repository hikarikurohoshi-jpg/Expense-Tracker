<?php
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../../../db/config/config.php'; // ✅ Correct relative path to config.php

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['firebase_uid'])) {
  echo json_encode(["status" => "error", "message" => "Missing Firebase UID"]);
  exit;
}

$firebase_uid = $data['firebase_uid'];

try {
  $stmt = $pdo->prepare("SELECT id FROM users WHERE firebase_uid = :firebase_uid");
  $stmt->execute(['firebase_uid' => $firebase_uid]);
  $user = $stmt->fetch(PDO::FETCH_ASSOC);

  if ($user) {
    echo json_encode(["status" => "success", "user_id" => $user['id']]);
  } else {
    echo json_encode(["status" => "error", "message" => "User not found."]);
  }
} catch (Exception $e) {
  echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
