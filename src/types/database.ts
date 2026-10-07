export type UserRole = 'admin' | 'user';
export type HotspotType = 'information' | 'question';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  password?: string;
  role: UserRole;
  avatar_url?: string;
  session_token?: string;
  session_expires?: number;
  created_at: string;
  updated_at: string;
}

export interface Panorama {
  id: string;
  title: string;
  file_url: string;
  width: number;
  height: number;
  aspect_ratio: number;
  file_size_bytes: number;
  storage_path: string;
  created_at: string;
  updated_at: string;
}

export interface Stage {
  id: string;
  title: string;
  description: string;
  order: number;
  panorama_id: string;
  is_active: boolean;
  initial_yaw: number;
  initial_pitch: number;
  initial_fov: number;
  created_at: string;
  updated_at: string;
}

export interface Hotspot {
  id: string;
  panorama_id: string;
  stage_id: string;
  hotspot_type: HotspotType;
  title: string;
  description: string;
  pos_x: number;
  pos_y: number;
  pos_z: number;
  is_active: boolean;
  order: number;
  created_at: string;
  updated_at: string;
}

export interface QuestionOption {
  id: string;
  question_id: string;
  option_text: string;
  is_correct: boolean;
  order: number;
}

export interface Question {
  id: string;
  stage_id: string;
  hotspot_id?: string | null;
  question_text: string;
  explanation?: string;
  order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  options?: QuestionOption[];
}

export interface UserAnswer {
  id: string;
  user_id: string;
  stage_id: string;
  question_id: string;
  selected_option_id: string;
  is_correct: boolean;
  answered_at: string;
}

export interface UserProgress {
  id: string;
  user_id: string;
  stage_id: string;
  correct_count: number;
  total_questions: number;
  is_completed: boolean;
  completed_at?: string | null;
}

export interface QuizAttempt {
  id: string;
  user_id: string;
  user_email?: string;
  user_name?: string;
  stage_id: string;
  stage_title?: string;
  attempt_number: number;
  correct_answers: number;
  total_questions: number;
  is_passed: boolean;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  user_email: string;
  action: 
    | 'login'
    | 'logout'
    | 'register'
    | 'create_panorama'
    | 'delete_panorama'
    | 'create_hotspot'
    | 'edit_hotspot'
    | 'delete_hotspot'
    | 'create_question'
    | 'edit_question'
    | 'delete_question'
    | 'answer_question'
    | 'complete_stage'
    | 'fail_stage'
    | 'reset_stage';
  details: string;
  created_at: string;
}

export interface SiteContent {
  id: string;
  key: string;
  title: string;
  content: string;
  updated_at: string;
}
