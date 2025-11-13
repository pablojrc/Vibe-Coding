import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { currencyNames } from '../data/currency-names';
import { currencyFlags } from '../data/currency-flags';

export interface Currency {
  code: string;
  name: string;
  rate: number; // Rate against USD
  flag?: string;
}

// Interface for the third-party API response structure
interface ExchangeRateApiResponse {
  result: string;
  base_code: string;
  conversion_rates: { [key: string]: number };
}

@Injectable({
  providedIn: 'root'
})
export class CurrencyService {
  private http = inject(HttpClient);

  // --- IMPORTANT ---
  // To enable live data, get a free API key from https://www.exchangerate-api.com
  // and replace 'YOUR_API_KEY' with your actual key.
  private apiKey = 'e8547ceb6ff49170df09ad9e';
  private apiUrl = `https://v6.exchangerate-api.com/v6/${this.apiKey}/latest/USD`;


  async getRates(): Promise<Currency[]> {
    // If the API key is the placeholder, we use fallback data immediately
    // to ensure the app works out-of-the-box without a real key.
    // The code in the 'try' block shows how a real implementation would work once the key is added.
    if (this.apiKey === 'YOUR_API_KEY') {
        console.warn("Using fallback currency data. Please replace 'YOUR_API_KEY' in currency.service.ts with a real key from ExchangeRate-API.com to get live data.");
        return this.getFallbackRates();
    }

    try {
      const response = await firstValueFrom(
        this.http.get<ExchangeRateApiResponse>(this.apiUrl)
      );

      if (response.result !== 'success') {
        throw new Error(`API returned an unsuccessful status: ${response.result}`);
      }
      
      const rates = response.conversion_rates;
      const currencies: Currency[] = Object.keys(rates).map(code => ({
        code: code,
        name: currencyNames[code] || code, // Fallback to code if a full name isn't in our list
        rate: rates[code],
        flag: currencyFlags[code] || '🏳️'
      }));

      // Sort currencies by code for easier selection
      currencies.sort((a, b) => a.code.localeCompare(b.code));
      
      return currencies;

    } catch (error) {
      console.error('Error fetching live currency rates:', error);
      // Fallback to a small, static list on any API error
      return this.getFallbackRates();
    }
  }

  private getFallbackRates(): Currency[] {
    console.warn('Using fallback currency data due to an API error or missing API key.');
    const fallbackData = [
      { code: 'USD', name: 'United States Dollar', rate: 1 },
      { code: 'EUR', name: 'Euro', rate: 0.92 },
      { code: 'JPY', name: 'Japanese Yen', rate: 157.50 },
      { code: 'GBP', name: 'British Pound', rate: 0.79 },
      { code: 'AUD', name: 'Australian Dollar', rate: 1.50 },
      { code: 'CAD', name: 'Canadian Dollar', rate: 1.37 },
      { code: 'CHF', name: 'Swiss Franc', rate: 0.90 },
      { code: 'CNY', name: 'Chinese Yuan', rate: 7.25 },
      { code: 'MXN', name: 'Mexican Peso', rate: 18.10 },
      { code: 'BRL', name: 'Brazilian Real', rate: 5.15 },
      { code: 'DOP', name: 'Dominican Peso', rate: 58.75 },
    ];

    return fallbackData.map(c => ({
      ...c,
      flag: currencyFlags[c.code] || '🏳️'
    })).sort((a, b) => a.code.localeCompare(b.code));
  }
}