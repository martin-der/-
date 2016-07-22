
var MDU = MDU || {};
MDU.config = {};

MDU.config.wildValue = {
	text          : undefined,
	url_parameter : undefined
};
	
/**
 * @Params 
 *   @Param { text : string }
 * @Params 
 *   @Param { url_parameter : string }
 * @Params none
 */
MDU.WildString = function(a){
	
	var makeState = function(a) {
		var a_type = typeof(a);

		if ( a_type === 'object' ) {
			return jQuery.extend(true, {}, a);
		} else if ( a_type === 'undefined' ) {
			return {};
		} else if ( a_type === 'string' ) {
			return { text : a };
		} else {
			throw "Cannot use parameter '"+a_type+"'";
		}
	}

	var state = makeState(a);
	
	return {
		state : state,
		toString : function() {
			return this.state;
		},
		setText : function(text) {
			this.state = { text : text };
		},
		setUrlParameter : function(parameter) {
			this.state = { url_parameter : parameter };
		},
		set : function(a) {
			this.state = makeState(a);
		},
		get : function() {
			if (this.state.text !== undefined) {
				return this.state.text;
			}
			if (this.state.url_parameter !== undefined) {
				return MDU.getURLParameter(this.state.url_parameter);
			}
			return undefined;
		}
	};
};


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
 
