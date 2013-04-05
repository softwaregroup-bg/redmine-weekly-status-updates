function initPage(params){
    $('#app-pane').append('<div class="mpane"></div>');
    $('#app-pane').append('<div class="mpane-main"></div>');

    var page = Backbone.View.extend({
        el: $('#app-pane .mpane:last'),
        initialize: function(){
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
            login();
        }
    });
    
    //Project
    var Project = {
        "model":Backbone.Model.extend({
            "defaults":{
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
                alert('new issue window');
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

    var ProjectCollection = {
        "model":Backbone.Collection.extend({
            "model": Project.model,
            "url":function(args){
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
    //Project
    //issue/s
    var Issue = {
        "model":Backbone.Model.extend({
            "defaults":{
                "id":"",
                "subject":"",
                "description":""
            },
            update: function(up) {
                if(up.attributes){
                    if(up.attributes.description)
                        this.attributes.description = up.attributes.description;
                }
                this.save();
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
            },
            editIssueView:function(a,b,c) {
                alert('edit window');
            },
            deleteIssueView:function(a,b,c) {
                alert('delete window');
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

    var IssueCollection = {
        "model":Backbone.Collection.extend({
            "model": Issue.model,
            "fetchParams":{},
            "setFetchParams":function(argument) {
                this.fetchParams = argument;
            },
            "url":function(){
                return '/project/' + this.fetchParams.projectId + '/issues'
            },
            parse:function(data) {
                var test = [];
                jQuery.each(data.response.issues, function(index, val) {
                    test.push({
                        "id":val.id,
                        "subject":val.subject,
                        "description":val.description
                    });
                });
                // return data.response.issues;
                return test;
            }
        }),
        "view":Backbone.View.extend({
            views:{},
            "tagName":"ul",
            initialize : function() {
                this.collection.bind('reset', this.render, this);
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
            }
        })
    };
    
    jQuery.get('/user', {}, function(data, textStatus, xhr) {
        //create page
        var pageObject = new page(data);

        var pHistory = Backbone.Router.extend({
            routes: {
                "weeklyStatusUpdate": "weeklyStatusUpdate",
                "weeklyStatusUpdate/:id": "weeklyStatusUpdate",
            },
            weeklyStatusUpdate: function (query, page){//debugger;
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
if(isAutorised){
    initPage();
}