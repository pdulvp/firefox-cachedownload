
//When a switch is clicked, we update the expands information from the current domain
function handleMessage(request, sender, sendResponse) {
    if (request.action == "callback") {
		sendResponse({"action": request.action, "rules" : [ { "id": "1", "name": "okok"},  { "id": "2", "name": "ddd"}] }); 
    }
}

//Register on message sent from popup and contentScript
browser.runtime.onMessage.addListener(handleMessage);
