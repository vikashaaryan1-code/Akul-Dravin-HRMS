# Terraform Baseline

This folder provides v1000 multi-region IaC baseline.

## Modules expected
- `modules/network`
- `modules/eks`
- `modules/data-plane`

## Deployment model
- Primary region active workload cluster.
- Secondary region warm standby cluster.
- Replicated data plane (core + analytics).

## Expected extensions
- WAF and zero trust ingress policy.
- KMS envelope encryption.
- Region-wise data residency policy toggles.
