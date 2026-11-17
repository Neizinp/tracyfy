/**
 * The project is the folder it lives in: one folder (git repository) holds
 * exactly one project. Stored in tracyfy.yaml at the folder root.
 */
export interface Project {
  name: string;
  description: string;
}
