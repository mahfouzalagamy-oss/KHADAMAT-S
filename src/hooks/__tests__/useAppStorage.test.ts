import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loadStored } from '../useAppStorage';

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

describe('useAppStorage utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loadStored', () => {
    it('should return fallback when localStorage is empty', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const result = loadStored('test-key', 'fallback-value');

      expect(result).toBe('fallback-value');
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('test-key');
    });

    it('should parse and return stored value when available', () => {
      mockLocalStorage.getItem.mockReturnValue('"stored-value"');

      const result = loadStored('test-key', 'fallback-value');

      expect(result).toBe('stored-value');
    });

    it('should return fallback when parsing fails', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid-json{');

      const result = loadStored('test-key', 'fallback-value');

      expect(result).toBe('fallback-value');
    });

    it('should handle complex objects', () => {
      const testObject = { name: 'Test', count: 42 };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(testObject));

      const result = loadStored('test-key', { name: '', count: 0 });

      expect(result).toEqual(testObject);
    });
  });
});