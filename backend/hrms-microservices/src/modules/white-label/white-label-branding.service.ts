import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WhiteLabelConfigEntity } from '../../database/entities/white-label-config.entity';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface TenantBrandingToken {
  tenantId: string;
  brandName: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  loginBgUrl: string | null;
  loginTagline: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  sidebarBg: string | null;
  customCss: string | null;
  /** Resolved from customDomain or fallback. Used for og:url, canonical links. */
  canonicalDomain: string;
  /** Email template context: from display name */
  emailFromName: string | null;
  emailFromAddress: string | null;
  /** Feature toggles — tenant-visible feature set */
  featureToggles: Record<string, boolean>;
  /** Pricing overrides for reseller white-label */
  pricingControl: Record<string, unknown>;
  /** Tenant entitlements — module access caps */
  entitlements: TenantEntitlements;
}

export interface TenantEntitlements {
  maxEmployees: number | null;
  maxRecruiters: number | null;
  maxJobPostings: number | null;
  allowedModules: string[];
  analyticsRetentionDays: number;
  aiEnabled: boolean;
  customDomainEnabled: boolean;
  whiteLabeled: boolean;
  apiAccessEnabled: boolean;
}

export interface EmailTemplateContext {
  brandName: string;
  logoUrl: string | null;
  primaryColor: string;
  accentColor: string;
  fromName: string;
  fromEmail: string;
  supportEmail: string;
  websiteUrl: string;
}

export interface DomainVerificationResult {
  domain: string;
  verified: boolean;
  dnsRecord: string;
  verificationToken: string;
  instructions: string;
}

export interface PartnerClientSummary {
  tenantId: string;
  brandName: string | null;
  customDomain: string | null;
  domainVerified: boolean;
  plan: string;
  employeeCount: number;
  whiteLabeled: boolean;
  createdAt: Date;
}

// ─────────────────────────────────────────────────────────────────────────────
// DEFAULT ENTITLEMENTS BY PLAN
// ─────────────────────────────────────────────────────────────────────────────

const PLAN_ENTITLEMENTS: Record<string, TenantEntitlements> = {
  starter: {
    maxEmployees: 25,
    maxRecruiters: 2,
    maxJobPostings: 5,
    allowedModules: ['employees', 'attendance', 'leave', 'payroll', 'documents'],
    analyticsRetentionDays: 90,
    aiEnabled: false,
    customDomainEnabled: false,
    whiteLabeled: false,
    apiAccessEnabled: false,
  },
  professional: {
    maxEmployees: 200,
    maxRecruiters: 10,
    maxJobPostings: 30,
    allowedModules: [
      'employees', 'attendance', 'leave', 'payroll', 'documents',
      'recruitment', 'performance', 'analytics', 'helpdesk', 'crm',
    ],
    analyticsRetentionDays: 365,
    aiEnabled: true,
    customDomainEnabled: false,
    whiteLabeled: false,
    apiAccessEnabled: false,
  },
  enterprise: {
    maxEmployees: null,   // unlimited
    maxRecruiters: null,
    maxJobPostings: null,
    allowedModules: ['*'], // all modules
    analyticsRetentionDays: 1095, // 3 years
    aiEnabled: true,
    customDomainEnabled: true,
    whiteLabeled: true,
    apiAccessEnabled: true,
  },
  white_label: {
    maxEmployees: null,
    maxRecruiters: null,
    maxJobPostings: null,
    allowedModules: ['*'],
    analyticsRetentionDays: 1095,
    aiEnabled: true,
    customDomainEnabled: true,
    whiteLabeled: true,
    apiAccessEnabled: true,
  },
};

const DEFAULT_ENTITLEMENTS: TenantEntitlements = PLAN_ENTITLEMENTS.starter;

// ─────────────────────────────────────────────────────────────────────────────
// SERVICE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * WHITE LABEL BRANDING SERVICE
 *
 * PRD §12 — White Label & Partner Engine:
 *   Tenant theme injection, custom domain routing, branding resolution,
 *   email template context generation, and partner client management.
 *
 * This service is the commercial multiplier — it transforms a SaaS platform
 * into resellable infrastructure.
 */
@Injectable()
export class WhiteLabelBrandingService {
  private readonly logger = new Logger(WhiteLabelBrandingService.name);

  /** In-memory branding cache (LRU-approximation by Map insertion order) */
  private readonly brandingCache = new Map<string, { token: TenantBrandingToken; expiresAt: number }>();
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

  /** Domain → tenantId reverse lookup cache */
  private readonly domainCache = new Map<string, { tenantId: string; expiresAt: number }>();

  constructor(
    @InjectRepository(WhiteLabelConfigEntity)
    private readonly configRepo: Repository<WhiteLabelConfigEntity>,
  ) {}

