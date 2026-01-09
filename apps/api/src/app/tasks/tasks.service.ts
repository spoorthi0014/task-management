import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Task, Organization } from '../entities';
import { CreateTaskDto, UpdateTaskDto } from './dto/task.dto';
import {
  IAuthPayload,
  ITaskWithOwner,
  Role,
  AuditAction,
  TaskStatus,
  TaskCategory,
} from '@task-management/data';
import { AuditService } from '../audit/audit.service';
import { hasPermission, Permission } from '@task-management/auth';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
    private auditService: AuditService
  ) {}

  async create(createTaskDto: CreateTaskDto, user: IAuthPayload): Promise<Task> {
    if (!hasPermission(user.role, Permission.TASK_CREATE)) {
      throw new ForbiddenException('You do not have permission to create tasks');
    }

    // Get max order for user's tasks
    const maxOrder = await this.taskRepository
      .createQueryBuilder('task')
      .select('MAX(task.order)', 'max')
      .where('task.ownerId = :ownerId', { ownerId: user.sub })
      .getRawOne();

    const task = this.taskRepository.create({
      ...createTaskDto,
      category: createTaskDto.category || TaskCategory.OTHER,
      status: createTaskDto.status || TaskStatus.TODO,
      ownerId: user.sub,
      organizationId: user.organizationId,
      order: (maxOrder?.max ?? -1) + 1,
    });

    const savedTask = await this.taskRepository.save(task);

    await this.auditService.log({
      action: AuditAction.CREATE,
      resource: 'task',
      resourceId: savedTask.id,
      userId: user.sub,
      organizationId: user.organizationId,
      metadata: { title: savedTask.title },
    });

    return savedTask;
  }

  async findAll(
    user: IAuthPayload,
    filters?: {
      status?: TaskStatus;
      category?: TaskCategory;
      search?: string;
    }
  ): Promise<ITaskWithOwner[]> {
    const queryBuilder = this.taskRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.owner', 'owner')
      .orderBy('task.order', 'ASC');

    // Apply RBAC scoping
    if (user.role === Role.OWNER) {
      // Owners can see all tasks in their org and child orgs
      const childOrgs = await this.organizationRepository.find({
        where: { parentId: user.organizationId },
      });
      const orgIds = [user.organizationId, ...childOrgs.map((o) => o.id)];
      queryBuilder.where('task.organizationId IN (:...orgIds)', { orgIds });
    } else if (user.role === Role.ADMIN) {
      // Admins can see all tasks in their organization
      queryBuilder.where('task.organizationId = :orgId', {
        orgId: user.organizationId,
      });
    } else {
      // Viewers can only see their own tasks
      queryBuilder.where('task.ownerId = :ownerId', { ownerId: user.sub });
    }

    // Apply filters
    if (filters?.status) {
      queryBuilder.andWhere('task.status = :status', { status: filters.status });
    }
    if (filters?.category) {
      queryBuilder.andWhere('task.category = :category', {
        category: filters.category,
      });
    }
    if (filters?.search) {
      queryBuilder.andWhere(
        '(task.title LIKE :search OR task.description LIKE :search)',
        { search: `%${filters.search}%` }
      );
    }

    const tasks = await queryBuilder.getMany();

    return tasks.map((task) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      category: task.category,
      status: task.status,
      order: task.order,
      ownerId: task.ownerId,
      organizationId: task.organizationId,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      owner: task.owner
        ? {
            id: task.owner.id,
            email: task.owner.email,
            firstName: task.owner.firstName,
            lastName: task.owner.lastName,
          }
        : null,
    })) as ITaskWithOwner[];
  }

  async findOne(id: string, user: IAuthPayload): Promise<Task> {
    const task = await this.taskRepository.findOne({
      where: { id },
      relations: ['owner'],
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Check access
    await this.checkTaskAccess(task, user, 'read');

    return task;
  }

  async update(
    id: string,
    updateTaskDto: UpdateTaskDto,
    user: IAuthPayload
  ): Promise<Task> {
    const task = await this.taskRepository.findOne({
      where: { id },
      relations: ['owner'],
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Check access
    await this.checkTaskAccess(task, user, 'update');

    Object.assign(task, updateTaskDto);
    const updatedTask = await this.taskRepository.save(task);

    await this.auditService.log({
      action: AuditAction.UPDATE,
      resource: 'task',
      resourceId: task.id,
      userId: user.sub,
      organizationId: user.organizationId,
      metadata: { changes: updateTaskDto },
    });

    return updatedTask;
  }

  async remove(id: string, user: IAuthPayload): Promise<void> {
    const task = await this.taskRepository.findOne({
      where: { id },
      relations: ['owner'],
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Check access
    await this.checkTaskAccess(task, user, 'delete');

    await this.taskRepository.remove(task);

    await this.auditService.log({
      action: AuditAction.DELETE,
      resource: 'task',
      resourceId: id,
      userId: user.sub,
      organizationId: user.organizationId,
      metadata: { title: task.title },
    });
  }

  async reorder(taskIds: string[], user: IAuthPayload): Promise<void> {
    const tasks = await this.taskRepository.find({
      where: { id: In(taskIds) },
    });

    // Verify all tasks belong to user or user has permission
    for (const task of tasks) {
      await this.checkTaskAccess(task, user, 'update');
    }

    // Update order
    for (let i = 0; i < taskIds.length; i++) {
      await this.taskRepository.update(taskIds[i], { order: i });
    }
  }

  private async checkTaskAccess(
    task: Task,
    user: IAuthPayload,
    action: 'read' | 'update' | 'delete'
  ): Promise<void> {
    const isOwner = task.ownerId === user.sub;
    const isSameOrg = task.organizationId === user.organizationId;

    // Check if user's org is parent of task's org (for hierarchy)
    let isParentOrg = false;
    if (!isSameOrg) {
      const taskOrg = await this.organizationRepository.findOne({
        where: { id: task.organizationId },
      });
      if (taskOrg?.parentId === user.organizationId) {
        isParentOrg = true;
      }
    }

    const canAccessOrg = isSameOrg || isParentOrg;

    switch (user.role) {
      case Role.OWNER:
        // Owners can do anything in their org hierarchy
        if (!canAccessOrg) {
          throw new ForbiddenException('Task belongs to a different organization');
        }
        break;
      case Role.ADMIN:
        // Admins can read/update tasks in their org, delete only their own
        if (!isSameOrg) {
          throw new ForbiddenException('Task belongs to a different organization');
        }
        if (action === 'delete' && !isOwner) {
          throw new ForbiddenException('Admins can only delete their own tasks');
        }
        break;
      case Role.VIEWER:
        // Viewers can only access their own tasks
        if (!isOwner) {
          throw new ForbiddenException('You can only access your own tasks');
        }
        if (action !== 'read') {
          throw new ForbiddenException('Viewers can only read tasks');
        }
        break;
      default:
        throw new ForbiddenException('Invalid role');
    }
  }
}
