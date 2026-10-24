<?php
require_once __DIR__ . '/../_bootstrap.php';
require_method('POST');
require_auth();
$student = student_payload(json_input());
$identifier = 'SSU-' . $student['student_id'];
try {
    $statement = database()->prepare('INSERT INTO students (student_id, full_name, program, year_level, qr_identifier, status) VALUES (:student_id, :full_name, :program, :year_level, :qr_identifier, :status)');
    $statement->execute($student + ['qr_identifier' => $identifier]);
} catch (PDOException $error) {
    if ($error->getCode() === '23000') {
        respond(false, 'A student with this Student ID already exists.', null, 409);
    }
    throw $error;
}
$id = (int)database()->lastInsertId();
respond(true, 'Student registered and QR pass generated.', ['id' => $id, 'qr_identifier' => $identifier]);
