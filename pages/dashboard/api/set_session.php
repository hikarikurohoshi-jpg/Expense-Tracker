<?php
require_once __DIR__ . '/../../../db/config/config.php';
session_start();

header('Content-Type: application/json');

try {
  $data = json_decode(file_get_contents("php://input"), true);

  if (!isset($data['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'No user ID provided']);
    exit;
  }

  $_SESSION['user_id'] = intval($data['user_id']);

  echo json_encode(['success' => true, 'message' => 'Session set successfully']);
} catch (Exception $e) {
  echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
