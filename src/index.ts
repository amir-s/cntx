import { executionAsyncResource, createHook } from 'node:async_hooks';

const context = Symbol('context');

type ContextResource<T> = {
  [context]?: T;
};

let contextHook: ReturnType<typeof createHook>;

function enableContext() {
  if (!contextHook) {
    contextHook = createHook({
      init(_asyncId, _type, _triggerAsyncId, resource: ContextResource<unknown>) {
        const parentResource = executionAsyncResource() as ContextResource<unknown>;
        if (parentResource && Object.prototype.hasOwnProperty.call(parentResource, context)) {
          resource[context] = parentResource[context];
        }
      },
    });
    contextHook.enable();
  }
}

export function cntx<T>(init?: T): T {
  const resource = executionAsyncResource() as ContextResource<T>;
  if (arguments.length > 0) {
    resource[context] = init;
  } else if (!Object.prototype.hasOwnProperty.call(resource, context)) {
    resource[context] = {} as T;
  }

  return resource[context];
}
cntx.enable = enableContext;
