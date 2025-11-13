
import '@angular/compiler';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, provideZonelessChangeDetection } from '@angular/core';

// --- Locale Registration for Date Pipe ---
import { registerLocaleData } from '@angular/common';
import localeEn from '@angular/common/locales/en';
import localeEs from '@angular/common/locales/es';
import localeFr from '@angular/common/locales/fr';
import localeDe from '@angular/common/locales/de';
import localePt from '@angular/common/locales/pt';
import localeIt from '@angular/common/locales/it';
import localeRu from '@angular/common/locales/ru';
import localeTr from '@angular/common/locales/tr';
import localeZh from '@angular/common/locales/zh';
import localeZhHant from '@angular/common/locales/zh-Hant';
import localeJa from '@angular/common/locales/ja';
import localeAr from '@angular/common/locales/ar';
import localeHi from '@angular/common/locales/hi';
import localeUr from '@angular/common/locales/ur';
import localeFa from '@angular/common/locales/fa';
import localeTa from '@angular/common/locales/ta';

import { AppComponent } from './src/app.component';

// Register all supported locales to ensure the date pipe works correctly.
[
  localeEn, localeEs, localeFr, localeDe, localePt, localeIt, localeRu, 
  localeTr, localeZh, localeZhHant, localeJa, localeAr, localeHi, localeUr, localeFa, localeTa
].forEach(registerLocaleData);


bootstrapApplication(AppComponent, {
  providers: [
    provideZonelessChangeDetection(),
    provideHttpClient(),
  ]
}).catch(err => console.error(err));

// AI Studio always uses an `index.tsx` file for all project types.