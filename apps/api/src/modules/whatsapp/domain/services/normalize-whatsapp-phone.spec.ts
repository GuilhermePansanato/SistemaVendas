import {
  normalizeWhatsAppPhoneNumber,
  toWhatsAppChatId,
} from './normalize-whatsapp-phone';

describe('normalizeWhatsAppPhoneNumber', () => {
  it('adds the default country code to local brazilian mobile numbers', () => {
    expect(normalizeWhatsAppPhoneNumber('14997294256')).toBe('5514997294256');
  });

  it('keeps numbers already stored in international format', () => {
    expect(normalizeWhatsAppPhoneNumber('5514997294256')).toBe('5514997294256');
  });

  it('strips formatting before building the chat id', () => {
    expect(toWhatsAppChatId('(14) 99729-4256')).toBe('5514997294256@c.us');
  });

  it('throws for invalid phone numbers', () => {
    expect(() => normalizeWhatsAppPhoneNumber('9999')).toThrow(
      'INVALID_PHONE_NUMBER',
    );
  });
});
