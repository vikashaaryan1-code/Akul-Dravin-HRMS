output "primary_cluster_name" {
  value = module.primary_eks.cluster_name
}

output "secondary_cluster_name" {
  value = module.secondary_eks.cluster_name
}

output "primary_vpc_id" {
  value = module.primary_network.vpc_id
}

output "secondary_vpc_id" {
  value = module.secondary_network.vpc_id
}
