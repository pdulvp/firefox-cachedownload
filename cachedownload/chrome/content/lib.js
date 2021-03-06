Components.utils.import("resource://gre/modules/LoadContextInfo.jsm");

CacheDownload.SharedObjects = {
	
	TYPE_UNKNOWN: 0000,
	TYPE_STRING: 0001,
	TYPE_INTEGER: 0002,
	TYPE_FUNCTION: 0003,
	TYPE_XUL_TAB: 0004,
	TYPE_XUL_ELEMENT: 0005,
	
	getDefaultValue : function(type) {
		if (type == CacheDownload.SharedObjects.TYPE_UNKNOWN) {
			return null;
		} else if (type == CacheDownload.SharedObjects.TYPE_STRING) {
			return "";
		} else if (type == CacheDownload.SharedObjects.TYPE_INTEGER) {
			return 0;
		} else if (type == CacheDownload.SharedObjects.TYPE_FUNCTION) {
			return null;
		} 
		return null;
	},
	
	PreferencesListener : function(branchName, func) {  
		var prefService = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService);  
		var branch = prefService.getBranch(branchName);
		branch.QueryInterface(Components.interfaces.nsIPrefBranch2);  

		this.service = branch;
		
		this.register = function() {  
			branch.addObserver("", this, false);  
			branch.getChildList("", { })  
				  .forEach(function (name) { func(branch, name); });  
		};

		this.unregister = function unregister() {  
			if (branch)  
				branch.removeObserver("", this);  
		};

		this.observe = function(subject, topic, data) {  
		   if (topic == "nsPref:changed")  
				 func(branch, data);  
		};
	},
	
	KeyValue: function(key_p, value_p) {
		this.key = key_p;
		this.value = value_p;
	},

	ListViewItem: function() {
	},

	VariableDefinition: function(key_p, type_p) {
		this.key = key_p;
		this.type = type_p;
		
		this.getText = function() {
			return "%"+this.key+"%";
		};
		this.getEditText = function() {
			return this.getText();
		};
	},
	
	FunctionDefinition: function(key_p, type_p) {
		this.key = key_p;
		this.type = type_p;
		
		this.getType = function(index) {
			if (this.type instanceof Array) {
				if (index < this.type.length) {
					return this.type[index];
				}
				return CacheDownload.SharedObjects.TYPE_UNKNOWN;
			}
			return this.type;
		};
		
		this.getText = function() {
			return "$"+this.key;
		};
		this.getEditText = function() {
			return "$"+this.key+"()";
		};
	},
	
	RuleDefinition: function () {
		this.id = "";
		this.description = "";
		this.isEnabled = true;
		this.locationExpression = "";
		this.fileNameExpression = "";
		this.ruleExpression = "";
		this.version = "";
		
		this.getRuleExpressionMatch = function() {
			return new RegExp(this.ruleExpression, "g");
		};
		
		this.match = function(aEntryInfo) {
			return this.getRuleExpressionMatch().exec(aEntryInfo.key);
		};
		
		this.predefinedVariables = function() {
			var objects = new Array();
			objects.push(new CacheDownload.SharedObjects.VariableDefinition("url", CacheDownload.SharedObjects.TYPE_STRING));
			objects.push(new CacheDownload.SharedObjects.VariableDefinition("filename", CacheDownload.SharedObjects.TYPE_STRING));
			objects.push(new CacheDownload.SharedObjects.VariableDefinition("ext", CacheDownload.SharedObjects.TYPE_STRING));
			objects.push(new CacheDownload.SharedObjects.VariableDefinition("baseFilename", CacheDownload.SharedObjects.TYPE_STRING));
			objects.push(new CacheDownload.SharedObjects.VariableDefinition("lastModifiedDate", CacheDownload.SharedObjects.TYPE_INTEGER));
			objects.push(new CacheDownload.SharedObjects.VariableDefinition("size", CacheDownload.SharedObjects.TYPE_INTEGER));
			return objects;
		};
		
		this.predefinedFunctions = function() {
			var objects = new Array();
			objects.push(new CacheDownload.SharedObjects.FunctionDefinition("date", [CacheDownload.SharedObjects.TYPE_INTEGER, CacheDownload.SharedObjects.TYPE_STRING] ));
			objects.push(new CacheDownload.SharedObjects.FunctionDefinition("now", []));
			objects.push(new CacheDownload.SharedObjects.FunctionDefinition("add", CacheDownload.SharedObjects.TYPE_INTEGER));
			objects.push(new CacheDownload.SharedObjects.FunctionDefinition("mult", CacheDownload.SharedObjects.TYPE_INTEGER));
			objects.push(new CacheDownload.SharedObjects.FunctionDefinition("substring", [CacheDownload.SharedObjects.TYPE_STRING, CacheDownload.SharedObjects.TYPE_INTEGER, CacheDownload.SharedObjects.TYPE_INTEGER]));
			objects.push(new CacheDownload.SharedObjects.FunctionDefinition("uppercase", [CacheDownload.SharedObjects.TYPE_STRING]));
			objects.push(new CacheDownload.SharedObjects.FunctionDefinition("lowercase", [CacheDownload.SharedObjects.TYPE_STRING]));
			objects.push(new CacheDownload.SharedObjects.FunctionDefinition("trim", [CacheDownload.SharedObjects.TYPE_STRING]));
			//objects.push(new CacheDownload.SharedObjects.FunctionDefinition("regexp", [CacheDownload.SharedObjects.TYPE_STRING, CacheDownload.SharedObjects.TYPE_STRING, CacheDownload.SharedObjects.TYPE_STRING] ));
			objects.push(new CacheDownload.SharedObjects.FunctionDefinition("getTabByIndex", [CacheDownload.SharedObjects.TYPE_INTEGER]));
			objects.push(new CacheDownload.SharedObjects.FunctionDefinition("getItemByClass", [CacheDownload.SharedObjects.TYPE_XUL_ELEMENT, CacheDownload.SharedObjects.TYPE_STRING, CacheDownload.SharedObjects.TYPE_INTEGER]));
			objects.push(new CacheDownload.SharedObjects.FunctionDefinition("getItemById", [CacheDownload.SharedObjects.TYPE_XUL_ELEMENT, CacheDownload.SharedObjects.TYPE_STRING]));
			objects.push(new CacheDownload.SharedObjects.FunctionDefinition("textContent", CacheDownload.SharedObjects.TYPE_XUL_ELEMENT));
			return objects;
		};
		
		this.getVariable = function(id) {
			var tab = this.predefinedVariables();
			for(var i=0; i < tab.length; i++) {
				if (tab[i].key == id) {
					return tab[i];
				}
			}
			return null;
		};
		
		this.getFunction = function(id) {
			var tab = this.predefinedFunctions();
			for(var i=0; i < tab.length; i++) {
				if (tab[i].key == id) {
					return tab[i];
				}
			}
			return null;
		};
	}, 
	
	EntryValue: function(aURI,aIdEnhance,aDataSize,aFetchCount,aLastModifiedTime,aExpirationTime,aIsMemory) {
		this.key = aURI.prePath+aURI.path;
		this.uri = aURI;
		this.isMemory = aIsMemory;
		this.cacheEntry = null;
		this.value = aURI.prePath+aURI.path;
		this.filename = CacheDownload.FileUtil.getFileNameFromURL(aURI.prePath+aURI.path);
		this.dataSize=aDataSize;
		this.lastModifiedDate = aLastModifiedTime;
		this.lastModified=aLastModifiedTime;
		this.expirationTime=aExpirationTime;
		this.fetchCount=aFetchCount;
		
		//this.clientID=aEntryInfo.clientID;
		//this.deviceID=aEntryInfo.deviceID;
		//this.lastFetched=aEntryInfo.lastFetched;
		//this.isStreamBased=aEntryInfo.isStreamBased();
		
		this.contentType = "";
		
		this.getExtension = function() {
			var aExt = "";
			var extension = this.filename.split(".");
			if (extension.length>1) {
				aExt = extension[extension.length-1];
			}
			return aExt;
		};
		
		this.getBaseFilename = function() {
			var extension = this.getExtension();
			var baseFilename = this.filename;
			if (extension.length > 0) {
				baseFilename = baseFilename.substr(0, baseFilename.length-1-extension.length);
			}
			return baseFilename;
		};
	},
	
	File: function (aEntryValue) {
		this.key = aEntryValue.key;
		this.entryValue = aEntryValue;
		this.rule = null;
		
		this.count = 1;
		this.visited = true;
		this.isDownloaded = false;

		this.evaluatedFilename = function(aEntryValue) {
			return CacheDownload.FileUtil.evaluateExpressionAsFilename(this.rule.fileNameExpression, this.rule, this.entryValue);
		};
		
		this.evaluatedLocation = function(aEntryValue) {
			return this.rule.locationExpression; //TODO !
		};
		
		this.match = function(aEntryValue) {
			return this.key == aEntryValue.key;
		};
	}, 
};

