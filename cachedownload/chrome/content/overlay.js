function Lexeme(id, keyword) {
	this.id = id;
	this.keyword = keyword;
	this.parent = null;
	this.childs = [];
	this.toString = function() { return this.id + ":"+this.keyword +"\n"; };
	
	this.toString2 = function(chr) { 
		var s = chr+"-"+this.toString()+"";
		chr = chr+" ";
		if (this.childs!=null) {
		for(var i=0; i < this.childs.length; i++) {
			s+=this.childs[i].toString2(chr);
		}
		}
		return s; 
	};
};

var AnalyseParser={
	
	AP_Empty 	: { id:"AP_Empty", 		matche: function (chr) { return true; } },
	AP_String 	: { id:"AP_String", 	matche: function (chr) { return /\w/.test(chr); } },
	AP_Quote 	: { id:"AP_Quote", 		matche: function (chr) { return chr=="\'"; } },
	AP_Dollar 	: { id:"AP_Dollar", 	matche: function (chr) { return chr=="$"; } },
	AP_Number 	: { id:"AP_Number", 	matche: function (chr) { return /\d/.test(chr); } },
	AP_Porcent 	: { id:"AP_Porcent", 	matche: function (chr) { return chr=="%"; } },
	AP_DotComma : { id:"AP_DotComma", 	matche: function (chr) { return chr==";"; } },
	AP_Comma 	: { id:"AP_Comma", 		matche: function (chr) { return chr==","; } },
	AP_OpenPar 	: { id:"AP_OpenPar", 	matche: function (chr) { return chr=="("; } },
	AP_ClosePar : { id:"AP_ClosePar", 	matche: function (chr) { return chr==")"; } },
	AP_White 	: { id:"AP_White", 		matche: function (chr) { return chr==")"; } },
	
	ST_I 	: { id:"ST_I" },
	ST_ES 	: { id:"ST_ES" },
	ST_E 	: { id:"ST_E" },
	ST_S 	: { id:"ST_S" },
	ST_N 	: { id:"ST_N" },
	ST_MC 	: { id:"ST_MC" },
	ST_M 	: { id:"ST_M" },
	ST_F 	: { id:"ST_F" },
	ST_PS 	: { id:"ST_PS" },
	ST_FINISH : { id:"ST_FINISH" },
	
	lexicalQuotes : [],
	lexicalStates : [],
	
	initializeLangage: function AP_initializeLangage() {
		
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
		this.lexicalStates[this.ST_I.id]=[]; 
		this.lexicalStates[this.ST_I.id][this.AP_Empty.id]=this.ST_ES.id;
		
		this.lexicalStates[this.ST_ES.id]=[]; 
		this.lexicalStates[this.ST_ES.id][this.AP_DotComma.id]=this.ST_ES.id;
		this.lexicalStates[this.ST_ES.id][this.AP_Empty.id]=this.ST_E.id;
		
		this.lexicalStates[this.ST_E.id]=[]; 
		this.lexicalStates[this.ST_E.id][this.AP_Quote.id]=this.ST_S.id;
		this.lexicalStates[this.ST_E.id][this.AP_Number.id]=this.ST_N.id;
		this.lexicalStates[this.ST_E.id][this.AP_Porcent.id]=this.ST_MC.id;
		this.lexicalStates[this.ST_E.id][this.AP_Dollar.id]=this.ST_F.id;
		
		this.lexicalStates[this.ST_S.id]=[]; 
		this.lexicalStates[this.ST_S.id][this.AP_String.id]=this.ST_S.id;
		this.lexicalStates[this.ST_S.id][this.AP_Quote.id]=this.ST_FINISH.id;		
	
		this.lexicalStates[this.ST_N.id]=[]; 
		this.lexicalStates[this.ST_N.id][this.AP_Number.id]=this.ST_N.id;
		this.lexicalStates[this.ST_N.id][this.AP_Empty.id]=this.ST_FINISH.id;	
		
		this.lexicalStates[this.ST_MC.id]=[]; 
		this.lexicalStates[this.ST_MC.id][this.AP_Empty.id]=this.ST_M.id;
		
		this.lexicalStates[this.ST_M.id]=[]; 
		this.lexicalStates[this.ST_M.id][this.AP_String.id]=this.ST_M.id;
		this.lexicalStates[this.ST_M.id][this.AP_Empty.id]=this.ST_FINISH.id;	
		
		this.lexicalStates[this.ST_F.id]=[]; 
		this.lexicalStates[this.ST_F.id][this.AP_OpenPar.id]=this.ST_PS.id;
		this.lexicalStates[this.ST_F.id][this.AP_String.id]=this.ST_M.id;
		
		this.lexicalStates[this.ST_PS.id]=[]; 
		this.lexicalStates[this.ST_PS.id][this.AP_Comma.id]=this.ST_PS.id;
		this.lexicalStates[this.ST_PS.id][this.AP_ClosePar.id]=this.ST_FINISH.id;
		this.lexicalStates[this.ST_PS.id][this.AP_Empty.id]=this.ST_E.id;
		
		this.lexicalStates[this.ST_FINISH.id]=[]; 
		this.lexicalStates[this.ST_FINISH.id][this.AP_Empty.id]=this.ST_FINISH.id;
		
	}, 
	
	log: function AP_init(string) {
		var aConsoleService = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);
		//alert(string);
		aConsoleService.logStringMessage(string);
	}, 
	
	init: function AP_init() {
		this.initializeLangage();
		
		var lexeme = null;
		//var string = "$(11)popo";
		//this.lexical(string);
		
		string = "$concat($add($mult(15,12),0),$add(1,2))";//string = "$ct(1))";
		this.log(string);
		lexeme = this.lexical(string);
		//lexeme = this.lexical(string);
		if (lexeme!=null) {
			this.reduce(lexeme);
			this.evaluate(lexeme);
		}
		
		/*
		this.log(string);
		lexeme = this.lexical(string);
		if (lexeme!=null) {
			this.evaluate(lexeme);
		}
		*/
	},
	
	merge: function AP_merge(lex1, lex2) {
		if (lex1.id == this.ST_M.id && lex2.id == this.ST_M.id) {
			return true;
		}
		if (lex1.id == this.ST_N.id && lex2.id == this.ST_N.id) {
			return true;
		}
		return false;
	},
	
	reduce: function AP_lexical(lexeme) {
		
	},
	
	evaluate: function AP_lexical(lexeme) {
		this.log(lexeme.toString2(""));
	},
	
	lexical: function AP_lexical(string) {
		var lexicalLexemes = [];
		var previousLexeme = null;
		var initLexeme = new Lexeme(this.ST_I.id, "INIT");
		var indexString = 0;
		
		var currentLexeme = initLexeme;
		lexicalLexemes.push(initLexeme);
		//this.log("start"+lexicalLexemes);
		while (currentLexeme != null) {
			
			var currentChar = string.charAt(indexString);
			var currentStateId = currentLexeme.id;
			
			//this.log("All:\n"+initLexeme.toString2("")+"\n"+"Current:"+currentLexeme.id+"\n");
			
			if (currentLexeme.id==this.ST_FINISH.id) {
				//Remove the finish
				var parentLexeme = currentLexeme.parent;
				parentLexeme.childs.splice(parentLexeme.childs.indexOf(currentLexeme));
				
				//Merge parents if necessary
				currentLexeme = parentLexeme.parent;
				
				//parentLexeme = currentLexeme.parent;
				//if (parentLexeme!=undefined && currentLexeme!=undefined && this.merge(currentLexeme, parentLexeme) && parentLexeme.childs.indexOf(currentLexeme)>=0) {
				//	parentLexeme.keyword+=currentLexeme.keyword;
				//	parentLexeme.childs.splice(parentLexeme.childs.indexOf(currentLexeme));
				//}
				//currentLexeme = parentLexeme;
				//alert("nextLoop");
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
					loggedChar = currentChar
				}
				
				//this.log("Match: Create a new lexeme:" + nextStateId + ";"+loggedChar);
				var lexeme = new Lexeme(nextStateId, loggedChar);
				if (previousLexeme != null && previousLexeme.parent == currentLexeme && previousLexeme.keyword==lexeme.keyword && previousLexeme.id==lexeme.id) {
					//alert("end");	
					previousLexeme.parent.childs.splice(previousLexeme.parent.childs.indexOf(previousLexeme));
					return initLexeme;
				}
				currentLexeme.childs.push(lexeme);
				lexeme.parent=currentLexeme;
				currentLexeme = lexeme;
				previousLexeme = lexeme;
			}
			
			//alert("nextLoop");
		}
		
		return initLexeme;
	}
	
};


