import { Component, OnInit, ChangeDetectionStrategy, signal, computed, inject, WritableSignal, Signal, effect, ElementRef, ViewChild, ViewChildren, QueryList } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { CurrencyService, Currency } from './services/currency.service';
import { PersistenceService } from './services/persistence.service';
import { LanguageService } from './services/language.service';
import { LocationService } from './services/location.service';
import { ThemeService } from './services/theme.service';
import { SpinnerComponent } from './components/spinner/spinner.component';
import { LanguageSwitcherComponent } from './components/language-switcher/language-switcher.component';
import { TranslatePipe } from './pipes/translate.pipe';

// Extends the base Currency interface with a translated name for display purposes.
interface DisplayCurrency extends Currency {
  translatedName: string;
}

@Component({
  selector: 'app-root',
  imports: [CommonModule, ReactiveFormsModule, SpinnerComponent, DecimalPipe, TranslatePipe, LanguageSwitcherComponent],
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:click)': 'onClickOutside($event)',
    '(document:keydown)': 'handleKeyboardShortcuts($event)',
  }
})
export class AppComponent implements OnInit {
  private currencyService = inject(CurrencyService);
  private persistenceService = inject(PersistenceService);
  private locationService = inject(LocationService);
  languageService = inject(LanguageService);
  themeService = inject(ThemeService);

  private readonly REFRESH_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes


  // --- Element References for Click Outside & Focus Logic ---
  @ViewChild('fromDropdownTrigger') fromDropdownTrigger?: ElementRef;
  @ViewChild('fromDropdownPanel') fromDropdownPanel?: ElementRef;
  @ViewChild('toDropdownTrigger') toDropdownTrigger?: ElementRef;
  @ViewChild('toDropdownPanel') toDropdownPanel?: ElementRef;
  @ViewChild('settingsButton') settingsButton?: ElementRef;
  @ViewChild('settingsPanel') settingsPanel?: ElementRef;
  @ViewChild('shortcutsButton') shortcutsButton?: ElementRef;
  @ViewChild('shortcutsPanel') shortcutsPanel?: ElementRef;
  @ViewChildren('fromCurrencyItem') fromCurrencyItems?: QueryList<ElementRef>;
  @ViewChildren('toCurrencyItem') toCurrencyItems?: QueryList<ElementRef>;


  // --- Signals for State Management ---
  currencies: WritableSignal<Currency[]> = signal([]);
  loading: WritableSignal<boolean> = signal(true);
  error: WritableSignal<string | null> = signal(null);
  lastUpdated: WritableSignal<Date> = signal(new Date());
  
  fromAmount: WritableSignal<number> = signal(1);
  toAmount: WritableSignal<number> = signal(0);
  fromAmountDisplay: WritableSignal<string> = signal('1');
  toAmountDisplay: WritableSignal<string> = signal('');

  fromCurrency: WritableSignal<string> = signal('');
  toCurrency: WritableSignal<string> = signal('');

  fromDropdownOpen = signal(false);
  toDropdownOpen = signal(false);
  isSettingsOpen = signal(false);
  isShortcutsOpen = signal(false);
  fromDropdownActiveIndex = signal<number | null>(null);
  toDropdownActiveIndex = signal<number | null>(null);

  // --- Formatting & Locale Signals ---
  formattingLocale: WritableSignal<string | null> = signal(this.persistenceService.getItem('userFormattingLocale'));
  effectiveLocale: Signal<string> = computed(() => this.formattingLocale() ?? this.languageService.currentLocaleId());


  // --- Computed Signals for Derived State ---
  translatedCurrencies: Signal<DisplayCurrency[]> = computed(() => {
    const lang = this.languageService.currentLanguageCode();
    const displayNames = new Intl.DisplayNames([lang], { type: 'currency' });

    return this.currencies().map(currency => {
      let translatedName = currency.name; // Fallback to English name
      try {
        // Use Intl.DisplayNames for proper, localized currency names
        const name = displayNames.of(currency.code);
        // Some codes might not have a translation, so we check for that
        translatedName = (name && name !== currency.code) ? name : currency.name;
      } catch (e) {
        // Keep fallback name if Intl.DisplayNames fails for a code
      }
      return { ...currency, translatedName };
    });
  });

