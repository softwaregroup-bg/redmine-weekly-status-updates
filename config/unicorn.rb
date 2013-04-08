# config/unicorn.rb
if ENV["RAILS_ENV"] == "development"
  worker_processes 1
else
  worker_processes 3 
  stderr_path "/opt/redmine-weekly-status-updates/log/unicorn.stderr.log"
  stdout_path "/opt/redmine-weekly-status-updates/log/unicorn.stdout.log"
end

timeout 30
