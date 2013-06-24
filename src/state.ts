/// <reference path="../lib/angular/angular-1.0.d.ts" />
/// <reference path="common.ts" />
/// <reference path="interfaces.d.ts" />

/// <reference path="state/stateWrapper.ts" />
/// <reference path="state/stateFactory.ts" />
/// <reference path="state/stateHelper.ts" />



'use strict';
var $StateProvider = [<any>'$routeProvider', '$stateTransitionProvider', function ($routeProvider: ui.routing.IRouteProvider, $transitionProvider) {

    //TODO: Here we should just need to resolve a StateFactoryProvider allthough that name
    //      becomes quite crappy... not to mention that it ends up as a service provider that doesn't provide
    //      any services.
    ui.routing.StateFactory.Initialize($routeProvider, $transitionProvider);
    var root = ui.routing.StateFactory.instance.createState('root', {});
    var browser = new ui.routing.StateBrowser(root);

    function lookupState(fullname: string): any {
        return root.lookup(fullname);
    }

    function lookupParent(fullname: string) {
        return root.lookup(fullname, 1);
    }

    this.state = function (fullname: string, state: ui.routing.IState) {
        ui.routing.StateRules.validateName(fullname);

        var parent = root.lookup(fullname, 1);
        parent.add(ui.routing.StateFactory.instance.createState(fullname, state, parent));
        return this;
    };

    this.$get = [<any>'$rootScope', '$q', '$injector', '$route', '$view', '$stateTransition', '$location','$scroll',
    function (
        $rootScope: ng.IRootScopeService,
        $q: ng.IQService,
        $injector: ng.auto.IInjectorService,
        $route: ui.routing.IRouteService,
        $view: ui.routing.IViewService,
        $transition: ui.routing.ITransitionService,
        $location: ng.ILocationService,
        $scroll) {

        var forceReload = null,
            current = root,
            currentParams = {},
            $state: any = {
                // NOTE: root should not be used in general, it is exposed for testing purposes.
                root: root,
                current: extend({}, root.self),
                goto: (state, params) => { goto({ state: state, params: { all: params }, updateroute: true }); },
                lookup: (path) => browser.resolve(current, path),
                reload: reload,
                url: buildUrl
            };

        $rootScope.$on('$routeChangeSuccess', function () {
            var route = $route.current,
                params;
            if (route) {
                params = {
                    all: route.params,
                    path: route.pathParams,
                    search: route.searchParams
                };

                if (route.state) {
                    goto({ state: route.state, params: params, route: route });
                }
            } else {
                goto({ state: root });
            }
        });
        $rootScope.$on('$routeUpdate', () => {
            var route = $route.current;
            raiseUpdate(route.params, route.pathParams, route.searchParams);
        });
        return $state;

        function buildUrl(state?, params?) {
            var c = $state.current;

            state = isDefined(state) ? lookupState(toName(state)) : current;
            if (!state.route)
                throw new Error("Can't build url for a state that doesn't have a url defined.");
            //TODO: Find parent with route and return?

            //TODO: This is very similar to what we do in buildStateArray -> extractParams,
            //      maybe we can refactor those together
            var paramsObj = {}, allFrom = (c && c.$params && c.$params.all) || {};
            forEach(state.route.params, (param, name) => {
                if (name in allFrom)
                    paramsObj[name] = allFrom[name];
            });

            return $route.format(state.route.route, extend(paramsObj, params || {}));
        }

        function reload(state?) {
            if (isDefined(state)) {
                if (isString(state) || isObject(state)) {
                    forceReload = toName(state);
                    //TODO: We need some name normalization OR a set of "compare" etc methods that can ignore root.
                    if (forceReload.indexOf('root') !== 0) {
                        forceReload = 'root.' + forceReload;
                    }
                } else if (state) {
                    forceReload = root.fullname;
                }
            } else {
                forceReload = current.fullname;
            }

            $rootScope.$evalAsync(() => {
                goto({ state: current, params: currentParams, route: $route.current });
            });
        }

        function buildStateArray(state, params) {
            function extractParams() {
                var paramsObj = {};
                if (current.route) {
                    forEach(current.route.params, (param, name) => {
                        paramsObj[name] = params[name];
                    });
                }
                return paramsObj;
            }

            var states = [],
                current = state;
            do {
                states.push({ state: current, params: extractParams() });
            } while (current = current.parent)
            return states;
        }

        function buildChangeArray(from, to, fromParams, toParams) {
            var fromArray = buildStateArray(from, fromParams || {}),
                toArray = buildStateArray(to, toParams),
                count = Math.max(fromArray.length, toArray.length),
                fromAtIndex,
                toAtIndex,
                c, stateChanges = false, paramChanges = !equals(fromParams, toParams);

            for (var i = 0; i < count; i++) {
                fromAtIndex = fromArray[fromArray.length - i - 1];
                toAtIndex = toArray[toArray.length - i - 1];

                if (isUndefined(toAtIndex)) {
                    toArray[0].isChanged = stateChanges = true;
                } else if (isUndefined(fromAtIndex)
                        || (forceReload && forceReload == toAtIndex.state.fullname)
                        || toAtIndex.state.fullname !== fromAtIndex.state.fullname
                        || !equals(toAtIndex.params, fromAtIndex.params)) {
                    toAtIndex.isChanged = stateChanges = true;
                } else {
                    toAtIndex.isChanged = false;
                }
            }
            //TODO: if ReloadOnOptional is false, but parameters are changed.
            //      we should raise the update event instead.
            stateChanges = stateChanges || (toArray[0].state.reloadOnOptional && paramChanges);
            return {
                array: toArray.reverse(),
                stateChanges: stateChanges,
                paramChanges: paramChanges
            };
        }

        function raiseUpdate(all, path, search) {
            var dst = $state.current.$params;
            dst.all = all;
            dst.path = path;
            dst.search = search;
            $rootScope.$broadcast('$stateUpdate', $state.current);
        }

        function goto(args: { state; params?; route?; updateroute?; }) {

            //TODO: This list of declarations seems to indicate that we are doing more that we should in a single function.
            //      should try to refactor it if possible.
            var params = args.params,
                route = args.route,
                to = lookupState(toName(args.state)),
                toState = extend({}, to.self, { $params: params, $route: route }),
                fromState = $state.current,
                emit = $transition.find($state.current, toState),

                cancel = false,
                transaction,
                scrollTo,
                changed = buildChangeArray(
                    lookupState(toName($state.current)),
                    to,
                    fromState.$params && fromState.$params.all,
                    params && params.all || {}),

                transition = {
                    cancel: function () {
                        cancel = true;
                    },
                    goto: (state, params?) => {
                        cancel = true;
                        goto({ state: state, params: { all: params }, updateroute: true });
                    }
                };

            if (!forceReload && !changed.stateChanges) {
                if (changed.paramChanges) {
                    raiseUpdate(params.all || {}, params.path || {}, params.search || {})
                }
                return;
            }

            forceReload = null;

            if (args.updateroute && to.route) {
                //TODO: This is very similar to what we do in buildStateArray -> extractParams,
                //      maybe we can refactor those together
                var paramsObj = {}, allFrom = (fromState.$params && fromState.$params.all) || {};
                forEach(to.route.params, (param, name) => {
                    if (name in allFrom) paramsObj[name] = allFrom[name];
                });

                var mergedParams = extend(paramsObj, (params && params.all))
                $route.change(extend({}, to.route, { params: mergedParams }));
                return;
            }

            emit.before(transition);
            if (cancel) {
                //TODO: Should we do more here?... What about the URL?... Should we reset that to the privous URL?...
                //      That is if this was even triggered by an URL change in the first place.
                return;
            }

            var event = $rootScope.$broadcast('$stateChangeStart', toState, fromState);
            if (!event.defaultPrevented) {
                $q.when(toState).then(() => {
                    var useUpdate = false,
                        locals = {},
                        promises = [];

                    transaction = $view.beginUpdate();
                    $view.clear();

                    function resolve(args) {
                        var values = [],
                            keys = [];
                        angular.forEach(args || {}, function (value, key) {
                            keys.push(key);
                            values.push(angular.isString(value) ? $injector.get(value) : $injector.invoke(value));
                        });

                        var def = $q.defer();
                        $q.all(values).then(function (values) {
                            angular.forEach(values, function (value, index) {
                                locals[keys[index]] = value;
                            });
                            def.resolve(locals);
                        });
                        return def.promise;
                    }

                    var promise = $q.when(0);
                    forEach(changed.array, (change, index) => {
                        promise = promise.then(function () {
                            return resolve(change.state.self.resolve);
                        }).then(function (locals) {
                            if (change.isChanged)
                                useUpdate = true;

                            scrollTo = change.state.self.scrollTo;
                            forEach(change.state.self.views, (view, name) => {
                                var sticky;
                                if (view.sticky) {
                                    sticky = view.sticky;
                                    if (isFunction(sticky) || isArray(sticky)) {
                                        sticky = $injector.invoke(sticky, sticky, { $to: toState, $from: fromState });
                                    } else if (!isString(sticky)) {
                                        sticky = change.state.fullname;
                                    }
                                }

                                if (useUpdate || isDefined(sticky)) {
                                    $view.setOrUpdate(name, view.template, view.controller, copy(locals), sticky);
                                } else {
                                    $view.setIfAbsent(name, view.template, view.controller, copy(locals));
                                }
                            });
                        });
                    });
                    return promise.then(function () => {
                        emit.between(transition);

                        if (cancel) {
                            transaction.cancel();
                            //TODO: Should we do more here?... What about the URL?... Should we reset that to the privous URL?...
                            //      That is if this was even triggered by an URL change in teh first place.
                            return;
                        }

                        current = to;
                        currentParams = params;
                        $state.current = toState;

                        transaction.commit();
                        $rootScope.$broadcast('$stateChangeSuccess', toState, fromState);
                    })
                }, (error) => {
                    transaction.cancel();
                    $rootScope.$broadcast('$stateChangeError', toState, fromState, error);
                }).then(() => {
                    if (!cancel) {
                        transition.cancel = function () {
                            throw Error("Can't cancel transition in after handler");
                        };
                        emit.after(transition);


                        $scroll(scrollTo);
                    }
                    //Note: nothing to do here.
                });
            }
        }
    }];
}];
angular.module('ui.routing').provider('$state', $StateProvider);