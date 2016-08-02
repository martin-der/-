
var MDU = {} || MDU;

MDU.LogLevel = {
	ERROR : 4,
	WARN : 3,
	INFO : 2,
	DEBUG : 1,
	NONE : 0,
	fromString(level) {
		if (!level) return null;
		level = string1.toLowerCase();
		if (level === 'error') return this.ERROR;
		if (level === 'warn') return this.WARN;
		if (level === 'info') return this.INFO;
		if (level === 'debug') return this.DEBUG;
		if (level === 'none') return this.NONE;
		return null;
	}
	
}

MDU.PostProcessCallback = {
	done : null,
	fail : null
};


MDU.config = {};

MDU.string = {};

MDU.string.format = function(format) {
	var args = Array.prototype.slice.call(arguments, 1);
	return MDU.string.formatv(format, args);
};
MDU.string.formatv = function(format, args) {
	return format.replace(/{(\d+)}/g, function(match, number) { 
		return typeof args[number] != 'undefined' ? args[number] : match;
	});
};

MDU.string.dirname = function (path) {
	return path.match( /.*\// );
}
MDU.string.basename = function (path) {
	return path.replace( /.*\//, "" );
}
 

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

MDU.HTML = {};
MDU.HTML.entityMap = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': '&quot;',
    "'": '&#39;',
    "/": '&#x2F;'
};
MDU.HTML.escape = function (text) {
    return String(string).replace(/[&<>"'\/]/g, function (s) {
      return entityMap[s];
    });
}

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

MDU.stripParametersFromURL = function (url) {
	var questionMarkPos = url.indexOf("?");
	if (questionMarkPos<0) return url;
	return url.substring(0,questionMarkPos);
},
MDU.getFilenameFromURL = function (url) {
	url = MDU.stripParametersFromURL(url);
	var m = url.toString().match(/.*\/(.+)/);
	if (m && m.length > 1)
	{
		return m[1];
	}
	return null;
}


MDU.getURLParameter = function (key) {
	return decodeURIComponent((new RegExp('[?|&]' + key + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search) || [null, ''])[1].replace(/\+/g, '%20')) || null;
};


