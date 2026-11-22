<?php
// המסדר - which app version the website has, for the Android app's self-update
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Cache-Control: no-store');
$f = __DIR__ . '/version.json';
echo is_file($f) ? file_get_contents($f) : '{}';
