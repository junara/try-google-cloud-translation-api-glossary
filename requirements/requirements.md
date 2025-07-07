# Google Cloud Translation API 用語集翻訳スクリプト要件定義書

## 1. プロジェクト概要

### 1.1 目的
Google Cloud Translation APIのglossary機能を利用して、用語集に基づいたテキスト翻訳を行うNodeスクリプトを開発する。

### 1.2 スコープ
- Google Cloud Translation APIを使用した翻訳機能
- 用語集（glossary）機能の実装
- Terraformによるサービスアカウントの管理
- プロトタイプとしての最小限の機能実装

## 2. 機能要件

### 2.1 基本機能
- テキストファイルの翻訳（ファイル全体を一度に処理）
- 多言語（例: 3言語（日本語、英語、フランス語））対応の用語集管理
- コマンドライン引数による実行パラメータ指定

### 2.2 コマンドライン仕様
```bash
npm start -- --from ja --to en --glossary glossary.csv --input input.txt --output output.txt --account service_account_key.json --project PROJECT_ID
```

または直接tsx実行：
```bash
npx tsx src/main.ts --from ja --to en --glossary glossary.csv --input input.txt --output output.txt --account service_account_key.json --project PROJECT_ID
```

#### 引数仕様
| 引数 | 短縮形 | 説明 | 必須 |
|------|--------|------|------|
| --from | -f | 翻訳元言語コード（ISO 639-1形式） | ○ |
| --to | -t | 翻訳先言語コード（ISO 639-1形式） | ○ |
| --glossary | -g | 用語集CSVファイルパス | ○ |
| --input | -i | 入力テキストファイルパス | ○ |
| --output | -o | 出力テキストファイルパス | ○ |
| --account | -a | サービスアカウントキーJSONファイルパス | ○ |
| --project | -p | Google CloudプロジェクトID | ○ |
| --help | -h | ヘルプメッセージを表示 | × |

### 2.3 用語集管理
- 用語集名：`translation-glossary`（固定）
- 実行時に既存の用語集を更新、存在しない場合は新規作成
- Cloud Storageバケット：`{PROJECT_ID}-translation-glossary`（Terraformで事前作成）
- 用語集データはCSV形式でCloud Storageに保存される
- サービスアカウントは用語集専用バケットのみアクセス可能

### 2.4 翻訳処理
- 入力ファイルの文字エンコーディング：UTF-8
- 出力ファイルが既存の場合は上書き
- 用語集に登録されていない単語は通常のTranslation APIで翻訳
- 翻訳は用語集を優先的に使用（glossaryConfig指定）

## 3. 非機能要件

### 3.1 エラーハンドリング
- 最小限のエラーハンドリングのみ実装
- エラーメッセージを表示して終了

### 3.2 ログ・進捗表示
- 処理の進捗表示は不要
- 確認メッセージは表示しない

## 4. 技術仕様

### 4.1 使用技術
- プログラミング言語：Node.js (version 24.x 以上)
- 開発言語：TypeScript（tsx使用でビルドレス実行）
- モジュールシステム：ESモジュール（type: "module"）
- API：Google Cloud Translation API v3, Google Cloud Storage API
- IaCツール：Terraform（セキュリティ強化済み）
- 認証方式：サービスアカウントキー（JSONファイル、手動作成）
- ロケーション：us-central1（グローバルリージョンは用語集作成で非対応）
- コード品質：
  - TypeScript v5（静的型チェック）
  - ESLint v9（@typescript-eslintベース）- 静的解析
  - Prettier v3（コードフォーマッター）- コードスタイル統一

### 4.2 用語集ファイル形式
1ファイルで多言語を管理できる。等価用語セット（Equivalent Term Sets）形式。

```csv
ja,en,fr
東京,Tokyo,Tokyo
富士山,Mount Fuji,Mont Fuji
桜,Sakura,Sakura
新幹線,Shinkansen,Shinkansen
寿司,Sushi,Sushi
```
- ヘッダー行：言語コード（ISO 639-1形式：ja, en, fr）
- データ行：各言語の対訳（カンマ区切り）
- ファイル形式：CSV（カンマ区切り値）
- 文字エンコーディング：UTF-8

## 5. プロジェクト構成

