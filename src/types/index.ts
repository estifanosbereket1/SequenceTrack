export type BlockType = 'text' | 'checklist_item' | 'photo' | 'link' | 'file';

export type StepStatus = 'not_started' | 'in_progress' | 'done';

export type InstanceStatus = 'not_started' | 'in_progress' | 'done';

export interface Template {
  id: number;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface TemplateStep {
  id: number;
  template_id: number;
  order_index: number;
  title: string;
  created_at: string;
  updated_at: string;
  blocks: TemplateBlock[];
}

export interface TemplateBlock {
  id: number;
  step_id: number;
  order_index: number;
  type: BlockType;
  text_content: string | null;
  uri: string | null;
  label: string | null;
  created_at: string;
}

export interface Instance {
  id: number;
  template_id: number;
  name: string;
  status: InstanceStatus;
  started_at: string;
  completed_at: string | null;
  template_title?: string;
}

export interface InstanceStep {
  id: number;
  instance_id: number;
  template_step_id: number | null;
  order_index: number;
  title: string;
  status: StepStatus;
  created_at: string;
  blocks: InstanceBlock[];
}

export interface InstanceBlock {
  id: number;
  instance_step_id: number;
  order_index: number;
  type: BlockType;
  text_content: string | null;
  uri: string | null;
  label: string | null;
  completed: boolean | null;
  completed_at: string | null;
}

export interface Reminder {
  id: number;
  instance_id: number;
  instance_step_id: number | null;
  title: string;
  scheduled_at: string;
  repeat_rule: string | null;
  notification_id: string;
  created_at: string;
}

export type LearningAttachmentType = 'photo' | 'file' | 'voice';

export interface Learning {
  id: number;
  title: string | null;
  body_markdown: string;
  created_at: string;
  updated_at: string;
  attachments: LearningAttachment[];
}

export interface LearningAttachment {
  id: number;
  learning_id: number;
  order_index: number;
  type: LearningAttachmentType;
  uri: string;
  label: string | null;
  caption: string | null;
  duration_seconds: number | null;
  created_at: string;
}

export interface AppMeta {
  key: string;
  value: string;
}

export interface Profile {
  id: number;
  name: string;
  photo_uri: string | null;
  created_at: string;
  updated_at: string;
}
