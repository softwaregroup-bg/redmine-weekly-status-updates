#!/bin/bash

### BEGIN INIT INFO
# Required-Start: $all
# Required-Stop: $network $local_fs $syslog
# Default-Start: 2 3 4 5
# Default-Stop: 0 1 6
# Short-Description: Start the APPLICATION unicorns at boot
### END INIT INFO

set -u
set -e

# Change these to match your app:
APP_ROOT="/opt/redmine-weekly-status-updates"
PID="$APP_ROOT/tmp/pids/unicorn.pid"
ENV=production

UNICORN_OPTS="-D -E $ENV -c $APP_ROOT/config/unicorn.rb"

SET_PATH="cd $APP_ROOT"
CMD="$SET_PATH; unicorn_rails $UNICORN_OPTS"

old_pid="$PID.oldbin"

cd $APP_ROOT || exit 1

sig () {
  test -s "$PID" && kill -$1 `cat $PID`
}

oldsig () {
  test -s $old_pid && kill -$1 `cat $old_pid`
}

case ${1-help} in
  start)
 sig 0 && echo >&2 "Already running" && exit 0
 su - redmine -c "$CMD"
 ;;
  stop)
 sig QUIT && exit 0
 echo >&2 "Not running"
 ;;
  force-stop)
 sig TERM && exit 0
 echo >&2 "Not running"
 ;;
  restart|reload)
 sig HUP && echo reloaded OK && exit 0
 echo >&2 "Couldn't reload, starting '$CMD' instead"
 su - redmine -c "$CMD"
 ;;
  upgrade)
 sig USR2 && exit 0
 echo >&2 "Couldn't upgrade, starting '$CMD' instead"
 su - redmine -c "$CMD"
 ;;
  rotate)
 sig USR1 && echo rotated logs OK && exit 0
 echo >&2 "Couldn't rotate logs" && exit 1
 ;;
  *)
 echo >&2 "Usage: $0 <start|stop|restart|upgrade|rotate|force-stop>"
 exit 1
 ;;
esac
