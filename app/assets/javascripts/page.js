define(
    ['jquery','underscore','backbone','login'],
    function($, _, Backbone, Login){
        var jQuery = $;
        debugger;
        var page = Backbone.View.extend({
            initialize: function(){
                this.setElement($('#app-pane .mpane:last').get(0));
                this.render();
            },
            render: function(){
                var self = this;
                var menu = _.template($("#menu-template").html(), {
                    "userinfo_big":this.options.response.user.firstname + ' ' + this.options.response.user.lastname,
                    "userinfo_small":this.options.response.user.mail
                });
                
                self.$el.html(menu);
                this.addAllProjects(self.$el.find('.project-selector'));
            },
            events: {
                "click #action-logout": "doLogout"
            },
            cleanMenuSelection:function() {
                this.$('.navbar .nav li.active').removeClass('active');
            },
            onEventWeeklyStatusUpdate:function(){
                this.cleanMenuSelection();
                this.$('.navbar .nav a[href="#weeklyStatusUpdate"]').parent().addClass('active');
            },
            doLogout:function (event) {
                var self = this;

                jQuery.get('/logout', {}, function(data, textStatus, xhr) {
                    self.destroy();
                });
            },
            onDestroy:function() {},
            addAllProjects:function(where) {
                // updateProcessCounter('+');
                jQuery.ajax({
                    url: '/projects',
                    type: 'GET',
                    dataType: 'json',
                    data: {},
                    success: function(data, textStatus, xhr) {
                        var projects = data.response.projects;
                        var parentList = {};
                        jQuery.each(projects, function(index, val) {
                            if(val.parent)
                                parentList[val.parent.id] = val.id;
                        });
                        jQuery.each(projects, function(index, val) {
                            if(parentList[val.id]){
                                var p = jQuery('<li><a href="#weeklyStatusUpdate/' + val.id + '">' + val.name + '</a></li>');
                                where.append(p);
                            }
                        });
                        // updateProcessCounter();
                    },
                    error: function(xhr, textStatus, errorThrown) {
                    }
                });
            },
            destroy:function (argument) {
                //destroy everything
                jQuery('.alert').remove();
                this.unbind();
                this.remove();
                this.onDestroy();
                Login.initialize();
            }
        });
        return page;
    }
);