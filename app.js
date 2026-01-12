// YouTube文字起こしアプリケーション

// DOM要素の取得
const youtubeUrlInput = document.getElementById('youtubeUrl');
const transcribeBtn = document.getElementById('transcribeBtn');
const sourceLanguageSelect = document.getElementById('sourceLanguage');
const translateToSelect = document.getElementById('translateTo');
const generateSummaryCheckbox = document.getElementById('generateSummary');
const speakerDetectionCheckbox = document.getElementById('speakerDetection');

// 進捗セクション
const progressSection = document.getElementById('progressSection');
const progressPercent = document.getElementById('progressPercent');
const progressFill = document.getElementById('progressFill');
const progressStatus = document.getElementById('progressStatus');

// 結果セクション
const resultSection = document.getElementById('resultSection');
const videoThumbnail = document.getElementById('videoThumbnail');
const videoTitle = document.getElementById('videoTitle');
const videoDuration = document.getElementById('videoDuration');
const videoChannel = document.getElementById('videoChannel');
const summarySection = document.getElementById('summarySection');
const summaryContent = document.getElementById('summaryContent');
const translationSection = document.getElementById('translationSection');
const translationContent = document.getElementById('translationContent');
const transcriptContent = document.getElementById('transcriptContent');
const timestampContent = document.getElementById('timestampContent');

// エクスポートボタン
const exportTxtBtn = document.getElementById('exportTxt');
const exportPdfBtn = document.getElementById('exportPdf');
const exportDocxBtn = document.getElementById('exportDocx');
const copyTextBtn = document.getElementById('copyText');

// 設定
const API_BASE_URL = 'http://localhost:5000/api';

// グローバル変数
let currentTranscript = null;

// YouTube URLの検証
function isValidYouTubeUrl(url) {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
    return youtubeRegex.test(url);
}

// YouTube動画IDの抽出
function extractVideoId(url) {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : null;
}

// 進捗の更新
function updateProgress(percent, status) {
    progressPercent.textContent = `${percent}%`;
    progressFill.style.width = `${percent}%`;
    progressStatus.textContent = status;
}

// 進捗セクションの表示/非表示
function showProgress() {
    progressSection.style.display = 'block';
    resultSection.style.display = 'none';
    updateProgress(0, '準備中...');
}

function hideProgress() {
    progressSection.style.display = 'none';
}

// 結果セクションの表示
function showResult() {
    resultSection.style.display = 'block';
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// 時間のフォーマット（秒 → MM:SS）
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// タイムスタンプ付きテキストの生成
function generateTimestampHTML(segments, speakerDetection) {
    let html = '';

    segments.forEach((segment, index) => {
        const timestamp = formatTime(segment.start);
        const speaker = speakerDetection && segment.speaker ? segment.speaker : null;

        html += `
            <div class="timestamp-item">
                <span class="timestamp" data-time="${segment.start}">${timestamp}</span>
                ${speaker ? `<span class="speaker">${speaker}</span>` : ''}
                <span class="text">${segment.text}</span>
            </div>
        `;
    });

    return html;
}

// 文字起こしの実行
async function transcribeVideo() {
    const url = youtubeUrlInput.value.trim();

    // URL検証
    if (!url) {
        alert('YouTubeのURLを入力してください');
        return;
    }

    if (!isValidYouTubeUrl(url)) {
        alert('有効なYouTubeのURLを入力してください');
        return;
    }

    const videoId = extractVideoId(url);
    if (!videoId) {
        alert('YouTube動画IDを取得できませんでした');
        return;
    }

    // ボタンを無効化
    transcribeBtn.disabled = true;
    showProgress();

    try {
        // オプションの準備
        const options = {
            videoUrl: url,
            videoId: videoId,
            sourceLanguage: sourceLanguageSelect.value,
            translateTo: translateToSelect.value,
            generateSummary: generateSummaryCheckbox.checked,
            speakerDetection: speakerDetectionCheckbox.checked
        };

        // デモモード: バックエンドがない場合はダミーデータを使用
        const useDemoMode = true; // バックエンドが準備できたらfalseに変更

        if (useDemoMode) {
            // デモデータの生成
            updateProgress(20, '動画情報を取得中...');
            await sleep(1000);

            updateProgress(40, '音声を抽出中...');
            await sleep(1500);

            updateProgress(60, '文字起こし中...');
            await sleep(2000);

            if (options.generateSummary) {
                updateProgress(80, '要約を生成中...');
                await sleep(1000);
            }

            if (options.translateTo !== 'none') {
                updateProgress(90, '翻訳中...');
                await sleep(1000);
            }

            updateProgress(100, '完了');

            // ダミーデータの表示
            displayDemoResults(videoId, options);
        } else {
            // 実際のAPIコール
            const response = await fetch(`${API_BASE_URL}/transcribe`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(options)
            });

            if (!response.ok) {
                throw new Error('文字起こしに失敗しました');
            }

            const data = await response.json();
            displayResults(data);
        }

    } catch (error) {
        console.error('エラー:', error);
        alert(`エラーが発生しました: ${error.message}`);
    } finally {
        transcribeBtn.disabled = false;
        hideProgress();
    }
}

