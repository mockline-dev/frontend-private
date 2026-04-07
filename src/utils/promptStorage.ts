/**
 * Utility functions for managing prompt storage during authentication flow
 * Uses sessionStorage for temporary data that persists across page refreshes
 * during the current browser session
 */

const PROMPT_STORAGE_KEY = 'pending_prompt';

/**
 * Retrieve a saved prompt from sessionStorage
 * @returns The saved prompt string, or null if not found
 */
export function getSavedPrompt(): string | null {
  if (typeof window !== 'undefined') {
    return sessionStorage.getItem(PROMPT_STORAGE_KEY);
  }
  return null;
}

/**
 * Clear the saved prompt from sessionStorage
 */
export function clearSavedPrompt(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(PROMPT_STORAGE_KEY);
  }
}

