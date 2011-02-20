#! /bin/bash

cd chrome/
jar cf cachedownload.jar *
cd ..
jar cf cachedownload.xpi chrome/cachedownload.jar chrome.manifest install.rdf
rm -f chrome/cachedownload.jar
