import { executionAsyncResource, createHook, type AsyncHook } from 'node:async_hooks';

const context = Symbol('context');
type ContextResource = { [context]?: unknown };
let hook: AsyncHook | undefined;

function enableContext() {
  hook ??= createHook({
    init(_asyncId, _type, _triggerAsyncId, resource: ContextResource) {
      const parentResource = executionAsyncResource() as ContextResource;
      if (parentResource) {
        resource[context] = parentResource[context];
      }
    },
  });
  hook.enable();
}

export function cntx<T>(init?: T): T {
  const resource = executionAsyncResource() as ContextResource;
  if (init !== undefined) {
    resource[context] = init;
  } else if (resource[context] === undefined) {
    resource[context] = {};
  }
  return resource[context] as T;
}
cntx.enable = enableContext;
