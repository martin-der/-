
var WebUtil = WebUtil || {};

WebUtil.makeSmoothAnchorClick = function (root,element) {
	var href = jQuery.attr(element, 'href');

	if ( ! ( href && href.match(/^#/) ) )
	return;

	var jqRoot = jQuery(root)
	var scroll_duration = 500;
	
	jQuery(element).on("click", function (event) {
		if (event.which == 1) {
			var jqHref = jQuery(href);
			if (jqHref.length === 0) {
				if (console && console.error) console.error("[SmoothScroll] No such ID '"+href+"'");
				return;
			}
			event.preventDefault();
			jqRoot.animate({
				scrollTop: jqHref.offset().top
			}, scroll_duration, function () {
				window.location.hash = href;
			});
		}
	});
}
WebUtil.makeSmoothAnchorsClick = function (root,parent) { 
	var jqParent = jQuery(parent); 
	jqParent.find('a').each(function(){
		var href = jQuery.attr(this, 'href');
		if ( ! ( href && href.match(/^#/) ) )
			return;
		WebUtil.makeSmoothAnchorClick(root,this); 
	});
} 
