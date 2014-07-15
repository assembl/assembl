var requirejs_config = {
  baseUrl: "/static/js/",
  urlArgs: urlArgs,
  waitSeconds: 20,
  packages: [
    'text',{
      name:'text',
      location:'lib/',
      main:'text'
    }
  ],
  paths: {
    'router': 'app/router',
    'views':'app/views',
    'models':'app/models',
    'utils': 'app/utils',
    'modules': 'app/modules',

    'jquery': "bower/jquery/jquery",
    'tipsy': 'bower/tipsy/src/javascripts/jquery.tipsy',
    'jquery-highlight': 'lib/jquery-highlight/jquery.highlight',

    'backbone': 'bower/backbone/backbone',
    'underscore': 'bower/underscore/underscore-min',

    'annotator': 'lib/annotator/annotator-full.min',

    'jasmine': 'bower/jasmine/lib/jasmine-core/jasmine',
    'jasmine-html': 'bower/jasmine/lib/jasmine-core/jasmine-html',
    'jasmine-boot': 'bower/jasmine/lib/jasmine-core/boot',

    'ckeditor': 'bower/ckeditor/ckeditor',
    'ckeditor-sharedspace': 'lib/ckeditor-sharedcontainer/plugin',

    'moment': 'bower/momentjs/moment',
    'moment_lang': 'bower/momentjs/lang/'+((assembl_locale=='en')?'fr':assembl_locale),
    'zeroclipboard': 'bower/zeroclipboard/ZeroClipboard',
    'sockjs': 'bower/sockjs/sockjs',
    'cytoscape': 'bower/cytoscape/cytoscape',
    'jit': 'bower/jit/Jit/jit',
    'sprintf': 'bower/sprintf/src/sprintf',
    'backboneModal':'lib/backbone-modal/backbone.modal',
    'marionette':'bower/marionette/lib/backbone.marionette.min'

  },
  shim: {
    backbone: {
        deps: ['underscore', 'jquery'],
        exports: 'Backbone'
    },
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
    'modules/context': {
        deps: ['annotator', 'ckeditor', 'tipsy', 'utils/i18n', 'jquery-highlight'],
        exports: 'context'
    },
    'utils/i18n': {
        exports: 'i18n',
        init: function(i18n) {
            this.i18n(json);
            return this.i18n;
        }
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
    'ckeditor': {
        exports: 'CKEDITOR'
    },
    'ckeditor-sharedspace': {
        deps: ['ckeditor'],
        exports: 'CKEDITOR'
    },
    'tipsy': {
        deps: ['jquery']
    },
    'zeroclipboard' : {
        exports: 'ZeroClipboard'
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
        deps: [],
        exports: '$jit'
    },
    'annotator' : {
        deps: ['jquery'],
        exports: 'Annotator'
    },
    'sprintf' : {
        deps: [],
        exports: 'sprintf'
    },
    'moment_lang': {
        deps: ['moment'],
        exports: 'moment_lang'
    },
    'backboneModal': {
        deps:['backbone'],
        exports: 'BackboneModal'
    }
  }
};
