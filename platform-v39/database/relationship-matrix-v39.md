# Relationship Matrix v39

| Parent | Child | Cardinality | Key |
|---|---|---|---|
| tenants | companies | 1:N | tenant_id |
| companies | employees | 1:N | company_id |
| employees | attendance_records | 1:N | employee_id |
| employees | leave_requests | 1:N | employee_id |
| payroll_runs | payroll_run_items | 1:N | payroll_run_id |
| job_posts | applications | 1:N | job_post_id |
| applications | interviews | 1:N | application_id |
| applications | offers | 1:N | application_id |
| recruiters | recruiter_assignments | 1:N | recruiter_id |
| recruiters | recruiter_placements | 1:N | recruiter_id |
| subscriptions | invoices | 1:N | subscription_id |
| invoices | payments | 1:N | invoice_id |
| ml_models | ml_model_versions | 1:N | model_id |
| ml_model_versions | ai_inference_logs | 1:N | model_version_id |
| virtual_offices | virtual_rooms | 1:N | office_id |
| workflow_instances | workflow_tasks | 1:N | workflow_instance_id |
| report_definitions | report_runs | 1:N | report_definition_id |

Extended relationships should be maintained in ERD source files and migration docs.
