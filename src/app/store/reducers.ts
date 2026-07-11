import { combineReducers, type Reducer } from '@reduxjs/toolkit';
import authReducer from '@/slice/authSlice';
import uiReducer from '@/slice/uiSlice';
import recruitmentDataReducer from '@/slice/recruitmentDataSlice';
import { authActions } from '@/slice/authSlice';

const baseReducers = {
  auth: authReducer,
  ui: uiReducer,
  recruitmentData: recruitmentDataReducer,
};

export function createReducer(
  injectedReducers: Record<string, Reducer> = {},
): Reducer {
  const combined = combineReducers({
    ...baseReducers,
    ...injectedReducers,
  });

  return (state, action) => {
    if (action.type === authActions.clearCredentials.type) {
      return combined(undefined, action);
    }
    return combined(state, action);
  };
}
