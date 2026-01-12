// YouTube Transcriber App
class YouTubeTranscriber {
    constructor() {
        this.currentVideoId = null;
        this.transcriptData = [];
        this.showTimestamps = true;
        this.videoTitle = '';

        this.initElements();
        this.initEventListeners();
        this.initTheme();
    }

    initElements() {
        // 入力要素
        this.urlInput = document.getElementById('youtubeUrl');
        this.fetchBtn = document.getElementById('fetchBtn');

        // 状態表示
        this.loading = document.getElementById('loading');
        this.error = document.getElementById('error');
        this.errorText = document.getElementById('errorText');

        // 動画情報
        this.videoInfo = document.getElementById('videoInfo');
        this.thumbnail = document.getElementById('thumbnail');
        this.videoTitleEl = document.getElementById('videoTitle');
        this.channelName = document.getElementById('channelName');

        // 言語選択
        this.languageSection = document.getElementById('languageSection');
        this.languageSelect = document.getElementById('languageSelect');

        // 文字起こし
        this.transcriptSection = document.getElementById('transcriptSection');
        this.transcriptContent = document.getElementById('transcriptContent');

        // アクションボタン
        this.copyBtn = document.getElementById('copyBtn');
        this.downloadBtn = document.getElementById('downloadBtn');
        this.timestampToggle = document.getElementById('timestampToggle');

        // その他
        this.themeToggle = document.getElementById('themeToggle');
        this.toast = document.getElementById('toast');
        this.toastMessage = document.getElementById('toastMessage');
    }

