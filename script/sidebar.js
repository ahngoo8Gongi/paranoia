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
		"function": "sidebar.js",
	};
	
	/*
	 * Communication with background script 
	 */
		function sideBarCommandProcessor(m) {
            console.debug("In sidebar script, received message from background script: " 
            	+ JSON.stringify(m));
            if (m.cmd === "HELO") {
            	myPort.postMessage({"cmd": "OLEH", "text": "background script. This is sidenbar."});
            } else if (m.cmd === "OLEH") {
            	console.debug("sideBarCommandProcessor: connection established -\"" + m.text + "\"");
            } 
            else { 
            	console.warn("Invalid message" + JSON.stringify(m))
            }
        }
	
	/*
	 * code run
	 */
	var rval = {
		"extension": extension,
	};
	try {
    	var myPort = browser.runtime.connect({
            name: "sidebar"
        });
        myPort.onMessage.addListener(sideBarCommandProcessor);
        myPort.postMessage({"cmd": "HELO", "text": "background script. This is sidenbar."});

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