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
