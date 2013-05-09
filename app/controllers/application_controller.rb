require 'net/http'
require 'json'

class ApplicationController < ActionController::Base
    protect_from_forgery

    def reqRes(shortUrl, user, password, append, toRender)
        self.configuration
        if self.baseUrl == nil
            if toRender != nil
                render :json => "{'errorCode':100,'errorMessage':'init config missmatch','response':false}"
            end
        else
            uri = URI.parse(self.baseUrl + shortUrl)

            begin
                http = Net::HTTP.new(uri.host, uri.port)

                if self.communication == 'https'
                    http.use_ssl = true
                    http.verify_mode = OpenSSL::SSL::VERIFY_NONE
                end

                request = Net::HTTP::Get.new(uri.request_uri)
                request.basic_auth(user, password)
                response = http.request(request)

                if(response.code == '200')
                    self.username = user
                    self.password = password
                    if toRender != nil && toRender == 'render'
                        render :json => '{"url":"' + self.baseUrl + shortUrl + '","errorCode":"0","errorMessage":"OK","response":' + response.body + ',"append":"' + append + '"}', :content_type => "application/json"
                    elsif toRender != nil && toRender == 'norender'
                        '{"url":"' + self.baseUrl + shortUrl + '","errorCode":"0","errorMessage":"OK","response":' + response.body + ',"append":"' + append + '"}'
                    elsif toRender != nil && toRender == 'norenderclean'
                        response.body
                    else
                        response.body
                    end
                else
                    if toRender != nil && toRender == 'render'
                        render :json => '{"url":"' + self.baseUrl + shortUrl + '","errorCode":"1","httpErrorCode":' + response.code + ',"errorMessage":"Wrong User|Password","response":"false","append":"' + append + '"}', :content_type => "application/json"
                    elsif toRender != nil && toRender == 'norender'
                        '{"url":"' + self.baseUrl + shortUrl + '","errorCode":"1","httpErrorCode":' + response.code + ',"errorMessage":"Wrong User|Password","response":"false","append":"' + append + '"}'
                    elsif toRender != nil && toRender == 'norenderclean'
                        '{"url":"' + self.baseUrl + shortUrl + '","errorCode":"1","httpErrorCode":' + response.code + ',"errorMessage":"Wrong User|Password","response":"false","append":"' + append + '"}'
                    else
                        response.body
                    end
                end
            rescue Errno::ECONNREFUSED
                if toRender != nil
                    render :json => '{"url":"' + self.baseUrl + shortUrl + '","errorCode":"2","errorMessage":"Connection error","response":"false","append":"' + append + '"}', :content_type => "application/json"
                end
            end
        end
    end

    def resReq(shortUrl, method, data)
        self.configuration

        uri = URI.parse(self.baseUrl + shortUrl)
        http = Net::HTTP.new(uri.host, uri.port)
        headers = {
            'Content-Type' => "application/json",
            'Accept' => "application/json"
        }

        if self.communication == 'https'
            http.use_ssl = true
            http.verify_mode = OpenSSL::SSL::VERIFY_NONE
        end

        if method == 'post'
            request = Net::HTTP::Post.new(uri.request_uri,headers)
        elsif method == 'put'
            request = Net::HTTP::Put.new(uri.request_uri,headers)
        elsif method == 'delete'
            request = Net::HTTP::Delete.new(uri.request_uri,headers)
        end

        request.body = JSON.dump(data)
        request.basic_auth(self.username, self.password)
        response = http.request(request)

        # test purpose #curl --basic -i -H "Content-Type: application/json" -H "Accept: application/json" -X PUT -d '{"issue":{"subject":"ad", "description":"a2134"}}' http://zetxx:123123123@localhost:3000/issues/5.json


        print "\n--\n"
        puts response.code
        print "\n*\n"
        puts response.body
        print "\n--\n"
        
        render :json => '{"url":"' + self.baseUrl + shortUrl + '","errorCode":"0","errorMessage":"OK","response":' + response.body + '}', :content_type => "application/json"

    end

    def configuration
        if @configuration == nil
            @configuration = YAML.load_file("#{Rails.root}/config/config.yml")[Rails.env]
        end
        @configuration
    end

    def username
        session[:username]
    end
    def username=(username)
        session[:username] = username
    end
    def password
        session[:password]
    end
    def password=(password)
        session[:password] = password
    end
    def info
        session[:info]
    end
    def info=(info)
        session[:info] = info
    end
    def host
        @configuration["host"]
    end
    def tracker
        @configuration["tracker"]
    end
    def trackerId
        session[:trackerId]
    end
    def trackerId=(trackerId)
        session[:trackerId] = trackerId
    end

    def extraPath
        @configuration["extraPath"]
    end
    def extraPath=(extraPath)
        @extraPath = extraPath
    end
    def port
        @configuration["port"]
    end
    def port=(port)
        @port = port
    end
    def communication
        @configuration["communication"]
    end

    def baseUrl
        if (self.host == nil) || (self.port == nil) || (self.communication == nil)
            nil
        else
            self.communication + '://' + self.host + ':' + self.port + self.extraPath
        end
    end
end
