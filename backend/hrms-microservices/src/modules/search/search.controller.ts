import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SearchService } from './search.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  /**
   * GET /search?q=ravi&types=employee,crm_lead&limit=20&offset=0
   * Tenant-scoped full-text search across all indexed entity types.
   */
  @Get()
  async search(
    @Query('q') q: string,
    @Query('types') types: string,
    @Query('limit') limit: string,
    @Query('offset') offset: string,
    @CurrentUser() user: { id: string; tenantId: string },
  ) {
    return this.searchService.search(user.tenantId, q ?? '', {
      entityTypes: types?.split(',').filter(Boolean),
      limit: Math.min(parseInt(limit ?? '20', 10), 100),
      offset: parseInt(offset ?? '0', 10),
    });
  }
}
