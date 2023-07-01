# Async Context For Node

## Why

When dealing with nested async functions (like in request handlers), it is often necessary to pass context from one function to the next. This can be cumbersome and error prone. You can't use a global variable because it will be overwritten by concurrent requests.

With the power of node's async hooks, `cntx` provides a way to store and retrieve context without passing it around as a parameter. With every async function call, the context is automatically passed to the next function in the call chain.

`cntx` is meant to be simple and lightweight with easy to use API. If you need multiple namespaces, you can build on top of `cntx` to create your own context manager.

## Installation

```bash
npm install cntx --save
```

## Usage

You'd need to call `cntx.enable()` once at the beginning of your program to enable async hooks.

```js
import { cntx } from 'cntx';

cntx.enable();
```

To initialize context, you can use `cntx({key: value})` to initialize context for the current async call chain.
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
