define(['jquery'], function ($) {

/**
 * This is ajax response handler using a slightly modified JSend format.
 * For the original spec see: http://labs.omniti.com/labs/jsend.
 * @version 2013-12-20 / 2013-12-04
 */
var ajax = (function () {
    var STATUS_SUCCESS = 'success',
        STATUS_FAIL = 'fail',
        STATUS_ERROR = 'error';

    /**
     * @return {string}
     */
    function errorMessage(xhr, exception, error) { // {{{
        var msg;

        switch (true) {
            case (exception === 'timeout' || error === 'timeout'):
                msg = 'Timeout error';
                break;

            case xhr.status === 0:
                msg = 'Unable to connect to server';
                break;

            case xhr.status === 403:
                msg = 'Forbidden (403)';
                break;

            case xhr.status === 404:
                msg = 'Not Found (404)';
                break;

            case xhr.status === 500:
                msg = 'Internal Server Error (500)';
                break;

            case exception === 'parsererror':
                msg = 'Invalid JSON response from server';
                break;

            case exception === 'abort':
                msg = 'Ajax request aborted';
                break;

            case typeof error.message === 'string':
                msg = error.message;
                break;

            default:
                msg = 'Uncaught error: ' + xhr.responseText + ' (' + xhr.status + ')';
                break;
        }

        return msg;
    } // }}}

return function (options) { // {{{
    var successHandler = options.success,
        errorHandler = options.error,
        failHandler = options.fail,
        token = options.token,
        data = options.data || {};

    // add anti-CSRF token, do not overwrite token value already
    // present in data
    if (typeof token !== 'undefined') {
        if (typeof data === 'object') {
            data.token = data.token || token;
        } else {
            data = String(data);
            data = 'token=' + encodeURIComponent(token) + (data.length ? '&' + data : '');
        }
    }

    delete options.fail;

    options.success = function (response, textStatus, jqXHR) {
        response = response || {};
        switch (response.status) {
            case STATUS_SUCCESS:
                if ('function' === typeof successHandler) {
                    successHandler.call(this, response, textStatus, jqXHR);
                }
                break;

            case STATUS_FAIL:
                if ('function' === typeof failHandler) {
                    failHandler.call(this, response, textStatus, jqXHR);
                    break;
                }

                /* falls through */
            default:
                if ('function' === typeof errorHandler) {
                    errorHandler.call(this, response, textStatus, jqXHR);
                }
                break;
        }
    };

    options.error = function (jqXHR, textStatus, errorThrown) {
        var response, message;
        try {
            response = $.parseJSON(jqXHR.responseText);
        } catch (e) {}

        response = response || {
            status:  STATUS_ERROR,
            message: errorMessage(jqXHR, textStatus, errorThrown),
            data:    errorThrown
        };

        if ('function' === typeof errorHandler) {
            errorHandler.call(this, response, textStatus, jqXHR, errorThrown);
        }
    };

    options.type = options.type || 'post';
    options.data = data;
    options.dataType = 'json';

    return $.ajax(options);
};

})(); // }}}


    return {
        ajax: ajax
    };
});
