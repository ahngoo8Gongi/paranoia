/**
 * @file Paranoia extension for Mozilla Firefox (TabInfo.js)
 * @author Holger Smolinski
 * @copyright (C), 2020 Holger Smolinski
 * @license MPL-2.0 This Source Code Form is subject to the terms of the Mozilla
 *          Public License, v. 2.0. If a copy of the MPL was not distributed
 *          with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
 
class TabInfo {
		constructor(url) {
			if ( !url ) console.warn("TabInfo Created without URL");
			this.url = url;       /* eated (reduced) url of location */
			this.status = false;
			if (url) this.urlhash = SHA256(url);  /* hash of (reduced) URL */
			this.requestID = null; 
			this.security = null; /* security information */
			this.cookies = {      /* cookies sent/received */
				"out": [],
				"in":  []	
			};
			this.res = [];        /* array of children */
			this.view = {};       /* hints for display, to be used by sidebar on reload */
		}
}