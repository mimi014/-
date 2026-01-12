# YouTube 文字起こしシステム

AIを活用した高精度なYouTube動画文字起こしツールです。OpenAI Whisper APIを使用して、99言語以上に対応した文字起こし、要約生成、翻訳機能を提供します。

## 主な機能

- **高精度文字起こし**: OpenAI Whisper APIによる99言語以上対応
- **話者識別**: 複数の話者を自動検出・識別
- **自動要約**: AIによる文字起こし内容の要約生成
- **翻訳機能**: 134言語以上への瞬時翻訳
- **エクスポート**: TXT、PDF、DOCX形式でダウンロード可能
- **タイムスタンプ**: 各セグメントのタイムスタンプ付き表示

## 技術スタック

### フロントエンド
- HTML5
- CSS3 (モダンなレスポンシブデザイン)
- Vanilla JavaScript

### バックエンド
- Python 3.8+
- Flask (Webフレームワーク)
- yt-dlp (YouTube動画処理)
- OpenAI Whisper API (文字起こし)
- OpenAI GPT-4 (要約・翻訳)
- ReportLab (PDF生成)
- python-docx (DOCX生成)

## セットアップ手順

### 1. 前提条件

- Python 3.8以上
- pip (Pythonパッケージマネージャー)
- ffmpeg (音声処理用)
- OpenAI APIキー

#### ffmpegのインストール

**macOS:**
```bash
brew install ffmpeg
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install ffmpeg
```

**Windows:**
[ffmpeg公式サイト](https://ffmpeg.org/download.html)からダウンロードしてインストール

### 2. リポジトリのクローン

```bash
git clone <repository-url>
cd <repository-name>
```

### 3. Python仮想環境の作成

```bash
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
```

### 4. 依存関係のインストール

```bash
pip install -r requirements.txt
```

### 5. 環境変数の設定

`.env.example`をコピーして`.env`ファイルを作成：

```bash
cp .env.example .env
```

`.env`ファイルを編集してOpenAI APIキーを設定：

```env
OPENAI_API_KEY=your_actual_api_key_here
```

**OpenAI APIキーの取得方法:**
1. [OpenAI Platform](https://platform.openai.com/)にアクセス
2. アカウントを作成/ログイン
3. [API Keys](https://platform.openai.com/api-keys)ページでAPIキーを生成

### 6. サーバーの起動

#### バックエンドサーバー（Flask）

```bash
python app.py
```

サーバーは `http://localhost:5000` で起動します。

#### フロントエンド

バックエンドが起動している状態で、`index.html`をブラウザで開くか、簡易HTTPサーバーを起動：

```bash
# Python 3の場合
python -m http.server 8000

# ブラウザで http://localhost:8000 にアクセス
```

## 使い方

### 基本的な使い方

1. **YouTube URLの入力**
   - YouTubeの動画URLを入力フィールドに貼り付けます
   - 例: `https://www.youtube.com/watch?v=xxxxx`

2. **オプションの設定**
   - **元の言語**: 動画の言語を選択（自動検出も可能）
   - **翻訳先**: 翻訳したい言語を選択
   - **要約を生成**: 文字起こし内容の要約を生成
   - **話者識別**: 複数の話者を識別

3. **文字起こしを開始**
   - 「文字起こしを開始」ボタンをクリック
   - 進捗バーで処理状況を確認

4. **結果の確認**
   - 文字起こしテキスト
   - タイムスタンプ付きテキスト
   - 要約（有効にした場合）
   - 翻訳（有効にした場合）

5. **エクスポート**
   - TXT、PDF、DOCXボタンでダウンロード
   - コピーボタンでクリップボードにコピー

### デモモード

OpenAI APIキーを設定していない場合、フロントエンドはデモモードで動作します。ダミーデータを使用してUIの動作を確認できます。

実際の文字起こし機能を使用するには、OpenAI APIキーの設定が必要です。

## プロジェクト構造

```
.
├── index.html          # メインHTML
├── style.css           # スタイルシート
├── app.js              # フロントエンドJavaScript
├── app.py              # FlaskバックエンドAPI
├── requirements.txt    # Python依存関係
├── .env.example        # 環境変数テンプレート
├── .env                # 環境変数（要作成、gitignore対象）
├── .gitignore          # Git除外設定
├── README.md           # このファイル
├── uploads/            # アップロード一時ファイル（自動生成）
└── outputs/            # エクスポートファイル（自動生成）
```

## API エンドポイント

### POST /api/transcribe
YouTube動画を文字起こし

**リクエスト:**
```json
{
  "videoUrl": "https://youtube.com/watch?v=xxxxx",
  "videoId": "xxxxx",
  "sourceLanguage": "auto",
  "translateTo": "en",
  "generateSummary": true,
  "speakerDetection": true
}
```

**レスポンス:**
```json
{
  "videoInfo": {
    "title": "動画タイトル",
    "duration": 330,
    "channel": "チャンネル名",
    "thumbnail": "サムネイルURL"
  },
  "transcript": {
    "fullText": "完全な文字起こしテキスト...",
    "segments": [
      {
        "start": 0,
        "end": 5,
        "text": "セグメントテキスト",
        "speaker": "スピーカー 1"
      }
    ]
  },
  "summary": "要約テキスト...",
  "translation": "翻訳テキスト...",
  "timestamp": "2026-01-11T00:00:00"
}
```

### POST /api/export/pdf
PDF形式でエクスポート

### POST /api/export/docx
DOCX形式でエクスポート

### GET /api/health
ヘルスチェック

## トラブルシューティング

### ffmpegが見つからないエラー

```bash
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt install ffmpeg
```

### OpenAI APIエラー

- APIキーが正しく設定されているか確認
- APIクレジットが残っているか確認
- [OpenAI Status](https://status.openai.com/)でサービス状態を確認

### CORS エラー

フロントエンドとバックエンドが異なるポートで動作している場合、CORSエラーが発生する可能性があります。`app.py`でCORSが有効になっていることを確認してください。

### yt-dlp エラー

yt-dlpを最新バージョンに更新：

```bash
pip install --upgrade yt-dlp
```

## 今後の機能拡張

- [ ] リアルタイム文字起こし
- [ ] 字幕ファイル（SRT、VTT）のエクスポート
- [ ] 高度な話者識別（pyannote.audio統合）
- [ ] バッチ処理（複数動画の一括処理）
- [ ] ユーザー認証とセッション管理
- [ ] 文字起こし履歴の保存
- [ ] カスタム辞書・用語集のサポート
- [ ] YouTube以外の動画プラットフォーム対応

## ライセンス

MIT License

## 参考資料

- [OpenAI Whisper API](https://platform.openai.com/docs/guides/speech-to-text)
- [yt-dlp](https://github.com/yt-dlp/yt-dlp)
- [Flask](https://flask.palletsprojects.com/)

## 貢献

プルリクエスト、イシュー報告を歓迎します。

## 注意事項

- YouTube動画の文字起こしは、動画の著作権を尊重して使用してください
- OpenAI APIの使用には料金が発生する場合があります
- 大量のリクエストを行う場合は、レート制限に注意してください
