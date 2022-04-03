#!/bin/bash

set -e

yarn build

ssh uber -x mkdir -p		html/tictactoe
scp dist/*					uber:html/tictactoe/
scp server.py				uber:bin/tictactoe.py
scp supervisor.ini			uber:etc/services.d/tictactoe.ini

ssh uber -x supervisorctl restart tictactoe
ssh uber -x supervisorctl status tictactoe