function PrefListener(branchName, func) {  
    var prefService = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService);  
    var branch = prefService.getBranch(branchName);
    branch.QueryInterface(Components.interfaces.nsIPrefBranch2);  

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
}



var CacheDownloadUtil={

	getFirstTabItemClass: function CV_getFirstTab(className) {
		
			var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator);
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

		getFirstItemWithClass: function CV_getFirstItem(document, className) {
		
			var attr = document.evaluate("//*[@class='"+className+"']", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null );
			if (attr!=null) {
				if (attr.singleNodeValue!=null) {
					attr=attr.singleNodeValue.textContent;
				}
		    }
			return attr;
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
};

const TYPE_DIRECT = 0;
const TYPE_CLASS = 1;
const TYPE_TEST = 2;

function Info(title_p, type_p) {
	this.key = title_p;
	this.type = type_p;
	
	this.getValue = function() {
		if (this.type==TYPE_DIRECT) {
			return this.key;
		} else if (this.type==TYPE_CLASS) {
			return CacheDownloadUtil.getFirstTabItemClass(this.key);
		} else {
			return CacheDownloadUtil.getFirstTabItemClass(this.key);
		}
	}
	
}

function Match(title, regexp_p, fileNameData_p, infos_p) {
	this.match = regexp_p;
	this.fileNameData = fileNameData_p;
	this.infos = infos_p;
	
	this.exec = function(data) {
		return this.match.exec(data);
	};
	
	this.getFileName = function(file) {
		var aConsoleService = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);
		var fileName = this.fileNameData;
		//aConsoleService.logStringMessage("Start:"+fileName);
		
		var cDate = new Date();
	    var date=
	    	(cDate.getFullYear())+
	    	(cDate.getMonth() < 10 ? '0' + cDate.getMonth() : cDate.getMonth()) +
	    	(cDate.getDate() < 10 ? '0' + cDate.getDate() : cDate.getDate()) +
	    	(cDate.getHours() < 10 ? '0' + cDate.getHours() : cDate.getHours()) +
	    	(cDate.getMinutes() < 10 ? '0' + cDate.getMinutes() : cDate.getMinutes()) +
	    	(cDate.getSeconds() < 10 ? '0' + cDate.getSeconds() : cDate.getSeconds());
	    
	    this.infos["date"]=new Info(date,TYPE_DIRECT);
	    
		if (this.infos!=null) {
			for(var info in this.infos) {
				var value=this.infos[info].getValue();
				
//aConsoleService.logStringMessage("Before:key="+info+"\nvalue="+this.infos[info]+"\nvalueR="+value+"\nresult="+fileName);
				if (value!=null) {
					var reg = new RegExp("\\$"+info,"g");
					fileName=fileName.replace(reg, value);
					
//aConsoleService.logStringMessage("After:key="+info+"\nvalue="+this.infos[info]+"\nresult="+fileName);
					
				}
			}
		}

	    
		fileName=fileName.replace(/[éèêë]/g, "e");
		fileName=fileName.replace(/[ìîï]/g, "i");
		fileName=fileName.replace(/[àâä]/g, "a");
		fileName=fileName.replace(/[ùûü]/g, "u");
		fileName=fileName.replace(/[ç]/g, "c");
		fileName=fileName.replace(/\s/g, " ");
		fileName=fileName.replace(/[^a-zA-Z _0-9\(\)\-'"]/g, "");

		//aConsoleService.logStringMessage("Final:"+fileName);
		return fileName;
	}
	
};

function File(aEntryInfo, match) {
	this.key = aEntryInfo.key;
	this.size = aEntryInfo.dataSize;
	this.count = 1;
	this.visited = true;
	this.device = aEntryInfo.deviceID;
	this.isDownloaded = false;
	this.fileName = match.getFileName(this);
};


var CacheDownload={
	
	enabled:false,
	timer:null,
	matches:null,
	files:null,
	
	MAX_SAME:3,
	
	get _cacheService() {
		if (!this.__cacheService) {
			this.__cacheService = Components.classes["@mozilla.org/network/cache-service;1"].getService(Components.interfaces.nsICacheService);
		}
		return this.__cacheService;
	},
	__cacheService: null,
	
	get _dateService() {
		if (!this.__dateService) {
			this.__dateService = Components.classes["@mozilla.org/intl/scriptabledateformat;1"].getService(Components.interfaces.nsIScriptableDateFormat);
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
			AnalyseParser.init();    
		}
		/*
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
		*/
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
		
		var aConsoleService = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.
interfaces.nsIConsoleService);
		
		if (aEntryInfo.dataSize == 0)
			return true;
		
		if (aEntryInfo.key.indexOf("http") == 0) {
			
			if (this.matches==null) {
				this.observe();
			}
			if (this.files==null) {
				this.files=new Array();
			}
			
			
			for (i=0; i<this.matches.length; i++) {
				if (this.matches[i].exec(aEntryInfo.key)) {
					
					//Find index of key, -1 otherwise
					var index = -1;
					for (j=0; j<this.files.length;j++) {
						if (this.files[j]!=null && this.files[j].key==aEntryInfo.key) {
							index = j;
						}
					}
					//If not found, insert into array at an empty position
					if (index==-1) {
						//aConsoleService.logStringMessage("Match that : "+aEntryInfo.key);
						aConsoleService.logStringMessage("Add to files : "+aEntryInfo.key);
						
						var indexInsert = this.files.length;
						for (j=0; j<this.files.length;j++) {
							if (this.files[j]==null) {
								indexInsert=j;
							}
						}
						this.files[indexInsert]=new File(aEntryInfo, this.matches[i]);
						
						
					} else { //If found

						//If already downloaded
						if (this.files[index].isDownloaded)  {
							return true;
						}
						
						//aConsoleService.logStringMessage("Match that : "+aEntryInfo.key);
						
						this.files[index].visited=true;
						
						//If size is different, reset to new size
						if (this.files[index].size!=aEntryInfo.dataSize) {
							//aConsoleService.logStringMessage("Size different : "+aEntryInfo.key);
							this.files[index].size=aEntryInfo.dataSize;
							this.files[index].count=1;
						
						//If size is equals, wait 3 timer..
						} else if (this.files[index].count<this.MAX_SAME) {
							//aConsoleService.logStringMessage("Size equals : "+aEntryInfo.key);
							this.files[index].count++;
						} else {
							aConsoleService.logStringMessage("Download that : "+aEntryInfo.key);
						}
					}
					break;
				}
			}
		}
		return true;
	},
	
	beforeVisit: function CV_beforeVisit() {
		var aConsoleService = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);
		//aConsoleService.logStringMessage("beforeVisit");
		if (this.files==null) return;
		for (i=0; i<this.files.length; i++) {
			if (this.files[i]!=null) this.files[i].visited=false;
		}
	},
	
	afterVisit: function CV_afterVisit() {
		var aConsoleService = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);
		//aConsoleService.logStringMessage("afterVisit");
					
		if (this.files==null) return;
		for (i=0; i<this.files.length; i++) {
			
			//If item has been visited and count reached the max, download the item
			if (this.files[i]!=null && this.files[i].visited==true) {
				if (this.files[i].count==this.MAX_SAME) {
					aConsoleService.logStringMessage("Download that : "+this.files[i].key);
					this.saveCache(i);
				}
			}
		}
	},
	
	
	
	saveCache: function CV_saveCache(index) {
		var key = this.files[index].key;
		this.files[index].isDownloaded=true;
		
		//function saveURL(aURL, aFileName, aFilePickerTitleKey, aShouldBypassCache,
        //         aSkipPrompt, aReferrer)
		//saveURL(key, null, null, false, true);
		// internalSave(aURL, null, aFileName, null, null, aShouldBypassCache,
        //       aFilePickerTitleKey, null, aReferrer, aSkipPrompt);
		
		//function internalSave(aURL, aDocument, aDefaultFileName, aContentDisposition,
        //              aContentType, aShouldBypassCache, aFilePickerTitleKey,
        //              aChosenData, aReferrer, aSkipPrompt)
     
    	if (this.files[index].size<10) return;
     
    	var fileName = this.files[index].fileName;
    	
    	var aConsoleService = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);
		
		aConsoleService.logStringMessage("Download "+key+"\nto : "+fileName);
		
		CacheDownloadUtil.myInternalSave(key, fileName, "mp3");
		
		aConsoleService.logStringMessage("Saved to : "+fileName);
		
		//internalSave(key, null, null, null, null, false, null, auto, null, true);
	},
	
	linkPreferenceListener: function () {
		this._prefs = new PrefListener("extensions.cachedownload.", this.observe);  
		this._prefs.register();
	},
	
	unlinkPreferenceListener: function () {
		if (!this._prefs) return;
		this._prefs.unregister();
	}, 
	
	observe: function(branch, name) {
		this.matches=new Array();
		var infos = new Array();
		infos["author"]=new Info("player-currentArtist", TYPE_CLASS);
		infos["title"]=new Info("player-currentSong", TYPE_CLASS);
		this.matches[0]=new Match("Jiwa.fr", /jiwa\.fm\/play\.php/, "jiwa__$date__$author__$title", infos);
		
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
