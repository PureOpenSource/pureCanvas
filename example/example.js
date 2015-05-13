$(document).ready(function(){
	$("#pureCanvas").pureCanvas({
	});
	
	$("#pureCanvas").pureCanvas('setting', 'backgroundImage', 'https://www.google.co.kr/images/nav_logo195.png');
	
	$("#pureCanvas").on('complate.draw.pure', function(e){
		console.log(e.drawData);
	});
	
	$("#pureCanvas").on('show.bg.pure', function(e){
		console.log(e);
	});
	
	$("#pureCanvas").on('canvas-resize.pure', function(e){
		console.log(e);
	});
	
	
	
	$("[data-pure-canvas-option]").on('click input', function(e){
		var $this = $(this);
		
		var optionName = $this.attr('data-pure-canvas-option');
		
		var optionType = $this.attr('data-pure-canvas-type');
		
		var value;
		if(optionType == 'type'){
			value = $this.attr('data-pure-canvas-value');
		}else{
			value = $this.val();
		}
		
		console.log(optionName, optionType, value);
		
		$("#pureCanvas").pureCanvas(optionName, optionType, value);
		
	});
	
	$(window).on('resize', function(){
		var body = $(document.body);
		body.width();
		body.height();
		
		console.log(body.width(), body.height(),$(window).width(), $(window).height());
		
		$("#pureCanvas").css({width: $(window).width() - 250, height: $(window).height() - 50});
	});
	
});