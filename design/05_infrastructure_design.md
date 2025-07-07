# インフラストラクチャ設計書（セキュリティ強化版）

## 1. Google Cloud Platform リソース

### 1.1 必要なAPIとサービス

| サービス | 用途 | 必須 | 自動有効化 |
|---------|------|------|-----------|
| Cloud Translation API v3 | テキスト翻訳と用語集管理 | ○ | ○ |
| Cloud Storage API | 用語集データの保存 | ○ | ○ |
| IAM & Admin | サービスアカウント管理 | ○ | ○ |

### 1.2 サービスアカウント

#### 必要な権限（最小権限の原則）
```
roles/cloudtranslate.editor (プロジェクトレベル)
- 翻訳の実行
- 用語集の作成・更新・削除

roles/storage.objectAdmin (バケットレベル)
- 特定バケットのみのオブジェクト読み書き
- 用語集データのアップロード・ダウンロード
- 他のCloud Storageバケットへのアクセス不可
```

#### Cloud Storage バケット
```
バケット作成: Terraformで管理
バケット名: ${project_id}-translation-glossary
権限: サービスアカウントはオブジェクト操作のみ
```

#### Terraform設定（セキュリティ強化済み）
```hcl
# terraform/main.tf
terraform {
  required_version = ">= 1.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "region" {
  description = "GCP Region"
  type        = string
  default     = "us-central1"
}

variable "service_account_id" {
  description = "Service Account ID"
  type        = string
  default     = "translation-glossary-sa"
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# 必要なAPIの自動有効化
resource "google_project_service" "translation_api" {
  service = "translate.googleapis.com"
  
  disable_dependent_services = true
  disable_on_destroy         = false
}

resource "google_project_service" "storage_api" {
  service = "storage-api.googleapis.com"
  
  disable_dependent_services = true
  disable_on_destroy         = false
}

resource "google_project_service" "storage_component_api" {
  service = "storage-component.googleapis.com"
  
  disable_dependent_services = true
  disable_on_destroy         = false
}

# サービスアカウントの作成
resource "google_service_account" "translation_sa" {
  account_id   = var.service_account_id
  display_name = "Translation Glossary Service Account"
  description  = "Service account for translation script with glossary support"
  
  depends_on = [
    google_project_service.translation_api,
    google_project_service.storage_api
  ]
}

# Translation API Editor権限の付与
resource "google_project_iam_member" "translation_editor" {
  project = var.project_id
  role    = "roles/cloudtranslate.editor"
  member  = "serviceAccount:${google_service_account.translation_sa.email}"
  
  depends_on = [google_service_account.translation_sa]
}

# 特定のバケットのみにStorage権限を付与（セキュリティ強化）
resource "google_storage_bucket_iam_member" "glossary_bucket_object_admin" {
  bucket = google_storage_bucket.glossary_bucket.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.translation_sa.email}"
  
  depends_on = [
    google_service_account.translation_sa,
    google_storage_bucket.glossary_bucket
  ]
}

# Cloud Storage バケットの作成（用語集保存用）
resource "google_storage_bucket" "glossary_bucket" {
  name     = "${var.project_id}-translation-glossary"
  location = var.region
  
  # バケットの削除保護を無効化（開発環境用）
  force_destroy = true
  
  # パブリックアクセスを防止
  public_access_prevention = "enforced"
  
  # バージョニング設定
  versioning {
    enabled = true
  }
  
  depends_on = [google_project_service.storage_api]
}

# セキュリティ上の理由により、サービスアカウントキーの自動作成は削除
# 手動でキーを作成することを推奨:
# gcloud iam service-accounts keys create service_account_key.json \
#   --iam-account=${google_service_account.translation_sa.email}

output "service_account_email" {
  value       = google_service_account.translation_sa.email
  description = "The email of the created service account"
}

output "project_id" {
  value       = var.project_id
  description = "The GCP project ID"
}

output "region" {
  value       = var.region
  description = "The GCP region"
}

output "manual_key_creation_command" {
  value = "gcloud iam service-accounts keys create service_account_key.json --iam-account=${google_service_account.translation_sa.email}"
  description = "Command to manually create service account key"
}

output "storage_bucket_name" {
  value       = google_storage_bucket.glossary_bucket.name
  description = "The name of the created Cloud Storage bucket"
}
```

#### terraform.tfvars.example
```hcl
project_id = "your-gcp-project-id"
region     = "us-central1"  # Optional: Override default region
service_account_id = "translation-glossary-sa"  # Optional: Override default SA ID
```

## 2. ローカル環境要件

### 2.1 必須ソフトウェア

