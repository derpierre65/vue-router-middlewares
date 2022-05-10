const routerMiddlewares = {};

function resolveComponents(components) {
    return Promise.all(components.map(component => {
        return typeof component === 'function' ? component() : component;
    }));
}

function getMiddlewares(components) {
    const middlewares = [];

    components
        .filter(component => component && component.middleware)
        .forEach(component => {
            if (Array.isArray(component.middleware)) {
                middlewares.push(...component.middleware);
            } else {
                middlewares.push(component.middleware);
            }
        });

    return middlewares;
}

function parseMiddleware(middleware) {
    if (typeof middleware === 'function') {
        return {middleware};
    }

    middleware = middleware.toString(); // force to string
    let [name, params] = middleware.split(':'); // like auth:xyz
    if (typeof params === 'string') {
        params = params.split(',');
    }

    return {
        middleware: name,
        params
    };
}

function addMiddleware(name, middleware) {
    routerMiddlewares[name] = middleware;
}

function addMiddlewares(middlewares) {
    if (typeof middlewares !== 'object' || middlewares === null) {
        return;
    }

    for (let key of Object.keys(middlewares)) {
        routerMiddlewares[key] = middlewares[key];
    }
}

function addMiddlewaresContext(requireContext) {
    addMiddlewares(
        requireContext
            .keys()
            .map(file =>
                [file.replace(/(^.\/)|(\.(js|ts)$)/g, ''), requireContext(file)],
            )
            .reduce((guards, [name, guard]) => {
                return {...guards, [name]: guard.default};
            }, {})
    );
}

function getPromise(method) {
    if (typeof method !== 'function') {
        return Promise.resolve();
    }

    let promise = method();
    if (promise instanceof Promise) {
        return promise;
    }
    return Promise.resolve();
}

const Plugin = {
    install(Vue, {router, globalMiddlewares = [], beforeLoading, afterLoading}) {
        function callMiddlewares(middlewares, to, from, next, components) {
            const _next = (...args) => {
                // stop if "_next" was called with an argument or the stack is empty
                if (args.length > 0 || middlewares.length === 0) {
                    getPromise(afterLoading)
                        .then(() => {
                            next(...args);
                        })

                    return;
                }

                const {middleware, params} = parseMiddleware(middlewares.shift());

                if (typeof middleware === 'function') {
                    middleware(to, from, _next, params, components);
                } else if (routerMiddlewares[middleware]) {
                    routerMiddlewares[middleware](to, from, _next, params, components);
                } else {
                    throw Error('Undefined middleware ' + middleware);
                }
            };

            _next();
        }

        router.beforeEach(async (to, from, next) => {
            let components = [];

            try {
                // get matched components and resolve them
                components = await resolveComponents(router.getMatchedComponents(to));
            } catch (error) {
                if (/^Loading( CSS)? chunk (\d)+ failed\./.test(error.message)) {
                    window.location.reload(true);
                    return;
                }
            }

            // no components found
            if (components.length === 0) {
                return next();
            }

            getPromise(beforeLoading)
                .then(() => {
                    callMiddlewares([
                        ...globalMiddlewares,
                        ...getMiddlewares(components)
                    ], to, from, next, components);
                });
        });
    }
}

export {
    Plugin as default,
    addMiddleware,
    addMiddlewares,
    addMiddlewaresContext,
    routerMiddlewares,
}