'use strict';
function $ViewProvider() {
    this.$get = [
        '$rootScope', 
        '$q', 
        '$template', 
        function ($rootScope, $q, $template) {
            var views = {
            }, transaction = null;
            function ensureName(name) {
                if(name === 'undefined') {
                    throw new Error('Must define a view name.');
                }
            }
            ;
            function ensureExists(name) {
                if(!(name in views)) {
                    throw new Error('View with name "' + name + '" was not present.');
                }
            }
            ;
            function raiseUpdated(name) {
                $rootScope.$broadcast('$viewUpdate', name);
            }
            function containsView(map, name) {
                return (name in map) && map[name] !== null;
            }
            this.clear = function (name) {
                var _this = this;
                if(transaction) {
                    transaction.records[name] = (function () {
                        _this.clear(name);
                    });
                    return;
                }
                if(angular.isUndefined(name)) {
                    views = {
                    };
                } else {
                    views[name] = null;
                    raiseUpdated(name);
                }
            };
            this.setOrUpdate = function (name, template, controller) {
                var _this = this;
                ensureName(name);
                if(transaction) {
                    transaction.records[name] = (function () {
                        _this.setOrUpdate(name, template, controller);
                    });
                    return;
                }
                if(containsView(views, name)) {
                    views[name].template = $template.get(template);
                    views[name].controller = controller;
                    views[name].version++;
                } else {
                    views[name] = {
                        template: $template.get(template),
                        controller: controller,
                        version: 0
                    };
                }
                raiseUpdated(name);
            };
            this.setIfAbsent = function (name, template, controller) {
                var _this = this;
                ensureName(name);
                if(transaction) {
                    if(!containsView(transaction.records, name)) {
                        transaction.records[name] = (function () {
                            _this.setIfAbsent(name, template, controller);
                        });
                    }
                    return;
                }
                if(!containsView(views, name)) {
                    views[name] = {
                        template: $template.get(template),
                        controller: controller,
                        version: 0
                    };
                    raiseUpdated(name);
                }
            };
            this.get = function (name) {
                if(angular.isUndefined(name)) {
                    return views;
                }
                return views[name];
            };
            this.beginUpdate = function () {
                if(transaction) {
                    throw new Error("Can't start multiple transactions");
                }
                var trx = transaction = {
                    records: {
                    }
                };
                return {
                    commit: function () {
                        transaction = null;
                        angular.forEach(trx.records, function (fn) {
                            fn();
                        });
                    },
                    cancel: function () {
                        transaction = null;
                    }
                };
            };
            return this;
        }    ];
}
angular.module('ui.routing').provider('$view', $ViewProvider);