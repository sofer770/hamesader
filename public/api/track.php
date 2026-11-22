<?php
/**
 * המסדר - anonymous usage counter.
 * Receives {"e":"visit|install|open","m":"web|pwa|android","id":"<random device id>"}
 * and appends one line to data/events-YYYY-MM.csv. No names, phone numbers or IP addresses are stored.
 */
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Cache-Control: no-store');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); exit; }

$raw = file_get_contents('php://input', false, null, 0, 2048);
$in = json_decode($raw ?: '', true);
if (!is_array($in)) { http_response_code(400); exit; }

$events = ['visit', 'install', 'open'];
$modes = ['web', 'pwa', 'android'];
$e = in_array($in['e'] ?? '', $events, true) ? $in['e'] : null;
$m = in_array($in['m'] ?? '', $modes, true) ? $in['m'] : 'web';
$id = preg_replace('/[^a-z0-9]/i', '', (string)($in['id'] ?? ''));
if (!$e || strlen($id) < 8 || strlen($id) > 40) { http_response_code(400); exit; }

date_default_timezone_set('Asia/Jerusalem');
$dir = __DIR__ . '/data';
if (!is_dir($dir)) @mkdir($dir, 0755, true);
$file = $dir . '/events-' . date('Y-m') . '.csv';
// Store only a short hash of the device id: enough to count unique devices, impossible to trace back
$line = date('Y-m-d') . ',' . $e . ',' . $m . ',' . substr(hash('sha256', $id), 0, 16) . "\n";
$fh = @fopen($file, 'a');
if ($fh) {
  if (flock($fh, LOCK_EX)) { fwrite($fh, $line); flock($fh, LOCK_UN); }
  fclose($fh);
}
http_response_code(204);
