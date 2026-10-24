<?php
declare(strict_types=1);

$configFile = __DIR__ . '/config.php';
if (!is_file($configFile)) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['success' => false, 'message' => 'API is not configured. Copy api/config.example.php to api/config.php and add database settings.']);
    exit;
}
$config = require $configFile;

function respond(bool $success, string $message, mixed $data = null, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    $body = ['success' => $success, 'message' => $message];
    if ($data !== null) {
        $body['data'] = $data;
    }
    echo json_encode($body, JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE);
    exit;
}

function database(): PDO
{
    static $pdo;
    global $config;
    if ($pdo instanceof PDO) {
        return $pdo;
    }
    $db = $config['db'];
    $dsn = sprintf('mysql:host=%s;port=%s;dbname=%s;charset=%s', $db['host'], $db['port'], $db['name'], $db['charset']);
    $pdo = new PDO($dsn, $db['user'], $db['password'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
    $timezone = $db['timezone'] ?? '+00:00';
    if (!preg_match('/^[+-](?:(?:0\d|1[0-3]):[0-5]\d|14:00)$/', $timezone)) {
        throw new RuntimeException('Invalid configured database timezone.');
    }
    $pdo->exec('SET time_zone = ' . $pdo->quote($timezone));
    return $pdo;
}

function json_input(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || trim($raw) === '') {
        return [];
    }
    $value = json_decode($raw, true);
    if (!is_array($value)) {
        respond(false, 'Request body must be a valid JSON object.', null, 400);
    }
    return $value;
}

function require_method(string $method): void
{
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== $method) {
        header('Allow: ' . $method);
        respond(false, 'Method not allowed.', null, 405);
    }
}

function require_auth(bool $allowPasswordReset = false): array
{
    if (empty($_SESSION['admin'])) {
        respond(false, 'Please sign in to continue.', null, 401);
    }
    if (!$allowPasswordReset && !empty($_SESSION['admin']['must_change_password'])) {
        respond(false, 'Change the initial password before using the staff portal.', null, 403);
    }
    return $_SESSION['admin'];
}

function clean_string(mixed $value, string $label, int $maxLength, bool $required = true): string
{
    if (!is_string($value) && !is_numeric($value)) {
        if (!$required && ($value === null || $value === '')) {
            return '';
        }
        respond(false, $label . ' is required.', null, 422);
    }
    $value = trim((string)$value);
    if (($required && $value === '') || mb_strlen($value) > $maxLength) {
        respond(false, $label . ($value === '' ? ' is required.' : ' is too long.'), null, 422);
    }
    return $value;
}

function student_payload(array $input, bool $includeId = false): array
{
    $student = [
        'student_id' => clean_string($input['student_id'] ?? null, 'Student ID', 40),
        'full_name' => clean_string($input['full_name'] ?? null, 'Full name', 150),
        'program' => clean_string($input['program'] ?? null, 'Program', 120),
        'year_level' => clean_string($input['year_level'] ?? null, 'Year level', 30),
        'status' => clean_string($input['status'] ?? 'Active', 'Status', 10),
    ];
    if (!preg_match('/^[A-Za-z0-9][A-Za-z0-9._-]*$/', $student['student_id'])) {
        respond(false, 'Student ID may contain only letters, numbers, dots, underscores, and hyphens.', null, 422);
    }
    if (!in_array($student['year_level'], ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year'], true)) {
        respond(false, 'Choose a valid year level.', null, 422);
    }
    if (!in_array($student['status'], ['Active', 'Inactive'], true)) {
        respond(false, 'Choose a valid student status.', null, 422);
    }
    if ($includeId) {
        $id = filter_var($input['id'] ?? null, FILTER_VALIDATE_INT);
        if (!$id || $id < 1) {
            respond(false, 'A valid student record ID is required.', null, 422);
        }
        $student['id'] = $id;
    }
    return $student;
}

function valid_date(string $date): bool
{
    $parsed = DateTime::createFromFormat('!Y-m-d', $date);
    return $parsed !== false && $parsed->format('Y-m-d') === $date;
}

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowedOrigins = $config['allowed_origins'] ?? [];
if ($origin !== '' && in_array($origin, $allowedOrigins, true)) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Access-Control-Allow-Credentials: true');
    header('Vary: Origin');
}
header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
}
if ($origin !== '' && !in_array($origin, $allowedOrigins, true)) {
    respond(false, 'This origin is not allowed.', null, 403);
}

$secure = (bool)($config['session_secure'] ?? false);
session_set_cookie_params([
    'lifetime' => 0,
    'path' => '/',
    'secure' => $secure,
    'httponly' => true,
    'samesite' => 'Strict',
]);
session_start();

try {
    database();
} catch (Throwable $error) {
    error_log('Library API database connection failure: ' . $error->getMessage());
    respond(false, 'The library database is unavailable. Check the API configuration and database service.', null, 503);
}
