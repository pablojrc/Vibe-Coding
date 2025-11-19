import { Injectable, signal, computed, inject, WritableSignal, Signal } from '@angular/core';
import { translations } from '../i18n/translations';
import { PersistenceService } from './persistence.service';

export interface Language {
  code: string;
  nameKey: string;
  nativeName: string; // The name of the language in its own script
  flagCode: string;
  localeId: string; // The corresponding locale ID for Angular pipes
}

export interface TranslatedLanguage {
  code: string;
  nativeName: string; // e.g., 'Español'
  translatedName: string; // e.g., 'Spanish' (if current language is English)
  flagCode: string;
  localeId: string;
}

const ALL_LANGUAGES: Language[] = [
  { code: 'en', nameKey: 'LANG_EN', nativeName: 'English', flagCode: 'gb', localeId: 'en' },
  { code: 'es', nameKey: 'LANG_ES', nativeName: 'Español', flagCode: 'es', localeId: 'es' },
  { code: 'fr', nameKey: 'LANG_FR', nativeName: 'Français', flagCode: 'fr', localeId: 'fr' },
  { code: 'de', nameKey: 'LANG_DE', nativeName: 'Deutsch', flagCode: 'de', localeId: 'de' },
  { code: 'pt', nameKey: 'LANG_PT', nativeName: 'Português', flagCode: 'pt', localeId: 'pt' },
  { code: 'it', nameKey: 'LANG_IT', nativeName: 'Italiano', flagCode: 'it', localeId: 'it' },
  { code: 'ht', nameKey: 'LANG_HT', nativeName: 'Kreyòl ayisyen', flagCode: 'ht', localeId: 'fr' },
  { code: 'la', nameKey: 'LANG_LA', nativeName: 'Latina', flagCode: 'va', localeId: 'en' },
  { code: 'ru', nameKey: 'LANG_RU', nativeName: 'Русский', flagCode: 'ru', localeId: 'ru' },
  { code: 'tr', nameKey: 'LANG_TR', nativeName: 'Türkçe', flagCode: 'tr', localeId: 'tr' },
  { code: 'zh', nameKey: 'LANG_ZH', nativeName: '中文', flagCode: 'cn', localeId: 'zh' },
  { code: 'yue', nameKey: 'LANG_YUE', nativeName: '廣東話', flagCode: 'hk', localeId: 'zh-Hant' },
  { code: 'ja', nameKey: 'LANG_JA', nativeName: '日本語', flagCode: 'jp', localeId: 'ja' },
  { code: 'ar', nameKey: 'LANG_AR', nativeName: 'العربية', flagCode: 'sa', localeId: 'ar' },
  { code: 'hi', nameKey: 'LANG_HI', nativeName: 'हिन्दी', flagCode: 'in', localeId: 'hi' },
  { code: 'ur', nameKey: 'LANG_UR', nativeName: 'اردو', flagCode: 'pk', localeId: 'ur' },
  { code: 'fa', nameKey: 'LANG_FA', nativeName: 'فارسی', flagCode: 'ir', localeId: 'fa' },
  { code: 'ta', nameKey: 'LANG_TA', nativeName: 'தமிழ்', flagCode: 'in', localeId: 'ta' },
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

      // Create a new array of objects with both native and translated names
      const allTranslated: TranslatedLanguage[] = ALL_LANGUAGES.map(lang => ({
        code: lang.code,
        nativeName: lang.nativeName,
        translatedName: this.translate(lang.nameKey),
        flagCode: lang.flagCode,
        localeId: lang.localeId,
      }));
      
      const localLang = allTranslated.find(l => l.code === this.browserLang);
      const english = allTranslated.find(l => l.code === 'en');
      
      const otherLangs = allTranslated
          .filter(l => l.code !== this.browserLang && l.code !== 'en')
          .sort((a, b) => a.translatedName.localeCompare(b.translatedName, currentCode));

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
