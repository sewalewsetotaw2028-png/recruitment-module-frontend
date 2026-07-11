export interface DepartmentsState {
  loading: boolean;
  error: string | null;
  departments: Array<{ id: string; name: string }>;
}
