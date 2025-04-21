import { z } from 'zod';

// Validation schemas
export const sessionNameSchema = z
  .string()
  .min(3, 'Session name must be at least 3 characters long')
  .max(20, 'Session name cannot exceed 20 characters')
  .regex(/^[a-zA-Z0-9\s]+$/, 'Session name can only contain letters, numbers, and spaces')
  .refine((val) => val.trim().length > 0, 'Session name cannot be empty or only whitespace');

export const playerNameSchema = z
  .string()
  .min(2, 'Player name must be at least 2 characters long')
  .max(15, 'Player name cannot exceed 15 characters')
  .regex(/^[a-zA-Z0-9]+$/, 'Player name can only contain letters and numbers')
  .refine((val) => val.trim().length > 0, 'Player name cannot be empty or only whitespace');

export const questionSchema = z
  .string()
  .min(10, 'Question must be at least 10 characters long')
  .max(200, 'Question cannot exceed 200 characters')
  .refine((val) => val.trim().length > 0, 'Question cannot be empty or only whitespace')
  .refine((val) => val.trim().endsWith('?'), 'Question must end with a question mark');

export const answerSchema = z
  .string()
  .min(1, 'Answer must be at least 1 character long')
  .max(50, 'Answer cannot exceed 50 characters')
  .refine((val) => val.trim().length > 0, 'Answer cannot be empty or only whitespace');

export const guessSchema = answerSchema;

// Validation functions
export const validateSessionName = (name: string) => {
  return sessionNameSchema.safeParse(name);
};

export const validatePlayerName = (name: string) => {
  return playerNameSchema.safeParse(name);
};

export const validateQuestion = (question: string) => {
  return questionSchema.safeParse(question);
};

export const validateAnswer = (answer: string) => {
  return answerSchema.safeParse(answer);
};

export const validateGuess = (guess: string) => {
  return guessSchema.safeParse(guess);
};

// Error formatting
export const formatValidationError = (error: z.ZodError) => {
  return error.errors.map(err => ({
    field: err.path.join('.'),
    message: err.message
  }));
};