  // ── Branding Token Resolution ─────────────────────────────────────────────

  /**
   * Resolves the full branding token for a tenant.
   * Cached with 5-minute TTL — invalidated on upsert.
   */
  async resolveBrandingToken(tenantId: string): Promise<TenantBrandingToken> {
    const cached = this.brandingCache.get(tenantId);
    if (cached && cached.expiresAt > Date.now()) return cached.token;

    const config = await this.configRepo.findOne({ where: { tenantId } });
    const token  = this.buildToken(tenantId, config);

    this.brandingCache.set(tenantId, { token, expiresAt: Date.now() + this.CACHE_TTL_MS });
    return token;
  }

  /**
   * Resolves tenantId from a custom domain (reverse lookup).
   * Used by the domain resolver middleware.
   */
  async resolveTenantIdFromDomain(domain: string): Promise<string | null> {
    const normalized = domain.toLowerCase().trim().replace(/^www\./, '');

    const cached = this.domainCache.get(normalized);
    if (cached && cached.expiresAt > Date.now()) return cached.tenantId;

    const config = await this.configRepo.findOne({
      where: { customDomain: normalized } as any,
      select: ['tenantId'],
    });

    if (!config) return null;

    this.domainCache.set(normalized, {
      tenantId: config.tenantId,
      expiresAt: Date.now() + this.CACHE_TTL_MS,
    });

    this.logger.log(`DOMAIN_RESOLVE: ${normalized} → tenantId=${config.tenantId}`);
    return config.tenantId;
  }

  // ── Token Builder ─────────────────────────────────────────────────────────

  private buildToken(tenantId: string, config: WhiteLabelConfigEntity | null): TenantBrandingToken {
    const entitlementsMeta = (config as any)?.entitlements as TenantEntitlements | undefined;
    const plan = (config as any)?.pricingControl?.plan as string | undefined ?? 'starter';

    return {
      tenantId,
      brandName:      config?.brandName ?? 'Akul Dravin HRMS',
      logoUrl:        config?.logoUrl ?? null,
      faviconUrl:     config?.faviconUrl ?? null,
      loginBgUrl:     config?.loginBgUrl ?? null,
      loginTagline:   config?.loginTagline ?? 'Enterprise HR Intelligence Platform',
      primaryColor:   config?.primaryColor  ?? '#3b82f6',
      secondaryColor: config?.secondaryColor ?? '#8b5cf6',
      accentColor:    config?.accentColor   ?? '#22d3ee',
      sidebarBg:      config?.sidebarBg ?? null,
      customCss:      config?.customCss ?? null,
      canonicalDomain: config?.customDomain
        ? `https://${config.customDomain}`
        : `https://app.akulhrms.com`,
      emailFromName:    config?.fromName ?? config?.brandName ?? 'Akul Dravin HRMS',
      emailFromAddress: config?.fromEmail ?? 'noreply@akulhrms.com',
      featureToggles:  config?.featureToggles ?? {},
      pricingControl:  (config as any)?.pricingControl ?? {},
      entitlements:   entitlementsMeta ?? PLAN_ENTITLEMENTS[plan] ?? DEFAULT_ENTITLEMENTS,
    };
  }

  // ── Email Template Context ─────────────────────────────────────────────────

  async getEmailTemplateContext(tenantId: string): Promise<EmailTemplateContext> {
    const token = await this.resolveBrandingToken(tenantId);
    return {
      brandName:    token.brandName,
      logoUrl:      token.logoUrl,
      primaryColor: token.primaryColor,
      accentColor:  token.accentColor,
      fromName:     token.emailFromName ?? token.brandName,
      fromEmail:    token.emailFromAddress ?? 'noreply@akulhrms.com',
      supportEmail: `support@${token.canonicalDomain.replace('https://', '')}`,
      websiteUrl:   token.canonicalDomain,
    };
  }

  // ── Domain Verification ───────────────────────────────────────────────────

  async initiateDomainVerification(
    tenantId: string,
    domain: string,
  ): Promise<DomainVerificationResult> {
    // Generate a deterministic CNAME verification token
    const raw = `${tenantId}:${domain}:akul-hrms-verify`;
    const token = Buffer.from(raw).toString('base64url').slice(0, 32);

    await this.configRepo.update(
      { tenantId } as any,
      { customDomain: domain } as any,
    );

    this.domainCache.delete(domain); // bust cache

    return {
      domain,
      verified: false,
      dnsRecord: 'CNAME',
      verificationToken: token,
      instructions:
        `Add a CNAME record:\n` +
        `  Name:  _akul-verify.${domain}\n` +
        `  Value: ${token}.verify.akulhrms.com\n\n` +
        `DNS propagation takes 15–60 minutes. ` +
        `Once verified, point your root domain CNAME to: app.akulhrms.com`,
    };
  }

