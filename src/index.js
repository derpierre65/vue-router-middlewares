const routerMiddlewares = [];

function resolveComponents(components) {
    return Promise.all(components.map(component => {
        return typeof component === 'function' ? component() : component;
    }));
}

function getMiddlewares(components) {
    const middlewares = [];

    components
        .filter(component => component.middleware)
        .forEach(component => {
            if (Array.isArray(component.middleware)) {
                middlewares.push(...component.middleware);
            } else {
                middlewares.push(component.middleware);
            }
        });

    return middlewares;
}

function callMiddlewares(middlewares, to, from, next) {
    const _next = (...args) => {
        // stop if "_next" was called with an argument or the stack is empty
        if (args.length > 0 || middlewares.length === 0) {
            // TODO add onLoadingFinished

            return next(...args);
        }

        const {middleware, params} = parseMiddleware(middlewares.shift());

        if (typeof middleware === 'function') {
            middleware(to, from, _next, params);
        } else if (routeMiddlewares[middleware]) {
            routeMiddlewares[middleware](to, from, _next, params);
        } else {
            throw Error('Undefined middleware ' + middleware);
        }
    };

    _next();
}

function resolveMiddlewares(requireContext) {
    return requireContext
        .keys()
        .map(file =>
            [file.replace(/(^.\/)|(\.js$)/g, ''), requireContext(file)],
        )
        .reduce((guards, [name, guard]) => {
            return {...guards, [name]: guard.default};
        }, {});
}

function install(Vue, config) {
    const router = config.router;
    const globalMiddlewares = config.globalMiddlewares || [];
    const onLoading = config.onLoading ||null;

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

        if (components.length === 0) {
            return next();
        }

        let loading = Promise.resolve();
        if (typeof onLoading === 'function') {
            let loader = onLoading();
            if (loader instanceof Promise) {
                loading = loader;
            }
        }

        loading
            .then(() => {
                callMiddlewares([
                    ...globalMiddlewares,
                    getMiddlewares(components)
                ], to, from, next);
            })
            .catch(() => {
                next(false);
            });
    });
}

function addMiddlewares(middlewares) {
    if (Array.isArray(middlewares)) {
        routerMiddlewares.push(...middlewares);
    } else {
        routerMiddlewares.push(middlewares);
    }
}

const Plugin = {install};

export {
    install,
    addMiddlewares,
    resolveMiddlewares,
    Plugin as default,
}