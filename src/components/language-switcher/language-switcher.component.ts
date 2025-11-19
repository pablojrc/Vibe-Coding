import { Component, ChangeDetectionStrategy, signal, inject, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LanguageService } from '../../services/language.service';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="relative inline-block text-start">
      <div>
        <button (click)="toggleDropdown()" type="button" class="inline-flex justify-center items-center w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-800" [style.--tw-ring-color]="'var(--theme-ring)'" aria-haspopup="true" [attr.aria-expanded]="isOpen()">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="currentColor" viewBox="0 0 256 256"><path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm69-88a69.32,69.32,0,0,1-4.4,24H67.4a69.32,69.32,0,0,1-4.4-24,69.32,69.32,0,0,1,4.4-24h124.2a69.32,69.32,0,0,1,4.4,24ZM128,40a89.32,89.32,0,0,0-29,4.28,68.65,68.65,0,0,1,13.8,19.72H143.2A68.65,68.65,0,0,1,157,44.28,89.32,89.32,0,0,0,128,40Zm0,176a89.32,89.32,0,0,0,29-4.28,68.65,68.65,0,0,1-13.8-19.72H112.8a68.65,68.65,0,0,1-13.8,19.72A89.32,89.32,0,0,0,128,216Z"></path></svg>
        </button>
      </div>

      @if (isOpen()) {
        <div class="origin-top-end absolute end-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-gray-700 ring-1 ring-black ring-opacity-5 focus:outline-none z-50 max-h-60 overflow-y-auto" role="menu" aria-orientation="vertical">
          <div class="py-1" role="none">
            @for(lang of languageService.availableLanguages(); track lang.code) {
              <a 
                href="#"
                [title]="lang.translatedName"
                class="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 hover:text-gray-900 dark:hover:text-white"
                [class.themed-bg-selected]="lang.code === languageService.currentLanguageCode()"
                [class.text-white]="lang.code === languageService.currentLanguageCode()"
                role="menuitem"
                (click)="selectLanguage(lang.code, $event)">
                <img 
                  [src]="'https://flagcdn.com/w40/' + lang.flagCode + '.png'" 
                  [alt]="lang.nativeName" 
                  class="w-5 h-5 me-3 object-contain"
                />
                <span>{{ lang.nativeName }}</span>
              </a>
            }
          </div>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:click)': 'onClickOutside($event)',
  }
})
export class LanguageSwitcherComponent {
  languageService = inject(LanguageService);
  themeService = inject(ThemeService);
  private elementRef = inject(ElementRef);
  isOpen = signal(false);

  toggleDropdown() {
    this.isOpen.update(open => !open);
  }

  selectLanguage(langCode: string, event: MouseEvent) {
    event.preventDefault();
    this.languageService.setLanguage(langCode);
    this.isOpen.set(false);
  }
  
  onClickOutside(event: Event) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen.set(false);
    }
  }
}