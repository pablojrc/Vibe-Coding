import { Component, OnInit, ChangeDetectionStrategy, signal, computed, inject, WritableSignal, Signal, effect } from '@angular/core';
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
})
export class AppComponent implements OnInit {
  private currencyService = inject(CurrencyService);
  private persistenceService = inject(PersistenceService);
  private locationService = inject(LocationService);
  languageService = inject(LanguageService);


  // --- Signals for State Management ---
  currencies: WritableSignal<Currency[]> = signal([]);
  loading: WritableSignal<boolean> = signal(true);
  error: WritableSignal<string | null> = signal(null);
  lastUpdated: WritableSignal<Date> = signal(new Date());
  
  fromAmount: WritableSignal<number> = signal(1);
  fromCurrency: WritableSignal<string> = signal('USD');
  toCurrency: WritableSignal<string> = signal('EUR');

  // --- Computed Signals for Derived State ---
  convertedAmount: Signal<number> = computed(() => {
    const rates = this.currencies();
    if (rates.length === 0) return 0;
    
    const fromRate = rates.find(c => c.code === this.fromCurrency())?.rate ?? 0;
    const toRate = rates.find(c => c.code === this.toCurrency())?.rate ?? 0;
    
    if (fromRate === 0) return 0;
    
    const amount = this.fromAmount();
    const result = (amount / fromRate) * toRate;
    return result;
  });

  singleUnitRate: Signal<number> = computed(() => {
    const rates = this.currencies();
    if (rates.length === 0) return 0;

    const fromRate = rates.find(c => c.code === this.fromCurrency())?.rate ?? 1;
    const toRate = rates.find(c => c.code === this.toCurrency())?.rate ?? 0;

    if (fromRate === 0) return 0;

    return toRate / fromRate;
  });

  constructor() {
    this.languageService.init();
    
    effect(() => {
        const from = this.fromCurrency();
        const to = this.toCurrency();
        if (this.currencies().length > 0) {
            this.persistenceService.setItem('userCurrencies', { from, to });
        }
    });
  }

  async ngOnInit(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const rates = await this.currencyService.getRates();
      this.currencies.set(rates);
      this.lastUpdated.set(new Date());

      this.initializeCurrencies();

    } catch (err) {
      this.error.set('Failed to fetch currency data. Please try again later.');
      console.error(err);
    } finally {
      this.loading.set(false);
    }
  }
  
  private initializeCurrencies(): void {
    const savedCurrencies = this.persistenceService.getItem<{ from: string, to: string }>('userCurrencies');
    
    if (savedCurrencies && this.currencyExists(savedCurrencies.from) && this.currencyExists(savedCurrencies.to)) {
      this.fromCurrency.set(savedCurrencies.from);
      this.toCurrency.set(savedCurrencies.to);
    } else {
      const userCurrency = this.locationService.getUserCurrency();
      
      this.fromCurrency.set('USD');
      
      if (userCurrency === 'USD') {
        this.toCurrency.set('EUR');
      } else {
        this.toCurrency.set(this.currencyExists(userCurrency) ? userCurrency : 'EUR');
      }
    }
  }

  private currencyExists(code: string): boolean {
    return this.currencies().some(c => c.code === code);
  }

  onFromAmountChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.fromAmount.set(parseFloat(value) || 0);
  }

  onFromCurrencyChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.fromCurrency.set(value);
  }

  onToCurrencyChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.toCurrency.set(value);
  }

  swapCurrencies(): void {
    const currentFrom = this.fromCurrency();
    const currentTo = this.toCurrency();
    this.fromCurrency.set(currentTo);
    this.toCurrency.set(currentFrom);
  }
}