  fromCurrencyData: Signal<Currency | undefined> = computed(() => 
    this.currencies().find(c => c.code === this.fromCurrency())
  );
  toCurrencyData: Signal<Currency | undefined> = computed(() => 
    this.currencies().find(c => c.code === this.toCurrency())
  );
  
  singleUnitRate: Signal<number> = computed(() => {
    const rates = this.currencies();
    if (rates.length === 0) return 0;

    const fromRate = rates.find(c => c.code === this.fromCurrency())?.rate ?? 1;
    const toRate = rates.find(c => c.code === this.toCurrency())?.rate ?? 0;

    if (fromRate === 0) return 0;

    return toRate / fromRate;
  });

  fromCurrencyFullName: Signal<string> = computed(() => {
    const code = this.fromCurrency();
    const lang = this.languageService.currentLanguageCode();
    if (!code) return '';
    try {
      // Use Intl.DisplayNames for proper, localized currency names
      const displayName = new Intl.DisplayNames([lang], { type: 'currency' }).of(code);
      return displayName || this.currencies().find(c => c.code === code)?.name || '';
    } catch (e) {
      // Fallback for older browsers or invalid codes
      return this.currencies().find(c => c.code === code)?.name || '';
    }
  });

  toCurrencyFullName: Signal<string> = computed(() => {
    const code = this.toCurrency();
    const lang = this.languageService.currentLanguageCode();
    if (!code) return '';
    try {
      const displayName = new Intl.DisplayNames([lang], { type: 'currency' }).of(code);
      return displayName || this.currencies().find(c => c.code === code)?.name || '';
    } catch (e) {
      return this.currencies().find(c => c.code === code)?.name || '';
    }
  });

  constructor() {
    this.languageService.init();
    this.themeService.init();
    
    // Effect to persist currency selections
    effect(() => {
        const from = this.fromCurrency();
        const to = this.toCurrency();
        // Only save to persistence if we have currencies loaded and valid selections
        if (this.currencies().length > 0 && from && to) {
            this.persistenceService.setItem('userCurrencies', { from, to });
        }
    });

    // Effect to persist the last entered amount
    effect(() => {
      const amount = this.fromAmount();
      if (this.currencies().length > 0 && !isNaN(amount)) {
        this.persistenceService.setItem('lastAmount', amount);
      }
    });

    // Effect to handle document direction (LTR/RTL)
    effect(() => {
      const isRtl = this.languageService.isRtl();
      document.documentElement.lang = this.languageService.currentLanguageCode();
      document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    });

    // Effect to auto-update number formats when language changes and format is "Auto"
    effect(() => {
        // When the UI language changes, re-format the numbers
        // ONLY if the user has not selected a specific number format override.
        this.languageService.currentLanguageCode(); // Establish dependency
        if (this.formattingLocale() === null) {
            // Re-format both displayed amounts to match the new language's default format.
            this.fromAmountDisplay.set(this.formatAmount(this.fromAmount()));
            this.toAmountDisplay.set(this.formatAmount(this.toAmount()));
        }
    });
  }

  async ngOnInit(): Promise<void> {
    await this.loadInitialData();
    setInterval(() => this.refreshRates(), this.REFRESH_INTERVAL_MS);
  }

