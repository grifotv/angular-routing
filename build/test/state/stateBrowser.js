/// <reference path="state.ts" />
var StateBrowser = (function () {
    function StateBrowser(root) {
        this.root = root;
        this.nameRegex = new RegExp('^\\w+(\\.\\w+)+$');
        this.siblingRegex = new RegExp('^\\$node\\(([-+]?\\d+)\\)$');
        this.indexRegex = new RegExp('^\\[(-?\\d+)\\]$');
    }
    StateBrowser.prototype.lookup = function (fullname, stop) {
        var current = this.root, names = fullname.split('.'), i = names[0] === 'root' ? 1 : 0, stop = isDefined(stop) ? stop : 0;
        for(; i < names.length - stop; i++) {
            if(!(names[i] in current.children)) {
                throw new Error("Could not locate '" + names[i] + "' under '" + current.fullname + "'.");
            }
            current = current.children[names[i]];
        }
        return current;
    };
    StateBrowser.prototype.resolve = function (origin, path) {
        var _this = this;
        var siblingSelector = this.siblingRegex.exec(path), nameSelector = // path.match(this.siblingRegex),
        this.nameRegex.test(path), selected = origin, sections;
        if(siblingSelector) {
            selected = this.selectSibling(Number(siblingSelector[1]), selected);
        } else if(this.nameRegex.test(path)) {
            //Note: This enables us to select a state using a full name rather than a select expression.
            //      but as a special case, the "nameRegex" will not match singular names as 'statename'
            //      because that is also a valid relative lookup.
            //
            //      instead we force the user to use '/statename' if he really wanted to look up a state
            //      from the root.
            selected = this.lookup(path);
        } else {
            sections = path.split('/');
            forEach(sections, function (sec) {
                selected = _this.select(origin, sec, selected);
            });
        }
        if(selected === this.root) {
            throw new Error("Path expression out of bounds.");
        }
        return selected && extend({
        }, selected.self) || undefined;
    };
    StateBrowser.prototype.selectSibling = function (index, selected) {
        var children = [], currentIndex;
        forEach(selected.parent.children, function (child) {
            children.push(child);
            if(selected.fullname === child.fullname) {
                currentIndex = children.length - 1;
            }
        });
        while(index < 0) {
            index += children.length;
        }
        index = (currentIndex + index) % children.length;
        return children[index];
    };
    StateBrowser.prototype.select = function (origin, exp, selected) {
        if(exp === '.') {
            if(origin !== selected) {
                throw new Error("Invalid path expression. Can only define '.' i the beginning of an expression.");
            }
            return selected;
        }
        if(exp === '..') {
            if(isUndefined(selected.parent)) {
                throw new Error("Path expression out of bounds.");
            }
            return selected.parent;
        }
        if(exp === '') {
            if(origin !== selected) {
                throw new Error("Invalid path expression.");
            }
            return this.root;
        }
        var match = this.indexRegex.exec(exp);// exp.match(this.indexRegex);
        
        if(match) {
            var index = Number(match[1]), children = [];
            forEach(selected.children, function (child) {
                children.push(child);
            });
            if(Math.abs(index) >= children.length) {
                throw new Error("Index out of bounds, index selecter must not exeed child count or negative childcount");
            }
            return index < 0 ? children[children.length + index] : children[index];
        }
        if(exp in selected.children) {
            return selected.children[exp];
        }
        throw new Error("Could find state for the lookup path.");
    };
    return StateBrowser;
})();