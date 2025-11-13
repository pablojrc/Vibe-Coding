import { Injectable, signal, computed, inject, WritableSignal, Signal } from '@angular/core';
import { translations } from '../i18n/translations';
import { PersistenceService } from './persistence.service';

export interface Language {
  code: string;
  nameKey: string; // Changed from `name` to a translation key
  flagCode: string;
}

export interface TranslatedLanguage {
  code: string;
  name: string; // This will hold the translated name
  flagCode: string;
}

const ALL_LANGUAGES: Language[] = [
  { code: 'en', nameKey: 'LANG_EN', flagCode: 'gb' },
  { code: 'es', nameKey: 'LANG_ES', flagCode: 'es' },
  { code: 'fr', nameKey: 'LANG_FR', flagCode: 'fr' },
  { code: 'de', nameKey: 'LANG_DE', flagCode: 'de' },
  { code: 'pt', nameKey: 'LANG_PT', flagCode: 'pt' },
  { code: 'it', nameKey: 'LANG_IT', flagCode: 'it' },
  { code: 'ht', nameKey: 'LANG_HT', flagCode: 'ht' },
  { code: 'la', nameKey: 'LANG_LA', flagCode: 'va' },
  { code: 'ru', nameKey: 'LANG_RU', flagCode: 'ru' },
  { code: 'tr', nameKey: 'LANG_TR', flagCode: 'tr' },
  { code: 'zh', nameKey: 'LANG_ZH', flagCode: 'cn' },
  { code: 'yue', nameKey: 'LANG_YUE', flagCode: 'hk' },
  { code: 'ja', nameKey: 'LANG_JA', flagCode: 'jp' },
  { code: 'ar', nameKey: 'LANG_AR', flagCode: 'sa' },
  { code: 'hi', nameKey: 'LANG_HI', flagCode: 'in' },
  { code: 'ur', nameKey: 'LANG_UR', flagCode: 'pk' },
  { code: 'fa', nameKey: 'LANG_FA', flagCode: 'ir' },
  { code: 'ta', nameKey: 'LANG_TA', flagCode: 'in' },
];


@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private persistenceService = inject(PersistenceService);
  private browserLang = 'en';

  currentLanguageCode: WritableSignal<string> = signal('en');
  
  availableLanguages: Signal<TranslatedLanguage[]> = computed(() => {
      const currentCode = this.currentLanguageCode();

      // Create a new array of objects with names translated to the current language
      const allTranslated = ALL_LANGUAGES.map(lang => ({
        code: lang.code,
        name: this.translate(lang.nameKey),
        flagCode: lang.flagCode,
      }));
      
      const localLang = allTranslated.find(l => l.code === this.browserLang);
      const english = allTranslated.find(l => l.code === 'en');
      
      const otherLangs = allTranslated
          .filter(l => l.code !== this.browserLang && l.code !== 'en')
          .sort((a, b) => a.name.localeCompare(b.name, currentCode));

      const sortedList: TranslatedLanguage[] = [];
      if (localLang) sortedList.push(localLang);
      if (english && this.browserLang !== 'en') sortedList.push(english);
      
      // The Set correctly de-duplicates because localLang, english, and otherLangs
      // all contain object references from the same `allTranslated` array.
      return [...new Set([...sortedList, ...otherLangs])];
  });

  init() {
    this.browserLang = navigator.language.split('-')[0];
    const savedLang = this.persistenceService.getItem<string>('userLanguage');
    const initialLang = savedLang || this.browserLang;
    this.setLanguage(ALL_LANGUAGES.some(l => l.code === initialLang) ? initialLang : 'en');
  }

  setLanguage(langCode: string) {
    this.currentLanguageCode.set(langCode);
    this.persistenceService.setItem('userLanguage', langCode);
  }

  translate(key: string): string {
    const lang = this.currentLanguageCode();
    const langTranslations = translations[lang] || translations['en'];
    return langTranslations[key] || key;
  }
}