    initEventListeners() {
        // URLエンター
        this.urlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.fetchTranscript();
            }
        });

        // ペースト検知
        this.urlInput.addEventListener('paste', () => {
            setTimeout(() => this.fetchTranscript(), 100);
        });

        // 文字起こしボタン
        this.fetchBtn.addEventListener('click', () => this.fetchTranscript());

        // 言語選択
        this.languageSelect.addEventListener('change', (e) => {
            if (e.target.value) {
                this.loadTranscriptByLanguage(e.target.value);
            }
        });

        // コピー
        this.copyBtn.addEventListener('click', () => this.copyTranscript());

        // ダウンロード
        this.downloadBtn.addEventListener('click', () => this.downloadTranscript());

        // タイムスタンプトグル
        this.timestampToggle.addEventListener('click', () => this.toggleTimestamps());

        // テーマトグル
        this.themeToggle.addEventListener('click', () => this.toggleTheme());
    }

    initTheme() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.setAttribute('data-theme', 'dark');
        }
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    }

    extractVideoId(url) {
        const patterns = [
            /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
            /^([a-zA-Z0-9_-]{11})$/
        ];

        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match) {
                return match[1];
            }
        }
        return null;
    }

    showLoading() {
        this.loading.classList.remove('hidden');
        this.error.classList.add('hidden');
        this.videoInfo.classList.add('hidden');
        this.languageSection.classList.add('hidden');
        this.transcriptSection.classList.add('hidden');
        this.fetchBtn.disabled = true;
    }

    hideLoading() {
        this.loading.classList.add('hidden');
        this.fetchBtn.disabled = false;
    }

    showError(message) {
        this.hideLoading();
        this.error.classList.remove('hidden');
        this.errorText.textContent = message;
    }

    async fetchTranscript() {
        const url = this.urlInput.value.trim();

        if (!url) {
            this.showError('URLを入力してください');
            return;
        }

        const videoId = this.extractVideoId(url);

        if (!videoId) {
            this.showError('有効なYouTube URLではありません');
            return;
        }

        this.currentVideoId = videoId;
        this.showLoading();

        try {
            // 動画情報を取得
            await this.fetchVideoInfo(videoId);

            // 字幕を取得
            await this.fetchCaptions(videoId);

            this.hideLoading();
        } catch (err) {
            console.error('Error:', err);
            this.showError(err.message || '字幕の取得に失敗しました');
        }
    }

    async fetchVideoInfo(videoId) {
        // oEmbed API を使用して動画情報を取得
        try {
            const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);

            if (response.ok) {
                const data = await response.json();
                this.videoTitle = data.title;
                this.videoTitleEl.textContent = data.title;
                this.channelName.textContent = data.author_name;
            } else {
                this.videoTitle = `YouTube動画 (${videoId})`;
                this.videoTitleEl.textContent = this.videoTitle;
                this.channelName.textContent = '';
            }
        } catch {
            this.videoTitle = `YouTube動画 (${videoId})`;
            this.videoTitleEl.textContent = this.videoTitle;
            this.channelName.textContent = '';
        }

        // サムネイル設定
        this.thumbnail.src = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
        this.videoInfo.classList.remove('hidden');
    }

    async fetchCaptions(videoId) {
        // 複数のAPIエンドポイントを試行
        const apis = [
            `https://yt.lemnoslife.com/videos?part=snippet&id=${videoId}`,
            `https://inv.nadeko.net/api/v1/videos/${videoId}`,
            `https://invidious.fdn.fr/api/v1/videos/${videoId}`,
            `https://vid.puffyan.us/api/v1/videos/${videoId}`
        ];

        let captionData = null;
        let lastError = null;

        // Invidious APIを試行
        for (const api of apis.slice(1)) {
            try {
                const response = await fetch(api, {
                    headers: { 'Accept': 'application/json' },
                    signal: AbortSignal.timeout(10000)
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.captions && data.captions.length > 0) {
                        captionData = data;
                        break;
                    }
                }
            } catch (err) {
                lastError = err;
                continue;
            }
        }

        if (captionData && captionData.captions) {
            // 言語選択を設定
            this.setupLanguageSelect(captionData.captions);

            // デフォルトで日本語または最初の字幕を読み込む
            const jaCaption = captionData.captions.find(c => c.language_code === 'ja' || c.label.includes('日本語'));
            const defaultCaption = jaCaption || captionData.captions[0];

            if (defaultCaption) {
                this.languageSelect.value = defaultCaption.language_code;
                await this.loadTranscriptFromUrl(defaultCaption.url);
            }
        } else {
            // フォールバック: デモデータまたはエラー表示
            throw new Error('この動画には字幕が見つかりませんでした。字幕が有効な動画を試してください。');
        }
    }

    setupLanguageSelect(captions) {
        this.languageSelect.innerHTML = '<option value="">言語を選択...</option>';

        captions.forEach(caption => {
            const option = document.createElement('option');
            option.value = caption.language_code;
            option.textContent = caption.label || caption.language_code;
            option.dataset.url = caption.url;
            this.languageSelect.appendChild(option);
        });

        this.languageSection.classList.remove('hidden');
    }

    async loadTranscriptByLanguage(languageCode) {
        const option = this.languageSelect.querySelector(`option[value="${languageCode}"]`);
        if (option && option.dataset.url) {
            this.showLoading();
            try {
                await this.loadTranscriptFromUrl(option.dataset.url);
                this.hideLoading();
            } catch (err) {
                this.showError('字幕の読み込みに失敗しました');
            }
        }
    }

    async loadTranscriptFromUrl(url) {
        try {
            const response = await fetch(url, {
                signal: AbortSignal.timeout(10000)
            });

            if (!response.ok) {
                throw new Error('字幕データの取得に失敗しました');
            }

            const text = await response.text();

            // XML形式のパース
            if (text.includes('<?xml') || text.includes('<transcript')) {
                this.parseXMLTranscript(text);
            } else if (text.includes('WEBVTT')) {
                this.parseVTTTranscript(text);
            } else {
                // JSON形式を試行
                try {
                    const json = JSON.parse(text);
                    this.parseJSONTranscript(json);
                } catch {
                    this.parseXMLTranscript(text);
                }
            }

            this.displayTranscript();
        } catch (err) {
            console.error('Transcript load error:', err);
            throw err;
        }
    }

    parseXMLTranscript(xml) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(xml, 'text/xml');
        const textElements = doc.querySelectorAll('text');

        this.transcriptData = Array.from(textElements).map(el => ({
            start: parseFloat(el.getAttribute('start') || 0),
            duration: parseFloat(el.getAttribute('dur') || 0),
            text: this.decodeHTMLEntities(el.textContent || '')
        }));
    }

    parseVTTTranscript(vtt) {
        const lines = vtt.split('\n');
        this.transcriptData = [];

        let i = 0;
        while (i < lines.length) {
            const line = lines[i].trim();

            // タイムスタンプ行を探す
            if (line.includes('-->')) {
                const times = line.split('-->');
                const start = this.parseVTTTime(times[0].trim());

                // テキスト行を取得
                let text = '';
                i++;
                while (i < lines.length && lines[i].trim() !== '') {
                    text += (text ? ' ' : '') + lines[i].trim();
                    i++;
                }

                if (text) {
                    this.transcriptData.push({
                        start: start,
                        duration: 0,
                        text: this.decodeHTMLEntities(text.replace(/<[^>]*>/g, ''))
                    });
                }
            }
            i++;
        }
    }

    parseVTTTime(timeStr) {
        const parts = timeStr.split(':');
        let seconds = 0;

        if (parts.length === 3) {
            seconds = parseFloat(parts[0]) * 3600 + parseFloat(parts[1]) * 60 + parseFloat(parts[2]);
        } else if (parts.length === 2) {
            seconds = parseFloat(parts[0]) * 60 + parseFloat(parts[1]);
        }

        return seconds;
    }

    parseJSONTranscript(json) {
        if (Array.isArray(json)) {
            this.transcriptData = json.map(item => ({
                start: item.start || item.offset || 0,
                duration: item.duration || item.dur || 0,
                text: item.text || item.content || ''
            }));
        } else if (json.events) {
            this.transcriptData = json.events
                .filter(e => e.segs)
                .map(e => ({
                    start: (e.tStartMs || 0) / 1000,
                    duration: (e.dDurationMs || 0) / 1000,
                    text: e.segs.map(s => s.utf8 || '').join('')
                }));
        }
    }

    decodeHTMLEntities(text) {
        const textarea = document.createElement('textarea');
        textarea.innerHTML = text;
        return textarea.value
            .replace(/\\n/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    displayTranscript() {
        if (this.transcriptData.length === 0) {
            this.transcriptContent.innerHTML = `
                <div class="placeholder-text">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                    </svg>
                    <p>字幕データがありません</p>
                </div>
            `;
            return;
        }

        const html = this.transcriptData.map(item => `
            <div class="transcript-item">
                <span class="timestamp">${this.formatTime(item.start)}</span>
                <span class="transcript-text">${this.escapeHTML(item.text)}</span>
            </div>
        `).join('');

        this.transcriptContent.innerHTML = html;
        this.transcriptSection.classList.remove('hidden');

        // タイムスタンプ表示状態を適用
        if (!this.showTimestamps) {
            this.transcriptContent.classList.add('no-timestamps');
        }
    }

    escapeHTML(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    toggleTimestamps() {
        this.showTimestamps = !this.showTimestamps;
        this.timestampToggle.classList.toggle('active', this.showTimestamps);
        this.transcriptContent.classList.toggle('no-timestamps', !this.showTimestamps);
    }

    getPlainText() {
        if (this.showTimestamps) {
            return this.transcriptData
                .map(item => `[${this.formatTime(item.start)}] ${item.text}`)
                .join('\n');
        }
        return this.transcriptData
            .map(item => item.text)
            .join('\n');
    }

    async copyTranscript() {
        if (this.transcriptData.length === 0) {
            this.showToast('コピーするテキストがありません');
            return;
        }

        const text = this.getPlainText();

        try {
            await navigator.clipboard.writeText(text);
            this.showToast('クリップボードにコピーしました');
        } catch {
            // フォールバック
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            this.showToast('クリップボードにコピーしました');
        }
    }

    downloadTranscript() {
        if (this.transcriptData.length === 0) {
            this.showToast('ダウンロードするテキストがありません');
            return;
        }

        const text = this.getPlainText();
        const filename = `${this.sanitizeFilename(this.videoTitle)}_transcript.txt`;

        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showToast('ファイルをダウンロードしました');
    }

    sanitizeFilename(name) {
        return name
            .replace(/[/\\?%*:|"<>]/g, '-')
            .replace(/\s+/g, '_')
            .substring(0, 100);
    }

    showToast(message) {
        this.toastMessage.textContent = message;
        this.toast.classList.remove('hidden');

        setTimeout(() => {
            this.toast.classList.add('hidden');
        }, 3000);
    }
}

// Service Worker 登録
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(() => {
            // Service Worker登録に失敗してもアプリは動作する
        });
    });
}

// アプリ初期化
document.addEventListener('DOMContentLoaded', () => {
    new YouTubeTranscriber();
});
