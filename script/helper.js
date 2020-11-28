/**
 * @file Paranoia extension for Mozilla Firefox (helper.js)
 * @author Holger Smolinski
 * @copyright (C), 2020 Holger Smolinski
 * @license MPL-2.0 This Source Code Form is subject to the terms of the Mozilla
 *          Public License, v. 2.0. If a copy of the MPL was not distributed
 *          with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
/*
 * strips all queries and anchors from the URL
 * 
 * @param {String} url - the url to simplify
*/
function reduceUrl(url) {
	let _url = new URL(url);
	let targetURL = new URL(_url.protocol +
		(_url.host ? "//" + _url.host : "") +
		(_url.port ? ":" + _url.port : "") +
		_url.pathname);
	console.debug("reducing URL " + url + " to essential part " + targetURL.toString());
	return targetURL;
}

function commonElements(a, b) {
	let min = a.length < b.length ? a.length : b.length;
	for (let ct = 1; ct <= min; ct++) {
		let astr = a[a.length - ct];
		let bstr = b[b.length - ct];
		if (astr.localeCompare(bstr) != 0)
			return min - ct;
	}
	return 0;
}

function orderTabByHost(tab, asc) {
	const AFIRST = asc ? 1 : -1;
	const BFIRST = asc ? -1 : 1;

	let tUrl = new URL(tab.url);
	let tHost = tUrl.hostname;
	let tPath = tUrl.pathname;
	let tsplit = tHost.split(".");

	tab.res.sort(
		function(a, b) {
		let aUrl = new URL(a.url);
		let aHost = aUrl.hostname;
		let aPath = aUrl.pathname;
		let asplit = aHost.split(".");
		let bUrl = new URL(b.url);
		let bHost = bUrl.hostname;
		let bPath = bUrl.pathname;
		let bsplit = bHost.split(".");

		let acom = commonElements(asplit, tsplit);
		let bcom = commonElements(bsplit, tsplit);
		if (acom > bcom)
			return AFIRST;
		else if (acom < bcom)
			return BFIRST;
		else {
			let min = asplit.length < bsplit.length ?
				asplit.length : bsplit.length;
			for (let ct = acom; ct < min; ct++) {
				let astr = asplit[asplit.length - 1 - ct];
				let bstr = bsplit[bsplit.length - 1 - ct];

				let cv = astr.localeCompare(bstr);
				if (cv != 0)
					return cv > 0 ? BFIRST : AFIRST;
			}
			if (asplit.length < bsplit.length)
				return AFIRST;
			else if (asplit.length > bsplit.length)
				return BFIRST;
			else {
				/* hostnames are equal */
				if (aPath.localeCompare(tPath) == 0)
					return AFIRST;
				if (bPath.localeCompare(tPath) == 0)
					return BFIRST;
				return aPath.localeCompare(bPath) ? AFIRST : BFIRST;
			}
		}
	})
}

	function cssDisplayLanguage(sheet, selector, enable) {
		let found = false;
		const languageSelector=".lang-"+selector
		for (let r = 0; r < sheet.cssRules.length; r++) {
			let rule = sheet.cssRules[r];
			if (rule.type == CSSRule.STYLE_RULE &&
				rule.selectorText.startsWith(languageSelector)) {
				sheet.deleteRule(r);
				sheet.insertRule(languageSelector + " { display: "+ (enable ? "block" : "none") + "; }", r);
				console.debug("Modified CSS Style Rule " + r + ":" + sheet.cssRules[r].cssText + "/" + sheet.cssRules[r].selectorText);
				found = true;
			}
		}
		return found;
	}

	function cssEnableLanguage(lang, default_lang) {
		for (var sheet of document.styleSheets) {
			cssDisplayLanguage(sheet, lang, true) ?
			cssDisplayLanguage(sheet, default_lang, false) :
			cssDisplayLanguage(sheet, default_lang, true);
		}
	}