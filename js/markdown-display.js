

var MarkdownDisplay = MarkdownDisplay || {};

if (typeof jQuery != 'undefined') {
	(function( $ ) {
		$.fn.flowchart = function( options ) {
			return this.each(function() {
				var $this = $(this);
				var diagram = flowchart.parse($this.text());
				$this.html('');
				diagram.drawSVG(this, options);
			});
		};
	})( jQuery );
}

function getLocation(url) {
	var a = document.createElement("a");
    a.href = url;
    var l = { protocol : a.protocol, hostname : a.hostname, port : a.port, pathname : a.pathname };
	return l;
}	

MarkdownDisplay.Config = {
	PostProcessCallback : MDU.PostProcessCallback
};

MarkdownDisplay.config = {};

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
	pre_process : {
		build : null
	},
	post_process : jQuery.extend(true, {}, MarkdownDisplay.Config.PostProcessCallback),
	useHistory : true
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
	var config;

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

	var load = function (url) {
		var this_loader_in_load = this_loader;

		var jqXHR = jQuery.ajax( url )
		.done(function(data, textStatus, jqXHR) {
			this_loader_in_load.config.callback.done (url, data);
		})
		.fail(function(jqXHR, textStatus, errorThrown) {
			this_loader_in_load.handleFail (url,textStatus+" ("+errorThrown+")");
		});
	};
	
	jQuery.extend(true, this, {
		load : load 
	});
	
	return this_loader;
}


MarkdownDisplay.BuilderUtil = {
	hasMDSuffix(name) {
		return /\.[mM][dD]$/.test(name);
	},
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

MarkdownDisplay.converter = {
	backend : null,
	convert : null,
	initBackend: function(instance) {
		var name = 'pagedown';
		if (name === 'showdown') {
			instance.backend = new showdown.Converter();
			instance.convert = function(text) {
				 return instance.backend.makeHtml(text);
			};
		}
		// default : pagedown
		instance.backend = new Markdown.Converter();
		Markdown.Extra.init(instance.backend);
		instance.convert = function(text) {
			return instance.backend.makeHtml(text);
		};
	},
	toHtml : function(text) {
		if (!this.backend) this.initBackend(this);
		return this.convert(text);
	}
};

/**
 * @params ( config )
 */
MarkdownDisplay.Builder = function(a) {

	var config;

	var a_type = typeof(a);
	
	if ("function" == a_type) {
		config = jQuery.extend(true, {}, MarkdownDisplay.config.builder);
		config.post_process.done = a;
		var b_type = typeof(b);
		if ( b_type != "undefined" && b_type != "function") {
			throw "Second parameter, 'fail post_process' must be a function";
		}
		config.post_process.done = b;
	} else if ("undefined" == a_type){
		config = jQuery.extend(true, {}, MarkdownDisplay.config.builder);
	} else {
		config = jQuery.extend(true, {}, MarkdownDisplay.config.builder, a);
	}

	var builder = { 
		config : config,
		result : {},
		pre_process : {
			build : function(url) {
				if (builder.config.pre_process.build) {
					return builder.config.pre_process.build(url);
				}
				return true;
			}
		},
		post_process : {
			done : function(url,content) {
				// Sanitize href
				jQuery(config.content.target.content_selector).find("a[href]").each(function(){
					var this_a = jQuery(this);
					var href = this_a.attr('href');
					var isAbsolute = MDU.isAbsoluteURL(href);

					var real_url;
					if (isAbsolute) {
						real_url = href;
					} else {
						if (href.startsWith('/')) {
							var doc_location = MDU.getLocation(url);
							real_url = doc_location.protocol + '//' + doc_location.host + href;
						} else {
							var base_url = url.substring(0, url.lastIndexOf("/"));
							real_url = base_url+'/'+href;
						}
					}

					if (MarkdownDisplay.BuilderUtil.hasMDSuffix(href)) {
						this_a.attr("href","viewer+"+real_url);
						this_a.addClass('md-viewer');
						this_a.on('click', function(event) {
							if (event.which == 1) {
								event.preventDefault();
								var result = builder.build({content:{source:{text:null, url_parameter:null, url:real_url}}});
								if (config.useHistory) {
									try {
										builder.pre_process.build(url);
										window.history.pushState(result, result.title, location.protocol + '//' + location.host + location.pathname+"?md="+real_url);
										builder.post_process.done(url,content);
									} catch (ex) {
										jQuery.growl.warning({title: 'No history', message: ex});
									}
								}
							}
						});
					} else {
						this_a.attr("href",real_url);
					}
				});
				// build graphs
				jQuery(config.content.target.content_selector).find("pre>code.sequence,pre>code.flow").each(function() {
					var jqCode = jQuery(this);
					var divGraph = jqCode.parent().after("<div>").next();
					try {
						if (jqCode.hasClass('sequence')) {
							divGraph.html(jqCode.html());
							jQuery(divGraph).sequenceDiagram({theme: 'hand'});
						} else /* flow */  {
							//jQuery(divGraph).attr('id','tmpGraphid');
							//var chart = flowchart.parse(jqCode.html());
							//chart.drawSVG(divGraph);
							divGraph.html(jqCode.html());
							divGraph.flowchart()
						}
						jqCode.remove();
					} catch (ex) {
						if (console &&  console.error) console.error (ex);
						divGraph.remove();
					}
				});

				if (builder.config.post_process.done) {
					builder.config.post_process.done(url,content);
				}
			},
			fail : function(url,error) {
				if (builder.config.post_process.fail) {
					builder.config.post_process.fail(url,error);
				} else {
					throw "unable to load '"+url+"' : "+error;
				}
			}
		},
		buildPage : function (mdContent, title, targetContent, targetTitle) {

			var htmlContent = MarkdownDisplay.converter.toHtml(mdContent);

			this.result.content = mdContent;
			this.result.title = title;
			this.result.html_title = title;


			jQuery(targetContent).html(htmlContent);
			if (title) {
				document.title = title;
				jQuery(targetTitle).html(title);
			}
		},
		build : function(config) {
			jQuery.extend(true, this.config, config);

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
					throw "No URL parameter '"+this.config.content.source.url_parameter+"' found";
				}
			}

			builder.pre_process.build(url);
			
			if ( !this.config.content.from_url_fetcher ) {
				throw "When no text is given, 'config.content.from_url_fetcher' must be provided";
			}
			this.config.content.from_url_fetcher.load(url);

			this.result.url = url;
			
			return this.result;
		},
		Util : MarkdownDisplay.BuilderUtil
	};

	if (config.useHistory) { 
		window.onpopstate = function(event) { 
			builder.buildPage(event.state.content,event.state.title, builder.config.content.target.content_selector, builder.config.content.target.title_selector); 
		}; 
	}

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
						builder.post_process.done(url,content);
					},
					fail : function (url, error) {
						builder.post_process.fail(url, error);
					}
				}
			});
		}
	}
	
	return builder;
};

