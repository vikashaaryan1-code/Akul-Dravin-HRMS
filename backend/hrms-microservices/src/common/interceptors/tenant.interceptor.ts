import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { from, lastValueFrom } from 'rxjs';
import { TenantContext } from '../context/tenant-context';

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  constructor(private dataSource: DataSource) {}

  async intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest();

    // Check if we are on a public route (consistent with TenantMiddleware)
    if (request.path.includes('/auth/') || request.path === '/') {
      return next.handle();
    }

    const user = (request as any).user;
    const tenantId = user?.tenantId;

    if (!tenantId) {
      throw new BadRequestException('Tenant ID missing from authenticated context.');
    }

    // Wrap the entire request in a transaction to safely use SET LOCAL
    return from(
      this.dataSource.transaction(async (manager) => {
        // Use the proper scoped runners that back AsyncLocalStorage
        return TenantContext.runWithManager(manager, () =>
          TenantContext.runScoped(
            tenantId,
            // Settings are loaded lazily inside handlers; pass empty sentinel here
            {} as any,
            { epochHash: 'LEGACY_UNANCHORED', confidence: 0, residualRisk: 'UNGOVERNED_EXECUTION' },
            async () => {
              // Initialize the Postgres session variable for RLS
              await TenantContext.setTenantSession(manager, tenantId);

              // Make the manager available on request for controllers that need direct access
              (request as any).tenantManager = manager;

              // Execute the actual request handler
              return await lastValueFrom(next.handle());
            },
          )
        );
      })
    );
  }
}
