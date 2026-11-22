<?php
// Short download link: el-habriut.co.il/hamesader/apk -> the Android app file
header('Cache-Control: no-store');
header('Location: ../app/hamesader.apk', true, 302);
