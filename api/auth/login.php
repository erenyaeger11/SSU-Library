<?php
require_once __DIR__ . '/../_bootstrap.php';
require_method('POST');
$input    = json_input();
$username = clean_string($input['username'] ?? null, 'Username or email', 190);
$password = $input['password'] ?? null;
if (!is_string($password) || $password === '' || strlen($password) > 1024) {
    respond(false, 'Password is required.', null, 422);
}

$statement = database()->prepare('SELECT id, name, email, password, role, password_reset_required FROM admins WHERE (email = :email OR username = :username) AND status = "Active" LIMIT 1');
$statement->execute(['email' => $username, 'username' => $username]);
$admin = $statement->fetch();
if (!$admin || !password_verify($password, $admin['password'])) {
    respond(false, 'The username or password is incorrect.', null, 401);
}
session_regenerate_id(true);
$_SESSION['admin'] = [
    'id'                   => (int) $admin['id'],
    'name'                 => $admin['name'],
    'email'                => $admin['email'],
    'role'                 => $admin['role'],
    'must_change_password' => (bool) $admin['password_reset_required'],
];
respond(true, $_SESSION['admin']['must_change_password'] ? 'Signed in. Change the initial password to continue.' : 'Signed in successfully.', $_SESSION['admin']);
