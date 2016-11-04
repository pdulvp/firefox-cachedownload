# Cache Download - Mozilla Firefox Addon

(https://addons.mozilla.org/en-US/firefox/addon/cachedownload/)

With this addon, you can download automatically items cached by Firefox following predefined rules on their URL.

For instance, to download each logo of Wikipedia, a rule matching 
"http://upload.wikimedia.org/wikipedia/commons/.*Wikipedia-logo" will download automatically each logo that you will encounter while internet browsing.

Each times addon will check cache, it will analyze cached elements to determine if one (or more) element is matched by one of defined rules. If such element is considered as downloadable, tool will save it to the default download folder. 

Element is already stored in cache, so we don't trigger another connection to source server of element, we save cached element from Firefox cache.

Since an element located in Firefox cache doesn't always means that a complete file is stored on cache, an element is considered as 'downloadable' if size of such element has not changed since last X cache checking. This allows to download complete files, instead of header or corrupt files.