import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * @CurrentUser() — extracts the JWT payload injected by JwtAuthGuard / JwtStrategy.
 *
 * Usage:
 *   @UseGuards(JwtAuthGuard)
 *   @Get('me')
 *   getProfile(@CurrentUser() user: { sub: string; tenantId: string; email: string; role: string }) { ... }
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as { sub: string; tenantId: string; email: string; role: string };
  },
);
