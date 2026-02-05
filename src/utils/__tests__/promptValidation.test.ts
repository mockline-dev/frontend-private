import { describe, expect, test } from 'vitest';

import { enhancePrompt, generateFollowUpQuestions, validatePrompt } from '../promptValidation';

describe('Prompt Validation', () => {
  describe('validatePrompt', () => {
    test('should reject simple greetings', () => {
      const result = validatePrompt('hello');
      expect(result.isValid).toBe(false);
      expect(result.category).toBe('invalid');
      expect(result.suggestedQuestions).toBeDefined();
    });

    test('should reject test inputs', () => {
      const result = validatePrompt('testing');
      expect(result.isValid).toBe(false);
      expect(result.category).toBe('invalid');
    });

    test('should accept explicit backend requests', () => {
      const result = validatePrompt('Create a REST API for user management');
      expect(result.isValid).toBe(true);
      expect(result.category).toBe('backend');
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    test('should accept backend with authentication', () => {
      const result = validatePrompt('Build a backend with JWT authentication');
      expect(result.isValid).toBe(true);
      expect(result.category).toBe('backend');
    });

    test('should accept database-related requests', () => {
      const result = validatePrompt('Setup MongoDB database with user schema');
      expect(result.isValid).toBe(true);
      expect(result.category).toBe('backend');
    });

    test('should handle unclear prompts', () => {
      const result = validatePrompt('make something');
      expect(result.isValid).toBe(false);
      expect(result.category).toBe('unclear');
      expect(result.suggestedQuestions).toBeDefined();
    });

    test('should handle general app requests with clarification', () => {
      const result = validatePrompt('create a social media app');
      expect(result.isValid).toBe(true);
      expect(result.category).toBe('general');
      expect(result.suggestedQuestions).toBeDefined();
    });

    test('should reject empty prompts', () => {
      const result = validatePrompt('');
      expect(result.isValid).toBe(false);
      expect(result.category).toBe('invalid');
    });

    test('should reject single character prompts', () => {
      const result = validatePrompt('a');
      expect(result.isValid).toBe(false);
      expect(result.category).toBe('invalid');
    });

    test('should accept complex backend requirements', () => {
      const result = validatePrompt('Create an e-commerce backend with product management, user authentication, order processing, and payment integration');
      expect(result.isValid).toBe(true);
      expect(result.category).toBe('backend');
      expect(result.confidence).toBeGreaterThan(0.5);
    });
  });

  describe('generateFollowUpQuestions', () => {
    test('should generate questions for invalid prompts', () => {
      const questions = generateFollowUpQuestions('hello');
      expect(questions).toHaveLength(4);
      expect(questions[0]).toContain('specific');
    });

    test('should generate questions for valid prompts', () => {
      const questions = generateFollowUpQuestions('create api');
      expect(questions.length).toBeGreaterThan(0);
    });
  });

  describe('enhancePrompt', () => {
    test('should enhance valid backend prompts', () => {
      const enhanced = enhancePrompt('create user management api');
      expect(enhanced).toContain('professional backend application');
      expect(enhanced).toContain('error handling');
      expect(enhanced).toContain('security measures');
    });

    test('should not enhance invalid prompts', () => {
      const original = 'hello';
      const enhanced = enhancePrompt(original);
      expect(enhanced).toBe(original);
    });
  });
});

// Test cases for different prompt types
export const TEST_PROMPTS = {
  VALID_BACKEND: [
    'Create a REST API for blog management',
    'Build Express.js backend with MongoDB',
    'Generate user authentication system',
    'Make CRUD operations for products',
    'Setup database with user management',
    'Create API endpoints for e-commerce',
    'Build backend with JWT authentication',
    'Generate microservice architecture',
    'Create GraphQL API with database',
    'Build FastAPI backend with PostgreSQL'
  ],
  INVALID_SIMPLE: [
    'hello',
    'hi',
    'test',
    'testing',
    '123',
    'a',
    'ok',
    'thanks'
  ],
  UNCLEAR: [
    'make something',
    'create app',
    'build system',
    'help me',
    'I need code'
  ],
  GENERAL: [
    'create social media application',
    'build e-commerce platform',
    'make todo application',
    'create chat application',
    'build booking system'
  ]
};