  private async loadInitialData(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      // 1. Fetch all currency rates.
      const rates = await this.currencyService.getRates();
      
      // 2. Determine initial currencies before setting signals to avoid race conditions.
      const allCodes = new Set(rates.map(r => r.code));
      const savedCurrencies = this.persistenceService.getItem<{ from: string, to: string }>('userCurrencies');
      
      let initialFrom = 'USD';
      let initialTo = 'EUR';

      if (savedCurrencies && allCodes.has(savedCurrencies.from) && allCodes.has(savedCurrencies.to)) {
        initialFrom = savedCurrencies.from;
        initialTo = savedCurrencies.to;
      } else {
        // Attempt to set currency based on geolocation first, then fall back to locale.
        const geoCurrency = await this.locationService.getCurrencyFromGeolocation();
        let userCurrency: string | null = null;
        
        if (geoCurrency && allCodes.has(geoCurrency)) {
            userCurrency = geoCurrency;
        } else {
            // Fallback to locale-based currency
            userCurrency = this.locationService.getUserCurrency();
        }
        
        if (userCurrency && allCodes.has(userCurrency)) {
          initialFrom = userCurrency;
          initialTo = userCurrency === 'USD' ? 'EUR' : 'USD';
        }
      }

      // 3. Determine initial amount
      const savedAmount = this.persistenceService.getItem<number>('lastAmount');
      const initialAmount = (savedAmount !== null && !isNaN(savedAmount) && savedAmount > 0) ? savedAmount : 1;

      // 4. Set all state signals together.
      this.currencies.set(rates);
      this.fromCurrency.set(initialFrom);
      this.toCurrency.set(initialTo);
      this.fromAmount.set(initialAmount);
      this.lastUpdated.set(new Date());

      // 5. Perform the initial conversion calculation and set display values.
      this.fromAmountDisplay.set(this.formatAmount(initialAmount));
      this.updateToAmount();

    } catch (err) {
      this.error.set('Failed to fetch currency data. Please try again later.');
      console.error(err);
    } finally {
      this.loading.set(false);
    }
  }

  private async refreshRates(): Promise<void> {
    try {
      const rates = await this.currencyService.getRates();
      this.currencies.set(rates);
      this.lastUpdated.set(new Date());
      this.updateToAmount(); // Recalculate with new rates
      this.toAmountDisplay.set(this.formatAmount(this.toAmount()));
    } catch (err) {
      console.error('Failed to auto-refresh currency rates:', err);
    }
  }

  private parseInputAsNumber(value: string): number {
    // Sanitize to only keep numbers and the first decimal separator (commas or period).
    let sanitized = value.replace(/[^0-9.,]/g, '');

    const separatorMatch = sanitized.match(/[.,]/);
    if (separatorMatch) {
      const firstSeparatorIndex = separatorMatch.index!;
      const integerPart = sanitized.substring(0, firstSeparatorIndex).replace(/[.,]/g, '');
      const fractionalPart = sanitized.substring(firstSeparatorIndex + 1).replace(/[.,]/g, '');
      sanitized = `${integerPart}.${fractionalPart}`;
    } else {
      sanitized = sanitized.replace(/[.,]/g, '');
    }

    return parseFloat(sanitized) || 0;
  }

  private formatAmount(amount: number): string {
    const locale = this.effectiveLocale();

    // For values less than 1, show more precision to avoid displaying 0.00 for small amounts.
    if (amount !== 0 && Math.abs(amount) < 1) {
      return new Intl.NumberFormat(locale, {
        useGrouping: true,
        minimumFractionDigits: 2,
        maximumFractionDigits: 8,
      }).format(amount);
    }

    // For larger values, format with 2 decimal places, which is standard for most currencies.
    return new Intl.NumberFormat(locale, {
      useGrouping: true,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  private updateToAmount(): void {
    const rates = this.currencies();
    if (rates.length === 0) {
      this.toAmount.set(0);
      return;
    }
    
    const fromRate = rates.find(c => c.code === this.fromCurrency())?.rate ?? 0;
    const toRate = rates.find(c => c.code === this.toCurrency())?.rate ?? 0;
    
    if (fromRate === 0) {
        this.toAmount.set(0);
        return;
    };
    
    const amount = this.fromAmount();
    const result = (amount / fromRate) * toRate;
    this.toAmount.set(result);
    this.toAmountDisplay.set(this.formatAmount(result));
  }

  private updateFromAmount(): void {
    const rates = this.currencies();
    if (rates.length === 0) {
        this.fromAmount.set(0);
        return;
    }
    
    const fromRate = rates.find(c => c.code === this.fromCurrency())?.rate ?? 0;
    const toRate = rates.find(c => c.code === this.toCurrency())?.rate ?? 0;
    
    if (toRate === 0) {
        this.fromAmount.set(0);
        return;
    }
    
    const amount = this.toAmount();
    const result = (amount / toRate) * fromRate;
    this.fromAmount.set(result);
    this.fromAmountDisplay.set(this.formatAmount(result));
  }
  
  onAmountKeyDown(event: KeyboardEvent): void {
    const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
    if (allowedKeys.includes(event.key)) { return; }

    if ((event.ctrlKey || event.metaKey) && ['a', 'c', 'v', 'x', 'z'].includes(event.key.toLowerCase())) { return; }

    const input = event.target as HTMLInputElement;
    const currentValue = input.value;

    if (event.key === '.' || event.key === ',') {
      const hasDecimal = /[.,]/.test(currentValue);
      if (hasDecimal) {
        event.preventDefault();
      }
      return;
    }

    if (!/^\d$/.test(event.key)) {
      event.preventDefault();
    }
  }


  onFromAmountChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.fromAmountDisplay.set(value);
    this.fromAmount.set(this.parseInputAsNumber(value));
    this.updateToAmount();
  }

  onToAmountChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.toAmountDisplay.set(value);
    this.toAmount.set(this.parseInputAsNumber(value));
    this.updateFromAmount();
  }
  
  setFormattingLocale(locale: string | null): void {
    this.formattingLocale.set(locale);
    if (locale) {
      this.persistenceService.setItem('userFormattingLocale', locale);
    } else {
      this.persistenceService.removeItem('userFormattingLocale');
    }
    this.isSettingsOpen.set(false);
    
    // Defer re-formatting to ensure all state changes have propagated before re-calculating display values.
    // This resolves a potential timing issue where one input field might not update correctly.
    setTimeout(() => {
        this.fromAmountDisplay.set(this.formatAmount(this.fromAmount()));
        this.toAmountDisplay.set(this.formatAmount(this.toAmount()));
    }, 0);
  }

  setTheme(key: string): void {
    this.themeService.setTheme(key);
  }

  toggleFromDropdown(): void {
    this.toDropdownOpen.set(false);
    this.toDropdownActiveIndex.set(null); // Reset other dropdown
    this.fromDropdownOpen.update(v => {
      const isOpen = !v;
      if (isOpen) {
        // Defer updates to wait for the DOM to render the list
        setTimeout(() => {
          const currentIndex = this.currencies().findIndex(c => c.code === this.fromCurrency());
          this.fromDropdownActiveIndex.set(currentIndex !== -1 ? currentIndex : 0);
          this.fromDropdownPanel?.nativeElement.focus();
          this.scrollActiveItemIntoView('from');
        }, 0);
      } else {
        this.fromDropdownActiveIndex.set(null);
      }
      return isOpen;
    });
  }

  toggleToDropdown(): void {
    this.fromDropdownOpen.set(false);
    this.fromDropdownActiveIndex.set(null); // Reset other dropdown
    this.toDropdownOpen.update(v => {
      const isOpen = !v;
      if (isOpen) {
        // Defer updates to wait for the DOM to render the list
        setTimeout(() => {
          const currentIndex = this.currencies().findIndex(c => c.code === this.toCurrency());
          this.toDropdownActiveIndex.set(currentIndex !== -1 ? currentIndex : 0);
          this.toDropdownPanel?.nativeElement.focus();
          this.scrollActiveItemIntoView('to');
        }, 0);
      } else {
        this.toDropdownActiveIndex.set(null);
      }
      return isOpen;
    });
  }

  selectFromCurrency(code: string): void {
    if (this.fromCurrency() !== code) {
      this.fromCurrency.set(code);
      this.updateToAmount();
    }
    this.fromDropdownOpen.set(false);
    this.fromDropdownTrigger?.nativeElement.focus();
  }

  selectToCurrency(code: string): void {
    if (this.toCurrency() !== code) {
      this.toCurrency.set(code);
      this.updateToAmount();
    }
    this.toDropdownOpen.set(false);
    this.toDropdownTrigger?.nativeElement.focus();
  }

  onClickOutside(event: Event): void {
    const target = event.target as Node;

    // Close "from" currency dropdown if click is outside
    if (this.fromDropdownOpen() && !this.fromDropdownTrigger?.nativeElement.contains(target) && !this.fromDropdownPanel?.nativeElement.contains(target)) {
      this.fromDropdownOpen.set(false);
    }

    // Close "to" currency dropdown if click is outside
    if (this.toDropdownOpen() && !this.toDropdownTrigger?.nativeElement.contains(target) && !this.toDropdownPanel?.nativeElement.contains(target)) {
      this.toDropdownOpen.set(false);
    }
    
    // Close settings popover if click is outside
    if (this.isSettingsOpen() && !this.settingsButton?.nativeElement.contains(target) && !this.settingsPanel?.nativeElement.contains(target)) {
      this.isSettingsOpen.set(false);
    }

    // Close shortcuts popover if click is outside
    if (this.isShortcutsOpen() && !this.shortcutsButton?.nativeElement.contains(target) && !this.shortcutsPanel?.nativeElement.contains(target)) {
      this.isShortcutsOpen.set(false);
    }
  }

  swapCurrencies(): void {
    const currentFrom = this.fromCurrency();
    const currentTo = this.toCurrency();
    this.fromCurrency.set(currentTo);
    this.toCurrency.set(currentFrom);
    this.updateToAmount();
  }

  handleDropdownKeyDown(event: KeyboardEvent, type: 'from' | 'to'): void {
    const items = this.currencies();
    if (items.length === 0) return;

    const activeIndexSignal = type === 'from' ? this.fromDropdownActiveIndex : this.toDropdownActiveIndex;
    const openSignal = type === 'from' ? this.fromDropdownOpen : this.toDropdownOpen;
    const triggerEl = type === 'from' ? this.fromDropdownTrigger : this.toDropdownTrigger;
    
    let currentIndex = activeIndexSignal() ?? -1;

    // Prevent page scroll for keys that we handle
    if (['ArrowDown', 'ArrowUp', 'Home', 'End', ' '].includes(event.key)) {
      event.preventDefault();
    }

    switch (event.key) {
        case 'ArrowDown':
            currentIndex = (currentIndex + 1) % items.length;
            break;
        case 'ArrowUp':
            currentIndex = (currentIndex - 1 + items.length) % items.length;
            break;
        case 'Home':
            currentIndex = 0;
            break;
        case 'End':
            currentIndex = items.length - 1;
            break;
        case 'Enter':
        case ' ':
            if (currentIndex !== -1) {
                const selectedCurrency = items[currentIndex];
                if (type === 'from') {
                    this.selectFromCurrency(selectedCurrency.code);
                } else {
                    this.selectToCurrency(selectedCurrency.code);
                }
            }
            return;
        case 'Escape':
            openSignal.set(false);
            triggerEl?.nativeElement.focus();
            return;
        case 'Tab':
             openSignal.set(false);
             // Allow default tab behavior to continue
             return;
        default:
            return;
    }
    
    activeIndexSignal.set(currentIndex);
    this.scrollActiveItemIntoView(type);
  }

  private scrollActiveItemIntoView(type: 'from' | 'to'): void {
    const activeIndex = type === 'from' ? this.fromDropdownActiveIndex() : this.toDropdownActiveIndex();
    if (activeIndex === null) return;

    const items = type === 'from' ? this.fromCurrencyItems : this.toCurrencyItems;
    const element = items?.get(activeIndex)?.nativeElement;
    if (element) {
      element.scrollIntoView({ block: 'nearest' });
    }
  }

  handleKeyboardShortcuts(event: KeyboardEvent): void {
    // The Escape key closes any open modal/dropdown.
    if (event.key === 'Escape') {
      if (this.fromDropdownOpen() || this.toDropdownOpen() || this.isSettingsOpen() || this.isShortcutsOpen()) {
        this.fromDropdownOpen.set(false);
        this.toDropdownOpen.set(false);
        this.isSettingsOpen.set(false);
        this.isShortcutsOpen.set(false);
        event.preventDefault();
      }
      return;
    }

    // All other shortcuts use the Alt key.
    // We don't want to trigger them if a modifier like Ctrl or Meta is also pressed.
    if (!event.altKey || event.ctrlKey || event.metaKey) {
        return;
    }

    switch (event.key.toLowerCase()) {
        case 's':
            event.preventDefault();
            this.swapCurrencies();
            break;
        case 'f': { // Use block scope for const
            event.preventDefault();
            const input = document.getElementById('fromAmount') as HTMLInputElement;
            input?.focus();
            input?.select();
            break;
        }
        case 't': {
            event.preventDefault();
            const input = document.getElementById('toAmount') as HTMLInputElement;
            input?.focus();
            input?.select();
            break;
        }
        case 'o':
            event.preventDefault();
            this.isSettingsOpen.update(v => !v);
            break;
        case 'k':
            event.preventDefault();
            this.isShortcutsOpen.update(v => !v);
            break;
        case 'arrowup':
            event.preventDefault();
            this.toggleFromDropdown();
            break;
        case 'arrowdown':
            event.preventDefault();
            this.toggleToDropdown();
            break;
    }
  }
}
