<?php
require_once __DIR__ . '/../_bootstrap.php';
require_method('POST');
require_auth();
$input = json_input();
$id = filter_var($input['id'] ?? null, FILTER_VALIDATE_INT);
$action = $input['action'] ?? 'delete';
if (!$id || $id < 1 || !in_array($action, ['delete', 'deactivate'], true)) {
    respond(false, 'A valid student record and action are required.', null, 422);
}
$pdo = database();
$check = $pdo->prepare('SELECT id FROM students WHERE id=:id');
$check->execute(['id' => $id]);
if (!$check->fetch()) {
    respond(false, 'Student not found.', null, 404);
}
if ($action === 'deactivate') {
    $statement = $pdo->prepare('UPDATE students SET status="Inactive" WHERE id=:id');
    $statement->execute(['id' => $id]);
    respond(true, 'Student deactivated.');
}
$history = $pdo->prepare('SELECT COUNT(*) FROM visitor_logs WHERE student_id=:id');
$history->execute(['id' => $id]);
if ((int)$history->fetchColumn() > 0) {
    respond(false, 'This student has visit history and cannot be deleted. Deactivate the record to preserve reports.', null, 409);
}
$statement = $pdo->prepare('DELETE FROM students WHERE id=:id');
$statement->execute(['id' => $id]);
respond(true, 'Student deleted.');
