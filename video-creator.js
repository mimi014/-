// ユアユニ 自動動画制作アプリ
// YouTube API Key - 実際の使用時は環境変数などで管理してください
const YOUTUBE_API_KEY = 'YOUR_API_KEY_HERE'; // 実際のAPIキーに置き換えてください

// グローバル変数
let currentVideoId = null;
let currentVideoDuration = 0;
let player = null;
let clips = [];

// YouTube URLからビデオIDを抽出
function extractVideoId(url) {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) {
            return match[1];
        }
    }
    return null;
}

// 時間を秒からHH:MM:SS形式に変換
function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

// YouTube動画情報を取得（APIキーが必要）
async function fetchVideoInfo(videoId) {
    // 実際の実装ではYouTube Data APIを使用
    // デモ版ではダミーデータを返す
    showMessage('動画を読み込んでいます...', 'warning');

    // YouTube IFrame Player APIを使用
    return {
        id: videoId,
        title: 'YouTube動画',
        channelName: 'チャンネル名',
        duration: 0 // プレーヤーから取得
    };
}

// メッセージを表示
function showMessage(text, type = 'success') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message message-${type}`;
    messageDiv.textContent = text;

    const videoInfo = document.getElementById('videoInfo');
    videoInfo.insertBefore(messageDiv, videoInfo.firstChild);

    setTimeout(() => {
        messageDiv.remove();
    }, 3000);
}

// YouTube Player APIの読み込み
function loadYouTubeAPI() {
    if (window.YT && window.YT.Player) {
        return Promise.resolve();
    }

    return new Promise((resolve) => {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

        window.onYouTubeIframeAPIReady = () => {
            resolve();
        };
    });
}

// YouTube動画プレーヤーを初期化
async function initializePlayer(videoId) {
    await loadYouTubeAPI();

    const playerDiv = document.getElementById('videoPlayer');
    playerDiv.innerHTML = '';

    player = new YT.Player('videoPlayer', {
        height: '100%',
        width: '100%',
        videoId: videoId,
        playerVars: {
            'controls': 1,
            'modestbranding': 1,
            'rel': 0
        },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
}

function onPlayerReady(event) {
    currentVideoDuration = player.getDuration();
    document.getElementById('endTime').value = Math.floor(currentVideoDuration);
    updateClipDuration();

    // 動画情報を更新
    const videoData = player.getVideoData();
    document.getElementById('videoTitle').textContent = videoData.title || '動画タイトル';
    document.getElementById('channelName').textContent = videoData.author || 'チャンネル名';
    document.getElementById('videoDuration').textContent = formatTime(currentVideoDuration);
    document.getElementById('videoInfo').style.display = 'block';

    showMessage('動画が正常に読み込まれました', 'success');
}

function onPlayerStateChange(event) {
    // プレーヤーの状態変化を処理
}

// クリップの長さを更新
function updateClipDuration() {
    const startTime = parseInt(document.getElementById('startTime').value) || 0;
    const endTime = parseInt(document.getElementById('endTime').value) || 0;
    const duration = Math.max(0, endTime - startTime);
    document.getElementById('clipDuration').textContent = `${duration}秒 (${formatTime(duration)})`;
}

// クリップを追加
function addClip() {
    const startTime = parseInt(document.getElementById('startTime').value) || 0;
    const endTime = parseInt(document.getElementById('endTime').value) || 0;

    if (startTime >= endTime) {
        showMessage('終了時間は開始時間より後である必要があります', 'error');
        return;
    }

    const duration = endTime - startTime;
    if (duration < 300) { // 5分以上
        showMessage('クリップは5分（300秒）以上である必要があります', 'warning');
    }

    const clip = {
        id: Date.now(),
        startTime,
        endTime,
        duration
    };

    clips.push(clip);
    renderClips();
    showMessage('クリップが追加されました', 'success');
}

// クリップリストをレンダリング
function renderClips() {
    const clipItems = document.getElementById('clipItems');

    if (clips.length === 0) {
        clipItems.innerHTML = '<p style="color: #888;">まだクリップが追加されていません</p>';
        return;
    }

    clipItems.innerHTML = clips.map((clip, index) => `
        <div class="clip-item" data-clip-id="${clip.id}">
            <div class="clip-item-info">
                <strong>クリップ ${index + 1}</strong><br>
                開始: ${formatTime(clip.startTime)} | 終了: ${formatTime(clip.endTime)} | 長さ: ${formatTime(clip.duration)}
            </div>
            <div class="clip-item-actions">
                <button class="btn btn-secondary" onclick="seekToClip(${clip.startTime})">再生</button>
                <button class="btn btn-danger" onclick="removeClip(${clip.id})">削除</button>
            </div>
        </div>
    `).join('');
}

// クリップの位置にシーク
function seekToClip(time) {
    if (player && player.seekTo) {
        player.seekTo(time, true);
        player.playVideo();
    }
}

// クリップを削除
function removeClip(clipId) {
    clips = clips.filter(clip => clip.id !== clipId);
    renderClips();
    showMessage('クリップが削除されました', 'success');
}

// すべての入力を検証
function validateInputs() {
    const errors = [];

    if (!currentVideoId) {
        errors.push('YouTube動画を読み込んでください');
    }

    if (clips.length === 0) {
        errors.push('少なくとも1つのクリップを追加してください');
    }

    const title = document.getElementById('clipTitle').value.trim();
    if (!title) {
        errors.push('動画タイトルを入力してください');
    }

    const description = document.getElementById('clipDescription').value.trim();
    if (!description) {
        errors.push('動画の説明を入力してください');
    }

    const channelName = document.getElementById('yourChannelName').value.trim();
    if (!channelName) {
        errors.push('チャンネル名を入力してください');
    }

    // 禁止事項のチェック
    const ruleChecks = document.querySelectorAll('.rule-check');
    const allChecked = Array.from(ruleChecks).every(check => check.checked);
    if (!allChecked) {
        errors.push('すべての禁止事項を確認してチェックしてください');
    }

    return errors;
}

// JSONを生成
function generateJSON() {
    const errors = validateInputs();
    if (errors.length > 0) {
        showMessage('エラー: ' + errors.join(', '), 'error');
        return;
    }

    const data = {
        videoId: currentVideoId,
        videoUrl: `https://www.youtube.com/watch?v=${currentVideoId}`,
        videoTitle: document.getElementById('videoTitle').textContent,
        channelName: document.getElementById('channelName').textContent,
        clips: clips.map((clip, index) => ({
            clipNumber: index + 1,
            startTime: clip.startTime,
            endTime: clip.endTime,
            duration: clip.duration,
            startTimeFormatted: formatTime(clip.startTime),
            endTimeFormatted: formatTime(clip.endTime),
            durationFormatted: formatTime(clip.duration)
        })),
        metadata: {
            title: document.getElementById('clipTitle').value.trim(),
            description: document.getElementById('clipDescription').value.trim(),
            yourChannelName: document.getElementById('yourChannelName').value.trim(),
            commentEnabled: document.getElementById('commentEnabled').checked,
            category: document.getElementById('videoCategory').value
        },
        createdAt: new Date().toISOString()
    };

    displayOutput(JSON.stringify(data, null, 2));
}

