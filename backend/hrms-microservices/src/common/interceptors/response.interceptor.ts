import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  meta?: Record<string, unknown>;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    const req  = context.switchToHttp().getRequest();
    const start = Date.now();

    return next.handle().pipe(
      map((data) => ({
        success: true,
        data,
        meta: {
          timestamp:  new Date().toISOString(),
          requestId:  req?.id ?? req?.headers?.['x-request-id'] ?? undefined,
          durationMs: Date.now() - start,
        },
      })),
    );
  }
}
