import { Component, OnInit, ChangeDetectionStrategy, signal, computed, inject, WritableSignal, Signal, effect, ElementRef } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { CurrencyService, Currency } from './services/currency.service';
import { PersistenceService } from './services/persistence.service';
import { LanguageService } from './services/language.service';
import { LocationService } from './services/location.service';
import { SpinnerComponent } from './components/spinner/spinner.component';
import { LanguageSwitcherComponent } from './components/language-switcher/language-switcher.component';
import { TranslatePipe } from './pipes/translate.pipe';


@Component({
  selector: 'app-root',
  imports: [CommonModule, ReactiveFormsModule, SpinnerComponent, DecimalPipe, TranslatePipe, LanguageSwitcherComponent],
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:click)': 'onClickOutside($event)',
  }
})
export class AppComponent implements OnInit {
  private currencyService = inject(CurrencyService);
  private persistenceService = inject(PersistenceService);
  private locationService = inject(LocationService);
  languageService = inject(LanguageService);
  private elementRef = inject(ElementRef);

  private readonly REFRESH_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes


  // --- Signals for State Management ---
  currencies: WritableSignal<Currency[]> = signal([]);
  loading: WritableSignal<boolean> = signal(true);
  error: WritableSignal<string | null> = signal(null);
  lastUpdated: WritableSignal<Date> = signal(new Date());
  
  fromAmount: WritableSignal<number> = signal(1);
  toAmount: WritableSignal<number> = signal(0);
  fromCurrency: WritableSignal<string> = signal('');
  toCurrency: WritableSignal<string> = signal('');

  fromDropdownOpen = signal(false);
  toDropdownOpen = signal(false);

  // --- Computed Signals for Derived State ---
  fromCurrencyData: Signal<Currency | undefined> = computed(() => 
    this.currencies().find(c => c.code === this.fromCurrency())
  );
  toCurrencyData: Signal<Currency | undefined> = computed(() => 
    this.currencies().find(c => c.code === this.toCurrency())
  );
  
  formattedFromAmount: Signal<string> = computed(() => this.formatAmount(this.fromAmount()));
  formattedToAmount: Signal<string> = computed(() => this.formatAmount(this.toAmount()));

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
    
    // Effect to persist currency selections
    effect(() => {
        const from = this.fromCurrency();
        const to = this.toCurrency();
        // Only save to persistence if we have currencies loaded and valid selections
        if (this.currencies().length > 0 && from && to) {
            this.persistenceService.setItem('userCurrencies', { from, to });
        }
    });

    // Effect to handle document direction (LTR/RTL)
    effect(() => {
      const isRtl = this.languageService.isRtl();
      document.documentElement.lang = this.languageService.currentLanguageCode();
      document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
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
        const userCurrency = this.locationService.getUserCurrency();
        if (allCodes.has(userCurrency) && userCurrency !== 'USD') {
            initialTo = userCurrency;
        }
      }

      // 3. Set all state signals together.
      this.currencies.set(rates);
      this.fromCurrency.set(initialFrom);
      this.toCurrency.set(initialTo);
      this.lastUpdated.set(new Date());

      // 4. Perform the initial conversion calculation.
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
    } catch (err) {
      console.error('Failed to auto-refresh currency rates:', err);
    }
  }

  private formatAmount(amount: number): string {
    // Using 'en-US' locale to guarantee '.' for decimal and ',' for thousands.
    if (amount !== 0 && Math.abs(amount) < 1) {
      return new Intl.NumberFormat('en-US', {
        useGrouping: true,
        minimumFractionDigits: 0,
        maximumFractionDigits: 12,
      }).format(amount);
    }
    return new Intl.NumberFormat('en-US', {
      useGrouping: true,
      minimumFractionDigits: 0,
      maximumFractionDigits: 4,
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
  }


  onFromAmountChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    const sanitizedValue = value.replace(/,/g, '');
    this.fromAmount.set(parseFloat(sanitizedValue) || 0);
    this.updateToAmount();
  }

  onToAmountChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    const sanitizedValue = value.replace(/,/g, '');
    this.toAmount.set(parseFloat(sanitizedValue) || 0);
    this.updateFromAmount();
  }

  toggleFromDropdown(): void {
    this.toDropdownOpen.set(false);
    this.fromDropdownOpen.update(v => !v);
  }

  toggleToDropdown(): void {
    this.fromDropdownOpen.set(false);
    this.toDropdownOpen.update(v => !v);
  }

  selectFromCurrency(code: string, event: MouseEvent): void {
    event.preventDefault();
    if (this.fromCurrency() !== code) {
      this.fromCurrency.set(code);
      this.updateToAmount();
    }
    this.fromDropdownOpen.set(false);
  }

  selectToCurrency(code: string, event: MouseEvent): void {
    event.preventDefault();
    if (this.toCurrency() !== code) {
      this.toCurrency.set(code);
      this.updateToAmount();
    }
    this.toDropdownOpen.set(false);
  }

  onClickOutside(event: Event): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.fromDropdownOpen.set(false);
      this.toDropdownOpen.set(false);
    }
  }

  swapCurrencies(): void {
    const currentFrom = this.fromCurrency();
    const currentTo = this.toCurrency();
    this.fromCurrency.set(currentTo);
    this.toCurrency.set(currentFrom);
    this.updateToAmount();
  }
}