// スクリプトを生成（yt-dlpやffmpegコマンド）
function generateScript() {
    const errors = validateInputs();
    if (errors.length > 0) {
        showMessage('エラー: ' + errors.join(', '), 'error');
        return;
    }

    const videoUrl = `https://www.youtube.com/watch?v=${currentVideoId}`;
    const title = document.getElementById('clipTitle').value.trim();

    let script = `#!/bin/bash
# ユアユニ 動画クリッピングスクリプト
# 生成日時: ${new Date().toLocaleString('ja-JP')}

VIDEO_URL="${videoUrl}"
OUTPUT_DIR="./output"

# 出力ディレクトリを作成
mkdir -p "$OUTPUT_DIR"

echo "動画をダウンロード中..."
# yt-dlpで動画をダウンロード
yt-dlp -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best" \\
    -o "$OUTPUT_DIR/original.mp4" \\
    "$VIDEO_URL"

if [ $? -ne 0 ]; then
    echo "エラー: 動画のダウンロードに失敗しました"
    exit 1
fi

echo "クリップを作成中..."

`;

    clips.forEach((clip, index) => {
        const outputFile = `clip_${index + 1}_${clip.startTime}-${clip.endTime}.mp4`;
        script += `
# クリップ ${index + 1}: ${formatTime(clip.startTime)} - ${formatTime(clip.endTime)}
ffmpeg -i "$OUTPUT_DIR/original.mp4" \\
    -ss ${clip.startTime} \\
    -t ${clip.duration} \\
    -c:v libx264 -crs 23 \\
    -c:a aac -b:a 128k \\
    -y "$OUTPUT_DIR/${outputFile}"

if [ $? -eq 0 ]; then
    echo "✓ クリップ ${index + 1} を作成しました: ${outputFile}"
else
    echo "✗ クリップ ${index + 1} の作成に失敗しました"
fi
`;
    });

    script += `
echo "すべてのクリップの作成が完了しました"
echo "出力先: $OUTPUT_DIR"

# 動画情報を保存
cat > "$OUTPUT_DIR/metadata.txt" << EOF
タイトル: ${title}
説明: ${document.getElementById('clipDescription').value.trim().split('\n').join('\n')}
チャンネル名: ${document.getElementById('yourChannelName').value.trim()}
元動画URL: ${videoUrl}
作成日時: ${new Date().toLocaleString('ja-JP')}
EOF

echo "メタデータを保存しました: $OUTPUT_DIR/metadata.txt"
`;

    displayOutput(script);
}

