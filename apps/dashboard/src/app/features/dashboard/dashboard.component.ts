import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { TaskService, TaskFilters } from '../../core/services/task.service';
import { AuthStateService } from '../../core/services/auth-state.service';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { TaskFormComponent } from './task-form/task-form.component';
import { 
  ITaskWithOwner, 
  TaskStatus, 
  TaskCategory, 
  Role,
  ICreateTaskRequest,
  IUpdateTaskRequest 
} from '@task-management/data';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule, TaskFormComponent],
  template: `
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
      <!-- Header -->
      <header class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between items-center h-16">
            <div class="flex items-center">
              <h1 class="text-2xl font-bold text-primary-600">📋 TaskFlow</h1>
            </div>
            
            <div class="flex items-center space-x-4">
              <!-- Theme Toggle -->
              <button 
                (click)="toggleTheme()"
                class="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                title="Toggle theme"
              >
                @if (themeService.isDarkMode()) {
                  <svg class="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd"/>
                  </svg>
                } @else {
                  <svg class="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/>
                  </svg>
                }
              </button>
              
              <!-- User Info -->
              <div class="flex items-center space-x-2">
                <div class="text-right hidden sm:block">
                  <p class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ authState.user()?.firstName }} {{ authState.user()?.lastName }}
                  </p>
                  <p class="text-xs text-gray-500 dark:text-gray-400 capitalize">
                    {{ authState.user()?.role }}
                  </p>
                </div>
                <div class="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-medium">
                  {{ authState.user()?.firstName?.[0] }}{{ authState.user()?.lastName?.[0] }}
                </div>
              </div>
              
              <!-- Audit Log Link (Owner/Admin only) -->
              @if (canViewAuditLog()) {
                <button 
                  (click)="navigateToAuditLog()"
                  class="btn-secondary text-sm hidden sm:flex items-center space-x-1"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                  </svg>
                  <span>Audit Log</span>
                </button>
              }
              
              <!-- Logout -->
              <button 
                (click)="logout()"
                class="btn-secondary text-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Filters and Add Button -->
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div class="flex flex-wrap gap-3">
            <!-- Search -->
            <input
              type="text"
              [(ngModel)]="searchQuery"
              (ngModelChange)="onFilterChange()"
              placeholder="Search tasks..."
              class="input w-48"
            />
            
            <!-- Category Filter -->
            <select
              [(ngModel)]="selectedCategory"
              (ngModelChange)="onFilterChange()"
              class="input w-40"
            >
              <option value="">All Categories</option>
              @for (cat of categories; track cat) {
                <option [value]="cat">{{ formatCategory(cat) }}</option>
              }
            </select>
            
            <!-- Status Filter -->
            <select
              [(ngModel)]="selectedStatus"
              (ngModelChange)="onFilterChange()"
              class="input w-36"
            >
              <option value="">All Status</option>
              @for (status of statuses; track status) {
                <option [value]="status">{{ formatStatus(status) }}</option>
              }
            </select>
          </div>
          
          @if (canCreateTask()) {
            <button 
              (click)="openTaskForm()"
              class="btn-primary flex items-center space-x-2"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
              <span>Add Task</span>
            </button>
          }
        </div>

        <!-- Task Statistics -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div class="card p-4">
            <p class="text-sm text-gray-500 dark:text-gray-400">Total Tasks</p>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ tasks().length }}</p>
          </div>
          <div class="card p-4">
            <p class="text-sm text-gray-500 dark:text-gray-400">To Do</p>
            <p class="text-2xl font-bold text-yellow-600">{{ todoTasks().length }}</p>
          </div>
          <div class="card p-4">
            <p class="text-sm text-gray-500 dark:text-gray-400">In Progress</p>
            <p class="text-2xl font-bold text-blue-600">{{ inProgressTasks().length }}</p>
          </div>
          <div class="card p-4">
            <p class="text-sm text-gray-500 dark:text-gray-400">Done</p>
            <p class="text-2xl font-bold text-green-600">{{ doneTasks().length }}</p>
          </div>
        </div>

        <!-- Progress Bar -->
        <div class="card p-4 mb-6">
          <div class="flex justify-between items-center mb-2">
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Completion Progress</span>
            <span class="text-sm text-gray-500 dark:text-gray-400">{{ completionPercentage() }}%</span>
          </div>
          <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div 
              class="bg-green-500 h-3 rounded-full transition-all duration-500"
              [style.width.%]="completionPercentage()"
            ></div>
          </div>
        </div>

        <!-- Loading State -->
        @if (loading()) {
          <div class="flex justify-center items-center py-12">
            <svg class="animate-spin h-8 w-8 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        } @else {
          <!-- Kanban Board -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <!-- To Do Column -->
            <div class="card p-4">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <span class="w-3 h-3 bg-yellow-500 rounded-full mr-2"></span>
                To Do ({{ todoTasks().length }})
              </h3>
              <div
                cdkDropList
                #todoList="cdkDropList"
                [cdkDropListData]="todoTasks()"
                [cdkDropListConnectedTo]="[inProgressList, doneList]"
                (cdkDropListDropped)="onDrop($event, 'todo')"
                class="task-list min-h-[200px] space-y-3"
              >
                @for (task of todoTasks(); track task.id) {
                  <div 
                    cdkDrag 
                    class="task-item card p-4 cursor-move hover:shadow-md transition-shadow"
                    [cdkDragDisabled]="!canEditTask(task)"
                  >
                    <div class="flex justify-between items-start mb-2">
                      <h4 class="font-medium text-gray-900 dark:text-white">{{ task.title }}</h4>
                      <span [class]="getCategoryClass(task.category)" class="text-xs px-2 py-1 rounded-full">
                        {{ formatCategory(task.category) }}
                      </span>
                    </div>
                    @if (task.description) {
                      <p class="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">{{ task.description }}</p>
                    }
                    <div class="flex justify-between items-center">
                      <span class="text-xs text-gray-400">
                        {{ task.owner?.firstName }} {{ task.owner?.lastName }}
                      </span>
                      @if (canEditTask(task)) {
                        <div class="flex space-x-2">
                          <button 
                            (click)="editTask(task)"
                            class="text-primary-600 hover:text-primary-800 text-sm"
                          >
                            Edit
                          </button>
                          @if (canDeleteTask(task)) {
                            <button 
                              (click)="deleteTask(task)"
                              class="text-red-600 hover:text-red-800 text-sm"
                            >
                              Delete
                            </button>
                          }
                        </div>
                      }
                    </div>
                  </div>
                }
              </div>
            </div>

            <!-- In Progress Column -->
            <div class="card p-4">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <span class="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
                In Progress ({{ inProgressTasks().length }})
              </h3>
              <div
                cdkDropList
                #inProgressList="cdkDropList"
                [cdkDropListData]="inProgressTasks()"
                [cdkDropListConnectedTo]="[todoList, doneList]"
                (cdkDropListDropped)="onDrop($event, 'in_progress')"
                class="task-list min-h-[200px] space-y-3"
              >
                @for (task of inProgressTasks(); track task.id) {
                  <div 
                    cdkDrag 
                    class="task-item card p-4 cursor-move hover:shadow-md transition-shadow"
                    [cdkDragDisabled]="!canEditTask(task)"
                  >
                    <div class="flex justify-between items-start mb-2">
                      <h4 class="font-medium text-gray-900 dark:text-white">{{ task.title }}</h4>
                      <span [class]="getCategoryClass(task.category)" class="text-xs px-2 py-1 rounded-full">
                        {{ formatCategory(task.category) }}
                      </span>
                    </div>
                    @if (task.description) {
                      <p class="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">{{ task.description }}</p>
                    }
                    <div class="flex justify-between items-center">
                      <span class="text-xs text-gray-400">
                        {{ task.owner?.firstName }} {{ task.owner?.lastName }}
                      </span>
                      @if (canEditTask(task)) {
                        <div class="flex space-x-2">
                          <button 
                            (click)="editTask(task)"
                            class="text-primary-600 hover:text-primary-800 text-sm"
                          >
                            Edit
                          </button>
                          @if (canDeleteTask(task)) {
                            <button 
                              (click)="deleteTask(task)"
                              class="text-red-600 hover:text-red-800 text-sm"
                            >
                              Delete
                            </button>
                          }
                        </div>
                      }
                    </div>
                  </div>
                }
              </div>
            </div>

            <!-- Done Column -->
            <div class="card p-4">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <span class="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                Done ({{ doneTasks().length }})
              </h3>
              <div
                cdkDropList
                #doneList="cdkDropList"
                [cdkDropListData]="doneTasks()"
                [cdkDropListConnectedTo]="[todoList, inProgressList]"
                (cdkDropListDropped)="onDrop($event, 'done')"
                class="task-list min-h-[200px] space-y-3"
              >
                @for (task of doneTasks(); track task.id) {
                  <div 
                    cdkDrag 
                    class="task-item card p-4 cursor-move hover:shadow-md transition-shadow"
                    [cdkDragDisabled]="!canEditTask(task)"
                  >
                    <div class="flex justify-between items-start mb-2">
                      <h4 class="font-medium text-gray-900 dark:text-white line-through opacity-75">{{ task.title }}</h4>
                      <span [class]="getCategoryClass(task.category)" class="text-xs px-2 py-1 rounded-full">
                        {{ formatCategory(task.category) }}
                      </span>
                    </div>
                    @if (task.description) {
                      <p class="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2 opacity-75">{{ task.description }}</p>
                    }
                    <div class="flex justify-between items-center">
                      <span class="text-xs text-gray-400">
                        {{ task.owner?.firstName }} {{ task.owner?.lastName }}
                      </span>
                      @if (canEditTask(task)) {
                        <div class="flex space-x-2">
                          <button 
                            (click)="editTask(task)"
                            class="text-primary-600 hover:text-primary-800 text-sm"
                          >
                            Edit
                          </button>
                          @if (canDeleteTask(task)) {
                            <button 
                              (click)="deleteTask(task)"
                              class="text-red-600 hover:text-red-800 text-sm"
                            >
                              Delete
                            </button>
                          }
                        </div>
                      }
                    </div>
                  </div>
                }
              </div>
            </div>
          </div>
        }
      </main>

      <!-- Task Form Modal -->
      @if (showTaskForm()) {
        <app-task-form
          [task]="editingTask()"
          (save)="saveTask($event)"
          (cancel)="closeTaskForm()"
        />
      }
    </div>
  `,
})
export class DashboardComponent implements OnInit {
  private taskService = inject(TaskService);
  private authService = inject(AuthService);
  private router = inject(Router);
  
