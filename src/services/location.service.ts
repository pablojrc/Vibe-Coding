import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LocationService {

  private localeToCurrencyMap: { [key: string]: string } = {
    'ad': 'EUR', 'ae': 'AED', 'af': 'AFN', 'ag': 'XCD', 'ai': 'XCD', 'al': 'ALL', 'am': 'AMD', 'ao': 'AOA', 'ar': 'ARS', 'as': 'USD', 'at': 'EUR', 'au': 'AUD', 'aw': 'AWG', 'ax': 'EUR', 'az': 'AZN',
    'ba': 'BAM', 'bb': 'BBD', 'bd': 'BDT', 'be': 'EUR', 'bf': 'XOF', 'bg': 'BGN', 'bh': 'BHD', 'bi': 'BIF', 'bj': 'XOF', 'bl': 'EUR', 'bm': 'BMD', 'bn': 'BND', 'bo': 'BOB', 'bq': 'USD', 'br': 'BRL', 'bs': 'BSD', 'bt': 'BTN', 'bv': 'NOK', 'bw': 'BWP', 'by': 'BYN', 'bz': 'BZD',
    'ca': 'CAD', 'cc': 'AUD', 'cd': 'CDF', 'cf': 'XAF', 'cg': 'XAF', 'ch': 'CHF', 'ci': 'XOF', 'ck': 'NZD', 'cl': 'CLP', 'cm': 'XAF', 'cn': 'CNY', 'co': 'COP', 'cr': 'CRC', 'cu': 'CUP', 'cv': 'CVE', 'cw': 'ANG', 'cx': 'AUD', 'cy': 'EUR', 'cz': 'CZK',
    'de': 'EUR', 'dj': 'DJF', 'dk': 'DKK', 'dm': 'XCD', 'do': 'DOP', 'dz': 'DZD',
    'ec': 'USD', 'ee': 'EUR', 'eg': 'EGP', 'er': 'ERN', 'es': 'EUR', 'et': 'ETB',
    'fi': 'EUR', 'fj': 'FJD', 'fk': 'FKP', 'fm': 'USD', 'fo': 'DKK', 'fr': 'EUR',
    'ga': 'XAF', 'gb': 'GBP', 'gd': 'XCD', 'ge': 'GEL', 'gf': 'EUR', 'gg': 'GBP', 'gh': 'GHS', 'gi': 'GIP', 'gl': 'DKK', 'gm': 'GMD', 'gn': 'GNF', 'gp': 'EUR', 'gq': 'XAF', 'gr': 'EUR', 'gs': 'GBP', 'gt': 'GTQ', 'gu': 'USD', 'gw': 'XOF', 'gy': 'GYD',
    'hk': 'HKD', 'hm': 'AUD', 'hn': 'HNL', 'hr': 'EUR', 'ht': 'HTG', 'hu': 'HUF',
    'id': 'IDR', 'ie': 'EUR', 'il': 'ILS', 'im': 'GBP', 'in': 'INR', 'io': 'USD', 'iq': 'IQD', 'ir': 'IRR', 'is': 'ISK', 'it': 'EUR',
    'je': 'GBP', 'jm': 'JMD', 'jo': 'JOD', 'jp': 'JPY',
    'ke': 'KES', 'kg': 'KGS', 'kh': 'KHR', 'ki': 'AUD', 'km': 'KMF', 'kn': 'XCD', 'kp': 'KPW', 'kr': 'KRW', 'kw': 'KWD', 'ky': 'KYD', 'kz': 'KZT',
    'la': 'LAK', 'lb': 'LBP', 'lc': 'XCD', 'li': 'CHF', 'lk': 'LKR', 'lr': 'LRD', 'ls': 'LSL', 'lt': 'EUR', 'lu': 'EUR', 'lv': 'EUR', 'ly': 'LYD',
    'ma': 'MAD', 'mc': 'EUR', 'md': 'MDL', 'me': 'EUR', 'mf': 'EUR', 'mg': 'MGA', 'mh': 'USD', 'mk': 'MKD', 'ml': 'XOF', 'mm': 'MMK', 'mn': 'MNT', 'mo': 'MOP', 'mp': 'USD', 'mq': 'EUR', 'mr': 'MRU', 'ms': 'XCD', 'mt': 'EUR', 'mu': 'MUR', 'mv': 'MVR', 'mw': 'MWK', 'mx': 'MXN', 'my': 'MYR', 'mz': 'MZN',
    'na': 'NAD', 'nc': 'XPF', 'ne': 'XOF', 'nf': 'AUD', 'ng': 'NGN', 'ni': 'NIO', 'nl': 'EUR', 'no': 'NOK', 'np': 'NPR', 'nr': 'AUD', 'nu': 'NZD', 'nz': 'NZD',
    'om': 'OMR',
    'pa': 'PAB', 'pe': 'PEN', 'pf': 'XPF', 'pg': 'PGK', 'ph': 'PHP', 'pk': 'PKR', 'pl': 'PLN', 'pm': 'EUR', 'pn': 'NZD', 'pr': 'USD', 'ps': 'ILS', 'pt': 'EUR', 'pw': 'USD', 'py': 'PYG',
    'qa': 'QAR',
    're': 'EUR', 'ro': 'RON', 'rs': 'RSD', 'ru': 'RUB', 'rw': 'RWF',
    'sa': 'SAR', 'sb': 'SBD', 'sc': 'SCR', 'sd': 'SDG', 'se': 'SEK', 'sg': 'SGD', 'sh': 'SHP', 'si': 'EUR', 'sj': 'NOK', 'sk': 'EUR', 'sl': 'SLL', 'sm': 'EUR', 'sn': 'XOF', 'so': 'SOS', 'sr': 'SRD', 'ss': 'SSP', 'st': 'STN', 'sv': 'USD', 'sx': 'ANG', 'sy': 'SYP', 'sz': 'SZL',
    'tc': 'USD', 'td': 'XAF', 'tf': 'EUR', 'tg': 'XOF', 'th': 'THB', 'tj': 'TJS', 'tk': 'NZD', 'tl': 'USD', 'tm': 'TMT', 'tn': 'TND', 'to': 'TOP', 'tr': 'TRY', 'tt': 'TTD', 'tv': 'AUD', 'tw': 'TWD', 'tz': 'TZS',
    'ua': 'UAH', 'ug': 'UGX', 'um': 'USD', 'us': 'USD', 'uy': 'UYU', 'uz': 'UZS',
    'va': 'EUR', 'vc': 'XCD', 've': 'VES', 'vg': 'USD', 'vi': 'USD', 'vn': 'VND', 'vu': 'VUV',
    'wf': 'XPF', 'ws': 'WST',
    'ye': 'YER', 'yt': 'EUR',
    'za': 'ZAR', 'zm': 'ZMW', 'zw': 'ZWL'
  };

  getUserCurrency(): string {
    try {
      const userLang = navigator.language; // e.g., 'en-US' or 'es-ES'
      if (!userLang) {
        return 'EUR'; // Fallback
      }

      // Format is typically lang-REGION, e.g., en-US, fr-CA, es-MX
      const regionCode = userLang.split('-')[1]?.toLowerCase();
      
      if (regionCode && this.localeToCurrencyMap[regionCode]) {
        return this.localeToCurrencyMap[regionCode];
      }

      // Fallback for languages without a specific region or unmapped regions
      const langCode = userLang.split('-')[0].toLowerCase();
      // Simple guess for some common languages if region is missing
      switch(langCode) {
        case 'en': return 'GBP'; // A guess, could be many
        case 'de': return 'EUR';
        case 'es': return 'EUR';
        case 'fr': return 'EUR';
        case 'ja': return 'JPY';
        case 'zh': return 'CNY';
      }

      return 'EUR'; // Ultimate fallback if no match is found
    } catch(e) {
      console.error("Could not determine user's currency from locale.", e);
      return 'EUR'; // Return a safe default on any error
    }
  }
}