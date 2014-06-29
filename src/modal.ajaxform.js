define(['jquery', './core', './modal'], function ($, Maniple, Modal) {

    function btnSubmit(options) {
        return {
            id: 'submit',
            label: options.submitLabel,
            action: function (modal) {
                var btn = $(this);

                if (btn.hasClass(options.disabledClass)) {
                    return false;
                }

                modal.setStatus(options.submitStatus);

                setTimeout(function () {
                    modal.getContentElement().find('form').submit();
                }, 10);

                return false;
            },
            className: options.submitClass
        };
    }

    function btnCancel(options) {
        return {
            id: 'cancel',
            label: options.cancelLabel,
            action: 'close',
            className: options.cancelClass
        };
    }

    function submitForm(form, modal, options) {
        modal.getButton('submit').addClass(options.disabledClass);

        options.ajax.transport({
            type: options.method || form.attr('method') || 'post',
            url: options.url || form.attr('action'),
            data: form.serialize(),
            success: function (response) {
                modal.getButton('submit').removeClass(options.disabledClass);
                modal.setStatus('');

                if (typeof options.complete === 'function') {
                    options.complete(modal, response);
                }
            },
            error: function (response) {
                modal.getButton('submit').removeClass(options.disabledClass);

                // form validation failed
                if (response.status !== 'error') {
                    // load content once again
                    con = typeof response === 'string' ? response : (response.data || response.html);
                    setContent(modal, con, options);
                    modal.setStatus(response.message);
                } else {
                    modal.setStatus(response.message, 'error');
                }
            },
            complete: function () {
                // submit button cannot be undisabled here,
                // as complete handler may disable it, and we
                // want to honour this (i.e. submit button may be disabled
                // until certain form fields are not empty)
            }
        });
        return false;
    }

    function setContent(modal, content, options) {
        if (!(content instanceof $)) {
            content = $('<div/>').append(content).contents();
        }

        var form = content.find('form').andSelf().filter('form');

        // Avoid <input name="submit" /> in forms, which overwrites the
        // submit function of the form in IE and in Firefox 4 as well.
        form.find('[name=submit]').attr('name', '_submit');

        form.submit(function () {
            submitForm(form, modal, options);
            return false;
        });

        modal.setContent(content);

        var focused = false;
        var tryFocus = function () {
                try {
                    this.focus();
                    focused = true;
                    return false;
                } catch (e) {}
            };

        // focus first element
        form.find('[autofocus]').each(tryFocus);
        if (!focused) {
            form.find('input:visible, textarea:visible, select:visible').each(tryFocus);
        }

        // submit form on enter key, don't use keyup as it is not
        // suppressed in the autocomplete widget
        form.on('keydown', 'input', function (e) {
            if (e.keyCode === 13) {
                form.submit();
                return false;
            }
        });
    }

    function run(options) {
        var contentHandler;

        options = $.extend(true, {}, run.defaults, options);

        contentHandler = options.content;

        options.content = function (modal) {
            modal.addClass(options.loadingClass);
            modal.setButtons([btnCancel(options)]);

            options.ajax.transport({
                url: options.url,
                type: 'get',
                success: function (response) {
                    var content;

                    if (typeof contentHandler === 'function') {
                        content = contentHandler(modal, response);
                    } else {
                        // load content from response
                        if (typeof response === 'string') {
                            content = $(response);
                        } else {
                            content = $(response.data || response.html);
                        }
                    }

                    setContent(modal, content, options);

                    modal.removeClass(options.loadingClass);

                    modal.setButtons([btnSubmit(options), btnCancel(options)]);
                    modal.setStatus('');

                    if (typeof options.load === 'function') {
                        options.load(modal);
                    }
                },
                error: function (response) {
                    modal.removeClass(options.loadingClass);
                    modal.setButtons([btnCancel(options)]);
                    modal.setStatus(response.message, 'error');
                }
            });
        };

        return (new Modal(options)).open();
    }

    run.defaults = {
        submitLabel:   'Submit',
        submitClass:   'btn btn-primary',
        submitStatus:  'Sending form, please wait...',
        cancelLabel:   'Cancel',
        cancelClass:   'btn',
        loadingClass:  'loading',
        disabledClass: 'disabled',
        ajax: {
            transport: Maniple.ajax
        }
    };

    return run;
});
