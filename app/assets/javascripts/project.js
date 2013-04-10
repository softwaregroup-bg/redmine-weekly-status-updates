define(
    ['jquery','underscore','backbone', 'issue'],
    function($, _, Backbone, Issue){
        var jQuery = $;
        var Project = {
            "model":Backbone.Model.extend({
                "defaults":{
                    "IssueCollection":null,
                    "created_on": "",
                    "description": "",
                    "id": "",
                    "identifier": "",
                    "name": "",
                    "updated_on": ""
                }
            }),
            "view":Backbone.View.extend({
                initialize: function(){
                    this.model.bind('change',this.updateView, this);
                },
                render: function() {
                    $('#app-pane .mpane-main:last').append(this.el);//append container to end of list of elements
                    this.$el.html(_.template($("#projects-heading").html(), {"name":this.model.attributes.name,"pid":this.model.attributes.id,"issues":'', "class_xtra":"project-body"}));
                    return this;
                },
                events:{
                    "click .new-issue":"newIssueView"
                },
                newIssueView:function() {
                    //new issue window
                    var newIssue = new Issue.model({"project_id":this.model.id});
                    this.model.attributes.IssueCollection.add(newIssue);
                },
                updateView:function () {
                    // model was changed, update the view
                },
                destroy: function() {
                    this.unbind();
                    this.remove();
                }
            })
        };
        return Project;
    }
);