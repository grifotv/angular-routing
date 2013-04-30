/// <reference path="../lib/angular/angular-1.0.d.ts" />

module ui.routing {
    interface IView {
        template: ng.IPromise;
        controller: any;
        version: number;
    }

    interface IViewMap {
        [name: string]: IView;
    }

    interface IViewTransaction {
        commit();
        cancel();
    }

    interface IViewService {
        clear(name?: string);
        setOrUpdate(viewname: string, template?: any, controller?: any);
        setIfAbsent(viewname: string, template?: any, controller?: any);
        get (viewname: string): IView;
        get (): IViewMap;

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
        current?: any;
    }

    interface IState {
        children?: any;
        route?: string;
        reloadOnSearch?: bool;

        onEnter?: any;
        onExit?: any;

        views?: any;
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
        print(): string;
    }

    interface IStateService {
        root: any;
        transition: any;
        reload: (state?) => void;
        current?: any;
        lookup(path: string): any;
        goto(state: string);
        goto(state: any);
    }

    interface ITransitionService {        root: any;        find: (from: any, to: any) => any;    }

    interface ITransitionProvider extends ITransitionProviderBase {
        onenter(state: string, handler: ITransitionHandler);
        onenter(state: string, handler: ITransition);
        onenter(state: string, handler: any);

        onenter(state: any, handler: ITransitionHandler);
        onenter(state: any, handler: ITransition);
        onenter(state: any, handler: any);

        onexit(state: string, handler: ITransitionHandler);
        onexit(state: string, handler: ITransition);
        onexit(state: string, handler: any);

        onexit(state: any, handler: ITransitionHandler);
        onexit(state: any, handler: ITransition);
        onexit(state: any, handler: any);
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