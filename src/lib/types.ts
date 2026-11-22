export type CategoryId = 'recipes' | 'shopping' | 'ideas' | 'tasks' | 'readlater' | 'places' | 'other';

/** What the user actually saved (independent of where it was filed). */
export type ContentType = 'text' | 'link' | 'task' | 'idea' | 'list' | 'image';

export type Priority = 'low' | 'medium' | 'high';

export interface LinkPreview {
  url: string;
  domain: string;
  siteName: string;
  title: string;
  description?: string;
  /** Key of a built-in illustration (no external images are fetched in the MVP). */
  cover?: string;
}

export interface TaskInfo {
  done: boolean;
  doneAt?: string;
  /** YYYY-MM-DD */
  dueDate?: string;
  /** HH:mm */
  dueTime?: string;
  /** ISO date-time */
  reminderAt?: string;
  reminderFired?: boolean;
  priority: Priority;
}

export interface ChecklistEntry {
  id: string;
  text: string;
  checked: boolean;
}

export interface Item {
  id: string;
  createdAt: string;
  updatedAt: string;
  rawText: string;
  title: string;
  summary?: string;
  category: CategoryId;
  contentType: ContentType;
  url?: string;
  link?: LinkPreview;
  tags: string[];
  notes: string;
  favorite: boolean;
  /** false = still in the inbox, waiting for the user to confirm the filing */
  reviewed: boolean;
  confidence: number;
  task?: TaskInfo;
  checklist?: ChecklistEntry[];
  /** Downscaled data URL of an uploaded image / screenshot */
  image?: string;
}

/** Input to the classifier: everything we know before filing. */
export interface ClassifyInput {
  text: string;
  /** A hint from the composer ("I'm adding a task") - the classifier should respect it. */
  hint?: ContentType;
  hasImage?: boolean;
  now?: Date;
}

/** Structured output every classifier (rules or real AI) must return. */
export interface ClassificationResult {
  category: CategoryId;
  title: string;
  summary: string;
  tags: string[];
  contentType: ContentType;
  isTask: boolean;
  isShoppingList: boolean;
  /** Products detected when isShoppingList */
  listItems: string[];
  /** YYYY-MM-DD if a date/deadline was detected */
  dueDate?: string;
  dueTime?: string;
  url?: string;
  /** 0..1 */
  confidence: number;
  /** Runner-up categories, best first, for the "did you mean" chips */
  alternatives: CategoryId[];
  /** Which engine produced this result */
  engine: 'rules' | 'ai';
}
