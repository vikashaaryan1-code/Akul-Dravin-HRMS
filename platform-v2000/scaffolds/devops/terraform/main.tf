terraform {
  required_version = ">= 1.6.0"
}

provider "aws" {
  region = var.region
}

module "network" {
  source = "./modules/network"
  project = "akul-dravin-bos-v2000"
}

module "eks" {
  source = "./modules/eks"
  cluster_name = "akul-dravin-v2000"
  vpc_id = module.network.vpc_id
  subnet_ids = module.network.private_subnet_ids
}

module "databases" {
  source = "./modules/databases"
  vpc_id = module.network.vpc_id
  subnet_ids = module.network.private_subnet_ids
}
