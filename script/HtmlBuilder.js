class HtmlBuilder {
	constructor(tag) {
		this.node = document.createElement(tag);
		return this;
	}

	build(){
		return this.node;
	}
	append(node) {
		this.node.append(node);
		return this;
	}
	
	setAttribute(name, value) {
		this.node.setAttribute(name,value);
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
}