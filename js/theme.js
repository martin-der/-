 


jQuery(function () {

	var theme = null;

	if (MDU.getURLParameter) {
		theme = MDU.getURLParameter('theme');
	}
	if (!theme && Cookies) {
		theme = Cookies.get('theme');
	}

	if ( theme ) {
		//if (options.setThemeClientSide) {
			setTheme ( theme );
		//}
		// workaround problem with the server that can't select the
		// right theme option while generating the page
		jQuery("select#theme>option[value='"+theme+"']").prop('selected', true)
	}

	function setTheme ( theme) {
		var urlPrefix = '';
		
		var resetCssLink = "<link id='theme_reset_css' rel='stylesheet' href='"+urlPrefix+"theme/reset.css' type='text/css'>";
		jQuery("html>head>link[id='theme_reset_css']").remove();

		var mainCssLink = "<link id='theme_main_css' rel='stylesheet' href='"+urlPrefix+"theme/"+theme+"/main.css' type='text/css'>";
		jQuery("html>head>link[id='theme_main_css']").remove();

		var mandatoryCssLink = "<link id='theme_mandatory_css' rel='stylesheet' href='"+urlPrefix+"theme/mandatory.css' type='text/css'>";
		jQuery("html>head>link[id='theme_mandatory_css']").remove();


		$("html>head").append(resetCssLink + mainCssLink + mandatoryCssLink);
	}


	jQuery('select#theme').on('change', function (e) {
		var option = $('option:selected', this);
		var theme = this.value;
		
		if (jQuery.blockUI) {
			//jQuery.blockUI({ message: '<h1><img src="/-/image/busy.gif" />'+message.theme_loading+'</h1>' });
		}
		try {
			setTheme ( theme );
			if (Cookies) {
				Cookies.set('theme', theme);
			}
		} finally {
			if (jQuery.blockUI) {
				//jQuery.unblockUI();
			}
		}

	});


});
