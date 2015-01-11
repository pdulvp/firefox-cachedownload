var CacheDownload = { }

CacheDownload.CacheView={
	objects   : null,
	treeRules : null,
	
	onLoad: function() {
		if (window.arguments && window.arguments.length) {
			newInstall = false;
			var listener = window.arguments[0];
			this.objects = listener.objects;
			listener.fCallback = this;
		} else {
			this.objects = new Array();
		}
		this.treeRules = document.getElementById("cachedownload-listView-tree");
		this.treeRules.treeBoxObject.view = this;
	},

	onDoubleClickElement: function() {
		if (this.treeRules.view.selection.getRangeCount()==0) {
			return;
		}
		var dialog = document.getElementById("cachedownload-listView");
		dialog.acceptDialog();
	}, 
	
	updateContents: function() {
	},
	
	updateContent: function(object) {
		this.treeBox.rowCountChanged(this.objects.length-1, 1);
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
	  
	
	  var image = document.getElementById("imgPreview");
	    let ios = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);
	    let url = "about:cachedownload?"+btoa(unescape(encodeURIComponent( this.objects[this.treeRules.currentIndex].key )));
	   
	    if (image.src != url) {
		    image.src = url;
			image.onload = function() {
				CacheDownload.CacheView.resize();
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