  async verifyDomain(tenantId: string): Promise<boolean> {
    // In production: perform actual DNS lookup via Node's `dns` module.
    // Placeholder: marks verified in DB.
    await this.configRepo.update(
      { tenantId } as any,
      { domainVerified: true } as any,
    );
    this.brandingCache.delete(tenantId); // bust branding cache
    this.logger.log(`DOMAIN_VERIFIED: tenantId=${tenantId}`);
    return true;
  }

  // ── Public Branding Endpoint (no auth) ────────────────────────────────────

  /**
   * Returns a safe, public subset of the branding token for login pages.
   * Does NOT expose SMTP credentials, entitlements, or pricing control.
   */
  async getPublicBranding(tenantIdOrDomain: string): Promise<{
    brandName: string;
    logoUrl: string | null;
    faviconUrl: string | null;
    loginBgUrl: string | null;
    loginTagline: string | null;
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    customCss: string | null;
  }> {
    // Try domain resolution first
    let tenantId = tenantIdOrDomain;
    if (tenantIdOrDomain.includes('.')) {
      tenantId = (await this.resolveTenantIdFromDomain(tenantIdOrDomain)) ?? tenantIdOrDomain;
    }

    const token = await this.resolveBrandingToken(tenantId);

    return {
      brandName:      token.brandName,
      logoUrl:        token.logoUrl,
      faviconUrl:     token.faviconUrl,
      loginBgUrl:     token.loginBgUrl,
      loginTagline:   token.loginTagline,
      primaryColor:   token.primaryColor,
      secondaryColor: token.secondaryColor,
      accentColor:    token.accentColor,
      customCss:      token.customCss,
    };
  }

  // ── Partner / Reseller Client Management ──────────────────────────────────

  async listPartnerClients(parentTenantId: string): Promise<PartnerClientSummary[]> {
    // Fetch all tenants configured under this reseller
    const configs = await this.configRepo.find({
      where: { parentTenantId } as any,
      order: { createdAt: 'DESC' },
    });

    return configs.map((c) => ({
      tenantId:      c.tenantId,
      brandName:     c.brandName,
      customDomain:  c.customDomain,
      domainVerified: !!(c as any).domainVerified,
      plan:          (c as any)?.pricingControl?.plan ?? 'starter',
      employeeCount: (c as any)?.employeeCount ?? 0,
      whiteLabeled:  !!(c.brandName || c.customDomain),
      createdAt:     c.createdAt,
    }));
  }

  async provisionPartnerClient(
    parentTenantId: string,
    newTenantId: string,
    options: {
      brandName?: string;
      primaryColor?: string;
      logoUrl?: string;
      plan?: string;
      maxEmployees?: number;
    },
  ): Promise<TenantBrandingToken> {
    const entitlements: TenantEntitlements = {
      ...(PLAN_ENTITLEMENTS[options.plan ?? 'starter'] ?? DEFAULT_ENTITLEMENTS),
      ...(options.maxEmployees ? { maxEmployees: options.maxEmployees } : {}),
    };

    const existing = await this.configRepo.findOne({ where: { tenantId: newTenantId } as any });
    if (!existing) {
      await this.configRepo.save(
        this.configRepo.create({
          tenantId:      newTenantId,
          brandName:     options.brandName ?? null,
          primaryColor:  options.primaryColor ?? '#3b82f6',
          logoUrl:       options.logoUrl ?? null,
          featureToggles: {},
          parentTenantId,
          pricingControl:  { plan: options.plan ?? 'starter' },
          entitlements,
        } as any),
      );
    }

    this.logger.log(
      `PARTNER_PROVISIONED: parent=${parentTenantId} child=${newTenantId} plan=${options.plan ?? 'starter'}`,
    );

    this.brandingCache.delete(newTenantId);
    return this.resolveBrandingToken(newTenantId);
  }

  // ── Entitlement Check ─────────────────────────────────────────────────────

  async checkEntitlement(
    tenantId: string,
    feature: keyof TenantEntitlements,
  ): Promise<boolean> {
    const token = await this.resolveBrandingToken(tenantId);
    const value = token.entitlements[feature];
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number')  return value > 0;
    if (Array.isArray(value))       return value.length > 0;
    return !!value;
  }

  async isModuleAllowed(tenantId: string, moduleName: string): Promise<boolean> {
    const token = await this.resolveBrandingToken(tenantId);
    const allowed = token.entitlements.allowedModules;
    return allowed.includes('*') || allowed.includes(moduleName);
  }

  // ── Cache Invalidation ────────────────────────────────────────────────────

  invalidateBrandingCache(tenantId: string): void {
    this.brandingCache.delete(tenantId);
    this.logger.debug(`BRANDING_CACHE_INVALIDATED: tenantId=${tenantId}`);
  }
}
