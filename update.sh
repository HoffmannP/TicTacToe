#!/bin/bash

set -e

rm -rf build
mkdir build
minify style.css > build/style.css
sed 's/DEV = true/DEV = false/' script.js |\
	uglifyjs --mangle --toplevel --compress --output build/script.js --source-map
minify index.html > build/index.html

scp build/*        uber:html/tictactoe/
scp server.py      uber:bin/tictactoe.py
scp supervisor.ini uber:etc/services.d/tictactoe.ini

ssh uber supervisorctl restart tictactoe
ssh uber supervisorctl status tictactoe
