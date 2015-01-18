var CacheDownload={
	
	enabled:false,
	
	timer:null,
	rules:null,
	files:null,
	prefs:null,
	
	lastTimeCheck:null,
	previouslyMatchedItemsCount:null,
	lastDownloadedFile:null,
	
	TIMER_CACHE_CHECK:10000,
	TIMER_DOWNLOAD_CONSECUTIVE:2000,
	MAX_SAME:5,

	
	onLoad: function() {
		  //gBrowser.addEventListener("load", this.onNeedChange, false);
		  //gBrowser.mTabContainer.addEventListener("select", this.onNeedChange, false);
		  //gBrowser.mTabContainer.addEventListener("TabSelect", this.onNeedChange, false);
		  //gBrowser.mTabContainer.addEventListener("TabOpen", this.onNeedChange, false);
		  //window.addEventListener("load", this.onNeedChange, true);
		  this.linkPreferenceListener();
	},
	
	getLocale: function() {
		return document.getElementById("cachedownload.strings");
	},
	
	getEnabledRulesCount : function(locale) {
		var count = 0;
		if (this.rules != null) {
			for (var i = 0; i < this.rules.length; i++) {
				if (this.rules[i].isEnabled) {
					count = count+1;
				}
			}
		}
		return count;
	},
	
	getLastTimeCheck : function(locale) {
		if (this.lastTimeCheck == null) {
			return CacheDownload.Locale.getString(locale, "cachedownload.status.unknown");
		}
		return this.lastTimeCheck.toLocaleDateString() + " " + this.lastTimeCheck.toLocaleTimeString();
	},
	
	getPreviouslyMatchedItemsCount : function(locale) {
		if (this.previouslyMatchedItemsCount == null) {
			return CacheDownload.Locale.getString(locale, "cachedownload.status.unknown");
		}
		return this.previouslyMatchedItemsCount;
	},
	
	getLastDownloadedFilename : function(locale) {
		if (this.lastDownloadedFile == null) {
			return CacheDownload.Locale.getString(locale, "cachedownload.status.unknown");
		}
		return CacheDownload.Locale.getString(locale, "cachedownload.status.filename", this.lastDownloadedFile.evaluatedFilename2, this.lastDownloadedFile.rule.id);
	},
	
	computeInformations : function(event) {
		var object = document.getElementById("cachedownload-tooltip");
		if (object == null) {
			return;
		}
		
		var content = new Array();
		var locale = this.getLocale();
		if (CacheDownload.enabled) {
			content.push(CacheDownload.Locale.getString(locale, "cachedownload.status.enabled"));
			content.push(CacheDownload.Locale.getString(locale, "cachedownload.status.enabledRules", this.getEnabledRulesCount(locale)));
			content.push(CacheDownload.Locale.getString(locale, "cachedownload.status.lastTimeCheck", this.getLastTimeCheck(locale)));
			content.push(CacheDownload.Locale.getString(locale, "cachedownload.status.previouslyMatchedItems", this.getPreviouslyMatchedItemsCount(locale)));
			content.push(CacheDownload.Locale.getString(locale, "cachedownload.status.lastDownloadedFileName", this.getLastDownloadedFilename(locale)));
			
		} else {
			content.push(CacheDownload.Locale.getString(locale, "cachedownload.status.disabled"));
		}
		
		var childNodes = object.childNodes;
		for (var i = 0; i < childNodes.length; i++) {
		  var child = childNodes[i];
		  if (content.length>i) {
			child.value = content[i];
			child.setAttribute("hidden", "false");
		  }
		  if ((i >= content.length) || (child.value == null || child.value.length == 0)) {
			child.setAttribute("hidden", "true");
		  }
		}
	},
	
	switchmode: function(event) {  

	//	var 
		//if (object!=null) {
	//		CacheDownload.enabled=object.hasAttribute("checked");
	//	}
		
		//var 
		var object = document.getElementById("cachedownload-activate-ctx-menuitem");
		if (object != null) {
			CacheDownload.enabled=object.hasAttribute("checked");
			var objectTb = document.getElementById("cachedownload-button-switchmode");
			if (objectTb != null) {
				if (CacheDownload.enabled) {
					objectTb.removeAttribute("disabled");
					
				} else {
					objectTb.setAttribute("disabled", "yes");
				}
			}
		}
		//
		
		var aConsoleService = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);
		
		if (CacheDownload.enabled) {
			aConsoleService.logStringMessage("[cachedownload] enabled");
			this.loadPreferences();
			this.triggerCheck();
			
		} else {
			aConsoleService.logStringMessage("[cachedownload] disabled");
			if (this.timer!=null) {
				this.timer.cancel();
				CacheDownload.CacheVisitor.cancel();
			}
		}
		
	},
	
	
	onConfigure: function(ev) {

		openDialog('chrome://cachedownload/content/options.xul', null, 'chrome,titlebar,toolbar,centerscreen,modal');
		  
	},

	onDisplayOptions: function(ev) {
		Components.utils.import('resource://gre/modules/Services.jsm');
		Services.wm.getMostRecentWindow('navigator:browser').BrowserOpenAddonsMgr('addons://detail/cachedownload@phigDR.projects/preferences');
	},
	
	
	triggerCheck : function() {
		var aConsoleService = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);
		
		function timerCallback() {}
		timerCallback.prototype = {
			_finalize: function() {
			},
			observe: function(aTimer, aTopic, aData) {
				CacheDownload.CacheVisitor.triggerVisit(CacheDownload);
			}
		};
		
		aConsoleService.logStringMessage("[cachedownload] next check triggered : "+CacheDownload.TIMER_CACHE_CHECK+" ms");
		
		if (this.timer == null) {
			this.timer = Components.classes["@mozilla.org/timer;1"].createInstance(Components.interfaces.nsITimer);
		}
		
		this.timer.init(new timerCallback(), CacheDownload.TIMER_CACHE_CHECK, this.timer.TYPE_ONE_SHOT);
		
	},
	
	visitEntry: function (aEntryValue) {
		
		var aConsoleService = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);
		
		if (aEntryValue.dataSize == 0) {
			return true;
		}
		
		//aConsoleService.logStringMessage("Cached entry : "+aEntryValue.key + " l = "+this.rules.length);
		
		if (this.files==null) {
			this.files=new Array();
		}
		
		for (var i=0; i<this.rules.length; i++) {
		
			if (this.rules[i].isEnabled && this.rules[i].match(aEntryValue)) {
				
				
				//Find index of key, -1 otherwise
				var index = -1;
				for (var j=0; j<this.files.length;j++) {
					if (this.files[j]!=null && this.files[j].match(aEntryValue)) {
						index = j;
					}
				}
				//If not found, insert into array at an empty position
				if (index==-1) {
					//aConsoleService.logStringMessage("Match that : "+aEntryValue.key);
					
					var indexInsert = this.files.length;
					for (var j=0; j<this.files.length;j++) {
						if (this.files[j]==null) {
							indexInsert=j;
						}
					}
					var file = new CacheDownload.SharedObjects.File(aEntryValue);
					this.files[indexInsert]=file;
					this.previouslyMatchedItemsCount = this.previouslyMatchedItemsCount + 1;
					
				} else { //If found
					//If already downloaded
					if (this.files[index].isDownloaded)  {
						return true;
					}
					
					this.previouslyMatchedItemsCount = this.previouslyMatchedItemsCount + 1;
				
					//aConsoleService.logStringMessage("[cachedownload] rule '"+this.rules[i].id+"' matches an item: "+ aEntryValue.key);
		
					this.files[index].visited=true;
					this.files[index].rule = this.rules[i];
					
					//If size is different, reset to new size
					if (this.files[index].size!=aEntryValue.dataSize) {
						this.files[index].size=aEntryValue.dataSize;
						this.files[index].count=1;
					
					//If size is equals, wait 3 timer..
					} else if (this.files[index].count<this.MAX_SAME) {
						this.files[index].count++;
					}
				}
				break;
			}
		}
		return true;
	},
	
	beforeVisitEntries: function () {
		this.previouslyMatchedItemsCount = 0;
		var aConsoleService = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);
		//aConsoleService.logStringMessage("beforeVisit");
		if (this.files==null) return;
		for (var i=0; i<this.files.length; i++) {
			if (this.files[i]!=null) this.files[i].visited=false;
		}
	},
	
	afterVisitEntries: function () {
		var aConsoleService = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);
							
		if (this.files==null) return;
		for (var i=0; i<this.files.length; i++) {
			//aConsoleService.logStringMessage("Cache that : "+this.files[i].key);
					
			//If item has been visited and count reached the max, download the item
			if (this.files[i]!=null && this.files[i].visited==true) {
				if (this.files[i].count==this.MAX_SAME) {
					aConsoleService.logStringMessage("[cachedownload] rule '"+this.files[i].rule.id+"' downloads an item: "+this.files[i].key);
					//aConsoleService.logStringMessage("Download that : "+this.files[i].key);
					this.saveCache(i);
					break;
				}
			}
		}
		
		this.lastTimeCheck = new Date();
		this.computeInformations(null);
		this.triggerCheck();
	},

	saveCache: function CV_saveCache(index) {
		var key = this.files[index].key;
		this.files[index].isDownloaded=true;
		
		//Enhance precondition :)
    	if (this.files[index].size<10) return;
    	
		
    	var filename = this.files[index].evaluatedFilename();
		this.files[index].evaluatedFilename2 = filename;
		this.lastDownloadedFile = this.files[index];
		this.computeInformations(null);
		
		var location = this.files[index].evaluatedLocation();
		
		CacheDownload.FileUtil.myInternalSave(key, filename, location, CacheDownload.TIMER_DOWNLOAD_CONSECUTIVE);
		
		//aConsoleService.logStringMessage("Saved to : "+filename);
		//internalSave(key, null, null, null, null, false, null, auto, null, true);
	},
	
	
	linkPreferenceListener: function () {
		if (this.prefs != null) {
			this.unlinkPreferenceListener();
		}
		this.prefs = new CacheDownload.SharedObjects.PreferencesListener("extensions.cachedownload.", this.observe);
		this.prefs.register();
	},
	
	unlinkPreferenceListener: function () {
		if (this.prefs == null) return;
		this.prefs.unregister();
	}, 
	
	loadPreferences: function() {
		this.observe("", "");
	}, 
	
	
	observe: function(branch, name) {
		CacheDownload.rules = new Array();
		//Load rules
		var storedRules = CacheDownload.prefs.service.getCharPref('rules');
		if (storedRules!=null && storedRules!=undefined && storedRules.length>0) {
			CacheDownload.SharedObjects.RulerParser.parseRules(storedRules, CacheDownload.addRule);
		}
			
		//Load values
		var prefTIMER_CACHE_CHECK  = CacheDownload.prefs.service.getIntPref('TIMER_CACHE_CHECK');
		if (prefTIMER_CACHE_CHECK!=null && prefTIMER_CACHE_CHECK!=undefined && prefTIMER_CACHE_CHECK>0) {
			CacheDownload.TIMER_CACHE_CHECK = prefTIMER_CACHE_CHECK;
		}
			
		var prefTIMER_DOWNLOAD_CONSECUTIVE  = CacheDownload.prefs.service.getIntPref('TIMER_DOWNLOAD_CONSECUTIVE');
		if (prefTIMER_DOWNLOAD_CONSECUTIVE!=null && prefTIMER_DOWNLOAD_CONSECUTIVE!=undefined && prefTIMER_DOWNLOAD_CONSECUTIVE>0) {
			CacheDownload.TIMER_DOWNLOAD_CONSECUTIVE = prefTIMER_DOWNLOAD_CONSECUTIVE;
		}
		
		var prefMAX_SAME  = CacheDownload.prefs.service.getIntPref('MAX_SAME');
		if (prefMAX_SAME!=null && prefMAX_SAME!=undefined && prefMAX_SAME>0) {
			CacheDownload.MAX_SAME = prefMAX_SAME;
		}
	},
	
	addRule : function(rule) {
		var contains = false;
		for (var k=0; k<CacheDownload.rules.length;k++) {
			if (CacheDownload.rules[k].id == rule.id) {
				contains = true;
				break;
			}
		}
		
		if (!contains) {
			CacheDownload.rules.push(rule);
		}
	}
	
	  

};










// Basic namespace implementation.
(function() {
	var namespaces = [];

	// Namespace registration
	this.ns = function(fn) {
		var ns = {};
		namespaces.push(fn, ns);
		return ns;
	};

	// Namespace initialization
	this.initialize = function() {
		for (var i=0; i<namespaces.length; i+=2) {
			var fn = namespaces[i];
			var ns = namespaces[i+1];
			fn.apply(ns);
		}
		CacheDownload.onLoad();
	};

	// Clean up
	this.shutdown = function() {
		window.removeEventListener("load", CacheDownload.initialize, false);
		window.removeEventListener("unload", CacheDownload.shutdown, false);
	};

	// Register handlers to maintain extension life cycle.
	window.addEventListener("load", CacheDownload.initialize, false);
	window.addEventListener("unload", CacheDownload.shutdown, false);
}).apply(CacheDownload);