CacheDownload.CacheVisitor = {
	cacheEntries : null,
	aCallback : null,
	timer: null,
	mode: 0,
	
	MODE_MEMORY: 0000,
	MODE_DISK: 0001,
	MODE_DISPATCH: 0002,
	
	cancel : function() {
		if (CacheDownload.CacheVisitor.timer != null) {
			CacheDownload.CacheVisitor.timer.cancel();
		}
	},
	
	triggerVisit : function(callback) {
		
		CacheDownload.CacheVisitor.timer = Components.classes["@mozilla.org/timer;1"].createInstance(Components.interfaces.nsITimer);
		
		function timerTriggerVisit() {
		}
		timerTriggerVisit.prototype = {
			observe: function(aTimer, aTopic, aData) {
				CacheDownload.CacheVisitor.initVisit(callback);
				CacheDownload.CacheVisitor.onCacheEntryVisitCompleted();
			}
		};

		CacheDownload.CacheVisitor.timer.init(new timerTriggerVisit(), 0, CacheDownload.CacheVisitor.timer.TYPE_ONE_SHOT);
	},
	
	// ***** nsICacheVisitor *****
	initVisit: function (callback) {
		CacheDownload.CacheVisitor.aCallback = callback;
		CacheDownload.CacheVisitor.cacheEntries = new Array();
		CacheDownload.CacheVisitor.mode = CacheDownload.CacheVisitor.MODE_MEMORY;
	},
	
	onCacheStorageInfo: function (aEntryCount, aConsumption, aCapacity, aDiskDirectory) {
		//var aDeviceID = "memory";
		//document.getElementById(aDeviceID).setAttribute("value", Math.round(aConsumption/1024000*100)/100+"/"+Math.round(aCapacity/1024000*100)/100);
		//document.getElementById(aDeviceID + "Meter").setAttribute("value", Math.round(aConsumption/aCapacity*100));
		//document.getElementById(aDeviceID + "Entries").setAttribute("value", aEntryCount +" "+ self._bundle.getString("entries"));
	},
	
	onCacheEntryInfo: function (aURI,aIdEnhance,aDataSize,aFetchCount,aLastModifiedTime,aExpirationTime) {
		var aIsMemory = false;
		var customEntryInfo = new CacheDownload.SharedObjects.EntryValue(aURI, aIdEnhance, aDataSize, aFetchCount, aLastModifiedTime, aExpirationTime,aIsMemory);
		CacheDownload.CacheVisitor.cacheEntries.push(customEntryInfo);
	},
	
	onCacheEntryVisitCompleted: function (){
		
		if (CacheDownload.CacheVisitor.mode == CacheDownload.CacheVisitor.MODE_MEMORY) {
			CacheDownload.CacheVisitor.mode = CacheDownload.CacheVisitor.MODE_DISK;
			CacheDownload.CacheVisitor.aCallback.beforeVisitEntries();
			var cacheService = Components.classes["@mozilla.org/netwerk/cache-storage-service;1"].getService(Components.interfaces.nsICacheStorageService);
			cacheService.memoryCacheStorage(LoadContextInfo.default,false).asyncVisitStorage(CacheDownload.CacheVisitor, true);
			
		} else if (CacheDownload.CacheVisitor.mode == CacheDownload.CacheVisitor.MODE_DISK) {
			CacheDownload.CacheVisitor.mode = CacheDownload.CacheVisitor.MODE_DISPATCH;
			var cacheService = Components.classes["@mozilla.org/netwerk/cache-storage-service;1"].getService(Components.interfaces.nsICacheStorageService);
			cacheService.diskCacheStorage(LoadContextInfo.default,false).asyncVisitStorage(CacheDownload.CacheVisitor,true);

		} else if (CacheDownload.CacheVisitor.mode == CacheDownload.CacheVisitor.MODE_DISPATCH) {
			
			function timerVisitEntries() {
			}
			timerVisitEntries.prototype = {
				observe: function(aTimer, aTopic, aData) {
					if (CacheDownload.CacheVisitor.cacheEntries != null && CacheDownload.CacheVisitor.cacheEntries.length>0) {
						var aEntryInfo2 = CacheDownload.CacheVisitor.cacheEntries.pop();	
						CacheDownload.CacheVisitor.aCallback.visitEntry(aEntryInfo2);
						CacheDownload.CacheVisitor.timer.init(this, 0, CacheDownload.CacheVisitor.timer.TYPE_ONE_SHOT);
					} else {
						CacheDownload.CacheVisitor.aCallback.afterVisitEntries();
					}
				}
			};
			
			CacheDownload.CacheVisitor.timer.init(new timerVisitEntries(), 0, CacheDownload.CacheVisitor.timer.TYPE_ONE_SHOT);
		}
		
	}
	
};

