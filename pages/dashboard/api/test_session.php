<?php
session_start();
echo "User ID from session: ";
echo isset($_SESSION['user_id']) ? $_SESSION['user_id'] : 'NOT SET';
