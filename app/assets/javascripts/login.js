define(
    ['jquery','underscore','backbone','appInit'],
    function($, _, Backbone, AppInit){
        debugger;
        var jQuery = $;
        var initialize = function(){
            $('#login-pane').append('<div class="mpane"></div>');

            var loginView = Backbone.View.extend({
                el: $('#login-pane .mpane:last'),
                initialize: function() {
                    this.render();
                },
                render:function() {
                    var loginTemplate = _.template($("#login-template").html(), {});
                    this.$el.html(loginTemplate);
                },
                events: {
                    "click button": "doLogin"
                },
                doLogin: function(event) {
                    var inputs = this.$('input.required');
                    var params = {};
                    var self = this;
                    jQuery.each(inputs, function(index, val) {
                        jQuery(this).parent().removeClass('error');
                        if(!this.value || (this.value == '')){
                            jQuery(this).parent().addClass('error');
                        } else {
                            params[this.name] = this.value;
                        }
                    });
                    if(this.$('.error').length == 0) {
                        jQuery.ajax({
                            url: '/login',
                            type: 'POST',
                            dataType: 'json',
                            data: params,
                            complete: function(xhr, textStatus) {},
                            success: function(data, textStatus, xhr) {
                                if(data.errorCode > 0){
                                    var msg = (jQuery('<div/>').html(_.template($("#msgs-error").html(), {"message":data.errorMessage}))).find('.alert');
                                    jQuery('#messages-pane').append(msg);
                                    msg.fadeTo(10000, 0.001, function(){
                                        jQuery(this).remove();
                                    });
                                } else {
                                    self.destroy();
                                }
                            },
                            error: function(xhr, textStatus, errorThrown) {
                                //called when there is an error
                            }
                        });
                    }
                },
                destroy: function(hook){
                    jQuery('.alert').remove();
                    this.unbind();
                    this.remove();
                    AppInit.initialize();
                }
            });
            new loginView();
        };
        return {"initialize":initialize};
    }
);