<?php
require_once __DIR__ . '/../_bootstrap.php';
require_method('GET');
require_auth();
$identifier = trim((string)($_GET['id'] ?? ''));
if ($identifier === '' || strlen($identifier) > 80 || !preg_match('/^[A-Za-z0-9._-]+$/', $identifier)) {
    respond(false, 'A valid student QR identifier or record ID is required.', null, 422);
}
if (ctype_digit($identifier)) {
    $statement = database()->prepare('SELECT id, student_id, full_name, program, year_level, qr_identifier, status FROM students WHERE id = :id LIMIT 1');
    $statement->execute(['id' => (int)$identifier]);
} else {
    $statement = database()->prepare('SELECT id, student_id, full_name, program, year_level, qr_identifier, status FROM students WHERE qr_identifier = :identifier LIMIT 1');
    $statement->execute(['identifier' => $identifier]);
}
$student = $statement->fetch();
if (!$student || $student['status'] !== 'Active') {
    respond(false, 'Student not found or inactive. Check the QR pass and try again.', null, 404);
}
$student['id'] = (int)$student['id'];
respond(true, 'Student found.', $student);
