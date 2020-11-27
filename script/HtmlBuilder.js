/**
 * @file HTML Builder Class
 * @author Holger Smolinski
 * @copyright (C), 2020 Holger Smolinski
 * @license MPL-2.0 This Source Code Form is subject to the terms of the Mozilla
 *          Public License, v. 2.0. If a copy of the MPL was not distributed
 *          with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
 
class HtmlBuilder {
	constructor(tag) {
		if ( tag.length == 0) throw ("Invalid tag");
		this.node = document.createElement(tag);
		return this;
	}

	build() {
		return this.node;
	}
	append(node) {
		this.node.append(node);
		return this;
	}

	setAttribute(name, value) {
		this.node.setAttribute(name, value);
		return this;
	}
	addEventListener(event, handler) {
		this.node.addEventListener(event, handler);
		return this;
	}
	addCssClass(class_) {
		this.node.classList.add(class_);
		return this;
	}
	setInnerHtml(value) {
		this.node.innerHTML = value;
		return this;
	}
	makePopup(parms) {
		if ( this.node.id === undefined ) {
			throw("Attribute `id` must be set before creating a popup"); 
		}
		let popup_parms = parms;
		this.addCssClass("popup");
		this.addEventListener("mouseover", function(event) {
			/* console.debug("Launching popup process for " + this.id); */
			this.classList.add("triggered");
			this.mouseover_timeout_fn = setTimeout(function(arg) {
				let popup_host = arg[0];
				// console.debug("Launching popup for " + popup_host.id);
				popup_host.classList.remove("triggered");
				let popup = new HtmlBuilder("span")
					.setInnerHtml(popup_parms.text || "default text")
					.setAttribute("class", "popuptext")
					.setAttribute("id", popup_host.id + "_popup_text")
					.addCssClass("show")
					.addEventListener("click", function() {
						// console.debug("clicked on " + this.id + ". Closing");
						if (this.fade_out_timer) {
							clearTimeout(this.fade_out_timer);
							this.fade_out_timer = null;
						}
						this.classList.remove("show");
					})
					.addEventListener("mouseover", function() {
						if (this.fade_out_timer) {
							// console.debug("Mouse on " + this.id + ". Stopping timer");
							clearTimeout(this.fade_out_timer);
							this.fade_out_timer = null;
						}
					})
					.addEventListener("mouseout", function() {
						if (this.classList.contains("show")) {
							// console.debug("Mouse off " + this.id + ". Starting timer " + this.classList);
							this.fade_out_timer = setTimeout(function(iarg) {
								// console.debug("Resumed Timeout over Closing on " + iarg[0].id);
								iarg[0].fade_out_timer = null;
								iarg[0].classList.remove("show");
							}, 5000, [this]);
						}
					})
					.build();
				popup_host.append(popup);
				// console.debug("Starting fade out timer on " + popup.getAttribute("id"));
				popup.fade_out_timer = setTimeout(function(iarg) {
					// console.debug("Timeout over Closing on " + iarg[0].id);
					iarg[0].fade_out_timer = null;
					iarg[0].classList.remove("show");
				}, 5000, [popup]);
			}, 2000, [this]);
		});
		this.addEventListener("mouseout", function(event) {
			if (this.mouseover_timeout_fn) {
				this.classList.remove("triggered");
				clearTimeout(this.mouseover_timeout_fn);
				this.mouseover_timeout_fn = null;
			}
		});
		return this;
	}
}