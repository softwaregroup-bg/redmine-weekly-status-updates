define(
    ['jquery','underscore','backbone'],
    function($, _, Backbone){
        var jQuery = $;
        var Issue = {
            "model":Backbone.Model.extend({
                "defaults":{
                    "subject":(new Date()).toDateString(),
                    "description":"",
                    "project_id":0
                },
                update: function(up) {
                    if(up.attributes){
                        if(up.attributes.description)
                            this.attributes.description = up.attributes.description;
                    }
                    var callBack = {};
                    if(this.isNew()){
                        callBack = {"success":function(model, resp){
                            model.id = model.attributes.id = resp.response.issue.id;
                        }};
                    }
                    this.save({},callBack);
                }
            }),
            "view":Backbone.View.extend({
                tagName:'li',
                initialize: function(){
                    this.model.bind('change',this.updateView, this);
                },
                render: function() {
                    this.options.htmlRoot.append(this.el);
                    this.$el.html(_.template($("#issue-part").html(), {
                        "name":this.model.attributes.subject,
                        "id":this.model.id,
                        "description":this.model.attributes.description
                    }));
                    return this;
                },
                events:{
                    "click .icon-edit":"editIssueView",
                    "click .icon-trash":"deleteIssueView",
                    "click .btn":"updateModel",
                },
                updateModel:function(a,b,c) {
                    this.model.update({"attributes":{"description":this.$('textarea').get(0).value}});
                    updateProcessCounter();
                },
                editIssueView:function(a,b,c) {
                    alert('edit window');
                },
                deleteIssueView:function(a,b,c) {
                    alert('delete window');
                },
                updateView:function () {
                    // model was changed, update the view
                    var _id = this.model.attributes.response.issue.id;
                    this.$el.find('a').attr('href',this.$el.find('a').attr('href').replace('undefined',_id));
                },
                destroy: function() {
                    this.unbind();
                    this.remove();
                }
            })
        };
        return Issue;
    }
);