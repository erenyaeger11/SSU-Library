<?php
require_once __DIR__ . '/../_bootstrap.php';
require_method('POST');
$admin           = require_auth(true);
$input           = json_input();
$currentPassword = $input['current_password'] ?? null;
$newPassword     = $input['new_password'] ?? null;
if (!is_string($currentPassword) || $currentPassword === '' || strlen($currentPassword) > 1024) {
    respond(false, 'Current password is required.', null, 422);
}
if (!is_string($newPassword) || strlen($newPassword) < 12 || strlen($newPassword) > 1024) {
    respond(false, 'New password must be at least 12 characters.', null, 422);
}
$pdo       = database();
$statement = $pdo->prepare('SELECT password FROM admins WHERE id=:id AND status="Active"');
$statement->execute(['id' => $admin['id']]);
$record = $statement->fetch();
if (!$record || !password_verify($currentPassword, $record['password'])) {
    respond(false, 'Current password is incorrect.', null, 403);
}
if (password_verify($newPassword, $record['password'])) {
    respond(false, 'Choose a password different from your current password.', null, 422);
}
$update = $pdo->prepare('UPDATE admins SET password=:password, password_reset_required=0 WHERE id=:id');
$update->execute(['password' => password_hash($newPassword, PASSWORD_DEFAULT), 'id' => $admin['id']]);
$_SESSION['admin']['must_change_password'] = false;
respond(true, 'Password changed successfully. Your staff portal is ready.', $_SESSION['admin']);
