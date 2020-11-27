/**
 * @file Paranoia extension for Mozilla Firefox
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
		"function": "background.js",
	};

	/* the ports we are conected to */
	var comports = {
		content: []
	};

	/* The tabs we deal with */
	var tabs = {};

	var activeTab = null;

	function messageSidebarUpdate(tabId) {
		if (!tabs.hasOwnProperty(tabId)) {
			console.log("messageSidebarUpdate: scheduled to update invalid tab " + tabId);
		} else {
			try {
				comports.sidebar.postMessage({ "cmd": "DISP", "arg": tabs[tabId] });
			}
			catch (ex) {
				console.error("messageSidebarUpdate: error" + JSON.stringify(ex));
				delete comports.sidebar;
			}
		}
	}

	var updateMessageTimeout = null;

	function triggerSidebarUpdate(tabId) {
		if (updateMessageTimeout != null) {
			clearTimeout(updateMessageTimeout);
			// No need to reset to null, as JS in synchronous!
		}
		if (comports.hasOwnProperty("sidebar")) {
			messageSidebarUpdate(tabId);
		} else {
			console.log("triggerSidebarUpdate: postponing trigger");
			updateMessageTimeout = setTimeout(triggerSidebarUpdate, 100, tabId);
		}
	}

	/*
	 * tab management
	 */
	function onTabCreatedCallback(tab) {
		if (!tab.hasOwnProperty("id") || !tab.hasOwnProperty("url")) {
			throw ("onTabCreatedCallback: tab created is invalid. " + JSON.stringify(tab));
		}
		console.debug("onTabCreatedCallback: tab created " + JSON.stringify(tab));
		let id = tab.id.toString();
		if (tabs[id]) {
			throw ("onTabCreatedCallback: created existing tab " + id);
		}
		tabs[id] = new TabInfo(tab.url);
	}

	function onTabRemovedCallback(tabid) {
		let id = tabid.toString();
		console.debug("onTabRemovedCallback: tab (" + tabid + ") removed.");
		if (!tabs.hasOwnProperty(id)) {
			console.warn("onTabRemovededCallback: removing non-existing tab " + id
				+ "(maybe a stale one from before loading the extension)");
		}
		delete tabs[id];
	}

	async function onTabActivatedCallback(activeInfo) {
		if (!activeInfo.hasOwnProperty("tabId")) {
			throw ("onTabActivatedCallback: inavlid activeInfo (" + JSON.stringify(activeInfo) + ").");
		}
		let tabId = activeInfo.tabId.toString();
		if (!tabs.hasOwnProperty(tabId)) {
			console.info("onTabActivatedCallback: activated unknown tab (" + tabId + "), creating tabInfo.");
			let tab = await browser.tabs.get(activeInfo.tabId);
			tabs[tabId] = new TabInfo(tab.url);
			/* TODO: populate Tab from tabinfo */
		}
		activeTab = tabId;
		triggerSidebarUpdate(tabId);
		console.debug("onTabActivatedCallback: tab (" + JSON.stringify(activeInfo) + ").");
	}

	function onTabUpdatedCallback(tabId, changeInfo, tab) {
		if ( tabId === -1 ) throw ("Invalid TabId "+tabId+". changeInfo = " + JSON.stringify(changeInfo) +" tab= " +JSON.stringify(changeInfo));
		console.debug(JSON.stringify(changeInfo));
		let id = tabId.toString();
		
		if (!tabs.hasOwnProperty(id)) {
			console.info("onTabUpdatedCallback: updated unknown tab (" + id + "), creating tabInfo.");
			if (!tab.hasOwnProperty("url")) {
				throw ("onTabUpdatedCallback: activated invalid tab, no property url (" + JSON.stringify(tab) + ")");
			}
			tabs[id] = new TabInfo(tab.url);
		}
		if (tab.status === "loading") {
			if (tabs[id].url !== changeInfo.url) {
				console.warn(changeInfo.url);
				tabs[id] = new TabInfo(changeInfo.url);
				triggerSidebarUpdate(tabId);
			} else {
				/* TODO: what else? */
			}
		} else if (tab.status === "complete") {
			if (id === activeTab) {
				console.debug("onTabUpdatedCallback: activeTab (" + id + ") switched to complete state. Triggering update");
				triggerSidebarUpdate(tabId);
			} else {
				console.info("onTabUpdatedCallback: Tab Id (" + id + "," + tab.url + ") switched to complete state while inactive. Active Tab = " + activeTab);
			}
		} else {
			console.error("onTabUpdatedCallback: Tab Id (" + id + "," + tab.url + ") switched to unknown state (" + tab.status + ")");
		}
		triggerSidebarUpdate(tabId);
	}

	async function onHeadersReceivedCallback(details) {
		if (!details.hasOwnProperty("tabId"))
			throw ("onHeadersReceivedCallback: ");
		if (!details.hasOwnProperty("url"))
			throw ("onHeadersReceivedCallback: ");
		if (!details.hasOwnProperty("requestId"))
			throw ("onHeadersReceivedCallback: ");
		console.debug("headersReceivedCallback: called for" + " tab id:" + details.tabId +
			" url: " + details.url + " Request ID: " + details.requestId);

		if (!tabs.hasOwnProperty("" + details.tabId + "")) {
			console.error("headersReceivedCallback tab " + details.tabId + " hasnt been present before, correcting");
			
				let tab = await browser.tabs.get(details.tabId);
				tabs[tabId] = new TabInfo(tab.url);
			
		}

		if (details.url === tabs[details.tabId].url) { /* actually we are reloading this tab */
			tabs[details.tabId] = new TabInfo(details.url);
		} else {
			let targetURL = reduceUrl(details.url)
			let securityInfo = await browser.webRequest.getSecurityInfo(details.requestId, { "certificateChain": true });
			console.debug("security Info = " + JSON.stringify(securityInfo));

			if ((securityInfo === undefined || securityInfo === null || securityInfo === false)) {
				console.warn("headersReceivedCallback/getSecurityInfoPromise didnt return a securityInfoObject for site with protocol" + targetURL.protocol + "!");
				// TODO: What, if there is no security info?
				return;
			}

			let elem = new TabInfo(JSON.parse(JSON.stringify(targetURL)));
			elem.requestId = details.requestId;
			elem.security = JSON.parse(JSON.stringify(securityInfo)) || null;
			// FIXME: we only want to push, if there is something new.
			tabs["" + details.tabId + ""].res.push(elem);
		}
	}

	/*
	 * communication with other parts
	 */

	/*
	 * Sidebar communication
	 */
	function onSidebarMessageReceivedCallback(message, sender, receipt_fn) {
		if (!sender.hasOwnProperty("name")) throw ("Invalid Sender: has no property name");
		if (!sender.hasOwnProperty("sender")) throw ("Invalid Sender: has no property sender");

		if (sender.name === "sidebar") {
			console.debug("onSidebarMessageReceivedCallback: received \"" + JSON.stringify(message) + "\"");
			/* TODO: identify and process known message here */
			if (message.cmd === "HELO") {
				comports.sidebar.postMessage({ "cmd": "OLEH", "text": "sidebar script. This is background." });
			} else if (message.cmd === "OLEH") {
				console.debug("onSidebarMessageReceivedCallback: connection established -\"" + message.text + "\"");
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
				+ "\" " + JSON.stringify(message) + "\"");
		}
	}
	/*
	 * Content communication
	 */

	function onContentMessageReceivedCallback(message, sender, receipt_fn) {
		if (!sender.hasOwnProperty("name")) throw ("Invalid Sender: has no property name");
		if (!sender.hasOwnProperty("sender")) throw ("Invalid Sender: has no property sender");
		if (!sender.sender.hasOwnProperty("tab")) throw ("Invalid Sender: has no property sender.tab");
		if (!sender.sender.tab.hasOwnProperty("id")) throw ("Invalid Sender Tab: has no property id");
		if (sender.name === "content") {
			console.debug("onContentMessageReceivedCallback: received \"" + JSON.stringify(message) + "\"");
			if (comports.content[sender.sender.tab.id]) {
				/* TODO: identify and process known message here */
				if (message.cmd === "HELO") {
					let msg = {
						"cmd": "OLEH",
						"text": "content script. " + sender.sender.tab.id + ", This is background."
					};
					comports.content[sender.sender.tab.id].postMessage(msg);
				} else if (message.cmd === "OLEH") {
					console.debug("onContentMessageReceivedCallback: connection established -\"" + message.text + "\"");
				}
				/* End TODO */
				else {
					console.warn("onContentMessageReceivedCallback: received unknown message \""
						+ JSON.stringify(message) + "\"");
				}
				if (receipt_fn) {
					receipt_fn({ "received": true });
				}
			}
		} else {
			console.error("onContentMessageReceivedCallback: received message from unknown sender:"
				+ "(" + JSON.stringify(sender) + ")"
				+ "\" " + JSON.stringify(message) + "\"");
		}
	}

	/*
	 * communication hub
	 */

	function onConnectCallback(port) {
		let name;
		if (!port.hasOwnProperty("name")) {
			throw ("onConnectCallback: port connected is invalid. " + JSON.stringify(port));
		}
		if (port.name === "sidebar") {
			name = port.name;
			comports.sidebar = port;
			comports.sidebar.onMessage.addListener(onSidebarMessageReceivedCallback);
		} else if (port.name === "content") {
			let tab = port.sender.tab;
			name = port.name + "_" + tab.id;
			comports.content[tab.id] = port;
			comports.content[tab.id].onMessage.addListener(onContentMessageReceivedCallback);
		} else {
			throw ("onConnectCallback: connected from unknown port \"" + port.name + "\"");
		}
		port.postMessage({ "cmd": "HELO", "text": name + ". This is background." });

		console.info("onConnectCallback: connection accepted from " + name);
	}

	/*
	 * code run
	 */
	var rval = {
		"extension": extension,
	};
	try {
		browser.browserAction.onClicked.addListener(function(tab) {
			browser.sidebarAction.isOpen() ? browser.sidebarAction.close() : browser.sidebarAction.open();
		});

		browser.runtime.onConnect.addListener(onConnectCallback);

		browser.tabs.onCreated.addListener(onTabCreatedCallback);
		browser.tabs.onRemoved.addListener(onTabRemovedCallback);

		browser.tabs.onActivated.addListener(onTabActivatedCallback);

		browser.tabs.onUpdated.addListener(onTabUpdatedCallback,
			{
				"urls": ["<all_urls>"],
				"properties": ["status"]
			});

		browser.webRequest.onHeadersReceived.addListener(onHeadersReceivedCallback,
			{ urls: ["<all_urls>"] },
			["blocking"]);


		rval.result = "OK";
	} catch (ex) {
		rval.result = "Failed";
		rval.reason = JSON.stringify(ex);
	}
	return rval;
}

