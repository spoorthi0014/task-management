import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IAuditLogWithUser } from '@task-management/data';
import { environment } from '../../../environments/environment';

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuditService {
  private http = inject(HttpClient);

  getAuditLogs(page = 1, limit = 50): Observable<PaginatedResponse<IAuditLogWithUser>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    
    return this.http.get<PaginatedResponse<IAuditLogWithUser>>(
      `${environment.apiUrl}/audit-log`,
      { params }
    );
  }
}
