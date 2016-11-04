#! /bin/bash

cd cachedownload/
jar cfM cachedownload.xpi `find . -not -path "*/.*" -not -type d` 
