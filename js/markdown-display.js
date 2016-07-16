

var MarkdownDisplay = MarkdownDisplay || {};

function getLocation(url) {
	// location.protocol+'//'+location.hostname+(location.port ? ':'+location.port: '')
	var a = document.createElement("a");
    a.href = url;
    var l = { protocol : a.protocol, hostname : a.hostname, port : a.port, pathname : a.pathname };
	return l;
}	

MarkdownDisplay.config = {};

MarkdownDisplay.Config = {};
MarkdownDisplay.Config.PostProcessCallback = {
	done : null,
	fail : null
};
MarkdownDisplay.config.loader = {
	callback : jQuery.extend(true, {}, MarkdownDisplay.Config.PostProcessCallback)
};
MarkdownDisplay.config.builder = {
	content : {
		source : {
			text : null,
			url : null,
			url_parameter : null
		},
		title : null,
		from_url_fetcher : null
	},
	target : {
		title_selector : null,
		content_selector : null
	},
	post_process : jQuery.extend(true, {}, MarkdownDisplay.Config.PostProcessCallback)
};

MarkdownDisplay.Loader_onLoadedFromFarAway = null;
MarkdownDisplay.Loader_instance = null;

MarkdownDisplay.Loader = {};
/**
 * @params
 *     @param done_callback : function
 *     @param fail_callback : function
 * @params
 *     @param config
 */
MarkdownDisplay.Loader.AbstractLoader = function(a, b) {
		var config = null;

	var a_type = typeof(a);
	
	if ("function" == a_type) {
		config = jQuery.extend(true, {}, MarkdownDisplay.config.loader);
		config.callback.done = a;
		var b_type = typeof(b);
		if ( b_type != "undefined" && b_type != "function") {
			throw "Second parameter, 'fail callback' mush be a function";
		}
		config.callback.done = b;
	} else if ("undefined" == a_type){
		config = jQuery.extend(true, {}, MarkdownDisplay.config.loader);
	} else {
		config = jQuery.extend(true, {}, MarkdownDisplay.config.loader, a);
	}
	
	return {
		config : config,
		handleFail : function (url, error) {
			var fail_callback = this.config.callback.fail;
			if (fail_callback) {
				fail_callback(url,error);
			} else {
				throw "Error while loading content from URL '"+url+"' : "+error;
			}
		}
	};
}
MarkdownDisplay.Loader.ViaProxyLoader = function(a, b) {
	
	jQuery.extend(true, this, new MarkdownDisplay.Loader.AbstractLoader(a,b));
	
	var script_id = "markdown-display_on-the-fly-loader";
	var script_selector = "body>script[id='"+script_id+"']";
	
	var this_loader = {
		load : function (url) {
			if (!MarkdownDisplay.Loader_onLoadedFromFarAway) MarkdownDisplay.Loader_onLoadedFromFarAway = this.onLoadedFromFarAway;
			if (jQuery(script_selector).length==0) {
				jQuery("body").append("<script id='"+script_id+"' />");
			}
			var script = jQuery(script_selector);
			MarkdownDisplay.Loader_instance = this;
			try {
				script.attr('src', 'http://www.whateverorigin.org/get?url='+encodeURIComponent(url)+'&callback=MarkdownDisplay.Loader_onLoadedFromFarAway');
			} catch(ex) {
				this.handleFail (url,ex);
			}
		},
		onLoadedFromFarAway : function (data) {
			
			var url = data.status.url;
		
			if (data.status.http_code != 200) {
				var fail_callback = MarkdownDisplay.Loader_instance.config.callback.fail;
				MarkdownDisplay.Loader_instance.handleFail (url,ex);
			}

			var done_callback = MarkdownDisplay.Loader_instance.config.callback.done;
			if (done_callback) {
				done_callback(url, data.contents);
			}
		}
	};
	
	return jQuery.extend(true, this, this_loader);
};
MarkdownDisplay.Loader.ViaAjaxLoader = function(a, b) {

	jQuery.extend(true, this, new MarkdownDisplay.Loader.AbstractLoader(a,b));

	var this_loader = this;
	
	jQuery.extend(true, this, {
		load : function (url) {
			var jqXHR = jQuery.get( url )
			.done(function(data, textStatus, jqXHR) {
				jqXHR.this_MarkdownDisplay_loader.config.callback.done (url, data);
			})
			.fail(function(jqXHR, textStatus, errorThrown) {
				jqXHR.this_MarkdownDisplay_loader.handleFail (url,textStatus+" ("+errorThrown+")");
			});
			jqXHR.this_MarkdownDisplay_loader = this_loader;
		}
	});
	
	return this_loader;
}