CacheDownload.SharedObjects.RulerParser = {
	
	migrate_0000_1000 : function(filenameExpression_p) {
		var expression = filenameExpression_p;
		expression=expression.replace(/\$filename/g, "%filename%");
		expression=expression.replace(/\$date/g, "$date($now())");
		return expression;
	},
	
	migrate : function(filenameExpression_p, version_p) {
		var expression = filenameExpression_p;
		if (version_p == null) {
			expression = this.migrate_0000_1000(expression);
		}
		return expression;
	},
	
	retrieveVersion : function(version_p) {
	    //var em = Components.classes["@mozilla.org/extensions/manager;1"].getService(Components.interfaces.nsIExtensionManager);
		//var addon = em.getItemForID("extension-guid@example.org");  
		//return addon.version;
		return CacheDownload.AnalyseParser.VERSION;
	},
	
	parseRules : function (string_p, callback_p) {
		var parser = new DOMParser();
		if (string_p.length==0) {
			return;
		}
		
		var dom = parser.parseFromString(string_p, "text/xml");
		var table = dom; 
		var cells = table.getElementsByTagName("rule"); 
		for (var i = 0; i < cells.length; i++) { 
			var rule = new CacheDownload.SharedObjects.RuleDefinition();
			rule.id = cells[i].getAttribute("id"); 
			rule.version = cells[i].getAttribute("version");
			rule.description = cells[i].getAttribute("description"); 
			rule.isEnabled = cells[i].getAttribute("isEnabled") == "true"; 
			rule.fileNameExpression = this.migrate(cells[i].getAttribute("fileNameExpression"), rule.version); 
			rule.ruleExpression = cells[i].getAttribute("ruleExpression"); 
			rule.locationExpression = cells[i].getAttribute("locationExpression"); 
			
			//add locationExpression
			if (rule.locationExpression == null || rule.locationExpression == "null") {
				rule.locationExpression = "";
			}
			
			callback_p(rule);
		}
	},
	
	toXML : function (rules_p) {
		//Find a better way than :
		var parser = new DOMParser();
		var dom = parser.parseFromString("<rules></rules>", "text/xml");
		var rulesXml = dom.documentElement;
		//var dom = document.implementation.createDocument("", "", null);
		//var rulesXml = dom.createElement("rules");
		
		for (var i=0; i<rules_p.length; i++) {
			var rule = rules_p[i];
			var ruleXml = dom.createElement("rule");
			ruleXml.setAttribute("id", rule.id);
			ruleXml.setAttribute("version", this.retrieveVersion(rule.version));
			ruleXml.setAttribute("description", rule.description);	
			ruleXml.setAttribute("isEnabled", rule.isEnabled ? "true" : "false");	
			ruleXml.setAttribute("fileNameExpression", rule.fileNameExpression);	
			ruleXml.setAttribute("ruleExpression", rule.ruleExpression);	
			ruleXml.setAttribute("locationExpression", rule.locationExpression);	
			rulesXml.appendChild(ruleXml);
		}
		
		var serializer = new XMLSerializer();
		var xml = serializer.serializeToString(dom);
		return xml;
	}
};



