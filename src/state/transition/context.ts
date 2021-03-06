/// <reference path="../../refs.d.ts" />

class Context {
    private previous: any;

    private _$state: dotjem.routing.IStateService;

    get $state(): dotjem.routing.IStateService { return this._$state; }
    public get ended() { return this.aborted || this.completed; }

    public to: any;
    public from: any;
    public params: any;
    public emit: any;
    public changed: any;
    public toState: any;
    public transition: any;
    public transaction: dotjem.routing.IViewTransaction;
    public aborted: bool = false;
    public completed: bool = false;
    public onComplete: ICommand;

    constructor(_$state, onComplete: ICommand, current?) {
        this._$state = _$state;
        this.to = current;
        this.onComplete = onComplete;
    }

    public next(onComplete: ICommand) {
        if (!this.ended) {
            this.abort();
        } 

        var next = new Context(this.$state, onComplete);
        next.previous = this;
        next.from = this.to;

        //Note: to allow garbage collection.
        this.previous = null;

        return next;
    }

    public execute(visitor: ICommand) {
        if (!this.ended) {
            visitor(this);
            if (this.aborted) {
                return this.previous;
            }
        }
        return this;
    }
    
    public complete() {
        if (!this.ended) {
            this.onComplete(this);
            this.completed = true;
        }
        return this;
    }

    public abort() {
        if (!this.ended) {
            this.aborted = true;
            if (this.transaction && !this.transaction.completed)
                this.transaction.cancel();
        }
        return this;
    }

    private _prep: any = {};

    // change.state.fullname, name, view.template, view.controller, sticky, 'setOrUpdate'
    public prepUpdate(state: string, name, template, controller, sticky) {
        var prep = (this._prep[state] = this._prep[state] || {});
        prep[name] = this.transaction.prepUpdate(name, template, controller, sticky);
    }

    public prepCreate(state: string, name, template, controller) {
        var prep = (this._prep[state] = this._prep[state] || {});
        prep[name] = this.transaction.prepCreate(name, template, controller);
    }

    public completePrep(state: string, locals?: any) {
        forEach(this._prep[state], function (value, key) {
            value(locals);
        });
    }
}