  authState = inject(AuthStateService);
  themeService = inject(ThemeService);

  tasks = signal<ITaskWithOwner[]>([]);
  loading = signal(true);
  showTaskForm = signal(false);
  editingTask = signal<ITaskWithOwner | null>(null);

  // Filters
  searchQuery = '';
  selectedCategory = '';
  selectedStatus = '';

  categories = Object.values(TaskCategory);
  statuses = Object.values(TaskStatus);

  // Computed signals for kanban columns
  todoTasks = computed(() => 
    this.tasks().filter(t => t.status === TaskStatus.TODO)
  );
  
  inProgressTasks = computed(() => 
    this.tasks().filter(t => t.status === TaskStatus.IN_PROGRESS)
  );
  
  doneTasks = computed(() => 
    this.tasks().filter(t => t.status === TaskStatus.DONE)
  );

  completionPercentage = computed(() => {
    const total = this.tasks().length;
    if (total === 0) return 0;
    const done = this.doneTasks().length;
    return Math.round((done / total) * 100);
  });

  ngOnInit(): void {
    this.loadTasks();
  }

  loadTasks(): void {
    this.loading.set(true);
    const filters: TaskFilters = {};
    
    if (this.selectedStatus) {
      filters.status = this.selectedStatus as TaskStatus;
    }
    if (this.selectedCategory) {
      filters.category = this.selectedCategory as TaskCategory;
    }
    if (this.searchQuery) {
      filters.search = this.searchQuery;
    }

    this.taskService.getTasks(filters).subscribe({
      next: (tasks) => {
        this.tasks.set(tasks);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  onFilterChange(): void {
    this.loadTasks();
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  canViewAuditLog(): boolean {
    return this.authState.hasMinimumRole(Role.ADMIN);
  }

  canCreateTask(): boolean {
    return this.authState.hasMinimumRole(Role.ADMIN);
  }

  canEditTask(task: ITaskWithOwner): boolean {
    const user = this.authState.user();
    if (!user) return false;
    
    if (user.role === Role.OWNER) return true;
    if (user.role === Role.ADMIN && task.organizationId === user.organizationId) return true;
    if (task.ownerId === user.id && user.role !== Role.VIEWER) return true;
    
    return false;
  }

  canDeleteTask(task: ITaskWithOwner): boolean {
    const user = this.authState.user();
    if (!user) return false;
    
    if (user.role === Role.OWNER) return true;
    if (task.ownerId === user.id && user.role !== Role.VIEWER) return true;
    
    return false;
  }

  openTaskForm(): void {
    this.editingTask.set(null);
    this.showTaskForm.set(true);
  }

  editTask(task: ITaskWithOwner): void {
    this.editingTask.set(task);
    this.showTaskForm.set(true);
  }

  closeTaskForm(): void {
    this.showTaskForm.set(false);
    this.editingTask.set(null);
  }

  saveTask(taskData: ICreateTaskRequest | IUpdateTaskRequest): void {
    const editing = this.editingTask();
    
    if (editing) {
      this.taskService.updateTask(editing.id, taskData).subscribe({
        next: () => {
          this.closeTaskForm();
          this.loadTasks();
        }
      });
    } else {
      this.taskService.createTask(taskData as ICreateTaskRequest).subscribe({
        next: () => {
          this.closeTaskForm();
          this.loadTasks();
        }
      });
    }
  }

  deleteTask(task: ITaskWithOwner): void {
    if (confirm('Are you sure you want to delete this task?')) {
      this.taskService.deleteTask(task.id).subscribe({
        next: () => this.loadTasks()
      });
    }
  }

  onDrop(event: CdkDragDrop<ITaskWithOwner[]>, newStatus: string): void {
    const task = event.previousContainer.data[event.previousIndex];
    
    if (!this.canEditTask(task)) return;

    if (event.previousContainer === event.container) {
      // Reorder within same column
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      // Move to different column
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
      
      // Update task status
      this.taskService.updateTask(task.id, { 
        status: newStatus as TaskStatus 
      }).subscribe({
        next: () => this.loadTasks()
      });
    }
  }

  formatStatus(status: TaskStatus): string {
    const map: Record<TaskStatus, string> = {
      [TaskStatus.TODO]: 'To Do',
      [TaskStatus.IN_PROGRESS]: 'In Progress',
      [TaskStatus.DONE]: 'Done',
    };
    return map[status] || status;
  }

  formatCategory(category: TaskCategory): string {
    return category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
  }

  getCategoryClass(category: TaskCategory): string {
    const classes: Record<TaskCategory, string> = {
      [TaskCategory.WORK]: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      [TaskCategory.PERSONAL]: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      [TaskCategory.SHOPPING]: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      [TaskCategory.HEALTH]: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      [TaskCategory.FINANCE]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      [TaskCategory.OTHER]: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    };
    return classes[category] || classes[TaskCategory.OTHER];
  }

  navigateToAuditLog(): void {
    this.router.navigate(['/audit-log']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
