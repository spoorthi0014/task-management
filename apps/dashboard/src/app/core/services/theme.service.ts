import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private darkModeSignal = signal<boolean>(this.getInitialTheme());
  
  readonly isDarkMode = this.darkModeSignal.asReadonly();

  constructor() {
    this.applyTheme();
  }

  toggleTheme(): void {
    this.darkModeSignal.update(isDark => !isDark);
    this.applyTheme();
    localStorage.setItem('theme', this.darkModeSignal() ? 'dark' : 'light');
  }

  private getInitialTheme(): boolean {
    const stored = localStorage.getItem('theme');
    if (stored) {
      return stored === 'dark';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  private applyTheme(): void {
    if (this.darkModeSignal()) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
}
