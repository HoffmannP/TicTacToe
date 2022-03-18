#!/bin/bash

set -e

test -d build || mkdir build
minify style.css > build/style.css
minify script.js > build/script.js
minify index.html > build/index.html