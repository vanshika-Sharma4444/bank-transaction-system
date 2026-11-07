/**
 * Utility functions for formatting currency, account numbers, dates, and idempotency keys
 */

// Format numbers into INR currency string (₹12,450.00)
export const formatCurrency = (amount = 0, currency = 'INR') => {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

export const parseAmountInMinorUnits = (amount) => {
  const text = typeof amount === 'number' && Number.isFinite(amount)
    ? String(amount)
    : typeof amount === 'string'
      ? amount.trim()
      : '';

  if (!/^\d+(?:\.\d{1,2})?$/.test(text)) return null;

  const [wholeUnits, fractionalUnits = ''] = text.split('.');
  const minorUnits =
    Number(wholeUnits) * 100 + Number(fractionalUnits.padEnd(2, '0'));

  return Number.isSafeInteger(minorUnits) ? minorUnits : null;
};

// Mask account ID to show only last 4 digits or formatted short code
export const maskAccountId = (accountId = '') => {
  if (!accountId) return '•••• 0000';
  const str = String(accountId);
  if (str.length <= 4) return `•••• ${str}`;
  return `•••• ${str.slice(-4)}`;
};

// Format ISO date string into readable date & time
export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'N/A';
  
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

// Generate a unique idempotency key for transactions (UUID v4 format)
export const generateIdempotencyKey = () => {
  return 'idemp_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 9);
};
