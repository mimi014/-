#!/bin/bash
# ユアユニ 自動動画制作アプリ - ローカルサーバー起動スクリプト

PORT=8000

echo "=================================="
echo "ユアユニ 自動動画制作アプリ"
echo "=================================="
echo ""

# IPアドレスを取得
if command -v ipconfig &> /dev/null; then
    # Windows
    IP_ADDR=$(ipconfig | grep -oP '(?<=IPv4.*: )\S+' | head -1)
elif command -v ip &> /dev/null; then
    # Linux
    IP_ADDR=$(ip route get 1 | awk '{print $(NF-2);exit}')
elif command -v ifconfig &> /dev/null; then
    # macOS
    IP_ADDR=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)
else
    IP_ADDR="localhost"
fi

echo "サーバーを起動中..."
echo ""
echo "PC（ブラウザ）でアクセス:"
echo "  http://localhost:$PORT/video-creator.html"
echo ""
echo "iPhone/スマホ（同じWi-Fi）でアクセス:"
echo "  http://$IP_ADDR:$PORT/video-creator.html"
echo ""
echo "=================================="
echo "サーバーを停止するには Ctrl+C を押してください"
echo "=================================="
echo ""

# Pythonでサーバーを起動
if command -v python3 &> /dev/null; then
    python3 -m http.server $PORT
elif command -v python &> /dev/null; then
    python -m http.server $PORT
else
    echo "エラー: Pythonがインストールされていません"
    echo "Python 3をインストールしてください"
    exit 1
fi
