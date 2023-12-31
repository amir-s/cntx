# Async Context For Node

Create global context for async function call chain.
[![npm version](https://badge.fury.io/js/cntx.svg)](https://badge.fury.io/js/cntx)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Purpose

`cntx` is a lightweight npm package that simplifies the management of context in nested async functions, particularly in scenarios like request handlers. It eliminates the need for passing context as parameters or relying on global variables, which can lead to errors and conflicts in concurrent environments.

By utilizing Node's async hooks, `cntx` automatically propagates context to the subsequent async functions in the call chain. It offers an easy-to-use API and can serve as a foundation for building custom context managers with multiple namespaces.

## Installation

```bash
npm install cntx --save
```

## Usage

To enable async hooks, call `cntx.enable()` at the beginning of your program.

```js
import { cntx } from 'cntx';

cntx.enable();
```

You can use `cntx({key: value})` to initialize context for the current async call chain.
Calling `cntx()` with no arguments will return the current context.

### Example

Assume you have a web server that handles requests. You have many function calls (async or not) to deal with the request and you want to associate the logs deep in the call chain with the request id. You can use `cntx` to store the request id in the context and retrieve it in the log function. You can even put the `req` and `res` objects in the context and retrieve them in whatever function you need them.

```typescript
import { cntx } from 'cntx';
import http from 'http';

cntx.enable(); // enable async hooks

const log = (msg: string) => {
  const { requestId } = cntx<{ requestId: string }>(); // retrieve the request id from the context
  console.log(`[${requestId}] ${msg}`);
};

const queryDB = async () => {
  log(`Querying DB`); // log has access to the request id without passing it as a parameter
  await new Promise((resolve) => setTimeout(resolve, 1000));
  log(`Done querying DB`);
};

const server = http
  .createServer(async function (req, res) {
    cntx({ requestId: Math.floor(Math.random() * 1000000) }); // initialize context with request id

    log(`Handling request`);
    await queryDB(); // call an async fn
    log(`Done handling request`);

    await res.end('Yo!');
  })
  .listen(3000, 'localhost');
```

In the code above we use `cntx({requestId: ...})` to initialize the context with a random request id. We then use `cntx()` to retrieve the request id in the `log` (which is used deep in the `queryDB` funciton) function without passing it as a parameter.

## API

### `cntx(context)`

- `context` - An object containing the context to be stored. If no argument is passed, the current context is returned.

### `cntx.enable()`

Enables async hooks. This needs to be called once at the beginning of your program.
