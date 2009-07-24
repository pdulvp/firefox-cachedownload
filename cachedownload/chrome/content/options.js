var CacheDownload_Options={
	//This array will contains a reversed array of DOM_VK
	virtualKeys: null, 

	onLoad: function() {
		//init preference accesser
		this._prefs = Components.classes["@mozilla.org/preferences-service;1"].
		                    getService(Components.interfaces.nsIPrefService);
		this._prefs = this._prefs.getBranch("extensions.cachedownload.");
		
		//set checkbox with value in preference storage
		var widget;
		if (widget=document.getElementById("cachedownload_chbx_show")) {
			widget.setAttribute("checked", this._prefs.getBoolPref('show_statusbar_elements'));
		}

		//Previous has index 0
		//Next has index 1

		//This array will contains a int value of modifiers for each key
		this.modifiers=new Array();
		//This array will contains a dom_vk value of key pressed for each key
		this.valueKeys=new Array();
		
		this.modifiers[0]=CacheDownload_Options.modifiersString2Int(this._prefs.getCharPref('key_previous_modifiers'));
		this.valueKeys[0]=this._prefs.getCharPref('key_previous_valueKey');
		document.getElementById("cachedownload_key_prev_tb").value+=CacheDownload_Options.getStringOfKey(0);
		
		this.modifiers[1]=CacheDownload_Options.modifiersString2Int(this._prefs.getCharPref('key_next_modifiers'));
		this.valueKeys[1]=this._prefs.getCharPref('key_next_valueKey');
		document.getElementById("cachedownload_key_next_tb").value+=CacheDownload_Options.getStringOfKey(1);
		
	},
	
	onDialogAccept: function() {
		
		if(!this._prefs) return;
		
		var widget, value;
		
		//save statusbar-buttons option
		if ((widget=document.getElementById("cachedownload_chbx_show"))) {
			value=widget.getAttribute("checked")=="true";
			this._prefs.setBoolPref('show_statusbar_elements', value);
		}
		
		//save previous key
		this._prefs.setCharPref('key_previous_modifiers', CacheDownload_Options.modifiersInt2String(this.modifiers[0]));
		this._prefs.setCharPref('key_previous_valueKey', this.valueKeys[0]?this.valueKeys[0]:"");

		//save next key
		this._prefs.setCharPref('key_next_modifiers', CacheDownload_Options.modifiersInt2String(this.modifiers[1]));
		this._prefs.setCharPref('key_next_valueKey', this.valueKeys[1]?this.valueKeys[1]:"");
		
		//Now, the observer linked on preference will be notified
	},
	
	modifiersInt2String : function(value) {
		var s="";
		if ((value & 1)) { //ALT
			s += (s.length>0?",":"")+"alt";
		}
		if ((value & 2)) { //CTRL
			s += (s.length>0?",":"")+"ctrl";
		}
		if ((value & 4)) { //SHIFT
			s += (s.length>0?",":"")+"shift";
		}
		if ((value & 8)) { //META
			s += (s.length>0?",":"")+"meta";
		}

		return s;
	},
	
	modifiersString2Int : function(string) {
		var s=0;
		if (string.indexOf("alt")!=-1) { //ALT
			s += 1;
		}
		if (string.indexOf("ctrl")!=-1) { //CTRL
			s += 2;
		}
		if (string.indexOf("shift")!=-1) { //SHIFT
			s += 4;
		}
		if (string.indexOf("meta")!=-1) { //META
			s += 8;
		}

		return s;
	},
	
	initVirtualKeys : function(event) {
		//this function init virtualKeys variable with indexes any keycode, and for each 
		//index, the DOM_VK constant associated
		if (CacheDownload_Options.virtualKeys==null) {
			CacheDownload_Options.virtualKeys=new Array();

			 for(var p in event) {
			 	if (p[0]=='D' && p[1]=='O') {
					var ss=""+p;
					CacheDownload_Options.virtualKeys[event[p]]=ss.substr(7, ss.length-6);
     			}
			}
		}
	},
	
	getStringOfKey : function(index) {
		var s = "";
		
		if (this.modifiers[index]) {
			if (this.modifiers[index] & 1) { //ALT
				s += " ALT + ";
			}
			if (this.modifiers[index] & 2) { //CTRL
				s += " CTRL + ";
			}
			if (this.modifiers[index] & 4) { //SHIFT
				s += " SHIFT + ";
			}
			if (this.modifiers[index] & 8) { //META
				s += " META + ";
			}
		}
		
		s+=" "+this.valueKeys[index];
		return s;
	},
	
	onKeyDown: function(event, index) {
		event.target.value="";
		CacheDownload_Options.initVirtualKeys(event);
		
		this.valueKeys[index]="";

		this.modifiers[index]=0;
		this.modifiers[index]+=event.altKey   ? 1 : 0;
		this.modifiers[index]+=event.ctrlKey  ? 2 : 0;
		this.modifiers[index]+=event.shiftKey ? 4 : 0;
		this.modifiers[index]+=event.metaKey  ? 8 : 0;
		
		if (event.keyCode!=event.DOM_VK_CONTROL &&
			event.keyCode!=event.DOM_VK_ALT &&
			event.keyCode!=event.DOM_VK_SHIFT &&
			CacheDownload_Options.virtualKeys[event.keyCode]) {
			this.valueKeys[index]=CacheDownload_Options.virtualKeys[event.keyCode];
		}
		
		event.target.value=CacheDownload_Options.getStringOfKey(index);
		event.stopPropagation();
		event.preventDefault();
		
		return false;
	},
	
	onKeyUp: function(event, index) {
		//TODO Check if shortcut is already used

		if (!this.valueKeys[index]) {
			this.modifiers[index]=0;
			this.valueKeys[index]="";
			event.target.value=CacheDownload_Options.getStringOfKey(index);
		}
	}
}

