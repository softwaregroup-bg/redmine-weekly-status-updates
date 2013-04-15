function initPage(params){
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
            updateProcessCounter('+');
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
                    updateProcessCounter();
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

    var ProjectCollection = {
        "model":Backbone.Collection.extend({
            "model": Project.model,
            "url":function(args){
                updateProcessCounter('+');
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
                updateProcessCounter();
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
    //Project
    //issue/s
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

    var IssueCollection = {
        "model":Backbone.Collection.extend({
            "model": Issue.model,
            "setFetchParams":function(argument) {
                this.fetchParams = argument;
            },
            "url":function(){
                updateProcessCounter('+');
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
                updateProcessCounter();
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
if(isAutorised){
    initPage();
}