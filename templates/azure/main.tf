# Azure Cloud Migration Terraform Template

terraform {
  required_version = ">= 1.0"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
}

provider "azurerm" {
  features {}
}

# Resource Group
resource "azurerm_resource_group" "migration_rg" {
  name     = "${var.project_name}-rg"
  location = var.azure_region

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}

# Virtual Network
resource "azurerm_virtual_network" "migration_vnet" {
  name                = "${var.project_name}-vnet"
  address_space       = [var.vnet_cidr]
  location            = azurerm_resource_group.migration_rg.location
  resource_group_name = azurerm_resource_group.migration_rg.name

  tags = {
    Name = "${var.project_name}-vnet"
  }
}

# Subnets
resource "azurerm_subnet" "app_subnet" {
  count                = length(var.availability_zones)
  name                 = "${var.project_name}-app-subnet-${count.index + 1}"
  resource_group_name  = azurerm_resource_group.migration_rg.name
  virtual_network_name = azurerm_virtual_network.migration_vnet.name
  address_prefixes     = [var.app_subnet_cidrs[count.index]]
}

# AKS Cluster
resource "azurerm_kubernetes_cluster" "migration_aks" {
  name                = "${var.project_name}-aks"
  location            = azurerm_resource_group.migration_rg.location
  resource_group_name = azurerm_resource_group.migration_rg.name
  dns_prefix          = var.project_name

  default_node_pool {
    name       = "default"
    node_count = var.node_count
    vm_size    = var.vm_size
  }

  identity {
    type = "SystemAssigned"
  }
}

# Azure Database for PostgreSQL
resource "azurerm_postgresql_server" "migration_db" {
  name                = "${var.project_name}-db"
  location            = azurerm_resource_group.migration_rg.location
  resource_group_name = azurerm_resource_group.migration_rg.name

  administrator_login          = var.db_admin_user
  administrator_login_password = var.db_admin_password

  sku_name   = var.db_sku
  storage_mb = var.db_storage_mb
  version    = "11"
}

output "resource_group_name" {
  value = azurerm_resource_group.migration_rg.name
}

output "aks_cluster_name" {
  value = azurerm_kubernetes_cluster.migration_aks.name
}

output "db_fqdn" {
  value = azurerm_postgresql_server.migration_db.fqdn
}
