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
			if (this.types instanceof Array) {
				if (index < this.types.length) {
					return this.types[index];
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
			//objects.push(new CacheDownload.SharedObjects.FunctionDefinition("add", CacheDownload.SharedObjects.TYPE_INTEGER));
			//objects.push(new CacheDownload.SharedObjects.FunctionDefinition("mult", CacheDownload.SharedObjects.TYPE_INTEGER));
			//objects.push(new CacheDownload.SharedObjects.FunctionDefinition("getTabByIndex", CacheDownload.SharedObjects.TYPE_XUL_TAB));
			//objects.push(new CacheDownload.SharedObjects.FunctionDefinition("getFirstItemByClass", CacheDownload.SharedObjects.TYPE_XUL_ELEMENT));
			//objects.push(new CacheDownload.SharedObjects.FunctionDefinition("getFirstItemById", CacheDownload.SharedObjects.TYPE_XUL_ELEMENT));
			//objects.push(new CacheDownload.SharedObjects.FunctionDefinition("getText", CacheDownload.SharedObjects.TYPE_STRING));
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
	
	EntryValue: function(aEntryInfo) {
		this.key = aEntryInfo.key;
		this.cacheEntry = aEntryInfo;
		this.value = aEntryInfo.key;
		this.filename = CacheDownload.FileUtil.getFileNameFromURL(aEntryInfo.key);
		this.size = aEntryInfo.dataSize;
		this.lastModifiedDate = aEntryInfo.lastModified;
		
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
	
	File: function (aEntryInfo, rule_p) {
		this.key = aEntryInfo.key;
		this.entryValue = new CacheDownload.SharedObjects.EntryValue(aEntryInfo);
		this.rule = rule_p;
		
		this.count = 1;
		this.visited = true;
		this.isDownloaded = false;

		this.evaluatedFilename = CacheDownload.FileUtil.evaluateExpressionAsFilename(this.rule.fileNameExpression, this.rule, this.entryValue);
		
		this.match = function(aEntryInfo) {
			return this.key == aEntryInfo.key;
		};
	}, 
};

CacheDownload.CacheVisitor = {
	cacheEntries : null,
	
	triggerVisit : function(callback) {
		var timer = Components.classes["@mozilla.org/timer;1"].createInstance(Components.interfaces.nsITimer);
		
		function timerVisit() {}
		timerVisitEntries.prototype = {
			_finalize: function() {
			},
			observe: function(aTimer, aTopic, aData) {
				if (CacheDownload.CacheVisitor.cacheEntries != null && CacheDownload.CacheVisitor.cacheEntries.length>0) {
					var aEntryInfo = CacheDownload.CacheVisitor.cacheEntries.shift();
					callback.visitEntry(aEntryInfo);
					timer.init(new timerVisitEntries(), 50, timer.TYPE_ONE_SHOT);
				} else {
					callback.afterVisitEntries();
				}
			}
		};
		
		function timerTriggerVisit() {}
		timerTriggerVisit.prototype = {
			_finalize: function() {
			},
			observe: function(aTimer, aTopic, aData) {
				CacheDownload.CacheVisitor.initVisit();
				callback.beforeVisitEntries();
				var cacheService = Components.classes["@mozilla.org/network/cache-service;1"].getService(Components.interfaces.nsICacheService);
				cacheService.visitEntries(CacheDownload.CacheVisitor);
				timer.init(new timerVisitEntries(), 50, timer.TYPE_ONE_SHOT);
			}
		};
		
		timer.init(new timerTriggerVisit(), 100, timer.TYPE_ONE_SHOT);
	},
	
	// ***** nsICacheVisitor *****
	initVisit: function () {
		this.cacheEntries = new Array();
	},
	
	// ***** nsICacheVisitor *****
	visitDevice: function (aDeviceID, aDeviceInfo) {
		return true;
	},
	
	visitEntry: function (aDeviceID, aEntryInfo) {
		this.cacheEntries.push(aEntryInfo);
		return true;
	},
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

		
		//Remove any weird characters
		expressionValue=expressionValue.replace(/\s/g, " ");
		expressionValue=expressionValue.replace(/[^\w _0-9\(\)\-'"\.àáâãäåçèéêëìíîïðòóôõöùúûüýÿ]/g, "");
		
		return expressionValue;
	},
	
	getFileNameFromURL: function CV_getFileNameFromURL(aURL) {
		var fileNameFromKey = aURL;
		var regSpearator = null;
		var segments = null;
		try {
			//tor cache-key fix
			regSpearator=new RegExp("uri=", "g");
			var segments =  fileNameFromKey.split(regSpearator);
			if (segments.length>1) {
				fileNameFromKey=segments[1];
			}
		} catch (ee) { }
		try {
			regSpearator = /^(\w+:\/)?\/?([^:\/\s]+)((\/[\w\-\.]+)*\/)([\w-\.]+)[^\/\$;:@&#?\s]?(.*)?$/;
			segments = regSpearator.exec(fileNameFromKey);
			if (segments.length>3) {
				fileNameFromKey = RegExp.$5;
			}
		} catch (ee) { }
		try {
			//remove ?=parameters
			regSpearator = new RegExp("[?]", "g");
			segments = fileNameFromKey.split(regSpearator);
			if (segments.length>0) {
				fileNameFromKey = segments[0];
			}
		} catch (ee) { }
		return fileNameFromKey;
	},
	
	getTabByIndex: function CV_getTabByIndex(index_p) {
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
	
	getFirstTabItemClass: function CV_getFirstTab(className) {
		var doc = this.getTabByIndex(0);
		if (doc != null) {
			var res = this.getFirstItemWithClass(doc, className);
			if (res != null) {
				return res;
			}
		}
		return null;
	}, 

	getFirstItemWithClass: function CV_getFirstItem(document, className) {
		var attr = document.evaluate("//*[@class='"+className+"']", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null );
		if (attr!=null) {
			if (attr.singleNodeValue!=null) {
				attr=attr.singleNodeValue.textContent;
			}
		}
		return attr;
	},
	
	myInternalSave : function CV_myInternalSave(aURL, aBaseName, consecutive)
	{
		//saveURL(aURL, aFileName, aFilePickerTitleKey, aShouldBypassCache, aSkipPrompt, aReferrer);
		//internalSave(aURL, null, aFileName, null, null, aShouldBypassCache, aFilePickerTitleKey, null, aReferrer, aSkipPrompt);
		//internalSave(aURL, aDocument, aDefaultFileName, aContentDisposition, aContentType, aShouldBypassCache, aFilePickerTitleKey, aChosenData, aReferrer, aSkipPrompt);
     
		var aConsoleService = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);
		
		var saveModeParam = 0x00; //SAVEMODE_FILEONLY ;//GetSaveModeForContentType(null);
		var saveAsType = kSaveAsType_Complete;
		var file, fileURL, fileCacheKey;
		 
		//Make uri for source
		var source_fileInfo = new FileInfo("default");
		initFileInfo(source_fileInfo, aURL, null, null, null, null);
	    
		var source = source_fileInfo.uri;
		
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
		
		//Make uri and file for target
		var target_fileInfo = new FileInfo("default");
		initFileInfo(target_fileInfo, aURL, null, null, null, null);
	    target_fileInfo.fileExt = aExt;
		target_fileInfo.fileBaseName = aBaseName;
		target_fileInfo.fileName=target_fileInfo.fileBaseName;
		 
		var fpParams = {
	    	fileInfo: target_fileInfo,
	    	file:null,
	    	saveMode: saveModeParam,
	    	fileURL:null,
	    	isDocument: true
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
			fileCacheKey : makeURI(aURL),
		    bypassCache : false
		};
		  
		var persist = makeWebBrowserPersist();
		
		// Calculate persist flags.
		const nsIWBP = Components.interfaces.nsIWebBrowserPersist;
		const flags = nsIWBP.PERSIST_FLAGS_REPLACE_EXISTING_FILES;
		persist.persistFlags = flags | nsIWBP.PERSIST_FLAGS_FROM_CACHE;
		  
		// Leave it to WebBrowserPersist to discover the encoding type:
		persist.persistFlags |= nsIWBP.PERSIST_FLAGS_AUTODETECT_APPLY_CONVERSION;
		
		// Create download and initiate it (below)
		var timer = Components.classes["@mozilla.org/timer;1"].createInstance(Components.interfaces.nsITimer);
		
		function timerDownloadback() {}
		timerDownloadback.prototype = {
			_finalize: function() {
			},
			observe: function(aTimer, aTopic, aData) {
				var transfer = Components.classes["@mozilla.org/transfer;1"].createInstance(Components.interfaces.nsITransfer);
				aConsoleService.logStringMessage("[cachedownload] save file: "+target_fileInfo.fileName+"."+target_fileInfo.fileExt);
				transfer.init(persistArgs.source, persistArgs.target, "", null, null, null, persist);
				persist.progressListener = new DownloadListener(window, transfer);
				persist.saveURI(persistArgs.source, persistArgs.fileCacheKey, null, persistArgs.postData, null, persistArgs.target);
			}
		};
		
		timer.init(new timerDownloadback(), consecutive, timer.TYPE_ONE_SHOT);
	}
};

CacheDownload.Locale = {

	getString: function (locale, key_p, param0_p, param1_p, param2_p) {
		var result = key_p;
		try {
			result = locale.getString(key_p);
		} catch (error) {}
		
		//There is probably a better way :)
		if (param0_p) {
			result=result.replace(/\{0\}/g, param0_p);
		}
		if (param1_p) {
			result=result.replace(/\{1\}/g, param1_p);
		}
		if (param2_p) {
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
		this.add = function (object) {
			this.objects.push(object);
			if (this.fCallback != null) {
				this.fCallback.updateContent(object);
			}
		};
	}
};

CacheDownload.AnalyseParser = {
	
	VERSION : 1000,
	
	//A small langage parser based on simple graph
	AP_Empty 	: { id:"AP_Empty", 		matche: function (chr) { return true; } },
	AP_String 	: { id:"AP_String", 	matche: function (chr) { return /[\w _0-9\-'"\.àáâãäåçèéêëìíîïðòóôõöùúûüýÿ]/.test(chr); } },
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
		if ("filename" == variableDefinition_p.key) {
			var value = (entryValue == null ? variableDefinition_p.key : entryValue.filename);
			return new CacheDownload.AnalyseParser.LexemeValue(variableDefinition_p.type, value);
			
		} else if ("size" == variableDefinition_p.key) {
			var value = (entryValue == null ? 100 : entryValue.size);
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
			if (childs.length>=2){
				format = childs[1].value;
			}
			if (childs.length>=1){
				date = childs[0].value;
			}
			
			var result = format;
			
			//where is the preg_remplace(patterns, replacements, string) ?
			result=result.replace(/YYYY/g, cDate.getFullYear());
			result=result.replace(/YY/g, (cDate.getFullYear() % 100));
			result=result.replace(/([^m])?m/g, $1 + cDate.getMonth());
			result=result.replace(/([^d])?d/g, $1 + cDate.getDate());
			result=result.replace(/([^h])?h/g, $1 + cDate.getHours());
			result=result.replace(/([^M])?M/g, $1 + cDate.getMinutes());
			result=result.replace(/([^s])?s/g, $1 + cDate.getSeconds());
			result=result.replace(/([^w])?w/g, $1 + cDate.getDay());
			result=result.replace(/[mdhMsw]/g, '0');
			
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

