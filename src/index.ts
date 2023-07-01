import { executionAsyncResource, createHook } from 'node:async_hooks';

const context = Symbol('context');

function enableContext() {
  createHook({
    init(asyncId, type, triggerAsyncId, resource: never) {
      const parentResource = executionAsyncResource() as never;
      if (parentResource) {
        resource[context] = parentResource[context];
      }
    },
  }).enable();
}

export function cntx<T>(init?: T): T {
  const resource = executionAsyncResource() as { context: T };
  resource[context] = init ? init : resource[context] || {};
  return resource[context];
}
cntx.enable = enableContext;
