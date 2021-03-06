/// <reference path="../lib/angular/angular-1.0.d.ts" />

module dotjem.routing {
    interface IView {
        template?: ng.IPromise;
        controller?: any;
        version: number;
        locals?: any;
    }

    interface IViewMap {
        [name: string]: IView;
    }

    interface IViewTransaction extends IViewServiceBase {
        commit();
        cancel();
        completed: bool;

        prepUpdate(name: string, template?: any, controller?: any, sticky?: string): (locals?: any) => IViewServiceBase;
        prepCreate(name: string, template?: any, controller?: any): (locals?: any) => IViewServiceBase;
        pending(name?: string): any;
    }

    interface IViewServiceBase {
        clear(name?: string): IViewServiceBase;

        update(name: string, template?: any, controller?: any, locals?: any, sticky?: string): IViewServiceBase;
        update(name: string, args: { template?: any; controller?: any; locals?: any; sticky?: string; }): IViewServiceBase;

        create(name: string, template?: any, controller?: any, locals?: any): IViewServiceBase;
        create(name: string, args: { template?: any; controller?: any; locals?: any; }): IViewServiceBase;

        get (name: string): IView;
        get (): IViewMap;

        refresh(name?: string, data?: any): IViewServiceBase;
    }

    interface IViewService extends IViewServiceBase {
        beginUpdate(): IViewTransaction;
    }

    interface ITemplateService {
        get (template: string): ng.IPromise;
        get (template: (...args: any[]) => any): ng.IPromise;
        get (template: { url: string; fn: (...args: any[]) => any; html: string; }): ng.IPromise;
    }

    interface IRoute {
        state?: string;
        action?: (...args: any[]) => any;
        redirectTo?: any;
        reloadOnSearch: bool;
    }

    interface IRouteProvider {
        when(path: string, route: any): IWhenRouteProvider;
        when(path: string, route: IRoute): IWhenRouteProvider;

        convert(name: string, converter: (...args: any[]) => any): IRouteProvider;

        decorate(name: string, decorator: (...args: any[]) => any): IRouteProvider;
        decorate(name: string, decorator: any[]): IRouteProvider;

        otherwise(redirectPath: string): IRouteProvider;

        ignoreCase(): IRouteProvider;
        matchCase(): IRouteProvider;
    }

    interface IWhenRouteProvider extends IRouteProvider {
        $route: { path: string; params: any; name: string; };
    }
    
    interface IRouteService {
        reload: () => void;
        change: (args: { route: string; params?: any; replace?: bool; }) => void;
        format: (route: string, params?: any) => string;
        current?: any;
    }

    interface IState {
        children?: any;
        route?: string;
        reloadOnSearch?: bool;

        onEnter?: any;
        onExit?: any;

        views?: any;
        scrollTo?: any;
        resolve?: any;
    }

    interface IRegisteredState extends IState {
        $fullname: string;
    }

    interface ITransition {
        before?: (...args: any[]) => any;
        between?: (...args: any[]) => any;
        after?: (...args: any[]) => any;
    }

    interface ITransitionHandler {
        (...args: any[]): any;
    }

    interface IStateProvider extends ITransitionProviderBase {
        state(name: string, state: any): IStateProvider;
    }

    interface IStateService {
        root: any;
        transition: any;
        reload: (state?) => void;
        current?: any;
        params?: any;
        lookup(path: string): any;
        goto(state: string, params?: any);
        goto(state: any, params?: any);
        url(state?: string, params?: any);
        url(state?: any, params?: any);
        is(state?: string);
        is(state?: any);
        isActive(state?: string);
        isActive(state?: any);
    }

    interface ITransitionService {        root: any;        find: (from: any, to: any) => any;    }

    interface ITransitionProvider extends ITransitionProviderBase {
        onEnter(state: string, handler: ITransitionHandler);
        onEnter(state: string, handler: ITransition);
        onEnter(state: string, handler: any);

        onEnter(state: any, handler: ITransitionHandler);
        onEnter(state: any, handler: ITransition);
        onEnter(state: any, handler: any);

        onExit(state: string, handler: ITransitionHandler);
        onExit(state: string, handler: ITransition);
        onExit(state: string, handler: any);

        onExit(state: any, handler: ITransitionHandler);
        onExit(state: any, handler: ITransition);
        onExit(state: any, handler: any);
    }

    interface ITransitionProviderBase {
        transition(from: string, to: string, handler: ITransitionHandler): IStateProvider;
        transition(from: string, to: string, handler: ITransition): IStateProvider;
        transition(from: string, to: string, handler: any): IStateProvider;

        transition(from: string[], to: string[], handler: ITransitionHandler): IStateProvider;
        transition(from: string[], to: string[], handler: ITransition): IStateProvider;
        transition(from: string[], to: string[], handler: any): IStateProvider;

        transition(from: string, to: string[], handler: ITransitionHandler): IStateProvider;
        transition(from: string, to: string[], handler: ITransition): IStateProvider;
        transition(from: string, to: string[], handler: any): IStateProvider;

        transition(from: string[], to: string, handler: ITransitionHandler): IStateProvider;
        transition(from: string[], to: string, handler: ITransition): IStateProvider;
        transition(from: string[], to: string, handler: any): IStateProvider;

        transition(from: any, to: any, handler: ITransitionHandler): IStateProvider;
        transition(from: any, to: any, handler: ITransition): IStateProvider;
        transition(from: any, to: any, handler: any): IStateProvider;    }
}