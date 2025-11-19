import { Injectable, signal, inject, WritableSignal, computed, Signal, effect } from '@angular/core';
import { PersistenceService } from './persistence.service';
import { THEMES, Theme } from '../data/themes';

type DisplayMode = 'light' | 'dark' | 'auto';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private persistenceService = inject(PersistenceService);
  private styleElement: HTMLStyleElement | null = null;

  themes: Theme[] = THEMES;
  currentThemeKey: WritableSignal<string> = signal('sky');

  // The user's explicit selection: 'light', 'dark', or 'auto'
  displayMode: WritableSignal<DisplayMode> = signal('auto');
  
  // A signal to track the system's preference
  private systemPrefersDark = signal(false);

  // The computed signal that determines the final, effective mode
  private effectiveDisplayMode: Signal<'light' | 'dark'> = computed(() => {
    const mode = this.displayMode();
    if (mode === 'auto') {
      return this.systemPrefersDark() ? 'dark' : 'light';
    }
    return mode;
  });

  currentTheme: Signal<Theme> = computed(() => {
    return this.themes.find(t => t.key === this.currentThemeKey()) ?? this.themes[0];
  });

  constructor() {
    // Effect to apply the 'dark' class based on the effective display mode
    effect(() => {
      const mode = this.effectiveDisplayMode();
      if (mode === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    });

    // Set up a listener for the system's color scheme preference
    if (typeof window !== 'undefined' && window.matchMedia) {
      const prefersDarkMQ = window.matchMedia('(prefers-color-scheme: dark)');
      this.systemPrefersDark.set(prefersDarkMQ.matches);
      prefersDarkMQ.addEventListener('change', (e) => {
        this.systemPrefersDark.set(e.matches);
      });
    }
  }

  init(): void {
    // Theme color persistence
    const savedTheme = this.persistenceService.getItem<string>('userTheme');
    if (savedTheme && this.themes.some(t => t.key === savedTheme)) {
      this.setTheme(savedTheme);
    } else {
      this.setTheme('sky'); // Default theme
    }

    // Display mode persistence
    const savedMode = this.persistenceService.getItem<DisplayMode>('userDisplayMode');
    if (savedMode) {
      this.displayMode.set(savedMode);
    } else {
      this.displayMode.set('auto'); // Default to 'auto' for new users
    }
  }

  setDisplayMode(mode: DisplayMode): void {
    this.displayMode.set(mode);
    this.persistenceService.setItem('userDisplayMode', mode);
  }

  setTheme(key: string): void {
    const theme = this.themes.find(t => t.key === key);
    if (theme) {
      this.currentThemeKey.set(key);
      this.persistenceService.setItem('userTheme', key);
      this.applyTheme(theme);
    }
  }

  private applyTheme(theme: Theme): void {
    const root = document.documentElement;
    root.style.setProperty('--theme-accent', theme.colors.accent);
    root.style.setProperty('--theme-hover', theme.colors.hover);
    root.style.setProperty('--theme-ring', theme.colors.ring);

    // Inject or update a style tag for pseudo-classes that can't be handled by inline styles
    const dynamicStyles = `
      .themed-bg-hover:hover {
        background-color: var(--theme-hover) !important;
      }
      .themed-bg-selected {
        background-color: var(--theme-accent) !important;
      }
    `;

    if (!this.styleElement) {
      this.styleElement = document.createElement('style');
      document.head.appendChild(this.styleElement);
    }
    this.styleElement.innerHTML = dynamicStyles;
  }
}