CacheDownload.FileUtil={
	
	evaluateExpressionAsFilename : function(text, rule, entryValue) {
		var expressionValue = CacheDownload.AnalyseParser.evaluateAsString(text, rule, entryValue);
		
		var aExt = "";
		//Retrieve current extension from the given cache-entry filename
		var extension = (entryValue == null ? "" : entryValue.filename.split("."));
		if (extension.length>1) {
			aExt = extension[extension.length-1];
		}
		
		//Retrieve current extension from the given expressionValue
		extension = expressionValue.split(".");
		if (extension.length>1) {
			aExt = extension[extension.length-1];
		}
		
		if (aExt.length > 0) {
			//We remove .aExt in expressionValue
			if (expressionValue.length-1-aExt.length >= 0) {
				if (expressionValue.substr(expressionValue.length-1-aExt.length)==("."+aExt)) {
					expressionValue = expressionValue.substr(0, expressionValue.length-1-aExt.length);
				}
			} else if (expressionValue.substr(expressionValue.length-aExt.length)==(aExt)) {
				expressionValue = expressionValue.substr(0, expressionValue.length-aExt.length);
			}
			
			//We add .aExt if not already found
			if (expressionValue.length-1-aExt.length >= 0) {
				if (expressionValue.substr(expressionValue.length-1-aExt.length)!=("."+aExt)) {
					expressionValue = expressionValue + "." + aExt;
				}
			} else if (expressionValue.substr(expressionValue.length-aExt.length)!=(aExt)) {
				expressionValue = expressionValue + "." + aExt;
			}
		}

		
		//Remove any slashes characters
		expressionValue=expressionValue.replace(/[\/\\]/g, "-");
		return expressionValue;
	},
	
	getFileNameFromURL: function(aURL) {
		var filename = aURL;
		var regSpearator = null;
		var segments = null;
		try {
			//tor cache-key fix
			regSpearator = new RegExp("uri=", "g");
			var segments =  filename.split(regSpearator);
			if (segments.length>1) {
				filename=segments[1];
			}
		} catch (exc) { }
		try {
			//retrieve filename from URI. Based on http://stackoverflow.com/questions/4549654/get-filename-from-url-using-regular-expressions-or-javascript
			regSpearator = /([^:]+:\/\/)?([^\/]+\/)*([^?#]*)/;
			segments = regSpearator.exec(filename);
			if (segments.length>3) {
				filename = RegExp.$3;
			}
		} catch (exc) { }
		return filename;
	},
	
	getTabByIndex: function(index) {
		var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator);
		var browserEnumerator = wm.getEnumerator("navigator:browser");
		
		// Check each browser instance for our URL
		var found = false;
		while (!found && browserEnumerator.hasMoreElements()) {
		    var browserWin = browserEnumerator.getNext();
		    var tabbrowser = browserWin.getBrowser();
			
		    var currentBrowser = tabbrowser.getBrowserAtIndex(index);
			if (currentBrowser != null) {
				var doc = currentBrowser.contentDocument;
				return doc;
			}
		}
		return null;
	}, 
	
	getFirstTabItemClass: function(className) {
		var doc = this.getTabByIndex(0);
		if (doc != null) {
			var res = this.getItemByClass(doc, className);
			if (res != null) {
				return res;
			}
		}
		return null;
	}, 

	getItemByClass: function(document, className, index=0) {
		var attr = document.evaluate("//*[@class='"+className+"']", document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null );
		if (attr!=null) {
			return attr.snapshotItem(index);
		}
		return null;
	},
	
	getItemById: function(document, id) {
		var attr = document.evaluate("//*[@id='"+id+"']", document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null );
		if (attr!=null) {
			return attr.snapshotItem(0);
		}
		return attr;
	},
	
	callbackSave: function(data) {
		
	}, 
	
	myInternalSave : function(aURL, aBaseName, aLocation, consecutive, aSkipPrompt = true)
	{
		var aConsoleService = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);
		
		
		//Retrieve current extension from the given expressionValue
		var aExt = "";
		var extension = aBaseName.split(".");
		if (extension.length>1) {
			aExt = extension[extension.length-1];
		}
		
		//Retrieve existing extension if same as aExt 
		if (aExt.length > 0 && (aBaseName.substr(aBaseName.length-1-aExt.length)==("."+aExt))) {
			aBaseName = aBaseName.substr(0, aBaseName.length-1-aExt.length);
		}
		
		
		//function internalSave(aURL, aDocument, aDefaultFileName, aContentDisposition,
    //                  aContentType, aShouldBypassCache, aFilePickerTitleKey,
    //                  aChosenData, aReferrer, aInitiatingDocument, aSkipPrompt,
    //                  aCacheKey)

    var aDocument = null;
    var aDefaultFileName = "default";
    
    //skip dialog saveAs
    var aShouldBypassCache = false;  //IMPORTANT
    var aCacheKey = null;

    // Note: aDocument == null when this code is used by save-link-as... 0x00; //SAVEMODE_FILEONLY ;//GetSaveModeForContentType(null);
    var saveMode = 0x00; //SAVEMODE_FILEONLY ; GetSaveModeForContentType(aContentType, aDocument);

    var file, sourceURI, saveAsType;
    // Find the URI object for aURL and the FileName/Extension to use when saving.
    // FileName/Extension will be ignored if aChosenData supplied.
    
	//Make uri for source
	var source_fileInfo = new FileInfo(aDefaultFileName);
	initFileInfo(source_fileInfo, aURL, null, null, null, null);
	var sourceURI = source_fileInfo.uri;
		
	//Make uri and file for target
	var target_fileInfo = new FileInfo(aDefaultFileName);
	initFileInfo(target_fileInfo, aURL, null, null, null, null);
	target_fileInfo.fileExt = aExt;
	target_fileInfo.fileBaseName = aBaseName;
	target_fileInfo.fileName=target_fileInfo.fileBaseName;
		
		 
		var fpParams = {
	    	fileInfo: target_fileInfo,
	    	file:null,
	    	saveMode: saveMode,
	    	fileURL:null,
	    	isDocument: true
	    };
		

    // Find a URI to use for determining last-downloaded-to directory
    var relatedURI = null;
    var aReferrer = null;
    
    
    if (aLocation != null && aLocation.length>0 && aLocation != "null") {
    	var folder = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsIFile);
		folder.initWithPath(aLocation);
		file = folder.clone();
		file.append(target_fileInfo.fileBaseName+"."+aExt);
    	continueSave();
    	
    } else {
    	
      promiseTargetFile(fpParams, aSkipPrompt, relatedURI).then(aDialogAccepted => {
	      if (!aDialogAccepted)
	        return;
	
	      saveAsType = fpParams.saveAsType;
	      file = fpParams.file;
	
	        // trigger continueSave after a specific delay
	        var timer = Components.classes["@mozilla.org/timer;1"].createInstance(Components.interfaces.nsITimer);
	        
	        function timerDownloadback() {}
	        timerDownloadback.prototype = {
	          _finalize: function() {
	          },
	          observe: function(aTimer, aTopic, aData) {
	            continueSave();
	          }
	        };
	        
	        timer.init(new timerDownloadback(), consecutive, timer.TYPE_ONE_SHOT);
	        
	    }).then(null, Components.utils.reportError);

    }
    
    
    function continueSave() {
      // If we're saving a document, and are saving either in complete mode or
      // as converted text, pass the document to the web browser persist component.
      // If we're just saving the HTML (second option in the list), send only the URI.

        
      var persistArgs = {
        sourceURI         : sourceURI,
        sourceReferrer    : aReferrer,
        sourceDocument    : null,
        targetContentType : null,
        targetFile        : file,
        sourceCacheKey    : aCacheKey,
        sourcePostData    : null,
        bypassCache       : aShouldBypassCache,
        initiatingWindow  : window
      };

      // Start the actual save process
      internalPersist(persistArgs);
    }
    
		
	}
};

CacheDownload.Locale = {

	getString: function (locale, key_p, param0_p, param1_p, param2_p) {
		var result = key_p;
		try {
			result = locale.getString(key_p);
		} catch (error) {}
		
		//There is probably a better way :)
		if (param0_p != null && param0_p != undefined) {
			result=result.replace(/\{0\}/g, param0_p);
		}
		if (param1_p != null && param1_p != undefined) {
			result=result.replace(/\{1\}/g, param1_p);
		}
		if (param2_p != null && param2_p != undefined) {
			result=result.replace(/\{2\}/g, param2_p);
		}
		return result;
	}
	
}; 

CacheDownload.ListViewUtils = {

	ContentListener : function () {
		this.fCallback = null;
		this.objects = null;
		this.init = function() {
			this.objects = new Array();
		};
		
		this.clear = function() {
			while (this.objects.length > 0) {
			    this.objects.pop();
			}
			if (this.fCallback != null) {
				this.fCallback.updateContents();
			}
		};
		
		this.add = function (object) {
			this.objects.push(object);
			if (this.fCallback != null) {
				this.fCallback.updateContent(object);
			}
		};
	}
};



CacheDownload.CacheManager = {

	onClearCache: function(event) {
			try {
				var cacheService = Components.classes["@mozilla.org/netwerk/cache-storage-service;1"].getService(Components.interfaces.nsICacheStorageService);
				cacheService.clear();
					new Notification("Cache Download", {
		        	  body: 'Cache has been cleared', 
		        	  icon: "chrome://cachedownload/skin/icon24b.png"
		          });
			        
			} catch(er) {
				new Notification("Cache Download", {
		        	  body: 'An error occured while clearing cache', 
		        	  icon: "chrome://cachedownload/skin/icon24b.png"
		          });
				
			}
			event.stopPropagation(); 
	}
};




