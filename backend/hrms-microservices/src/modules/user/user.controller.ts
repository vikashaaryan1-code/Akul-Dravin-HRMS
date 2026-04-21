import { Body, Controller, Get, Param, Patch, Post, UseGuards, Request } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PolicyGuard } from '../../common/guards/policy.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InviteUserDto } from './dto/invite-user.dto';

@UseGuards(JwtAuthGuard, PolicyGuard)
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @Permissions('user.view', 'user.manage')
  findAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  @Permissions('user.view', 'user.manage')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @Post()
  @Permissions('user.create', 'user.manage')
  create(@Body() dto: CreateUserDto) {
    return this.userService.create(dto);
  }

  @Patch(':id')
  @Permissions('user.edit', 'user.manage')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.userService.update(id, dto);
  }

  @Post('invite')
  @Permissions('user.invite', 'user.manage')
  invite(@Body() dto: InviteUserDto, @Request() req: any) {
    const tenantId = req.user.tenantId;
    const invitedBy = req.user.sub;
    return this.userService.inviteUser(dto, tenantId, invitedBy);
  }

  @Patch(':id/deactivate')
  @Permissions('user.deactivate', 'user.manage')
  deactivate(@Param('id') id: string) {
    return this.userService.deactivateUser(id);
  }

  @Patch(':id/reactivate')
  @Permissions('user.reactivate', 'user.manage')
  reactivate(@Param('id') id: string) {
    return this.userService.reactivateUser(id);
  }

  @Get('debug/settings')
  @Permissions('user.manage')
  debugSettings() {
    const settings = (this as any).constructor.name === 'UserController' ? 
      require('../../common/context/tenant-context').TenantContext.getSettings() : null;
    return settings;
  }
}
