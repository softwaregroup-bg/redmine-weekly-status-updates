define(
    ['jquery','underscore','backbone','login','appInit'],
    function($, _, Backbone, Login, AppInit){
        var jQuery = $;
        var initialize = function(){
            if(isAutorised){
                AppInit.initialize();
            }else{
                Login.initialize();
            }
        };
        return {"initialize":initialize};
    }
);