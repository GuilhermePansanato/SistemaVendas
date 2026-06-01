function stripToDigits(value: string) {
  return value.replace(/\D/g, '');
}

export function normalizeWhatsAppPhoneNumber(
  phoneNumber: string,
  defaultCountryCode = '55',
) {
  const digitsOnly = stripToDigits(phoneNumber);
  const normalizedCountryCode = stripToDigits(defaultCountryCode) || '55';

  if (digitsOnly.length < 10) {
    throw new Error('INVALID_PHONE_NUMBER');
  }

  if (
    digitsOnly.startsWith(normalizedCountryCode) &&
    digitsOnly.length >= normalizedCountryCode.length + 10
  ) {
    return digitsOnly;
  }

  if (digitsOnly.length === 10 || digitsOnly.length === 11) {
    return `${normalizedCountryCode}${digitsOnly}`;
  }

  return digitsOnly;
}

export function toWhatsAppChatId(
  phoneNumber: string,
  defaultCountryCode = '55',
) {
  return `${normalizeWhatsAppPhoneNumber(phoneNumber, defaultCountryCode)}@c.us`;
}
