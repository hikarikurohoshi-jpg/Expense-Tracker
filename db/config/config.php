<?php
// ========================
// Database Connection File
// Path: /db/config.php
// ========================

header("Content-Type: application/json; charset=UTF-8");

// Database credentials
$DB_HOST = "localhost";
$DB_NAME = "fynix";
$DB_USER = "root";
$DB_PASS = "";

// Create PDO instance
try {
  $pdo = new PDO(
    "mysql:host=$DB_HOST;dbname=$DB_NAME;charset=utf8mb4",
    $DB_USER,
    $DB_PASS
  );
  $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
  http_response_code(500);
  echo json_encode([
    "status" => "error",
    "error" => "Database connection failed: " . $e->getMessage()
  ]);
  exit;
}
