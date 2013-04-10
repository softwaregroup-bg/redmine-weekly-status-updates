define(
    ['jquery','underscore','backbone','project', 'issues'],
    function($, _, Backbone, Project, IssueCollection){
        var jQuery = $;
        var ProjectCollection = {
            "model":Backbone.Collection.extend({
                "model": Project.model,
                "url":function(args){
                    // updateProcessCounter('+');
                    return '/projects'
                },
                parse:function(data) {
                    var ownerProject;
                    if(data.append)
                        ownerProject = data.append;
                    var projects = [];
                    var parentList = {};
                    var bottomLevel = [];
                    var projectTree = [];
                    var getProjectTree = function(parentId) {
                        if(!parentId)
                            projects = data.response.projects;
                        else {
                            jQuery.each(data.response.projects, function(index, val) {//can be optimised
                                if(val.parent && (val.parent.id == parseInt(parentId))){
                                    projects.push(val);
                                    getProjectTree(val.id);
                                }
                            });
                        }
                    };
                    getProjectTree(ownerProject);
                    jQuery.each(projects, function(index, val) {
                        if(val.parent)
                            parentList[val.parent.id] = val.id;
                    });
                    jQuery.each(projects, function(index, val) {
                        if(!parentList[val.id])
                            bottomLevel.push(val);
                    });
                    // updateProcessCounter();
                    return bottomLevel;
                }
            }),
            "view":Backbone.View.extend({
                views:{},
                initialize : function() {
                    this.collection.bind('remove', this.removed, this);
                    this.collection.bind('reset', this.render, this);
                },
                render: function(params) {
                    var self = this;
                    jQuery.each(params.models, function(index, m) {
                        self.views[m.cid] = new Project.view({
                            model:m
                        }).render();
                        //add issues
                        var issueCollectionModel = new IssueCollection.model();
                        m.attributes.IssueCollection = issueCollectionModel;
                        var issueCollectionView = new IssueCollection.view({collection:issueCollectionModel, "htmlRoot":self.views[m.cid].$el.find('.issues')});
                        issueCollectionModel.setFetchParams({projectId:m.id});
                        issueCollectionModel.fetch();
                    });
                    return this;
                },
                added: function(m) {
                },
                removed: function(m) {
                    //need to be fixed, should be empty or something like it. remove is for "delete"
                    this.views[m.cid].remove();
                    delete this.views[m.cid];
                },
                destroy:function() {
                    var self = this;
                    jQuery.each(this.views, function(index, view) {
                        view.destroy();
                        delete self.views[view.model.cid];
                    });
                }
            })
        };
        return ProjectCollection;
    }
);