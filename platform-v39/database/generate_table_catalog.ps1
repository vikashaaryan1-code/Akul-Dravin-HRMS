$domains = [ordered]@{
  'core_identity' = @(
    'users','user_identities','user_credentials','user_mfa_factors','user_sessions','user_devices','user_login_attempts','user_password_history','user_password_resets','user_api_tokens','user_oauth_clients','user_oauth_consents','user_webauthn_keys','roles','permissions','role_permissions','user_roles','policy_sets','policy_rules','policy_bindings','access_reviews','service_accounts','service_account_keys','auth_audit_events'
  );
  'tenant_whitelabel' = @(
    'tenants','tenant_regions','tenant_domains','tenant_settings','tenant_feature_flags','tenant_locales','tenant_localization_bundles','tenant_data_policies','tenant_kms_keys','tenant_brand_themes','tenant_brand_assets','tenant_sso_configs','tenant_saml_mappings','tenant_oidc_mappings','white_label_partners','partner_tenants','partner_pricing_rules','partner_revenue_shares','partner_invoices','partner_payouts','partner_contacts','tenant_onboarding_checklists'
  );
  'organization_hrms' = @(
    'companies','company_legal_entities','company_tax_profiles','company_bank_accounts','company_compliance_profiles','branches','branch_locations','branch_geofences','branch_calendars','departments','department_hierarchy','teams','team_memberships','designations','designation_levels','employment_types','work_modes','job_families','job_levels','employees','employee_numbers','employee_personal_profiles','employee_work_profiles','employee_contacts','employee_addresses','employee_emergency_contacts','employee_family_members','employee_dependents','employee_documents','employee_document_types','employee_certifications','employee_skills','employee_languages','employee_assignments','employee_managers','employee_lifecycle_events','employee_status_history','employee_transfers','employee_promotions','employee_exits','employee_exit_checklists','employee_rehires','employee_notes','employee_tags','employee_custom_fields','employee_custom_field_values','employee_privacy_consents'
  );
  'attendance_leave' = @(
    'shift_templates','shift_calendars','shift_assignments','shift_swaps','attendance_policies','attendance_rules','attendance_devices','attendance_device_logs','attendance_records','attendance_regularizations','attendance_exceptions','attendance_breaches','attendance_snapshots','overtime_policies','overtime_requests','overtime_approvals','overtime_records','holiday_calendars','holiday_events','leave_types','leave_policies','leave_policy_rules','leave_accrual_rules','leave_balances','leave_transactions','leave_requests','leave_request_approvals','leave_encashments','leave_carry_forward_runs','leave_blackout_periods','leave_attachments','leave_delegations','leave_audit_events','time_off_comp_off_ledger','time_off_lop_records','attendance_payroll_links','biometric_sync_jobs','biometric_sync_errors','gps_attendance_points','gps_spoofing_alerts'
  );
  'payroll' = @(
    'payroll_cycles','payroll_cycle_companies','payroll_runs','payroll_run_tasks','payroll_run_items','payroll_item_components','salary_structures','salary_structure_components','employee_salary_structures','employee_salary_revisions','compensation_bands','compensation_benchmarks','pay_components','pay_component_formulas','pay_component_overrides','tax_regimes','tax_slabs','tax_declarations','tax_declaration_items','tax_calculations','statutory_profiles','statutory_pf_records','statutory_esi_records','statutory_tds_records','statutory_pt_records','statutory_lwf_records','reimbursement_policies','reimbursement_claims','reimbursement_claim_items','reimbursement_approvals','loan_policies','employee_loans','loan_repayments','bonus_policies','bonus_awards','payroll_adjustments','arrear_entries','deduction_recoveries','payroll_approvals','payroll_locks','payslips','payslip_distribution_logs','bank_transfer_batches','bank_transfer_items','bank_transfer_failures','payroll_journal_mappings','payroll_journal_entries','payroll_audit_events','payroll_kpi_snapshots','payroll_reconciliation_runs','payroll_reconciliation_items'
  );
  'performance_lms' = @(
    'performance_cycles','performance_templates','performance_goals','performance_goal_updates','performance_reviews','performance_review_sections','performance_ratings','performance_feedback','performance_360_reviewers','performance_360_responses','performance_calibrations','performance_pips','learning_paths','learning_courses','learning_enrollments','learning_progress','learning_assessments','learning_certificates','okrs','okr_key_results','career_paths','succession_pools','succession_candidates','talent_matrix_snapshots'
  );
  'recruitment_ats' = @(
    'job_requisitions','requisition_approvals','requisition_budgets','requisition_hiring_panels','job_posts','job_post_channels','job_post_skills','job_post_questions','job_post_benefits','candidate_profiles','candidate_documents','candidate_resumes','candidate_resume_parses','candidate_experiences','candidate_educations','candidate_certifications','candidate_portfolios','candidate_preferences','candidate_consents','candidate_tags','candidate_source_events','applications','application_stage_history','application_notes','application_tasks','application_screening_scores','application_risk_flags','interview_plans','interviews','interview_panel_members','interview_feedback','interview_scorecards','interview_recordings','interview_transcripts','interview_ai_summaries','assessments','assessment_attempts','assessment_scores','offers','offer_approvals','offer_revisions','offer_documents','offer_acceptance_events','hire_events','onboarding_batches','onboarding_tasks','onboarding_documents','onboarding_checklists','onboarding_progress'
  );
  'recruiter_marketplace' = @(
    'recruiters','recruiter_profiles','recruiter_verifications','recruiter_kyc_documents','recruiter_specializations','recruiter_locations','recruiter_agreements','recruiter_assignments','recruiter_candidate_submissions','recruiter_submission_notes','recruiter_shortlists','recruiter_interview_coordination','recruiter_placements','placement_commissions','commission_rules','commission_calculations','commission_invoices','commission_payouts','commission_payout_items','commission_disputes','recruiter_ratings','recruiter_rankings','recruiter_leaderboards','recruiter_badges','recruiter_wallets','recruiter_wallet_transactions','recruiter_referrals','recruiter_notifications','recruiter_earnings_snapshots','marketplace_listings','marketplace_listing_features','marketplace_listing_views','marketplace_saved_searches','marketplace_alerts','marketplace_campaigns'
  );
  'erp_finance' = @(
    'coa_accounts','coa_account_groups','fiscal_years','fiscal_periods','journal_batches','journal_entries','journal_lines','ledger_balances','ledger_snapshots','trial_balance_snapshots','cost_centers','profit_centers','business_units','intercompany_accounts','intercompany_transactions','bank_accounts','bank_statements','bank_statement_lines','bank_reconciliations','bank_reconciliation_items','customer_accounts','customer_credit_limits','ar_invoices','ar_invoice_lines','ar_receipts','ar_credit_notes','ap_vendors','ap_invoices','ap_invoice_lines','ap_payments','ap_debit_notes','tax_codes','tax_jurisdictions','tax_transactions','tax_returns','withholding_tax_records','cash_flow_forecasts','budget_headers','budget_lines','expense_claims','expense_claim_lines','expense_approvals','close_checklists','close_tasks','close_logs'
  );
  'erp_procurement' = @(
    'vendors','vendor_contacts','vendor_addresses','vendor_bank_accounts','vendor_documents','vendor_ratings','vendor_contracts','vendor_contract_versions','vendor_compliance_checks','purchase_requisitions','purchase_requisition_lines','purchase_requisition_approvals','request_for_quotations','rfq_vendors','rfq_responses','quote_comparisons','purchase_orders','purchase_order_lines','purchase_order_approvals','purchase_order_revisions','goods_receipts','goods_receipt_lines','service_receipts','procurement_returns','procurement_disputes','procurement_kpi_snapshots','supplier_scorecards','sourcing_events','sourcing_bids','sourcing_awards'
  );
  'erp_inventory' = @(
    'warehouses','warehouse_zones','warehouse_bins','inventory_items','item_categories','item_uoms','item_attributes','item_attribute_values','item_lots','item_serials','item_barcodes','inventory_opening_balances','stock_balances','stock_movements','stock_adjustments','stock_transfers','stock_transfer_lines','stock_reservations','stock_reservation_lines','reorder_rules','reorder_recommendations','cycle_count_plans','cycle_count_tasks','cycle_count_results','inventory_valuation_runs','inventory_valuation_lines','inventory_cost_layers','bom_headers','bom_lines','material_requirements','production_orders','production_order_lines','production_consumptions','production_outputs'
  );
  'erp_assets_budget' = @(
    'assets','asset_categories','asset_locations','asset_assignments','asset_maintenance_plans','asset_maintenance_logs','asset_warranties','asset_depreciation_methods','asset_depreciation_runs','asset_depreciation_lines','asset_revaluations','asset_disposals','asset_disposal_lines','asset_insurance_policies','capex_requests','capex_approvals','project_budgets','project_budget_lines','budget_versions','budget_scenarios','budget_forecasts','budget_variance_reports','travel_policies','travel_requests','travel_bookings','travel_expenses','expense_policy_rules','expense_audit_flags','asset_audit_events','budget_audit_events'
  );
  'billing_subscription' = @(
    'pricing_plans','plan_features','plan_feature_limits','plan_price_books','subscription_contracts','subscriptions','subscription_items','subscription_change_requests','subscription_usage_meters','usage_meter_events','invoices','invoice_lines','invoice_taxes','invoice_adjustments','payment_intents','payments','payment_methods','payment_method_tokens','payment_webhooks','payment_refunds','credit_notes','debit_notes','billing_addresses','billing_contacts','billing_cycles','billing_run_logs','billing_dunning_rules','billing_dunning_events','billing_collections','billing_reconciliation_runs','billing_reconciliation_items','coupon_campaigns','coupon_redemptions'
  );
  'workflow_notification_integration' = @(
    'notification_templates','notification_template_versions','notification_channels','notification_preferences','notification_events','notifications','notification_delivery_attempts','notification_delivery_receipts','notification_failures','workflow_definitions','workflow_versions','workflow_instances','workflow_tasks','workflow_task_assignments','workflow_task_actions','workflow_slas','workflow_escalations','approval_policies','approval_policy_rules','approval_instances','approval_steps','approval_actions','webhook_endpoints','webhook_subscriptions','webhook_deliveries','webhook_delivery_attempts','integration_connectors','integration_credentials','integration_sync_jobs','integration_sync_errors'
  );
  'analytics_reporting' = @(
    'analytics_events','analytics_event_dead_letters','analytics_stream_offsets','kpi_definitions','kpi_targets','kpi_daily_snapshots','kpi_weekly_snapshots','kpi_monthly_snapshots','dashboard_definitions','dashboard_widgets','dashboard_widget_queries','dashboard_subscriptions','report_definitions','report_versions','report_filters','report_schedules','report_runs','report_run_artifacts','report_distribution_logs','data_quality_rules','data_quality_results','data_quality_incidents','data_lineage_jobs','data_lineage_edges','data_mart_tables','data_mart_refresh_runs','olap_query_logs','query_performance_logs','forecast_runs','forecast_outputs','forecast_accuracy_metrics','anomaly_alerts','anomaly_alert_events','cohort_definitions','cohort_memberships','benchmark_definitions','benchmark_results','analytics_access_logs','analytics_cost_snapshots'
  );
  'ai_platform' = @(
    'ml_models','ml_model_versions','model_deployment_targets','model_deployment_events','model_artifacts','model_training_runs','model_training_datasets','model_training_metrics','model_eval_reports','model_fairness_reports','model_drift_monitors','model_drift_events','model_retraining_policies','model_retraining_runs','feature_definitions','feature_groups','feature_store_snapshots','feature_backfill_runs','inference_requests','inference_responses','ai_inference_logs','ai_recommendations','recommendation_feedback','recommendation_overrides','nlp_intents','nlp_entities','nlp_training_corpora','chat_sessions','chat_messages','chat_context_windows','chat_guardrail_events','voice_interactions','voice_transcripts','emotion_analysis_results','wellness_risk_scores','burnout_risk_scores','ai_prompt_templates','ai_prompt_versions'
  );
  'metaverse' = @(
    'virtual_offices','virtual_office_themes','virtual_rooms','virtual_room_layouts','virtual_room_assets','avatars','avatar_customizations','presence_sessions','presence_events','virtual_meetings','virtual_meeting_participants','virtual_whiteboards','virtual_whiteboard_events','virtual_training_programs','virtual_training_sessions','virtual_training_attendance','virtual_badges','virtual_rewards','metaverse_activity_logs','metaverse_moderation_flags'
  );
  'platform_ops_security' = @(
    'audit_logs','audit_log_archives','api_access_logs','security_incidents','security_alerts','threat_detections','fraud_alerts','fraud_cases','fraud_case_actions','fraud_models','data_retention_policies','data_retention_jobs','data_purge_logs','backup_jobs','backup_artifacts','restore_jobs','slo_definitions','slo_measurements','error_budget_policies','error_budget_burns','deployment_releases','deployment_rollbacks','service_health_checks','service_dependency_maps','feature_flags','feature_flag_rules','config_items','config_change_logs','runbook_definitions','incident_timelines'
  )
}

