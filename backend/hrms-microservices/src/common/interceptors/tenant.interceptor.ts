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
        // 1. Set the imperative context for application logic
        TenantContext.setTenantId(tenantId);
        
        // 2. Set the global transaction manager for scoped access
        TenantContext.setManager(manager);

        // 3. Initialize the Postgres session variable for RLS
        // SET LOCAL ensures the variable expires at the end of this transaction
        await TenantContext.setTenantSession(manager, tenantId);

        // 4. Optional: Map the manager to the request if any controllers need direct access
        (request as any).tenantManager = manager;

        // 5. Execute the actual request handler
        return await lastValueFrom(next.handle());
      })
    );
  }
}
