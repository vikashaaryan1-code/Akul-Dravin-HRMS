# AKUL DRAVIN HRMS AI - Administrator Manual

Welcome to the Sovereign AI OS Administration Guide. This manual outlines how to manage, configure, and monitor the AKUL DRAVIN HRMS platform.

## 1. System Configuration & Setup

### Pricing & Subscriptions
The system operates on a 7-Tier pricing model designed to cater to diverse business needs:
1. **Free**: 1–5 Employees (₹0) - Best for Trials.
2. **HR Lite**: 6–25 Employees (₹999) - Best for Small Offices.
3. **HR Pro**: 26–50 Employees (₹2,499) - Best for SMEs.
4. **HR + Payroll**: 51–100 Employees (₹4,999) - Best for Growing Companies.
5. **Business HRMS**: 101–250 Employees (₹9,999) - Best for Medium Businesses.
6. **Premium HRMS**: 251–500 Employees (₹17,999) - Best for Large Businesses.
7. **Enterprise**: 500+ Employees (Custom) - Best for Corporate & Enterprise.

**How to manage:**
Navigate to the `Super Admin` -> `Subscriptions` module to monitor active licenses, upgrade organizations, or handle billing anomalies.

## 2. Role-Based Access Control (RBAC)

The platform natively supports three primary archetypes:
- **Business Owner**: Full visibility across all modules, ledgers, and AI insights.
- **HR Manager**: Access to Employee Lifecycle, ATS (Recruitment), Onboarding, and Document Generation.
- **Accountant / Finance**: Access to the Deterministic Ledger, Payroll execution, and zero-sum financial reporting.

## 3. Monitoring the Node 8 Engine

The AI Engine regulates system health autonomously. However, administrators should monitor the `Analytics/Observability` dashboard for:
- **Autonomic Throttling Events:** When the system injects latency during traffic bursts.
- **Soft Quarantine Flags:** Accounts that have been restricted due to erratic mutation attempts.
- **Vascular Pressure Maps:** System saturation metrics.

## 4. Document Engine & Templates

All generated documents (Payslips, Offer Letters) are signed and watermarked. 
- Ensure that your custom company templates are loaded via the `Document Center`. 
- The system automatically handles standard watermarking (`AKUL DRAVIN`) and verification generation.
