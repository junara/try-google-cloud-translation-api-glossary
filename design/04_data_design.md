# データ設計書

## 1. ファイル形式

### 1.1 入力ファイル

#### サービスアカウントキー (JSON)
```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "key-id",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "service-account@project.iam.gserviceaccount.com",
  "client_id": "123456789",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/..."
}
```

#### 用語集CSV
```csv
ja,en,fr
東京,Tokyo,Tokyo
富士山,Mount Fuji,Mont Fuji
桜,Sakura,Sakura
新幹線,Shinkansen,Shinkansen
寿司,Sushi,Sushi
```

**仕様**:
- エンコーディング: UTF-8
- ヘッダー行: 言語コード（ISO 639-1形式）
- 区切り文字: カンマ（,）
- クォート: 不要（単純な用語のみ）

#### 入力テキストファイル
```text
東京は日本の首都です。
富士山は日本で最も高い山です。
春になると桜が咲きます。
新幹線は高速鉄道です。
寿司は日本の伝統的な料理です。
```

**仕様**:
- エンコーディング: UTF-8
- 改行コード: LF または CRLF
- ファイルサイズ: 制限なし（プロトタイプのため大容量は考慮しない）

### 1.2 出力ファイル

#### 翻訳結果テキストファイル
```text
Tokyo is the capital of Japan.
Mount Fuji is the highest mountain in Japan.
Sakura blooms in spring.
Shinkansen is a high-speed railway.
Sushi is a traditional Japanese dish.
```

**仕様**:
- エンコーディング: UTF-8
- 改行コード: 入力ファイルと同じ
- 既存ファイルは上書き

## 2. 内部データ構造

### 2.1 コマンドライン引数オブジェクト
```javascript
{
  from: "ja",              // 翻訳元言語コード
  to: "en",                // 翻訳先言語コード
  glossary: "glossary.csv", // 用語集ファイルパス
  input: "input.txt",      // 入力ファイルパス
  output: "output.txt",    // 出力ファイルパス
  account: "key.json",     // サービスアカウントキーパス
  project: "my-project"    // GCPプロジェクトID
}
```

### 2.2 用語集データ構造
```javascript
{
  name: "translation-glossary",
  languageCodes: ["ja", "en", "fr"],
  entries: [
    {
      ja: "東京",
      en: "Tokyo",
      fr: "Tokyo"
    },
    {
      ja: "富士山",
      en: "Mount Fuji",
      fr: "Mont Fuji"
    }
    // ...
  ]
}
```

### 2.3 Translation API リクエスト
```javascript
{
  parent: "projects/PROJECT_ID/locations/us-central1",
  contents: ["翻訳するテキスト"],
  mimeType: "text/plain",
  sourceLanguageCode: "ja",
  targetLanguageCode: "en",
  glossaryConfig: {
    glossary: "projects/PROJECT_ID/locations/us-central1/glossaries/translation-glossary"
  }
}
```

### 2.4 Translation API レスポンス
```javascript
{
  translations: [
    {
      translatedText: "Translated text",
      glossaryTranslations: [
        {
          translatedText: "Translated with glossary",
          glossaryConfig: {
            glossary: "projects/PROJECT_ID/locations/global/glossaries/translation-glossary"
          }
        }
      ]
    }
  ]
}
```

## 3. Google Cloud リソース

### 3.1 用語集リソース
```
リソース名: projects/{project_id}/locations/us-central1/glossaries/translation-glossary

構造:
{
  name: "translation-glossary",
  languageCodesSet: {
    languageCodes: ["ja", "en", "fr"]
  },
  inputConfig: {
    gcsSource: {
      inputUri: "gs://BUCKET_NAME/glossary.csv"
    }
  }
}
```

### 3.2 Cloud Storage
用語集データは内部的にCloud Storageに保存されますが、これはTranslation APIが自動的に管理します。

## 4. エラーコード設計

| エラーコード | 説明 | 終了コード |
|------------|------|-----------|
| ARG_MISSING | 必須引数の不足 | 1 |
| FILE_NOT_FOUND | ファイルが見つからない | 1 |
| INVALID_LANG_CODE | 不正な言語コード | 1 |
| AUTH_FAILED | 認証エラー | 2 |
| GLOSSARY_ERROR | 用語集作成/更新エラー | 3 |
| TRANSLATION_ERROR | 翻訳処理エラー | 4 |
| FILE_WRITE_ERROR | ファイル書き込みエラー | 5 |

## 5. 設定値

### 5.1 固定値
- 用語集名: `translation-glossary`
- API バージョン: `v3`
- リージョン: `us-central1`
- MIMEタイプ: `text/plain`

### 5.2 制限値
- 用語集エントリ数: 最大10,000（Google Cloud制限）
- 翻訳テキストサイズ: 最大30,000文字（Google Cloud制限）
- サポート言語: Google Cloud Translation APIがサポートする言語

## 6. ログフォーマット

プロトタイプのため、最小限のエラー出力のみ:
```
Error: [エラーメッセージ]
```

成功時は出力なし（サイレント実行）。