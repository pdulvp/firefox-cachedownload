var CacheDownload = { }

CacheDownload.EditRule={
	rule : null,
	result : null,
	match: null,
	tbRuleExpression : null,
	tbFileNameExpression : null,
	tbId : null,
	tbDescription : null,
	
	listener : null,
	
	onLoad: function() {
		if (window.arguments && window.arguments.length) {
			newInstall = false;
			this.rule = window.arguments[0];
			this.result = window.arguments[1];
		}
		
		if (this.rule!=null) {
			this.tbRuleExpression = document.getElementById("tbRuleExpression");
			this.tbFileNameExpression = document.getElementById("tbFileNameExpression");
			this.tbId = document.getElementById("tbId");
			this.tbDescription = document.getElementById("tbDescription");
			
			this.tbFileNameExpression.value = this.rule["fileNameExpression"];
			this.tbRuleExpression.value = this.rule["ruleExpression"];
			this.tbId.value = this.rule["id"];
			this.tbDescription.value = this.rule["description"];
		}
	},
	
	onDialogCancel: function() {
	}, 
	
	onDialogAccept: function() {
		this.rule["fileNameExpression"]=this.tbFileNameExpression.value;
		this.rule["ruleExpression"]=this.tbRuleExpression.value;
		this.rule["id"]=this.tbId.value;
		this.rule["description"]=this.tbDescription.value;
		this.result["status"]=true;
	},
	
	onShowVariables: function() {
		return this.onShowItems(this.rule.predefinedVariables(), "variables", ["name", "format", "description"]);
	},
	
	onShowFunctions: function() {
		return this.onShowItems(this.rule.predefinedFunctions(), "functions", ["name", "description"]);
	},
	
	onShowItems : function(objects, type, content) {
		let result = {};
		this.listener = new CacheDownload.ListViewUtils.ContentListener();
		this.listener.init();
		
		var locale = this.getLocale();
		
		for (var i=0; i<objects.length; i++) {
			var id = objects[i].key;
			var object = new new CacheDownload.SharedObjects.ListViewItem();
			object.source = objects[i];
			for (var p=0; p<content.length; p++) {
				object[content[p]] = CacheDownload.Locale.getString(locale, "cachedownload.options.editrule."+type+"."+id+"."+content[p]);
			}
			this.listener.add(object);
		}
		
		openDialog(type+"-view.xul", "_blank", "chrome,centerscreen,modal,resizable,dialog=no", CacheDownload.EditRule.listener, result);

		if (("index" in result)) {
			this.insertDataOnFileNameExpression(objects[result["index"]].getEditText());
		}
		if (!("status" in result))
			return;
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
	},
	
	onPressMenuItem: function(event) {
		this.insertDataOnFileNameExpression(event.target.getAttribute("value"));
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
			if (results[k].key == CacheDownload.AnalyseParserINSPECT_ALL_VALID) {
				res = res + CacheDownload.Locale.getString(locale, "cachedownload.inspect.wellformed");
				
			} else if (results[k].key == CacheDownload.INSPECT_UNKNOWN_VARIABLE) {
				res = res + tiret + CacheDownload.Locale.getString(locale, "cachedownload.inspect.unknownVariable", results[k].value) + br;
				
			} else if (results[k].key == CacheDownload.INSPECT_UNKNOWN_FUNCTION) {
				res = res + tiret + CacheDownload.Locale.getString(locale, "cachedownload.inspect.unknownFunction", results[k].value) + br;
				
			} else if (results[k].key == CacheDownload.INSPECT_DIFFERENT_EXPRESSION_AFTER_PARSING) {
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
			mItem.setAttribute("oncommand", "CacheDownload.EditRule.onPressMenuItem(event);");
			menu.insertBefore(mItem, menuItem);
		}
	},
	
	onCheckRuleExpression: function() {
		let result = {};
		CacheDownload.EditRule.match = new RegExp(CacheDownload.EditRule.tbRuleExpression.value, "g");
		CacheDownload.EditRule.listener = new CacheDownload.ListViewUtils.ContentListener();
		CacheDownload.EditRule.listener.init();
		
		CacheDownload.CacheVisitor.triggerVisit(CacheDownload.EditRule);
		openDialog("cache-view.xul", "_blank", "chrome,centerscreen,modal,resizable,dialog=no", CacheDownload.EditRule.listener, null, result);
		
		if (!("status" in result))
			return;
	}, 
	
	beforeVisitEntries: function() {
	},
	
	afterVisitEntries: function() {
	},
	
	visitEntry: function (aEntryInfo) {
		var icon = "unknown";
		var value = new CacheDownload.SharedObjects.EntryValue(aEntryInfo); 
		value.evaluatedFilename = CacheDownload.EditRule.evaluate(value);
		
		if (this.match && this.match.exec(aEntryInfo.key)) {
			//filename from key
			var ext = value.filename.split("\.")
			if (ext.length>1) {
				icon = ext[1];
			}
			icon = "moz-icon://."+icon+"?size=16";
			
			try {
				var cacheService = Components.classes["@mozilla.org/network/cache-service;1"].getService(Components.interfaces.nsICacheService);
				var session = cacheService.createSession(aEntryInfo.clientID, Components.interfaces.nsICache.STORE_ANYWHERE, aEntryInfo.isStreamBased());
				session.doomEntriesIfExpired = false;
				
				function cacheListener(entryValue_p, icon_p) {
					this.entryValue = entryValue_p;
					this.aIcon = icon_p;
				}
				cacheListener.prototype = {
					entryValue : "",
					aIcon : "",
					onCacheEntryAvailable : function(descriptor, accessGranted, status) {
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
						CacheDownload.EditRule.listener.add(this.entryValue);
					}
				};
				
				var descriptor = session.asyncOpenCacheEntry(aEntryInfo.key, Components.interfaces.nsICache.ACCESS_READ, new cacheListener(value, icon));
				
			} catch(e) {
			}
		
		}
	}
};