$ownerMap = @{
  'core_identity'='auth-service';
  'tenant_whitelabel'='company-service';
  'organization_hrms'='employee-service';
  'attendance_leave'='attendance-service';
  'payroll'='payroll-service';
  'performance_lms'='employee-service';
  'recruitment_ats'='recruitment-service';
  'recruiter_marketplace'='recruiter-service';
  'erp_finance'='erp-finance-service';
  'erp_procurement'='erp-procurement-service';
  'erp_inventory'='erp-inventory-service';
  'erp_assets_budget'='erp-assets-service';
  'billing_subscription'='billing-service';
  'workflow_notification_integration'='notification-service';
  'analytics_reporting'='analytics-service';
  'ai_platform'='ai-engine-service';
  'metaverse'='metaverse-service';
  'platform_ops_security'='platform-ops-service';
}

$rows = @()
foreach($domain in $domains.Keys){
  foreach($table in $domains[$domain]){
    $partition='none'
    if($table -match '(events|logs|snapshots|inference|presence|delivery_attempts|usage_meter|stream_offsets|history)$'){ $partition='monthly_time' }
    $pii='low'
    if($table -match '(user|employee|candidate|recruiter|contact|address|voice|chat|identity|session|consent|personal)'){ $pii='high' }
    elseif($table -match '(payroll|salary|invoice|payment|tax|bank|credential|security|fraud)'){ $pii='restricted' }
    elseif($table -match '(analytics|kpi|report|forecast|model|feature|inventory|procurement|workflow)'){ $pii='medium' }

    $rows += [PSCustomObject]@{
      schema_name='platform'
      domain=$domain
      table_name=$table
      owner_service=$ownerMap[$domain]
      tenant_scoped='yes'
      partition_strategy=$partition
      pii_class=$pii
    }
  }
}

