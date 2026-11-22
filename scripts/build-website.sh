#!/usr/bin/env bash
# Builds the website package for el-habriut.co.il/hamesader (dist/ -> hamesader-website.zip contents),
# including app/bundle.zip + app/version.json that the Android app downloads to update itself.
set -euo pipefail
export BUILD_ID="${BUILD_ID:-$(date -u +%Y%m%d%H%M%S)}"

# 1. The phone bundle (served from the app's own root "/")
rm -rf dist-app
npx tsc --noEmit
npx vite build --outDir dist-app --emptyOutDir
# server-only files never go into the phone bundle
rm -rf dist-app/api dist-app/app dist-app/admin.php dist-app/sw.js

# 2. The website itself (served from /hamesader/)
rm -rf dist
BASE_PATH=/hamesader/ npx vite build
mkdir -p dist/app
(cd dist-app && zip -qr ../dist/app/bundle.zip .)
printf '{"version":"%s"}\n' "$BUILD_ID" > dist/app/version.json

# 3. The Android app file, downloaded from the site (faster than GitHub for people in Israel)
if [ -f hamesader.apk ]; then
  cp hamesader.apk dist/app/hamesader.apk
else
  curl -fsSL -o dist/app/hamesader.apk https://github.com/sofer770/hamesader/releases/download/latest/hamesader.apk || echo "warning: APK not added"
fi
echo "website built, app version $BUILD_ID"
