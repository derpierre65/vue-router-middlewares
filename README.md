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
import RouterMiddlewares from 'vue-router-middlewares';

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
import {addMiddlewaresContext} from 'vue-router-middlewares';

// import all from middlewares directory
addMiddlewaresContext(
	require.context('./middlewares', false, /.*\.(js|ts)$/),
);

// middlewares/test.js
export default function(to, from, next, params, components) {
    // do middleware stuff
    next();
};
```

### Add Middleware(s)

```js
import {addMiddleware, addMiddlewares} from 'vue-router-middlewares';

// single middleware
addMiddleware('my-middleware', function(to, from, next, params, components) {
    next();
});

// multiple middlewares
addMiddlewares({
    'my-middleware': (to, from, next, params, components) => next(),
    'my-another-middleware': (to, from, next, params, components) => next(),
});
```

### Use Middlewares

```vue
<template>
  <div>
    my route view component
  </div>
</template>

<script>
export default {
    name: 'ViewName',
    // middleware: 'my-middleware', // single middleware
    middleware: ['my-middleware', 'my-another-middleware'], // multiple middlewares
};
</script>
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
export default function (to, from, next, params, components) {
	let isLoggedIn = false; // your logged in check method
    for (let component of components) {
        if (component.auth === false) {
            continue;
        }

        if (component.auth === 'guest' && isLoggedIn || component.auth !== 'guest' && !isLoggedIn) {
            return next({ name: 'index' });
        }
    }

    next();
}
```

The view component:

```vue
<template>
  <div>
    my route view component
  </div>
</template>

<script>
export default {
    name: 'ViewName',
    // auth: false, // ignore the auth middleware
    auth: 'guest', // only guests can view this middleware
};
</script>
```