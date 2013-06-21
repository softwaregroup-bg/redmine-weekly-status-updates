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
                    var indexesProjectList = data.response.projects,
                    kvProjectList = {},
                    pe = {};

                    jQuery.each(indexesProjectList, function(index, val) {
                        if(val){
                            kvProjectList[val.id] = val;
                            kvProjectList[val.id]['i'] = index;
                        }
                    });

                    var pp = function(o, added) {
                        if(o.parent){//if project
                            if(!pe[o.parent.id]){
                                pe[o.parent.id] = o.parent.id;
                                var p = (jQuery('<div/>').html(_.template($("#project-menu-part").html(), o.parent))).children();

                                if(kvProjectList[o.parent.id].parent)
                                    p.attr('id',p.attr('id') + ' ' + kvProjectList[o.parent.id].parent.id);

                                where.append(p);
                                return pp(kvProjectList[o.parent.id],true);
                            }
                        }
                    };

                    jQuery.each(indexesProjectList, function(index, val) {
                        pp(val);
                    });

                    jQuery.each(where.find('.projects'), function(index, val) {
                        var v = jQuery(val);
                        var ids = v.attr('id').split(' ');
                        if(ids.length>1){
                            var parentIdEl = where.find('#rootid_' + ids[1]);
                            if(parentIdEl.find('ul').length == 0){
                                parentIdEl.append('<ul class="dropdown-menu"/>');
                                parentIdEl.addClass('dropdown-submenu');
                            }
                            v.attr('id',ids[0]);
                            var ne = jQuery('<div/>').append((jQuery('<div/>').append(v)).html()).children();
                            parentIdEl.find('ul').append(ne);
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
                var self = this;
                $('#app-pane .mpane-main:last').append(this.el);//append container to end of list of elements
                var pmm = new Project.membership.model({"project":{"name":this.model.get('name'),"identifier":this.model.get('identifier'),"id":this.model.get('id')}});
                pmm.fetch();
                this.$el.html(_.template($("#projects-heading").html(), {"name":this.model.attributes.name,"description":this.model.attributes.description,"pid":this.model.attributes.id,"issues":'', "class_xtra":"project-body"}));
                new Project.membership.view({
                    model:pmm,
                    htmlRoot:self.$('.mms-info')
                }).render();

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
        }),
        "membership":{
            "model":Backbone.Model.extend({
                "defaults":{},
                "url":function(){
                    return '/projects/' + this.get('project').identifier + '/memberships';
                },
                "parse":function(data,b,c) {
                    var memberships = [];
                    var model = this;
                    if(data.response && (typeof(data.response) == 'object')){
                        jQuery.each(data.response.memberships, function(index, val) {
                            if(model.get('project').id == val.project.id){
                                memberships.push({
                                    "user":val.user,
                                    "roles":val.roles,
                                    "group":val.group
                                });
                            }
                        });
                    } else {
                        //NOTE: some error loging
                    }
                    return {"memberships":memberships,"project":this.attributes.project};
                }
            }),
            "view":Backbone.View.extend({
                "initialize":function(){
                    this.model.bind('change', this.render, this);
                    this.render();
                },
                "render":function() {
                    if(this.model.get('memberships')){
                        if(this.model.get('memberships').length>0){
                            var users = [];
                            jQuery.each(this.model.get('memberships'), function(index, val) {
                                if(val.user)
                                    users.push(val.user.name);
                            });
                            this.$('.users').text('Users: ' + users.join(', '));
                        } else {
                            this.$('.users').remove();
                        }
                    } else {
                        this.setElement(this.options.htmlRoot);
                    }
                },
                destroy: function() {
                    this.unbind();
                    this.remove();
                }
            })
        }
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
                    if(up.attributes.subject)
                        this.attributes.subject = up.attributes.subject;
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
            render: function(args) {
                if(!args)
                    this.options.htmlRoot.append(this.el);
                else
                    this.options.htmlRoot.prepend(this.el);

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
            updateModel:function() {
                var values = {"attributes":{
                    "description":this.$('textarea').get(0).value,
                    "subject":this.$('input').get(0).value
                }};
                this.model.update(values);
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
                if(this.model.isNew() && (this.model.attributes.response) && (this.model.attributes.response.issue)){
                    var _id = this.model.attributes.response.issue.id;
                    this.$el.find('a').attr('href',this.$el.find('a').attr('href').replace('undefined',_id));
                    if(this.$el.parent().children().length>3)
                        this.$el.parent().children().last().remove();
                }
            },
            saved:function(){
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
                return '/issues';
            },
            parse:function(data) {
                var test = [],
                    self = this;
                if(data.response.issues){
                    jQuery.each(data.response.issues, function(index, val) {
                        if((val.project.id == self.fetchParams.projectId) && (test.length < 3)){//if project id is the same as requested and total isses are < 2 per project
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
                }).render('new');
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