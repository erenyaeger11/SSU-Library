<?php
require_once __DIR__ . '/../_bootstrap.php';
require_method('GET');
require_auth();
$query = trim((string)($_GET['search'] ?? ''));
$status = (string)($_GET['status'] ?? '');
$sql = 'SELECT id, student_id, full_name, program, year_level, qr_identifier, status, created_at, updated_at FROM students WHERE 1=1';
$params = [];
if ($query !== '') {
    $sql .= ' AND (student_id LIKE :q1 OR full_name LIKE :q2 OR program LIKE :q3)';
    $wildcard = '%' . $query . '%';
    $params += ['q1' => $wildcard, 'q2' => $wildcard, 'q3' => $wildcard];
}
if ($status !== '') {
    if (!in_array($status, ['Active', 'Inactive'], true)) {
        respond(false, 'Invalid status filter.', null, 422);
    }
    $sql .= ' AND status = :status';
    $params['status'] = $status;
}
$sql .= ' ORDER BY created_at DESC, id DESC';
$statement = database()->prepare($sql);
$statement->execute($params);
respond(true, 'Students loaded.', $statement->fetchAll());
