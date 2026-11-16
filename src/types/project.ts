export interface Project {
  id: string;
  name: string;
  description: string;
  baselines?: string[]; // IDs of baselines for this project
  currentBaseline?: string; // ID of current baseline
  isDeleted?: boolean; // Soft delete flag
  lastModified: number;
}
