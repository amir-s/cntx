const assert = require('node:assert/strict');
const asyncHooks = require('node:async_hooks');
const Module = require('node:module');
const test = require('node:test');

test('enable is idempotent', () => {
  const modulePath = require.resolve('../lib');
  const originalLoad = Module._load;
  let createHookCalls = 0;
  let enableCalls = 0;
  const hook = {
    enable() {
      enableCalls += 1;
      return hook;
    },
  };

  delete require.cache[modulePath];
  Module._load = function load(request, parent, isMain) {
    if (request === 'node:async_hooks') {
      return {
        ...asyncHooks,
        createHook(options) {
          createHookCalls += 1;
          assert.equal(typeof options.init, 'function');
          return hook;
        },
      };
    }

    return originalLoad.call(this, request, parent, isMain);
  };

  try {
    const { cntx } = require('../lib');

    cntx.enable();
    cntx.enable();

    assert.equal(createHookCalls, 1);
    assert.equal(enableCalls, 1);
  } finally {
    Module._load = originalLoad;
    delete require.cache[modulePath];
  }
});
