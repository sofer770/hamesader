import { L } from '../../lib/i18n';
import type { ClassificationResult, ClassifyInput } from '../../lib/types';
import type { Classifier } from './types';
import { ruleBasedClassifier } from './ruleBased';

/**
 * Real-AI classifier. Calls YOUR server (e.g. /api/classify), which holds the model API key
 * and returns a ClassificationResult as JSON. The key never reaches the browser.
 * Falls back to the local rules on any error or after a short timeout, so the app never blocks.
 */
export function createRemoteClassifier(endpoint = '/api/classify', timeoutMs = 2500): Classifier {
  return {
    name: L('AI (שרת)', 'AI (server)'),
    async classify(input: ClassifyInput): Promise<ClassificationResult> {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), timeoutMs);
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: input.text, hint: input.hint, hasImage: input.hasImage, now: (input.now ?? new Date()).toISOString() }),
          signal: ctrl.signal,
        });
        if (!res.ok) throw new Error(`classify ${res.status}`);
        const data = (await res.json()) as ClassificationResult;
        return { ...data, engine: 'ai' };
      } catch {
        return ruleBasedClassifier.classify(input);
      } finally {
        clearTimeout(timer);
      }
    },
  };
}
