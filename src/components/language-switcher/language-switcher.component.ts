
import { Component, ChangeDetectionStrategy, signal, inject, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="relative inline-block text-left">
      <div>
        <button (click)="toggleDropdown()" type="button" class="inline-flex justify-center items-center w-10 h-10 rounded-full bg-gray-700 text-sm font-medium text-white hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-sky-500" aria-haspopup="true" [attr.aria-expanded]="isOpen()">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 2a8 8 0 015.872 13.442l-1.428-1.428A6 6 0 1010 4.002v2.002a2 2 0 11-4 0V4a2 2 0 012-2zm0 16a8 8 0 01-5.872-13.442l1.428 1.428A6 6 0 1010 15.998v-2.002a2 2 0 114 0V16a2 2 0 01-2 2z" />
            <path d="M10 2a8 8 0 015.872 13.442c.39.39.39 1.024 0 1.414l-1.414 1.414a1 1 0 01-1.414 0L10 15.242l-3.036 3.036a1 1 0 01-1.414 0l-1.414-1.414a1 1 0 010-1.414A8 8 0 0110 2z" />
          </svg>
        </button>
      </div>

      @if (isOpen()) {
        <div class="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-gray-700 ring-1 ring-black ring-opacity-5 focus:outline-none z-50 max-h-60 overflow-y-auto" role="menu" aria-orientation="vertical">
          <div class="py-1" role="none">
            @for(lang of languageService.availableLanguages(); track lang.code) {
              <a 
                href="#"
                class="flex items-center px-4 py-2 text-sm text-gray-200 hover:bg-gray-600 hover:text-white"
                [class.bg-sky-600]="lang.code === languageService.currentLanguageCode()"
                role="menuitem"
                (click)="selectLanguage(lang.code, $event)">
                <img 
                  [src]="'https://flagcdn.com/w40/' + lang.flagCode + '.png'" 
                  [alt]="lang.name" 
                  class="w-5 h-5 mr-3 object-contain"
                />
                <span>{{ lang.name }}</span>
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
