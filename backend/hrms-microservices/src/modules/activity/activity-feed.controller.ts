import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ActivityFeedService } from './activity-feed.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('activity')
export class ActivityFeedController {
  constructor(private readonly activityFeed: ActivityFeedService) {}

  /** GET /activity — tenant-wide activity feed */
  @Get()
  async getTenantFeed(
    @Query('limit') limit: string,
    @Query('offset') offset: string,
    @CurrentUser() user: { id: string; tenantId: string },
  ) {
    return this.activityFeed.getTenantFeed(
      user.tenantId,
      Math.min(parseInt(limit ?? '50', 10), 200),
      parseInt(offset ?? '0', 10),
    );
  }

  /** GET /activity/me — current user's personal timeline */
  @Get('me')
  async getMyTimeline(@CurrentUser() user: { id: string; tenantId: string }) {
    return this.activityFeed.getActorTimeline(user.id, user.tenantId);
  }

  /** GET /activity/:entityType/:entityId — entity-specific timeline */
  @Get(':entityType/:entityId')
  async getEntityTimeline(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
    @CurrentUser() user: { id: string; tenantId: string },
  ) {
    return this.activityFeed.getEntityTimeline(entityType, entityId, user.tenantId);
  }
}
