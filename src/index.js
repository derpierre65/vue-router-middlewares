import deepmerge from "deepmerge";

const routerMiddlewares = {};

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
        params,
    };
}

function addMiddleware(name, middleware) {
    routerMiddlewares[name] = middleware;
}

function addMiddlewares(middlewares) {
    if (typeof middlewares !== 'object' || middlewares === null) {
        return;
    }

    for (const key of Object.keys(middlewares)) {
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
            }, {}),
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
        async function callMiddlewares(middlewares, to, from, meta) {
            while (middlewares.length) {
                const {middleware, params} = parseMiddleware(middlewares.shift());

                let response = true;

                if (typeof middleware === 'function') {
                    response = await middleware(to, from, params, meta);
                } else if (routerMiddlewares[middleware]) {
                    response = await routerMiddlewares[middleware](to, from, params, meta);
                } else {
                    throw Error('Undefined middleware ' + middleware);
                }

                if (typeof response === 'boolean' || typeof response !== 'undefined') {
                    return response;
                }
            }

            return true;
        }

        router.beforeEach(async (to, from) => {
            const routeMiddlewares = [
                ...(globalMiddlewares || []),
            ];
            let meta = {};

            try {
                // get matched components and resolve them
                for (const matchedComponents of to.matched) {
                    routeMiddlewares.push(...(matchedComponents.meta.middleware || []));
                    meta = deepmerge(meta, matchedComponents.meta);
                }
            } catch (error) {
                if (/^Loading( CSS)? chunk (\d)+ failed\./.test(error.message)) {
                    window.location.reload();
                    return false;
                }
            }

            // no middlewares found
            if (routeMiddlewares.length === 0) {
                return true;
            }

            await getPromise(beforeLoading);
            const response = await callMiddlewares(routeMiddlewares.filter((value, index) => {
                if (typeof value === 'string') {
                    return routeMiddlewares.indexOf(value) === index;
                }

                return true;
            }), to, from, meta);
            await getPromise(afterLoading);

            return response;
        });
    },
};

export {
    Plugin as default,
    addMiddleware,
    addMiddlewares,
    addMiddlewaresContext,
    routerMiddlewares,
};