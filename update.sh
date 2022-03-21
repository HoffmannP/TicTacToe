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

ssh uber mkdir -p html/tictactoe/images
scp build/*        			uber:html/tictactoe/
scp images/tictactoe.png 	uber:html/tictactoe/images/
for icon in $((rg -o '[-\w]+.svg' index.html |cut -d. -f1; rg -o 'setIcon\([^\)]*\)' script.js |cut -d\' -f2)|sort -u)
do
	scp images/feather-icons/${icon}.svg uber:html/tictactoe/images/
done
scp server.py      			uber:bin/tictactoe.py
scp supervisor.ini 			uber:etc/services.d/tictactoe.ini

# ssh uber supervisorctl restart tictactoe
ssh uber supervisorctl status tictactoe
