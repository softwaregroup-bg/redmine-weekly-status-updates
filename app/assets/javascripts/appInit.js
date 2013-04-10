define(
    ['jquery','underscore','backbone','page','projects'],
    function($, _, Backbone, page, ProjectCollection){
        var jQuery = $;
        var initialize = function(){
            var proccessCounter = {"i":0,"o":0};

            function updateProcessCounter(direction) {
                if(jQuery('#messages-pane .progress_holder').length == 0){//create progress
                    jQuery('#messages-pane').append(_.template($("#progress-bar").html(), {}));
                }

                if(direction == '+'){
                    proccessCounter.i++;
                } else if(direction == '.') {
                    if(proccessCounter.i == (proccessCounter.o*-1)){
                        jQuery('#messages-pane .progress_holder').fadeTo(500,0.001,function() {
                            this.remove();
                            proccessCounter = {"i":0,"o":0};
                        });
                        return;//finish
                    }
                } else {
                    proccessCounter.o--;
                }
                var rtext = (proccessCounter.o*-1) + ' / ' + proccessCounter.i;
                var percentage = Math.round(((proccessCounter.o*-1)/proccessCounter.i)*100);

                jQuery('#messages-pane .progress_holder .progress .bar').css({"width":percentage + '%'});
                jQuery('#messages-pane .progress_holder strong').text(rtext);

                if(proccessCounter.i == (proccessCounter.o*-1)){
                    setTimeout(function() {
                        updateProcessCounter('.');
                    },1000);
                }
            }

            $('#app-pane').append('<div class="mpane"></div>');
            $('#app-pane').append('<div class="mpane-main"></div>');
            jQuery.get('/user', {}, function(data, textStatus, xhr) {
                //create page
                var pageObject = new page(data);

                var pHistory = Backbone.Router.extend({
                    routes: {
                        "weeklyStatusUpdate": "weeklyStatusUpdate",
                        "weeklyStatusUpdate/:id": "weeklyStatusUpdate",
                    },
                    weeklyStatusUpdate: function (query, page){
                        pageObject.onEventWeeklyStatusUpdate();
                        //add heading
                        $('#app-pane .mpane-main:last children').remove();
                        $('#app-pane .mpane-main:last').empty();
                        var projectCollection = new ProjectCollection.model();
                        var projectCollectionView = new ProjectCollection.view({collection:projectCollection});
                        pageObject.onDestroy = function() {
                            projectCollectionView.destroy();
                            jQuery('#app-pane .mpane-main').remove();
                        }
                        projectCollection.fetch({"data":{"ownerID":query}});
                    },
                    _404:function() {
                        alert('404? :)');
                    }
                });
                new pHistory();
                if(!Backbone.History.started)
                    Backbone.history.start();
            });
        };
        return {"initialize":initialize};
    }
);