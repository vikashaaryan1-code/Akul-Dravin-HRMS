terraform {
  required_version = ">= 1.6.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.primary_region
}

provider "aws" {
  alias  = "secondary"
  region = var.secondary_region
}

module "primary_network" {
  source = "./modules/network"

  project_name = var.project_name
  region       = var.primary_region
  cidr_block   = var.primary_cidr
}

module "secondary_network" {
  source = "./modules/network"
  providers = {
    aws = aws.secondary
  }

  project_name = var.project_name
  region       = var.secondary_region
  cidr_block   = var.secondary_cidr
}

module "primary_eks" {
  source = "./modules/eks"

  project_name = var.project_name
  region       = var.primary_region
  vpc_id       = module.primary_network.vpc_id
  subnet_ids   = module.primary_network.private_subnet_ids
}

module "secondary_eks" {
  source = "./modules/eks"
  providers = {
    aws = aws.secondary
  }

  project_name = var.project_name
  region       = var.secondary_region
  vpc_id       = module.secondary_network.vpc_id
  subnet_ids   = module.secondary_network.private_subnet_ids
}

module "global_data_plane" {
  source = "./modules/data-plane"

  project_name      = var.project_name
  primary_region    = var.primary_region
  secondary_region  = var.secondary_region
  core_db_name      = var.core_db_name
  analytics_db_name = var.analytics_db_name
}
