import type { ClassificationResult, ClassifyInput } from '../../lib/types';

/**
 * The single contract between the app and any classification engine.
 * The UI never knows whether rules or a real LLM produced the answer.
 */
export interface Classifier {
  readonly name: string;
  classify(input: ClassifyInput): Promise<ClassificationResult>;
}
