<?php
require_once __DIR__ . '/../_bootstrap.php';
require_method('GET');
require_auth();
$pdo                     = database();
$statsQuery              = $pdo->query("SELECT
    (SELECT COUNT(*) FROM visitor_logs WHERE visit_date=CURRENT_DATE()) AS today_visitors,
    (SELECT COUNT(*) FROM visitor_logs WHERE visit_date=CURRENT_DATE() AND purpose='Study') AS study_visits,
    (SELECT COUNT(*) FROM visitor_logs WHERE visit_date=CURRENT_DATE() AND purpose='Borrow Book') AS borrow_visits,
    (SELECT COUNT(*) FROM students WHERE status='Active') AS students,
    (SELECT COUNT(*) FROM visitor_logs WHERE visit_date=DATE_SUB(CURRENT_DATE(), INTERVAL 1 DAY)) AS yesterday_visitors");
$stats                   = $statsQuery->fetch();
$yesterday               = (int) $stats['yesterday_visitors'];
$today                   = (int) $stats['today_visitors'];
$stats['visitor_change'] = $yesterday > 0 ? sprintf('%+d%%', (int) round((($today - $yesterday) / $yesterday) * 100)) : ($today > 0 ? '+100%' : '0%');
unset($stats['yesterday_visitors']);
foreach (['today_visitors', 'study_visits', 'borrow_visits', 'students'] as $key)
    $stats[$key] = (int) $stats[$key];

$trendQuery  = $pdo->query("SELECT DATE_FORMAT(days.day, '%a') AS label, COALESCE(visits.total, 0) AS total
    FROM (SELECT CURRENT_DATE() AS day UNION ALL SELECT DATE_SUB(CURRENT_DATE(), INTERVAL 1 DAY) UNION ALL SELECT DATE_SUB(CURRENT_DATE(), INTERVAL 2 DAY) UNION ALL SELECT DATE_SUB(CURRENT_DATE(), INTERVAL 3 DAY) UNION ALL SELECT DATE_SUB(CURRENT_DATE(), INTERVAL 4 DAY) UNION ALL SELECT DATE_SUB(CURRENT_DATE(), INTERVAL 5 DAY) UNION ALL SELECT DATE_SUB(CURRENT_DATE(), INTERVAL 6 DAY)) AS days
    LEFT JOIN (SELECT visit_date, COUNT(*) AS total FROM visitor_logs WHERE visit_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 6 DAY) GROUP BY visit_date) AS visits ON visits.visit_date=days.day ORDER BY days.day");
$trend       = $trendQuery->fetchAll();
$recentQuery = $pdo->query('SELECT id, student_code AS student_id, student_name AS full_name, program, year_level, purpose, visit_date, time_in FROM visitor_logs ORDER BY created_at DESC, id DESC LIMIT 5');
respond(true, 'Dashboard statistics loaded.', ['stats' => $stats, 'trend' => $trend, 'recent_visits' => $recentQuery->fetchAll()]);
