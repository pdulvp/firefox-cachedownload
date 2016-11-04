# Cache Download - Mozilla Firefox Addon

(https://addons.mozilla.org/en-US/firefox/addon/cachedownload/)

**This addon downloads automatically elements that you encounter in your daily-use of Firefox**

For instance, with a rule matching **PDF bills** that your bank or phone company gives you each month, you will be able to save them automatically when you have opened the bill in Firefox, You don't have to bother you to save them manually in a specific folder for backup, this addon does it for you.

Same for all those images of funny cats that your familly sent you from whatever sharing service, when you 'view' it (or at least open it), this addon will backup it into a specifc folder. (girlfriend specific purpose for instance)

As a cache manipulation tool, it also allow to view the cache and clear the cache too.


## Geek enhanced description: ##
With this addon, each time an element is stored in the Firefox cache, you can download it following rules based on their URL.

Rules are **Regular Expressions** which offer enough customization to focus on which elements need to be backup and where.

Each times addon will check cache, it will analyze cached elements to determine if one (or more) element is matched by one of defined rules. If such element is considered as downloadable, **addon will save it into the specified download folder, with a given filename expression**. (with a foobar2000-titleformatting-like mechanism, output filename can be quite structured (based on filename, date, size, etc)

Since an element located in Firefox cache doesn't always means that a complete file is stored on cache, an element is considered as 'downloadable' if size of such element has not changed since last X cache checking. This allows to download complete files, instead of header or corrupt files (high quality jpeg for instance)

To improve privacy, addon don't trigger another connection to source server of element, element is already stored in cache so we save cached element !

The filename of the saved file can be computed with several variables and functions;

### Based on the cache element: ###
* %filename%: Filename of current file (with extension)
* %ext%: Extension of current file
* %baseFilename%: Filename of current file (without extension)
* %lastModifiedDate%: Last modified date of current file
* %size%: Size of current file

### String and Date Functions: ### 
* $date(date,format): Returns the current date when saving a file, with a format tat you can choose
* $substring(start,end): Retrieve the substring of the value
* $uppercase: Converts a string to uppercase letters
* $lowercase: Converts a string to lowercase letters
* $trim: Removes whitespace from both ends of a string
* $add, $mult : Basic number functions

### DOM Based Functions ### 
* $getTabByIndex(index): Returns the given Firefox Tab as a DOM document
* $getItemByClass(dom, className, index): Returns the index item from a tab with the given class
* $getItemById(dom, id): Returns the item from a tab with the given id
* $textContent(dom): Returns the text value of a given element