MarkdownDisplay.BuilderUtil = {
	stripMDSuffix : function (name) {
		var m = name.toString().match(/(.*)\.[mM][dD]$/);
		if (m && m.length > 1)
		{
			return m[1];
		}
		return name;
	},
	getFilenameFromURL : function (url)
	{
		var m = url.toString().match(/.*\/(.+)/);
		if (m && m.length > 1)
		{
			return m[1];
		}
		return null;
	},
	getTitleFromMarkdownURL : function (url) {
		var title = this.getFilenameFromURL(url);
		
		if (title) { 
			title = this.stripMDSuffix ( title );
		} else {
			title = "";
		}
		return title;
	},
	getURLParameter : function (key) {
		return MDU ? MDU.getURLParameter(key) : undefined;
	}
};

/**
 * @params ( config )
 */
MarkdownDisplay.Builder = function(a) {

	var config = null;

	var a_type = typeof(a);
	
	if ("function" == a_type) {
		config = jQuery.extend(true, {}, MarkdownDisplay.config.loader);
		config.post_process.done = a;
		var b_type = typeof(b);
		if ( b_type != "undefined" && b_type != "function") {
			throw "Second parameter, 'fail post_process' mush be a function";
		}
		config.post_process.done = b;
	} else if ("undefined" == a_type){
		config = jQuery.extend(true, {}, MarkdownDisplay.config.loader);
	} else {
		config = jQuery.extend(true, {}, MarkdownDisplay.config.loader, a);
	}
	
	var builder = { 
		config : config,
		buildPage : function (mdContent, title, targetContent, targetTitle) {
			var converter = new showdown.Converter();
			var htmlContent = converter.makeHtml(mdContent);

			jQuery(targetContent).html(htmlContent);
			if (title) {
				document.title = title;
				jQuery(targetTitle).html(title);
			}
		},
		build : function() {
			if ( this.config.content.source.text ) {
				this.buildPage ( this.config.content.source.text, this.config.content.title, this.config.target.content_selector, this.config.target.title_selector );
				return;
			}
			
			if ( !this.config.content.source.url && !this.config.content.source.url_parameter ) {
				throw "When no text is given, one of 'config.content.source.url' or 'config.content.source.url_parameter' must be provided";
			}
			
			var url = this.config.content.source.url;
			if (!url) {
				url = MarkdownDisplay.BuilderUtil.getURLParameter(this.config.content.source.url_parameter);
				if (url == null) {
					throw "Url parameter '"+this.config.content.source.url_parameter+"' not found";
				}
			}
			
			if ( !this.config.content.from_url_fetcher ) {
				throw "When no text is given, 'config.content.from_url_fetcher' must be provided";
			}
			this.config.content.from_url_fetcher.load(url);
		},
		Util : MarkdownDisplay.BuilderUtil
	};
	
	if ( !config.content.source.text && (config.content.source.url || config.content.source.url_parameter) ) {
		if (!config.content.from_url_fetcher) {
			var builder_config = config;
			var title_selector = builder_config.content.target.title_selector;
			var content_selector = builder_config.content.target.content_selector;
			config.content.from_url_fetcher = new MarkdownDisplay.Loader.ViaAjaxLoader({
				callback : {
					done : function (url, content){
						var title = builder.Util.getTitleFromMarkdownURL(url);
						builder.buildPage(content,title, builder_config.content.target.content_selector, builder_config.content.target.title_selector);
						if (builder_config.post_process.done) {
							builder_config.post_process.done(url,content);
						}
					},
					fail : function (url, error) {
						if (builder_config.post_process.fail) {
							builder_config.post_process.fail(url,error);
						} else {
							throw "unable to load '"+url+"' : "+error;
						}
					}
				}
			});
		}
	}
	
	return builder;
};

