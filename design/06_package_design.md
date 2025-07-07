# パッケージ設計書

## 1. Node.js バージョン要件

- **必須バージョン**: Node.js 24.x 以上
- **パッケージマネージャー**: npm 10.x 以上
- **エンジン制約**: package.json で明示的に指定

## 2. 依存パッケージ

### 2.1 本番依存関係 (dependencies)

| パッケージ名 | バージョン | 用途 | Node.js 24 対応 |
|------------|-----------|------|----------------|
| @google-cloud/translate | ^8.0.0 | Google Cloud Translation API クライアント | ✓ |
| @google-cloud/storage | ^7.0.0 | Google Cloud Storage API クライアント | ✓ |
| yargs | ^17.7.2 | コマンドライン引数パース | ✓ |
| csv-parse | ^5.5.0 | CSVファイル解析 | ✓ |

### 2.2 開発依存関係 (devDependencies)

| パッケージ名 | バージョン | 用途 | Node.js 24 対応 |
|------------|-----------|------|----------------|
| @types/node | ^24.0.0 | Node.js型定義（オプション） | ✓ |
| @eslint/js | ^9.0.0 | ESLint基本設定（v9対応） | ✓ |
| eslint | ^9.0.0 | コードリンター | ✓ |
| prettier | ^3.3.0 | コードフォーマッター | ✓ |
| eslint-config-prettier | ^9.1.0 | ESLint・Prettier統合 | ✓ |

## 3. package.json 設計

```json
{
  "name": "google-translation-glossary",
  "version": "1.0.0",
  "description": "Google Cloud Translation API glossary-based translation script",
  "main": "src/main.js",
  "type": "module",
  "engines": {
    "node": ">=24.0.0",
    "npm": ">=10.0.0"
  },
  "scripts": {
    "start": "node src/main.js",
    "test": "echo \"No tests implemented\"",
    "lint": "eslint src/**/*.js",
    "format": "prettier --write \"src/**/*.js\"",
    "format:check": "prettier --check \"src/**/*.js\""
  },
  "keywords": [
    "google-cloud",
    "translation",
    "glossary",
    "nodejs"
  ],
  "author": "",
  "license": "MIT",
  "dependencies": {
    "@google-cloud/translate": "^8.0.0",
    "@google-cloud/storage": "^7.0.0",
    "yargs": "^17.7.2",
    "csv-parse": "^5.5.0"
  },
  "devDependencies": {
    "@types/node": "^24.0.0",
    "@eslint/js": "^9.0.0",
    "eslint": "^9.0.0",
    "prettier": "^3.3.0",
    "eslint-config-prettier": "^9.1.0"
  }
}
```

## 4. モジュールシステム

### 4.1 ESモジュール使用
- `"type": "module"` を指定してESモジュールを使用
- `import/export` 構文を使用
- Node.js 24はESモジュールを完全サポート

### 4.2 インポート例
```javascript
// ESモジュール構文
import { TranslationServiceClient } from '@google-cloud/translate';
import { Storage } from '@google-cloud/storage';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { parse } from 'csv-parse/sync';
import { readFile, writeFile } from 'node:fs/promises';
```

## 5. Node.js 24 の新機能活用

### 5.1 ネイティブ機能の使用
```javascript
// Node.js 24で安定したAPI
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
```

### 5.2 エラーハンドリング
```javascript
// Node.js 24のstructured cloneを活用
const errorDetails = structuredClone(error);
```

## 6. パッケージ選定理由

### 6.1 @google-cloud/translate
- Google公式クライアントライブラリ
- v8.0.0はNode.js 24に対応
- TypeScript型定義を含む
- 用語集機能を完全サポート（us-central1リージョン）

### 6.2 @google-cloud/storage
- Google公式Cloud Storage クライアントライブラリ
- v7.0.0はNode.js 24に対応
- バケット作成・管理機能
- ファイルアップロード機能

### 6.3 yargs
- 最も成熟したCLI引数パーサー
- ESモジュール対応
- 豊富な機能（ヘルプ自動生成など）

### 6.4 csv-parse
- 高性能なCSVパーサー
- ストリーミングと同期処理の両方をサポート
- エラーハンドリングが充実

### 6.5 prettier
- オピニオネイテッドなコードフォーマッター
- 設定が少なく、すぐ使える
- チーム開発でのコードスタイル統一

### 6.6 eslint-config-prettier
- ESLintとPrettierの競合を解決
- フォーマット関連のESLintルールを無効化
- 両ツールの共存を可能に

## 7. インストール手順

```bash
# package.jsonが存在するディレクトリで実行
npm install

# または個別インストール
npm install @google-cloud/translate @google-cloud/storage yargs csv-parse
npm install --save-dev @types/node @eslint/js eslint prettier eslint-config-prettier
```

## 8. セキュリティ考慮事項

### 8.1 依存関係の管理
- `npm audit` を定期的に実行
- `package-lock.json` をコミット
- 依存関係の自動更新は行わない

### 8.2 パッケージの検証
```bash
# セキュリティ監査
npm audit

# 修正可能な脆弱性の自動修正
npm audit fix
```

## 9. パフォーマンス最適化

### 9.1 起動時間の最適化
- 必要なモジュールのみインポート
- 動的インポートの活用（必要に応じて）

### 9.2 メモリ使用量
- ストリーミング処理は不要（プロトタイプ）
- ファイル全体をメモリに読み込む単純な実装

## 10. コード品質ツール設定

### 10.1 Prettier設定 (.prettierrc.json)
```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "useTabs": false,
  "trailingComma": "es5",
  "bracketSpacing": true,
  "arrowParens": "avoid",
  "endOfLine": "lf",
  "printWidth": 100
}
```

### 10.2 ESLint統合設定 (eslint.config.js)
```javascript
import prettier from 'eslint-config-prettier';
// prettierをESLint設定に追加してフォーマット競合を防ぐ
```

### 10.3 開発ワークフロー
1. コード記述
2. `npm run format` でフォーマット
3. `npm run lint` で静的解析
4. コミット前に両方を実行

## 11. 将来の拡張性

### 11.1 追加可能なパッケージ
- `winston`: 高度なロギング
- `dotenv`: 環境変数管理
- `commander`: より高度なCLI機能
- `ora`: 進捗表示
- `husky`: Git フック管理
- `lint-staged`: ステージファイルのみlint/format

### 11.2 TypeScript移行
- 現在のJavaScriptコードはTypeScriptへの移行が容易
- 型定義は既に利用可能