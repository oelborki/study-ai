import { describe, it, expect } from 'vitest';
import {
  passwordSchema,
  emailSchema,
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '@/lib/validation/schemas/auth';

describe('passwordSchema', () => {
  describe('minimum length requirement', () => {
    it('should reject passwords shorter than 8 characters', () => {
      const result = passwordSchema.safeParse('Ab1!xyz');
      expect(result.success).toBe(false);
    });

    it('should accept passwords with exactly 8 characters', () => {
      const result = passwordSchema.safeParse('Ab1!xyzw');
      expect(result.success).toBe(true);
    });

    it('should accept passwords longer than 8 characters', () => {
      const result = passwordSchema.safeParse('Ab1!xyzwvutsrqp');
      expect(result.success).toBe(true);
    });
  });

  describe('uppercase letter requirement', () => {
    it('should reject passwords without uppercase letters', () => {
      const result = passwordSchema.safeParse('abcd1234!@');
      expect(result.success).toBe(false);
    });

    it('should accept passwords with uppercase letters', () => {
      const result = passwordSchema.safeParse('Abcd1234!@');
      expect(result.success).toBe(true);
    });
  });

  describe('lowercase letter requirement', () => {
    it('should reject passwords without lowercase letters', () => {
      const result = passwordSchema.safeParse('ABCD1234!@');
      expect(result.success).toBe(false);
    });

    it('should accept passwords with lowercase letters', () => {
      const result = passwordSchema.safeParse('ABCd1234!@');
      expect(result.success).toBe(true);
    });
  });

  describe('number requirement', () => {
    it('should reject passwords without numbers', () => {
      const result = passwordSchema.safeParse('Abcdefgh!@');
      expect(result.success).toBe(false);
    });

    it('should accept passwords with numbers', () => {
      const result = passwordSchema.safeParse('Abcdefg1!@');
      expect(result.success).toBe(true);
    });
  });

  describe('special character requirement', () => {
    it('should reject passwords without special characters', () => {
      const result = passwordSchema.safeParse('Abcdefg12');
      expect(result.success).toBe(false);
    });

    it('should accept passwords with special characters', () => {
      const specialChars = ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '_', '+', '-', '='];
      for (const char of specialChars) {
        const result = passwordSchema.safeParse(`Abcdefg1${char}`);
        expect(result.success).toBe(true);
      }
    });
  });

  describe('valid passwords', () => {
    it('should accept a valid password with all requirements met', () => {
      const validPasswords = [
        'Password1!',
        'MyP@ssw0rd',
        'Str0ng!Pass',
        'Test123!@#',
        'Ab1!xyzw',
      ];

      for (const password of validPasswords) {
        const result = passwordSchema.safeParse(password);
        expect(result.success).toBe(true);
      }
    });
  });
});

describe('emailSchema', () => {
  it('should reject invalid email formats', () => {
    const invalidEmails = [
      'notanemail',
      'missing@domain',
      '@nodomain.com',
      'spaces in@email.com',
      '',
    ];

    for (const email of invalidEmails) {
      const result = emailSchema.safeParse(email);
      expect(result.success).toBe(false);
    }
  });

  it('should accept valid email formats', () => {
    const validEmails = [
      'test@example.com',
      'user.name@domain.org',
      'user+tag@example.co.uk',
    ];

    for (const email of validEmails) {
      const result = emailSchema.safeParse(email);
      expect(result.success).toBe(true);
    }
  });

  it('should normalize email to lowercase', () => {
    const result = emailSchema.safeParse('Test@Example.COM');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe('test@example.com');
    }
  });
});

describe('registerSchema', () => {
  const validInput = {
    name: 'John Doe',
    email: 'john@example.com',
    password: 'Password1!',
  };

  it('should accept valid registration input', () => {
    const result = registerSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('should reject names shorter than 2 characters', () => {
    const result = registerSchema.safeParse({ ...validInput, name: 'J' });
    expect(result.success).toBe(false);
  });

  it('should reject names longer than 100 characters', () => {
    const result = registerSchema.safeParse({ ...validInput, name: 'a'.repeat(101) });
    expect(result.success).toBe(false);
  });

  it('should trim whitespace from name', () => {
    const result = registerSchema.safeParse({ ...validInput, name: '  John Doe  ' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('John Doe');
    }
  });

  it('should normalize email to lowercase', () => {
    const result = registerSchema.safeParse({ ...validInput, email: 'John@Example.COM' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('john@example.com');
    }
  });

  it('should require all fields', () => {
    const result = registerSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe('loginSchema', () => {
  it('should accept valid login input', () => {
    const result = loginSchema.safeParse({
      email: 'test@example.com',
      password: 'anypassword',
    });
    expect(result.success).toBe(true);
  });

  it('should reject empty password', () => {
    const result = loginSchema.safeParse({
      email: 'test@example.com',
      password: '',
    });
    expect(result.success).toBe(false);
  });

  it('should normalize email to lowercase', () => {
    const result = loginSchema.safeParse({
      email: 'Test@Example.COM',
      password: 'password',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('test@example.com');
    }
  });

  it('should not enforce password strength (just required)', () => {
    const result = loginSchema.safeParse({
      email: 'test@example.com',
      password: 'weak',
    });
    expect(result.success).toBe(true);
  });
});

describe('forgotPasswordSchema', () => {
  it('should accept valid email', () => {
    const result = forgotPasswordSchema.safeParse({ email: 'test@example.com' });
    expect(result.success).toBe(true);
  });

  it('should reject invalid email', () => {
    const result = forgotPasswordSchema.safeParse({ email: 'notanemail' });
    expect(result.success).toBe(false);
  });

  it('should normalize email to lowercase', () => {
    const result = forgotPasswordSchema.safeParse({ email: 'Test@Example.COM' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('test@example.com');
    }
  });
});

describe('resetPasswordSchema', () => {
  it('should accept valid reset input', () => {
    const result = resetPasswordSchema.safeParse({
      token: 'valid-token-123',
      password: 'NewPassword1!',
    });
    expect(result.success).toBe(true);
  });

  it('should reject empty token', () => {
    const result = resetPasswordSchema.safeParse({
      token: '',
      password: 'NewPassword1!',
    });
    expect(result.success).toBe(false);
  });

  it('should enforce password strength requirements', () => {
    const result = resetPasswordSchema.safeParse({
      token: 'valid-token-123',
      password: 'weak',
    });
    expect(result.success).toBe(false);
  });
});