```
try-google-text-to-speech-glossary/
├── design/                    # 設計ドキュメント
├── requirements/              # 要件定義
├── src/                      # ソースコード（TypeScript）
│   ├── main.ts               # エントリーポイント
│   ├── modules/              # 機能モジュール
│   │   ├── parser.ts         # 引数解析
│   │   ├── translator.ts     # 翻訳処理
│   │   └── glossaryManager.ts # 用語集管理
│   ├── utils/                # ユーティリティ
│   │   ├── fileHandler.ts    # ファイル操作
│   │   └── errorHandler.ts   # エラーハンドリング
│   └── types/                # TypeScript型定義
│       └── index.ts          # 共通型定義
├── terraform/                # インフラストラクチャコード（セキュリティ強化済み）
│   ├── main.tf               # API有効化、SA作成、権限設定
│   └── terraform.tfvars.example
├── demo/                     # デモファイル
│   ├── ja.txt
│   └── glossary.csv
├── package.json
├── tsconfig.json             # TypeScript設定
├── eslint.config.js          # ESLint v9設定ファイル（TypeScript対応）
├── .prettierrc.json          # Prettier設定ファイル
├── .prettierignore           # Prettier除外設定
├── README.md
└── .gitignore
```

## 6. 成果物

### 6.1 プログラム
- src/main.ts：翻訳処理を実行するTypeScriptスクリプト（エントリーポイント）
- src/modules/：機能モジュール群（parser, translator, glossaryManager）
- src/utils/：ユーティリティモジュール群（fileHandler, errorHandler）
- src/types/：TypeScript型定義ファイル

### 6.2 Infrastructure as Code
- terraform/main.tf：セキュリティ強化されたTerraform設定
  - API自動有効化（Translation API、Storage API）
  - サービスアカウント作成と最小権限設定（特定バケット限定）
  - Cloud Storageバケット作成（セキュリティ設定付き）
  - バケットレベルIAMによる権限制御
  - 手動キー作成の推奨（セキュリティのため自動作成は削除）

### 6.3 設定ファイル
- package.json：Node.js依存関係管理（TypeScript、tsx対応）
- tsconfig.json：TypeScript設定（strict mode、型チェック）
- eslint.config.js：ESLint v9形式のコード品質チェック設定（TypeScript対応）
- .prettierrc.json：Prettierコードフォーマット設定
- .prettierignore：Prettier除外設定
- .gitignore：Git除外設定（認証情報、出力ファイル等）
- mise.toml：開発環境バージョン管理

### 6.4 ドキュメント
- README.md：使用方法、セットアップ手順（Google Console設定含む）
- design/：設計ドキュメント群
- requirements/requirements.md：本要件定義書

### 6.5 デモファイル
- demo/ja.txt：技術文書のサンプルテキスト
- demo/glossary.csv：技術用語5個程度の用語集

## 7. 制約事項

### 7.1 前提条件
- Google CloudプロジェクトIDは既存のものを使用
- TerraformによりAPI自動有効化（Translation API、Storage API）
- Terraformによるセキュアなインフラ管理（SA・Cloud Storage）
- サービスアカウントには以下の最小権限が自動設定：
  - `roles/cloudtranslate.editor`（プロジェクトレベル：翻訳と用語集管理）
  - `roles/storage.objectAdmin`（特定バケットのみ：用語集バケット限定）
- Cloud StorageバケットはTerraformで事前作成（セキュリティ設定付き）
- サービスアカウントキーは手動作成（セキュリティのため）

### 7.2 制限事項
- プロトタイプのため、エラーハンドリングは最小限
- バッチ処理や並列処理は実装しない
- 翻訳はファイル全体を一度に処理（大容量ファイルは考慮しない）
- 用語集リソースは`us-central1`リージョンに限定（`global`リージョン非対応）
- 用語集作成には等価用語セット形式のCSVファイルが必須

## 8. 開発・テスト

### 8.1 開発コマンド
```bash
# 依存関係のインストール
npm install

# TypeScript型チェック
npm run typecheck

# TypeScriptビルド（必要に応じて）
npm run build

# コード品質チェック
npm run lint

# コードフォーマット
npm run format

# フォーマットチェック（CIで使用）
npm run format:check

# メイン実行（デモ）
npm start -- --from ja --to en --glossary demo/glossary.csv --input demo/ja.txt --output demo/en.txt --account service_account_key.json --project YOUR_PROJECT_ID

# 直接tsx実行
npx tsx src/main.ts --from ja --to en --glossary demo/glossary.csv --input demo/ja.txt --output demo/en.txt --account service_account_key.json --project YOUR_PROJECT_ID
```

### 8.2 動作確認
- デモファイルを使用した基本動作の確認
- 多言語翻訳（ja→en、ja→fr、en→fr）の確認
- 用語集の適用確認

## 9. 今後の拡張可能性

本プロトタイプは最小限の機能実装となるが、将来的には以下の拡張が可能：
- 複数ファイルの一括処理
- 翻訳結果のキャッシュ機能
- より詳細なエラーハンドリングとログ機能
- 用語集の自動バックアップ機能
- ✅ TypeScript化（完了）
- テストスイートの追加
- CI/CDパイプラインの構築
- Workload Identityの導入（サービスアカウントキー不要化）
