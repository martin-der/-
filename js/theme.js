
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

Theme.Configurator = Theme.Configurator || function(a) {
	
	var config = a ? jQuery.extend(true, {}, Theme.config.configurator, a ) : jQuery.extend(true, {}, Theme.config.configurator );


	return {
		config : config,
		setup : function() {

			var head = jQuery("html>head");

			head.append(jQuery("<link>",{ id:'theme_reset_css', rel:'stylesheet'}));
			head.append(jQuery("<link>",{ id:'theme_main_css', rel:'stylesheet'}));
			head.append(jQuery("<link>",{ id:'theme_mandatory_css', rel:'stylesheet'}));

			var themeSelects = jQuery(config.selects_selector);

			var i, j;
		
			for ( j=0 ; j<themeSelects.length ; j++ ) {
				var themeSelect = jQuery(themeSelects[j]);
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
					this_configurator.setTheme ( theme );
					if (Cookies) {
						Cookies.set('theme', theme);
					}
				} catch (ex) {
					if (this_configurator.post_process.fail)
						this_configurator.post_process.fail(theme, ex);
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
				this.setTheme ( name );
				themeSelects.children("option[value='"+name+"']").prop('selected', true)
			}

		},
		setTheme : function ( name ) {
			var urlPrefix = '';
			
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
			
			var resetCssLink = "<link id='theme_reset_css' rel='stylesheet' href='"+this.config.location_system+"/reset.css' type='text/css'>";
			
			var mainUrl;
			if (!theme.url) {
				if (isExtra) {
					mainUrl = MDU.string.format(this.config.extra.location, theme.name)+"/main.css";
				} else {
					mainUrl = MDU.string.format(this.config.location, theme.name)+"/main.css";
				}
			} else {
				mainUrl = MDU.string.format(this.config.location, theme.name);
			}
			var mainCssLink = "<link id='theme_main_css' rel='stylesheet' href='"+mainUrl+"' type='text/css'>";

			var mandatoryCssLink = "<link id='theme_mandatory_css' rel='stylesheet' href='"+this.config.location_system+"/mandatory.css' type='text/css'>";

			jQuery("html>head>link[id='theme_reset_css'],html>head>link[id='theme_main_css'],html>head>link[id='theme_mandatory_css']").remove();
			jQuery("html>head").append(resetCssLink + mainCssLink + mandatoryCssLink);
		}
	}
}; 

