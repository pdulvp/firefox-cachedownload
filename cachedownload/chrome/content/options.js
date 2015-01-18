Components.utils.import("resource://gre/modules/LoadContextInfo.jsm");
Components.utils.import("resource://gre/modules/FileUtils.jsm");

var CacheDownload = { }


CacheDownload.CacheView={
		objects   : null,
		treeRules : null,
		
		onLoad: function(arg0) {
			newInstall = false;
			var listener = arg0;
			this.objects = listener.objects;
			listener.fCallback = this;
			this.treeRules = document.getElementById("cachedownload-listView-tree");
			this.treeRules.treeBoxObject.view = this;
		},

		onDoubleClickElement: function() {
			document.getElementById("cachedownload-splitter-preview").setAttribute("state","open");

			  var image = document.getElementById("imgPreview");
			  image.src = null;
			    this.onDetectSelectionRule();
		}, 
		
		updateContents: function() {
		},
		
		updateContent: function(object) {
			this.treeBox.rowCountChanged(this.objects.length-1, 1);
		},


		openCacheElement: function() {
			var windowManager = Components.classes['@mozilla.org/appshell/window-mediator;1'].getService();
			var windowManagerInterface = windowManager.QueryInterface(Components.interfaces.nsIWindowMediator);
			var eb = windowManagerInterface.getEnumerator("navigator:browser");
			var mywindow = null;
			if (eb.hasMoreElements()) {
				mywindow = eb.getNext().QueryInterface(Components.interfaces.nsIDOMWindow);
			}
			var mybrowser = mywindow.getBrowser();
			
			mywindow.getBrowser().selectedTab = mybrowser.addTab(this.objects[this.treeRules.currentIndex].value);
		},
		
		saveCacheElement: function() {
			var entry = this.objects[this.treeRules.currentIndex];
			CacheDownload.FileUtil.myInternalSave(entry.key, entry.evaluatedFilename, null, CacheDownload.TIMER_DOWNLOAD_CONSECUTIVE, false);
		},
		
		// --------------------------------------------
	  // nsITreeView interface properties
	  treeSelection: null, // nsiTreeSelection
	  treeBox: null, // The tree
	  editedRowID: null, // The row currently being edited
	  
	  // Getters and Setters
	  set rowCount(i) { throw "rowCount is a readonly property"; },
	  get rowCount() { return this.objects.length; },
	  
	  set selection(s) { this.treeSelection = s; },
	  get selection() { return this.treeSelection; },
	  
	  // START nsITreeView interface methods
	  cycleHeader: function(columnID, element) {
	   
	  },
	  getCellText: function(row, column) {
		return this.objects[row][column.id];
	  },
	  
	  getImageSrc: function(rowIndex, column) {	
		return this.objects[rowIndex]["img_"+column.id]; },
	  isContainer: function(index) { return false; },
	  isSeparator: function(index) { return false; },
	  isSorted: function(index) { },
	  setTree: function(tree) { this.treeBox=tree; },
	  
	//canDropBeforeAfter: function(index, before) { return false; },
	//canDropOn : function(index) { return false; },
	//cycleCell : function(row, columnID) { },
	//drop: function(row, orientation) { return false; },
	//getCellValue: function(row, columnID) { /* return null; */ },
	//getLevel: function(index) { return 0; },
	//getParentIndex: function(rowIndex) { return 0; },
	//getProgressMode: function(rowIndex, columnID) { },
	//hasNextSibling: function(rowIndex, afterIndex) { return false; },
	//isContainerEmpty: function(index) { return false; },
	//isContainerOpen: function(index) { },
	//isEditable: function(rowIndex, columnID) { return false; },
	//performAction: function(action) { },
	//performActionOnCell: function(action, rowIndex, columnID) { },
	//performActionOnRow: function(action, rowIndex) { },
	//selectionChanged: function() { },
	//setCellText: function(rowIndex, columnID, value) { },
	//toggleOpenState: function(index) { },
	// END nsITreeView interface methods
	   
	  // --------------------------------------------
	   

	  onDetectSelectionRule: function() {
		  
		  if (this.treeRules != null && this.objects[this.treeRules.currentIndex] != null) {
			  
		  var image = document.getElementById("imgPreview");
		    let ios = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);
		    let url = "about:cachedownload?"+btoa(unescape(encodeURIComponent( this.objects[this.treeRules.currentIndex].key )));
		   
		    if (image.src != url) {
			    image.src = url;

				if (image.hasAttribute("style")) {
					image.removeAttribute("style");
				}
				image.onload = function() {
					CacheDownload.CacheView.resize();
				}
		    }
		  }
			
		}, 

		
		resize: function CV_resize(event) {
			var image = document.getElementById("imgPreview");
			var width = parseInt(window.getComputedStyle(image, "").width.replace("px", ""));
			var height = parseInt(window.getComputedStyle(image, "").height.replace("px", ""));
			
			var containerWidth = 200;
			var containerHeight = 160;
			
			if (width > containerWidth) {
				var ratio = containerWidth / width;
				width = containerWidth;
				height = height * ratio;
			}
			if (height > containerHeight) {
				var ratio = containerHeight / height;
				height = containerHeight;
				width = width * ratio;
			}

			if (image.hasAttribute("style")) {
				image.removeAttribute("style");
			}
			
			image.setAttribute("style", "width:"+width+"px;"+"height:"+height+"px;");
		},
		
		
		  onSelectRule: function() {
			
			}, 
			
		onDialogCancel: function() {
		
		}, 
		onDialogAccept: function() {
			if (this.treeRules.view.selection.getRangeCount()==0) {
				return false;
			}
			window.arguments[1]["index"]=this.treeRules.currentIndex;
			window.arguments[1]["data"]=this.objects[this.treeRules.currentIndex];
			return true;
		},
		
	};



