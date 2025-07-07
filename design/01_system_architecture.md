# システムアーキテクチャ設計書

## 1. システム概要

本システムは、Google Cloud Translation APIのglossary機能を活用した翻訳スクリプトです。ユーザーが定義した用語集に基づいて、テキストファイルを翻訳します。

## 2. アーキテクチャ構成

```
┌─────────────────┐
│  CLI Interface  │
│   (main.js)     │
└────────┬────────┘
         │
┌────────┴────────┐
│  Core Module    │
├─────────────────┤
│ - Parser        │
│ - Translator    │
│ - GlossaryMgr   │
└────────┬────────┘
         │
┌────────┴────────┐
│  Google Cloud   │
│ Translation API │
│      (v3)       │
└─────────────────┘
```

## 3. コンポーネント説明

### 3.1 CLI Interface (main.js)
- コマンドライン引数の解析
- 各モジュールの呼び出し制御
- エラーハンドリング

### 3.2 Core Modules

#### 3.2.1 Parser Module
- コマンドライン引数のパース
- 引数の妥当性検証

#### 3.2.2 Translator Module
- 翻訳処理の実行
- Google Cloud Translation APIの呼び出し
- 用語集を使用した翻訳

#### 3.2.3 Glossary Manager Module
- 用語集の作成・更新
- CSVファイルからの用語集データ読み込み
- Google Cloud上の用語集リソース管理

### 3.3 External Services
- Google Cloud Translation API v3 (us-central1 リージョン)
- Google Cloud Storage API (用語集データ保存、バケット自動作成)

## 4. データフロー

1. ユーザーがコマンドライン引数を指定して実行
2. Parser Moduleが引数を解析・検証
3. Translation API クライアントを初期化（us-central1リージョン）
4. Glossary Manager ModuleがCSVファイルをCloud Storageにアップロード
5. 用語集リソースをGoogle Cloud Translation APIに登録/更新
6. Translator Moduleが入力ファイルを読み込み
7. 用語集を使用してTranslation APIを呼び出して翻訳実行
8. 翻訳結果を出力ファイルに保存

## 5. 認証フロー

1. サービスアカウントキー（JSONファイル）を読み込み
2. Google Cloud クライアントライブラリで認証
3. プロジェクトIDを使用してAPIアクセス

## 6. 技術スタック

- **言語**: Node.js (ES6+)
- **パッケージ管理**: npm
- **外部ライブラリ**:
  - @google-cloud/translate: Google Cloud Translation API クライアント
  - @google-cloud/storage: Google Cloud Storage API クライアント
  - yargs: コマンドライン引数パース
  - csv-parse: CSVファイル解析
- **開発ツール**:
  - ESLint: 静的コード解析
  - Prettier: コードフォーマット
- **Infrastructure**: Terraform (サービスアカウント管理)

## 7. セキュリティ考慮事項

- サービスアカウントキーはローカルファイルとして管理
- APIアクセスは必要最小限の権限で実行
- 認証情報はコード内にハードコードしない

## 8. 拡張性考慮事項

- モジュール化による機能追加の容易性
- 新しい言語対応の追加が可能
- バッチ処理への拡張が可能な設計