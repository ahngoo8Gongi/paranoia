class HtmlBuilder {
	constructor(tag) {
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
	makePopup() {
		this.addCssClass("popup");
		this.addEventListener("mouseover", function(event) {
			console.error("Launching popup process for " + this.id);
			this.classList.add("triggered");
			this.mouseover_timeout_fn = setTimeout(function(arg) {
				console.error("Launching popup for " + arg[0].id);
				arg[0].classList.remove("triggered");
				let popup = new HtmlBuilder("span")
					.setInnerHtml("text")
					.setAttribute("class", "popuptext")
					.setAttribute("id", "Popup Text")
					.addCssClass("show")
					.addEventListener("click", function() {
						console.error("clicked on " + this.id + ". Closing");
						if (this.fade_out_timer) {
							clearTimeout(this.fade_out_timer);
							this.fade_out_timer = null;
						}
						this.classList.remove("show");
					})
					.addEventListener("mouseover", function() {
						if (this.fade_out_timer) {
							console.error("Mouse on " + this.id + ". Stopping timer");
							clearTimeout(this.fade_out_timer);
							this.fade_out_timer = null;
						}
					})
					.addEventListener("mouseout", function() {
						if (this.classList.contains("show")) {
							console.error("Mouse off " + this.id + ". Starting timer " + this.classList);
							this.fade_out_timer = setTimeout(function(iarg) {
								console.error("Resumed Timeout over Closing on " + iarg[0].id);
								iarg[0].fade_out_timer = null;
								iarg[0].classList.remove("show");
							}, 5000, [this]);
						}
					})
					.build();
				arg[0].append(popup);
				console.error("Starting fade out timer on " + popup.getAttribute("id"));
				popup.fade_out_timer = setTimeout(function(iarg) {
					console.error("Timeout over Closing on " + iarg[0].id);
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