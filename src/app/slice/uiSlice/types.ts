import type { VacancyHubView } from '@/state/appContext.types';

export interface UiState {
  activeTab: string;
  planningViewIntent: 'create' | { edit: string } | null;
  requestViewIntent: 'create' | { edit: string } | null;
  vacancyHubView: VacancyHubView;
  selectedVacancyId: string | null;
}
