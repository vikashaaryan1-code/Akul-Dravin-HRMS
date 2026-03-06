variable "project_name" {
  type        = string
  description = "Project identifier"
  default     = "akul-dravin-v1000"
}

variable "primary_region" {
  type        = string
  description = "Primary deployment region"
  default     = "ap-south-1"
}

variable "secondary_region" {
  type        = string
  description = "Disaster recovery region"
  default     = "eu-central-1"
}

variable "primary_cidr" {
  type        = string
  description = "Primary VPC CIDR"
  default     = "10.20.0.0/16"
}

variable "secondary_cidr" {
  type        = string
  description = "Secondary VPC CIDR"
  default     = "10.30.0.0/16"
}

variable "core_db_name" {
  type        = string
  description = "Primary transactional database"
  default     = "akul_dravin_hrms"
}

variable "analytics_db_name" {
  type        = string
  description = "Timeseries analytics database"
  default     = "akul_dravin_analytics"
}