$csvPath = 'platform-v39/database/table-catalog-v39.csv'
$rows | Sort-Object domain, table_name | Export-Csv -Path $csvPath -NoTypeInformation -Encoding UTF8

$summary = $rows | Group-Object domain | Sort-Object Name
$total = $rows.Count

$mdPath = 'platform-v39/database/complete-database-architecture-300-plus.md'
$lines = @()
$lines += '# Complete Database Architecture (300+ Tables)'
$lines += ''
$lines += '## Scope'
$lines += '- Target: enterprise-grade, multi-tenant schema for AKUL DRAVIN HRMS & ERP v39.0'
$lines += "- Total planned operational tables in this catalog: **$total**"
$lines += '- Catalog source: `table-catalog-v39.csv`'
$lines += ''
$lines += '## Core Principles'
$lines += '- All tenant-owned tables include `tenant_id` and use tenant-safe foreign keys.'
$lines += '- UUID primary keys, strict enum/check constraints, and auditable change trails.'
$lines += '- Time-series heavy tables use monthly partition strategy or Timescale hypertables.'
$lines += '- PII classification and column-level policy controls are mandatory.'
$lines += ''
$lines += '## Domain-Wise Table Allocation'
$lines += '| Domain | Table Count | Primary Service |'
$lines += '|---|---:|---|'
foreach($g in $summary){
  $svc = ($rows | Where-Object { $_.domain -eq $g.Name } | Select-Object -First 1).owner_service
  $lines += "| $($g.Name) | $($g.Count) | $svc |"
}
$lines += ''
$lines += '## Relationship Backbone (Critical)'
$lines += '- `tenants -> companies -> branches -> departments -> employees`'
$lines += '- `employees -> attendance_records -> payroll_runs/payroll_run_items/payslips`'
$lines += '- `job_requisitions/job_posts -> applications -> interviews -> offers -> hire_events`'
$lines += '- `recruiters -> recruiter_assignments -> recruiter_candidate_submissions -> recruiter_placements -> commission_payouts`'
$lines += '- `subscriptions -> invoices -> payments`'
$lines += '- `analytics_events`, `audit_logs`, `ai_inference_logs` feed reporting and AI monitoring layers.'
$lines += ''
$lines += '## Partition and Retention Model'
$lines += '- Monthly partition tables: events/logs/snapshots/inference/presence streams.'
$lines += '- Retention tiers: hot (0-6m), warm (7-24m), cold archive (24m+ as policy requires).'
$lines += '- See: `partitioning-strategy.md` and `timescaledb-hypertables.sql`.'
$lines += ''
$lines += '## Implementation Guidance'
$lines += '1. Implement in domain migration packs (IAM, HRMS, ERP, Talent, Billing, Analytics, AI, Metaverse).'
$lines += '2. Enforce RLS + app-layer authorization together.'
$lines += '3. Validate every migration with contract tests and data rollback drills.'
$lines += '4. Use materialized views for heavy dashboards; keep OLTP paths lean.'
$lines += ''
$lines += '## Artifacts'
$lines += '- `table-catalog-v39.csv` (full 300+ table list)'
$lines += '- `schema-v39.sql` (reference consolidated schema)'
$lines += '- `timescaledb-hypertables.sql` (high-volume time-series optimization)'

