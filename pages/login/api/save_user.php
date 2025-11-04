<?php
// ========================
// Include Database Config
// ========================
require_once __DIR__ . '/../../../db/config/config.php';
// ========================
// Get JSON data
// ========================
$input = json_decode(file_get_contents("php://input"), true);

if (!$input || empty($input["uid"]) || empty($input["email"])) {
  http_response_code(400);
  echo json_encode(["status" => "error", "error" => "Missing required fields"]);
  exit;
}

$uid = trim($input["uid"]);
$email = trim($input["email"]);
$name = isset($input["name"]) ? trim($input["name"]) : null;
$profile_photo = isset($input["profile_photo"]) ? trim($input["profile_photo"]) : null;

// ========================
// Check if user already exists
// ========================
try {
  $stmt = $pdo->prepare("SELECT id FROM users WHERE firebase_uid = :uid");
  $stmt->execute([":uid" => $uid]);
  $existingUser = $stmt->fetch(PDO::FETCH_ASSOC);

  if ($existingUser) {
    echo json_encode(["status" => "ok", "message" => "User already exists"]);
    exit;
  }

  // ========================
  // Insert new user
  // ========================
  $pdo->beginTransaction();

  $stmt = $pdo->prepare("
    INSERT INTO users (firebase_uid, email, display_name)
    VALUES (:uid, :email, :name)
  ");
  $stmt->execute([
    ":uid" => $uid,
    ":email" => $email,
    ":name" => $name
  ]);

  $userId = $pdo->lastInsertId();

  // ========================
  // Create user profile record
  // ========================
  $stmt = $pdo->prepare("
    INSERT INTO user_profiles (user_id, picture_url)
    VALUES (:user_id, :picture_url)
  ");
  $stmt->execute([
    ":user_id" => $userId,
    ":picture_url" => $profile_photo
  ]);

  $pdo->commit();

  echo json_encode(["status" => "ok", "message" => "User saved successfully"]);
} catch (PDOException $e) {
  $pdo->rollBack();
  http_response_code(500);
  echo json_encode(["status" => "error", "error" => $e->getMessage()]);
}
