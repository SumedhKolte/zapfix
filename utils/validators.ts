import { z } from 'zod';

export const phoneSchema = z
  .string()
  .regex(/^\d{10}$/, 'Enter a valid 10-digit phone number');

export const otpSchema = z.string().regex(/^\d{6}$/, 'Enter the 6-digit OTP');

export const nonEmptySchema = z.string().min(1, 'Required');
