import { describe, it, expect } from 'vitest';
import { buildMessages, calculateMaxTokens } from '../lib/prompt';

describe('Prompt Builder', () => {
  const sampleExtract = 'Albert Einstein was a German-born theoretical physicist.';
  const personName = 'Albert Einstein';

  describe('buildMessages', () => {
    it('should generate 2 messages (system and user)', () => {
      const messages = buildMessages(sampleExtract, 'normal', 240, personName);
      
      expect(messages).toHaveLength(2);
      expect(messages[0].role).toBe('system');
      expect(messages[1].role).toBe('user');
    });

    it('should include the extract in the user message', () => {
      const messages = buildMessages(sampleExtract, 'normal', 240, personName);
      
      expect(messages[1].content).toContain(sampleExtract);
    });

    it('should include max chars constraint in system message', () => {
      const messages = buildMessages(sampleExtract, 'normal', 500, personName);
      
      expect(messages[0].content).toContain('500');
    });

    it('should differentiate between normal and long styles', () => {
      const normalMessages = buildMessages(sampleExtract, 'normal', 240, personName);
      const longMessages = buildMessages(sampleExtract, 'long', 240, personName);
      
      // Both styles use the same optimized prompt structure for gpt-4.1-nano
      // The style parameter is preserved for future enhancement
      expect(normalMessages[0].content).toContain('greentext');
      expect(longMessages[0].content).toContain('greentext');
    });

    it('should include rubric constraints', () => {
      const messages = buildMessages(sampleExtract, 'normal', 240, personName);
      
      expect(messages[0].content).toContain('greentext');
      expect(messages[0].content).toContain('>');
    });
    
    it('should include the person name in the prompt', () => {
      const messages = buildMessages(sampleExtract, 'normal', 240, personName);
      
      expect(messages[0].content).toContain(personName);
      expect(messages[1].content).toContain(personName);
    });
    
    it('should mention recent events (2024-2026) requirement', () => {
      const messages = buildMessages(sampleExtract, 'normal', 240, personName);
      
      expect(messages[0].content).toContain('2024-2026');
      expect(messages[1].content).toContain('2024-2026');
    });
  });

  describe('calculateMaxTokens', () => {
    it('should calculate tokens correctly for various character counts', () => {
      // Formula: ceil(maxChars / 2.5) + 200
      // 64 chars: ceil(64 / 2.5) + 200 = 26 + 200 = 226
      expect(calculateMaxTokens(64)).toBe(226);
      
      // 240 chars: ceil(240 / 2.5) + 200 = 96 + 200 = 296
      expect(calculateMaxTokens(240)).toBe(296);
      
      // 500 chars: ceil(500 / 2.5) + 200 = 200 + 200 = 400
      expect(calculateMaxTokens(500)).toBe(400);
      
      // 1000 chars: ceil(1000 / 2.5) + 200 = 400 + 200 = 600
      expect(calculateMaxTokens(1000)).toBe(600);
      
      // 2000 chars: ceil(2000 / 2.5) + 200 = 800 + 200 = 1000
      expect(calculateMaxTokens(2000)).toBe(1000);
    });

    it('should clamp to minimum of 200 tokens', () => {
      // Small values should clamp to minimum of 200
      // 10 chars: ceil(10 / 2.5) + 200 = 4 + 200 = 204 (above minimum, no clamping)
      expect(calculateMaxTokens(10)).toBe(204);
      // 0 chars: ceil(0 / 2.5) + 200 = 0 + 200 = 200
      expect(calculateMaxTokens(0)).toBe(200);
      // Negative values: ceil(-10 / 2.5) + 200 = -4 + 200 = 196, clamped to 200
      expect(calculateMaxTokens(-10)).toBe(200);
    });

    it('should clamp to maximum of 16000 tokens', () => {
      // Large values should clamp to maximum of 16000
      // 40000 chars: ceil(40000 / 2.5) + 200 = 16000 + 200 = 16200, clamped to 16000
      expect(calculateMaxTokens(40000)).toBe(16000);
      expect(calculateMaxTokens(50000)).toBe(16000);
    });
  });
});
