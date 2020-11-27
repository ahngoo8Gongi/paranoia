/**
 * @file Paranoia extension for Mozilla Firefox (security.js)
 * @author Holger Smolinski
 * @copyright (C), 2020 Holger Smolinski
 * @license MPL-2.0 This Source Code Form is subject to the terms of the Mozilla
 *          Public License, v. 2.0. If a copy of the MPL was not distributed
 *          with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
 
 function assessSecurityInfo(secInfo) {
 	/* 
 	 * returns:
 	 * "nossl" - if ssl is not at all used
 	 * "badssl" - is ssl is invalid
 	 * "wrongssl" - if ssl has weaknesses
 	 * "somessl" - if ssl is present but not trustful
 	 * "goodssl" - if ssl is good
 	 * keywords are re-used as CSS classes
 	 */
 	if ( secInfo === null ) {
 		return "nossl";
 	}
 	return "somessl";
 }