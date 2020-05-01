
function hasClass(item, value) {
	return (item.getAttribute("class").includes(value));
}

function removeClass(item, value) {
	if (item.getAttribute("class").includes(value)) {
		item.setAttribute("class", item.getAttribute("class").replace(value, ""));
	}
}

function addClass(item, value) {
	removeClass(item, value);
	item.setAttribute("class", item.getAttribute("class")+ " "+value+" ");
}