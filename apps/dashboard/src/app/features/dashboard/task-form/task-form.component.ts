import { Component, EventEmitter, Input, Output, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { 
  ITaskWithOwner, 
  TaskStatus, 
  TaskCategory,
  ICreateTaskRequest,
  IUpdateTaskRequest 
} from '@task-management/data';

@Component({
  selector: 'app-task-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" (click)="onOverlayClick($event)">
      <div class="card p-6 w-full max-w-md" (click)="$event.stopPropagation()">
        <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">
          {{ task ? 'Edit Task' : 'Create New Task' }}
        </h2>
        
        <form [formGroup]="taskForm" (ngSubmit)="onSubmit()">
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Title *
              </label>
              <input
                type="text"
                formControlName="title"
                class="input"
                placeholder="Enter task title"
              />
              @if (taskForm.get('title')?.invalid && taskForm.get('title')?.touched) {
                <p class="text-red-500 text-sm mt-1">Title is required</p>
              }
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                formControlName="description"
                class="input min-h-[100px]"
                placeholder="Enter task description"
              ></textarea>
            </div>
            
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category
                </label>
                <select formControlName="category" class="input">
                  @for (cat of categories; track cat) {
                    <option [value]="cat">{{ formatCategory(cat) }}</option>
                  }
                </select>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <select formControlName="status" class="input">
                  @for (status of statuses; track status) {
                    <option [value]="status">{{ formatStatus(status) }}</option>
                  }
                </select>
              </div>
            </div>
          </div>
          
          <div class="flex justify-end space-x-3 mt-6">
            <button type="button" (click)="onCancel()" class="btn-secondary">
              Cancel
            </button>
            <button 
              type="submit" 
              [disabled]="taskForm.invalid"
              class="btn-primary"
              [class.opacity-50]="taskForm.invalid"
            >
              {{ task ? 'Update' : 'Create' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
})
export class TaskFormComponent implements OnInit {
  @Input() task: ITaskWithOwner | null = null;
  @Output() save = new EventEmitter<ICreateTaskRequest | IUpdateTaskRequest>();
  @Output() cancel = new EventEmitter<void>();

  private fb = inject(FormBuilder);

  taskForm: FormGroup = this.fb.group({
    title: ['', Validators.required],
    description: [''],
    category: [TaskCategory.OTHER],
    status: [TaskStatus.TODO],
  });

  categories = Object.values(TaskCategory);
  statuses = Object.values(TaskStatus);

  ngOnInit(): void {
    if (this.task) {
      this.taskForm.patchValue({
        title: this.task.title,
        description: this.task.description,
        category: this.task.category,
        status: this.task.status,
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

  onSubmit(): void {
    if (this.taskForm.valid) {
      this.save.emit(this.taskForm.value);
    }
  }

  onCancel(): void {
    this.cancel.emit();
  }

  onOverlayClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.cancel.emit();
    }
  }
}
