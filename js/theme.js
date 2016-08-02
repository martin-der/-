
var Theme = Theme || {};

Theme.config = {};

Theme.config.configurator = {
	themes : [],
	selects_selector : "select#theme",
	location_system : 'theme',
	location : 'theme/{0}',
	extra : {
		themes : [],
		location : null
	},
	post_process : MDU.PostProcessCallback
};

Theme.Reference = function(name, label, url) {
	
	if (!name || !label) {
		throw "'name' and 'label' requiered";
	}
	
	return {
		name : name,
		label : label,
		url : url
	};
}

/**
 * config : {
 *	post_process : {
 *		done : function ( name, context )
 *		fail : function ( name, context, failures )
 *			@param context : {
 *				trigger : 'setup'|'event.change'|'user'
 *			}
 *			@param failures : array of errorThrown objects as returned by jquery
 *	}
 *}
 */
Theme.Configurator = Theme.Configurator || function(a) {
	
	var config = a ? jQuery.extend(true, {}, Theme.config.configurator, a ) : jQuery.extend(true, {}, Theme.config.configurator );

	return {
		actual : null,
		config : config,
		setup : function() {

			var head = jQuery("html>head");

			head.append(jQuery("<style>",{ id:'theme_reset_css', type:'text/css'}));
			head.append(jQuery("<style>",{ id:'theme_main_css', type:'text/css'}));
			head.append(jQuery("<style>",{ id:'theme_mandatory_css', type:'text/css'}));

			var themeSelects = jQuery(config.selects_selector);

			var i, j;
			
			var NO_SECTION_NAME = "__null__";
		
			for ( j=0 ; j<themeSelects.length ; j++ ) {
				var themeSelect = jQuery(themeSelects[j]);
				themeSelect.append(jQuery("<option>", {
					value : NO_SECTION_NAME,
					text : "",
					disabled : true
				}));
				for ( i=0 ; i<this.config.themes.length ; i++ ) {
					var theme = this.config.themes[i];
					themeSelect.append(jQuery("<option>", {
						value : theme.name,
						text : theme.label
					}));
				}
				for ( i=0 ; i<this.config.extra.themes.length ; i++ ) {
					var theme = this.config.extra.themes[i];
					themeSelect.append(jQuery("<option>", {
						value : theme.name,
						text : theme.label
					}));
				}
			}
		
			var this_configurator = this;

			themeSelects.on('change', function (e) {
				var option = jQuery('option:selected', this);
				var theme = this.value;
				
				if (jQuery.blockUI) {
					jQuery.blockUI({ message: '<h1>'+"Loading '"+theme+"'..."+'</h1>' });
				}
				try {
					this_configurator.loadTheme ( theme, "event.change" );
				} catch (ex) {
					if (console && console.error) console.error(ex);
					if (this_configurator.config.post_process.fail)
						this_configurator.config.post_process.fail(theme, ex);
				} finally {
					if (jQuery.blockUI) {
						jQuery.unblockUI();
					}
				}

			});

			var name = null;

			if (MDU.getURLParameter) {
				name = MDU.getURLParameter('theme');
			}
			if (!name && Cookies) {
				name = Cookies.get('theme');
			}

			if ( name ) {
				this.loadTheme ( name, "setup" );
			} else {
				updateUISelection ( NO_SECTION_NAME );
			}

		},
		updateUISelection : function ( name ) {
			var themeSelects = jQuery(config.selects_selector);
			themeSelects.children("option[value='"+name+"']").prop('selected', true);
		},
		setTheme : function ( name ) {
			this.loadTheme ( name, "user" );
		},
		loadTheme : function ( name, trigger ) {
			var urlPrefix = '';
			
			var context = { trigger : trigger };
			
			var this_configurator = this;
			
			var i;
			
			var isExtra = false;
			
			var theme = null;
			for ( i=0 ; i<this.config.themes.length ; i++ ) {
				var theme_i = this.config.themes[i];
				if (theme_i.name === name) {
					theme = theme_i;
					break;
				}
			}
			if (theme === null) {
				for ( i=0 ; i<this.config.extra.themes.length ; i++ ) {
					var theme_i = this.config.extra.themes[i];
					if (theme_i.name === name) {
						theme = theme_i;
						isExtra = true;
						break;
					}
				}
			}
			
			if (theme === null) {
				throw "No such theme '"+name+"'";
			}
			
			var cssUrl = {
				reset : this.config.location_system+"/reset.css",
				main : null,
				mandatory : this.config.location_system+"/mandatory.css"
			}

			var mainUrl;
			if (!theme.url) {
				if (isExtra) {
					cssUrl.main = MDU.string.format(this.config.extra.location, theme.name)+"/main.css";
				} else {
					cssUrl.main = MDU.string.format(this.config.location, theme.name)+"/main.css";
				}
			} else {
				cssUrl.main = theme.url+'/main.css';
			}
			
			var jqXHR_done_handler_builder = function(css_file) {
				return function(data, textStatus, jqXHR) {
					var prefix = (css_file.url.indexOf('/') > -1) ? MDU.string.dirname(css_file.url) : "";
					css_file.content = data.replace(/url\((['"]?)(.+?)\1\)/g, "url('"+prefix+"$2')");
				};
			};
			var jqXHR_fail_handler_builder = function(css_file) {
				return function(jqXHR, textStatus, errorThrown) {
					css_file.error = errorThrown;
				};
			};

			var css_files = {
				reset : { name : 'reset', url : cssUrl.reset, loading : true, content : null, error : null },
				main : { name : 'main', url : cssUrl.main, loading : true, content : null, error : null },
				mandatory : { name : 'mandatory', url : cssUrl.mandatory, loading : true, content : null, error : null }
			}
			
			var jqXHR_always_handler_builder = function(css_file) {
				return function() {
					css_file.loading = false;
					if (css_files.reset.loading === false && css_files.main.loading === false && css_files.mandatory.loading === false) {
						var success = css_files.reset.content !== null && css_files.main.content !== null && css_files.mandatory.content !== null;
						if (success) {
							jQuery("head>style[id='theme_reset_css']").html(css_files.reset.content);
							jQuery("head>style[id='theme_main_css']").html(css_files.main.content);
							jQuery("head>style[id='theme_mandatory_css']").html(css_files.mandatory.content);
							this_configurator.actual = theme.name;
							if (Cookies) {
								Cookies.set('theme', theme.name);
							}
							if (config.post_process.done) {
								config.post_process.done(theme,context);
							}
						} else {
							if ( this_configurator.actual ) {
								this_configurator.updateUISelection ( this_configurator.actual );
							}
							if (config.post_process.fail) {
								var failures = [];
								if (css_files.reset.error) failures.push(css_files.reset);
								if (css_files.main.error) failures.push(css_files.main);
								if (css_files.mandatory.error) failures.push(css_files.mandatory);
								config.post_process.fail(theme,context,failures);
							}
						}
					}
				};
			};

			var jqXHR = jQuery.get( cssUrl.reset )
				.done(jqXHR_done_handler_builder(css_files.reset))
				.fail(jqXHR_fail_handler_builder(css_files.reset))
				.always(jqXHR_always_handler_builder(css_files.reset));
			var jqXHR = jQuery.get( cssUrl.main )
				.done(jqXHR_done_handler_builder(css_files.main))
				.fail(jqXHR_fail_handler_builder(css_files.main))
				.always(jqXHR_always_handler_builder(css_files.main));
			var jqXHR = jQuery.get( cssUrl.mandatory )
				.done(jqXHR_done_handler_builder(css_files.mandatory))
				.fail(jqXHR_fail_handler_builder(css_files.mandatory))
				.always(jqXHR_always_handler_builder(css_files.mandatory));

		}
	}
}; 

