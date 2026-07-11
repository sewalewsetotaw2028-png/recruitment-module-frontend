import { configureStore, type Store } from '@reduxjs/toolkit';
import { createInjectorsEnhancer } from 'redux-injectors';
import createSagaMiddleware from 'redux-saga';
import { createReducer } from './reducers';
import { rootSaga } from './rootSaga';

export function configureAppStore(): Store {
  const sagaMiddleware = createSagaMiddleware();
  const { run: runSaga } = sagaMiddleware;

  const enhancers = [
    createInjectorsEnhancer({
      createReducer,
      runSaga,
    }),
  ];

  const store = configureStore({
    reducer: createReducer(),
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false,
        thunk: false,
      }).concat(sagaMiddleware),
    devTools: import.meta.env.DEV,
    enhancers: (getDefaultEnhancers) =>
      getDefaultEnhancers().concat(enhancers) as never,
  });

  sagaMiddleware.run(rootSaga);
  return store;
}

export const store = configureAppStore();

export type AppDispatch = typeof store.dispatch;
