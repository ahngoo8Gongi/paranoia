/**
 * @file PaWS extension for Mozilla Firefox
 * @author Holger Smolinski
 * @copyright (C), 2020 Holger Smolinski
 * @license MPL-2.0 This Source Code Form is subject to the terms of the Mozilla
 *          Public License, v. 2.0. If a copy of the MPL was not distributed
 *          with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
 
class TabInfo {
		constructor(url) {
			this.url = url;       /* (reduced) url of location */
			this.urlhash = "0x0"  /* hash of (reduced) URL */ 
			this.security = null; /* security information */
			this.cookies = {      /* cookies sent/received */
				"out": [],
				"in":  []	
			};
			this.res = [];        /* array of children */
			this.view = {};       /* hints for display, to be used by sidebar on reload */
		}
}