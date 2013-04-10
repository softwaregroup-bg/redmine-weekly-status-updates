requirejs.config({
    "shim":{
        'backbone': {
            deps: ['underscore', 'jquery'],
            exports: 'Backbone'
        }
    }
});

require([
    'redmineApp',
], function(RedmineApp){
    RedmineApp.initialize();
});