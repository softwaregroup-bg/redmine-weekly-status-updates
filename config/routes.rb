Test1::Application.routes.draw do
    root :to => "home#index"
    match '/login' => 'home#doLogin'
    match '/logout' => 'home#doLogout'
    match '/user' => 'home#user'
    match '/projects' => 'home#projects'
    match '/issues' => 'home#issues', :via => :get
    match '/project/:id/issues' => 'home#projectIssues', :via => :get
    match '/project/:id/issues' => 'home#projectIssuesAdd', :via => :post
    match '/project/:id/issues/:iid' => 'home#projectIssuesUpdate', :via => :put
end