Set-Content -Path $mdPath -Value $lines -Encoding UTF8

$relPath = 'platform-v39/database/relationship-matrix-v39.md'
$rel = @()
$rel += '# Relationship Matrix v39'
$rel += ''
$rel += '| Parent | Child | Cardinality | Key |'
$rel += '|---|---|---|---|'
$rel += '| tenants | companies | 1:N | tenant_id |'
$rel += '| companies | employees | 1:N | company_id |'
$rel += '| employees | attendance_records | 1:N | employee_id |'
$rel += '| employees | leave_requests | 1:N | employee_id |'
$rel += '| payroll_runs | payroll_run_items | 1:N | payroll_run_id |'
$rel += '| job_posts | applications | 1:N | job_post_id |'
$rel += '| applications | interviews | 1:N | application_id |'
$rel += '| applications | offers | 1:N | application_id |'
$rel += '| recruiters | recruiter_assignments | 1:N | recruiter_id |'
$rel += '| recruiters | recruiter_placements | 1:N | recruiter_id |'
$rel += '| subscriptions | invoices | 1:N | subscription_id |'
$rel += '| invoices | payments | 1:N | invoice_id |'
$rel += '| ml_models | ml_model_versions | 1:N | model_id |'
$rel += '| ml_model_versions | ai_inference_logs | 1:N | model_version_id |'
$rel += '| virtual_offices | virtual_rooms | 1:N | office_id |'
$rel += '| workflow_instances | workflow_tasks | 1:N | workflow_instance_id |'
$rel += '| report_definitions | report_runs | 1:N | report_definition_id |'
$rel += ''
$rel += 'Extended relationships should be maintained in ERD source files and migration docs.'
Set-Content -Path $relPath -Value $rel -Encoding UTF8

Write-Output "CatalogRows=$total"