function waitForActvation() {
	var sidebar_port;
	
	function onSidebarConfirmation(message, sender, receipt_fn) {
		if (!sender.hasOwnProperty("name")) throw ("Invalid Sender: has no property name");
		if (!sender.hasOwnProperty("sender")) throw ("Invalid Sender: has no property sender");

		if (sender.name === "sidebar") {
			console.debug("onSidebarConfirmation: received \"" + JSON.stringify(message) + "\"");
			if (message.cmd === "ACTI") {
				browser.runtime.onConnect.removeListener(waitForSidebarConnect);
				init()
					.then(
						function(res) {
							let msg_fn = null;
							if (res.result === "OK") {
								sidebar_port.postMessage({ "cmd": "ITCA", "text": name + ". This is background." });
								msg_fn = console.log;
							} else if (res.result === "Failed") {
								msg_fn = console.error
							} else {
								throw ("init: unknown result status (" + JSON.stringify(res) + ")");
							}
							msg_fn(JSON.stringify(res));
						},
						function(ex) { console.error("Failed to initialize: " + JSON.stringify(ex)); }
					);
			}
		}
	}

	function waitForSidebarConnect(port) {
		if (port.name === "sidebar") {
			sidebar_port = port;
			port.onMessage.addListener(onSidebarConfirmation);
		}
	}

	browser.runtime.onConnect.addListener(waitForSidebarConnect);
}

waitForActvation();