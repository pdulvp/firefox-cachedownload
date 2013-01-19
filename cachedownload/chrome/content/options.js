var CacheDownload = { }

CacheDownload.Options = {
	treeRules: null,
	buttonEdit: null,
	buttonDelete: null,
	buttonMoveUp: null,
	buttonMoveDown: null,
	
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
  getCellProperties: function(row, columnID, properties) { 

    var atomService = Components.classes["@mozilla.org/atom-service;1"].getService(Components.interfaces.nsIAtomService);
	if (this.isRuleEnabled(row)) {
		properties.AppendElement(atomService.getAtom("enabled-true"));
	} else {
		properties.AppendElement(atomService.getAtom("enabled-false"));
	}

  },
  getCellText: function(row, column) {
	if (column == "namecol" || column.id == "namecol") {
      return this.getRuleName(row);
	  
    } else if (column == "descriptioncol" || column.id == "descriptioncol") {
      return this.getDescription(row);
    }
    return null;
	},
  getColumnProperties: function(columnID, element, properties) {  },
  getImageSrc: function(rowIndex, column) {
  	/*if (column == "enabledcol" || column.id == "enabledcol") {
  		if (this.isRuleEnabled(rowIndex)) {
  			return "chrome://cachedownload/skin/enabled.png";
  		} else {
  			return "chrome://cachedownload/skin/disabled.png";
  		}
  	}*/
  	return null;
  },
  getRowProperties: function(rowIndex, properties) {  },
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
		
		var prefValue = this._prefs.getCharPref('rules');
		CacheDownload.SharedObjects.RulerParser.parseRules(prefValue, CacheDownload.Options.addRule);
	},
	
	onLoadGeneralPane: function() {
	
		if(!this._prefs) {
			this.onLoad();
		}
		
		var timeCheckCache = document.getElementById("cachedownload-timeCheckCache");
		var timeConsecutiveDownload = document.getElementById("cachedownload-timeConsecutiveDownload");
		var nbMaxSameSize = document.getElementById("cachedownload-nbMaxSameSize");
		
		timeCheckCache.value=this._prefs.getIntPref('TIMER_CACHE_CHECK');
		timeConsecutiveDownload.value=this._prefs.getIntPref('TIMER_DOWNLOAD_CONSECUTIVE');
		nbMaxSameSize.value=this._prefs.getIntPref('MAX_SAME');

	},
	
	onLoadRulesPane: function() {
	
		this.treeRules = document.getElementById("cachedownload-tree");
		this.treeRules.treeBoxObject.view = this;
		
		this.buttonEdit = document.getElementById("editButton");
		this.buttonDelete = document.getElementById("deleteButton");
		this.buttonMoveUp = document.getElementById("moveUpButton");
		this.buttonMoveDown = document.getElementById("moveDownButton");
		
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
		
		var timeCheckCache = document.getElementById("cachedownload-timeCheckCache");
		if (timeCheckCache) {
			this._prefs.setIntPref('TIMER_CACHE_CHECK', timeCheckCache.value);
		}
		
		var timeConsecutiveDownload = document.getElementById("cachedownload-timeConsecutiveDownload");
		if (timeConsecutiveDownload) {
			this._prefs.setIntPref('TIMER_DOWNLOAD_CONSECUTIVE', timeConsecutiveDownload.value);
		}
		
		var nbMaxSameSize = document.getElementById("cachedownload-nbMaxSameSize");
		if (nbMaxSameSize) {
			this._prefs.setIntPref('MAX_SAME', nbMaxSameSize.value);
		}
		
	},
	
	
	onDoubleClickRule: function() {
		if (this.treeRules.view.selection.getRangeCount()==0) {
			return;
		}
		this.onEditRule();
	}, 
	
	onEnableRule: function() {
		var index = this.treeRules.currentIndex;
		
		if (this.treeRules.view.selection.getRangeCount()==0) {
			return;
		}
		
		this.rules[index].isEnabled=!this.rules[index].isEnabled;
		
		// Notify the treeBoxObject that a row has been edited
		this.treeRules.treeBoxObject.invalidateRow(index);
	},
	
	onSelectRule: function() {
		var hasNoSelection = this.treeRules.view.selection.getRangeCount()==0;
		var index = this.treeRules.currentIndex;
		var isFirstRow = (index == 0);
		var isLastRow = (index >= this.rules.length - 1);
		
		this.buttonEdit.setAttribute("disabled", hasNoSelection);
		this.buttonDelete.setAttribute("disabled", hasNoSelection);
		this.buttonMoveUp.setAttribute("disabled", hasNoSelection || isFirstRow);
		this.buttonMoveDown.setAttribute("disabled", hasNoSelection || isLastRow);
	},
	
	onDeleteRule: function() {
		var currentIndex = this.treeRules.currentIndex;
		this.rules.splice(currentIndex, 1);

		// Notify the treeBoxObject that a row has been deleted
		// Select the next row if there is one
		this.treeRules.treeBoxObject.rowCountChanged(currentIndex, -1);
	},
	
	onNewRule: function() {
		let result = {};
		var rule = new CacheDownload.SharedObjects.RuleDefinition();
		openDialog("edit-rule.xul", "_blank", "chrome,centerscreen,modal,resizable,dialog=no", rule, result);

		if (!("status" in result))
			return;
		this.addRule(rule);
	},
	
	onEditRule: function() {
		var index = this.treeRules.currentIndex;
		let result = {};
		openDialog("edit-rule.xul", "_blank", "chrome,centerscreen,modal,resizable,dialog=no", this.rules[index], result);
		this.validateRule(this.rules[index]);
		if (!("status" in result))
			return;
		
		this.treeRules.treeBoxObject.invalidateRow(index);
	},
	
	onMoveUpRule: function() {
		var currentIndex = this.treeRules.currentIndex;
		var rule = this.rules[currentIndex - 1];
		this.rules[currentIndex - 1] = this.rules[currentIndex];
		this.rules[currentIndex] = rule;
		
		this.treeRules.treeBoxObject.invalidateRow(currentIndex);
		this.treeRules.treeBoxObject.invalidateRow(currentIndex - 1);
		this.treeRules.view.selection.select(currentIndex - 1);
	},
	
	onMoveDownRule: function() {
		var currentIndex = this.treeRules.currentIndex;
		var rule = this.rules[currentIndex + 1];
		this.rules[currentIndex + 1] = this.rules[currentIndex];
		this.rules[currentIndex] = rule;
		
		this.treeRules.treeBoxObject.invalidateRow(currentIndex);
		this.treeRules.treeBoxObject.invalidateRow(currentIndex + 1);
		this.treeRules.view.selection.select(currentIndex + 1);
	},
	
	validateRule: function(rule) {
		if (rule.id == "") {
			rule.id = "newRule";
		}
		if (rule.fileNameExpression == "") {
			rule.fileNameExpression = "$date_$filename";
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
		
		if (self.treeBox!=null) {
			// Notify the treeBoxObject that a row has been added
			// Select the next row if there is one
			self.treeBox.rowCountChanged(self.rules.length-1, 1);
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
	}
	
};

