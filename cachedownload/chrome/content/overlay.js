var CacheDownload={
	
	enabled:false,
	timer:null,
	matches:null,
	files:null,
	

	INDEX_KEY:0,
	INDEX_SIZE:1,
	INDEX_COUNT:2,
	INDEX_VISITED:3,
	INDEX_DEVICE:4,
	INDEX_DOWNLOADED:5,
	
	MAX_SAME:3,
	
	
	get _cacheService() {
		if (!this.__cacheService) {
			this.__cacheService = Components.classes["@mozilla.org/network/cache-service;1"]
							.getService(Components.interfaces.nsICacheService);
		}
		return this.__cacheService;
	},
	__cacheService: null,
	
	get _dateService() {
		if (!this.__dateService) {
			this.__dateService = Components.classes["@mozilla.org/intl/scriptabledateformat;1"]
							.getService(Components.interfaces.nsIScriptableDateFormat);
		}
		return this.__dateService;
	},
	__dateService: null,
	
	onLoad: function() {
		  //gBrowser.addEventListener("load", this.onNeedChange, false);
		  //gBrowser.mTabContainer.addEventListener("select", this.onNeedChange, false);
		  //gBrowser.mTabContainer.addEventListener("TabSelect", this.onNeedChange, false);
		  //gBrowser.mTabContainer.addEventListener("TabOpen", this.onNeedChange, false);
		  //window.addEventListener("load", this.onNeedChange, true);
		  this.linkPreferenceListener();
		  this.observe(); //Load preference for the first time
	},
	
	switchmode: function(event) {  
		
		var object = document.getElementById("cachedownload-button-switchmode");
		if (object!=null) {
			CacheDownload.enabled=object.hasAttribute("checked");
		}
		var aConsoleService = Components.classes["@mozilla.org/consoleservice;1"].
	    getService(Components.interfaces.nsIConsoleService);
		
		if (CacheDownload.enabled) {
			this.timer = Components.classes["@mozilla.org/timer;1"]
			       .createInstance(Components.interfaces.nsITimer);
			
			var self = this;
			
			function timerCallback() {}
			timerCallback.prototype = {
				_finalize: function() {
				},
				observe: function(aTimer, aTopic, aData) {
					self.beforeVisit();
					self._cacheService.visitEntries(self);
					self.afterVisit();
					self.timer.init(new timerCallback(), 5000, self.timer.TYPE_ONE_SHOT);
				}
			};
			aConsoleService.logStringMessage("Enable: ");
			this.timer.init(new timerCallback(), 5000, this.timer.TYPE_ONE_SHOT);
			
		} else {
			if (this.timer!=null) {
				aConsoleService.logStringMessage("Cancel: ");
				this.timer.cancel();
			}
		}
	},
	
	// ***** nsICacheVisitor *****
	visitDevice: function CV_visitDevice(aDeviceID, aDeviceInfo) {
		if (aDeviceID == "offline") return true;
		
		//document.getElementById(aDeviceID).setAttribute("value", Math.round(aDeviceInfo.totalSize/1024000*100)/100+"/"+Math.round(aDeviceInfo.maximumSize/1024000*100)/100);
		//document.getElementById(aDeviceID + "Meter").setAttribute("value", Math.round(aDeviceInfo.totalSize/aDeviceInfo.maximumSize*100));
		//document.getElementById(aDeviceID + "Entries").setAttribute("value", aDeviceInfo.entryCount +" "+ this._bundle.getString("entries"));
		return true;
	},
	
	visitEntry: function CV_visitEntry(aDeviceID, aEntryInfo) {
		
		if (aEntryInfo.dataSize == 0)
			return true;
		
		if (aEntryInfo.key.indexOf("http") == 0) {
			var aConsoleService = Components.classes["@mozilla.org/consoleservice;1"].
		    getService(Components.interfaces.nsIConsoleService);
			
			if (this.matches==null) {
				this.matches=new Array();
			}
			if (this.files==null) {
				this.files=new Array();
			}
			
			
			this.matches[0] = /jiwa\.fm\/play\.php/;
			
			for (i=0; i<this.matches.length; i++) {
				if (this.matches[i].exec(aEntryInfo.key)) {
					aConsoleService.logStringMessage("Match that : "+aEntryInfo.key);
					
					//Find index of key, -1 otherwise
					var index = -1;
					for (j=0; j<this.files.length;j++) {
						if (this.files[j]!=null && this.files[j][this.INDEX_KEY]==aEntryInfo.key) {
							index = j;
						}
					}
					//If not found, insert into array at an empty position
					if (index==-1) {
						//aConsoleService.logStringMessage("Add to files : "+aEntryInfo.key);
						var indexInsert = this.files.length;
						for (j=0; j<this.files.length;j++) {
							if (this.files[j]==null) {
								indexInsert=j;
							}
						}
						this.files[indexInsert]=new Array();
						this.files[indexInsert][this.INDEX_KEY]=aEntryInfo.key;
						this.files[indexInsert][this.INDEX_SIZE]=aEntryInfo.dataSize;
						this.files[indexInsert][this.INDEX_COUNT]=1;
						this.files[indexInsert][this.INDEX_VISITED]=true;
						this.files[indexInsert][this.INDEX_DEVICE]=aEntryInfo.deviceID;
						this.files[indexInsert][this.INDEX_DOWNLOADED]=false;
						
						
					} else { //If found

						//If already downloaded
						if (this.files[index][this.INDEX_DOWNLOADED]==true)  {
							return true;
						}
						
						this.files[index][this.INDEX_VISITED]=true;
						
						//If size is different, reset to new size
						if (this.files[index][this.INDEX_SIZE]!=aEntryInfo.dataSize) {
							//aConsoleService.logStringMessage("Size different : "+aEntryInfo.key);
							this.files[index][this.INDEX_SIZE]=aEntryInfo.dataSize;
							this.files[index][this.INDEX_COUNT]=1;
						
						//If size is equals, wait 3 timer..
						} else if (this.files[index][this.INDEX_COUNT]<this.MAX_SAME) {
							//aConsoleService.logStringMessage("Size equals : "+aEntryInfo.key);
							this.files[index][this.INDEX_COUNT]++;
						} else {
							aConsoleService.logStringMessage("Download that : "+aEntryInfo.key);
						}
					}
					
					break;
				}
			}
//			this._DBConn.executeSimpleSQL("INSERT INTO cacheentries (key, size, dev, clnt, strm, mod, fet, exp, cnt) VALUES ('"+
//								aEntryInfo.key+"', "+
//								aEntryInfo.dataSize+", '"+
//								aEntryInfo.deviceID+"', '"+
//								aEntryInfo.clientID+"', "+
//								(aEntryInfo.isStreamBased() ? 1 : 0)+", "+
//								aEntryInfo.lastFetched+", "+
//								aEntryInfo.lastModified+", "+
//								aEntryInfo.expirationTime+", "+
//								aEntryInfo.fetchCount+")");
		}
		return true;
	},
	
	beforeVisit: function CV_beforeVisit() {
		var aConsoleService = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);
		//aConsoleService.logStringMessage("beforeVisit");
		if (this.files==null) return;
		for (i=0; i<this.files.length; i++) {
			if (this.files[i]!=null) this.files[i][this.INDEX_VISITED]=false;
		}
	},
	
	afterVisit: function CV_afterVisit() {
		var aConsoleService = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);
		//aConsoleService.logStringMessage("afterVisit");
					
		if (this.files==null) return;
		for (i=0; i<this.files.length; i++) {
			
			//If item has been visited and count reached the max, download the item
			if (this.files[i]!=null && this.files[i][this.INDEX_VISITED]==true) {
				if (this.files[i][this.INDEX_COUNT]==this.MAX_SAME) {
					aConsoleService.logStringMessage("Download that : "+this.files[i][this.INDEX_KEY]);
					//if (this.files[index][this.INDEX_SIZE]>10) {
						this.saveCache(i);
					//}
					//this.files[i]=null;
				}
			} else {
				//this.files[i]=null;
			}
		}
	},
	
	getFirstItemWithClass: function CV_getFirstItem(document, className) {
	
		var attr = document.evaluate("//*[@class='"+className+"']", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null );
		if (attr!=null) {
			attr=attr.singleNodeValue.textContent;
	    }
		return attr;
	},
	
	getFirstTabItemClass: function CV_getFirstTab(className) {
	
		var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
	                     .getService(Components.interfaces.nsIWindowMediator);
	  	var browserEnumerator = wm.getEnumerator("navigator:browser");
	
	  	// Check each browser instance for our URL
	  	var found = false;
	  	while (!found && browserEnumerator.hasMoreElements()) {
	    	var browserWin = browserEnumerator.getNext();
	    	var tabbrowser = browserWin.getBrowser();
			// Check each tab of this browser instance
	    	var numTabs = tabbrowser.browsers.length;
	   		for(var index=0; index<numTabs; index++) {
	     		var currentBrowser = tabbrowser.getBrowserAtIndex(index);
	      		var url_check = currentBrowser.currentURI.spec.indexOf( 'jiwa' );
				if ( url_check != -1 ) {
					var documente = currentBrowser.contentDocument;
					var res = this.getFirstItemWithClass(documente, className);
					if (res!=null) return res;
	        	}
	      	}
	    }
	    return null;
	}, 
	
	myInternalSave : function CV_myInternalSave(aURL, aBaseName, aExt)
	{
	  var aConsoleService = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);
	  
	  var saveMode = GetSaveModeForContentType(null);
	  var saveAsType = kSaveAsType_Complete;
	  var file, fileURL;
	  
	  //Make uri for source
	  var source_fileInfo = new FileInfo("default");
	  initFileInfo(source_fileInfo, aURL, null, null,
                 null, null);
	  var source = source_fileInfo.uri;
	  
	  //Make uri and file for target
	  var target_fileInfo = new FileInfo("default");
	  initFileInfo(target_fileInfo, aURL, null, null,
                 null, null);
      target_fileInfo.fileExt = aExt;
	  target_fileInfo.fileBaseName = aBaseName;
	  target_fileInfo.fileName=target_fileInfo.fileBaseName;
	  
	  var fpParams = {
     		fileInfo: target_fileInfo,
      		file:null,
      		fileURL:null
      };
    	
	  getTargetFile(fpParams, true);
	  file = fpParams.file;
	  fileURL = makeFileURI(fpParams.file);
	  
	  //Make persist info
	  var persistArgs = {
	    source      : source,
	    contentType : null,
	    target      : fileURL,
	    postData    : null,
	    bypassCache : false
	  };
	  
	  var persist = makeWebBrowserPersist();
	
	  // Calculate persist flags.
	  const nsIWBP = Components.interfaces.nsIWebBrowserPersist;
	  const flags = nsIWBP.PERSIST_FLAGS_REPLACE_EXISTING_FILES;
	  persist.persistFlags = flags | nsIWBP.PERSIST_FLAGS_FROM_CACHE;
	  
	  // Leave it to WebBrowserPersist to discover the encoding type (or lack thereof):
	  persist.persistFlags |= nsIWBP.PERSIST_FLAGS_AUTODETECT_APPLY_CONVERSION;
	  
	  // Create download and initiate it (below)
	  var tr = Components.classes["@mozilla.org/transfer;1"].createInstance(Components.interfaces.nsITransfer);
	  
	  tr.init(source, persistArgs.target, "", null, null, null, persist);
	  persist.progressListener = new DownloadListener(window, tr);
	  persist.saveURI(source, null, null, persistArgs.postData, null, persistArgs.target);
	  
	},
	
	saveCache: function CV_saveCache(index) {
		var key = this.files[index][this.INDEX_KEY];
		this.files[index][this.INDEX_DOWNLOADED]=true;
		
		//function saveURL(aURL, aFileName, aFilePickerTitleKey, aShouldBypassCache,
        //         aSkipPrompt, aReferrer)
		//saveURL(key, null, null, false, true);
		// internalSave(aURL, null, aFileName, null, null, aShouldBypassCache,
        //       aFilePickerTitleKey, null, aReferrer, aSkipPrompt);
		
		
		//function internalSave(aURL, aDocument, aDefaultFileName, aContentDisposition,
        //              aContentType, aShouldBypassCache, aFilePickerTitleKey,
        //              aChosenData, aReferrer, aSkipPrompt)
     
    	if (this.files[index][this.INDEX_SIZE]<10) return;
     
    	var currentDate = new Date();
    	var date=currentDate.getTime();
    	var author=this.getFirstTabItemClass("player-currentArtist");
    	var title=this.getFirstTabItemClass("player-currentSong");
     	
     	var aConsoleService = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);
	    
	    var fileName = "play_"+date+"_"+author+"_"+title;
		fileName=fileName.replace(/éèêë/g, "e");
		fileName=fileName.replace(/ìîï/g, "i");
		fileName=fileName.replace(/àâä/g, "a");
		fileName=fileName.replace(/ùûü/g, "u");
		fileName=fileName.replace(/ç/g, "c");
		fileName=fileName.replace(/[^a-zA-Z _0-9\-'"]/g, " ");
		
		aConsoleService.logStringMessage("Download "+key+"\nto : "+fileName);
		
		this.myInternalSave(key, fileName, "jpg");
		
		aConsoleService.logStringMessage("Saved to : "+fileName);
		
		//internalSave(key, null, null, null, null, false, null, auto, null, true);
	},
	
	linkPreferenceListener: function () {
		this._prefs = Components.classes["@mozilla.org/preferences-service;1"].
		                    getService(Components.interfaces.nsIPrefService);
		this._prefs = this._prefs.getBranch("extensions.cachedownload.");
		this._prefs.QueryInterface(Components.interfaces.nsIPrefBranch2);
		this._prefs.addObserver("", this, false);
	}, 
	
	unlinkPreferenceListener: function () {
		if (!this._prefs) return;
		this._prefs.removeObserver("", this);
	}, 
	
	observe: function () {
//		var value;
//		if (!this._prefs) {
//			 value=true; //Default value
//		} else {
//			 value=this._prefs.getBoolPref('show_statusbar_elements');
//		}
//		
//		var widget;
//		  if (widget=document.getElementById("pnbuttons-panel-prev")){
//				widget.setAttribute("hidden", !value);
//		  }
//		  if (widget=document.getElementById("pnbuttons-panel-next")){
//				widget.setAttribute("hidden", !value);
//		  }
//		  
	 }
	
};

window.addEventListener("load", function(e) { CacheDownload.onLoad(e); }, false);
