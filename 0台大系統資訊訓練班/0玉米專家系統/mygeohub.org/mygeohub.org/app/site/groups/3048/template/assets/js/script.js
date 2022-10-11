$(document).ready(function() {
  
	var fs = $('.flexslider');
	
	if(fs.length) {	
		fs.flexslider({
			animation: "slide",
			directionNav: false
		});
	}
	
	//evenly space menu items
	var menuBar = $('#sgNav ul').first(),
		menuBarWidth = menuBar.width(),
		menuItems = menuBar.children('li:not(#home)'),
		menuItemsWidth = 0,
		homeWidth = $('#sgNav ul #home').outerWidth(true);
	
	menuItems.each(function(index, element) {
		var listItem = $(element).find('a').first();
		//set padding to 0
		listItem.css({
			'padding-left': 0,
			'padding-right': 0
		});
		menuItemsWidth += listItem.width();
	});
	
	var remainder = menuBarWidth - menuItemsWidth;
	var padding = parseInt( (remainder - homeWidth) / menuItems.length );
	padding = padding - 10; //just a little extra grace spacing
	
	menuItems.each(function(index, element) {
		var listItem = $(element).find('a').first();
		//set padding to 0
		listItem.css({
			'padding-left': padding / 2,
			'padding-right': padding / 2
		});
	});
});

/*
$(window).load(function() {
	
	var lis = $('#sgNav > ul > li');
	var padLi = lis.slice(1);
	
	var theul = $('#sgNav > ul').width();
	
	var totw = 0;
	$.each(lis, function(index, value) {
		console.log($(value).outerWidth());
		totw += $(value).outerWidth();
	});

	var freespace = theul - totw;
	
	var perli = Math.floor((freespace / padLi.length) / 2);
	
	var currentpad = parseInt(padLi.find('a').css('padding-left'), 10);
	
	$.each(padLi, function(index, value) {
		$(value).find('a').css('padding-left', currentpad + perli).css('padding-right', currentpad + perli);
	});
	
	var homepad = parseInt($('#home').css('padding-left'), 10);
	var rem = freespace - (perli * 2 * padLi.length);
	
	$('#home').css('padding-left', rem + homepad);
});
*/