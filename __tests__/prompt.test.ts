import { describe, it, expect } from 'vitest';
import { buildMessages, calculateMaxTokens } from '../lib/prompt';

describe('Prompt Builder', () => {
  const sampleExtract = 'Albert Einstein was a German-born theoretical physicist.';

  describe('buildMessages', () => {
    it('should generate 2 messages (system and user)', () => {
      const messages = buildMessages(sampleExtract, 'normal', 240);
      
      expect(messages).toHaveLength(2);
      expect(messages[0].role).toBe('system');
      expect(messages[1].role).toBe('user');
    });

    it('should include the extract in the user message', () => {
      const messages = buildMessages(sampleExtract, 'normal', 240);
      
      expect(messages[1].content).toContain(sampleExtract);
    });

    it('should include max chars constraint in system message', () => {
      const messages = buildMessages(sampleExtract, 'normal', 500);
      
      expect(messages[0].content).toContain('500');
    });

    it('should differentiate between normal and long styles', () => {
      const normalMessages = buildMessages(sampleExtract, 'normal', 240);
      const longMessages = buildMessages(sampleExtract, 'long', 240);
      
      expect(normalMessages[0].content).toContain('concise');
      expect(longMessages[0].content).toContain('longer');
    });

    it('should include rubric constraints', () => {
      const messages = buildMessages(sampleExtract, 'normal', 240);
      
      expect(messages[0].content).toContain('greentext');
      expect(messages[0].content).toContain('>');
    });
  });

  describe('calculateMaxTokens', () => {
    it('should calculate tokens correctly for various character counts', () => {
      expect(calculateMaxTokens(64)).toBe(272); // 64/4 + 256 = 272
      expect(calculateMaxTokens(240)).toBe(316); // 240/4 + 256 = 316
      expect(calculateMaxTokens(500)).toBe(381); // 500/4 + 256 = 381
      expect(calculateMaxTokens(1000)).toBe(506); // 1000/4 + 256 = 506
      expect(calculateMaxTokens(2000)).toBe(756); // 2000/4 + 256 = 756
    });

    it('should clamp to minimum of 256 tokens', () => {
      expect(calculateMaxTokens(10)).toBe(259); // ceil(10/4) + 256 = 3 + 256
      expect(calculateMaxTokens(0)).toBe(256);  // ceil(0/4) + 256 = 0 + 256
    });

    it('should clamp to maximum of 4096 tokens', () => {
      expect(calculateMaxTokens(10000)).toBe(2756); // 10000/4 + 256
      expect(calculateMaxTokens(50000)).toBe(4096); // Clamped to max
    });
  });
});
