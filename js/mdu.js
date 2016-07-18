
var MDU = {};


MDU.REGEX_isAbsoluteURL = new RegExp('^(?:[a-z]+:)?//', 'i');
MDU.isAbsoluteURL = function(url) {	
	return MDU.REGEX_isAbsoluteURL.test(url); 	
}

MDU.getLocation = function(url) { 
	var a = document.createElement("a"); 
	a.href = url; 
	var l = { protocol : a.protocol, hostname : a.hostname, port : a.port, pathname : a.pathname }; 
	return l; 
}


MDU.getURLParameter = function (key) {
	return decodeURIComponent((new RegExp('[?|&]' + key + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search) || [null, ''])[1].replace(/\+/g, '%20')) || null;
};
 
