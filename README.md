# Vue Router Middlewares

[![vue2](https://img.shields.io/badge/vue-2.x-brightgreen.svg)](https://vuejs.org/)
[![npm bundle size](https://img.shields.io/bundlephobia/min/@derpierre65/vue-router-middlewares)](https://www.npmjs.com/package/@derpierre65/vue-router-middlewares)
[![npm](https://img.shields.io/npm/dw/@derpierre65/vue-router-middlewares)](https://www.npmjs.com/package/@derpierre65/vue-router-middlewares)

## Installation

```bash
npm install --save @derpierre65/vue-router-middlewares
```

## Usage

### Initialize

```js
import Router from 'vue-router';
import RouterMiddlewares from '@derpierre65/vue-router-middlewares';

Vue.use(Router);
const router = new Router({ ... });

Vue.use(RouterMiddlewares, {
    router,
});
```

#### Options

TODO

### Global Middlewares

Global Middlewares called on every route change.

```js
Vue.use(RouterMiddlewares, {
    router,
    globalMiddlewares: ['global-middleware', 'another-global-middleware'],
});
```

### Add Middlewares with `require.context`

```js
import {addMiddlewaresContext} from '@derpierre65/vue-router-middlewares';

// import all from middlewares directory
addMiddlewaresContext(
	require.context('./middlewares', false, /.*\.(js|ts)$/),
);

// middlewares/test.js
export default function(to, from, params, components) {
    // do middleware stuff
    return;
    // return false; // to stop navigation
    // return '/hello'; // redirect to /hello
    // return {name: 'hello'}; // redirect to route with name hello
}
```

### Add Middleware(s)

```js
import {addMiddleware, addMiddlewares} from '@derpierre65/vue-router-middlewares';

// single middleware
addMiddleware('my-middleware', async function(to, from, params) {
    return;
});

// multiple middlewares
addMiddlewares({
    'my-middleware': (to, from, params) => true,
    'my-another-middleware': (to, from, params) => true,
});
```

### Use Middlewares in your router configuration

```js
const routes = [
  {
    path: '/',
    component: () => import('pages/MyComponent.vue'),
    meta: {
      middleware: ['my-middleware', 'my-another-middleware'],
      auth: true,
    },
  },
];

export default routes;
```

## Examples

### Auth Middleware

```js
// initialize
Vue.use(RouterMiddlewares, {
    router,
    globalMiddlewares: ['auth'],
});

// middlewares/auth.js
export default function (to, from, params) {
	let isLoggedIn = false; // your logged in check method
    if (to.meta.auth === false) {
        return;
    }

    if (to.meta.auth === 'guest' && isLoggedIn || to.meta.auth !== 'guest' && !isLoggedIn) {
        return { name: 'index' };
    }
}
```

The router configuration:

```js
const routes = [
  {
    path: '/',
    component: () => import('pages/MyComponent.vue'),
    meta: {
      middleware: ['auth'],
      auth: true,
    },
  },
];

export default routes;
```