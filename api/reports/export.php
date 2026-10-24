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
$query = database()->query("SELECT student_code AS `Student ID`, student_name AS `Student name`, program AS `Program`, year_level AS `Year level`, purpose AS `Purpose`, visit_date AS `Date`, time_in AS `Time in` FROM visitor_logs WHERE $dateExpression ORDER BY created_at DESC");
header('Content-Type: text/csv; charset=utf-8');
header('Content-Disposition: attachment; filename="library-report-' . $period . '-' . date('Y-m-d') . '.csv"');
$output = fopen('php://output', 'wb');
if ($output === false) {
    error_log('Unable to open CSV output stream.');
    http_response_code(500);
    exit;
}
fwrite($output, "\u{FEFF}");
fputcsv($output, ['Student ID', 'Student name', 'Program', 'Year level', 'Purpose', 'Date', 'Time in']);
while ($row = $query->fetch(PDO::FETCH_NUM)) {
    fputcsv($output, $row);
}
fclose($output);
