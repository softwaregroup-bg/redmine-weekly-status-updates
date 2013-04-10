define(
    ['jquery','underscore','backbone', 'issue'],
    function($, _, Backbone, Issue){
        var jQuery = $;
        var IssueCollection = {
            "model":Backbone.Collection.extend({
                "model": Issue.model,
                "setFetchParams":function(argument) {
                    this.fetchParams = argument;
                },
                "url":function(){
                    // updateProcessCounter('+');
                    return '/issues'
                    // return '/project/' + this.fetchParams.projectId + '/issues'
                },
                parse:function(data) {
                    var test = [],
                        self = this;
                    if(data.response.issues){
                        jQuery.each(data.response.issues, function(index, val) {
                            if((val.project.id == self.fetchParams.projectId) && (test.length < 2)){//if project id is the same as requested and total isses are < 2 per project
                                test.push({
                                    "id":val.id,
                                    "subject":val.subject,
                                    "project_id":val.project.id,
                                    "description":val.description
                                });
                            }
                        });
                    }
                    // updateProcessCounter();
                    return test;
                }
            }),
            "view":Backbone.View.extend({
                views:{},
                "tagName":"ul",
                initialize : function() {
                    this.collection.bind('reset', this.render, this);
                    this.collection.bind('add', this.added, this);
                },
                render: function(params) {
                    var self = this;
                    jQuery(this.options.htmlRoot).append(this.el);
                    jQuery.each(params.models, function(index, m) {
                        self.views[m.cid] = new Issue.view({
                            model:m,
                            htmlRoot:self.$el
                        }).render();
                    });
                    return this;
                },
                added:function(m) {
                    var self = this;
                    this.views[m.cid] = new Issue.view({
                        model:m,
                        htmlRoot:self.$el
                    }).render();
                }
            })
        };
        return IssueCollection;
    }
);