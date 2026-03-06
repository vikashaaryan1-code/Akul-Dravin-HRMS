import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { MarketplaceService } from './marketplace.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { CreateMarketplaceListingDto } from './dto/create-marketplace-listing.dto';
import { UpdateMarketplaceListingDto } from './dto/update-marketplace-listing.dto';

@Controller('marketplace')
export class MarketplaceController {
  constructor(private readonly marketplaceService: MarketplaceService) {}

  @Get('listings')
  findAll() {
    return this.marketplaceService.findAll();
  }

  @Get('listings/:id')
  findOne(@Param('id') id: string) {
    return this.marketplaceService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('listings')
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.RECRUITER)
  create(@Body() dto: CreateMarketplaceListingDto) {
    return this.marketplaceService.create(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch('listings/:id')
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.RECRUITER)
  update(@Param('id') id: string, @Body() dto: UpdateMarketplaceListingDto) {
    return this.marketplaceService.update(id, dto);
  }
}
