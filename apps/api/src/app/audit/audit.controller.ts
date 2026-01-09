import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { IAuthPayload, Role } from '@task-management/data';

@Controller('audit-log')
@UseGuards(RolesGuard)
export class AuditController {
  constructor(private auditService: AuditService) {}

  @Get()
  @Roles(Role.OWNER, Role.ADMIN)
  async findAll(
    @CurrentUser() user: IAuthPayload,
    @Query('page') page = 1,
    @Query('limit') limit = 50
  ) {
    return this.auditService.findAll(
      user.sub,
      user.role,
      user.organizationId,
      +page,
      +limit
    );
  }
}
