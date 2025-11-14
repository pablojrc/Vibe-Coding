import { Injectable, signal, computed, inject, WritableSignal, Signal } from '@angular/core';
import { translations } from '../i18n/translations';
import { PersistenceService } from './persistence.service';

export interface Language {
  code: string;
  nameKey: string;
  flagCode: string;
  localeId: string; // The corresponding locale ID for Angular pipes
}

export interface TranslatedLanguage {
  code: string;
  name: string; // This will hold the translated name
  flagCode: string;
  localeId: string;
}

const ALL_LANGUAGES: Language[] = [
  { code: 'en', nameKey: 'LANG_EN', flagCode: 'gb', localeId: 'en' },
  { code: 'es', nameKey: 'LANG_ES', flagCode: 'es', localeId: 'es' },
  { code: 'fr', nameKey: 'LANG_FR', flagCode: 'fr', localeId: 'fr' },
  { code: 'de', nameKey: 'LANG_DE', flagCode: 'de', localeId: 'de' },
  { code: 'pt', nameKey: 'LANG_PT', flagCode: 'pt', localeId: 'pt' },
  { code: 'it', nameKey: 'LANG_IT', flagCode: 'it', localeId: 'it' },
  { code: 'ht', nameKey: 'LANG_HT', flagCode: 'ht', localeId: 'fr' }, // Fallback to French
  { code: 'la', nameKey: 'LANG_LA', flagCode: 'va', localeId: 'en' }, // Fallback to English
  { code: 'ru', nameKey: 'LANG_RU', flagCode: 'ru', localeId: 'ru' },
  { code: 'tr', nameKey: 'LANG_TR', flagCode: 'tr', localeId: 'tr' },
  { code: 'zh', nameKey: 'LANG_ZH', flagCode: 'cn', localeId: 'zh' },
  { code: 'yue', nameKey: 'LANG_YUE', flagCode: 'hk', localeId: 'zh-Hant' }, // Use Traditional Chinese
  { code: 'ja', nameKey: 'LANG_JA', flagCode: 'jp', localeId: 'ja' },
  { code: 'ar', nameKey: 'LANG_AR', flagCode: 'sa', localeId: 'ar' },
  { code: 'hi', nameKey: 'LANG_HI', flagCode: 'in', localeId: 'hi' },
  { code: 'ur', nameKey: 'LANG_UR', flagCode: 'pk', localeId: 'ur' },
  { code: 'fa', nameKey: 'LANG_FA', flagCode: 'ir', localeId: 'fa' },
  { code: 'ta', nameKey: 'LANG_TA', flagCode: 'in', localeId: 'ta' },
];

const RTL_LANGUAGES = ['ar', 'ur', 'fa'];


@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private persistenceService = inject(PersistenceService);
  private browserLang = 'en';

  currentLanguageCode: WritableSignal<string> = signal('en');

  currentLocaleId: Signal<string> = computed(() => {
    const currentCode = this.currentLanguageCode();
    return ALL_LANGUAGES.find(lang => lang.code === currentCode)?.localeId || 'en';
  });

  isRtl: Signal<boolean> = computed(() => {
    return RTL_LANGUAGES.includes(this.currentLanguageCode());
  });
  
  availableLanguages: Signal<TranslatedLanguage[]> = computed(() => {
      const currentCode = this.currentLanguageCode();

      // Create a new array of objects with names translated to the current language
      const allTranslated = ALL_LANGUAGES.map(lang => ({
        code: lang.code,
        name: this.translate(lang.nameKey),
        flagCode: lang.flagCode,
        localeId: lang.localeId,
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
    this.browserLang = (navigator.language || 'en').split('-')[0];
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