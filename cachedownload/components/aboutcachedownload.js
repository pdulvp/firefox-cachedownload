Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");

function CacheDownloadAbout() { }
CacheDownloadAbout.prototype = {
  classDescription: "about:cachedownload",
  contractID: "@mozilla.org/network/protocol/about;1?what=cachedownload",
  classID: Components.ID("AF48EB19-724C-4A38-9B98-0353FF4AC57D"),
  QueryInterface: XPCOMUtils.generateQI([Components.interfaces.nsIAboutModule]),
  
  getURIFlags: function(aURI) {
    return Components.interfaces.nsIAboutModule.ALLOW_SCRIPT;
  },
  
  newChannel: function(aURI) {
    let ios = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);
    let key = decodeURIComponent(escape(atob( aURI.spec.substr(20) ))); // 20-->len(cachedownlaod)
    
    let channel = ios.newChannel(key, null, null).QueryInterface(Components.interfaces.nsICachingChannel);
	channel.loadFlags = Components.interfaces.nsICachingChannel.LOAD_NO_NETWORK_IO |
						Components.interfaces.nsICachingChannel.LOAD_ONLY_FROM_CACHE |
						Components.interfaces.nsICachingChannel.LOAD_CHECK_OFFLINE_CACHE;
	return channel;
  }
};
const NSGetFactory = XPCOMUtils.generateNSGetFactory([CacheDownloadAbout]);
