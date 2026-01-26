import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Create shared mock functions outside of the vi.mock calls
const mockSend = vi.fn();
const mockLogError = vi.fn();

// Mock class that can be used as a constructor
class MockResend {
  emails = {
    send: mockSend,
  };
}

// Mock the Resend module with a proper class
vi.mock('resend', () => ({
  Resend: MockResend,
}));

// Mock the logger to prevent side effects
vi.mock('@/lib/logger', () => ({
  logError: mockLogError,
}));

describe('sendPasswordResetEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    // Re-register mocks after resetModules with the same class
    vi.doMock('resend', () => ({
      Resend: MockResend,
    }));
    vi.doMock('@/lib/logger', () => ({
      logError: mockLogError,
    }));
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('should return success when email sends successfully', async () => {
    vi.stubEnv('RESEND_API_KEY', 'test-api-key');
    mockSend.mockResolvedValueOnce({ error: null });

    const { sendPasswordResetEmail } = await import('@/lib/email');
    const result = await sendPasswordResetEmail('test@example.com', 'https://example.com/reset');

    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should return error when Resend returns error', async () => {
    vi.stubEnv('RESEND_API_KEY', 'test-api-key');
    mockSend.mockResolvedValueOnce({ error: { message: 'Email failed to send' } });

    const { sendPasswordResetEmail } = await import('@/lib/email');
    const result = await sendPasswordResetEmail('test@example.com', 'https://example.com/reset');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Email failed to send');
  });

  it('should return error when Resend throws exception', async () => {
    vi.stubEnv('RESEND_API_KEY', 'test-api-key');
    mockSend.mockRejectedValueOnce(new Error('Network error'));

    const { sendPasswordResetEmail } = await import('@/lib/email');
    const result = await sendPasswordResetEmail('test@example.com', 'https://example.com/reset');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Network error');
  });

  it('should return error when RESEND_API_KEY not set', async () => {
    delete process.env.RESEND_API_KEY;

    const { sendPasswordResetEmail } = await import('@/lib/email');
    const result = await sendPasswordResetEmail('test@example.com', 'https://example.com/reset');

    // The function catches the error and returns a result object
    expect(result.success).toBe(false);
    expect(result.error).toBe('RESEND_API_KEY environment variable is not set');
  });

  it('should use EMAIL_FROM env var when set', async () => {
    vi.stubEnv('RESEND_API_KEY', 'test-api-key');
    vi.stubEnv('EMAIL_FROM', 'custom@example.com');
    mockSend.mockResolvedValueOnce({ error: null });

    const { sendPasswordResetEmail } = await import('@/lib/email');
    await sendPasswordResetEmail('test@example.com', 'https://example.com/reset');

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'custom@example.com',
      })
    );
  });

  it('should use default from address when EMAIL_FROM not set', async () => {
    vi.stubEnv('RESEND_API_KEY', 'test-api-key');
    delete process.env.EMAIL_FROM;
    mockSend.mockResolvedValueOnce({ error: null });

    const { sendPasswordResetEmail } = await import('@/lib/email');
    await sendPasswordResetEmail('test@example.com', 'https://example.com/reset');

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'noreply@example.com',
      })
    );
  });

  it('should call logError on Resend error', async () => {
    vi.stubEnv('RESEND_API_KEY', 'test-api-key');
    mockSend.mockResolvedValueOnce({ error: { message: 'Send failed' } });

    const { sendPasswordResetEmail } = await import('@/lib/email');
    await sendPasswordResetEmail('test@example.com', 'https://example.com/reset');

    expect(mockLogError).toHaveBeenCalled();
  });

  it('should call logError on exception', async () => {
    vi.stubEnv('RESEND_API_KEY', 'test-api-key');
    mockSend.mockRejectedValueOnce(new Error('Exception occurred'));

    const { sendPasswordResetEmail } = await import('@/lib/email');
    await sendPasswordResetEmail('test@example.com', 'https://example.com/reset');

    expect(mockLogError).toHaveBeenCalled();
  });

  it('should include email and resetUrl in the email body', async () => {
    vi.stubEnv('RESEND_API_KEY', 'test-api-key');
    mockSend.mockResolvedValueOnce({ error: null });

    const { sendPasswordResetEmail } = await import('@/lib/email');
    await sendPasswordResetEmail('test@example.com', 'https://example.com/reset/token123');

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'test@example.com',
        subject: 'Reset your password',
        text: expect.stringContaining('https://example.com/reset/token123'),
      })
    );
  });
});

describe('sendWelcomeEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    // Re-register mocks after resetModules with the same class
    vi.doMock('resend', () => ({
      Resend: MockResend,
    }));
    vi.doMock('@/lib/logger', () => ({
      logError: mockLogError,
    }));
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('should return success when email sends successfully', async () => {
    vi.stubEnv('RESEND_API_KEY', 'test-api-key');
    mockSend.mockResolvedValueOnce({ error: null });

    const { sendWelcomeEmail } = await import('@/lib/email');
    const result = await sendWelcomeEmail('test@example.com', 'John');

    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should return error when Resend returns error', async () => {
    vi.stubEnv('RESEND_API_KEY', 'test-api-key');
    mockSend.mockResolvedValueOnce({ error: { message: 'Email delivery failed' } });

    const { sendWelcomeEmail } = await import('@/lib/email');
    const result = await sendWelcomeEmail('test@example.com', 'John');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Email delivery failed');
  });

  it('should return error when Resend throws exception', async () => {
    vi.stubEnv('RESEND_API_KEY', 'test-api-key');
    mockSend.mockRejectedValueOnce(new Error('Connection timeout'));

    const { sendWelcomeEmail } = await import('@/lib/email');
    const result = await sendWelcomeEmail('test@example.com', 'John');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Connection timeout');
  });

  it('should include user name in email', async () => {
    vi.stubEnv('RESEND_API_KEY', 'test-api-key');
    mockSend.mockResolvedValueOnce({ error: null });

    const { sendWelcomeEmail } = await import('@/lib/email');
    await sendWelcomeEmail('test@example.com', 'Jane');

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'test@example.com',
        subject: 'Welcome to QuickyNotes!',
        text: expect.stringContaining('Hi Jane'),
      })
    );
  });

  it('should call logError on failure', async () => {
    vi.stubEnv('RESEND_API_KEY', 'test-api-key');
    mockSend.mockResolvedValueOnce({ error: { message: 'Failed' } });

    const { sendWelcomeEmail } = await import('@/lib/email');
    await sendWelcomeEmail('test@example.com', 'John');

    expect(mockLogError).toHaveBeenCalled();
  });

  it('should handle non-Error exceptions', async () => {
    vi.stubEnv('RESEND_API_KEY', 'test-api-key');
    mockSend.mockRejectedValueOnce('String error');

    const { sendWelcomeEmail } = await import('@/lib/email');
    const result = await sendWelcomeEmail('test@example.com', 'John');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Unknown error');
  });

  it('should return error when RESEND_API_KEY not set', async () => {
    delete process.env.RESEND_API_KEY;

    const { sendWelcomeEmail } = await import('@/lib/email');
    const result = await sendWelcomeEmail('test@example.com', 'John');

    // The function catches the error and returns a result object
    expect(result.success).toBe(false);
    expect(result.error).toBe('RESEND_API_KEY environment variable is not set');
  });
});
