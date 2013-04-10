requirejs.config({
    "shim":{
        'backbone': {
            deps: ['underscore','jquery','bootstrap.min'],
            exports: 'Backbone'
        },
        'appInit':{
            deps: ['backbone']
        },
        'underscore':{
            deps: ['jquery'],
            exports: '_'
        }
    }
});

require([
    'redmineApp',
], function(RedmineApp){
    RedmineApp.initialize();
});