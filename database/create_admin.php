<?php declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}
$configFile = __DIR__ . '/../api/config.php';
if (!is_file($configFile)) {
    fwrite(STDERR, "Missing api/config.php. Copy api/config.example.php and configure MySQL first.\n");
    exit(1);
}
$config   = require $configFile;
$db       = $config['db'];
$dsn      = sprintf('mysql:host=%s;port=%s;dbname=%s;charset=%s', $db['host'], $db['port'], $db['name'], $db['charset']);
$pdo      = new PDO($dsn, $db['user'], $db['password'], [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
$username = trim((string) readline('Admin username: '));
$name     = trim((string) readline('Admin display name: '));
$email    = trim((string) readline('Admin email: '));
$password = (string) readline('Admin password (minimum 12 characters): ');
if (!preg_match('/^[A-Za-z0-9._-]{3,80}$/', $username) || $name === '' || mb_strlen($name) > 150 || !filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($password) < 12) {
    fwrite(STDERR, "Invalid values. Username needs 3–80 safe characters, name and email are required, and password needs at least 12 characters.\n");
    exit(1);
}
$statement = $pdo->prepare('INSERT INTO admins (name, username, email, password, role, status) VALUES (:name, :username, :email, :password, "Admin", "Active")');
try {
    $statement->execute(['name' => $name, 'username' => $username, 'email' => $email, 'password' => password_hash($password, PASSWORD_DEFAULT)]);
    fwrite(STDOUT, "Admin account created. Keep these credentials private.\n");
} catch (PDOException $error) {
    if ($error->getCode() === '23000') {
        fwrite(STDERR, "That username or email is already in use.\n");
        exit(1);
    }
    throw $error;
}