| ソフトウェア | バージョン | 用途 |
|-------------|-----------|------|
| Node.js | 24.x以上 | TypeScript実行環境（tsx使用） |
| npm | 10.x以上 | パッケージ管理 |
| Terraform | 1.0以上 | セキュアなインフラ管理 |
| TypeScript | 5.x以上 | コード開発言語 |

### 2.2 開発環境設定

#### mise設定 (mise.toml)
```toml
[tools]
node = "24.0.0"
terraform = "1.7.0"
```

## 3. セットアップ手順

### 3.1 Google Cloud準備

1. Google Cloudプロジェクトの作成（既存のものを使用可）
2. Google Cloud CLIの認証
   ```bash
   gcloud auth login
   gcloud config set project YOUR_PROJECT_ID
   ```
3. API有効化はTerraformで自動実行（手動作業不要）

### 3.2 Terraformによるインフラストラクチャセットアップ

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
# terraform.tfvarsを編集してproject_idを設定

terraform init
terraform plan
terraform apply
```

Terraformが以下を自動実行：
- Translation APIとStorage APIの有効化
- サービスアカウントの作成と最小権限の付与
- Cloud Storageバケットの作成（セキュリティ設定付き）

### 3.3 サービスアカウントキーの手動作成（セキュリティのため）

Terraform実行後、出力されたコマンドで手動作成：

```bash
# Terraformの出力から表示されるコマンドを実行
gcloud iam service-accounts keys create service_account_key.json \
  --iam-account=translation-glossary-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com
```

**セキュリティ注意事項：**
- サービスアカウントキーは機密情報です
- キーファイルをGitリポジトリにコミットしないでください
- 不要になったキーは削除してください

### 3.4 Node.js環境のセットアップ

```bash
# miseを使用する場合
mise install

# または直接npmを使用
npm install
```

## 4. 本番環境考慮事項

### 4.1 セキュリティ（強化済み）

- サービスアカウントキーの安全管理
  - Terraformでの自動作成を廃止（平文保存リスク回避）
  - 手動作成でセキュリティ向上
  - Gitリポジトリにコミットしない（.gitignoreに追加済み）
  - 本番環境ではWorkload IdentityやSecret Managerの使用を推奨
  
- APIアクセス制限
  - 最小権限の原則適用済み
  - Storage Object Admin + Storage Adminの分離設定
  - IPアドレス制限の検討（本番環境）

- Terraformセキュリティ
  - バージョン制約で安定性確保
  - 依存関係の明示的管理
  - API自動有効化で手動作業を削減

### 4.2 コスト管理

- Translation API料金
  - 月間50万文字まで無料
  - それ以降は$20/100万文字
  
- 用語集使用時の追加料金
  - 用語集を使用した翻訳は通常料金の2倍

### 4.3 制限事項

| 項目 | 制限値 |
|------|--------|
| 1リクエストあたりの最大文字数 | 30,000 |
| 用語集の最大エントリ数 | 10,000 |
| 用語集の最大サイズ | 10MB |
| 同時リクエスト数 | 100/秒 |

## 5. 災害復旧

プロトタイプのため最小限の考慮:
- サービスアカウントキーのバックアップ
- 用語集CSVファイルのバックアップ

## 6. 監視・ログ

プロトタイプのため実装しないが、本番環境では以下を検討:
- Cloud Loggingへのログ出力
- Cloud Monitoringでのエラー率監視
- 使用量アラート設定

## 7. 環境変数

オプションとして以下の環境変数をサポート可能（将来の拡張）:
```bash
GOOGLE_APPLICATION_CREDENTIALS=path/to/service_account_key.json
GOOGLE_CLOUD_PROJECT=project-id
```

## 8. セキュリティ改善の詳細

### 8.1 Terraform改善点

| 改善項目 | 旧設定 | 新設定 | 効果 |
|----------|---------|---------|-------|
| キー作成 | 自動作成・平文保存 | 手動作成のみ | セキュリティリスク減 |
| 権限設定 | storage.admin(全バケット) | storage.objectAdmin(特定バケットのみ) | 最小権限適用 |
| バケット作成 | スクリプトから作成 | Terraformで事前作成 | セキュリティ向上 |
| API有効化 | 手動作業 | Terraform自動化 | 運用効率向上 |
| バージョン制約 | なし | Terraform 1.0+ | 安定性向上 |
| 依存関係 | 明示なし | depends_on明示 | 作成順序保証 |

### 8.2 セキュリティチェックリスト

- [ ] サービスアカウントキーは.gitignoreに追加済み
- [ ] Terraformステートファイルにキー情報が含まれない
- [ ] IAM権限は最小限に設定済み（特定バケットのみのstorage.objectAdmin）
- [ ] Cloud StorageバケットはTerraformで事前作成
- [ ] バケット作成権限をサービスアカウントから削除
- [ ] API有効化は自動化済み
- [ ] 手動キー作成コマンドが出力される