// 出力を表示
function displayOutput(content) {
    const outputSection = document.getElementById('outputSection');
    const outputContent = document.getElementById('outputContent');

    outputContent.textContent = content;
    outputSection.style.display = 'block';

    // 出力セクションまでスクロール
    outputSection.scrollIntoView({ behavior: 'smooth' });
}

// クリップボードにコピー
function copyToClipboard() {
    const content = document.getElementById('outputContent').textContent;

    navigator.clipboard.writeText(content).then(() => {
        showMessage('クリップボードにコピーしました', 'success');
    }).catch(err => {
        showMessage('コピーに失敗しました', 'error');
    });
}

// リセット
function resetAll() {
    if (!confirm('すべての入力内容をリセットしますか？')) {
        return;
    }

    // フォームをリセット
    document.getElementById('videoUrl').value = '';
    document.getElementById('clipTitle').value = '';
    document.getElementById('clipDescription').value = '';
    document.getElementById('yourChannelName').value = '';
    document.getElementById('startTime').value = 0;
    document.getElementById('endTime').value = 0;

    // プレーヤーをクリア
    if (player) {
        player.destroy();
        player = null;
    }
    document.getElementById('videoPlayer').innerHTML = '';
    document.getElementById('videoInfo').style.display = 'none';

    // クリップをクリア
    clips = [];
    renderClips();

    // 出力をクリア
    document.getElementById('outputSection').style.display = 'none';

    // チェックボックスをクリア
    document.querySelectorAll('.rule-check').forEach(check => check.checked = false);

    currentVideoId = null;
    currentVideoDuration = 0;

    showMessage('リセットしました', 'success');
}

// イベントリスナーを設定
document.addEventListener('DOMContentLoaded', () => {
    // 動画読み込みボタン
    document.getElementById('loadVideoBtn').addEventListener('click', async () => {
        const url = document.getElementById('videoUrl').value.trim();
        const videoId = extractVideoId(url);

        if (!videoId) {
            showMessage('有効なYouTube URLを入力してください', 'error');
            return;
        }

        currentVideoId = videoId;
        await initializePlayer(videoId);
    });

    // 開始時間設定ボタン
    document.getElementById('setStartBtn').addEventListener('click', () => {
        if (player && player.getCurrentTime) {
            const currentTime = Math.floor(player.getCurrentTime());
            document.getElementById('startTime').value = currentTime;
            updateClipDuration();
        }
    });

    // 終了時間設定ボタン
    document.getElementById('setEndBtn').addEventListener('click', () => {
        if (player && player.getCurrentTime) {
            const currentTime = Math.floor(player.getCurrentTime());
            document.getElementById('endTime').value = currentTime;
            updateClipDuration();
        }
    });

    // 時間入力の変更を監視
    document.getElementById('startTime').addEventListener('input', updateClipDuration);
    document.getElementById('endTime').addEventListener('input', updateClipDuration);

    // クリップ追加ボタン
    document.getElementById('addClipBtn').addEventListener('click', addClip);

    // JSON生成ボタン
    document.getElementById('generateJsonBtn').addEventListener('click', generateJSON);

    // スクリプト生成ボタン
    document.getElementById('generateScriptBtn').addEventListener('click', generateScript);

    // コピーボタン
    document.getElementById('copyOutputBtn').addEventListener('click', copyToClipboard);

    // リセットボタン
    document.getElementById('resetBtn').addEventListener('click', resetAll);

    // 初期表示
    renderClips();
});
