$(document).ready(function(){
	PureWebSocket.connect();
	
	$("#pureCanvas").pureCanvas({
		setting: {
			resizeType: 'page',
			
			containterStyle: {
				'border': '1px soild'
			}
		},
		toolkit: {
			style: {
				strokeStyle: 'rgba(255,0,0,1)'
			}
		}
	});
	
	$("#pureCanvas").pureCanvas('setting', 'backgroundImage', 'http://spnimage.edaily.co.kr/images/photo/files/NP/S/2015/05/PS15051800042.jpg');
	
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
		
		PureWebSocket.send(data);
	});
	
	$("#pureCanvas").on('show.bg.pureCanvas', function(e){
		console.log(e);
		
		var data = e.imageData;
		data.eventType = 'bg';
		
		PureWebSocket.send(data);
	});
	
	$("#pureCanvas").on('canvas-resize.pureCanvas', function(e){
		console.log(e);
	});
	
	$("#pureCanvas").on('scroll-move.pureCanvas', function(e){
		console.log(e);
		
		var data = e.scrollData;
		data.eventType = 'scroll';
		
		PureWebSocket.send(data);
	});
	
	$("#pureCanvas").on('history.pureCanvas', function(e){
		console.log(e);
		
		var data = e.historyData;
		data.eventType = 'history';
		
		PureWebSocket.send(data);
	});
	
	
	
	
	////////////////////////////////////////////////////////////////////////
	
	
	$("#purePallete > ul > li").on('click', function(){
		var $this = $(this);
		
		$("#purePallete > ul > li").removeClass('press');
		$(this).addClass('press');
	});
	
	/////////////////////////////////////////////////////////////////////////
	
	$("#rate").on("input", function(){
		var $this = $(this);
		
		var data = {
			eventType: 'zoom',
			type: 'rate',
			rateVal: $this.val()
		}
		
		PureWebSocket.send(data);
	});
	
	$("#page").on("click", function(){
		var $this = $(this);
		
		var data = {
			eventType: 'zoom',
			type: 'page',
		}
		
		PureWebSocket.send(data);
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
		
		$("#pureCanvas").css({width: $(window).width() - 350, height: $(window).height() - 50});
	});
	
});












var PureWebSocket = {
	url: 'ws://172.16.34.77:9090/testerweb/ws/default',
	ws: null,

	connect: function(callback){
		if(this.ws == null){
			this.ws = new WebSocket(this.url);
			
			this.ws.onopen = function(){
				console.log('Opened!');
				
				if(callback && typeof callback == 'function'){
					callback();
				}
			}
			
			this.ws.onmessage = function(messageEvent){
				var msg = JSON.parse(messageEvent.data);
				console.log(msg);
				var canvasId = $("#pureCanvas").pureCanvas('setting', 'id');
				
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
			
			this.ws.onclose = function(){
				console.log('Closed!');
				
				PureWebSocket.ws = null;
				PureWebSocket.connect(function(){
					console.log('re connect.');
				});
			}
			console.log(this.ws);
		}else{
			console.log('이미 연결되어 있음.');
		}
	},

	send: function(msg){
		if(this.ws != null){
			try{
				this.ws.send(JSON.stringify(msg));
			}catch(ex){
				this.ws = null;
				PureWebSocket.connect(function(){
					this.send(msg);
				});
			}
		}else{
			console.log('연결되어 있지 않음.');
			this.ws = null;
			PureWebSocket.connect(function(){
				this.send(msg);
			});
		}
	},

	closeEvent: function(){
		if(this.ws != null){
			this.ws.close();
			this.ws = null;
			
			PureWebSocket.connect(function(){
				this.send(msg);
			});
		}else{
			console.log('연결되어 있지 않음.');
		}
	},
}