CacheDownload.Options = {
	treeRules: null,
	listRules: null,
	buttonEdit: null,
	buttonDelete: null,
	
	rules: [],
	
	getRuleName: function(row) {
		return this.rules[row].id;
	}, 
	getRuleFileNameExpression: function(row) {
		return this.rules[row].fileNameExpression;
	},
	getDescription: function(row) {
		return this.rules[row].description;
	},
	getruleExpression: function(row) {
		return this.rules[row].ruleExpression;
	},
	isRuleEnabled: function(row) {
		return this.rules[row].isEnabled;
	},
	
	
	
  // --------------------------------------------
  // nsITreeView interface properties
  treeSelection: null, // nsiTreeSelection
  treeBox: null, // The tree
  editedRowID: null, // The row currently being edited
  
  // Getters and Setters
  set rowCount(i) { throw "rowCount is a readonly property"; },
  get rowCount() { return this.rules.length; },
  
  set selection(s) { this.treeSelection = s; },
  get selection() { return this.treeSelection; },
  
  // START nsITreeView interface methods
  cycleHeader: function(columnID, element) {
    
  },
  
  getCellText: function(row, column) {
	if (column == "namecol" || column.id == "namecol") {
      return this.getRuleName(row);
	  
    } else if (column == "descriptioncol" || column.id == "descriptioncol") {
      return this.getDescription(row);
    }
    return null;
	},
	
  getImageSrc: function(rowIndex, column) {
  	if (column == "enabledcol" || column.id == "enabledcol") {
  		if (this.isRuleEnabled(rowIndex)) {
  			return "chrome://cachedownload/skin/enabled.png";
  		} else {
  			return "chrome://cachedownload/skin/disabled.png";
  		}
  	}
  	return null;
  },
  isContainer: function(index) { return false; },
  isSeparator: function(index) { return false; },
  isSorted: function(index) { /* return false; */ },
  setTree: function(tree) { this.treeBox=tree; },

//canDropBeforeAfter: function(index, before) { return false; },
//canDropOn : function(index) { return false; },
//cycleCell : function(row, columnID) {  },
//drop: function(row, orientation) {  return false; },
//getCellValue: function(row, columnID) { /* return null; */ },
//getLevel: function(index) { return 0; },
//getParentIndex: function(rowIndex) { return 0; },
//getProgressMode: function(rowIndex, columnID) { },
//hasNextSibling: function(rowIndex, afterIndex) { return false; },
//isContainerEmpty: function(index) { return false; },
//isContainerOpen: function(index) { },
//isEditable: function(rowIndex, columnID) { return false; },
//performAction: function(action) {  },
//performActionOnCell: function(action, rowIndex, columnID) {  },
//performActionOnRow: function(action, rowIndex) {  },
//selectionChanged: function() {  },
//setCellText: function(rowIndex, columnID, value) {  },
//toggleOpenState: function(index) { },
// END nsITreeView interface methods
    
	
  // --------------------------------------------
	
	onLoad: function() {
		//init preference accesser
		this._prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService);
		this._prefs = this._prefs.getBranch("extensions.cachedownload.");
		this.rules = [];

		CacheDownload.Options.onLoadRulesPane();
		
		var prefValue = this._prefs.getCharPref('rules');
		CacheDownload.SharedObjects.RulerParser.parseRules(prefValue, CacheDownload.Options.addRule);
		
	},
	

	onCheckRuleExpression: function() {
		let result = {};
		if (CacheDownload.Options.tbRuleExpression != null) {
			
		CacheDownload.Options.match = new RegExp(CacheDownload.Options.tbRuleExpression.value, "g");
		CacheDownload.Options.listener = new CacheDownload.ListViewUtils.ContentListener();
		CacheDownload.Options.listener.init();

		CacheDownload.CacheVisitor.triggerVisit(CacheDownload.Options);
		CacheDownload.CacheView.onLoad(CacheDownload.Options.listener);
		}
	},
	
	onLoadRulesPane: function() {
	
		this.listRules = document.getElementById("cachedownload-listRules2");

		this.buttonEdit = document.getElementById("editButton");
		this.buttonDelete = document.getElementById("deleteButton");
		
		this.onSelectRule();
	},
	
	onLoadAboutPane: function() {
	},
	
	onDialogAccept: function() {
		if(!this._prefs) return;
		
		var value = CacheDownload.SharedObjects.RulerParser.toXML(this.rules);
		if (value!=null && value!=undefined && value.length>0) {
			this._prefs.setCharPref('rules', value);
		}
		
//		var timeCheckCache = document.getElementById("cachedownload-timeCheckCache");
//		if (timeCheckCache) {
//			this._prefs.setIntPref('TIMER_CACHE_CHECK', timeCheckCache.value);
//		}
//		
//		var timeConsecutiveDownload = document.getElementById("cachedownload-timeConsecutiveDownload");
//		if (timeConsecutiveDownload) {
//			this._prefs.setIntPref('TIMER_DOWNLOAD_CONSECUTIVE', timeConsecutiveDownload.value);
//		}
//		
//		var nbMaxSameSize = document.getElementById("cachedownload-nbMaxSameSize");
//		if (nbMaxSameSize) {
//			this._prefs.setIntPref('MAX_SAME', nbMaxSameSize.value);
//		}
		
	},
	
	
	onDoubleClickRule: function() {
		if (this.treeRules.view.selection.getRangeCount()==0) {
			return;
		}
		this.onEditRule();
	}, 
	
	onEnableRule: function() {
		var index = this.listRules.currentIndex;
		
		if (this.listRules.currentItem != null) {
			this.rules[index].isEnabled=!this.rules[index].isEnabled;
			this.updateRuleView(this.rules[index], this.listRules.getItemAtIndex(index));
		}
		
	},

	currentSelectedRule : null,
	
	onDblClickRule: function() {
		var index = this.listRules.currentIndex;
		document.getElementById("cachedownload-splitter").setAttribute("state","open");
		
		//Array.prototype.forEach.call(document.getElementsByClassName("editpane-disablable"), function(el) {
		//	el.setAttribute("disabled", "false")
		//});
		
		//CacheDownload.Options.onLoadEditPane(this.rules[index]);
		//this.validateRule(this.rules[index]);
		//this.listRules.invalidateRow(index);
	},
	
	onSelectRule: function() {

		if (this.listRules == null) {
			return;
		}

		this.updateRuleView(this.rules[this.ruleEditedIndex], this.listRules.getItemAtIndex(this.ruleEditedIndex));
		
		currentSelectedRule=this.listRules.currentItem;
		
		if (currentSelectedRule != null) {
			
			var noSelection = this.listRules.currentItem==null;
			var index = this.listRules.currentIndex;
			var isFirstRow = (index == 0);
			var isLastRow = (index >= this.rules.length - 1);
			
			
			Array.prototype.forEach.call(this.listRules.currentItem.getElementsByClassName("moveUpButton"), function(el) {
				el.setAttribute("disabled", "true")
			});
			Array.prototype.forEach.call(this.listRules.currentItem.getElementsByClassName("moveDownButton"), function(el) {
				el.setAttribute("disabled", "true")
			});
			
			
			CacheDownload.Options.onLoadEditPane(index);

			
		} 
	},
	
	onDeleteRule: function() {
		var currentIndex = this.listRules.currentIndex;
		this.rules.splice(currentIndex, 1);
		this.listRules.removeItemAt(currentIndex);
		
		this.onSelectRule();
	},
	
	onNewRule: function() {
		let result = {};
		var rule = new CacheDownload.SharedObjects.RuleDefinition();
		rule.isEnabled=false;
		this.addRule(rule);
	},

	onDuplicateRule: function() {

		var toDuplicate = this.rules[this.listRules.currentIndex];

		let result = {};
		var rule = new CacheDownload.SharedObjects.RuleDefinition();
		rule.id = toDuplicate.id;
		rule.description = toDuplicate.description;
		rule.isEnabled = toDuplicate.isEnabled;
		rule.locationExpression = toDuplicate.locationExpression;
		rule.fileNameExpression = toDuplicate.fileNameExpression;
		rule.ruleExpression = toDuplicate.ruleExpression;
		rule.version = toDuplicate.version;

		this.addRule(rule);

		
	},
	
	onEditRule: function() {

		var index = this.listRules.currentIndex;
		
		document.getElementById("cachedownload-splitter").setAttribute("state","open");
		CacheDownload.Options.onLoadEditPane(index);
		//this.validateRule(this.rules[index]);
		//this.listRules.invalidateRow(index);
	},
	
	
	onMoveUpRule: function() {
		var currentIndex = this.listRules.currentIndex;
		if (currentIndex <= 0) {
			return;
		}
		var rule = this.rules[currentIndex - 1];
		this.rules[currentIndex - 1] = this.rules[currentIndex];
		this.rules[currentIndex] = rule;
		var before = this.listRules.getItemAtIndex(this.listRules.currentIndex-1);
		this.listRules.insertBefore(this.listRules.currentItem, before);
	},
	
	
	
	onMoveDownRule: function() {
		var currentIndex = this.listRules.currentIndex;
		if (currentIndex >= (this.rules.length - 1)) {
			return;
		}
		var rule = this.rules[currentIndex + 1];
		this.rules[currentIndex + 1] = this.rules[currentIndex];
		this.rules[currentIndex] = rule;
		var after = this.listRules.getItemAtIndex(this.listRules.currentIndex+1);
		this.listRules.insertBefore(after, this.listRules.currentItem);
	},
	
	validateRule: function(rule) {
		if (rule.id == "") {
			rule.id = "newRule";
		}
		if (rule.fileNameExpression == "") {
			rule.fileNameExpression = "$date()_%filename%";
		}
	},
	
	addRule : function(rule) {
		var self = CacheDownload.Options;
		self.validateRule(rule);
		
		var contains = true;
		var i=1;
		var ruleId = rule.id;
		
		while (contains) {
			contains = false;
			for(var k=0; k<self.rules.length;k++) {
				if (self.rules[k].id == rule.id) {
					rule.id = ruleId + " [" + i+"]";
					i++;
					contains = true;
					break;
				}
			}
		}
		
		self.rules.push(rule);

		if (self.listRules!=null) {
	        self.addRuleInView(rule, null);
		}
	},
	
	addRuleInView : function(rule, insertBefore) {
		var self = CacheDownload.Options;
		
		var node = document.getElementById("cachedownload-ruleTemplate").cloneNode(true);
	    node.removeAttribute("id");
	    node.removeAttribute("hidden");
	    
	    if (insertBefore)
	    	self.listRules.insertBefore(node, insertBefore);
	    else
	    	self.listRules.insertBefore(node, document.getElementById("cachedownload-addNewRule"));

	    this.updateRuleView(rule, node);
	    return node;
	}, 
	
	updateRuleView: function(rule, node) {
		if (rule != null && node != null) {
		    node.getElementsByClassName("cachedownload-rule-title")[0].setAttribute("value", rule.id);
		    node.getElementsByClassName("cachedownload-rule-description")[0].setAttribute("value", rule.description);
		    node.getElementsByClassName("cachedownload-rule-checkbox")[0].setAttribute("checked", rule.isEnabled);
		    
		    if (rule.isEnabled) {
		    	node.setAttribute("class", "cachedownload-rule");
		    } else {
	 		    node.setAttribute("class", "cachedownload-rule disabledRule");
		    }
		    CacheDownload.Options.onCheckRuleExpression();
		}
	}, 
	
	onClickRule: function(event) {
		var tbo = this.treeRules.treeBoxObject;
		
		var row = { }, col = { }, child = { };
		tbo.getCellAt(event.clientX, event.clientY, row, col, child);
		
		if (col != null && col.value != null && col.value.id == "enabledcol") {
			this.onEnableRule();
			return;
		}
		if (row != null && row.value==-1) {
			this.treeRules.view.selection.clearSelection();
			this.onSelectRule();
		}
	},
	
	onLoadDefaultRules: function() {
		this.getContents("chrome://cachedownload/content/defaultRules.xml", this.onLoadDefaultRuleCallback);
	},
	
	onLoadDefaultRuleCallback: function(content) {
		if (content != null) {
			CacheDownload.SharedObjects.RulerParser.parseRules(content, CacheDownload.Options.addRule);
		}
	},
	
	getContents: function(aURL, fCallback_p) {
		var listener = {
			sContent  : "",
			iStream   : null,
			fCallback : fCallback_p,
  
			onStartRequest: function (aRequest, aContext) {
			  this.sContent = "";  
			},
			
			onStopRequest: function (aRequest, aContext, aStatusCode) {
				if (this.iStream != null) {
					this.iStream.close();
				}
				if (Components.isSuccessCode(aStatusCode)) {  
				  this.fCallback(this.sContent);
				} else {
				  this.fCallback(null);  
				}
			}, 
			
			onDataAvailable: function (aRequest, aContext, aInputStream, aOffset, aLength) {
				var siStream =  Components.classes["@mozilla.org/scriptableinputstream;1"].createInstance(Components.interfaces.nsIScriptableInputStream);  
				siStream.init(aInputStream);
				this.sContent += siStream.read(aLength);
				this.iStream=aInputStream;
			}
		};
		
		var ioService=Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);
		var channel=ioService.newChannel(aURL,null,null);
		channel.asyncOpen(listener, null);
	},
	
	editEnabled: false,
	
	

	onRuleChange: function() {
		this.rule["fileNameExpression"]=this.tbFileNameExpression.value;
		this.rule["ruleExpression"]=this.tbRuleExpression.value;
		this.rule["locationExpression"]=this.tbLocationExpression.value;
		this.rule["id"]=this.tbId.value;
		this.rule["description"]=this.tbDescription.value;
		
		this.updateRuleView(this.rule, this.listRules.getItemAtIndex(this.ruleEditedIndex));

	},
	
	
	
	
	
	
	
	
	rule : null,
	ruleEditedIndex : null,
	match: null,
	tbRuleExpression : null,
	tbFileNameExpression : null,
	tbId : null,
	tbDescription : null,
	
	listener : null,
	
	onLoadEditPane: function(ruleIndex_p) {
		this.rule = this.rules[ruleIndex_p];
		
		if (this.rule!=null) {
			this.ruleEditedIndex = ruleIndex_p;
			this.tbRuleExpression = document.getElementById("tbRuleExpression");
			this.tbFileNameExpression = document.getElementById("tbFileNameExpression");
			this.tbId = document.getElementById("tbId");
			this.tbDescription = document.getElementById("tbDescription");
			this.tbLocationExpression = document.getElementById("tbFolderExpression");
			
			this.tbFileNameExpression.value = this.rule["fileNameExpression"];
			this.tbRuleExpression.value = this.rule["ruleExpression"];
			this.tbLocationExpression.value = this.rule["locationExpression"];
			this.tbId.value = this.rule["id"];
			this.tbDescription.value = this.rule["description"];
			

		    CacheDownload.Options.onCheckRuleExpression();
		    
		}

	},
	
	onShowVariables: function() {
		return this.onShowItems(this.rule.predefinedVariables(), "variables", ["name", "description"]);
	},
	
	onShowFunctions: function() {
		return this.onShowItems(this.rule.predefinedFunctions(), "functions", ["format", "description"]);
	},
	
	onShowItems : function(objects, type, content) {
		let result = {};
		this.listener = new CacheDownload.ListViewUtils.ContentListener();
		this.listener.init();
		
		var locale = this.getLocale();
		for (var i=0; i<objects.length; i++) {
			var id = objects[i].key;
			var object = new CacheDownload.SharedObjects.ListViewItem();
			object.source = objects[i];
			for (var p=0; p<content.length; p++) {
				object[content[p]] = CacheDownload.Locale.getString(locale, "cachedownload.options.editrule."+type+"."+id+"."+content[p]);
			}
			this.listener.add(object);
		}
		openDialog(type+"-view.xul", "_blank", "chrome,centerscreen,modal,resizable,dialog=no", CacheDownload.Options.listener, result);

		if (("index" in result)) {
			this.insertDataOnFileNameExpression(objects[result["index"]].getEditText());
		}
	},
	
	getLocale: function() {
		return document.getElementById("cachedownload.options.strings");
	},
	
	initFunctionsMenu: function(event) {
		var button = document.getElementById("btnFunctionsHelp");
		this.initMenu(button, this.rule.predefinedFunctions());
	},
	
	initVariablesMenu: function(event) {
		var button = document.getElementById("btnVariablesHelp");
		this.initMenu(button, this.rule.predefinedVariables());
	},
	
	
	
	
	insertDataOnFileNameExpression: function(data) {
		var textbox = document.getElementById("tbFileNameExpression");
		var delta = (textbox.selectionEnd == textbox.selectionStart ? (textbox.selectionStart == 0 ? 0 : 0) : 0);
		var value = textbox.value.substring(0, textbox.selectionStart) + data + textbox.value.substring(textbox.selectionEnd+delta, textbox.value.length);
		textbox.value = value;
		this.onRuleChange();
	},
	
	onPressMenuItem: function(event) {
		CacheDownload.Options.insertDataOnFileNameExpression(event.target.getAttribute("value"));
	},
	
	evaluate: function(entryValue) {
		var textbox = document.getElementById("tbFileNameExpression");
		return CacheDownload.FileUtil.evaluateExpressionAsFilename(textbox.value, this.rule, entryValue);
	},
	
	onCheckFileNameExpression: function(event) {
		var textbox = document.getElementById("tbFileNameExpression");
		
		var results = CacheDownload.AnalyseParser.inspectExpression(textbox.value, this.rule, null); //as array<KeyValue>
		var res = "";
		var br = "\n";
		var tiret = "- ";
		
		var locale = this.getLocale();
		for(var k=0; k<results.length;k++) {
			if (results[k].key == CacheDownload.AnalyseParser.INSPECT_ALL_VALID) {
				res = res + CacheDownload.Locale.getString(locale, "cachedownload.inspect.wellformed");
				
			} else if (results[k].key == CacheDownload.AnalyseParser.INSPECT_UNKNOWN_VARIABLE) {
				res = res + tiret + CacheDownload.Locale.getString(locale, "cachedownload.inspect.unknownVariable", results[k].value) + br;
				
			} else if (results[k].key == CacheDownload.AnalyseParser.INSPECT_UNKNOWN_FUNCTION) {
				res = res + tiret + CacheDownload.Locale.getString(locale, "cachedownload.inspect.unknownFunction", results[k].value) + br;
				
			} else if (results[k].key == CacheDownload.AnalyseParser.INSPECT_DIFFERENT_EXPRESSION_AFTER_PARSING) {
				res = res + tiret + CacheDownload.Locale.getString(locale, "cachedownload.inspect.differentExpression", results[k].value) + br;
			}
		}
		alert(res);
	},
	
	initMenu: function(button, objects) {
		var menu = button.childNodes[0];
		if (menu.childNodes.length != 2) {
			return;
		}
		var menuItem = null;
		for (var k=0; k<menu.childNodes.length;k++) {
			if ("menuseparator" == menu.childNodes[k].localName) {
				menuItem = menu.childNodes[k];
				break;
			}
		}
		for (var k=0; k<objects.length;k++) {
			var mItem = document.createElement("menuitem");
			mItem.setAttribute("label", objects[k].getText());
			mItem.setAttribute("value", objects[k].getEditText());
			mItem.addEventListener("command", CacheDownload.Options.onPressMenuItem, false);
			menu.insertBefore(mItem, menuItem);
		}
	},
	
	
	
	onSelectFolder: function() {

		var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(Components.interfaces.nsIFilePicker);
		fp.init(window, null, Components.interfaces.nsIFilePicker.modeGetFolder);
		
		var res = fp.show();
		if (res == Components.interfaces.nsIFilePicker.returnCancel)
			return;
		
		this.tbLocationExpression.value = fp.file.path;

		this.onRuleChange();
	}, 
	
	beforeVisitEntries: function() {
	},
	
	afterVisitEntries: function() {
	},
	
	visitEntry: function (aEntryValue) {
			try {
				
		var icon = "unknown";
		var value = aEntryValue;
		value.evaluatedFilename = CacheDownload.Options.evaluate(value);

		if (CacheDownload.Options.match && CacheDownload.Options.match.exec(aEntryValue.key)) {
			//filename from key
			var ext = value.filename.split("\.")
			if (ext.length>1) {
				icon = ext[1];
			}
			icon = "moz-icon://."+icon+"?size=16";

			try {
				
				var cacheService = Components.classes["@mozilla.org/netwerk/cache-storage-service;1"].getService(Components.interfaces.nsICacheStorageService);
					
				function cacheListener(entryValue_p, icon_p) {
					this.entryValue = entryValue_p;
					this.aIcon = icon_p;
				}
				
				cacheListener.prototype = {
					entryValue : null,
					aIcon : "",
					
					onCacheEntryCheck: function (entry, appcache) {
						return Components.interfaces.nsICacheEntryOpenCallback.ENTRY_WANTED;
					},
					onCacheEntryAvailable: function(descriptor, isnew, applicationCache, status) {
						
						try {
							var head = descriptor.getMetaDataElement("response-head");
							var cType = null;
							var contentTypeHeader = "Content-Type: ";
							var a = head.indexOf(contentTypeHeader);
							if (a > 0) {
								var b = head.indexOf("\n", a+contentTypeHeader.length);
								cType = head.substring(a+contentTypeHeader.length, b-1);
								b = cType.indexOf(";");
								if (b > 0) {
									cType = cType.substring(0, b);
								}
								this.aIcon = this.aIcon + "&contentType="+cType;
								this.entryValue.contentType = cType;
							}
						} catch(e) {
						}
						
						//Add item
						this.entryValue.img_filename = this.aIcon;
						CacheDownload.Options.listener.add(this.entryValue);
						
					}
					
				};
				
				if (aEntryValue.isMemory) {
					cacheService.memoryCacheStorage(LoadContextInfo.default,false).asyncOpenURI(
							aEntryValue.uri,
							"",
							Components.interfaces.nsICacheStorage.OPEN_READONLY,
							new cacheListener(value, icon));
				} else {
					cacheService.diskCacheStorage(LoadContextInfo.default,false).asyncOpenURI(
							aEntryValue.uri,
							"",
							Components.interfaces.nsICacheStorage.OPEN_READONLY,
							new cacheListener(value, icon));
				}

			} catch(e) {
			}
		
		}
		} catch(aae) {
		}

	}
	
	

	
	
};

