#!/bin/bash
echo "build livegrid-all.js from livegrid-all-debug.js"
java -jar yuicompressor-2.4.6.jar -o ../../src/m3/static/vendor/livegrid/livegrid-all.js --nomunge --disable-optimizations --charset UTF-8 ../../src/m3/static/vendor/livegrid/livegrid-all-debug.js

