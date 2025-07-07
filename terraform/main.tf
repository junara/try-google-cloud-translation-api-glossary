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

# 必要なAPIの有効化
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