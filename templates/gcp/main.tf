# Google Cloud Platform Migration Terraform Template

terraform {
  required_version = ">= 1.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project = var.gcp_project_id
  region  = var.gcp_region
}

# VPC Network
resource "google_compute_network" "migration_vpc" {
  name                    = "${var.project_name}-vpc"
  auto_create_subnetworks = false
}

# Subnets
resource "google_compute_subnetwork" "app_subnet" {
  name          = "${var.project_name}-app-subnet"
  ip_cidr_range = var.app_subnet_cidr
  region        = var.gcp_region
  network       = google_compute_network.migration_vpc.id
}

# GKE Cluster
resource "google_container_cluster" "migration_gke" {
  name     = "${var.project_name}-gke"
  location = var.gcp_region

  initial_node_count = var.initial_node_count

  node_config {
    machine_type = var.machine_type
    disk_size_gb = var.disk_size_gb

    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform"
    ]
  }

  network    = google_compute_network.migration_vpc.name
  subnetwork = google_compute_subnetwork.app_subnet.name
}

# Cloud SQL Instance (PostgreSQL)
resource "google_sql_database_instance" "migration_db" {
  name             = "${var.project_name}-db"
  database_version = "POSTGRES_15"
  region           = var.gcp_region

  settings {
    tier = var.db_tier
  }
}

output "gke_cluster_name" {
  value = google_container_cluster.migration_gke.name
}

output "database_connection_name" {
  value = google_sql_database_instance.migration_db.connection_name
}
