import { Test, TestingModule } from '@nestjs/testing';
import { TasksService } from './tasks.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Task, Organization } from '../entities';
import { AuditService } from '../audit/audit.service';
import { Role, TaskStatus, TaskCategory, IAuthPayload } from '@task-management/data';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

describe('TasksService', () => {
  let service: TasksService;
  let mockTaskRepository: {
    find: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    remove: jest.Mock;
    update: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let mockOrganizationRepository: {
    find: jest.Mock;
    findOne: jest.Mock;
  };
  let mockAuditService: { log: jest.Mock };

  const mockOwnerUser: IAuthPayload = {
    sub: 'owner-1',
    email: 'owner@test.com',
    role: Role.OWNER,
    organizationId: 'org-1',
  };

  const mockAdminUser: IAuthPayload = {
    sub: 'admin-1',
    email: 'admin@test.com',
    role: Role.ADMIN,
    organizationId: 'org-1',
  };

  const mockViewerUser: IAuthPayload = {
    sub: 'viewer-1',
    email: 'viewer@test.com',
    role: Role.VIEWER,
    organizationId: 'org-1',
  };

  beforeEach(async () => {
    const mockQueryBuilder = {
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
      getRawOne: jest.fn().mockResolvedValue({ max: 0 }),
    };

    mockTaskRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      update: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    };

    mockOrganizationRepository = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn(),
    };

    mockAuditService = {
      log: jest.fn().mockResolvedValue({}),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        {
          provide: getRepositoryToken(Task),
          useValue: mockTaskRepository,
        },
        {
          provide: getRepositoryToken(Organization),
          useValue: mockOrganizationRepository,
        },
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a task for Owner', async () => {
      const createTaskDto = {
        title: 'Test Task',
        description: 'Test Description',
      };

      const mockTask = {
        id: 'task-1',
        ...createTaskDto,
        category: TaskCategory.OTHER,
        status: TaskStatus.TODO,
        ownerId: mockOwnerUser.sub,
        organizationId: mockOwnerUser.organizationId,
        order: 0,
      };

      mockTaskRepository.create.mockReturnValue(mockTask);
      mockTaskRepository.save.mockResolvedValue(mockTask);

      const result = await service.create(createTaskDto, mockOwnerUser);

      expect(result).toEqual(mockTask);
      expect(mockTaskRepository.create).toHaveBeenCalled();
      expect(mockTaskRepository.save).toHaveBeenCalled();
      expect(mockAuditService.log).toHaveBeenCalled();
    });

    it('should create a task for Admin', async () => {
      const createTaskDto = {
        title: 'Admin Task',
      };

      const mockTask = {
        id: 'task-2',
        ...createTaskDto,
        category: TaskCategory.OTHER,
        status: TaskStatus.TODO,
        ownerId: mockAdminUser.sub,
        organizationId: mockAdminUser.organizationId,
        order: 0,
      };

      mockTaskRepository.create.mockReturnValue(mockTask);
      mockTaskRepository.save.mockResolvedValue(mockTask);

      const result = await service.create(createTaskDto, mockAdminUser);

      expect(result).toEqual(mockTask);
    });

    it('should throw ForbiddenException for Viewer trying to create task', async () => {
      const createTaskDto = {
        title: 'Viewer Task',
      };

      await expect(service.create(createTaskDto, mockViewerUser)).rejects.toThrow(
        ForbiddenException
      );
    });
  });

  describe('findOne', () => {
    it('should return task for owner', async () => {
      const mockTask = {
        id: 'task-1',
        title: 'Test Task',
        ownerId: mockOwnerUser.sub,
        organizationId: mockOwnerUser.organizationId,
        owner: { id: mockOwnerUser.sub },
      };

      mockTaskRepository.findOne.mockResolvedValue(mockTask);

      const result = await service.findOne('task-1', mockOwnerUser);

      expect(result).toEqual(mockTask);
    });

    it('should throw NotFoundException for non-existent task', async () => {
      mockTaskRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent', mockOwnerUser)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('update', () => {
    it('should update task for Owner', async () => {
      const mockTask = {
        id: 'task-1',
        title: 'Original Title',
        ownerId: 'other-user',
        organizationId: mockOwnerUser.organizationId,
        owner: { id: 'other-user' },
      };

      const updatedTask = {
        ...mockTask,
        title: 'Updated Title',
      };

      mockTaskRepository.findOne.mockResolvedValue(mockTask);
      mockTaskRepository.save.mockResolvedValue(updatedTask);

      const result = await service.update('task-1', { title: 'Updated Title' }, mockOwnerUser);

      expect(result.title).toBe('Updated Title');
    });

    it('should allow Admin to update task in same org', async () => {
      const mockTask = {
        id: 'task-1',
        title: 'Original Title',
        ownerId: 'other-user',
        organizationId: mockAdminUser.organizationId,
        owner: { id: 'other-user' },
      };

      const updatedTask = {
        ...mockTask,
        title: 'Updated by Admin',
      };

      mockTaskRepository.findOne.mockResolvedValue(mockTask);
      mockTaskRepository.save.mockResolvedValue(updatedTask);

      const result = await service.update('task-1', { title: 'Updated by Admin' }, mockAdminUser);

      expect(result.title).toBe('Updated by Admin');
    });

    it('should throw ForbiddenException for Viewer trying to update', async () => {
      const mockTask = {
        id: 'task-1',
        title: 'Original Title',
        ownerId: mockViewerUser.sub,
        organizationId: mockViewerUser.organizationId,
        owner: { id: mockViewerUser.sub },
      };

      mockTaskRepository.findOne.mockResolvedValue(mockTask);

      await expect(
        service.update('task-1', { title: 'Should Fail' }, mockViewerUser)
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should delete task for Owner', async () => {
      const mockTask = {
        id: 'task-1',
        title: 'To Delete',
        ownerId: 'other-user',
        organizationId: mockOwnerUser.organizationId,
        owner: { id: 'other-user' },
      };

      mockTaskRepository.findOne.mockResolvedValue(mockTask);
      mockTaskRepository.remove.mockResolvedValue(mockTask);

      await service.remove('task-1', mockOwnerUser);

      expect(mockTaskRepository.remove).toHaveBeenCalledWith(mockTask);
      expect(mockAuditService.log).toHaveBeenCalled();
    });

    it('should throw ForbiddenException for Admin deleting others tasks', async () => {
      const mockTask = {
        id: 'task-1',
        title: 'Other User Task',
        ownerId: 'other-user',
        organizationId: mockAdminUser.organizationId,
        owner: { id: 'other-user' },
      };

      mockTaskRepository.findOne.mockResolvedValue(mockTask);

      await expect(service.remove('task-1', mockAdminUser)).rejects.toThrow(ForbiddenException);
    });

    it('should allow Admin to delete their own tasks', async () => {
      const mockTask = {
        id: 'task-1',
        title: 'Admin Own Task',
        ownerId: mockAdminUser.sub,
        organizationId: mockAdminUser.organizationId,
        owner: { id: mockAdminUser.sub },
      };

      mockTaskRepository.findOne.mockResolvedValue(mockTask);
      mockTaskRepository.remove.mockResolvedValue(mockTask);

      await service.remove('task-1', mockAdminUser);

      expect(mockTaskRepository.remove).toHaveBeenCalled();
    });
  });
});
