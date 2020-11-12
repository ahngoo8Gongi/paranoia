/**
 * @file PaWS extension for Mozilla Firefox
 * @author Holger Smolinski
 * @copyright (C), 2020 Holger Smolinski
 * @license MPL-2.0 This Source Code Form is subject to the terms of the Mozilla
 *          Public License, v. 2.0. If a copy of the MPL was not distributed
 *          with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

async function init() {
	/*
	 * extension meta data
	 */
	const manifest = browser.runtime.getManifest();
	const extension = {
		"name": manifest.name,
		"version": manifest.version,
		"copyright": "(C) 2020, " + manifest.author,
		"license": "MPL-2.0 + Webtoolkit",
		"function": "background.js",
	};
	
	/*
	 * tab management
	 */

	var tabs = {};
	
	function onTabCreatedCallback(tab) {
		if (!tab.hasOwnProperty("id") || !tab.hasOwnProperty("url")) {
				throw ("onTabCreatedCallback: tab created is invalid. " + JSON.stringify(tab));
		}
		console.debug("onTabCreatedCallback: tab created " + JSON.stringify(tab));
		let id = tab.id.toString();
		
		tabs[id] = {};
	}
	
	function onTabRemovedCallback(tabid) {
		console.debug("onTabRemovedCallback: tab (" + tabid + ") removed.");
		delete tabs[tabid];
	}
	
	function onTabUpdatedCallback(tabId, changeInfo, tab) {
	}
	
	function onTabActivatedCallback(activeInfo) {
		console.debug("onTabActivatedCallback: tab (" + JSON.stringify(activeInfo) + ") removed.");
	}
	
	/*
	 * communication with other parts
	 */

	/* the ports we are conected to */	 
	var comports = {};

	/*
	 * Sidebar communication
	 */
	function onSidebarMessageReceivedCallback(message, sender, receipt_fn) {
		if (sender.name === "sidebar") {	
			console.debug("onSidebarMessageReceivedCallback: received \"" + JSON.stringify(message) + "\"");
			/* TODO: identify and process known message here */
			 if (message.cmd === "HELO") {
            	comports.sidebar.postMessage({"cmd": "OLEH", "text": "sidebar script. This is background."});
            } else if (message.cmd === "OLEH") {
            	console.debug("sideBarCommandProcessor: connection established -\"" + message.text + "\"");
            } 
			/* End TODO */
			else {
				console.warn("onSidebarMessageReceivedCallback: received unknown message \"" 
					+ JSON.stringify(message) + "\"");
			}
			if (receipt_fn) {
				receipt_fn({ "received": true });
			}
		} else {
			console.error("onSidebarMessageReceivedCallback: received message from unknown sender:" 
				+ "(" + JSON.stringify(sender) + ")" 
				+ "\" " + JSON.stringify(message) + "\"" );
		}
	}
	
	/*
	 * communication hub
	 */
	
	function onConnectCallback(port) {
		if (!port.hasOwnProperty("name")) {
			throw ("onConnectCallback: port connected is invalid. " + JSON.stringify(port));
		}
		if ( port.name === "sidebar" ) {
			console.debug("onConnectCallback: connection accepted from sidebar");
			comports.sidebar = port;
			comports.sidebar.postMessage({ "cmd" : "HELO", "text": "sidebar script. This is background."});
			comports.sidebar.onMessage.addListener(onSidebarMessageReceivedCallback);
		} else {
			console.warn ("onConnectCallback: connected from unknown port \"" + port.name +"\"");
		}
	}

	/*
	 * code run
	 */
	var rval = {
		"extension": extension,
	};
	try {
	 	browser.runtime.onConnect.addListener(onConnectCallback);
	 	
	 	browser.tabs.onCreated.addListener(onTabCreatedCallback);
		browser.tabs.onRemoved.addListener(onTabRemovedCallback);
		browser.tabs.onUpdated.addListener(onTabUpdatedCallback,
			{
				"urls": ["<all_urls>"],
				"properties": ["status"]
			});
		browser.tabs.onActivated.addListener(onTabActivatedCallback);

		rval.result = "OK";
	} catch (ex) {
		rval.result = "Failed";
		rval.reason = JSON.stringify(ex);
	}
	return rval;
}

init()
	.then(
	function(res) { console.log("Loaded: " + JSON.stringify(res)); },
	function(ex) { console.error("Failed to initialize: " + JSON.stringify(ex)); }
);