CacheDownload.AnalyseParser = {
	
	VERSION : 1000,
	
	//A small langage parser based on simple graph
	AP_Empty 	: { id:"AP_Empty", 		matche: function (chr) { return true; } },
	AP_String 	: { id:"AP_String", 	matche: function (chr) { return /[\w :;_0-9\-'"\.àáâãäåçèéêëìíîïðòóôõöùúûüýÿ]/.test(chr); } },
	AP_Quote 	: { id:"AP_Quote", 		matche: function (chr) { return chr=="\'"; } },
	AP_Dollar 	: { id:"AP_Dollar", 	matche: function (chr) { return chr=="$"; } },
	AP_Number 	: { id:"AP_Number", 	matche: function (chr) { return /\d/.test(chr); } },
	AP_Porcent 	: { id:"AP_Porcent", 	matche: function (chr) { return chr=="%"; } },
	AP_DotComma : { id:"AP_DotComma", 	matche: function (chr) { return chr==";"; } },
	AP_Comma 	: { id:"AP_Comma", 		matche: function (chr) { return chr==","; } },
	AP_OpenPar 	: { id:"AP_OpenPar", 	matche: function (chr) { return chr=="("; } },
	AP_ClosePar : { id:"AP_ClosePar", 	matche: function (chr) { return chr==")"; } },
	
	ST_I 	: { id:"ST_I"},
	ST_ES 	: { id:"ST_ES"},
	ST_E 	: { id:"ST_E" },
	ST_S 	: { id:"ST_S"},
	ST_N 	: { id:"ST_N" },
	ST_MC 	: { id:"ST_MC" },
	ST_M 	: { id:"ST_M" },
	ST_F 	: { id:"ST_F" },
	ST_FINISH : { id:"ST_FINISH" },
	
	lexicalQuotes : [],
	lexicalStates : [],
	initialized: false,
	
	INSPECT_ALL_VALID : 0000,
	INSPECT_UNKNOWN_VARIABLE : 0001,
	INSPECT_UNKNOWN_FUNCTION : 0002,
	INSPECT_DIFFERENT_EXPRESSION_AFTER_PARSING : 0004,
	
	initializeLangage: function AP_initializeLangage() {
		if (this.initialized) {
			return;
		}
		this.lexicalQuotes = [];
		
		//Create a map<quoteId,quote>
		this.lexicalQuotes[this.AP_Empty.id] = this.AP_Empty;
		this.lexicalQuotes[this.AP_String.id] = this.AP_String;
		this.lexicalQuotes[this.AP_Quote.id] = this.AP_Quote;
		this.lexicalQuotes[this.AP_Dollar.id] = this.AP_Dollar;
		this.lexicalQuotes[this.AP_Number.id] = this.AP_Number;
		this.lexicalQuotes[this.AP_Porcent.id] = this.AP_Porcent;
		this.lexicalQuotes[this.AP_DotComma.id] = this.AP_DotComma;
		this.lexicalQuotes[this.AP_Comma.id] = this.AP_Comma;
		this.lexicalQuotes[this.AP_OpenPar.id] = this.AP_OpenPar;
		this.lexicalQuotes[this.AP_ClosePar.id] = this.AP_ClosePar;
		
		
		//Create a map<stateId,map<quoteId,stateId>> (langage automaton definition)
		
		//Initial state
		this.lexicalStates[this.ST_I.id]=[]; 
		this.lexicalStates[this.ST_I.id][this.AP_Empty.id]=this.ST_ES.id;
		
		//Expressions state
		this.lexicalStates[this.ST_ES.id]=[]; 
		this.lexicalStates[this.ST_ES.id][this.AP_DotComma.id]=this.ST_ES.id;
		this.lexicalStates[this.ST_ES.id][this.AP_Empty.id]=this.ST_E.id;
		
		//Expression state
		this.lexicalStates[this.ST_E.id]=[]; 
		this.lexicalStates[this.ST_E.id][this.AP_Quote.id]=this.ST_S.id;
		this.lexicalStates[this.ST_E.id][this.AP_Number.id]=this.ST_N.id;
		this.lexicalStates[this.ST_E.id][this.AP_Porcent.id]=this.ST_MC.id;
		this.lexicalStates[this.ST_E.id][this.AP_Dollar.id]=this.ST_F.id;
		this.lexicalStates[this.ST_E.id][this.AP_String.id]=this.ST_S.id;
		
		//String state
		this.lexicalStates[this.ST_S.id]=[]; 
		this.lexicalStates[this.ST_S.id][this.AP_String.id]=this.ST_S.id;
		this.lexicalStates[this.ST_S.id][this.AP_Quote.id]=this.ST_FINISH.id;		
	
		//Number state
		this.lexicalStates[this.ST_N.id]=[]; 
		this.lexicalStates[this.ST_N.id][this.AP_Number.id]=this.ST_N.id;
		this.lexicalStates[this.ST_N.id][this.AP_Empty.id]=this.ST_FINISH.id;	
		
		//Variable state
		this.lexicalStates[this.ST_MC.id]=[]; 
		this.lexicalStates[this.ST_MC.id][this.AP_String.id]=this.ST_M.id;
		this.lexicalStates[this.ST_MC.id][this.AP_Porcent.id]=this.ST_FINISH.id;
		
		//Word state
		this.lexicalStates[this.ST_M.id]=[]; 
		this.lexicalStates[this.ST_M.id][this.AP_String.id]=this.ST_M.id;
		this.lexicalStates[this.ST_M.id][this.AP_Empty.id]=this.ST_FINISH.id;	
		
		//Function state
		this.lexicalStates[this.ST_F.id]=[]; 
		this.lexicalStates[this.ST_F.id][this.AP_OpenPar.id]=this.ST_E.id;
		this.lexicalStates[this.ST_F.id][this.AP_Comma.id]=this.ST_E.id;
		this.lexicalStates[this.ST_F.id][this.AP_String.id]=this.ST_M.id;
		this.lexicalStates[this.ST_F.id][this.AP_ClosePar.id]=this.ST_FINISH.id;

		//Empty state
		this.lexicalStates[this.ST_FINISH.id]=[]; 
		this.lexicalStates[this.ST_FINISH.id][this.AP_Empty.id]=this.ST_FINISH.id;
		
		this.initialized=true;
	}, 

	LexemeValue: function(type_p, initialValue) {
	
		this.type = type_p;
		this.value = initialValue;
		
		this.getInitialValue = function(type_p, initialValue) {
			return initialValue;
		};
		
		this.push = function(lexemeValue) {
			if (this.type == CacheDownload.SharedObjects.TYPE_STRING && lexemeValue.type == CacheDownload.SharedObjects.TYPE_STRING) {
				this.value = this.value + lexemeValue.value;
			
			} else if (this.type == CacheDownload.SharedObjects.TYPE_INTEGER && lexemeValue.type == CacheDownload.SharedObjects.TYPE_INTEGER) {
				this.value = this.value * 1 + lexemeValue.value * 1;
			
			} else if (this.type == CacheDownload.SharedObjects.TYPE_INTEGER && lexemeValue.type == CacheDownload.SharedObjects.TYPE_STRING) {
				this.value = this.value * 1 + lexemeValue.value;
			
			} else if (this.type == CacheDownload.SharedObjects.TYPE_STRING && lexemeValue.type == CacheDownload.SharedObjects.TYPE_INTEGER) {
				this.value = this.value + lexemeValue.value * 1;
				
			} else if (this.type == CacheDownload.SharedObjects.TYPE_XUL_ELEMENT && lexemeValue.type == CacheDownload.SharedObjects.TYPE_XUL_ELEMENT) {
				this.value = lexemeValue.value;
				
			}
		};
	},
	
	Lexeme: function(id, keyword) {
	
		this.id = id;
		this.keyword = keyword;
		this.parent = null;
		this.childs = [];
		this.toString = function() { return this.id + ":"+this.keyword +"\n"; };
		
		this.toString2 = function(chr) { 
			var s = chr+"-"+this.toString();
			chr = chr+" ";
			if (this.childs!=null) {
				for(var i=0; i < this.childs.length; i++) {
					s+=this.childs[i].toString2(chr);
				}
			}
			return s; 
		};
		
        this.toCompleteExpression = function() {
            var s = "";
           
            if (this.id == "ST_S") {
                s+=this.keyword;
            } else if (this.id == "ST_N") {
                s+=this.keyword;
            } else if (this.id == "ST_MC") {
                s+="%";
                s+=this.keyword;
            } else if (this.id == "ST_M") {
                s+=this.keyword;
            } else if (this.id == "ST_F") {
                s+=this.keyword;
				if (this.childs!=null) {
					if (this.childs.length>0) {
						s+=this.childs[0].toCompleteExpression();
						s+="(";
						for(var i=1; i < this.childs.length; i++) {
							s+=this.childs[i].toCompleteExpression();
							 if (this.id == "ST_F" && i < this.childs.length-1) {
								s+=",";
							}
						}
						s+=")";
					}
				}
				return s;
			
            }
           
            if (this.childs!=null) {
                for(var i=0; i < this.childs.length; i++) {
                    s+=this.childs[i].toCompleteExpression();
                }
            }
            if (this.id == "ST_MC") {
                s+="%";
            }
            return s;
        };
	},
	
	getVariableValue: function(variableDefinition_p, type, rule, entryValue) {
		if ("url" == variableDefinition_p.key) {
			var value = (entryValue == null ? variableDefinition_p.key : entryValue.uri.prePath+entryValue.uri.path);
			return new CacheDownload.AnalyseParser.LexemeValue(variableDefinition_p.type, value);
			
		} else if ("filename" == variableDefinition_p.key) {
			var value = (entryValue == null ? variableDefinition_p.key : entryValue.filename);
			return new CacheDownload.AnalyseParser.LexemeValue(variableDefinition_p.type, value);
			
		} else if ("size" == variableDefinition_p.key) {
			var value = (entryValue == null ? 0 : entryValue.dataSize);
			return new CacheDownload.AnalyseParser.LexemeValue(variableDefinition_p.type, value);
			
		} else if ("lastModifiedDate" == variableDefinition_p.key) {
			return new CacheDownload.AnalyseParser.LexemeValue(variableDefinition_p.type, entryValue.lastModifiedDate);
			
		} else if ("ext" == variableDefinition_p.key) {
			var value = (entryValue == null ? variableDefinition_p.key : entryValue.getExtension());
			return new CacheDownload.AnalyseParser.LexemeValue(variableDefinition_p.type, value);
		
		} else if ("baseFilename" == variableDefinition_p.key) {
			var value = (entryValue == null ? variableDefinition_p.key : entryValue.getBaseFilename());
			return new CacheDownload.AnalyseParser.LexemeValue(variableDefinition_p.type, value);
		}
		
		return new CacheDownload.AnalyseParser.LexemeValue(variableDefinition_p.type, CacheDownload.SharedObjects.getDefaultValue(variableDefinition_p.type));
	},
	
	getFunctionValue: function(functionDefinition_p, type, childs, rule, entryValue) {
		if ("add" == functionDefinition_p.key) {
			var value = 0;
			for(var i=0; i < childs.length; i++) {
				value = value + childs[i].value;
			}
			return new CacheDownload.AnalyseParser.LexemeValue(CacheDownload.SharedObjects.TYPE_INTEGER, value);
			
		} else if ("mult" == functionDefinition_p.key) {
			var value =1;
			for(var i=0; i < childs.length; i++) {
				value = value * childs[i].value;
			}
			return new CacheDownload.AnalyseParser.LexemeValue(CacheDownload.SharedObjects.TYPE_INTEGER, value);
			
		} else if ("now" == functionDefinition_p.key) {
			var date = new Date();
			return new CacheDownload.AnalyseParser.LexemeValue(CacheDownload.SharedObjects.TYPE_INTEGER, date.getTime());
			
		} else if ("date" == functionDefinition_p.key) {
			var format = "YYYYmmddhhMMss";
			var date = new Date();
			if (childs.length>1){
				format = childs[1].value;
			}
			if (childs.length>0 && !isNaN(childs[0].value)){
				date.setTime(childs[0].value);
			}
			
			var result = format+"_";
			//where is the preg_remplace(patterns, replacements, string) ?
			result=result.replace(/YYYY/g, date.getFullYear());
			result=result.replace(/YY/g, ((date.getFullYear() % 100)<10?"0":"") +(date.getFullYear() % 100));
			result=result.replace(/m?m([^m])/g,  ((date.getMonth()+1)<10?"0":"") +(date.getMonth()+1) + "$1");
			result=result.replace(/d?d([^d])/g,  (date.getDate()<10?"0":"")+ date.getDate() + "$1");
			result=result.replace(/h?h([^h])/g,  (date.getHours()<10?"0":"") +date.getHours() + "$1");
			result=result.replace(/M?M([^M])/g,  (date.getMinutes()<10?"0":"")+ date.getMinutes() + "$1");
			result=result.replace(/s?s([^s])/g,  (date.getSeconds()<10?"0":"") +date.getSeconds() + "$1");
			result=result.replace(/w?w([^w])/g,  + (date.getDay()<10?"0":"")+ date.getDay() + "$1");
			result=result.replace(/[mdhMsw]/g, '0');
			
			result = result.substr(0, result.length-1);
			return new CacheDownload.AnalyseParser.LexemeValue(CacheDownload.SharedObjects.TYPE_STRING, result);
			
		} else if ("substring" == functionDefinition_p.key) {
			var result = "";
			var start = 0;
			if (childs.length>0){
				result = childs[0].value;
			}
			if (childs.length>2){
				start = childs[1].value;
				end = childs[2].value;
				result = result.substring(start, end);
				
			} else if (childs.length>1){
				start = childs[1].value;	
				result = result.substring(start);
			}
			
			return new CacheDownload.AnalyseParser.LexemeValue(CacheDownload.SharedObjects.TYPE_STRING, result);
			
		} else if ("uppercase" == functionDefinition_p.key) {
			var result = "";
			if (childs.length>0){
				result = childs[0].value;
			}
			result = result.toUpperCase();
			return new CacheDownload.AnalyseParser.LexemeValue(CacheDownload.SharedObjects.TYPE_STRING, result);
			
		} else if ("lowercase" == functionDefinition_p.key) {
			var result = "";
			if (childs.length>0){
				result = childs[0].value;
			}
			result = result.toLowerCase();
			return new CacheDownload.AnalyseParser.LexemeValue(CacheDownload.SharedObjects.TYPE_STRING, result);
			
		} else if ("trim" == functionDefinition_p.key) {
			var result = "";
			if (childs.length>0){
				result = childs[0].value;
			}
			result = result.trim();
			return new CacheDownload.AnalyseParser.LexemeValue(CacheDownload.SharedObjects.TYPE_STRING, result);
			
		} else if ("getTabByIndex" == functionDefinition_p.key) {
			var index = 0;
			if (childs.length>0){
				index = childs[0].value;
			}
			var result = CacheDownload.FileUtil.getTabByIndex(index);
			return new CacheDownload.AnalyseParser.LexemeValue(CacheDownload.SharedObjects.TYPE_XUL_ELEMENT, result);
			
		} else if ("getItemByClass" == functionDefinition_p.key) {
			var className = "";
			var tabDocument = "";
			var index = 0;
			if (childs.length>0){
				tabDocument = childs[0].value;
			}
			if (childs.length>1){
				className = childs[1].value;
			}
			if (childs.length>2){
				index = childs[2].value;
			}
			var result = CacheDownload.FileUtil.getItemByClass(tabDocument, className, index);
			return new CacheDownload.AnalyseParser.LexemeValue(CacheDownload.SharedObjects.TYPE_XUL_ELEMENT, result);
			
		} else if ("getItemById" == functionDefinition_p.key) {
			var id = "";
			var tabDocument = "";
			if (childs.length>0){
				tabDocument = childs[0].value;
			}
			if (childs.length>1){
				id = childs[1].value;
			}
			var result = CacheDownload.FileUtil.getItemById(tabDocument, id);
			return new CacheDownload.AnalyseParser.LexemeValue(CacheDownload.SharedObjects.TYPE_XUL_ELEMENT, result);
			
		} else if ("textContent" == functionDefinition_p.key) {
			var element = "";
			if (childs.length>0){
				element = childs[0].value;
			}
			var result = element.textContent;
			return new CacheDownload.AnalyseParser.LexemeValue(CacheDownload.SharedObjects.TYPE_STRING, result);
			
		} else if ("regexp" == functionDefinition_p.key) {
			var result = "";
			var motif = ".*";
			var flags = "";
			var index = 0;
			if (childs.length>0){
				result = childs[0].value;
			}
			if (childs.length>1){
				motif = childs[1].value;
			}
			if (childs.length>2){
				flags = childs[2].value;
			}
			if (childs.length>3 && !isNaN(childs[3].value)){
				index = childs[3].value;
			}
			var match = new RegExp(motif, flags);
			result = match.exec(result)[index];
			return new CacheDownload.AnalyseParser.LexemeValue(CacheDownload.SharedObjects.TYPE_STRING, result);
		}
		
		return new CacheDownload.AnalyseParser.LexemeValue(type, CacheDownload.SharedObjects.getDefaultValue(type));
	},
	
	log: function AP_init(string) {
		var aConsoleService = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);
		aConsoleService.logStringMessage(string);
	}, 
	
	merge: function AP_merge(childLexeme, parentLexeme) {
		//Merge a childLexeme keyword into its parent
		if (childLexeme.id == this.ST_M.id && parentLexeme.id == this.ST_M.id) {
			return true;
		}
		if (childLexeme.id == this.ST_N.id && parentLexeme.id == this.ST_N.id) {
			return true;
		}
		if (childLexeme.id == this.ST_S.id && parentLexeme.id == this.ST_S.id) {
			return true;
		}
		return false;
	},
	
	removeChildKeyword: function AP_ignoreParent(childLexeme, parentLexeme) {
		//Remove keyword of a child lexeme
		if (childLexeme.id == this.ST_E.id && parentLexeme.id == this.ST_F.id) {
			return true;
		}
		return false;
	},
	
	removeChild: function removeChild(childLexeme, parentLexeme) {
		//Remove first parameter expression if empty for a function without other parameters
		if (childLexeme.id == this.ST_E.id && parentLexeme.id == this.ST_F.id) {
			return parentLexeme.childs.length == 2 && (childLexeme.childs == null || childLexeme.childs.length == 0);
		}
		return false;
	},
	
	ignoreParentContent: function AP_merge(childLexeme, parentLexeme) {
		//Use the keyword of ST_M for a ST_MC, and not merge it to the keyword of MC
		if (childLexeme.id == this.ST_M.id && parentLexeme.id == this.ST_MC.id) {
			return true;
		}
		return false;
	},
	
	reduce: function AP_reduce(lexeme) {
		
		if (lexeme == null) {
			return lexeme;
		}
		
		var currentLexemes = [];
		currentLexemes.push(lexeme);
		
		var currentLexeme = null;
		var index=0;
		while (index<currentLexemes.length) {
			currentLexeme = currentLexemes[index];
			index++;
			
			for (var i=0;i<currentLexeme.childs.length;i++) {
				var child = currentLexeme.childs[i];
				currentLexemes.push(child);
			}
		}
		
		while (currentLexemes.length>0) {
			currentLexeme = currentLexemes.pop();
			
			if (this.removeChildKeyword(currentLexeme, currentLexeme.parent)) {
				currentLexeme.keyword="";
			}
			if (this.removeChild(currentLexeme, currentLexeme.parent)) {
				currentLexeme.parent.childs.splice(currentLexeme.parent.childs.indexOf(currentLexeme));
				
			} else if (this.ignoreParentContent(currentLexeme, currentLexeme.parent)) {
				currentLexeme.parent.keyword=currentLexeme.keyword;
				currentLexeme.parent.childs.splice(currentLexeme.parent.childs.indexOf(currentLexeme));
				
			} else if (this.merge(currentLexeme, currentLexeme.parent)) {
				currentLexeme.parent.keyword+=currentLexeme.keyword;
				currentLexeme.parent.childs.splice(currentLexeme.parent.childs.indexOf(currentLexeme));
			}
		}
		return lexeme;
	},
	
	evaluateAsString: function(string, rule, entryValue) {
		this.initializeLangage();
		var lexeme = this.lexical(string);
		this.reduce(lexeme);
		return this.evaluate(lexeme, CacheDownload.SharedObjects.TYPE_STRING, rule, entryValue);
	},
	
	inspectExpression: function (string, rule, entryValue) {
		var results = new Array();
		this.initializeLangage();
		var lexeme = this.lexical(string);
		this.reduce(lexeme);
		var result = lexeme.toCompleteExpression();
		
		if (string != result) {
			results.push(new CacheDownload.SharedObjects.KeyValue(CacheDownload.AnalyseParser.INSPECT_DIFFERENT_EXPRESSION_AFTER_PARSING, result));
			
		} else {
			var currentLexemes = [];
			currentLexemes.push(lexeme);
			var currentLexeme = null;
			var index=0;
			while (index<currentLexemes.length) {
				currentLexeme = currentLexemes[index];
				index++;
				for (var i=0;i<currentLexeme.childs.length;i++) {
					var child = currentLexeme.childs[i];
					currentLexemes.push(child);
				}
			}
			
			while (currentLexemes.length>0) {
				currentLexeme = currentLexemes.pop();
				
				if (currentLexeme.id == this.ST_MC.id) {
					var variableDefinition = rule.getVariable(currentLexeme.keyword);
					if (variableDefinition == null) {
						results.push(new CacheDownload.SharedObjects.KeyValue(CacheDownload.AnalyseParser.INSPECT_UNKNOWN_VARIABLE, currentLexeme.keyword));
					}
					
				} else if (currentLexeme.id == this.ST_F.id) {
					if (currentLexeme.childs.length>0) {
						var functionDefinition = rule.getFunction(currentLexeme.childs[0].keyword);
						if (functionDefinition == null) {
							results.push(new CacheDownload.SharedObjects.KeyValue(CacheDownload.AnalyseParser.INSPECT_UNKNOWN_FUNCTION, currentLexeme.childs[0].keyword));
						}
					}
				}
			}
		}
		
		if (results.length == 0) {
			results.push(new CacheDownload.SharedObjects.KeyValue(CacheDownload.AnalyseParser.INSPECT_ALL_VALID, string));
		}
		return results;
	},
	
	evaluate: function (lexeme, type, rule, entryValue) {
        var array=this.evaluateLexeme(lexeme, type, rule, entryValue);
		return array.value;
	},
	
	evaluateLexeme: function (lexeme, type, rule, entryValue) {
		var value = new CacheDownload.AnalyseParser.LexemeValue(type, CacheDownload.SharedObjects.getDefaultValue(type));
		
		try {
        if (lexeme.id == this.ST_I.id || lexeme.id == this.ST_ES.id || lexeme.id == this.ST_E.id) {
			for(var i=0; i < lexeme.childs.length; i++) {
                value.push(this.evaluateLexeme(lexeme.childs[i], type, rule, entryValue));
            }
			
        } else if (lexeme.id == this.ST_S.id) {
            value.push(new CacheDownload.AnalyseParser.LexemeValue(CacheDownload.SharedObjects.TYPE_STRING, lexeme.keyword));
			
        } else if (lexeme.id == this.ST_N.id) {
            value.push(new CacheDownload.AnalyseParser.LexemeValue(CacheDownload.SharedObjects.TYPE_INTEGER, lexeme.keyword));
			
        } else if (lexeme.id == this.ST_MC.id) {
			var variableDefinition = rule.getVariable(lexeme.keyword);
            value.push(this.getVariableValue(variableDefinition, type, rule, entryValue));
			
        } else if (lexeme.id == this.ST_M.id) {
            value.push(new CacheDownload.AnalyseParser.LexemeValue(CacheDownload.SharedObjects.TYPE_STRING, lexeme.keyword));
			
        } else if (lexeme.id == this.ST_F.id) {
			if (lexeme.childs.length>0) {
				var func = this.evaluateLexeme(lexeme.childs[0], CacheDownload.SharedObjects.TYPE_STRING, rule, entryValue);
				var functionDefinition = rule.getFunction(func.value);
				var childs = new Array();
				for(var i=1; i < lexeme.childs.length; i++) {
					var child = this.evaluateLexeme(lexeme.childs[i], functionDefinition.getType(i-1), rule, entryValue);
					childs.push(child);
				}
				value.push(this.getFunctionValue(functionDefinition, type, childs, rule, entryValue));
			}
        }
		
		} catch(e) {
		}
        return value;
	},
	
	lexical: function AP_lexical(string) {
		var lexicalLexemes = [];
		var previousLexeme = null;
		var initLexeme = new CacheDownload.AnalyseParser.Lexeme(this.ST_I.id, "INIT");
		var indexString = 0;
		
		var currentLexeme = initLexeme;
		lexicalLexemes.push(initLexeme);
		var cycle=0;
		
		while (currentLexeme != null && cycle<10000) {
			cycle = cycle + 1;
			var currentChar = string.charAt(indexString);
			var currentStateId = currentLexeme.id;
			
			//Remove the finish
			if (currentLexeme.id==this.ST_FINISH.id) {
				var parentLexeme = currentLexeme.parent;
				parentLexeme.childs.splice(parentLexeme.childs.indexOf(currentLexeme));
				currentLexeme = parentLexeme.parent;
				continue;
			}
			
			//Find a match
			var matchedQuote = null;
			var nextStateId = null;
			for (var currentQuoteId in this.lexicalStates[currentStateId]) {
				var currentQuote = this.lexicalQuotes[currentQuoteId];
				if (currentQuote.matche(currentChar)) {
					//this.log("Match : "+currentChar+" by "+currentQuoteId+"("+currentStateId+")");
					var tmpNextStateId = this.lexicalStates[currentStateId][currentQuoteId];
					nextStateId=tmpNextStateId;
					matchedQuote = currentQuote;
					break;
				}
			}
			
			if (matchedQuote==null) {
				currentLexeme = currentLexeme.parent;
				
			} else {
				var loggedChar = "";
				if (matchedQuote != this.AP_Empty) {
					indexString++;
					loggedChar = currentChar;
				}
				
				var lexeme = new CacheDownload.AnalyseParser.Lexeme(nextStateId, loggedChar);
				if (previousLexeme != null && previousLexeme.parent == currentLexeme && previousLexeme.keyword==lexeme.keyword && previousLexeme.id==lexeme.id) {
					previousLexeme.parent.childs.splice(previousLexeme.parent.childs.indexOf(previousLexeme));
					return initLexeme;
				}
				currentLexeme.childs.push(lexeme);
				lexeme.parent=currentLexeme;
				currentLexeme = lexeme;
				previousLexeme = lexeme;
			}
			
		}
		
		return initLexeme;
	}
	
	
};






CacheDownload.CacheBrowser={
		result : null,
		listener : null,
		match: null,
		
		onLoad: function() {
		},
		
		onDialogCancel: function() {
		}, 
		
		onDialogAccept: function() {
			this.result["status"]=true;
		},
		
		getLocale: function() {
			return document.getElementById("cachedownload.options.strings");
		},
		
		onBrowseCache: function(event) {
			let result = {};
			CacheDownload.CacheBrowser.match = new RegExp(".*", "g");
			CacheDownload.CacheBrowser.listener = new CacheDownload.ListViewUtils.ContentListener();
			CacheDownload.CacheBrowser.listener.init();
			
			CacheDownload.CacheVisitor.triggerVisit(CacheDownload.CacheBrowser);
			openDialog("chrome://cachedownload/content/cache-browse-view.xul", null, 'chrome,titlebar,centerscreen,modal', CacheDownload.CacheBrowser.listener, result);
		}, 
		
		beforeVisitEntries: function() {
		},
		
		afterVisitEntries: function() {
		},
		
		visitEntry: function (aEntryValue) {
				try {
					CacheDownload.CacheBrowser.listener.add(aEntryValue);
				} catch(e) {
				}
		},

		onClearCache: function() {
			CacheDownload.CacheManager.onClearCache();
		}
		
};




