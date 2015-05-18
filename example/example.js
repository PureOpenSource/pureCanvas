$(document).ready(function(){
	$("#pureCanvas").pureCanvas({
		setting: {
			resizeType: 'page'
		},
		toolkit: {
			style: {
				strokeStyle: 'rgba(255,0,0,1)'
			}
		}
	});
	
	$("#pureCanvas").pureCanvas('setting', 'backgroundImage', 'http://thimg.todayhumor.co.kr/upfile/201505/14319062302vK8aFBWBHTP.jpg');
	
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
		
		data.eventType = 'draw';
		
		send(data);
	});
	
	$("#pureCanvas").on('show.bg.pureCanvas', function(e){
		console.log(e);
		
		var data = e.imageData;
		data.eventType = 'bg';
		
		send(data);
	});
	
	$("#pureCanvas").on('canvas-resize.pureCanvas', function(e){
		console.log(e);
	});
	
	$("#pureCanvas").on('scroll-move.pureCanvas', function(e){
		console.log(e);
		
		var data = e.scrollData;
		data.eventType = 'scroll';
		
		send(data);
	});
	
	$("#pureCanvas").on('history.pureCanvas', function(e){
		console.log(e);
		
		var data = e.historyData;
		data.eventType = 'history';
		
		send(data);
	});
	
	
	
	$("#rate").on("input", function(){
		var $this = $(this);
		
		var data = {
			eventType: 'zoom',
			type: 'rate',
			rateVal: $this.val()
		}
		
		send(data);
	});
	
	$("#page").on("click", function(){
		var $this = $(this);
		
		var data = {
			eventType: 'zoom',
			type: 'page',
		}
		
		send(data);
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
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	var ws = null;

	connect = function(){
		if(ws == null){
			ws = new WebSocket('ws://172.16.34.77:9090/testerweb/ws/default');
			
			
			ws.onopen = function(){
				console.log('Opened!');
			}
			
			ws.onmessage = function(messageEvent){
				//var view = document.getElementById('view')
				//view.value += '\n' + messageEvent.data;
				var msg = JSON.parse(messageEvent.data);
				console.log(msg);
				var canvasId = $("#pureCanvas").data('pure.pureCanvas').options.setting.id;
				
				if(canvasId == msg.id){
					console.log('is Me', canvasId, msg.id);
					return;
				}
				
				if(msg.eventType === 'draw'){
					$("#pureCanvas").pureCanvas('toolkit', 'draw', msg);
				}
				else if(msg.eventType === 'bg'){
					$("#pureCanvas").pureCanvas('setting', 'backgroundImage', msg.imageSrc);
				}
				
				else if(msg.eventType === 'zoom'){
					$("#pureCanvas").pureCanvas('setting', 'resizeType', msg);
				}
				
				else if(msg.eventType === 'scroll'){
					$("#pureCanvas").pureCanvas('setting', 'scroll', msg);
				}
				
				else if(msg.eventType === 'history'){
					$("#pureCanvas").pureCanvas('history', msg);
				}
			}
			
			ws.onclose = function(){
				console.log('Closed!');
			}
			console.log(ws);
		}else{
			console.log('이미 연결되어 있음.');
		}
	}

	send = function(msg){
		if(ws != null){
			/* var msg = document.getElementById('msg').value;
			if(msg.length > 0){
				ws.send(msg);
			} */
			ws.send(JSON.stringify(msg));
		}else{
			console.log('연결되어 있지 않음.');
		}
	}

	closeEvent = function(){
		if(ws != null){
			ws.close();
			ws = null;
		}else{
			console.log('연결되어 있지 않음.');
		}
	}
	connect();	
	
});