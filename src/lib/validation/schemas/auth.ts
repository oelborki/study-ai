import { z } from "zod";

// Password requirements:
// - Minimum 8 characters
// - At least 1 uppercase letter
// - At least 1 lowercase letter
// - At least 1 number
// - At least 1 special character
const passwordRequirements = {
  minLength: 8,
  patterns: {
    uppercase: /[A-Z]/,
    lowercase: /[a-z]/,
    number: /[0-9]/,
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
  },
};

export const passwordSchema = z
  .string()
  .min(
    passwordRequirements.minLength,
    `Password must be at least ${passwordRequirements.minLength} characters`
  )
  .refine((val) => passwordRequirements.patterns.uppercase.test(val), {
    message: "Password must contain at least one uppercase letter",
  })
  .refine((val) => passwordRequirements.patterns.lowercase.test(val), {
    message: "Password must contain at least one lowercase letter",
  })
  .refine((val) => passwordRequirements.patterns.number.test(val), {
    message: "Password must contain at least one number",
  })
  .refine((val) => passwordRequirements.patterns.special.test(val), {
    message: "Password must contain at least one special character",
  });

export const emailSchema = z.string().email("Invalid email address").toLowerCase();

export const registerSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters")
    .trim(),
  email: emailSchema,
  password: passwordSchema,
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
