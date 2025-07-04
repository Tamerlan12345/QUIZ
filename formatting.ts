// A note on "ИИН": This is an Individual Identification Number used in Kazakhstan, which is a 12-digit number.
// This context makes "тенге" (KZT) an appropriate default currency.

/**
 * Sanitizes a string to allow only numbers and a single decimal point.
 * Replaces commas with dots.
 * @param {string} value The input string from a form field.
 * @returns {string} A sanitized numeric string.
 */
export function sanitizeNumberInput(value: string): string {
  const cleaned = value.replace(/[^0-9.,]/g, '').replace(',', '.');
  const parts = cleaned.split('.');
  if (parts.length > 2) {
    return parts[0] + '.' + parts.slice(1).join('');
  }
  return cleaned;
}

/**
 * Formats a numeric string by adding spaces as thousand separators.
 * @param {string} numStr The numeric string to format.
 * @returns {string} The formatted string, e.g., "1 000 000.50".
 */
export function formatNumberWithSpaces(numStr: string): string {
    if (!numStr) return '';
    const [integerPart, decimalPart] = numStr.split('.');
    const formattedIntegerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return decimalPart !== undefined ? `${formattedIntegerPart}.${decimalPart}` : formattedIntegerPart;
}

/**
 * Formats a date string (YYYY-MM-DD) into a Russian format "«DD» month_name YYYY г.".
 * @param {string} dateStr The date string in 'YYYY-MM-DD' format.
 * @returns {string} The formatted Russian date string.
 */
export function formatDateRu(dateStr: string): string {
  if (!dateStr) return '';
  try {
    // Add time to handle timezone issues
    const date = new Date(`${dateStr}T12:00:00Z`);
    const day = date.getUTCDate().toString().padStart(2, '0');
    const year = date.getUTCFullYear();
    const monthNames = [
      'января', 'февраля', 'марта', 'апреля', 'мая', 
      'июня', 'июля', 'августа', 'сентября', 'октября', 
      'ноября', 'декабря'
    ];
    const month = monthNames[date.getUTCMonth()];
    return `«${day}» ${month} ${year} г.`;
  } catch (e) {
    console.error("Date formatting error:", e);
    return dateStr;
  }
}

const units = ['', 'один', 'два', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять'];
const teens = ['десять', 'одиннадцать', 'двенадцать', 'тринадцать', 'четырнадцать', 'пятнадцать', 'шестнадцать', 'семнадцать', 'восемнадцать', 'девятнадцать'];
const tens = ['', '', 'двадцать', 'тридцать', 'сорок', 'пятьдесят', 'шестьдесят', 'семьдесят', 'восемьдесят', 'девяносто'];
const hundreds = ['', 'сто', 'двести', 'триста', 'четыреста', 'пятьсот', 'шестьсот', 'семьсот', 'восемьсот', 'девятьсот'];

function morph(number: number, titles: [string, string, string]): string {
  const cases = [2, 0, 1, 1, 1, 2];
  return titles[(number % 100 > 4 && number % 100 < 20) ? 2 : cases[Math.min(number % 10, 5)]];
}

function convertThreeDigitNumber(num: number, gender: 'male' | 'female'): string {
  if (num === 0) return '';

  const parts = [];
  const h = Math.floor(num / 100);
  if (h > 0) parts.push(hundreds[h]);

  const t = Math.floor((num % 100) / 10);
  const u = num % 10;

  if (t === 1) {
    parts.push(teens[u]);
  } else {
    if (t > 1) parts.push(tens[t]);
    if (u > 0) {
      parts.push(gender === 'female' && (u === 1 || u === 2) ? (u === 1 ? 'одна' : 'две') : units[u]);
    }
  }
  return parts.join(' ');
}

/**
 * Converts a number to its Russian word representation, with currency.
 * Specifically tailored for Kazakhstani Tenge (KZT).
 * @param {number} number The number to convert.
 * @param {'kzt'} [currency='kzt'] The currency type (currently only 'kzt' is supported).
 * @returns {string} The number in Russian words followed by the currency name.
 */
export function numberToWordsRu(number: number, currency: 'kzt' = 'kzt'): string {
    if (isNaN(number)) return '';
    const isNegative = number < 0;
    const num = Math.floor(Math.abs(number));

    if (num === 0) return 'ноль ' + morph(0, ['тенге', 'тенге', 'тенге']);

    const parts = [];
    
    const billions = Math.floor(num / 1000000000);
    if (billions > 0) {
        parts.push(convertThreeDigitNumber(billions, 'male') + ' ' + morph(billions, ['миллиард', 'миллиарда', 'миллиардов']));
    }

    const millions = Math.floor((num % 1000000000) / 1000000);
    if (millions > 0) {
        parts.push(convertThreeDigitNumber(millions, 'male') + ' ' + morph(millions, ['миллион', 'миллиона', 'миллионов']));
    }

    const thousands = Math.floor((num % 1000000) / 1000);
    if (thousands > 0) {
        parts.push(convertThreeDigitNumber(thousands, 'female') + ' ' + morph(thousands, ['тысяча', 'тысячи', 'тысяч']));
    }

    const rest = num % 1000;
    if (rest > 0) {
        parts.push(convertThreeDigitNumber(rest, 'male'));
    }

    const currencyWord = morph(rest, ['тенге', 'тенге', 'тенге']);
    const result = parts.filter(p => p.trim()).join(' ') + ' ' + currencyWord;

    return (isNegative ? 'минус ' : '') + result.trim();
}