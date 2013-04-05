Test1::Application.routes.draw do
    root :to => "home#index"
    match '/login' => 'home#doLogin'
    match '/logout' => 'home#doLogout'
    match '/user' => 'home#user'
    match '/projects' => 'home#projects'
    match '/project/:id/issues' => 'home#projectIssues'
    match '/project/:id/issues/:iid' => 'home#projectIssuesUpdate', :via => :put
end
