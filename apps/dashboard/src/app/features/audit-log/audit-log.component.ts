import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { AuditService, PaginatedResponse } from '../../core/services/audit.service';
import { AuthStateService } from '../../core/services/auth-state.service';
import { ThemeService } from '../../core/services/theme.service';
import { IAuditLogWithUser, AuditAction } from '@task-management/data';

@Component({
  selector: 'app-audit-log',
  standalone: true,
  imports: [CommonModule, DatePipe],
  template: `
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
      <!-- Header -->
      <header class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between items-center h-16">
            <div class="flex items-center space-x-4">
              <button 
                (click)="goBack()"
                class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <svg class="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                </svg>
              </button>
              <h1 class="text-xl font-bold text-gray-900 dark:text-white">Audit Log</h1>
            </div>
            
            <button 
              (click)="toggleTheme()"
              class="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
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
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        @if (loading()) {
          <div class="flex justify-center items-center py-12">
            <svg class="animate-spin h-8 w-8 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        } @else {
          <div class="card overflow-hidden">
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead class="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      User
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Action
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Resource
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200 dark:divide-gray-600">
                  @for (log of auditLogs(); track log.id) {
                    <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {{ log.createdAt | date:'medium' }}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm font-medium text-gray-900 dark:text-white">
                          {{ log.user?.firstName }} {{ log.user?.lastName }}
                        </div>
                        <div class="text-xs text-gray-500 dark:text-gray-400">
                          {{ log.user?.email }}
                        </div>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <span [class]="getActionClass(log.action)" class="px-2 py-1 text-xs rounded-full">
                          {{ log.action }}
                        </span>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white capitalize">
                        {{ log.resource }}
                      </td>
                      <td class="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        @if (log.metadata) {
                          <span class="font-mono text-xs">{{ formatMetadata(log.metadata) }}</span>
                        }
                      </td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="5" class="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                        No audit logs found
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
            
            <!-- Pagination -->
            @if (totalPages() > 1) {
              <div class="px-6 py-4 bg-gray-50 dark:bg-gray-700 flex justify-between items-center">
                <span class="text-sm text-gray-500 dark:text-gray-400">
                  Page {{ currentPage() }} of {{ totalPages() }}
                </span>
                <div class="flex space-x-2">
                  <button 
                    (click)="previousPage()"
                    [disabled]="currentPage() === 1"
                    class="btn-secondary text-sm"
                    [class.opacity-50]="currentPage() === 1"
                  >
                    Previous
                  </button>
                  <button 
                    (click)="nextPage()"
                    [disabled]="currentPage() === totalPages()"
                    class="btn-secondary text-sm"
                    [class.opacity-50]="currentPage() === totalPages()"
                  >
                    Next
                  </button>
                </div>
              </div>
            }
          </div>
        }
      </main>
    </div>
  `,
})
export class AuditLogComponent implements OnInit {
  private auditService = inject(AuditService);
  private router = inject(Router);
  
  authState = inject(AuthStateService);
  themeService = inject(ThemeService);

  auditLogs = signal<IAuditLogWithUser[]>([]);
  loading = signal(true);
  currentPage = signal(1);
  totalPages = signal(1);
  limit = 20;

  ngOnInit(): void {
    this.loadAuditLogs();
  }

  loadAuditLogs(): void {
    this.loading.set(true);
    this.auditService.getAuditLogs(this.currentPage(), this.limit).subscribe({
      next: (response) => {
        this.auditLogs.set(response.data);
        this.totalPages.set(Math.ceil(response.total / this.limit));
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  previousPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
      this.loadAuditLogs();
    }
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(p => p + 1);
      this.loadAuditLogs();
    }
  }

  getActionClass(action: AuditAction): string {
    const classes: Record<AuditAction, string> = {
      [AuditAction.CREATE]: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      [AuditAction.READ]: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      [AuditAction.UPDATE]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      [AuditAction.DELETE]: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      [AuditAction.LOGIN]: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      [AuditAction.LOGOUT]: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    };
    return classes[action] || classes[AuditAction.READ];
  }

  formatMetadata(metadata: Record<string, unknown>): string {
    return JSON.stringify(metadata).substring(0, 100);
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }
}
