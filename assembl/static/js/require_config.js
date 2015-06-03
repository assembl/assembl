var requirejs_config = {
    urlArgs: urlArgs,
    waitSeconds: 20,
    paths: {
        'jquery': "../bower/jquery/jquery",
        'jquery-highlight': '../lib/jquery-highlight/jquery.highlight',
        'jquery.dotdotdot': '../bower/jquery.dotdotdot/src/js/jquery.dotdotdot',
        'jquery-autosize': '../bower/jquery-autosize/jquery.autosize',

        'backbone': '../bower/backbone/backbone',
        'backbone.subset': '../bower/Backbone.Subset/backbone.subset',
        'underscore': '../bower/underscore/underscore',
        'backbone.marionette.modals': '../bower/backbone-modal/backbone.marionette.modals',
        'backbone.modal': '../bower/backbone-modal/backbone.modal',
        'backbone.marionette': '../bower/marionette/lib/backbone.marionette',

        'annotator': '../lib/annotator/annotator-full',

        'jasmine': '../bower/jasmine/lib/jasmine-core/jasmine',
        'jasmine-html': '../bower/jasmine/lib/jasmine-core/jasmine-html',
        'jasmine-boot': '../bower/jasmine/lib/jasmine-core/boot',

        'chai':'../bower/chai/chai',
        'chai-jquery':'../bower/chai-jquery/chai-jquery',
        'mocha':'../bower/mocha/mocha',
        'fixtures': '../bower/fixtures/fixtures',

        'ckeditor': '../bower/ckeditor/ckeditor',
        'ckeditor-sharedspace': '../lib/ckeditor-sharedcontainer/plugin',

        'moment': '../bower/momentjs/min/moment-with-locales',
        'raven': '../bower/raven-js/dist/raven',
        'raven.backbone': '../bower/raven-js/plugins/backbone',
        'raven.console': '../bower/raven-js/plugins/console',
        'raven.require': '../bower/raven-js/plugins/require',
        'sockjs': '../bower/sockjs/sockjs',
        'cytoscape': '../bower/cytoscape/dist/cytoscape',
        'jit': '../bower/jit/Jit/jit',
        'jed': '../bower/jed/jed',
        'd3': '../bower/d3/d3',
        'bootstrap': '../lib/bootstrap',
        'dropdown': '../lib/dropdown',
        'jquery-linkify': '../bower/jQuery-linkify/dist/jquery.linkify.min',
        'jquery-oembed-all': '../bower/jquery-oembed-all/jquery.oembed',
        'jquery.bootstrap-growl':'../bower/bootstrap-growl/jquery.bootstrap-growl',

        'bluebird':'../bower/bluebird/js/browser/bluebird',
        'debug':'../bower/visionmedia-debug/dist/debug'
    },
    shim: {
        'underscore': {
            exports: '_'
        },
        'jquery': {
            exports: 'jQuery'
        },
        'jquery-highlight': {
            deps: ['jquery'],
            exports: 'jQuery'
        },
        'jquery.dotdotdot': {
            deps: ['jquery'],
            exports: 'jQuery'
        },
        'common/context': {
            deps: ['annotator', 'ckeditor', 'jquery-highlight', 'jquery.dotdotdot'],
            exports: 'context'
        },
        'utils/i18n': {
            deps: ['jed'],
            exports: 'i18n'
        },
        'socket': {
            deps: ['sockjs']
        },
        'jasmine': {
            exports: 'window.jasmineRequire'
        },
        'jasmine-html': {
            deps: ['jasmine'],
            exports: 'window.jasmineRequire'
        },
        'jasmine-boot': {
            deps: ['jasmine', 'jasmine-html'],
            exports: 'window.jasmineRequire'
        },
        'jasmine-jquery':{
            deps: ['jasmine'],
            exports: 'jasmine-jquery'
        },

        'ckeditor': {
            exports: 'CKEDITOR'
        },
        'ckeditor-sharedspace': {
            deps: ['ckeditor'],
            exports: 'CKEDITOR'
        },
        'sockjs': {
            deps: ['jquery'],
            exports: 'SockJS'
        },
        'cytoscape': {
            deps: ['jquery'],
            exports: 'cytoscape'
        },
        'jit': {
            exports: '$jit'
        },
        'annotator': {
            deps: ['jquery'],
            exports: 'Annotator'
        },
        'backbone.subset': {
            deps: ['backbone']
        },
        'bootstrap': {
            deps: ['jquery']
        },
        'raven.console': {
            deps: ['raven']
        },
        'raven.backbone': {
            deps: ['raven', 'backbone']
        },
        'raven.require': {
            deps: ['raven']
        },
        'jquery-autosize': {
            deps: ['jquery']
        },
        'dropdown': {
            deps: ['jquery']
        },
        'jquery-linkify': {
            deps: ['jquery']
        },
        'jquery-oembed-all': {
            deps: ['jquery']
        },
        'mocha': {
            init: function () {
                this.mocha.setup('bdd');
                return this.mocha;
            }
        },
        'jquery.bootstrap-growl':{
            deps: ['jquery']
        }
    }
};
