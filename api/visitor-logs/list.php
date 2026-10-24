<?php
require_once __DIR__ . '/../_bootstrap.php';
require_method('GET');
require_auth();
$search  = trim((string) ($_GET['search'] ?? ''));
$purpose = trim((string) ($_GET['purpose'] ?? ''));
$program = trim((string) ($_GET['program'] ?? ''));
$year    = trim((string) ($_GET['year_level'] ?? ''));
$from    = trim((string) ($_GET['date_from'] ?? ''));
$to      = trim((string) ($_GET['date_to'] ?? ''));
$sort    = (string) ($_GET['sort'] ?? 'newest');
$page    = max(1, (int) ($_GET['page'] ?? 1));
$perPage = min(10000, max(1, (int) ($_GET['per_page'] ?? 20)));
if ($purpose !== '' && !in_array($purpose, ['Study', 'Borrow Book'], true))
    respond(false, 'Invalid purpose filter.', null, 422);
if ($from !== '' && !valid_date($from))
    respond(false, 'Invalid start date.', null, 422);
if ($to !== '' && !valid_date($to))
    respond(false, 'Invalid end date.', null, 422);
if ($from !== '' && $to !== '' && $from > $to)
    respond(false, 'Start date must be on or before end date.', null, 422);
if (!in_array($sort, ['newest', 'oldest'], true))
    respond(false, 'Invalid sort order.', null, 422);
$where  = [];
$params = [];
if ($search !== '') {
    $where[]        = '(student_name LIKE :name OR student_code LIKE :code)';
    $params['name'] = '%' . $search . '%';
    $params['code'] = '%' . $search . '%';
}
if ($purpose !== '') {
    $where[]           = 'purpose=:purpose';
    $params['purpose'] = $purpose;
}
if ($program !== '') {
    $where[]           = 'program=:program';
    $params['program'] = $program;
}
if ($year !== '') {
    $where[]        = 'year_level=:year';
    $params['year'] = $year;
}
if ($from !== '') {
    $where[]             = 'visit_date>=:date_from';
    $params['date_from'] = $from;
}
if ($to !== '') {
    $where[]           = 'visit_date<=:date_to';
    $params['date_to'] = $to;
}
$filter = $where ? ' WHERE ' . implode(' AND ', $where) : '';
$pdo    = database();
$count  = $pdo->prepare('SELECT COUNT(*) FROM visitor_logs' . $filter);
$count->execute($params);
$total     = (int) $count->fetchColumn();
$offset    = ($page - 1) * $perPage;
$direction = $sort === 'oldest' ? 'ASC' : 'DESC';
$query     = $pdo->prepare('SELECT id, student_code AS student_id, student_name AS full_name, program, year_level, purpose, visit_date, time_in, created_at FROM visitor_logs' . $filter . " ORDER BY created_at $direction, id $direction LIMIT :limit OFFSET :offset");
foreach ($params as $key => $value)
    $query->bindValue(':' . $key, $value);
$query->bindValue(':limit', $perPage, PDO::PARAM_INT);
$query->bindValue(':offset', $offset, PDO::PARAM_INT);
$query->execute();
$items = $query->fetchAll();
respond(true, 'Visitor logs loaded.', ['items' => $items, 'pagination' => ['page' => $page, 'per_page' => $perPage, 'total' => $total, 'pages' => max(1, (int) ceil($total / $perPage))]]);
