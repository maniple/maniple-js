define(['jquery'], function ($) {
    var EVENT_NS = '.maniple.modal';

    var wrapperElement,
        overlayElement,
        containerElement;

    var dialogStack = [];

    function _prepareElements()
    {
        var win = $(window);

        if (!overlayElement) {
            overlayElement = createDiv('dialog-overlay');

            // get target overlay opacity from stylesheet
            overlayElement.data('overlayOpacity', overlayElement.css('opacity'));
        }

        if (!containerElement) {
            containerElement = createDiv('dialog-container');
            containerElement.hide();
        }

        if (!wrapperElement) {
            wrapperElement = createDiv('dialog');
            wrapperElement.css('opacity', 0);
        }

        overlayElement.css({
            position: 'absolute', top: 0, right: 0, bottom: 0, left: 0
        });

        containerElement.css({
            position: 'relative',
            overflowX: 'auto',
            overflowY: 'scroll',
            height: '100%',
            paddingTop: 0,
            paddingBottom: 0
        });

        wrapperElement.css({
            position: 'fixed', top: 0, right: 0, bottom: 0, left: 0,
            zIndex: 999999999
        });

        wrapperElement.append(overlayElement);
        wrapperElement.append(containerElement);
        wrapperElement.appendTo('body');

        win.off('keyup' + EVENT_NS);
        win.on('keyup' + EVENT_NS, function (e) {
            if (e.keyCode === 27 && dialogStack.length) {
                dialogStack[dialogStack.length - 1].close();
            }
        });
    }

    function showOverlay(complete)
    {
        var doc = $(document),
            win = $(window);

        _prepareElements();

        win.off('resize' + EVENT_NS);
        win.on('resize' + EVENT_NS, function () {
            centerTopmostDialog();
        });

        if (wrapperElement.css('display') === 'none') {
            wrapperElement.css({display: 'block', opacity: 0});
        }

        wrapperElement.stop().animate({
            opacity: 1
        }, {
            complete: function () {
                containerElement.stop();
                containerElement.fadeIn({complete: complete});
            }
        });

        $('body').css({overflow: 'hidden', height: '100%'});
    }

    function hideOverlay(complete)
    {
        if (containerElement) {
            containerElement.hide();
        }
        if (wrapperElement) {
            wrapperElement.stop().animate({
                opacity: 0
            }, {
                complete: function () {
                    wrapperElement.hide();
                    wrapperElement.css('opacity', 1);
                    if (typeof complete === 'function') {
                        complete();
                    }
                }
            });
        }

        $('body').css({overflow: '', height: ''});
    }

    function centerize(el) {
        var win = $(window),
            winHeight = win.height(),
            top = (winHeight - el.outerHeight()) / 2;

        el.parent().scrollTop(0);

        el.each(function () {
            var style = this.style;

            style.margin = '0 auto';
            style.position = 'relative';
            style.left = 0;
            style.top = Math.max(top, 0) + 'px';
        });
    }

    function centerTopmostDialog()
    {
        if (!dialogStack.length) {
            return;
        }

        centerize(dialogStack[dialogStack.length - 1]._el);
    }

    function createDiv(cls)
    {
        return $('<div/>').addClass(Dialog.className(cls));
    }

    /**
     * @namespace
     * @constructor
     */
    function Dialog(options) {
        this.setOptions(Dialog.defaults, options);

        // setup markup
        this._el      = this._createDiv('modal').attr('data-role', 'modal');

        this._header  = this._createDiv('modal-header',  this._el);
        this._close   = this._createDiv('modal-close',   this._header).attr('data-action', 'close');
        this._title   = this._createDiv('modal-title',   this._header);

        this._body    = this._createDiv('modal-body',    this._el);

        this._footer  = this._createDiv('modal-footer',  this._el,     true);
        this._buttons = this._createDiv('modal-buttons', this._footer, true);
        this._status  = this._createDiv('modal-status',  this._footer, true);

        this._close.html(this._options.closeHtml);

        var self = this;

        // setup event handlers
        this._el.on('click', '[data-action="close"]', function (e) {
            self.close();
        });
    }

    Dialog.prototype.setOptions = function ()
    {
        this._options = $.extend.apply(
            null, 
            [true, {}].concat(Array.prototype.slice.apply(arguments))
        );
        return this;
    };

    Dialog.prototype._createDiv = function (cls, parent, hide) {
        var div = $('<div/>');

        div.addClass(this._options.classPrefix + String(cls));

        if (hide) {
            div.hide();
        }

        if (parent) {
            div.appendTo(parent);
        }

        return div;
    };

    Dialog.prototype.open = function (options) {
        var self = this;

        for (var i = 0; i < dialogStack.length; ++i) {
            if (dialogStack[i] === this) {
                throw new Error('This dialog is already opened');
            }
        }

        options = $.extend({}, this._options, options);

        dialogStack[dialogStack.length] = this;

        _prepareElements();

        containerElement.children().hide();

        ['title', 'content', 'status', 'buttons'].forEach(function (key) {
            var value = options[key];
            if (typeof value !== 'undefined') {
                self['set' + key.charAt(0).toUpperCase() + key.slice(1)](value);
            }
        });

        ['open', 'beforeClose', 'close'].forEach(function (key) {
            var value = options[key];

            self._el.unbind(key + EVENT_NS);

            if (typeof value === 'function') {
                // event handlers are called in dialog context
                self._el.bind(key + EVENT_NS, function () {
                    value.apply(self, arguments);
                });
            }
        });


        this._el.hide();
        this._el.appendTo(containerElement);

        function showElement() {
            containerElement.scrollTop(0);
            self._el.stop().fadeIn({
                step: function () {
                    centerize(self._el);
                },
                complete: function () {
                    self._trigger('open');
                }
            });
        }

        if (dialogStack.length === 1) {
            showOverlay();
        }

        showElement();

        return this;
    };

    Dialog.prototype.close = function () {
        var self = this;

        if (dialogStack[dialogStack.length - 1] !== this) {
            throw new Error('This dialog is not the topmost');
        }

        self._trigger('beforeClose');

        dialogStack.pop();

        if (dialogStack.length) {
            this._el.stop().fadeOut(function () {
                self._el.remove();
                self._trigger('close');
                dialogStack[dialogStack.length - 1]._el.fadeIn();
            });
        } else {
            hideOverlay();
            this._el.stop().fadeOut(function () {
                self._el.remove();
                self._trigger('close');
            });
        }

        return this;
    };

    Dialog.prototype.setTitle = function (title) {
        this._title.html(String(title));
        return this;
    };

    Dialog.prototype.getTitle = function () {
        return this._title.html();
    };

    Dialog.prototype.setContent = function (content) {
        switch (typeof content) {
            case 'function':
                // if given as a function content will be called in the
                // context of modal-body element, with this modal instance
                // set as first parameter
                content.call(this._body.get(0), this);
                break;

            default:
                this._body.empty().append(content);
                break;
        }

        // after updating content center dialog on screen
        centerize(this._el);

        return this;
    };

    Dialog.prototype.getContent = function () {
        return this._body.html();
    };

    Dialog.prototype.getContentElement = function () {
        return this._body;
    };

    Dialog.prototype.setStatus = function (message, type) {
        message = $.trim(message);
        this._status.html(message);

        if (message.length) {
            this._status.show();
            this._footer.show();
        } else {
            this._status.hide();
            if (this._buttons.is(':hidden')) {
                this._footer.hide();
            }
        }

        return this;
    };

    Dialog.prototype.getStatus = function () {
        return this._status.html();
    };

    Dialog.prototype.setButtons = function (buttons) {
        this._buttons.empty();

        // sort order
        var b = [],
            self = this;

        $.each(buttons, function (key, spec) {
            self.addButton(spec);
        });

        if (this._buttons.is(':empty')) {
            this._buttons.hide();
            if (this._status.is(':hidden')) {
                this._footer.hide();
            }
        } else {
            this._buttons.show();
            this._footer.show();
        }

        return this;
    };

    Dialog.prototype.addButton = function (spec) {
        var self = this,
            btn = $('<button type="button"/>');

        // setup button ID
        if (spec.id) {
            btn.attr('data-button-id', spec.id);
        }

        // setup label
        btn.html(String(spec.label));

        // setup action
        switch (typeof spec.action) {
            case 'function':
                btn.click(function (e) {
                    spec.action.call(this, self, e);
                });
                break;

            case 'string':
                btn.attr('data-action', spec.action);
                break;
        }

        // setup CSS class
        if (spec.className) {
            btn.addClass(spec.className);
        }

        btn.appendTo(this._buttons);

        this._buttons.show();
        this._footer.show();
    };

    Dialog.prototype.getButton = function (id) {
        var esc = String(id).replace(/"/g, '\\"');
        return this._buttons.find('[data-button-id="' + esc + '"]').first();
    };

    Dialog.prototype.addClass = function (className) {
        this._el.addClass(className);
        return this;
    };

    Dialog.prototype.removeClass = function (className) {
        this._el.removeClass(className);
        return this;
    };

    Dialog.prototype._trigger = function (event) {
        this._el.trigger(event + EVENT_NS, [this]);
    };

    Dialog.defaults = {
        classPrefix: 'maniple-',
        closeHtml:   '&times;'
    };

    Dialog.className = function (cls) {
        return Dialog.defaults.classPrefix + String(cls);
    };

    Dialog.open = function (options) {
        return (new Dialog(options)).open();
    };

    Dialog.topmost = function () {
        return dialogStack[dialogStack.length - 1];
    };

    Dialog.centerTopmostDialog = centerTopmostDialog;

    return Dialog;
});
