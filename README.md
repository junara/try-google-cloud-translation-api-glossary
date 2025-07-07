# Google Cloud Translation API Glossary Translation Script

Google Cloud Translation APIの用語集（glossary）機能を使用してテキスト翻訳を行うNode.jsスクリプトです。

## 必要条件

- Node.js 24.x 以上
- npm 10.x 以上
- Google Cloudプロジェクト
- Google Cloud Translation APIの有効化
- TypeScript対応（tsx使用）

## セットアップ

### 1. Google Cloud Consoleでの準備

1. [Google Cloud Console](https://console.cloud.google.com)にアクセス
2. プロジェクトを作成または選択
3. Google Cloud CLIの認証:
   ```bash
   gcloud auth login
   gcloud config set project YOUR_PROJECT_ID
   ```

### 2. インフラストラクチャのセットアップ（Terraform使用）

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
# terraform.tfvarsを編集してproject_idを設定

terraform init
terraform plan
terraform apply
```

Terraformが以下を自動的に設定します：
- Translation APIとStorage APIの有効化
- サービスアカウントの作成
- 必要な権限の付与

### 3. サービスアカウントキーの手動作成（セキュリティのため）

Terraform実行後、出力されたコマンドを使用してサービスアカウントキーを手動作成：

```bash
# Terraformの出力から表示されるコマンドを実行
gcloud iam service-accounts keys create service_account_key.json \
  --iam-account=translation-glossary-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com
```

**セキュリティ注意事項：**
- サービスアカウントキーは機密情報です
- キーファイルをGitリポジトリにコミットしないでください
- 不要になったキーは削除してください

### 4. 依存関係のインストール

```bash
npm install
```

### 5. TypeScript対応

このプロジェクトはTypeScriptで書かれており、ビルドなしで実行できるようにtsxを使用しています。

## 使用方法

```bash
npm start -- --from ja --to en --glossary glossary.csv --input input.txt --output output.txt --account service_account_key.json --project PROJECT_ID
```

または直接tsx使用：

```bash
npx tsx src/main.ts --from ja --to en --glossary glossary.csv --input input.txt --output output.txt --account service_account_key.json --project PROJECT_ID
```

### コマンドライン引数

| 引数 | 短縮形 | 説明 | 必須 |
|------|--------|------|------|
| --from | -f | 翻訳元言語コード（例: ja） | ○ |
| --to | -t | 翻訳先言語コード（例: en） | ○ |
| --glossary | -g | 用語集CSVファイルパス | ○ |
| --input | -i | 入力テキストファイルパス | ○ |
| --output | -o | 出力テキストファイルパス | ○ |
| --account | -a | サービスアカウントキーJSONファイルパス | ○ |
| --project | -p | Google CloudプロジェクトID | ○ |

### デモの実行

デモファイルを使用した実行例：

```bash
# 日本語から英語への翻訳
npm start -- \
  --from ja \
  --to en \
  --glossary demo/glossary.csv \
  --input demo/ja.txt \
  --output demo/en.txt \
  --account service_account_key.json \
  --project your-project-id

# 日本語からフランス語への翻訳
npm start -- \
  --from ja \
  --to fr \
  --glossary demo/glossary.csv \
  --input demo/ja.txt \
  --output demo/fr.txt \
  --account service_account_key.json \
  --project your-project-id

# 英語からフランス語への翻訳
npm start -- \
  --from en \
  --to fr \
  --glossary demo/glossary.csv \
  --input demo/en.txt \
  --output demo/fr.txt \
  --account service_account_key.json \
  --project your-project-id
```

## 用語集ファイル形式

CSVファイルは以下の形式で作成します：

```csv
ja,en,fr
東京,Tokyo,Tokyo
富士山,Mount Fuji,Mont Fuji
桜,Sakura,Sakura
```

- 1行目：言語コード（ISO 639-1形式）
- 2行目以降：各言語の対訳

## ファイル構成

```
.
├── src/
│   ├── main.ts              # エントリーポイント（TypeScript）
│   ├── modules/
│   │   ├── parser.ts        # 引数解析
│   │   ├── translator.ts    # 翻訳処理
│   │   └── glossaryManager.ts # 用語集管理
│   ├── utils/
│   │   ├── fileHandler.ts   # ファイル操作
│   │   └── errorHandler.ts  # エラーハンドリング
│   └── types/
│       └── index.ts         # TypeScript型定義
├── terraform/               # インフラ定義
│   ├── main.tf
│   └── terraform.tfvars.example
├── demo/                    # デモファイル
│   ├── ja.txt
│   └── glossary.csv
├── package.json
├── tsconfig.json            # TypeScript設定
├── eslint.config.js         # ESLint設定
├── .prettierrc.json         # Prettier設定
└── README.md
```

## トラブルシューティング

### 認証エラー

サービスアカウントキーファイルのパスが正しいか確認してください。

### 用語集エラー

- 用語集名は固定で `translation-glossary` を使用します
- 既存の用語集は自動的に更新されます

### 翻訳エラー

- 入力ファイルがUTF-8エンコーディングであることを確認してください
- プロジェクトIDが正しいか確認してください

## 開発ツール

### TypeScript

```bash
# 型チェック
npm run typecheck

# ビルド（必要に応じて）
npm run build
```

### コード品質

```bash
# ESLintによる静的解析
npm run lint

# Prettierによるフォーマット
npm run format

# フォーマットチェック
npm run format:check
```

## 制限事項

- プロトタイプのため、エラーハンドリングは最小限です
- 大容量ファイルの処理は考慮していません
- 用語集はGoogle Cloud Storageへの手動アップロードが必要な場合があります

## ライセンス

MIT
