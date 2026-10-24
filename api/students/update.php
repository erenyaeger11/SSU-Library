<?php
require_once __DIR__ . '/../_bootstrap.php';
require_method('POST');
require_auth();
$student = student_payload(json_input(), true);
$identifier = 'SSU-' . $student['student_id'];
try {
    $statement = database()->prepare('UPDATE students SET student_id=:student_id, full_name=:full_name, program=:program, year_level=:year_level, status=:status, qr_identifier=:qr_identifier WHERE id=:id');
    $statement->execute($student + ['qr_identifier' => $identifier]);
} catch (PDOException $error) {
    if ($error->getCode() === '23000') {
        respond(false, 'Another student already has this Student ID.', null, 409);
    }
    throw $error;
}
if ($statement->rowCount() === 0) {
    $check = database()->prepare('SELECT id FROM students WHERE id=:id');
    $check->execute(['id' => $student['id']]);
    if (!$check->fetch()) {
        respond(false, 'Student not found.', null, 404);
    }
}
respond(true, 'Student updated.', ['id' => $student['id'], 'qr_identifier' => $identifier]);
