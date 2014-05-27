/**
 * js i18n
 * Javascript library to apply internationalization.
 * @author André Farzat ( andrefarzat@gmail.com )
 */
(function (window) {
    "use strict";

    /**
     * Initializes the library
     * @param {object} dict The key-value dictionary
     */
    var i18n = function(dict) {
        if ( !dict ) {
            return;
        }

        if ( typeof dict !== 'object' ) {
            throw new Error('dict argument must be an object.');
        }

        if ( dict.length > 0 ) {
            throw new Error('dict argument cannot be an array.');
        }
        
        for ( var i in dict ){
            if ( dict.hasOwnProperty(i) ) {
                i18n._[i] = dict[i];
            }
        }

    };

    /**
     * @type {string}
     * The wildcard for the counter in pluralize function
     */
    i18n.wildcard = /%d/g;


    /**
     * Returns the translated text
     * @param {string} key The key for the text.
     * @return {string}
     */
    i18n.gettext = function(key) {
        return i18n._[key] || key;
    };

    /**
     * @alias i18n.gettext
     */
    i18n._ = i18n.gettext;

    /**
     * Depending on the number argument, it returns the right given text.
     * This function was based in angular's directive: http://docs.angularjs.org/api/ng.directive:ngPluralize
     *
     * @param {object} options A key-value object with the number and its respective text
     * @param {integer} [counter=0] The quantity to return the right text
     * @param {integer} [offset=0] The substraction in the counter
     * @return {string}
     */
    i18n.pluralize = function(options, counter, offset){
        if( counter == 'one' && options.one !== undefined ){
            return options.one;
        }

        counter = parseInt(counter, 10);
        offset = parseInt(offset, 10) || 0;
        if(isNaN(counter)){
            return options[0] || '';
        }

        counter -= offset;

        if(counter === 1 && offset > 0 ){
            return options['one'];
        }

        return (options[counter] !== undefined) ?
            options[counter].replace(i18n.wildcard, counter) :
            options.other ? options.other.replace(i18n.wildcard, counter) : '';
    };

    /*
    /** Creating the alias. First, do the check to avoid conflicts 
    if ( window._ === undefined ){
        window._ = i18n._;
    }

    if( window.pluralize === undefined ){
        window.pluralize = i18n.pluralize;
    }
    */
   
    /** Defining it as global */
    window.i18n = i18n;
    return window.i18n;

}(window));