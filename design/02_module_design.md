# モジュール設計書

## 1. モジュール構成

```
src/
├── main.js              # エントリーポイント
├── modules/
│   ├── parser.js        # 引数解析モジュール
│   ├── translator.js    # 翻訳処理モジュール
│   └── glossaryManager.js # 用語集管理モジュール
└── utils/
    ├── fileHandler.js   # ファイル操作ユーティリティ
    └── errorHandler.js  # エラーハンドリングユーティリティ
```

## 2. 各モジュールの詳細設計

### 2.1 main.js

**責務**: アプリケーションのエントリーポイント

**主要関数**:
```javascript
async function main() {
  // 1. コマンドライン引数の解析
  // 2. サービスアカウント認証
  // 3. 用語集の準備
  // 4. 翻訳処理の実行
  // 5. 結果の出力
}
```

### 2.2 parser.js

**責務**: コマンドライン引数の解析と検証

**エクスポート関数**:
```javascript
parseArguments() {
  // yargsを使用して引数を解析
  // 必須引数の検証
  // オプションオブジェクトを返す
}

validateArguments(args) {
  // 言語コードの妥当性確認
  // ファイルパスの存在確認
  // プロジェクトIDの形式確認
}
```

**引数オプション型定義**:
```javascript
{
  from: string,      // 翻訳元言語コード
  to: string,        // 翻訳先言語コード
  glossary: string,  // 用語集CSVファイルパス
  input: string,     // 入力ファイルパス
  output: string,    // 出力ファイルパス
  account: string,   // サービスアカウントキーパス
  project: string    // GCPプロジェクトID
}
```

### 2.3 translator.js

**責務**: Google Cloud Translation APIを使用した翻訳処理

**エクスポート関数**:
```javascript
async function initializeTranslationClient(serviceAccountPath, projectId) {
  // Translation APIクライアントの初期化
}

async function translateWithGlossary(client, text, options) {
  // 用語集を使用した翻訳
  // options: { from, to, glossaryId, projectId }
}

async function translateText(inputPath, outputPath, translationOptions) {
  // ファイル全体の翻訳処理
}
```

### 2.4 glossaryManager.js

**責務**: Google Cloud上の用語集リソース管理

**エクスポート関数**:
```javascript
async function loadGlossaryFromCSV(csvPath) {
  // CSVファイルから用語集データを読み込み
  // 返り値: { name, languageCodes: [], entries: [] }
}

async function createOrUpdateGlossary(client, glossaryData, projectId) {
  // Cloud Storageバケットを作成または取得
  // CSVファイルをCloud Storageにアップロード
  // 既存の用語集を確認・削除
  // 新しい用語集を作成
  // 返り値: glossaryName (full resource path)
}

async function deleteGlossary(client, glossaryId, projectId) {
  // 用語集の削除（必要に応じて）
}
```

**用語集データ構造**:
```javascript
{
  name: 'translation-glossary',
  languageCodes: ['ja', 'en', 'fr'],
  entries: [
    { ja: '東京', en: 'Tokyo', fr: 'Tokyo' },
    { ja: '富士山', en: 'Mount Fuji', fr: 'Mont Fuji' },
    { ja: '桜', en: 'Sakura', fr: 'Sakura' },
    { ja: '新幹線', en: 'Shinkansen', fr: 'Shinkansen' },
    { ja: '寿司', en: 'Sushi', fr: 'Sushi' }
  ]
}
```

**Cloud Storageリソース**:
```javascript
{
  bucketName: '{projectId}-translation-glossary',
  fileName: 'translation-glossary.csv',
  contentType: 'text/csv',
  csvContent: 'ja,en,fr\n東京,Tokyo,Tokyo\n富士山,Mount Fuji,Mont Fuji\n...'
}
```

### 2.5 fileHandler.js

**責務**: ファイルの読み書き操作

**エクスポート関数**:
```javascript
async function readTextFile(filePath) {
  // UTF-8でテキストファイルを読み込み
}

async function writeTextFile(filePath, content) {
  // UTF-8でテキストファイルに書き込み（上書き）
}

async function fileExists(filePath) {
  // ファイルの存在確認
}
```

### 2.6 errorHandler.js

**責務**: エラーハンドリングとメッセージ表示

**エクスポート関数**:
```javascript
function handleError(error, context) {
  // エラーメッセージの表示
  // プロセスの終了
}

function logError(message, details) {
  // エラーログの出力
}
```

## 3. 依存関係

```
main.js
├── parser.js
├── translator.js
│   └── @google-cloud/translate
├── glossaryManager.js
│   ├── @google-cloud/translate
│   ├── @google-cloud/storage
│   └── csv-parse
└── utils/
    ├── fileHandler.js
    │   └── fs/promises
    └── errorHandler.js
```

## 4. エラー処理方針

- 各モジュールは例外をスローし、main.jsで一括キャッチ
- ユーザーフレンドリーなエラーメッセージを表示
- スタックトレースは表示しない（プロトタイプのため）

## 5. 拡張ポイント

- 新しい翻訳プロバイダーの追加（translator.js）
- 用語集フォーマットの拡張（glossaryManager.js）
- バッチ処理の追加（main.js）