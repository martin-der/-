

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

MarkdownDisplay.Config = {
	PostProcessCallback : MDU.PostProcessCallback,
	nameToURLConverter : {
		name_match : null,
		convert : null
	}
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
		nameToURLConverters : [],
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
		handleDone : function (url, content, extra, user) {
			var done_callback = this.config.callback.done;
			if (done_callback) {
				done_callback(url,content,extra,user);
			}
		},
		handleFail : function (url, error, extra, user) {
			var fail_callback = this.config.callback.fail;
			if (fail_callback) {
				fail_callback(url,error,extra,user);
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
		user_data : null,
		load : function (url, user) {
			if (!MarkdownDisplay.Loader_onLoadedFromFarAway) MarkdownDisplay.Loader_onLoadedFromFarAway = this.onLoadedFromFarAway;
			if (jQuery(script_selector).length==0) {
				jQuery("body").append("<script id='"+script_id+"' />");
			}
			var script = jQuery(script_selector);
			MarkdownDisplay.Loader_instance = this;
			try {
				//jQuery.get('http://www.whateverorigin.org/get?url=' + encodeURIComponent(url) + '&callback=MarkdownDisplay.Loader_onLoadedFromFarAway', function(data){
				//	alert(data.contents);
				//});
				script.attr('src', 'http://www.whateverorigin.org/get?url='+encodeURIComponent(url)+'&callback=MarkdownDisplay.Loader_onLoadedFromFarAway');
			} catch(ex) {
				this.handleFail (url,ex,user);
			}
		},
		onLoadedFromFarAway : function (data) {
			
			var url = data.status.url;
			var extra = {};
		
			if (data.status.http_code != 200) {
				MarkdownDisplay.Loader_instance.handleFail (url, ex, extra, MarkdownDisplay.Loader_instance.user_data);
			} else {
				MarkdownDisplay.Loader_instance.handleDone(url, data.contents, extra, MarkdownDisplay.Loader_instance.user_data);
			}
		}
	};
	
	return jQuery.extend(true, this, this_loader);
};
MarkdownDisplay.Loader.ViaAjaxLoader = function(a, b) {

	jQuery.extend(true, this, new MarkdownDisplay.Loader.AbstractLoader(a,b));

	var this_loader = this;

	var load = function (url,user) {
		var this_loader_in_load = this_loader;

		var jqXHR = jQuery.ajax( url )
		.done(function(data, textStatus, jqXHR) {
			var extra = {};
			var lastModified = jqXHR.getResponseHeader('Last-Modified');
			if (!lastModified) {
				lastModified = jqXHR.getResponseHeader('Date');
			}
			if (lastModified) {
				try {
					extra.modification_date = new Date(lastModified);
				} catch (e) { }
			}
			this_loader_in_load.handleDone (url, data, extra, user);
		})
		.fail(function(jqXHR, textStatus, errorThrown) {
			var extra = {};
			this_loader_in_load.handleFail (url,textStatus+" ("+errorThrown+")", extra, user);
		});
	};
	
	jQuery.extend(true, this, {
		load : load 
	});
	
	return this_loader;
}


MarkdownDisplay.NameToURLConverter =  function(name_match, output){
	
	if ( typeof name_match === 'string' ) {
		name_match = new Regex(name_match);
	} else if ( ! (name_match instanceof RegExp) ) {
		throw "Parameter 'name_match' must be a regex";
	}
	
	var typeof_output = typeof output;
	var output_choice = { convert : null, format : null };
	if ( typeof_output === 'function' ) {
		output_choice.convert = output;
	} else if ( typeof_output === 'string' ) {
		output_choice.format = output;
	} else {
		throw "Parameter 'output' must be a function or a string";
	}
	
	return {
		name_match : name_match,
		output : output_choice,
		getValues : function (name) {
			var match = this.name_match.exec(name);
			if (!match) return null;
			match.shift();
			return match;
		},
		convert : function(name) {
			var values = this.getValues(name);
			if (this.output.format) {
				return MDU.string.formatv(this.output.format, values);
			} else {
				return this.output.convert(name, values);
			}
		}
	}
};

MarkdownDisplay.config.NameToURLConverters = {
	GITHUB_DEVELOP : new MarkdownDisplay.NameToURLConverter ( /^github\/([^\/]+)\/([^\/]+)\/(.+)!$/ , 'https://raw.githubusercontent.com/{0}/{1}/develop/{2}'),
	GITHUB : new MarkdownDisplay.NameToURLConverter ( /^github\/([^\/]+)\/([^\/]+)\/(.+)$/ , 'https://raw.githubusercontent.com/{0}/{1}/master/{2}')
};



MarkdownDisplay.BuilderUtil = {
	hasMDSuffix : function (name) {
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
	getTitleFromMarkdownURL : function (url) {
		var title = MDU.getFilenameFromURL(url);
		
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
			return;
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
		appendToData : function ( data, url, content ) {
			return jQuery.extend(true, {}, data, { content : content, source : { url : url } });
		},
		pre_process : {
			build : function(data) {
				data.title = builder.Util.getTitleFromMarkdownURL(data.source.url);
				if (builder.config.pre_process.build) {
					return builder.config.pre_process.build(data);
				}
				return true;
			}
		},
		post_process : {
			done : function(data) {
				var content = data.content;
				var url = data.source.url;
				// Sanitize href
				var base_url = url.substring(0, url.lastIndexOf("/"));
				jQuery(config.content.target.content_selector).find("a[href]").each(function(){
					var this_a = jQuery(this);
					var href = this_a.attr('href');
					var isAbsolute = MDU.isAbsoluteURL(href);

					var real_url;
					var hash_part = MDU.getHashPartFromURL(href);
					if (isAbsolute) {
						real_url = href;
					} else if (href.startsWith('#')) {
						// don't do anything
					} else {
						if (href.startsWith('/')) {
							var doc_location = MDU.getLocation(url);
							real_url = doc_location.protocol + '//' + doc_location.host + href;
						} else {
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
										builder.pre_process.build(result);
										window.history.pushState(result, result.title, location.protocol + '//' + location.host + location.pathname+"?md="+real_url);
										builder.post_process.done(result);
									} catch (ex) {
										if (console &&  console.error) console.error ('No hsitory', ex);
									}
								}
							}
						});
					} else {
						this_a.attr("href",real_url);
					}
				});
				// build graphs
				var themeCSSModify = false;
				jQuery(config.content.target.content_selector).find("pre>code").each(function() {
					var jqCode = jQuery(this);
					var divGraph = jqCode.parent().after("<div>").next();
					var isGraph = true;
					try {
						if (jqCode.hasClass('sequence')) {
							divGraph.html(jqCode.html());
							jQuery(divGraph).sequenceDiagram({theme: 'hand'});
						} else if (jqCode.hasClass('flow')) {
							//jQuery(divGraph).attr('id','tmpGraphid');
							//var chart = flowchart.parse(jqCode.html());
							//chart.drawSVG(divGraph);
							divGraph.html(jqCode.html());
							divGraph.flowchart()
						} else {
							isGraph = false;
						}
						if (isGraph) {
							jqCode.remove();
							divGraph.addClass('sub-container').addClass('graph');
							divGraph.find("svg[stroke],svg>[stroke]").removeAttr('stroke');
							if ( ! themeCSSModify ) {
								themeCSSModify = true;
								var strokeColor = divGraph.find("svg").css('stroke');
								//divGraph.find("svg marker>use[href='#raphael-marker-block']").css('fill', strokeColor);
								//jQuery.injectCSS({
								//	'.graph svg marker>use' : { fill : strokeColor }
								//});
							}
							divGraph.find("svg marker>use").css('fill', strokeColor);
						} else {
							jqCode.parent().addClass('sub-container');
							// FIXME : adding divGraph and remove it in some cases is not efficient
							divGraph.remove();
						}
					} catch (ex) {
						if (console &&  console.error) console.error (ex);
						divGraph.remove();
					}
				});

				if (builder.config.post_process.done) {
					builder.config.post_process.done(data);
				}
			},
			fail : function(data,error) {
				if (builder.config.post_process.fail) {
					builder.config.post_process.fail(data,error);
				} else {
					throw "Unable to load '"+data.url+"' : "+error;
				}
			}
		},
		buildPage : function ( data, targetContent, targetTitle) {
			
			var mdContent = data.content;
			var title = data.title;

			var htmlContent = MarkdownDisplay.converter.toHtml(mdContent);


			jQuery(targetContent).html(htmlContent);
			if (title) {
				document.title = title;
				jQuery(targetTitle).html(title);
				if (data.source.url) {
					jQuery(targetTitle).attr('title',data.source.url);
				}
			}
		},
		acquireThenBuild : function(config) {
			var local_config = jQuery.extend(true, {}, this.config, config);

			var data = {
				source : jQuery.extend(true,{},this.config.content.source),
				title : this.config.content.title
			};

			if ( local_config.content.source.text ) {
				data.content = this.config.content.source.text;
				this.buildPage ( data, this.config.target.content_selector, this.config.target.title_selector );
				return;
			}
			
			if ( !this.config.content.source.url && !this.config.content.source.url_parameter ) {
				throw "When no text is given, one of 'config.content.source.url' or 'config.content.source.url_parameter' must be provided";
			}
			
			var url = local_config.content.source.url;
			if (!url) {
				url = MarkdownDisplay.BuilderUtil.getURLParameter(local_config.content.source.url_parameter);
				if (url == null) {
					var parameters = location.search;
					if ( parameters && parameters!='' ) {
						parameters = /^\?([^&]*)$/.exec(parameters);
						if (parameters) url = decodeURIComponent(parameters[1]);
					}
				}
				if (url == null) {
					throw "No URL parameter '"+local_config.content.source.url_parameter+"' found";
				}
			}
			
			var simplified_url = null;
			if (local_config.content.nameToURLConverters) {
				var i;
				for ( i=0 ;  i<local_config.content.nameToURLConverters.length ; i++ ) {
					var converter = local_config.content.nameToURLConverters[i];
					if (converter.name_match.exec(url)) {
						simplified_url = url;
						url = converter.convert(url);
						break;
					}
				}
			}

			data.source.url = url;
			if (simplified_url)
				data.source.simplified_url = simplified_url;

			if ( !local_config.content.from_url_fetcher ) {
				throw "When no text is given, 'config.content.from_url_fetcher' must be provided";
			}
			local_config.content.from_url_fetcher.load(url,data);
		},
		Util : MarkdownDisplay.BuilderUtil
	};

	if (config.useHistory) { 
		window.onpopstate = function(event) { 
			var data = event.state;
			builder.buildPage(data, config.content.target.content_selector, config.content.target.title_selector); 
		}; 
	}

	if ( !config.content.source.text && (config.content.source.url || config.content.source.url_parameter) ) {
		if (!config.content.from_url_fetcher) {
			var builder_config = config;
			var title_selector = builder_config.content.target.title_selector;
			var content_selector = builder_config.content.target.content_selector;
			config.content.from_url_fetcher = new MarkdownDisplay.Loader.ViaAjaxLoader({
				callback : {
					done : function (url, content, extra, user){
						var data = builder.appendToData(user, url, content);
						data.source.modification_date = extra.modification_date;
						builder.pre_process.build(data);
						builder.buildPage(data, builder_config.content.target.content_selector, builder_config.content.target.title_selector);
						builder.post_process.done(data);
					},
					fail : function (url, error, extra, user) {
						var data = builder.appendToData(user, url, null);
						builder.post_process.fail(data, error);
					}
				}
			});
		}
	}
	
	return builder;
};

