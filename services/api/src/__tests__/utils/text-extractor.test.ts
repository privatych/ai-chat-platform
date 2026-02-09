import { describe, it, expect } from 'vitest';
import { extractTextFromFile, truncateText, formatProjectContext } from '../../utils/text-extractor';

describe('Text Extractor', () => {
  describe('extractTextFromFile', () => {
    it('should extract text from plain text file', async () => {
      const file = {
        name: 'test.txt',
        mimeType: 'text/plain',
        data: Buffer.from('Hello, World!').toString('base64'),
      };

      const text = await extractTextFromFile(file);
      expect(text).toBe('Hello, World!');
    });

    it('should extract text from markdown file', async () => {
      const file = {
        name: 'test.md',
        mimeType: 'text/markdown',
        data: Buffer.from('# Heading\n\nSome text').toString('base64'),
      };

      const text = await extractTextFromFile(file);
      expect(text).toBe('# Heading\n\nSome text');
    });

    it('should extract and format JSON', async () => {
      const json = { key: 'value', nested: { data: 'test' } };
      const file = {
        name: 'test.json',
        mimeType: 'application/json',
        data: Buffer.from(JSON.stringify(json)).toString('base64'),
      };

      const text = await extractTextFromFile(file);
      expect(text).toContain('"key"');
      expect(text).toContain('"value"');
    });

    it('should throw error for unsupported file types', async () => {
      const file = {
        name: 'test.bin',
        mimeType: 'application/octet-stream',
        data: Buffer.from('binary data').toString('base64'),
      };

      await expect(extractTextFromFile(file)).rejects.toThrow('Unsupported file type');
    });

    it('should throw error for invalid JSON', async () => {
      const file = {
        name: 'test.json',
        mimeType: 'application/json',
        data: Buffer.from('not valid json').toString('base64'),
      };

      await expect(extractTextFromFile(file)).rejects.toThrow('Invalid JSON file');
    });
  });

  describe('truncateText', () => {
    it('should not truncate text shorter than max', () => {
      const text = 'Short text';
      const result = truncateText(text, 100);

      expect(result).toBe(text);
    });

    it('should truncate text longer than max', () => {
      const text = 'a'.repeat(100);
      const result = truncateText(text, 50);

      expect(result).toHaveLength(50 + '\n\n[Text truncated...]'.length);
      expect(result).toContain('[Text truncated...]');
    });

    it('should use default max of 50000 characters', () => {
      const text = 'a'.repeat(60000);
      const result = truncateText(text);

      expect(result.length).toBeLessThan(60000);
      expect(result).toContain('[Text truncated...]');
    });
  });

  describe('formatProjectContext', () => {
    it('should format project files', () => {
      const sections = {
        files: [
          { name: 'test.ts', content: 'const x = 1;' },
          { name: 'index.ts', content: 'export default x;' },
        ],
      };

      const result = formatProjectContext(sections);

      expect(result).toContain('=== PROJECT FILES ===');
      expect(result).toContain('--- test.ts ---');
      expect(result).toContain('const x = 1;');
      expect(result).toContain('--- index.ts ---');
    });

    it('should format instructions', () => {
      const sections = {
        instructions: 'Build a REST API',
      };

      const result = formatProjectContext(sections);

      expect(result).toContain('=== INSTRUCTIONS ===');
      expect(result).toContain('Build a REST API');
    });

    it('should format conversation history', () => {
      const sections = {
        conversationHistory: 'User: Hello\nAssistant: Hi!',
      };

      const result = formatProjectContext(sections);

      expect(result).toContain('=== CONVERSATION HISTORY ===');
      expect(result).toContain('User: Hello');
    });

    it('should format all sections together', () => {
      const sections = {
        files: [{ name: 'app.ts', content: 'code' }],
        instructions: 'Instructions here',
        conversationHistory: 'Chat history',
      };

      const result = formatProjectContext(sections);

      expect(result).toContain('=== PROJECT FILES ===');
      expect(result).toContain('=== INSTRUCTIONS ===');
      expect(result).toContain('=== CONVERSATION HISTORY ===');
    });

    it('should return empty string for empty sections', () => {
      const sections = {};

      const result = formatProjectContext(sections);

      expect(result).toBe('');
    });
  });
});
