/**
 * @file Paranoia extension for Mozilla Firefox (content.js)
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
		"license": "MPL-2.0",
		"function": "content.js",
	};
	
	/*
	 * Communication with background script 
	 */
		function contentCommandProcessor(m) {
            if (m.cmd === "HELO") {
            	console.debug("contentCommandProcessor: received HELO, returning OLEH: " 
            					+ JSON.stringify(m));
            	myPort.postMessage({"cmd": "OLEH", "text": "background script. This is content."});
            } else if (m.cmd === "OLEH") {
            	console.info("contentCommandProcessor: connection established -\"" + m.text + "\"");
            } 
            else { 
            	console.warn("contentCommandProcessor: Invalid message" + JSON.stringify(m))
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
            name: "content"
        });
        myPort.onMessage.addListener(contentCommandProcessor);
        myPort.postMessage({"cmd": "HELO", "text": "background script. This is content."});
        
        /* TODO: keepalive mechanism... */

		rval.result = "OK";
	} catch (ex) {
		rval.result = "Failed";
		rval.reason = JSON.stringify(ex);
	}
	return rval;
}

init()
	.then(
	function(res) { 
		let  msg_fn = null;
		if ( res.result === "OK" ) {
			msg_fn=console.log;
		} else if ( re.result === "Failed" ) {
			msg_fn = console.error
		} else {
			throw ("init: unknown result status (" + JSON.stringify(res) + ")");
		}
		msg_fn(JSON.stringify(res)); 
	},
	function(ex) { 
		console.error("Failed to initialize: " + JSON.stringify(ex)); 
	}
);