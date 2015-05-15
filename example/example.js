$(document).ready(function(){
	$("#pureCanvas").pureCanvas({
		toolkit: {
			style: {
				strokeStyle: 'rgba(255,0,0,1)'
			}
		}
	});
	
	$("#pureCanvas").pureCanvas('setting', 'backgroundImage', 'https://www.google.co.kr/images/nav_logo195.png');
	
	var total = 0;
	var index = 0;
	var temp;
	
	$("#pureCanvas").on('complate.draw.pureCanvas', function(e){
		console.log(e.drawData, e.timeStamp);
		
		var data = e.drawData;
		var timeStamp = e.timeStamp;
		

		
		if(data.type == 'MousePointer'){
			if(data.points != null){
				if(index > 0){
					total += timeStamp - temp;
				}
				temp = timeStamp;
				
				index++;
			}else{
				console.log(index, total, total/index);
				
				index = 0;
				total = 0;
			}
		}
		
		
	});
	
	$("#pureCanvas").on('show.bg.pureCanvas', function(e){
		console.log(e);
	});
	
	$("#pureCanvas").on('canvas-resize.pureCanvas', function(e){
		console.log(e);
	});
	
	$("#pureCanvas").on('scroll-move.pureCanvas', function(e){
		console.log(e);
	});
	
	$("[data-pure-canvas-option]").on('click input change', function(e){
		var $this = $(this);
		
		if($this.attr('type')  == 'file'  && !$this.val()){
			return;
		}
		
		var optionName = $this.attr('data-pure-canvas-option');
		
		var optionType = $this.attr('data-pure-canvas-type');
		
		var value;
		if($this.attr('data-pure-canvas-value') == 'rate'){
			value = {'type': 'rate', 'rateVal': $this.val()};
		}
		else if(optionType == 'type' || $this.attr('data-pure-canvas-value')){
			value = $this.attr('data-pure-canvas-value');
		}
		else if(optionType == 'backgroundImage'){
			value = $this.prev().val();
		}
		else{
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