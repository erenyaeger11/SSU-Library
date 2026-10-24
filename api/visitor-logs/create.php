<?php
require_once __DIR__ . '/../_bootstrap.php';
require_method('POST');
require_auth();
$input      = json_input();
$identifier = clean_string($input['qr_identifier'] ?? null, 'QR identifier', 80);
$purpose    = clean_string($input['purpose'] ?? null, 'Purpose', 30);
if (!preg_match('/^SSU-[A-Za-z0-9][A-Za-z0-9._-]*$/', $identifier)) {
    respond(false, 'The QR identifier is invalid.', null, 422);
}
if (!in_array($purpose, ['Study', 'Borrow Book'], true)) {
    respond(false, 'Choose a valid visit purpose.', null, 422);
}
$pdo = database();
$pdo->beginTransaction();
$studentQuery = $pdo->prepare('SELECT id, student_id, full_name, program, year_level FROM students WHERE qr_identifier=:identifier AND status="Active" FOR UPDATE');
$studentQuery->execute(['identifier' => $identifier]);
$student = $studentQuery->fetch();
if (!$student) {
    $pdo->rollBack();
    respond(false, 'Student not found or inactive.', null, 404);
}
$recent = $pdo->prepare('SELECT id FROM visitor_logs WHERE student_id=:student_id AND created_at >= (NOW() - INTERVAL 2 MINUTE) ORDER BY created_at DESC LIMIT 1');
$recent->execute(['student_id' => $student['id']]);
if ($recent->fetch()) {
    $pdo->rollBack();
    respond(false, 'Student already recorded recently. Please wait before recording another visit.', null, 409);
}
$insert = $pdo->prepare('INSERT INTO visitor_logs (student_id, student_code, student_name, program, year_level, purpose, visit_date, time_in, created_at) VALUES (:student_id, :student_code, :student_name, :program, :year_level, :purpose, CURRENT_DATE(), CURRENT_TIME(), NOW())');
$insert->execute([
    'student_id'   => $student['id'],
    'student_code' => $student['student_id'],
    'student_name' => $student['full_name'],
    'program'      => $student['program'],
    'year_level'   => $student['year_level'],
    'purpose'      => $purpose,
]);
$pdo->commit();
respond(true, 'Visit recorded successfully.', ['id' => (int) $pdo->lastInsertId(), 'student' => $student]);
