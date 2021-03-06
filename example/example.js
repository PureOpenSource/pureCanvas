$(document).ready(function(){
	//PureWebSocket.connect();
	
	$("#pureCanvas").pureCanvas({
	});
	/*$("#pureCanvas").pureCanvas('setting', 'backgroundImage', {
		imageSrc: 'http://spnimage.edaily.co.kr/images/photo/files/NP/S/2015/05/PS15051800042.jpg',
		callback: function(imageInfo){
			var data = imageInfo;
			data.eventType = 'bg';
			
			PureWebSocket.send(data);
		}
	});*/
	
	$('#backgroundImage').click();
	$('#page').click();
	$('#TextEditor').click();
	
	$("#pureCanvas").on('complate.draw.pureCanvas', function(e){
		var data = e.drawData;
		var timeStamp = e.timeStamp;
		data.eventType = 'draw';
		
		console.log(data);
		console.log(JSON.stringify(data));
		
		PureWebSocket.send(data);
	});
	
//	$("#pureCanvas").on('show.bg.pureCanvas', function(e){
//		var data = e.imageData;
//		data.eventType = 'bg';
//		
//		PureWebSocket.send(data);
//	});
	
	$("#pureCanvas").on('canvas-resize.pureCanvas', function(e){
	});
	
	$("#pureCanvas").on('scroll-move.pureCanvas', function(e){
		var data = e.scrollData;
		data.eventType = 'scroll';
		
		PureWebSocket.send(data);
	});
	
	$("#pureCanvas").on('history.pureCanvas', function(e){
		var data = e.historyData;
		data.eventType = 'history';
		
		PureWebSocket.send(data);
	});

	//////////////////////////////////////////////////////////////////
	
	$("#rate").on("input", function(){
		var $this = $(this);
		
		var data = {
			eventType: 'zoom',
			type: 'rate',
			rateVal: $this.val()
		}
		$('#rateval').html($this.val());
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
		else if($this.attr('data-pure-canvas-type') == 'zoom'){
			var zoom = Number($('#zoom').val());
			if($this.attr('id') == 'zoomprev'){
				zoom = zoom + 10;
			}else{
				zoom = zoom - 10;
			}
			value = zoom / 100;
			$('#zoom').val(zoom);
		}
		else if(optionType == 'type' || $this.attr('data-pure-canvas-value')){
			value = $this.attr('data-pure-canvas-value');
		}
		else if(optionType == 'backgroundImage'){
			value = {
					imageSrc: $this.prev().val(),
				callback: function(imageInfo){
					var data = imageInfo;
					data.eventType = 'bg';
					
					PureWebSocket.send(data);
				}
			}
		}
		else{
			if($this.attr('type') == 'checkbox'){
				value = $this.is(':checked');
			}
			else{
				value = $this.val();
			}
		}
		
		$("#pureCanvas").pureCanvas(optionName, optionType, value);
		
	});
	
	var r = function(){
		var body = $(document.body);
		$("#pureCanvas").css({width: $(window).width() - 350, height: $(window).height() - 50});
		$("#pureCanvas").pureCanvas('resize');
	}

	$(window).on('resize', function(){
		r();
	});
	//r();
});

var s = '{"id":"b2615dd7-41bd-fec2-2d45-b5f98936f7b0","type":"TextEditor","font":{"fontSize":14,"fontFamily":"Gulim","fontTypeBold":false,"fontTypeItalic":false,"fontTypeUnderline":false,"fillStyle":"rgba(0,0,0,100)"},"point":"424 415","text":"일너게 문자다","eventType":"draw"}';

var PureWebSocket = {
	url: 'ws://172.16.34.77:9090/testerweb/ws/default',
	ws: null,

	connect: function(){
		if(this.ws == null){
			this.ws = new WebSocket(this.url);
			
			this.ws.onopen = function(){
				console.log('Opened!');
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
			}
		}else{
			console.log('연결되어 있지 않음.');
			this.ws = null;
		}
	},

	closeEvent: function(){
		if(this.ws != null){
			this.ws.close();
			this.ws = null;
		}else{
			console.log('연결되어 있지 않음.');
		}
	},
}



