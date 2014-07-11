define([], function () {
    var Viewtils = {
        version: '0.1.0'
    };

    Viewtils.esc = function (str) { // {{{
        // C.16. The Named Character Reference &apos;
        // The named character reference &apos; (the apostrophe, U+0027) was
        // introduced in XML 1.0 but does not appear in HTML. Authors should
        // therefore use &#39; instead of &apos; to work as expected in HTML
        // 4 user agents.
        // Source: http://www.w3.org/TR/xhtml1/#C_16
        return String(str)
            .replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;')
            .replace(/&(?!(\w+|\#\d+);)/g, '&amp;');
    }; // }}}

    /**
     * Escape special characters so that the input string can safely be used
     * within a regular expression.
     * @param {string} str
     * @return {string}
     */
    Viewtils.escrx = function (str) { // {{{
        return String(str).replace(/([.*+?^${}()|[\]\/\\])/g, '\\$1');
    }; // }}}

    /**
     * Generic string interpolation.
     * @param {object}   [options]
     * @param {function} [options.esc=Viewtils.esc]
     * @param {string}   [options.ldelim="\\{\\s*"]
     * @param {string}   [options.rdelim="\\s*\\}"]
     * @constructor
     * @version 2013-03-19
     */
    Viewtils.Interp = function (options) { // {{{
        var opt = options || {},
            esc = opt.esc || Viewtils.esc,
            ldelim = opt.ldelim || '\\{\\s*',
            rdelim = opt.rdelim || '\\s*\\}',
            rx = new RegExp(ldelim +'(\\w+)' + rdelim, 'g');

        this.interp = function (str, vars) {
            vars = vars || {};
            return String(str).replace(rx, function(match, key) {
                return esc ? esc(vars[key]) : vars[key];
            });
        };
    }; // }}}

    /**
     * Interpolate string using default interpolator.
     *
     * @param {string} str
     * @param {object} vars
     * @version 2013-03-02
     */
    Viewtils.interp = (function () { // {{{
        var interp = new Viewtils.Interp();
        return function (str, vars) {
            return interp.interp(str, vars);
        };
    })(); // }}}

    /**
     * Converts a string separated by dashes into a camelCase equivalent.
     * @param {string} str
     * @return {string}
     */
    Viewtils.camelize = (function () { // {{{
        function replace(match) {
            return match.substr(1).toUpperCase();
        }
        return function (str) {
            return String(str).replace(/(-[a-z])/g, replace);
        };
    })(); // }}}

    /**
     * Retrieve all the custom data attributes (data-*) set on the element.
     *
     * @param {Element|NodeList|jQuery} element
     * @return object
     * @version 2013-03-02
     */
    Viewtils.dataset = function (element) // {{{
    {
        var dataset = {},
            attrs, attr, name, i, n;

        // handle NodeList or jQuery
        if (typeof element.length === 'number') {
            element = element[0];
        }

        if (element && element.attributes) {
            attrs = element.attributes;
            for (i = 0, n = attrs.length; i < n; ++i) {
                attr = attrs[i];
                name = attr.nodeName;
                if (0 === name.indexOf('data-')) {
                    dataset[Viewtils.camelize(name.substr(5))] = attr.nodeValue;
                }
            }
        }

        return dataset;
    }; // }}}

    /**
     * Funkcja dokonujaca ekstrakcji uchwytow, czyli elementow posiadajacych
     * atrybut data-hook. Wartosc tego atrybutu jest konwertowana z notacji
     * myslnikowej do camel-case.
     * If an element has the attribute data-hooks-nodescend, function will
     * not descend into this element's subtree in search for hooks.
     *
     * @param {Element|NodeList|jQuery} element
     *     A document element, NodeList or jQuery object
     * @param {object|Array|string} [options]
     *     A set of key/value pairs that configure hook extraction. A string
     *     or an array is treated as a list of required hook names
     * @param {Array|string} [options.required]
     *     List of required hook names, each string can contain a list
     *     of hooks separated by dot, to force proper nesting of hooks
     * @param {function} [options.wrapper]
     *     Wrapper for extracted elements (typically jQuery or Zepto)
     * @param {boolean} [options.remove=false]
     *     Remove data-hook attributes after extraction
     * @return {object}
     * @version 2013-03-14
     */
    Viewtils.hooks = (function () { // {{{
        var camelize = Viewtils.camelize,
            requireHook = function (hooks, key) {
                if (!hooks[key]) {
                    throw new Error("Hook element '" + key + "' is not defined");
                }
            },
            requireAncestorHook = function (hooks, ancestorKey, key) {
                requireHook(hooks, key);
                requireHook(hooks, ancestorKey);

                var element = hooks[key].parentNode;

                while (element) {
                    if (element === hooks[ancestorKey]) {
                        return;
                    }
                    element = element.parentNode;
                }

                throw new Error("Hook '" + ancestorKey + "' is not an ancestor of hook '" + key + "'");
            },
            getElements = function (element) {
                var elements = [],
                    queue = [element];

                while (queue.length) {
                    var node = queue.shift();

                    if (node.nodeType != 1) {
                        continue;
                    }

                    // hasAttribute is not supported in IE7 Standards mode
                    if (null !== node.getAttributeNode('data-hook')) {
                        elements.push(node);
                    }

                    if (null !== node.getAttributeNode('data-hooks-nodescend')) {
                        continue;
                    }

                    if (node.hasChildNodes()) {
                        var children = node.childNodes;
                        for (var i = 0, n = children.length; i < n; ++i) {
                            var child = children[i];
                            if (child.nodeType == 1) {
                                queue.push(child);
                            }
                        }
                    }
                }

                return elements;
            };

        return function (elem, options) {
            var hooks = {}, elems, required;
            var i, j, n, key;

            // handle required hooks given as a string or an array
            if (typeof options === 'string' || options instanceof Array) {
                required = options;
                options = null;
            } else if (options) {
                required = options.required;
            }

            // convert string of required hook names to an array
            if (typeof required === 'string') {
                if (-1 === required.indexOf(' ')) {
                    required = required.split(/\s+/);
                } else {
                    required = [required];
                }
            }

            options = options || {};

            if (elem) {
                var remove = options.remove;

                // detect NodeList, jQuery, Zepto objects
                if (typeof elem === 'object' && 'length' in elem) {
                    elems = elem;
                } else {
                    elems = [elem];
                }

                // perform hook extraction on all input elements
                for (i = 0, n = elems.length; i < n; ++i) {
                    var nodes = getElements(elems[i], 'data-hook');

                    for (j = 0, m = nodes.length; j < m; ++j) {
                        var node = nodes[j];
                        // in IE7 attribute can be of any type
                        key = String(node.getAttribute('data-hook'));

                        if (!key.length) {
                            // empty data-hook attribute, use id attribute
                            key = node.getAttribute('id');
                        }

                        if (remove) {
                            // remove data-hook attribute
                            node.removeAttribute('data-hook');
                        }

                        key = camelize(key);
                        if (hooks.hasOwnProperty(key)) {
                            throw new Error("Hook '" + key + "' is already defined");
                        }

                        hooks[key] = node;
                    }
                }
            }

            // check if required hooks were extracted
            if (required) {
                for (i = 0, n = required.length; i < n; ++i) {
                    var keys = String(required[i]).split('.');

                    if (keys.length == 1) {
                        requireHook(hooks, keys[0]);
                    } else {
                        // check if this hook is properly nested with respect
                        // to ancestor hooks
                        for (j = keys.length - 1; j > 0; --j) {
                            requireAncestorHook(hooks, keys[j - 1], keys[j]);
                        }
                    }
                }
            }

            // wrap extracted hooks using wrapper function (jQuery or Zepto)
            if (typeof options.wrapper === 'function') {
                var wrapper = options.wrapper;
                for (key in hooks) {
                    if (hooks.hasOwnProperty(key)) {
                        hooks[key] = wrapper(hooks[key]);
                    }
                }
            }

            return hooks;
        };
    })(); // }}}

    /**
     * Human readable format of file size.
     * @param {int} bytes               number of bytes
     * @param {string} [dec=2]          number of decimal places
     * @param {string} [sep=' ']        separator between number and unit
     * @return {string}
     * @version 2012-12-23
     */
    Viewtils.fsize = function (bytes, dec, sep) { // {{{
        var idx = 0,
            rdx = 1024,
            pre = ['', 'K', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y'],
            end = pre.length - 1;

        dec = isFinite(dec) ? Math.max(0, Math.floor(dec)) : 2;
        sep = typeof sep === 'string' ? sep : ' ';

        while (bytes >= rdx) {
            bytes /= rdx;
            if (idx == end) break;
            ++idx;
        }

        var mag = Math.pow(10, dec),
            val = Math.round(mag * bytes) / mag;

        return val + sep + pre[idx] + 'B';
    }; // }}}

    Viewtils.attr = function (name, value) { // {{{
        return ' ' + Viewtils.esc(name) + '="' + Viewtils.esc(value) + '"';
    }; // }}}

    Viewtils.attrs = function (dict) { // {{{
        var str = '', attr = Viewtils.attr;
        for (var name in dict) {
            str += attr(name, dict[name]);
        }
        return str;
    }; // }}}

    return Viewtils;
});

// vim: et sw=4 fdm=marker
