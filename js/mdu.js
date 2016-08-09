
var MDU = {} || MDU;

MDU.LogLevel = {
	ERROR : 4,
	WARN : 3,
	INFO : 2,
	DEBUG : 1,
	NONE : 0,
	fromString : function (level) {
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


MDU.date = {};
MDU.date.time_formats = {};
MDU.date.time_formats.GB = [
	[60, 'just now', 1], // 60
	[120, '1 minute ago', '1 minute from now'], // 60*2
	[3600, 'minutes', 60], // 60*60, 60
	[7200, '1 hour ago', '1 hour from now'], // 60*60*2
	[86400, 'hours', 3600], // 60*60*24, 60*60
	[172800, 'yesterday', 'tomorrow'], // 60*60*24*2
	[604800, 'days', 86400], // 60*60*24*7, 60*60*24
	[1209600, 'last week', 'next week'], // 60*60*24*7*4*2
	[2419200, 'weeks', 604800], // 60*60*24*7*4, 60*60*24*7
	[4838400, 'last month', 'next month'], // 60*60*24*7*4*2
	[29030400, 'months', 2419200], // 60*60*24*7*4*12, 60*60*24*7*4
	[58060800, 'last year', 'next year'], // 60*60*24*7*4*12*2
	[2903040000, 'years', 29030400], // 60*60*24*7*4*12*100, 60*60*24*7*4*12
	[5806080000, 'last century', 'next century'], // 60*60*24*7*4*12*100*2
	[58060800000, 'centuries', 2903040000] // 60*60*24*7*4*12*100*20, 60*60*24*7*4*12*100
];

MDU.date.toPrettyString = function (date) {
	var time_formats = MDU.date.time_formats.GB;

	//if (typeof(date) == 'string') date = date.replace(/-/g,"/").replace(/[TZ]/g," ");
	if (typeof(date) == 'string') date = new Date(date);
	
	var seconds = (new Date - date) / 1000;
	var token = 'ago', list_choice = 1;
	if (seconds < 0) {
		seconds = Math.abs(seconds);
		token = 'from now';
		list_choice = 2;
	}
	var i = 0, format;
	while (format = time_formats[i++]) if (seconds < format[0]) {
	if (typeof format[2] == 'string')
		return format[list_choice];
	else
		return Math.floor(seconds / format[2]) + ' ' + format[1] + ' ' + token;
	}
	return date.toString();
};


MDU.XML = {};
MDU.XML.entityMap = {
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;"
};
MDU.XML.escape = function (text) {
	return text.replace(/[&<>]/g, function (s) {
		return MDU.XML.entityMap[s];
	});
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
	return text.replace(/[&<>"'\/]/g, function (s) {
		return MDU.HTML.entityMap[s];
	});
};

MDU.REGEX_isAbsoluteURL = new RegExp('^(?:[a-z]+:)?//', 'i');
MDU.isAbsoluteURL = function(url) {	
	return MDU.REGEX_isAbsoluteURL.test(url); 	
};

MDU.getLocation = function(url) { 
	var a = document.createElement("a"); 
	a.href = url; 
	var l = { protocol : a.protocol, hostname : a.hostname, port : a.port, pathname : a.pathname }; 
	return l; 
};

MDU.stripParametersFromURL = function (url) {
	var questionMarkPos = url.indexOf("?");
	if (questionMarkPos<0) return url;
	return url.substring(0,questionMarkPos);
};
MDU.getFilenameFromURL = function (url) {
	url = MDU.stripParametersFromURL(url);
	var m = url.toString().match(/.*\/(.+)/);
	if (m && m.length > 1)
	{
		return m[1];
	}
	return null;
};


MDU.getURLParameter = function (key) {
	return decodeURIComponent((new RegExp('[?|&]' + key + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search) || [null, ''])[1].replace(/\+/g, '%20')) || null;
};
MDU.getHashPartFromURL = function (url) {
	var hash_position = url.indexOf('#');
	return hash_position < 0 ? null : url.substr(hash_position+1);
};


