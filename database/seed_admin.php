<?php
declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}
$configFile = __DIR__ . '/../api/config.php';
if (!is_file($configFile)) {
    fwrite(STDERR, "Missing api/config.php. Copy api/config.example.php and configure MySQL first.\n");
    exit(1);
}
$config = require $configFile;
$db = $config['db'];
$dsn = sprintf('mysql:host=%s;port=%s;dbname=%s;charset=%s', $db['host'], $db['port'], $db['name'], $db['charset']);
$pdo = new PDO($dsn, $db['user'], $db['password'], [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
$initialPassword = getenv('LIBRARY_ADMIN_PASSWORD');
if (!is_string($initialPassword) || $initialPassword === '' || strlen($initialPassword) > 1024) {
    fwrite(STDERR, "Set LIBRARY_ADMIN_PASSWORD in your shell to the initial password before running this script.\n");
    exit(1);
}
$column = $pdo->query("SHOW COLUMNS FROM admins LIKE 'password_reset_required'");
if (!$column->fetch()) {
    $pdo->exec('ALTER TABLE admins ADD COLUMN password_reset_required TINYINT(1) NOT NULL DEFAULT 0 AFTER password');
}

$pdo->beginTransaction();
try {
    $count = (int) $pdo->query('SELECT COUNT(*) FROM admins')->fetchColumn();
    if ($count !== 0) {
        $pdo->rollBack();
        fwrite(STDERR, "Admin accounts already exist. The built-in account was not created or changed.\n");
        exit(1);
    }
    $insert = $pdo->prepare('INSERT INTO admins (name, username, email, password, password_reset_required, role, status) VALUES (:name, :username, :email, :password, 1, "Admin", "Active")');
    $insert->execute([
        'name' => 'Library Administrator',
        'username' => 'admin',
        'email' => 'admin@ssu.com',
        'password' => password_hash($initialPassword, PASSWORD_DEFAULT),
    ]);
    $pdo->commit();
    fwrite(STDOUT, "Initial admin created: admin@ssu.com\n");
    fwrite(STDOUT, "Change this password on first sign-in. Choose a unique password of at least 12 characters.\n");
} catch (Throwable $error) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    throw $error;
}
