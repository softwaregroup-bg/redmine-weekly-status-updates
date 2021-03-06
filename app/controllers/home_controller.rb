class HomeController < ApplicationController
    def index
        self.configuration

        if self.password == nil
            @authorised = false
        else
            @authorised = true
        end

        @redmine_base_url = self.baseUrl

        respond_to do |format|
            format.html
        end
    end
    def doLogin
        li_ = self.reqRes('/users/current.json',params[:username],params[:password],'', 'norender')
        parsed_json_li_ = ActiveSupport::JSON.decode(li_)
        if parsed_json_li_['errorCode'].to_i > 0
            render :json => li_, :content_type => "application/json"
        else
            if self.username
                json = self.reqRes('/trackers.json',self.username,self.password,'',nil)

                parsed_json = ActiveSupport::JSON.decode(json)
                hc = self

                parsed_json["trackers"].each do |hash|
                    if hash["name"] == self.tracker
                        hc.trackerId = hash["id"]
                    end
                end
                if !self.respond_to?('trackerId')
                    session.destroy()
                    render :json => '{"url":"","errorCode":"3","httpErrorCode":"","errorMessage":"missing tracker","response":"false","append":""}', :content_type => "application/json"
                else
                    render :json => li_, :content_type => "application/json"
                end
            end
        end
        
    end
    def user
        self.reqRes('/users/current.json',self.username,self.password,'', 'render')
    end
    def doLogout
        session.destroy()
        render :json => '{"errorCode":"0","errorMessage":"OK","response":"false"}', :content_type => "application/json"
    end

    def projects
        if params[:ownerID]
            self.allProjects(params[:ownerID])
        else
            self.allProjects('')
        end
    end

    def allProjects(ownerID)
        limit = 100
        offset = 0
        url_ = '/projects.json?limit=' + limit.to_s + '&offset='
        projects = ActiveSupport::JSON.decode(self.reqRes(url_ + offset.to_s,self.username,self.password, ownerID, 'norender'))
        if(projects['response']['total_count']>projects['response']['projects'].length)
            times_ = (projects['response']['total_count'].to_f/limit).ceil-1
            times_.times do |i|
                offset = ((i+1)*limit)
                tmp_ = self.reqRes(url_ + offset.to_s,self.username,self.password, ownerID, 'norenderclean')
                projects['response']['projects'].concat(ActiveSupport::JSON.decode(tmp_)['projects'])
            end
        end
        render :json => projects
    end

    def projectIssues
        print self.trackerId
        self.reqRes('/issues.json?offset=0&include=journals&limit=2&sort=created_on:desc&tracker_id=' + self.trackerId.to_s + '&project_id=' + params[:id],self.username,self.password,'', 'render')
    end

    def issuesUpdate
        updateParams = {}
        updateParams['issue'] = params['home']
        print "\n--\n"
        puts updateParams
        print "\n--\n"

        self.resReq('/issues/' + params['home']['id'].to_s + '.json','put',updateParams)
    end

    def issueAdd
        addParams = {}
        addParams['issue'] = params['home']
	addParams['issue']['tracker_id'] = self.trackerId
        print "\n--\n"
        puts addParams
        print "\n--\n"
        self.resReq('/issues.json','post',addParams)
    end

    def projectIssuesAdd
        params["home"]["id"] = params["home"]["iid"]
        paramsNew = {}
        
        params["home"].each do |x,v|
            if x != 'iid' and x != 'id'
                paramsNew[x] = v
            end
        end

        issueParam = {}

        issueParam['issue'] = paramsNew
        issueParam['issue']['tracker_id'] = self.trackerId
        print "\n--\n"
        puts issueParam
        print "\n--\n"
        
        self.resReq('/issues.json','post',issueParam)
    end

    def issues
        self.reqRes('/issues.json?include=journals&sort=created_on:desc&tracker_id=' + self.trackerId.to_s,self.username,self.password, '', 'render')
    end

    def projectMembership
        self.reqRes(URI.encode('/projects/' + params[:name] + '/memberships.json'),self.username,self.password,'', 'render')
    end

    def tmpout
        render :json => '{"errorCode":"1","errorMessage":"OK","response":1}', :content_type => "application/json"
    end

end
