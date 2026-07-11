import type { createReducer } from '../reducers';

export type RootState = ReturnType<ReturnType<typeof createReducer>>;
