import type { Classifier } from './types';
import { ruleBasedClassifier } from './ruleBased';
import { createRemoteClassifier } from './remote';

export type { Classifier } from './types';

/**
 * Pick the engine in one place. Set VITE_CLASSIFIER=remote (and deploy /api/classify)
 * to switch the whole app to a real AI model without touching any UI code.
 */
export const classifier: Classifier =
  import.meta.env?.VITE_CLASSIFIER === 'remote' ? createRemoteClassifier(import.meta.env.VITE_CLASSIFIER_URL) : ruleBasedClassifier;
