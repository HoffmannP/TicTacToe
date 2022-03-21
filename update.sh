#!/bin/bash

set -e

rm -rf build
mkdir build
(
	cat uikit/css/uikit.min.css
	minify style.css
) > build/style.css
(
	cat uikit/js/uikit.js
	sed 's/DEV = true/DEV = false/;s%/feather-icons%%' script.js
) | uglifyjs --mangle --toplevel --compress --source-map --output build/script.js
sed '/uikit/d;s%/feather-icons%%' index.html | minify --html > build/index.html

ssh uber -x mkdir -p			html/tictactoe/images
scp build/*					uber:html/tictactoe/
scp images/tictactoe.png	uber:html/tictactoe/images/
icons=$(
	(
		rg -o '[-\w]+.svg"' index.html |cut -d. -f1
		rg -o 'setIcon\([^\)]*\)' script.js |cut -d\' -f2
	)|sort -u |awk '{ print "images/feather-icons/"$0".svg" }'
)
scp $icons uber:html/tictactoe/images/
scp server.py				uber:bin/tictactoe.py
scp supervisor.ini			uber:etc/services.d/tictactoe.ini

ssh uber -x supervisorctl restart tictactoe
ssh uber -x supervisorctl status tictactoe
