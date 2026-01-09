import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog, Organization } from '../entities';
import { AuditAction, IAuditLogWithUser, Role } from '@task-management/data';

export interface CreateAuditLogDto {
  action: AuditAction;
  resource: string;
  resourceId?: string;
  userId: string;
  organizationId: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>
  ) {}

  async log(dto: CreateAuditLogDto): Promise<AuditLog> {
    const auditLog = this.auditLogRepository.create(dto);
    return this.auditLogRepository.save(auditLog);
  }

  async findAll(
    userId: string,
    userRole: Role,
    userOrgId: string,
    page = 1,
    limit = 50
  ): Promise<{ data: IAuditLogWithUser[]; total: number; page: number; limit: number }> {
    const queryBuilder = this.auditLogRepository
      .createQueryBuilder('audit')
      .leftJoinAndSelect('audit.user', 'user')
      .orderBy('audit.createdAt', 'DESC');

    // Owners can see all logs in their org and child orgs
    // Admins can see logs in their org only
    if (userRole === Role.OWNER) {
      // Get child organizations
      const childOrgs = await this.organizationRepository.find({
        where: { parentId: userOrgId },
      });
      const orgIds = [userOrgId, ...childOrgs.map((o) => o.id)];
      queryBuilder.where('audit.organizationId IN (:...orgIds)', { orgIds });
    } else if (userRole === Role.ADMIN) {
      queryBuilder.where('audit.organizationId = :orgId', { orgId: userOrgId });
    } else {
      // Viewers cannot access audit logs
      return { data: [], total: 0, page, limit };
    }

    const total = await queryBuilder.getCount();
    const data = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return {
      data: data.map((log) => ({
        id: log.id,
        action: log.action,
        resource: log.resource,
        resourceId: log.resourceId,
        userId: log.userId,
        organizationId: log.organizationId,
        metadata: log.metadata,
        createdAt: log.createdAt,
        user: log.user
          ? {
              id: log.user.id,
              email: log.user.email,
              firstName: log.user.firstName,
              lastName: log.user.lastName,
            }
          : null,
      })) as IAuditLogWithUser[],
      total,
      page,
      limit,
    };
  }
}
