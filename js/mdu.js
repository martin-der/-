
var MDU = {};

MDU.getURLParameter = function (key) {
	return decodeURIComponent((new RegExp('[?|&]' + key + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search) || [null, ''])[1].replace(/\+/g, '%20')) || null;
};
 
