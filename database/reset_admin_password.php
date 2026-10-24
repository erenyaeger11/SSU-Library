<?php
declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

$email = getenv('LIBRARY_ADMIN_EMAIL');
$password = getenv('LIBRARY_ADMIN_PASSWORD');
if (!is_string($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    fwrite(STDERR, "Set LIBRARY_ADMIN_EMAIL to the email address of the existing admin account.\n");
    exit(1);
}
if (!is_string($password) || strlen($password) < 12 || strlen($password) > 1024) {
    fwrite(STDERR, "Set LIBRARY_ADMIN_PASSWORD to a new password of at least 12 characters.\n");
    exit(1);
}

$configFile = __DIR__ . '/../api/config.php';
if (!is_file($configFile)) {
    fwrite(STDERR, "Missing api/config.php. Configure the database connection first.\n");
    exit(1);
}

$config = require $configFile;
$db = $config['db'];
$dsn = sprintf('mysql:host=%s;port=%s;dbname=%s;charset=%s', $db['host'], $db['port'], $db['name'], $db['charset']);
$pdo = new PDO($dsn, $db['user'], $db['password'], [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);

try {
    $pdo->beginTransaction();
    $update = $pdo->prepare('UPDATE admins SET password = :password, password_reset_required = 0 WHERE email = :email AND status = "Active"');
    $update->execute([
        'password' => password_hash($password, PASSWORD_DEFAULT),
        'email' => $email,
    ]);

    if ($update->rowCount() !== 1) {
        $pdo->rollBack();
        fwrite(STDERR, "No active account matched that email. No account was reset.\n");
        exit(1);
    }

    $verify = $pdo->prepare('SELECT password FROM admins WHERE email = :email AND status = "Active"');
    $verify->execute(['email' => $email]);
    $storedHash = $verify->fetchColumn();
    if (!is_string($storedHash) || !password_verify($password, $storedHash)) {
        throw new RuntimeException('The password update could not be verified.');
    }

    $pdo->commit();
} catch (Throwable $error) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    throw $error;
}

fwrite(STDOUT, "Password updated and verified for the active account. Sign in with the new password.\n");
