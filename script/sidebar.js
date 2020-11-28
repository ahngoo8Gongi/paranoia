/**
 * @file Paranoia extension for Mozilla Firefox (sidebar.js)
 * @author Holger Smolinski
 * @copyright (C), 2020 Holger Smolinski
 * @license MPL-2.0 This Source Code Form is subject to the terms of the Mozilla
 *          Public License, v. 2.0. If a copy of the MPL was not distributed
 *          with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

(function() {
	const manifest = browser.runtime.getManifest();
	const extension = {
		"name": manifest.name,
		"version": manifest.version,
		"copyright": "(C) 2020, " + manifest.author,
		"license": "MPL-2.0",
		"function": "sidebar.js",
	};

	async function initSidebar() {
		/*
		 * extension meta data
		 */

		function makeDisplaySecurityInfo(res) {
			let element = new HtmlBuilder("img")
				.addCssClass("small_icon");

			if (res.security === null) {
				element.setAttribute("src", "../icons/nossl.png")
			} else {
				element.setAttribute("src", "../icons/ssl.png");
			}

			let security = assessSecurityInfo(res.security);
			return element
				.addCssClass(security)
				.addEventListener("click", function() {
					alert("ssl clicked");
				});
		}

		function makeDisplayCookieInfo(res) {
			return new HtmlBuilder("img")
				.addCssClass("small_icon")
				.setAttribute("src", "../icons/cookie.png")
				.addEventListener("click", function() {
					alert("cookie clicked");
				});
		}

		function makeDisplayScriptInfo(scripts) {

		}

		function makeDisplayEntry(res) {
			if (!res.hasOwnProperty("url")) {
				throw ("makeDisplayEntry: invalid resource (no url!)");
			}
			return new HtmlBuilder("tr")
				.append(new HtmlBuilder("td")
					.append(makeDisplaySecurityInfo(res).build())
					.setAttribute("id", "SecurityHost")
					.makePopup()
					.build())
				.append(new HtmlBuilder("td")
					.addCssClass("httpstatus")
					.setInnerHtml(res.status ? (res.status + "") : "Old")
					.setAttribute("id", "StatusHost")
					.makePopup()
					.build())
				.append(new HtmlBuilder("td")
					.append(makeDisplayCookieInfo(res).build())
					.setAttribute("id", "CookieHost")
					.makePopup()
					.build())
				.append(new HtmlBuilder("td")
					.append(new HtmlBuilder("div")
						.addCssClass("truncate")
						.setInnerHtml(res.url)
						.build())
					.setAttribute("id", "UrlHost")
					.makePopup({
						"text": res.url
					})
					.addCssClass("truncated")
					.build())
				.append(new HtmlBuilder("td")
					.setInnerHtml("Script")
					.setAttribute("id", "ScriptHost")
					.makePopup()
					.build());
		}

		function displayTab(tab) {
			orderTabByHost(tab, true);
			let thead = new HtmlBuilder("thead")
				.append(makeDisplayEntry(tab).build());

			let tbody = new HtmlBuilder("tbody");
			for (let res of tab.res) {
				let row = makeDisplayEntry(res);
				tbody.append(row.build());
			}

			let table = new HtmlBuilder("table")
				.setAttribute("id", "ResTable")
				.append(thead.build())
				.append(tbody.build());

			let content = document.getElementById("content");
			while (content.firstChild != null) {
				content.removeChild(content.firstChild);
			}
			content.append(table.build());
		}

		var tabDisplayTasklet = null;
		function doTabDisplayUpdate(tab) {
			tabDisplayTasklet = null;
			displayTab(tab);
		}
		function triggerTabDisplayUpdate(tab) {
			if (tabDisplayTasklet != null) {
				clearTimeout(tabDisplayTasklet);
				// No need to reset to null, as JS in synchronous!
			}
			tabDisplayTasklet = setTimeout(doTabDisplayUpdate, 0, tab);
		}
		/*
		 * Communication with background script 
		 */
		function sideBarCommandProcessor(m, sender, receipt_fn) {
			if (!m.hasOwnProperty("cmd")) throw ("Invalid message. No cmd property");

			if (m.cmd === "HELO") {
				myPort.postMessage({ "cmd": "OLEH", "text": "background script. This is sidebar." });
			} else if (m.cmd === "OLEH") {
				console.info("sideBarCommandProcessor: connection established -\"" + m.text + "\"");
			} else if (m.cmd === "DISP") {
				if (!m.hasOwnProperty("arg")) throw ("Invalid message. No arg property");
				// console.debug("sideBarCommandProcessor: change tab display");
				triggerTabDisplayUpdate(m.arg);
			} 
			else {
				throw ("Invalid message from " + sender.name + ":" + JSON.stringify(m));
			}
			if (receipt_fn) {
				receipt_fn({ "received": true });
			}
		}

		/*
		 * code run
		 */
		var rval = {
			"extension": extension,
		};
		var myPort;
		try {
			myPort = browser.runtime.connect({
				name: "sidebar"
			});
			const heloMsg = { "cmd": "HELO", "text": "background script. This is sidebar." };
			myPort.onMessage.addListener(sideBarCommandProcessor);
			myPort.postMessage(heloMsg);

			/* TODO: keepalive mechanism... */

			rval.result = "OK";
		} catch (ex) {
			rval.result = "Failed";
			rval.reason = JSON.stringify(ex);
		}
		return rval;
	}

	function waitForBgReady(m) {
		if (m.cmd === "ITCA") {
			initSidebar()
				.then(
					function(res) {
						let msg_fn;
						if (res.result === "OK") {
							msg_fn = console.log;
						} else if (re.result === "Failed") {
							msg_fn = console.error
						} else {
							throw ("initSidebar: unknown result (" + JSON.stringify(res) + ")");
						}
						msg_fn(JSON.stringify(res));
					},
					function(ex) {
						console.error("initSidebar: failed (" + JSON.stringify(ex) + ")");
					}
				);
		}
	}

	function enablePlugin() {
		var myPort = browser.runtime.connect({
			name: "sidebar"
		});
		myPort.onMessage.addListener(waitForBgReady);
		myPort.postMessage({ "cmd": "ACTI", "text": "background script. This is sidebar." });
	}

	cssEnableLanguage(browser.i18n.getUILanguage(), manifest.default_locale);
	for (let button of document.getElementsByName("confirmation")) {
		button.addEventListener("click", enablePlugin);
	}
}());