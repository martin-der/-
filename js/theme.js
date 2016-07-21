
var Theme = Theme || {};

Theme.config = {};

Theme.config.configurator = {
	themes : [],
	selects_selector : "select#theme",
	resolve_location : 'theme/{0}' //see http://stackoverflow.com/a/4673436
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
				//if (options.setThemeClientSide) {
					this.setTheme ( name );
				//}
				themeSelects.children("option[value='"+name+"']").prop('selected', true)
			}

		},
		setTheme : function ( name ) {
			var urlPrefix = '';
			
			var i;
			
			var theme = null;
			for ( i=0 ; i<this.config.themes.length ; i++ ) {
				var theme_i = this.config.themes[i];
				if (theme_i.name === name) {
					theme = theme_i;
					break;
				}
			}
			if (theme === null) {
				throw "No such theme '"+name+"'";
			}
			
			var resetCssLink = "<link id='theme_reset_css' rel='stylesheet' href='"+urlPrefix+"theme/reset.css' type='text/css'>";
			
			var mainUrl;
			if (!theme.url) {
				mainUrl = urlPrefix+"theme/"+theme.name+"/main.css";
			} else {
				mainUrl = "...";
			}
			var mainCssLink = "<link id='theme_main_css' rel='stylesheet' href='"+mainUrl+"' type='text/css'>";

			var mandatoryCssLink = "<link id='theme_mandatory_css' rel='stylesheet' href='"+urlPrefix+"theme/mandatory.css' type='text/css'>";

			jQuery("html>head>link[id='theme_reset_css'],html>head>link[id='theme_main_css'],html>head>link[id='theme_mandatory_css']").remove();
			jQuery("html>head").append(resetCssLink + mainCssLink + mandatoryCssLink);
		}
	}
}; 

