<?php
require_once __DIR__ . '/../_bootstrap.php';
require_method('GET');
require_auth();
$period         = (string) ($_GET['period'] ?? 'month');
$dateExpression = match ($period) {
    'day'   => 'visit_date=CURRENT_DATE()',
    'week'  => 'visit_date >= DATE_SUB(CURRENT_DATE(), INTERVAL WEEKDAY(CURRENT_DATE()) DAY) AND visit_date <= CURRENT_DATE()',
    'month' => 'visit_date >= DATE_FORMAT(CURRENT_DATE(), "%Y-%m-01") AND visit_date <= CURRENT_DATE()',
    default => null,
};
if ($dateExpression === null)
    respond(false, 'Choose a valid reporting period.', null, 422);
$pdo     = database();
$summary = $pdo->query("SELECT COUNT(*) AS total_visits, SUM(purpose='Study') AS study_visits, SUM(purpose='Borrow Book') AS borrow_visits FROM visitor_logs WHERE $dateExpression")->fetch();
foreach (['total_visits', 'study_visits', 'borrow_visits'] as $key)
    $summary[$key] = (int) ($summary[$key] ?? 0);
$daily     = $pdo->query("SELECT DATE_FORMAT(visit_date, '%b %e') AS label, COUNT(*) AS total FROM visitor_logs WHERE $dateExpression GROUP BY visit_date ORDER BY visit_date")->fetchAll();
$byProgram = $pdo->query("SELECT program, COUNT(*) AS total FROM visitor_logs WHERE $dateExpression GROUP BY program ORDER BY total DESC, program ASC")->fetchAll();
$byPurpose = $pdo->query("SELECT purpose, COUNT(*) AS total FROM visitor_logs WHERE $dateExpression GROUP BY purpose ORDER BY purpose")->fetchAll();
$frequent  = $pdo->query("SELECT student_code AS student_id, student_name AS full_name, program, COUNT(*) AS total_visits FROM visitor_logs WHERE $dateExpression GROUP BY student_id, student_code, student_name, program ORDER BY total_visits DESC, student_name ASC LIMIT 8")->fetchAll();
respond(true, 'Reports loaded.', ['period' => $period, 'summary' => $summary, 'visitors_by_day' => $daily, 'visitors_by_program' => $byProgram, 'visitors_by_purpose' => $byPurpose, 'frequent_visitors' => $frequent]);
