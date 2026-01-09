export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  DONE = 'done',
}

export enum TaskCategory {
  WORK = 'work',
  PERSONAL = 'personal',
  SHOPPING = 'shopping',
  HEALTH = 'health',
  FINANCE = 'finance',
  OTHER = 'other',
}

export interface ITask {
  id: string;
  title: string;
  description: string;
  category: TaskCategory;
  status: TaskStatus;
  order: number;
  ownerId: string;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITaskWithOwner extends ITask {
  owner: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

export interface ICreateTaskRequest {
  title: string;
  description?: string;
  category?: TaskCategory;
  status?: TaskStatus;
}

export interface IUpdateTaskRequest {
  title?: string;
  description?: string;
  category?: TaskCategory;
  status?: TaskStatus;
  order?: number;
}
