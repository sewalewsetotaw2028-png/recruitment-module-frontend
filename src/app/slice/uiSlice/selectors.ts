import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@/store/types/RootState';
import { initialState } from './index';

const selectUiDomain = (state: RootState) =>
  (state as RootState & { ui?: typeof initialState }).ui ?? initialState;

export const selectActiveTab = createSelector(
  [selectUiDomain],
  (ui) => ui.activeTab,
);

export const selectVacancyHubView = createSelector(
  [selectUiDomain],
  (ui) => ui.vacancyHubView,
);
