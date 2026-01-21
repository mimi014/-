@echo off
REM ユアユニ 自動動画制作アプリ - ローカルサーバー起動スクリプト (Windows)

set PORT=8000

echo ==================================
echo ユアユニ 自動動画制作アプリ
echo ==================================
echo.

REM IPアドレスを取得
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do set IP_ADDR=%%a
set IP_ADDR=%IP_ADDR: =%

echo サーバーを起動中...
echo.
echo PC（ブラウザ）でアクセス:
echo   http://localhost:%PORT%/video-creator.html
echo.
echo iPhone/スマホ（同じWi-Fi）でアクセス:
echo   http://%IP_ADDR%:%PORT%/video-creator.html
echo.
echo ==================================
echo サーバーを停止するには Ctrl+C を押してください
echo ==================================
echo.

REM Pythonでサーバーを起動
python -m http.server %PORT%
