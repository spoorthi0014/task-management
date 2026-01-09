import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { 
  ITask, 
  ITaskWithOwner, 
  ICreateTaskRequest, 
  IUpdateTaskRequest,
  TaskStatus,
  TaskCategory 
} from '@task-management/data';
import { environment } from '../../../environments/environment';

export interface TaskFilters {
  status?: TaskStatus;
  category?: TaskCategory;
  search?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private http = inject(HttpClient);

  getTasks(filters?: TaskFilters): Observable<ITaskWithOwner[]> {
    let params = new HttpParams();
    
    if (filters?.status) {
      params = params.set('status', filters.status);
    }
    if (filters?.category) {
      params = params.set('category', filters.category);
    }
    if (filters?.search) {
      params = params.set('search', filters.search);
    }
    
    return this.http.get<ITaskWithOwner[]>(`${environment.apiUrl}/tasks`, { params });
  }

  getTask(id: string): Observable<ITask> {
    return this.http.get<ITask>(`${environment.apiUrl}/tasks/${id}`);
  }

  createTask(task: ICreateTaskRequest): Observable<ITask> {
    return this.http.post<ITask>(`${environment.apiUrl}/tasks`, task);
  }

  updateTask(id: string, task: IUpdateTaskRequest): Observable<ITask> {
    return this.http.put<ITask>(`${environment.apiUrl}/tasks/${id}`, task);
  }

  deleteTask(id: string): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/tasks/${id}`);
  }

  reorderTasks(taskIds: string[]): Observable<void> {
    return this.http.post<void>(`${environment.apiUrl}/tasks/reorder`, { taskIds });
  }
}
