<?php
/**
 * המסדר - דף מנהל: כמה נכנסו וכמה התקינו, לפי ימים.
 * הסיסמה נשמרת מוצפנת ב-api/data/admin.json (התיקייה חסומה לגישה מהדפדפן).
 */
session_start();
date_default_timezone_set('Asia/Jerusalem');
header('Cache-Control: no-store');
header('X-Robots-Tag: noindex');

$dataDir = __DIR__ . '/api/data';
$cfgFile = $dataDir . '/admin.json';
$cfg = is_file($cfgFile) ? json_decode(file_get_contents($cfgFile), true) : null;
$error = '';

if (isset($_GET['logout'])) { session_destroy(); header('Location: admin.php'); exit; }

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['password'])) {
  usleep(400000); // slow down guessing
  if ($cfg && password_verify($_POST['password'], $cfg['hash'] ?? '')) {
    session_regenerate_id(true);
    $_SESSION['hamesader_admin'] = true;
    header('Location: admin.php'); exit;
  }
  $error = 'סיסמה שגויה';
}
$authed = !empty($_SESSION['hamesader_admin']);

function h($s) { return htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8'); }

/* ---------- read the statistics ---------- */
$range = in_array((int)($_GET['d'] ?? 30), [7, 30, 90, 365], true) ? (int)($_GET['d'] ?? 30) : 30;
$days = [];
for ($k = $range - 1; $k >= 0; $k--) {
  $days[date('Y-m-d', strtotime("-$k day"))] = ['visit' => [], 'install' => [], 'open' => [], 'install_android' => [], 'install_pwa' => []];
}
// Fixed periods: today, this week (from Sunday), this calendar month
$todayStr = date('Y-m-d');
$weekStart = date('Y-m-d', strtotime('-' . (int)date('w') . ' day'));
$monthStart = date('Y-m-01');
$periods = ['today' => $todayStr, 'week' => $weekStart, 'month' => $monthStart];
$per = [];
foreach ($periods as $k => $_) $per[$k] = ['visit' => [], 'install' => []];
$allVisitors = []; $rangeVisitors = []; $installsAll = ['android' => [], 'pwa' => []]; $rangeInstalls = ['android' => [], 'pwa' => []];
if ($authed) {
  foreach (glob($dataDir . '/events-*.csv') ?: [] as $f) {
    $fh = fopen($f, 'r');
    if (!$fh) continue;
    while (($line = fgets($fh)) !== false) {
      $p = explode(',', trim($line));
      if (count($p) < 4) continue;
      [$date, $e, $m, $id] = $p;
      if ($e === 'visit') $allVisitors[$id] = 1;
      if ($e === 'install' && isset($installsAll[$m])) $installsAll[$m][$id] = 1;
      if ($e === 'visit' || $e === 'install') {
        foreach ($periods as $k => $from) if ($date >= $from && $date <= $todayStr) $per[$k][$e][$id] = 1;
      }
      if (!isset($days[$date])) continue;
      $days[$date][$e][$id] = 1;
      if ($e === 'visit') $rangeVisitors[$id] = 1;
      if ($e === 'install' && isset($rangeInstalls[$m])) { $days[$date]['install_' . $m][$id] = 1; $rangeInstalls[$m][$id] = 1; }
    }
    fclose($fh);
  }
}
$rows = [];
foreach ($days as $d => $v) {
  $rows[] = ['date' => $d, 'visits' => count($v['visit']), 'installs' => count($v['install']), 'android' => count($v['install_android']), 'pwa' => count($v['install_pwa']), 'opens' => count($v['open'])];
}
$max = max(1, ...array_map(fn($r) => max($r['visits'], $r['installs']), $rows));
$today = end($rows);
$heDays = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
?>
<!doctype html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>המסדר - ניהול</title>
<link rel="icon" href="icons/icon-32.png">
<link href="https://fonts.googleapis.com/css2?family=Assistant:wght@400;600;700&family=Rubik:wght@600;700&display=swap" rel="stylesheet">
<style>
  :root { --bg:#FBF8F3; --surface:#fff; --ink:#1E1B2E; --muted:#6B6780; --line:#ECE6DC; --brand:#3B2E8A; --brand-soft:#ECE9FB; --done:#268452; --done-soft:#E2F3E9; }
  * { box-sizing: border-box; }
  body { margin:0; background:var(--bg); color:var(--ink); font-family:Assistant, system-ui, sans-serif; font-size:16px; }
  .wrap { max-width: 920px; margin: 0 auto; padding: 20px 16px 40px; }
  h1 { font-family: Rubik, sans-serif; font-size: 26px; margin: 0; }
  header { display:flex; align-items:center; gap:12px; margin-bottom: 18px; }
  header img { width:48px; height:48px; border-radius:14px; }
  header .sp { flex:1; }
  a { color: var(--brand); font-weight:600; }
  .card { background:var(--surface); border:1px solid var(--line); border-radius:22px; padding:16px; box-shadow:0 2px 10px rgba(30,27,46,.04); margin-bottom:14px; }
  .stats { display:grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap:10px; margin-bottom:14px; }
  .stat { background:var(--surface); border:1px solid var(--line); border-radius:18px; padding:14px; }
  .stat b { display:block; font-family:Rubik, sans-serif; font-size:30px; color:var(--brand); font-variant-numeric: tabular-nums; }
  .stat.g b { color: var(--done); }
  .stat span { color: var(--muted); font-size: 14px; }
  .tabs { display:flex; gap:6px; flex-wrap:wrap; margin-bottom: 14px; }
  .tabs a { text-decoration:none; padding:7px 14px; border-radius:999px; background:#F2EEE7; color:var(--muted); font-size:14px; }
  .tabs a.on { background: var(--brand); color:#fff; }
  .chart { display:flex; align-items:flex-end; gap:3px; height:180px; padding-top:10px; direction: ltr; }
  .col { flex:1; display:flex; align-items:flex-end; gap:1px; height:100%; position:relative; min-width: 4px; }
  .bar { flex:1; border-radius:4px 4px 0 0; min-height: 0; }
  .bar.v { background: #8F84E0; } .bar.i { background: var(--done); }
  .legend { display:flex; gap:16px; font-size:14px; color:var(--muted); margin-top:10px; }
  .legend i { display:inline-block; width:12px; height:12px; border-radius:3px; margin-inline-end:6px; vertical-align:-1px; }
  table { width:100%; border-collapse:collapse; font-size:15px; font-variant-numeric: tabular-nums; }
  th, td { padding:9px 6px; text-align:center; border-bottom:1px solid var(--line); }
  th { color:var(--muted); font-weight:600; font-size:13px; }
  td:first-child, th:first-child { text-align:start; }
  tr.zero td { color:#B5B0C2; }
  .login { max-width:360px; margin: 12vh auto 0; text-align:center; }
  .login input { width:100%; height:48px; border-radius:14px; border:1px solid var(--line); padding:0 14px; font-size:17px; font-family:inherit; margin: 14px 0 10px; }
  .btn { width:100%; height:48px; border:0; border-radius:14px; background:var(--brand); color:#fff; font-size:17px; font-weight:700; font-family:inherit; cursor:pointer; }
  .err { color:#C0392B; font-weight:600; }
  .note { color:var(--muted); font-size:14px; line-height:1.6; }
  .scroll { overflow-x:auto; }
  table.sum td { font-size:17px; } table.sum b { font-family:Rubik, sans-serif; font-size:24px; color:var(--brand); } table.sum td.g b { color:var(--done); }
</style>
</head>
<body>
<div class="wrap">
<?php if (!$cfg): ?>
  <div class="card login"><h1>הדף עוד לא מוגדר</h1><p class="note">חסר הקובץ api/data/admin.json. צריך להעלות את קובץ האתר המלא.</p></div>
<?php elseif (!$authed): ?>
  <form class="card login" method="post">
    <img src="icons/icon-96.png" width="72" height="72" alt="" style="border-radius:20px">
    <h1>ניהול המסדר</h1>
    <input type="password" name="password" placeholder="סיסמה" autofocus required autocomplete="current-password">
    <?php if ($error): ?><p class="err"><?= h($error) ?></p><?php endif; ?>
    <button class="btn">כניסה</button>
  </form>
<?php else: ?>
  <header>
    <img src="icons/icon-96.png" alt="">
    <div class="sp"><h1>ניהול המסדר</h1><div class="note">כניסות והתקנות לפי ימים</div></div>
    <a href="?logout=1">יציאה</a>
  </header>

  <div class="card scroll">
    <table class="sum">
      <thead><tr><th></th><th>התקינו</th><th>נכנסו</th></tr></thead>
      <tbody>
      <?php foreach (['today' => 'היום', 'week' => 'השבוע (מיום ראשון)', 'month' => 'החודש (' . date('m/Y') . ')'] as $k => $l): ?>
        <tr><td><?= h($l) ?></td><td class="g"><b><?= count($per[$k]['install']) ?></b></td><td><b><?= count($per[$k]['visit']) ?></b></td></tr>
      <?php endforeach; ?>
        <tr><td>מאז ההתחלה</td><td class="g"><b><?= count($installsAll['android']) + count($installsAll['pwa']) ?></b> <span class="note">(<?= count($installsAll['android']) ?> אנדרואיד, <?= count($installsAll['pwa']) ?> מהאתר)</span></td><td><b><?= count($allVisitors) ?></b></td></tr>
      </tbody>
    </table>
  </div>

  <div class="stats">
    <div class="stat"><b><?= count($rangeVisitors) ?></b><span>נכנסו ב-<?= $range ?> הימים האחרונים</span></div>
    <div class="stat g"><b><?= count($rangeInstalls['android']) + count($rangeInstalls['pwa']) ?></b><span>התקינו ב-<?= $range ?> הימים האחרונים</span></div>
  </div>

  <nav class="tabs">
    <?php foreach ([7 => 'שבוע', 30 => 'חודש', 90 => '3 חודשים', 365 => 'שנה'] as $n => $l): ?>
      <a href="?d=<?= $n ?>" class="<?= $n === $range ? 'on' : '' ?>"><?= $l ?></a>
    <?php endforeach; ?>
  </nav>

  <div class="card">
    <div class="chart" aria-label="גרף כניסות והתקנות לפי ימים">
      <?php foreach ($rows as $r): ?>
        <div class="col" title="<?= h(date('d/m', strtotime($r['date']))) ?>: <?= $r['visits'] ?> נכנסו, <?= $r['installs'] ?> התקינו">
          <div class="bar v" style="height:<?= round($r['visits'] / $max * 100, 1) ?>%"></div>
          <div class="bar i" style="height:<?= round($r['installs'] / $max * 100, 1) ?>%"></div>
        </div>
      <?php endforeach; ?>
    </div>
    <div class="legend"><span><i style="background:#8F84E0"></i>נכנסו</span><span><i style="background:var(--done)"></i>התקינו</span></div>
  </div>

  <div class="card scroll">
    <table>
      <thead><tr><th>תאריך</th><th>נכנסו</th><th>התקינו</th><th>מתוכם אנדרואיד</th><th>מתוכם מהאתר</th><th>פתחו את האפליקציה המותקנת</th></tr></thead>
      <tbody>
      <?php foreach (array_reverse($rows) as $r): $t = strtotime($r['date']); ?>
        <tr class="<?= $r['visits'] + $r['installs'] + $r['opens'] === 0 ? 'zero' : '' ?>">
          <td>יום <?= $heDays[(int)date('w', $t)] ?>, <?= date('d/m/Y', $t) ?></td>
          <td><?= $r['visits'] ?></td><td><b><?= $r['installs'] ?></b></td><td><?= $r['android'] ?></td><td><?= $r['pwa'] ?></td><td><?= $r['opens'] ?></td>
        </tr>
      <?php endforeach; ?>
      </tbody>
    </table>
  </div>

  <p class="note">
    "נכנסו" = מכשירים שונים שפתחו את המסדר באותו יום (כל מכשיר נספר פעם אחת ביום).
    "התקינו" = מכשירים שהתקינו את האפליקציה, מהאתר או מקובץ האנדרואיד.
    לא נשמרים שמות, טלפונים או כתובות IP, רק מספר מכשיר אקראי ומוצפן.
  </p>
<?php endif; ?>
</div>
</body>
</html>
