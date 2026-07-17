// src/types.ts

// The data shape coming from your Go API
export interface ExamResult {
  sheet: string;
  date: string; // mapped from JSON "date"
  time: string;
  room: string;
  subject: string;
  subject_name?: string;
  section: string;
  student_id: string; // mapped from JSON "student_id"
  seat: string;
  note: string;
  branch?: string;
}


// ... (Rest of your existing layout definitions: SeatItem, ObstructionItem, etc.)
export interface SeatItem {
  type: 'seats';
  char: string;       
  manual?: number[];  
  count?: number;     
  start?: number;     
  step?: number;      
  inverse?: boolean;
}

export interface ObstructionItem {
  type: 'obstruction';
  label?: string;
  transparent?: boolean;
  count?: number;     
  height?: number;    
  width?: number;
}

export interface GapItem {
  type: 'gap';
  count?: number;     
}

export type LayoutItem = SeatItem | ObstructionItem | GapItem;

export interface ColumnBlock {
  type: 'column';
  label?: string;     
  items: LayoutItem[];
}

export interface AisleBlock {
  type: 'aisle';
  width: number;
}

export type RoomBlock = ColumnBlock | AisleBlock;

export interface RoomConfig {
  frontLabel?: string;
  backLabel?: string;
  i_layout?: string; // layout map
  i_map?: string; // map url
  i_images?: string[]; // images
  layout: RoomBlock[];
}

export type RoomConfigMap = Record<string, RoomConfig>;