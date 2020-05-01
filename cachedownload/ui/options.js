/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. 
 *
 * @author: pdulvp@laposte.net
 */
 


var rules;

function updateRules(response, value, ccc) {
	rules = response.rules;
	
	rules.forEach(rule => {
		var left = document.getElementById("left");
		var item = createItem(rule.name);
		item.setAttribute("rule-id", rule.id);
		left.appendChild(item);
		
		/*left.onclick = function(event) {
			Array.from(left.childNodes).forEach(x => removeClass(x, "active"));
		};*/
		item.onclick = function(event) {
			Array.from(left.childNodes).filter(x => x != item).forEach(x => removeClass(x, "active"));
			addClass(item, "active");
			clickOnRule(item);
		}
	});
 }

 function clickOnRule(item) {
	let rule = rules.filter(x => x.id == item.getAttribute("rule-id"))[0];
	var fname = document.getElementById("fname");
	fname.value = rule.name;
 }

  function createItem(label) {
    var node = document.createElement("div");
	node.setAttribute("class", "left-pane-item");
	node.textContent = label;
	return node;
  }
  
function createCacheEntry(item) {
	let node = document.createElement("div");
	node.setAttribute("class", "table-row");

	let child = null;
	child = document.createElement("div");
	child.setAttribute("class", "table-column table-column-icon");
	child.textContent = item.icon;
	node.appendChild(child);

	child = document.createElement("div");
	child.setAttribute("class", "table-column table-column-filename");
	child.textContent = item.filename;
	node.appendChild(child);

	child = document.createElement("div");
	child.setAttribute("class", "table-column table-column-contentType");
	child.textContent = item.contentType;
	node.appendChild(child);

	child = document.createElement("div");
	child.setAttribute("class", "table-column table-column-output");
	child.textContent = item.output;
	node.appendChild(child);
	
	child = document.createElement("div");
	child.setAttribute("class", "table-column table-column-url");
	child.textContent = item.url;
	node.appendChild(child);

	return node;
}

var table = document.getElementById("table-cache");
table.appendChild(createCacheEntry({ icon: "", filename: "music.mp3", contentType: "mp3", output: "okokok_mp2", url: "http://duckduckduck.com/pttptp" }));
table.appendChild(createCacheEntry({ icon: "", filename: "sssss.mp3", contentType: "mp3", output: "okokok_mp2", url: "http://duckduckduck.com/pttptp" }));
table.appendChild(createCacheEntry({ icon: "", filename: "ddd.mp3", contentType: "mp3", output: "okokok_mp2", url: "http://duckduckduck.com/pttptp" }));
table.appendChild(createCacheEntry({ icon: "", filename: "firefox.mlml.text", contentType: "text/html", output: "okokok_mp2", url: "http://duckduckduck.com/pttptp" }));
table.appendChild(createCacheEntry({ icon: "", filename: "music.mp3", contentType: "mp3", output: "okokok_mp2", url: "http://duckduckduck.com/pttptp" }));

document.addEventListener("click", function (event) {
	if (!event.target.hasAttribute("data-menu")) {
		var menu = document.getElementsByClassName("popup-menu")[0];
	  if (!menu.contains(event.target)) {
		menu.setAttribute("style", `display:none;`);
	  }
	}
});


  let displayPopup = function (event) {
	console.log(event.target.id);
	var menu = document.getElementById("popup-menu");
	let top = event.target.offsetTop + event.target.offsetHeight - 1;
	let left = event.target.offsetLeft;
	let arr = `display:block; left:${left}px; top:${top}px;`;
	menu.setAttribute("style", arr);
	menu.addEventListener("click", function (event2) {
		let arr = `display:none;`;
		menu.setAttribute("style", arr);
		clickPopupItem(event2);
	}, { useCapture: true } );
 };

 function clickPopupItem(event) {
	 console.log(event);
 }

 document.getElementById("button-functions").addEventListener("click", displayPopup, { useCapture: true } );
 document.getElementById("button-variables").addEventListener("click", displayPopup, { useCapture: true } );
 


 document.getElementById("button-ok").onclick = function (event) {
	window.close();
 };

 document.getElementById("button-cancel").onclick = function (event) {
	window.close();
 };

 document.getElementById("button-new").onclick = function (event) {
	var sending = browser.runtime.sendMessage( { "action": "callback" } );
	sending.then( x => updateRules(x) , function (error) {});
 };

 document.getElementById("button-load-default").onclick = function (event) {
	window.close();
 };
 

 var sending = browser.runtime.sendMessage( { "action": "callback" } );
 sending.then( updateRules , function (error) {});