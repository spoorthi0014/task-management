import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, Organization, Task } from '../entities';
import { Role, TaskStatus, TaskCategory } from '@task-management/data';

@Injectable()
export class SeederService implements OnModuleInit {
  private readonly logger = new Logger(SeederService.name);

  constructor(
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Task)
    private taskRepository: Repository<Task>
  ) {}

  async onModuleInit() {
    await this.seed();
  }

  async seed() {
    // Check if data already exists
    const existingOrgs = await this.organizationRepository.count();
    if (existingOrgs > 0) {
      this.logger.log('Database already seeded, skipping...');
      return;
    }

    this.logger.log('Seeding database...');

    // Create organizations (2-level hierarchy)
    const parentOrg = await this.organizationRepository.save({
      name: 'Acme Corporation',
      parentId: null,
    });

    const childOrg1 = await this.organizationRepository.save({
      name: 'Engineering Team',
      parentId: parentOrg.id,
    });

    const childOrg2 = await this.organizationRepository.save({
      name: 'Marketing Team',
      parentId: parentOrg.id,
    });

    // Create users with different roles
    const hashedPassword = await bcrypt.hash('password123', 10);

    const owner = await this.userRepository.save({
      email: 'owner@acme.com',
      password: hashedPassword,
      firstName: 'John',
      lastName: 'Owner',
      role: Role.OWNER,
      organizationId: parentOrg.id,
    });

    const admin1 = await this.userRepository.save({
      email: 'admin@engineering.com',
      password: hashedPassword,
      firstName: 'Alice',
      lastName: 'Admin',
      role: Role.ADMIN,
      organizationId: childOrg1.id,
    });

    const admin2 = await this.userRepository.save({
      email: 'admin@marketing.com',
      password: hashedPassword,
      firstName: 'Bob',
      lastName: 'Manager',
      role: Role.ADMIN,
      organizationId: childOrg2.id,
    });

    const viewer1 = await this.userRepository.save({
      email: 'viewer@engineering.com',
      password: hashedPassword,
      firstName: 'Charlie',
      lastName: 'Developer',
      role: Role.VIEWER,
      organizationId: childOrg1.id,
    });

    const viewer2 = await this.userRepository.save({
      email: 'viewer@marketing.com',
      password: hashedPassword,
      firstName: 'Diana',
      lastName: 'Designer',
      role: Role.VIEWER,
      organizationId: childOrg2.id,
    });

    // Create sample tasks
    const tasks = [
      {
        title: 'Setup project infrastructure',
        description: 'Configure CI/CD pipeline and deployment scripts',
        category: TaskCategory.WORK,
        status: TaskStatus.DONE,
        order: 0,
        ownerId: owner.id,
        organizationId: parentOrg.id,
      },
      {
        title: 'Review quarterly report',
        description: 'Review and approve Q4 financial report',
        category: TaskCategory.WORK,
        status: TaskStatus.IN_PROGRESS,
        order: 1,
        ownerId: owner.id,
        organizationId: parentOrg.id,
      },
      {
        title: 'Implement authentication module',
        description: 'Build JWT-based authentication system',
        category: TaskCategory.WORK,
        status: TaskStatus.DONE,
        order: 0,
        ownerId: admin1.id,
        organizationId: childOrg1.id,
      },
      {
        title: 'Code review for API endpoints',
        description: 'Review pull requests for task management APIs',
        category: TaskCategory.WORK,
        status: TaskStatus.TODO,
        order: 1,
        ownerId: admin1.id,
        organizationId: childOrg1.id,
      },
      {
        title: 'Create marketing campaign',
        description: 'Design and launch Q1 marketing campaign',
        category: TaskCategory.WORK,
        status: TaskStatus.IN_PROGRESS,
        order: 0,
        ownerId: admin2.id,
        organizationId: childOrg2.id,
      },
      {
        title: 'Fix frontend bug',
        description: 'Resolve issue with task drag and drop',
        category: TaskCategory.WORK,
        status: TaskStatus.TODO,
        order: 0,
        ownerId: viewer1.id,
        organizationId: childOrg1.id,
      },
      {
        title: 'Update component styles',
        description: 'Refresh dashboard component styling',
        category: TaskCategory.WORK,
        status: TaskStatus.TODO,
        order: 1,
        ownerId: viewer1.id,
        organizationId: childOrg1.id,
      },
      {
        title: 'Design social media graphics',
        description: 'Create graphics for upcoming product launch',
        category: TaskCategory.WORK,
        status: TaskStatus.IN_PROGRESS,
        order: 0,
        ownerId: viewer2.id,
        organizationId: childOrg2.id,
      },
      {
        title: 'Grocery shopping',
        description: 'Buy vegetables, fruits, and essentials',
        category: TaskCategory.SHOPPING,
        status: TaskStatus.TODO,
        order: 2,
        ownerId: owner.id,
        organizationId: parentOrg.id,
      },
      {
        title: 'Morning workout',
        description: '30 minutes cardio and stretching',
        category: TaskCategory.HEALTH,
        status: TaskStatus.TODO,
        order: 3,
        ownerId: owner.id,
        organizationId: parentOrg.id,
      },
    ];

    await this.taskRepository.save(tasks);

    this.logger.log('Database seeded successfully!');
    this.logger.log('');
    this.logger.log('=== Test Accounts ===');
    this.logger.log('Owner: owner@acme.com / password123');
    this.logger.log('Admin (Engineering): admin@engineering.com / password123');
    this.logger.log('Admin (Marketing): admin@marketing.com / password123');
    this.logger.log('Viewer (Engineering): viewer@engineering.com / password123');
    this.logger.log('Viewer (Marketing): viewer@marketing.com / password123');
    this.logger.log('=====================');
  }
}