// デモ結果の表示
function displayDemoResults(videoId, options) {
    // 動画情報の設定
    videoThumbnail.src = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
    videoTitle.textContent = 'サンプル動画タイトル - YouTube文字起こしデモ';
    videoDuration.textContent = '時間: 5:30';
    videoChannel.textContent = 'チャンネル: デモチャンネル';

    // ダミーの文字起こしデータ
    const dummySegments = [
        { start: 0, text: 'こんにちは、今日は文字起こしについてお話しします。', speaker: 'スピーカー 1' },
        { start: 5, text: 'YouTube動画を自動的にテキストに変換することができます。', speaker: 'スピーカー 1' },
        { start: 12, text: 'このツールはAI技術を使用して、高精度な文字起こしを実現します。', speaker: 'スピーカー 1' },
        { start: 20, text: '複数の言語に対応しており、日本語、英語、中国語など99言語以上で利用可能です。', speaker: 'スピーカー 1' },
        { start: 30, text: 'さらに、要約機能や翻訳機能も搭載しています。', speaker: 'スピーカー 2' },
        { start: 37, text: 'これにより、長時間の動画も素早く内容を把握できます。', speaker: 'スピーカー 2' },
        { start: 45, text: 'エクスポート機能では、TXT、PDF、DOCX形式でダウンロードできます。', speaker: 'スピーカー 1' },
        { start: 53, text: 'ぜひこのツールを活用して、効率的な作業を実現してください。', speaker: 'スピーカー 1' }
    ];

    currentTranscript = {
        fullText: dummySegments.map(s => s.text).join(' '),
        segments: dummySegments,
        videoInfo: {
            title: 'サンプル動画タイトル - YouTube文字起こしデモ',
            duration: 330,
            channel: 'デモチャンネル'
        }
    };

    // 文字起こしテキストの表示
    transcriptContent.textContent = currentTranscript.fullText;

    // タイムスタンプ付きテキストの表示
    timestampContent.innerHTML = generateTimestampHTML(
        dummySegments,
        options.speakerDetection
    );

    // 要約の表示
    if (options.generateSummary) {
        summarySection.style.display = 'block';
        summaryContent.textContent =
            'この動画では、YouTube動画の文字起こしツールについて紹介しています。' +
            'AI技術を活用した高精度な文字起こし機能、99言語以上の多言語対応、' +
            '要約・翻訳機能、そして複数形式でのエクスポート機能について説明されています。';
    } else {
        summarySection.style.display = 'none';
    }

    // 翻訳の表示
    if (options.translateTo !== 'none') {
        translationSection.style.display = 'block';
        const translations = {
            'en': 'Hello, today I will talk about transcription. You can automatically convert YouTube videos to text. This tool uses AI technology to achieve high-precision transcription. It supports multiple languages and can be used in over 99 languages including Japanese, English, and Chinese.',
            'zh': '你好，今天我将谈论转录。您可以自动将YouTube视频转换为文本。该工具使用AI技术实现高精度转录。它支持多种语言，可以在包括日语、英语和中文在内的99种以上语言中使用。',
            'ja': currentTranscript.fullText
        };
        translationContent.textContent = translations[options.translateTo] || translations['en'];
    } else {
        translationSection.style.display = 'none';
    }

    showResult();
}

// 実際のAPIレスポンスの表示
function displayResults(data) {
    // 実際のバックエンドからのデータを表示する処理
    // この関数はバックエンド実装後に完成させます
    console.log('API Response:', data);
}

// スリープ関数（デモ用）
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// エクスポート機能
function exportAsText() {
    if (!currentTranscript) {
        alert('文字起こし結果がありません');
        return;
    }

    const text = currentTranscript.fullText;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transcript.txt';
    a.click();
    URL.revokeObjectURL(url);
}

function exportAsPDF() {
    if (!currentTranscript) {
        alert('文字起こし結果がありません');
        return;
    }

    // PDF生成にはライブラリ（jsPDF）が必要
    // ここではアラートで通知
    alert('PDF エクスポート機能は準備中です。バックエンドサーバーで実装されます。');
}

function exportAsDocx() {
    if (!currentTranscript) {
        alert('文字起こし結果がありません');
        return;
    }

    // DOCX生成にはライブラリ（docx）が必要
    alert('DOCX エクスポート機能は準備中です。バックエンドサーバーで実装されます。');
}

function copyToClipboard() {
    if (!currentTranscript) {
        alert('文字起こし結果がありません');
        return;
    }

    navigator.clipboard.writeText(currentTranscript.fullText).then(() => {
        // 一時的にボタンテキストを変更
        const originalText = copyTextBtn.innerHTML;
        copyTextBtn.innerHTML = '<span>✓ コピーしました</span>';
        copyTextBtn.style.background = 'rgba(16, 185, 129, 0.2)';

        setTimeout(() => {
            copyTextBtn.innerHTML = originalText;
            copyTextBtn.style.background = '';
        }, 2000);
    }).catch(err => {
        alert('コピーに失敗しました');
        console.error('コピーエラー:', err);
    });
}

// イベントリスナーの設定
transcribeBtn.addEventListener('click', transcribeVideo);

// Enterキーで文字起こしを開始
youtubeUrlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        transcribeVideo();
    }
});

// エクスポートボタン
exportTxtBtn.addEventListener('click', exportAsText);
exportPdfBtn.addEventListener('click', exportAsPDF);
exportDocxBtn.addEventListener('click', exportAsDocx);
copyTextBtn.addEventListener('click', copyToClipboard);

// タイムスタンプクリックイベント（動画の該当位置にジャンプ - 将来の拡張用）
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('timestamp')) {
        const time = e.target.getAttribute('data-time');
        console.log(`タイムスタンプクリック: ${time}秒`);
        // ここでYouTube埋め込みプレーヤーがあれば、該当位置にシークする処理を追加
    }
});

// 初期化
console.log('YouTube文字起こしアプリ initialized');
