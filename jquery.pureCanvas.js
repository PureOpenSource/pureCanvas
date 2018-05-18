/*********************************************************************************************
 * PureCanvas. v0.2
 * ===========================================================================================
 * Copyright 2015 Pure OpenSource.
 * Licensed under MIT (https://github.com/PureOpenSource/pureCanvas/blob/master/LICENSE)
 *********************************************************************************************/

+function($){
	'use strict';
	
	/**
	 * Pure Canvas - Class Definition.
	 */
	
	var PureCanvas = function(element, options){
		// PureCanvas Div element 정보(createCanvas에서 추가됨)
		this.$element = $(element);
		this.$main = null;
		this.$container = null;
		// 설정 정보
		this.options = options;
		
		// Canvas ID 지정
		if(!this.options.setting.id) this.options.setting.id = this.createUUID.call(this); 
		// Canvas 정보
		this.canvasInfo = {};
		// background image 정보
		this.imageInfo = {};
		// Draw 히스터리 정보
		this.historyInfo = {
			index: -1,
			drawData: []
		}
		
		// Canvas 생성
		this.createCanvas.call(this);
		// Event 생성
		this.makeCanvasEvent.call(this);
	}

	PureCanvas.VERSION = '0.1';

	PureCanvas.DEFIN = {
		// 사용자 옵션으로 호출 가능한 prototype
		optionName: {
			// Toolkit 정보 설정
			toolkit: 'toolkit',
			// setting 정보 설정
			setting: 'setting',
			// Canvas resizing 작업 호출
			resize: 'resize',
			// draw undo, redo event
			history: 'history',
		}
	}
	
	// 사용자에 의해 설정 변경 가능한 항목
	PureCanvas.DEFAULTS = {
		// Canvas의 설정 정보
		setting: {
			// 그리기 권한
			authForDraw: true,
			// 그리기 권한이 없는 경우, 마우스 커스 모양
			notAuthForDrawCursor: 'not-allowed',
			
			// 마우스포인터 사용 권한
			pointerForDraw: true,
			// 마우스포인터 클릭 시 전송 여부
			pointerDownSend: true,
			
			// 화면 사이즈 설정 정보(page:쪽맞춤, rate:비율)
			resizeType: 'rate',
			// 화면 비율 정보(page일 경우 size에 맞게 계산, rate일 경우 입력 값) 1 = 100%
			rateVal: 1,
			
			// 마우스포인터 전송 지연 시간(ms)
			delayMousePoint: 3,
			
			containerStyle: {},
			// point 비율 계산에 따른 소수점 자리수
			pointFixed: 1,
			//autoWindowResize
			windowResizeEvent: true,
		},
		// Toolkit 정보
		toolkit: {
			// Toolkit Type, '$.pureCanvas.toolkit.type'에 정의된 것에 한함. 
			type: 'Cursor',
			// context style 설정
			style: {
				lineCap: 'round',
				lineJoin: 'round',
				// 선 색, 선택으로 채움색까지 사용함.
				strokeStyle: "rgba(0,0,0,100)",
				// 채움 색
				fillStyle: "rgba(0,0,0,100)",
				// 선 굴기
				lineWidth: 5,
			},
		},
	}

	$.extend(PureCanvas.prototype, {
		/**
		 * Create UUID
		 */
		createUUID: function(){
	        var uuid = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
	            var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
	            return v.toString(16);
	        });	
	        return uuid;
		},
		/**
		 * Create Canvas Element & Info
		 */
		createCanvas: function(){
			// Canvas 정보
			this.canvasInfo = {
				// Record Canvas 생성 - bg + main + pointer
				record: {domView: true, resize: true, clearView: false}, //true, true, false
				// Background Canvas 생성 
				bg: {domView: true, resize: true, clearView: false}, //true, true, false
				// Main Canvas 생성 - view을 비율에 맞게 조정한 Canvas
				main: {domView: true, resize: true, clearView: false}, //true, true, true
				// View Canvas 생성 - recvDraw+drawTemp+mView를 합친 Canvas
				view: {domView: false, resize: false, clearView: true}, // false, false, true
				// recvDraw Canvas 생성 - 외부 수신 데이터를 임시 Draw하는 Canvas
				recvDraw: {domView: false, resize: false, clearView: false}, //false, false, false
				// mView Canvas 생성 - 중요 포인트를 Draw하는 Canvas
				mView: {domView: false, resize: false, clearView: true}, //false, false, true
				// Pointer Canvas 생성 - 마우스포인트를 Draw하는 Canvas
				pointer: {domView: true, resize: true, clearView: false}, //true, true, false
				// DrawTemp Canvas 생성 - 원본 크기로 Draw에서 그린 데이터를 원본 크기로 임시로 다시 그리는 Canvas
				drawTemp: {domView: false, resize: false, clearView: false}, //false, false, false
				// Draw Canvas 생성 - 비율에 따른 변경되는 사용자가 임시로 그리고 있는 Canvas
				draw: {domView: true, resize: true, clearView: false}, //true, true, false
			}

			// Style & Attribute setting, append element
			this.$element.css({'display': 'table'}).attr('data-pure-canvas', 'element');
			var $main = $('<div></div>').attr('data-pure-canvas', 'main')
				.css({'display': 'block', 'position': 'absolute', 'overflow': 'auto', 'width': 'inherit', 'height': 'inherit'})
				.appendTo(this.$element); 
			var $container = $('<div></div>').attr('data-pure-canvas', 'container')
				//.css({'border': '1px solid'})
				.css(this.options.setting.containerStyle)
				.appendTo($main);
			
			this.$main = $main;
			this.$container = $container;
			
			// Canvas 정보 목록에 존재하는 Canvas 생성
			for(var key in this.canvasInfo){
				var data = this.canvasInfo[key];
				
				// Canvas 생성 및 설정
				var $canvas = $('<canvas></canvas>').attr('data-pure-canvas-type', key);
				this.settingDefaultStyle($canvas);
				if(data.domView) this.$container.append($canvas);
				//if(!data.domView) $canvas.css({'display': 'none'});
				//$container.append($canvas);
				
				// Canvas 추가 정보 설정
				data.type = key;
				data.$canvas = $canvas;
				data.canvas = $canvas.get(0);
				data.context = $canvas.get(0).getContext('2d');
			}

			console.debug(this.canvasInfo);
		},
		
		/**
		 * Canvas 기본 스타일 설정
		 */
		settingDefaultStyle: function($canvas){
			var $element = this.$element;
			
			var divWidth = $element.width();
			var divHeight = $element.height();
			
			$canvas.get(0).width = parseInt(divWidth);
			$canvas.get(0).height = parseInt(divHeight);
			$canvas.css({'position': 'absolute'});
		},
		
		/**
		 * Mouse, Touch Event 생성
		 */
		makeCanvasEvent: function(){
			var THIS = this;
			var setting = this.options.setting;
			var toolkit = this.options.toolkit;
			var $drawCanvas = this.canvasInfo.draw.$canvas;
			
			$drawCanvas.on('mousedown mousemove mouseup mouseover mouseout touchstart touchmove touchend', function(e){
				// 그리기 권한이 없는 경우 이벤트를 수행하지 않음.
				if(!setting.authForDraw){
					return;
				}
				// Touch Event인 경우 처리
				if(e.type.indexOf('touch') >= 0){
					e.preventDefault();
					e.isTouch = true;
				}
				
				// 이벤트 분류
				var type = e.type;
				var callMethod = null;
				switch (type) {
				case 'mousedown':
				case 'touchstart':
					callMethod = 'drawStart';
					
					// Touch가 아닌 경우(Mouse 인 경우) 왼쪽 클릭 만 허용함.
					if(!e.isTouch && e.button !== 0){
						return;
					}
					break;
				case 'mousemove':
				//case 'mouseover':
				case 'touchmove':
					callMethod = 'drawing';
					break;
				case 'mouseup':
				case 'touchend':
					callMethod = 'drawEnd';
					break;
				case 'mouseout':
					callMethod = 'drawOut';
					break;
				}
				
				// 추가 이벤트 정보 설정
				$.extend(e, {
					type: 'drawEvent-' + toolkit.type,
					callMethod: callMethod,
					eventType: type,
					toolkitType: toolkit.type
				});

				//console.log(e.eventType, e.type, e.callMethod, e.timeStamp, e);
				// PureCanvas Event 호출
				try{
					$drawCanvas.trigger(e);
				}catch(ex){
					console.warn('drawEvent-%s event error. [%s]', toolkit.type, ex);
				}
			})
		},
		
		/**
		 * Loading Bar 설정
		 */
		loadingBar: function(option, message){
			// Create & Show
			if(!option || option === 'show'){
				// loading bar 생성
				if(!this.loadingBarDiv){
					this.loadingBarDiv = $('<div></div>')
						.attr('data-pure-canvas', 'loadingBar')
						.css({'background-color': 'rgba(0,0,0, 0.5)', position: 'absolute', 'text-align': 'center', 'display': 'none'})
						.appendTo(this.$element);
					
					var messageBox = $('<div></div>')
						.css({padding: '10px', 'background-color': 'rgb(0,0,0)', color: '#fff', height: '21px'})
						.appendTo(this.loadingBarDiv);
					
					this.loadingBarDiv.data('messageBox', messageBox);
				}
				var messageBox = this.loadingBarDiv.data('messageBox');
				
				// 내용 변경
				this.loadingBarDiv.css({width: this.$element.width(), height: this.$element.height()});
				var top = (this.$element.height() / 2) - messageBox.height();
				messageBox.css({'margin-top': top}).html(message);

				// fade show
				this.loadingBarDiv.fadeIn(500);
			}
			// Hide
			else if(option === 'hide'){
				// fade hide
				this.loadingBarDiv.fadeOut(500);
			}
		},
	});
	
	/**
	 * Pure Canvas - Context Style Setting - 'toolkit' options 
	 */
	PureCanvas.prototype.toolkit = function(targetName, value){
		// getter
		if(!targetName && value == undefined) return this.options.toolkit;
		if(targetName && value == undefined) return this.options.toolkit[targetName] || this.options.toolkit.style[targetName];
		
		// setter
		return this.toolkit[targetName] ? this.toolkit[targetName].call(this, value) : undefined;
	}	
	$.extend(PureCanvas.prototype.toolkit, {
		type: function(value){
			var toolkit = this.options.toolkit;
			var toolkitType = $.pureCanvas.toolkit.type[value];
			
			if(toolkitType == undefined){
				console.warn('not match toolkit type. ', value);
				return;
			}
			
			// 즉시 처리 로직 수행
			if(toolkitType.instantProcess){
				console.debug('setting value instantProcess.: ' + value);
				toolkitType.instantProcess();
				return;
			}
			
			toolkit.type = value;
			console.debug('setting toolkit.type : ' + value, toolkit);
			
			// 커서 모양 변경
			this.canvasInfo.draw.canvas.style.cursor = toolkitType.getCursor();
		},
		lineWidth: function(value){
			// Use : BallPen, highlighter, StraightLine, Rectangle
			this.toolkit.contextStyle.call(this, 'lineWidth', value);
		},
		lineCap: function(value){
			// Use : BallPen, highlighter, StraightLine
			// Style : butt, round, square
			this.toolkit.contextStyle.call(this, 'lineCap', value);
		},
		lineJoin: function(value){
			// Use : BallPen, highlighter
			// Style : miter, round, bevel
			this.toolkit.contextStyle.call(this, 'lineJoin', value);
		},
		strokeStyle: function(value){
			if(typeof value == 'string') value = {color: value, opacity: 100};
			// Use : BallPen, highlighter, StraightLine, Circle, Triangle, Rectangle
			this.toolkit.contextStyle.call(this, 'strokeStyle', this.pureCanvasToolkit.hexToRgba(value.color, value.opacity));
		},
		fillStyle: function(value){
			if(typeof value == 'string') value = {color: value, opacity: 100};
			// Use : BallPen, highlighter, StraightLine, Circle, Triangle, Rectangle
			this.toolkit.contextStyle.call(this, 'fillStyle', this.pureCanvasToolkit.hexToRgba(value.color, value.opacity));
		},
		contextStyle: function(styleName, value){
			var toolkit = this.options.toolkit;
			
			toolkit.style[styleName] = value;
			console.debug('setting style [' + styleName + '] apply:' + toolkit.style[styleName] + ' , input:' + value);			
		},
		
		draw: function(toolkitData){
			if(typeof toolkitData != 'object') return;

			// 이벤트 생성 및 추가 정보 설정
			var event = $.Event('drawEvent-' + toolkitData.type, {
				callMethod: 'draw',
				eventType: 'draw.pureCanvas',
				toolkitData: toolkitData,
				toolkitType: toolkitData.type,
			});
			
			// draw canvas에 Event 호출
			try{
				this.canvasInfo.draw.$canvas.trigger(event);
			}catch(ex){
				console.warn('drawEvent-%s event error. [%s]', toolkitData.type, ex);
			}
		},
	});
	
	/**
	 * Pure Canvas - Canvas Setting - 'setting' options 
	 */	
	PureCanvas.prototype.setting = function(targetName, value){
		// getter
		if(!targetName && value == undefined) return this.options.toolkit;
		if(targetName && value == undefined) return this.options.setting[targetName];
		
		// setter
		return this.setting[targetName] ? this.setting[targetName].call(this, value) : undefined;
	}	
	$.extend(PureCanvas.prototype.setting, {
		authForDraw: function(value){
			this.options.setting.authForDraw = value;
			
			if(value){
				var cursor = $.pureCanvas.toolkit.type[this.options.toolkit.type].getCursor();
				this.canvasInfo.draw.canvas.style.cursor = cursor;
			}else{
				this.canvasInfo.draw.canvas.style.cursor = this.options.setting.notAuthForDrawCursor;
			}
			
			console.debug('setting setting.authForDraw : ' + value);
		},
		pointerForDraw: function(value){
			this.options.setting.pointerForDraw = value;
			
			console.debug('setting setting.pointerForDraw : ' + value);
		},
		pointerDownSend: function(value){
			this.options.setting.pointerDownSend = value;
			
			console.debug('setting setting.pointerDownSend : ' + value);
		},
		backgroundImage: function(value){
			var THIS = this;
			var callbackFunction;
			
			if(typeof value == 'object'){
				callbackFunction = value.callback;
				value = value.imageSrc;
			}
			
			if(THIS.imageInfo && THIS.imageInfo.imgSrc === value){
				console.debug('duplication. image. ' + value);
				return;
			}
			
			var image = new Image();
			
			var sDate = new Date();
			this.loadingBar.call(this, 'show', 'Loading...');
			image.onload = function(){
				var imageWidth = image.width;
				var imageHeight = image.height;
				
				// 이미지 원본 크기와 동일해야 되는 Canvas 크기 조정, cavnasInfo: resize = false
				$.each(THIS.canvasInfo, function(key, canvas){
					if(!canvas.resize){
						canvas.canvas.width = imageWidth;
						canvas.canvas.height = imageHeight;
					}
				});
				
				// 이미지 정보 저장
				THIS.imageInfo = {
					// 이미지 객체
					image: image,
					// 이미지 주소
					imgSrc: value,
					// 이미지 원본 가로 크기
					orgImageWidth: imageWidth,
					// 이미지 원본 세로 크기
					orgImageHeight: imageHeight,
					// re draw 여부
					isSetting: true
				}

				THIS.historyInfo = {
					index: -1,
					drawData: []
				}
				
				// canvas resize 호출
				THIS.resize();
				
				var eDate = new Date();
				console.debug("image loading time: %dms", eDate - sDate);

				try{
					// 백그라운드 이미지 출력 완료 이벤트 발생
					if(callbackFunction && typeof callbackFunction == 'function'){
						callbackFunction({id: THIS.options.setting.id, imageSrc: value});
					}
				}catch(ex){
					console.warn('callbackFunction event error. [%s]', ex);
				}
//				try{
//					THIS.$element.trigger({
//						type: 'show.bg.pureCanvas',
//						imageData: {imageSrc: value}
//					});					
//				}catch(ex){
//					console.warn('show.bg.pureCanvas event error. [%s]', ex);
//				}
				
				THIS.loadingBar.call(THIS, 'hide');
			}
			image.onerror = function(){
				console.error("["+value+"] image loading Error.");
			}
			
			image.src = value;
		},
		resizeType: function(value){
			// page(쪽맞춤), rate(비율)
			if(typeof value == 'string'){
				if(value.indexOf('rate') >= 0){
					var split = value.split("_");
					this.options.setting.resizeType = split[0];
					this.options.setting.rateVal = split[1] / 100;
				}else{
					this.options.setting.resizeType = value;
					this.options.setting.rateVal = 1;
				}
			}else{
				this.options.setting.resizeType = value.type;
				this.options.setting.rateVal = value.rateVal ? value.rateVal / 100 : 1;
			}
			
			// canvas resize 호출
			this.imageInfo.isSetting = true;
			this.resize();
			
			console.debug('setting resizeType: ' + this.options.setting.resizeType, this.options.setting.rateVal);			
		},
		
		scroll: function(value){
			this.pureCanvasToolkit.recvScrollData(value);
		}
	});
	
	/**
	 * Canvas 크기 변경
	 */
	PureCanvas.prototype.resize = function(){
		if(this.resize[this.options.setting.resizeType]){
			var data = this.resize[this.options.setting.resizeType].call(this)
			this.resize.canvasResizeNDraw.call(this, data);
		} 
		
		try{
			this.$element.trigger({
				type: 'canvas-resize.pureCanvas'
			});
		}catch(ex){
			console.warn('canvas-resize.pureCanvas event error. [%s]', ex);
		}
	}
	$.extend(PureCanvas.prototype.resize, {
		// 비율(%)
		rate: function(){
			var imageInfo = this.imageInfo;
			var rateVal = this.options.setting.rateVal;
			
			// 이미지 원본 크기 * 비율 = 비율에 맞는 이미지 크기
			var width = imageInfo.orgImageWidth * rateVal;
			var height = imageInfo.orgImageHeight * rateVal;
			
			return {width: width, height: height};
		},
		
		//쪽맞춤
		page: function(){
			var imageInfo = this.imageInfo;
			
			// main div의 크기와 원본 이미지 크기로 비율 정보 계산
			var rateWidth = this.$main.width() / imageInfo.orgImageWidth;
			var rateHeight = this.$main.height() / imageInfo.orgImageHeight;
			// 가로, 세로 중 비율 정보가 작은 값 사용
			var rateVal = (rateWidth > rateHeight) ? rateHeight : rateWidth;
			this.options.setting.rateVal = rateVal;
			
			// 이미지 원본 크기 * 비율 = 비율에 맞는 이미지 크기
			var width = imageInfo.orgImageWidth * rateVal;
			var height = imageInfo.orgImageHeight * rateVal;
			
			// 쪽맞춤일 경우 window.resize에 따라 이미지 크기가 변경됨으로 true 값 설정
			imageInfo.isSetting = true;
			return {width: width, height: height};
		},
		
		/**
		 * 켄버스 리사이즈로 인한 다시 그리기 처리
		 */
		canvasResizeNDraw: function(data){
			var width = data.width;
			var height = data.height;
			
			var imageInfo = this.imageInfo;
			var rateVal = this.options.setting.rateVal;
			
			// 왼쪽, 위 마진 정보 계산,
			var marginLeft = this.$main.width() / 2 - (width / 2);
			var marginTop = this.$main.height() / 2 - (height / 2)
			
			// border, padding size를 고려하여 가로, 세로 크기를 변경한다.
			width -= (this.$container.outerWidth() - this.$container.width());
			height -= (this.$container.outerHeight() - this.$container.height());
			
			this.$container.css({width: width, height: height, 'margin-left': marginLeft < 0 ? 0 : marginLeft, 'margin-top': marginTop < 0 ? 0 : marginTop});
			
			if(imageInfo.isSetting){
				// 이미지 원본 크기와 동일해야 되는 Canvas 크기 조정, cavnasInfo: resize = false
				$.each(this.canvasInfo, function(key, canvas){
					if(canvas.resize){
						canvas.canvas.width = width;
						canvas.canvas.height = height;
					}
				});

				var mainCtx = this.canvasInfo.main.context;
				var bgCtx = this.canvasInfo.bg.context;
				var recordCtx = this.canvasInfo.record.context;
				
				// 메인의 draw data가 비율에 맞게 변경하여 다시 출력한다.
				mainCtx.clearCanvas();
				mainCtx.save();
				mainCtx.setTransform(rateVal, 0, 0, rateVal, 0, 0);
				mainCtx.drawImage(this.canvasInfo.view.canvas, 0, 0);
				mainCtx.drawImage(this.canvasInfo.mView.canvas, 0, 0);
				mainCtx.restore();
				
				// 이미지 표시
				bgCtx.drawImage(imageInfo.image, 0, 0, width, height);
				
				// 녹화용 화면 출력
				recordCtx.clearCanvas();
				recordCtx.save();
				recordCtx.drawImage(imageInfo.image, 0, 0, width, height);
				recordCtx.setTransform(rateVal, 0, 0, rateVal, 0, 0);
				recordCtx.drawImage(this.canvasInfo.view.canvas, 0, 0);
				recordCtx.drawImage(this.canvasInfo.mView.canvas, 0, 0);
				recordCtx.restore();
				
				imageInfo.isSetting = false;
			}				
		}
	});
	
	/**
	 * History
	 */
	PureCanvas.prototype.history = function(targetName){
		var isSend = true;
		if(typeof targetName == 'object'){
			targetName = targetName.action;
			isSend = false;
		}
		this.history[targetName] ? this.history[targetName].call(this, isSend) : undefined;
	}
	$.extend(PureCanvas.prototype, {
		historyAdd: function(){
			var ctx = this.canvasInfo.view.context;
			var snapshot = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
			this.historyInfo.drawData[++this.historyInfo.index] = snapshot;
			
			while (this.historyInfo.index < this.historyInfo.drawData.length -1) {
				this.historyInfo.drawData.pop();
			}
		},
		
		changeImage: function(){
			var ctx = this.canvasInfo.view.context;
			// 초기 화면(clear)
			if(this.historyInfo.index < 0){
				ctx.clearCanvas();
			}else{
				// 저장된 index 정보의 이미지로 그린다.
				var snapshot = this.historyInfo.drawData[this.historyInfo.index];
				ctx.putImageData(snapshot, 0, 0);
			}
			
			this.pureCanvasToolkit.mainCanvasChange(true);
		}
	});
	$.extend(PureCanvas.prototype.history, {
		next: function(isSend){
			if(this.history.hasNext.call(this)){
				this.historyInfo.index++;
				this.changeImage();
				
				if(isSend){
					try{
						this.$element.trigger({
							type: 'history.pureCanvas',
							historyData: {id: this.options.setting.id, action: 'next', index: this.historyInfo.index}
						});
					}catch (ex) {
						console.warn('history.pureCanvas event error. [%s]', ex);
					}
				}
			}
		},
		prev: function(isSend){
			if(this.history.hasPrev.call(this)){
				--this.historyInfo.index;
				this.changeImage();
				
				if(isSend){
					try{
						this.$element.trigger({
							type: 'history.pureCanvas',
							historyData: {id: this.options.setting.id, action: 'prev', index: this.historyInfo.index}
						});					
					}catch(ex){
						console.warn('history.pureCanvas event error. [%s]', ex);
					}
				}
			}
		},
		
		hasNext: function(){
			return this.historyInfo.index < this.historyInfo.drawData.length - 1;
		},
		hasPrev: function(){
			return this.historyInfo.index >= 0;
		}
	});
	
	/**
	 * Pure Canvas - Plug-in Definition.
	 */
	
	function Plugin(option, _relatedTarget, _relatedValue){
		var $this = $(this);
		
		var data    = $this.data('pure.pureCanvas');
		var options = $.extend(true, {}, PureCanvas.DEFAULTS, $this.data, typeof option == 'object' && option);

		if(!data){
			$this.data('pure.pureCanvas', (data = new PureCanvas(this, options)));
			data.pureCanvasToolkit = new $.pureCanvas.toolkit(this);
		}
		
		if(typeof option == 'string' && PureCanvas.DEFIN.optionName[option]){
			var returnValue = data[option](_relatedTarget, _relatedValue);
			return returnValue == undefined ? $this : returnValue;
		}	
		
		return $this;
	}
	
	$.fn.pureCanvas = Plugin;
	$.fn.pureCanvas.Constructor = PureCanvas;
	
	
	/**
	 * Pure Canvas - Event
	 */
	$(window).on('load', function(){
		$(window).on('resize', function(){
			$('[data-pure-canvas="element"]').each(function(index, element){
				if($(element).pureCanvas('setting', 'windowResizeEvent')){
					$(element).pureCanvas('resize');
				}
			});
		});
	});
	
	/*******************************************************************************************************************************/
	
	$.pureCanvas = {};
	$.pureCanvas.toolkit = function(element){
		// Element 정보
		this.$element = element;
		this.$main = this.$element.find('[data-pure-canvas="main"]');
		
		// 설정 정보
		this.options = this.$element.data('pure.pureCanvas').options;
		this.setting = this.options.setting;
		this.toolkit = this.options.toolkit;
		
		// canvas 정보
		this.canvasInfo = this.$element.data('pure.pureCanvas').canvasInfo;
		this.drawCanvas = this.canvasInfo.draw.canvas;
		this.$drawCanvas = this.canvasInfo.draw.$canvas;
		this.drawCtx = this.canvasInfo.draw.context;
		this.drawTempCtx = this.canvasInfo.drawTemp.context;
		this.recvDrawCtx = this.canvasInfo.recvDraw.context;
		this.viewCtx = this.canvasInfo.view.context;
		this.mViewCtx = this.canvasInfo.mView.context;
		this.mainCtx = this.canvasInfo.main.context;
		this.recordCtx = this.canvasInfo.record.context;
		
		// Toolit Event 생성
		this.makeEvent();
	}

	$.extend($.pureCanvas.toolkit, {
		prototype: {
			makeEvent: function(){
				var THIS = this;
				
				// Toolkit 별 event 생성
				$.each($.pureCanvas.toolkit.type, function(toolkitType, toolkit){
					// $.pureCanvas.toolkit의 공통 function을 사용하기 위해 $.extend 함.
					$.extend(toolkit, THIS);
					// 초기 설정이 있는 경우
					if(toolkit.init) toolkit.init();
					
					THIS.$drawCanvas.on('drawEvent-' + toolkitType, function(e){
						// Canvas에 직접 Draw 하는 것만 좌표를 계산한다.
						if(e.eventType != 'draw.pureCanvas'){
							// 좌표 계산, touchend event는 값 없음.
							e.point = THIS.getPoint(e);
						}
						
						// Toolkit Type의 callMethod가 있는 경우 수행한다.
						var toolkitType = $.pureCanvas.toolkit.type[e.toolkitType];
						if(toolkitType[e.callMethod]) toolkitType[e.callMethod](e);	
					});
				});
			},
			
			sendDrawData: function(points){
				var data = {
					id: this.setting.id,
					type: this.getType(),
					style: this.toolkit.style,
					points: points ? (Object.prototype.toString.call(points) === "[object Array]") ? points.join(',') : points : null
				}
				
				try{
					this.$element.trigger({
						type: 'complate.draw.pureCanvas',
						drawData: data,
					});
				}catch(ex){
					console.warn('complate.draw.pureCanvas event error. [%s]', ex);
				}
			},
			sendScrollData: function(){
				// Scroll bar의 크기를 구한다.
				var scrollBarWidth = this.$main.prop("scrollWidth") - this.$main.prop("clientWidth");
				var scrollBarHeight = this.$main.prop("scrollHeight") - this.$main.prop("clientHeight");
				
				// 현재 Scroll 위치를 구한다.
				var scrollLeft = this.$main.scrollLeft();
				var scrollTop = this.$main.scrollTop();
				
				// 이동한 위치의 비율을 계산한다.
				var leftRate = scrollLeft / scrollBarWidth;
				var topRate = scrollTop / scrollBarHeight;
				
				var data = {
					scrollBarWidth: scrollBarWidth,
					scrollBarHeight: scrollBarHeight,
					scrollLeft: scrollLeft,
					scrollTop: scrollTop,
					left: leftRate,
					top: topRate
				}
				
				try{
					this.$element.trigger({
						type: 'scroll-move.pureCanvas',
						scrollData: data
					});
				}catch (ex) {
					console.warn('scroll-move.pureCanvas event error. [%s]', ex);
				}
			},
			
			recvScrollData: function(data){
				// Scroll bar의 크기를 구한다.
				var scrollBarWidth = this.$main.prop("scrollWidth") - this.$main.prop("clientWidth");
				var scrollBarHeight = this.$main.prop("scrollHeight") - this.$main.prop("clientHeight");
				
				// 이동한 위치의 비율을 계산한다.
				var scrollLeft = scrollBarWidth * data.left;
				var scrollTop = scrollBarHeight * data.top;
				
				// event 중복 호출 방지, 수신으로 변경된 정보가 event를 타고 나가는것 방지
				this.$main.data('pureCanvas-scroll', {type: 'recv', isTrigger: false});
				
				this.$main.scrollLeft(scrollLeft);
				this.$main.scrollTop(scrollTop);
			},
			
			getPoint: function(e){
				var x, y;
				// Mouse Event일 경우
				if(e.eventType.indexOf("mouse") >= 0){
					//console.log(e.type, e.offsetX || e.pageX - $(e.target).offset().left, e.offsetY || e.pageY - $(e.target).offset().top);
					x = typeof e.offsetX !== 'undefined' ? e.offsetX : e.pageX - $(e.target).offset().left;
					y = typeof e.offsetY !== 'undefined' ? e.offsetY : e.pageY - $(e.target).offset().top;
				}
				// Touch Event일 경우
				else{
					// ThuchEnd인 경우 좌표가 없으므로 공백을 반환한다.
					if(!e.originalEvent.targetTouches[0]){
						return {org: '', rate: ''}
					}
					
					//console.log(e.type, e.targetTouches[0].pageX, e.targetTouches[0].pageY);
					var tx = e.originalEvent.targetTouches[0].pageX;
					var ty = e.originalEvent.targetTouches[0].pageY;
					var cx = this.$drawCanvas.offset().left;
					var cy = this.$drawCanvas.offset().top;
					x = tx - cx;
					y = ty - cy;
				}

				// 비율에 따른 좌표 계산
				var rateVal = this.setting.rateVal;
				var rx = Math.round(x / rateVal, this.setting.pointFixed);
				var ry = Math.round(y / rateVal, this.setting.pointFixed);
				//var rx = (x / rateVal).toFixed(this.setting.pointFixed);
				//var ry = (y / rateVal).toFixed(this.setting.pointFixed);
				
				return {org: x+" "+y, rate: rx+" "+ry}
			},
			
			/**
			 * ","로 구분되어 있는 point 문자열을 배열로 변경한다.
			 * @returns
			 */
			getPointSplitList: function(points){
				if(!points){
					console.error("points is undifine");
					return;
				}
				
				var pointsSplit = points.split(",");
				return pointsSplit;
			},		
			/**
			 * " "으로 구분되어 있는 x,y 좌표를 변경하여 Object{x:x, y:y}로 변경한다.
			 * @returns Object{x:x, y:y}
			 */
			getPointSplit: function(point){
				if(!point){
					console.error("point is undifine");
					return;
				}
				
				var pointSplit = point.split(" ");
				if(pointSplit.length  != 2){
					console.error("point is not length 2. " + pointSplit.length);
					return;
				}
				return {x:Number(pointSplit[0]), y:Number(pointSplit[1])};
			},
			
			
			/*
			 * hex(#000000) 값을 rgba(xxx, xxx, xxx, x) 값으로 변환
			 */
			hexToRgba: function(hex, opacity){
				if(!hex){
					return null;
				}
			    hex = hex.replace("#","");
			    var r = parseInt(hex.substring(0,2), 16);
			    var g = parseInt(hex.substring(2,4), 16);
			    var b = parseInt(hex.substring(4,6), 16);

			    if(!opacity) opacity = 100;
			    return "rgba("+r+","+g+","+b+","+opacity/100+")";
			},

			/*
			 * rgba(xxx, xxx, xxx, x) 값을 hex(#000000) 값으로 변환
			 */
			rgbaToHex: function(rgba){
				if(!rgba){
					return {hex:"#000000", opacity: 100};
				}
				rgba = rgba.match(/^rgba?[\s+]?\([\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?,[\s+]?(\d+(\.?\d*))[\s+]?/i);
				
				var hex, opacity;
				if(rgba && (rgba.length === 5 || rgba.length === 6)){
					hex = "#" 
					+ ("0" + parseInt(rgba[1], 10).toString(16)).slice(-2)
					+ ("0" + parseInt(rgba[2], 10).toString(16)).slice(-2)
					+ ("0" + parseInt(rgba[3], 10).toString(16)).slice(-2);
					
					opacity = parseFloat(rgba[4]) * 100;
				}
				return {hex:hex, opacity: opacity};
			},
			
			/**
			 * bg 비율에 맞게 Style을 변경한다.
			 */
			getDrawStyle: function(){
				var style = $.extend({}, this.toolkit.style);
				style.orgLineWidth = style.lineWidth;
				style.lineWidth = style.orgLineWidth * this.setting.rateVal;
				
				return style;
			},
			
			/**
			 * Draw 완료 후 copy, clear의 작업을 수행한다
			 */
			complateDraw: function(data){
				var src = data.copyFrom;
				var target = data.copyTo;
				
				if(data.copyToPreClear){
					target.context.clearCanvas();
				}
				
				target.context.save();
				// source-over : 새 도형은 기존 내용 위에 그려진다. 기본값
				target.context.globalCompositeOperation = 'source-over';
				// target canvas에 source canvas를 덥어 그린다.
				target.context.drawImage(src.canvas, 0, 0);
				target.context.restore();
				
				if(data.clear){
					if(typeof data.clear == 'object'){
						$.each(data.clear, function(index, element){
							element.context.clearCanvas();
						});						
					}
				}	
				
				this.mainCanvasChange();
			},
			
			/**
			 * view, mview의 Image를 비율에 맞게 main에 draw한다.
			 */
			mainCanvasChange: function(flag){
				var recordCanvas = this.canvasInfo.record.canvas;
				var recordCtx = this.canvasInfo.record.context;
				var bgCanvas = this.canvasInfo.bg.canvas;
				var mainCanvas = this.canvasInfo.main.canvas;
				var mainCtx = this.canvasInfo.main.context;
				var viewCanvas = this.canvasInfo.view.canvas;
				var mviewCanvas = this.canvasInfo.mView.canvas;
				
				var setting = this.$element.data('pure.pureCanvas').options.setting;
				
				if(!flag){
					this.$element.data('pure.pureCanvas').historyAdd();
				}
				
				mainCtx.save();
				mainCtx.clearCanvas();
				mainCtx.setTransform(setting.rateVal, 0, 0, setting.rateVal, 0, 0);
				// source-over : 새 도형은 기존 내용 위에 그려진다. 기본값
				mainCtx.globalCompositeOperation = 'source-over';
				// target canvas에 source canvas를 덥어 그린다.
				mainCtx.drawImage(viewCanvas, 0, 0);
				mainCtx.drawImage(mviewCanvas, 0, 0);
				mainCtx.restore();
				
				// 녹화용
				recordCtx.save();
				recordCtx.clearCanvas();
				recordCtx.drawImage(bgCanvas, 0, 0);
				//recordCtx.setTransform(setting.rateVal, 0, 0, setting.rateVal, 0, 0);
				// source-over : 새 도형은 기존 내용 위에 그려진다. 기본값
				recordCtx.globalCompositeOperation = 'source-over';
				// target canvas에 source canvas를 덥어 그린다.
				//recordCtx.drawImage(viewCanvas, 0, 0);
				//recordCtx.drawImage(mviewCanvas, 0, 0);
				recordCtx.drawImage(mainCanvas, 0, 0);
				recordCtx.restore();
			},
		},
		
		// $.pureCanvas.toolkit.addToolkit
		addToolkit: function(toolkit){
			var makeToolkit = new toolkit();
			$.pureCanvas.toolkit.type[makeToolkit.getType()] = makeToolkit;
		},
		
		// Toolkit Types
		type: {}
	});
	
	/*******************************************************************************************************************************/
	$.extend($.pureCanvas.toolkit.prototype, {
		isLastSameCurrentPoint: function(points, currentPoint){
			return points && points.length > 0 ? points[points.lenght-1] == currentPoint : false; 
		},
		
		// 굵기, 색에 따라 그려질 정보를 출력한다.
		drawForPrePoint: function(ctx, drawStyle, drawPoint){
			var style = $.extend({}, drawStyle);
			if(!drawStyle.isNotChange){
				style.fillStyle = style.strokeStyle;
				style.strokeStyle = '#ffffff';
			}
			
			var point = this.getPointSplit(drawPoint);
			
			if(!this.isDrawing) ctx.clearCanvas();
			
			ctx.save();
			ctx.beginPath();
			ctx.arc(point.x, point.y, style.lineWidth / 2, 0, Math.PI * 2, false);
			ctx.lineWidth = 1;
			ctx.lineCap = 'round';
			ctx.lineJoin = 'round';
			if(style.fillStyle){
				ctx.fillStyle = style.fillStyle;
				ctx.fill();
			}
			if(style.strokeStyle){
				ctx.strokeStyle = style.strokeStyle;
				ctx.stroke();
			}
			ctx.restore();			
		},
		
		drawForArc: function(ctx, style, drawPoints){
			var point0 = this.getPointSplit(drawPoints[0]);
			var point1 = this.getPointSplit(drawPoints[1]);
			
			ctx.clearCanvas();
			
			ctx.beginPath();
			// 원의 반지름 구하기
			// 중심점에서 마우스 위치가 X, Y에서 더 큰쪽으로 반지름을 구한다????
			var radius = point0.x - point1.x;
			if(radius < 0) radius = radius * -1;

			var radiusY = point0.y - point1.y;
			if(radiusY < 0) radiusY = radiusY * -1;
			if(radius < radiusY) radius = radiusY;
			
			ctx.arc(point0.x, point0.y, radius, 2 * Math.PI, false);
			ctx.lineWidth = style.lineWidth;
			ctx.lineCap = 'round';
			ctx.lineJoin = 'round';			
			if(style.isStroke){
				ctx.strokeStyle = style.strokeStyle;
				ctx.stroke();
			}
			if(style.isFill){
				ctx.fillStyle = style.fillStyle;
				ctx.fill();
			}
		},
		drawForLine: function(ctx, style, drawPoints){
			// drawForStraightLine
			if(drawPoints.length <= 2){
				ctx.beginPath();
				
				if(!style.isNotClear){
					ctx.clearCanvas();
				}
				
				var point0 = this.getPointSplit(drawPoints[0]);
				var point1;
				if(drawPoints.length == 2){
					point1 = this.getPointSplit(drawPoints[1]);
				}else{
					point1 = {x: point0.x+0.5, y: point0.y+0.5};
				}
				ctx.moveTo(point0.x, point0.y);
				ctx.lineTo(point1.x, point1.y);

				ctx.lineWidth = style.lineWidth;
				ctx.lineCap = 'round';
				ctx.lineJoin = 'round';
				ctx.strokeStyle = style.strokeStyle;
				ctx.stroke();					
				return;
			}
			
			if(!style.isNotClear){
				ctx.clearCanvas();
			}
			
			ctx.beginPath();
			ctx.lineWidth = style.lineWidth;
			ctx.lineCap = 'round';
			ctx.lineJoin = 'round';
			ctx.strokeStyle = style.strokeStyle;
			var point0 = this.getPointSplit(drawPoints[0]);
			var pointi, pointi1;
			
			ctx.moveTo(point0.x, point0.y);
			for(var i=1; i<drawPoints.length-2; i++) {
				pointi = this.getPointSplit(drawPoints[i]);
				pointi1 = this.getPointSplit(drawPoints[i+1]);
				
				var c = (pointi.x + pointi1.x) / 2;
				var d = (pointi.y + pointi1.y) / 2;
				ctx.quadraticCurveTo(pointi.x, pointi.y, c, d);
			}
			
			pointi = this.getPointSplit(drawPoints[i]);
			pointi1 = this.getPointSplit(drawPoints[i+1]);
			ctx.quadraticCurveTo(pointi.x, pointi.y, pointi1.x, pointi1.y );
			ctx.stroke();
		},
		drawForRect: function(ctx, style, drawPoints){
			var point1 = this.getPointSplit(drawPoints[0]);
			var point2 = this.getPointSplit(drawPoints[1]);

			if(!style.isNotClear){
				ctx.clearCanvas();
			}
			
			ctx.beginPath();
			ctx.lineWidth = style.lineWidth;
			ctx.lineCap = 'round';
			ctx.lineJoin = 'round';
			ctx.strokeStyle = style.strokeStyle;
			ctx.stroke();
			ctx.fillStyle = style.fillStyle;
			ctx.fill();		
			
			if(style.isStroke){
				ctx.strokeRect(point1.x, point1.y, point2.x - point1.x, point2.y - point1.y);
			}else if(style.isFill){
				ctx.rect(point1.x, point1.y, point2.x - point1.x, point2.y - point1.y);
			}
		},
		drawForTriangle: function(ctx, style, drawPoints){
			var point0 = this.getPointSplit(drawPoints[0]);
			var point1 = this.getPointSplit(drawPoints[1]);
			
			ctx.clearCanvas();
			
			ctx.beginPath();
			ctx.moveTo(point1.x, point1.y);			
			ctx.lineTo(point0.x - (point1.x - point0.x), point1.y);
			ctx.lineTo(point0.x, point0.y - (point1.y - point0.y));
			ctx.lineTo(point1.x, point1.y);
				
			ctx.lineWidth = style.lineWidth;
			ctx.lineCap = 'round';
			ctx.lineJoin = 'round';
			if(style.isStroke){
				ctx.strokeStyle = style.strokeStyle;
				ctx.stroke();
			}
			if(style.isFill){
				ctx.fillStyle = style.fillStyle;
				ctx.fill();
			}
		}		
	});
	
	
	/*******************************************************************************************************************************/
	/*******************************************************************************
	 * Cursor
	 *******************************************************************************/
	var Cursor = function(){
	}
	Cursor.prototype = {
		getType: function(){
			return 'Cursor'; 
		},
		getCursor: function(){
			return 'auto';
		},
	}
	$.pureCanvas.toolkit.addToolkit(Cursor);
	
	/*******************************************************************************
	 * HandCursor
	 *******************************************************************************/
	var HandCursor = function(){
		this.isDrawing = false;
		this.downPoint = null;
		
		this.eventCaller = null;
	}
	HandCursor.prototype = {
		getType: function(){
			return 'HandCursor'; 
		},
		getCursor: function(){
			return 'all-scroll';
		},
		init: function(){
			var THIS = this;
			// scroll Event 추가
			this.$main.on('scroll', function(e){
				if(!THIS.isDrawing){
					// Scroll Event의 과다 호출을 줄이기 위해 300ms 중지된 상태에서 이벤트를 호출한다.
					clearTimeout(THIS.eventCaller);
					
					//{type: 'recv', isTrigger: false}
					// scroll 수신 시 trigger 호출 방지
					var data = THIS.$main.data('pureCanvas-scroll');
					if(data && !data.isTrigger){
						THIS.$main.removeData('pureCanvas-scroll');
						return;
					}
					
					THIS.eventCaller = setTimeout(function(){
						THIS.sendScrollData(e);
					}, 300);
				}
			});	
		},
		
		drawStart: function(e){
			//console.log(this.getType() + ' drawStart');
			
			this.isDrawing = true;
			this.downPoint = this.getPointSplit(e.point.org);
		},
		drawing: function(e){
			//console.log(this.getType() + ' drawing');
			
			if(this.isDrawing){
				var movePoint = this.getPointSplit(e.point.org); 
				
				// 마우스가 이동한 만큼 scroll의 위치를 변경한다.
				var left = this.$main.scrollLeft() + (this.downPoint.x - movePoint.x);
				var top = this.$main.scrollTop() + (this.downPoint.y - movePoint.y);
				
				this.$main.scrollLeft(left);
				this.$main.scrollTop(top);
			}
		},
		drawEnd: function(e){
			//console.log(this.getType() + ' drawEnd');

			if(this.isDrawing){
				this.sendScrollData();
			}
			
			this.isDrawing = false;
		},
		draw: function(e){
			//console.log(this.getType() + ' draw');
			
			var toolkitData = e.toolkitData;
			this.$main.scrollLeft(toolkitData.left);
			this.$main.scrollTop(toolkitData.top);
		},	
	}
	$.pureCanvas.toolkit.addToolkit(HandCursor);
	
	/*******************************************************************************
	 * Eraser
	 *******************************************************************************/
	var Eraser = function(){
		this.isEraser = false;
		this.points = [];
		this.pointsRate = [];
	}
	Eraser.prototype = {
		getType: function(){
			return 'Eraser'; 
		},
		getCursor: function(){
			return 'crosshair';
		},
		
		drawStart: function(e){
			//console.log(this.getType() + ' drawStart');
			
			this.isEraser = true;
			
			this.viewCtx.globalCompositeOperation = "destination-out";
			this.mainCtx.globalCompositeOperation = "destination-out";
			this.recordCtx.globalCompositeOperation = "destination-out";
			
			this.drawing(e);			
		},
		drawing: function(e){
			//console.log(this.getType() + ' drawing');

			var drawStyle = this.getCustomStyleLine(this.getDrawStyle());
			var drawTempStyle = this.getCustomStyleLine(this.toolkit.style);
			
			if(this.isEraser){
				this.points.push(e.point.org);
				this.pointsRate.push(e.point.rate);				
				
				this.drawForLine(this.mainCtx, drawStyle, this.points);
				this.drawForLine(this.viewCtx, drawTempStyle, this.pointsRate);
			}
			this.drawForPrePoint(this.drawCtx, this.getCustomStyle(drawStyle), e.point.org);
		},
		drawEnd: function(e){
			//console.log(this.getType() + ' drawEnd');
			
			if(e.isTouch){
				this.drawCtx.clearCanvas();
			}
			
			if(this.isEraser){
				this.sendDrawData(this.pointsRate);
				this.$element.data('pure.pureCanvas').historyAdd();
				
				// 녹화용
				var recordCanvas = this.canvasInfo.record.canvas;
				var recordCtx = this.canvasInfo.record.context;
				var bgCanvas = this.canvasInfo.bg.canvas;
				var mainCanvas = this.canvasInfo.main.canvas;
				var viewCanvas = this.canvasInfo.view.canvas;
				var mviewCanvas = this.canvasInfo.mView.canvas;
				var pointerCanvas = this.canvasInfo.pointer.canvas;
				
				var setting = this.$element.data('pure.pureCanvas').options.setting;
				
				// 녹화용
				recordCtx.save();
				recordCtx.clearCanvas();
				// source-over : 새 도형은 기존 내용 위에 그려진다. 기본값
				recordCtx.globalCompositeOperation = 'source-over';
				recordCtx.drawImage(bgCanvas, 0, 0);
				// target canvas에 source canvas를 덥어 그린다.
				recordCtx.drawImage(mainCanvas, 0, 0);
				//recordCtx.drawImage(pointerCanvas, 0, 0);
				recordCtx.restore();
			}
			
			this.isEraser = false;
			this.points = [];
			this.pointsRate = [];
		},
		drawOut: function(e){
			//console.log(this.getType() + ' drawOut');
			
			this.drawCtx.clearCanvas();
		},
		
		getCustomStyleLine: function(style){
			var custom = $.extend({}, style);
			custom.isNotClear = true;
			
			return custom;
		},
		
		getCustomStyle: function(style){
			var custom = $.extend({}, style);
			custom.fillStyle = 'rgba(255,255,250, 0.7)';
			custom.strokeStyle = 'black';
			
			custom.isNotChange = true;
			
			return custom;
		},
		
		draw: function(e){
			//console.log(this.getType() + ' draw');
			
			var toolkitData = e.toolkitData;
			
			this.viewCtx.globalCompositeOperation = "destination-out";
			this.mViewCtx.globalCompositeOperation = "destination-out";
			
			this.drawForLine(this.viewCtx, this.getCustomStyleLine(toolkitData.style), this.getPointSplitList(toolkitData.points));
			this.drawForLine(this.mViewCtx, this.getCustomStyleLine(toolkitData.style), this.getPointSplitList(toolkitData.points));
			
			this.mainCanvasChange();
		},	
	}
	$.pureCanvas.toolkit.addToolkit(Eraser);	
	
	/*******************************************************************************
	 * ClearAll
	 *******************************************************************************/
	var ClearAll = function(){
	}
	ClearAll.prototype = {
		getType: function(){
			return 'ClearAll'; 
		},
		getCursor: function(){
			return 'auto';
		},
		
		instantProcess: function(e){
			this.clearCanvas();
			this.sendDrawData(null);
		},
		
		clearCanvas: function(){
			$.each(this.canvasInfo, function(key, canvas){
				if(canvas.clearView){
					canvas.context.clearCanvas();
				}
			});
			this.mainCanvasChange();			
		},
		
		draw: function(e){
			//console.log(this.getType() + ' draw');
			
			this.clearCanvas();
		},
	}
	$.pureCanvas.toolkit.addToolkit(ClearAll);
	
	/*******************************************************************************
	 * Pen Abstract
	 *******************************************************************************/
	var PenAbstract = {
		getCursor: function(){
			return 'crosshair';
		},
		
		drawStart: function(e){
			//console.log(this.getType() + ' drawStart');
			
			this.isDrawing = true;
			this.drawing(e);
		},
		drawing: function(e){
			//console.log(this.getType() + ' drawing');
			
			var drawStyle = this.getCustomStyle(this.getDrawStyle());
			var drawTempStyle = this.getCustomStyle(this.toolkit.style);
			
			if(this.isDrawing){
				if(!this.isLastSameCurrentPoint(this.points, e.point.org)){
					this.points.push(e.point.org);
					this.pointsRate.push(e.point.rate);
					
					this.drawForLine(this.drawCtx, drawStyle, this.points);
					this.drawForLine(this.drawTempCtx, drawTempStyle, this.pointsRate);					
				}
			}
			this.drawForPrePoint(this.drawCtx, drawStyle, e.point.org);
		},
		drawEnd: function(e){
			//console.log(this.getType() + ' drawEnd');
			
			if(this.isDrawing){
				this.complateDraw({
					copyFrom: this.canvasInfo.drawTemp,
					copyTo: this.canvasInfo.view,
					clear: [this.canvasInfo.draw, this.canvasInfo.drawTemp]
				});
				
				this.sendDrawData(this.pointsRate);
			}
			
			this.isDrawing = false;
			this.points = [];
			this.pointsRate = [];
		},
		drawOut: function(e){
			//console.log(this.getType() + ' drawOut');
			
			if(!this.isDrawing){
				this.drawCtx.clearCanvas();
			}
		},
		draw: function(e){
			//console.log(this.getType() + ' draw');
			
			var toolkitData = e.toolkitData;
			this.drawForLine(this.recvDrawCtx, this.getCustomStyle(toolkitData.style), this.getPointSplitList(toolkitData.points));
			
			this.complateDraw({
				copyFrom: this.canvasInfo.recvDraw,
				copyTo: this.canvasInfo.view,
				clear: [this.canvasInfo.recvDraw]
			});
		},		
	}
	
	/*******************************************************************************
	 * BallPen
	 *******************************************************************************/
	var BallPen = function(){
		this.isDrawing = false;
		
		this.points = [];
		this.pointsRate = [];
	}
	BallPen.prototype = {
		getType: function(){
			return 'BallPen'; 
		},
		
		getCustomStyle: function(style){
			var custom = $.extend({}, style);
			custom.fillStyle = custom.strokeStyle;
			return custom;
		},
	}
	$.extend(BallPen.prototype, PenAbstract);
	$.pureCanvas.toolkit.addToolkit(BallPen);
	
	/*******************************************************************************
	 * Highlighter
	 *******************************************************************************/
	var Highlighter = function(){
		this.isDrawing = false;
		
		this.points = [];
		this.pointsRate = [];
	}
	Highlighter.prototype = {
		getType: function(){
			return 'Highlighter'; 
		},
		
		getCustomStyle: function(style){
			var custom = $.extend({}, style);
			var hexStyle = this.rgbaToHex(custom.strokeStyle);
			custom.strokeStyle = this.hexToRgba(hexStyle.hex, 50);
			custom.fillStyle = custom.strokeStyle;
			return custom;
		},
	}
	$.extend(Highlighter.prototype, PenAbstract);
	$.pureCanvas.toolkit.addToolkit(Highlighter);	
	
	/*******************************************************************************
	 * StraightLine
	 *******************************************************************************/
	var StraightLine = function(){
		this.isDrawing = false;
		
		this.points = [];
		this.pointsRate = [];
	}
	StraightLine.prototype = {
		getType: function(){
			return 'StraightLine'; 
		},
		getCursor: function(){
			return 'crosshair';
		},
		
		drawStart: function(e){
			//console.log(this.getType() + ' drawStart');
			
			this.isDrawing = true;
			
			var point = e.point;
			this.points[0] = point.org;
			this.pointsRate[0] = point.rate;
		},
		drawing: function(e){
			//console.log(this.getType() + ' drawing');
			
			var drawStyle = this.getCustomStyle(this.getDrawStyle());
			var drawTempStyle = this.toolkit.style;
			
			if(this.isDrawing){
				var point = e.point;
				this.points[1] = point.org;
				this.pointsRate[1] = point.rate;
				
				this.drawForLine(this.drawCtx, drawStyle, this.points);
				this.drawForLine(this.drawTempCtx, drawTempStyle, this.pointsRate);
			}
			this.drawForPrePoint(this.drawCtx, drawStyle, e.point.org);
			
		},
		drawEnd: function(e){
			//console.log(this.getType() + ' drawEnd');
			
			if(this.isDrawing){
				this.complateDraw({
					copyFrom: this.canvasInfo.drawTemp,
					copyTo: this.canvasInfo.view,
					clear: [this.canvasInfo.draw, this.canvasInfo.drawTemp]
				});
				
				this.sendDrawData(this.pointsRate);
			}
			
			this.isDrawing = false;
			this.points = [];
			this.pointsRate = [];
		},
		drawOut: function(e){
			//console.log(this.getType() + ' drawOut');

			if(!this.isDrawing){
				this.drawCtx.clearCanvas();
			}
		},
		
		getCustomStyle: function(style){
			var custom = $.extend({}, style);
			return custom;
		},
		
		draw: function(e){
			//console.log(this.getType() + ' draw');
			
			var toolkitData = e.toolkitData;
			this.drawForLine(this.recvDrawCtx, this.getCustomStyle(toolkitData.style), this.getPointSplitList(toolkitData.points));
			
			this.complateDraw({
				copyFrom: this.canvasInfo.recvDraw,
				copyTo: this.canvasInfo.view,
				clear: [this.canvasInfo.recvDraw]
			});
		},	
	}
	$.pureCanvas.toolkit.addToolkit(StraightLine);
	
	/*******************************************************************************
	 * Rectangle - Stroke
	 *******************************************************************************/
	var Rectangle = function(){
		this.isDrawing = false;
		
		this.points = [];
		this.pointsRate = [];
	}
	Rectangle.prototype = {
		getType: function(){
			return 'Rectangle'; 
		},
		getCursor: function(){
			return 'crosshair';
		},
		
		drawStart: function(e){
			//console.log(this.getType() + ' drawStart');
			
			this.isDrawing = true;
			
			var point = e.point;
			this.points[0] = point.org;
			this.pointsRate[0] = point.rate;
		},
		drawing: function(e){
			//console.log(this.getType() + ' drawing');
			
			var drawStyle = this.getCustomStyle(this.getDrawStyle());
			var drawTempStyle = this.getCustomStyle(this.toolkit.style);
			
			if(this.isDrawing){
				var point = e.point;
				this.points[1] = point.org;
				this.pointsRate[1] = point.rate;
				
				this.drawForRect(this.drawCtx, drawStyle, this.points);
				this.drawForRect(this.drawTempCtx, drawTempStyle, this.pointsRate);
			}
			this.drawForPrePoint(this.drawCtx, drawStyle, e.point.org);
			
		},
		drawEnd: function(e){
			//console.log(this.getType() + ' drawEnd');
			
			if(this.isDrawing){
				this.complateDraw({
					copyFrom: this.canvasInfo.drawTemp,
					copyTo: this.canvasInfo.view,
					clear: [this.canvasInfo.draw, this.canvasInfo.drawTemp]
				});
				
				this.sendDrawData(this.pointsRate);
			}
			
			this.isDrawing = false;
			this.points = [];
			this.pointsRate = [];
		},
		drawOut: function(e){
			//console.log(this.getType() + ' drawOut');

			if(!this.isDrawing){
				this.drawCtx.clearCanvas();
			}
		},
		
		getCustomStyle: function(style){
			var custom = $.extend({}, style);
			custom.isStroke = true;
			return custom;
		},
		
		draw: function(e){
			//console.log(this.getType() + ' draw');
			
			var toolkitData = e.toolkitData;
			this.drawForRect(this.recvDrawCtx, this.getCustomStyle(toolkitData.style), this.getPointSplitList(toolkitData.points));
			
			this.complateDraw({
				copyFrom: this.canvasInfo.recvDraw,
				copyTo: this.canvasInfo.view,
				clear: [this.canvasInfo.recvDraw]
			});
		},	
	}
	$.pureCanvas.toolkit.addToolkit(Rectangle);	
	
	/*******************************************************************************
	 * Circle - Stroke
	 *******************************************************************************/
	var Circle = function(){
		this.isDrawing = false;
		
		this.points = [];
		this.pointsRate = [];
	}
	Circle.prototype = {
		getType: function(){
			return 'Circle'; 
		},
		getCursor: function(){
			return 'crosshair';
		},
		
		drawStart: function(e){
			//console.log(this.getType() + ' drawStart');
			
			this.isDrawing = true;
			
			var point = e.point;
			this.points[0] = point.org;
			this.pointsRate[0] = point.rate;
		},
		drawing: function(e){
			//console.log(this.getType() + ' drawing');
			
			var drawStyle = this.getCustomStyle(this.getDrawStyle());
			var drawTempStyle = this.getCustomStyle(this.toolkit.style);
			
			if(this.isDrawing){
				var point = e.point;
				this.points[1] = point.org;
				this.pointsRate[1] = point.rate;
				
				this.drawForArc(this.drawCtx, drawStyle, this.points);
				this.drawForArc(this.drawTempCtx, drawTempStyle, this.pointsRate);
			}
			this.drawForPrePoint(this.drawCtx, drawStyle, e.point.org);
			
		},
		drawEnd: function(e){
			//console.log(this.getType() + ' drawEnd');
			
			if(this.isDrawing){
				this.complateDraw({
					copyFrom: this.canvasInfo.drawTemp,
					copyTo: this.canvasInfo.view,
					clear: [this.canvasInfo.draw, this.canvasInfo.drawTemp]
				});
				
				this.sendDrawData(this.pointsRate);
			}
			
			this.isDrawing = false;
			this.points = [];
			this.pointsRate = [];
		},
		drawOut: function(e){
			//console.log(this.getType() + ' drawOut');

			if(!this.isDrawing){
				this.drawCtx.clearCanvas();
			}
		},
		
		getCustomStyle: function(style){
			var custom = $.extend({}, style);
			custom.isStroke = true;
			return custom;
		},
		
		draw: function(e){
			//console.log(this.getType() + ' draw');
			
			var toolkitData = e.toolkitData;
			this.drawForArc(this.recvDrawCtx, this.getCustomStyle(toolkitData.style), this.getPointSplitList(toolkitData.points));
			
			this.complateDraw({
				copyFrom: this.canvasInfo.recvDraw,
				copyTo: this.canvasInfo.view,
				clear: [this.canvasInfo.recvDraw]
			});
		},	
	}
	$.pureCanvas.toolkit.addToolkit(Circle);		
	
	/*******************************************************************************
	 * Triangle - Stroke
	 *******************************************************************************/
	var Triangle = function(){
		this.isDrawing = false;
		
		this.points = [];
		this.pointsRate = [];
	}
	Triangle.prototype = {
		getType: function(){
			return 'Triangle'; 
		},
		getCursor: function(){
			return 'crosshair';
		},
		
		drawStart: function(e){
			//console.log(this.getType() + ' drawStart');
			
			this.isDrawing = true;
			
			var point = e.point;
			this.points[0] = point.org;
			this.pointsRate[0] = point.rate;
		},
		drawing: function(e){
			//console.log(this.getType() + ' drawing');
			
			var drawStyle = this.getCustomStyle(this.getDrawStyle());
			var drawTempStyle = this.getCustomStyle(this.toolkit.style);
			
			if(this.isDrawing){
				var point = e.point;
				this.points[1] = point.org;
				this.pointsRate[1] = point.rate;
				
				this.drawForTriangle(this.drawCtx, drawStyle, this.points);
				this.drawForTriangle(this.drawTempCtx, drawTempStyle, this.pointsRate);
			}
			this.drawForPrePoint(this.drawCtx, drawStyle, e.point.org);
			
		},
		drawEnd: function(e){
			//console.log(this.getType() + ' drawEnd');
			
			if(this.isDrawing){
				this.complateDraw({
					copyFrom: this.canvasInfo.drawTemp,
					copyTo: this.canvasInfo.view,
					clear: [this.canvasInfo.draw, this.canvasInfo.drawTemp]
				});
				
				this.sendDrawData(this.pointsRate);
			}
			
			this.isDrawing = false;
			this.points = [];
			this.pointsRate = [];
		},
		drawOut: function(e){
			//console.log(this.getType() + ' drawOut');

			if(!this.isDrawing){
				this.drawCtx.clearCanvas();
			}
		},
		
		getCustomStyle: function(style){
			var custom = $.extend({}, style);
			custom.isStroke = true;
			return custom;
		},
		
		draw: function(e){
			//console.log(this.getType() + ' draw');
			
			var toolkitData = e.toolkitData;
			this.drawForTriangle(this.recvDrawCtx, this.getCustomStyle(toolkitData.style), this.getPointSplitList(toolkitData.points));
			
			this.complateDraw({
				copyFrom: this.canvasInfo.recvDraw,
				copyTo: this.canvasInfo.view,
				clear: [this.canvasInfo.recvDraw]
			});
		},	
	}
	$.pureCanvas.toolkit.addToolkit(Triangle);			
	
	/*******************************************************************************
	 * CheckPoint
	 *******************************************************************************/
	var CheckPoint = function(){
		this.isDrawing = false;
		this.points = [];
		this.pointsRate = [];
	}
	CheckPoint.prototype = {
		getType: function(){
			return 'CheckPoint'; 
		},
		getCursor: function(){
			return 'pointer';
		},
		
		drawStart: function(e){
			//console.log(this.getType() + ' drawStart');
			this.isDrawing = true;
			this.drawing(e);
		},
		drawing: function(e){
			//console.log(this.getType() + ' drawing');
			
			var point = e.point;
			this.points[0] = point.org;
			this.pointsRate[0] = point.rate;
			
			this.drawForCheckPoint(this.drawCtx, this.points);
		},
		drawEnd: function(e){
			//console.log(this.getType() + ' drawEnd');
			
			if(this.isDrawing){
				this.drawForCheckPoint(this.drawTempCtx, this.pointsRate);
				this.complateDraw({
					copyFrom: this.canvasInfo.drawTemp,
					copyTo: this.canvasInfo.view,
					clear: [this.canvasInfo.draw, this.canvasInfo.drawTemp]
				});
				
				this.sendDrawData(this.pointsRate);
			}
			this.isDrawing = false;
			this.points = [];
			this.pointsRate = [];
		},
		drawOut: function(e){
			//console.log(this.getType() + ' drawOut');
			this.isDrawing = false;
			this.drawCtx.clearCanvas();
		},
		
		defaultStyle: {
			lineCap: 'round',
			lineJoin: 'bevel',
			lineWidth: 2,
			strokeStyle: 'black',
			fillStyle: 'red',			
		},
		drawForCheckPoint: function(ctx, drawPoints){
			var point = this.getPointSplit(drawPoints[0]);
			
			ctx.clearCanvas();
			
			ctx.beginPath();
			ctx.moveTo(point.x - 10, point.y - 10);
			ctx.lineTo(point.x, point.y);
			ctx.lineTo(point.x + 20, point.y - 15);
			ctx.lineTo(point.x + 16, point.y - 15);
			ctx.lineTo(point.x, point.y - 4);
			ctx.lineTo(point.x - 6, point.y - 10);
			ctx.lineTo(point.x - 10, point.y - 10);
			
			ctx.lineCap = this.defaultStyle.lineCap;
			ctx.lineJoin = this.defaultStyle.lineJoin;
			ctx.lineWidth = this.defaultStyle.lineWidth;
			ctx.strokeStyle = this.defaultStyle.strokeStyle;
			ctx.stroke();
			ctx.fillStyle = this.defaultStyle.fillStyle;
			ctx.fill();
		},
		
		draw: function(e){
			//console.log(this.getType() + ' draw');
			
			var toolkitData = e.toolkitData;
			this.drawForCheckPoint(this.recvDrawCtx, this.getPointSplitList(toolkitData.points));
			
			this.complateDraw({
				copyFrom: this.canvasInfo.recvDraw,
				copyTo: this.canvasInfo.view,
				clear: [this.canvasInfo.recvDraw]
			});
		},	
	}
	$.pureCanvas.toolkit.addToolkit(CheckPoint);		
	
	/*******************************************************************************
	 * HighlightPoint
	 *******************************************************************************/
	var HighlightPoint = function(){
		this.isDrawing = false;
		this.points = [];
		this.pointsRate = [];
	}
	HighlightPoint.prototype = {
		getType: function(){
			return 'HighlightPoint'; 
		},
		getCursor: function(){
			return 'pointer';
		},
		
		drawStart: function(e){
			//console.log(this.getType() + ' drawStart');
			this.isDrawing = true;
			this.drawing(e);
		},
		drawing: function(e){
			//console.log(this.getType() + ' drawing');
			
			var point = e.point;
			this.points[0] = point.org;
			this.pointsRate[0] = point.rate;
			
			this.drawForHighlightPoint(this.drawCtx, this.points);
		},
		drawEnd: function(e){
			//console.log(this.getType() + ' drawEnd');
			
			if(this.isDrawing){
				this.drawForHighlightPoint(this.drawTempCtx, this.pointsRate);
				
				this.complateDraw({
					copyFrom: this.canvasInfo.drawTemp,
					copyTo: this.canvasInfo.mView,
					copyToPreClear: true,
					clear: [this.canvasInfo.draw, this.canvasInfo.drawTemp]
				});
				
				this.sendDrawData(this.pointsRate);
			}
			this.isDrawing = false;
			this.points = [];
			this.pointsRate = [];
		},
		drawOut: function(e){
			//console.log(this.getType() + ' drawOut');
			this.isDrawing = false;
			this.drawCtx.clearCanvas();
		},
		
		defaultStyle: {
			lineCap: 'round',
			lineJoin: 'round',
			lineWidth: 3,
			strokeStyle: 'black',
			gradient0: 'rgba(250,120,120, 0.9)',
			gradient1: '#FF0000'
		},
		drawForHighlightPoint: function(ctx, drawPoints){
			ctx.clearCanvas();
			
			var p = this.getPointSplit(drawPoints[0]);
			ctx.beginPath();
			ctx.moveTo(p.x - 30, p.y - 12);
			ctx.lineTo(p.x, p.y);
			ctx.lineTo(p.x - 30, p.y + 12);
			ctx.lineTo(p.x - 23, p.y);
			ctx.lineTo(p.x - 30, p.y - 12);
			
			// add linear gradient
			var grd = ctx.createLinearGradient(p.x - 20, p.y - 10, p.x, p.y + 10);
			grd.addColorStop(0, this.defaultStyle.gradient0);   
			grd.addColorStop(1, this.defaultStyle.gradient1);
			
			ctx.lineCap = this.defaultStyle.lineCap;
			ctx.lineJoin = this.defaultStyle.lineJoin;
			ctx.lineWidth = this.defaultStyle.lineWidth;
			ctx.strokeStyle = this.defaultStyle.strokeStyle;
			ctx.stroke();
			ctx.stroke();
			ctx.fillStyle = grd;
			ctx.fill();
		},
		
		draw: function(e){
			//console.log(this.getType() + ' draw');
			
			var toolkitData = e.toolkitData;
			this.drawForHighlightPoint(this.recvDrawCtx, this.getPointSplitList(toolkitData.points));
			
			this.complateDraw({
				copyFrom: this.canvasInfo.recvDraw,
				copyTo: this.canvasInfo.mView,
				copyToPreClear: true,
				clear: [this.canvasInfo.recvDraw]
			});
		},	
	}
	$.pureCanvas.toolkit.addToolkit(HighlightPoint);		
	
	/*******************************************************************************
	 * MousePointer
	 *******************************************************************************/
	var MousePointer = function(){
		this.isDrawing = false;
		this.eventCaller = null;
		
		this.pointerMap = {me: null}
	}
	MousePointer.prototype = {
		getType: function(){
			return 'MousePointer'; 
		},
		getCursor: function(){
			return 'crosshair';
		},
		
		startDraw: function(){
			var THIS = this;
			
			clearTimeout(this.drawEvent);
			this.drawEvent = setTimeout(function(){
				THIS.drawForMousePointer();
				
				clearTimeout(THIS.drawEvent);
			});
		},
	
		drawStart: function(e){
			//console.log(this.getType() + ' drawStart');
			
			this.isDrawing = true;
			this.drawing(e);
		},
		drawing: function(e){
			//console.log(this.getType() + ' drawing');
			
			if(e.callMethod != 'drawStart' && this.pointerMap.me && this.pointerMap.me.points == e.point.org){
				return;
			}
			
			this.pointerMap.me = {style: this.toolkit.style, points: e.point.org}
			//this.drawForMousePointer();
			this.startDraw();
			
			// 녹화용
			var recordCanvas = this.canvasInfo.record.canvas;
			var recordCtx = this.canvasInfo.record.context;
			var bgCanvas = this.canvasInfo.bg.canvas;
			var mainCanvas = this.canvasInfo.main.canvas;
			var viewCanvas = this.canvasInfo.view.canvas;
			var mviewCanvas = this.canvasInfo.mView.canvas;
			var pointerCanvas = this.canvasInfo.pointer.canvas;
			
			var setting = this.$element.data('pure.pureCanvas').options.setting;
			
			if(this.isDrawing){
				// 녹화용
				recordCtx.save();
				recordCtx.clearCanvas();
				recordCtx.drawImage(bgCanvas, 0, 0);
				// source-over : 새 도형은 기존 내용 위에 그려진다. 기본값
				recordCtx.globalCompositeOperation = 'source-over';
				// target canvas에 source canvas를 덥어 그린다.
				recordCtx.drawImage(mainCanvas, 0, 0);
				//recordCtx.setTransform(0, 0, 0, 0, 0, 0);
				recordCtx.drawImage(pointerCanvas, 0, 0);
				recordCtx.restore();
			}
			
			// over시 전송일 경우, 클릭시 전송일 경우 이벤트 호출
			if((!this.setting.pointerDownSend) || (this.setting.pointerDownSend && this.isDrawing)){
				this.sendEvent([e.point.rate]);
			}
		},
		drawEnd: function(e){
			//console.log(this.getType() + ' drawEnd');
			
			if(e.isTouch) this.pointerMap.me = null;
			//this.drawForMousePointer();
			this.startDraw();
			
			// 녹화용
			var recordCanvas = this.canvasInfo.record.canvas;
			var recordCtx = this.canvasInfo.record.context;
			var bgCanvas = this.canvasInfo.bg.canvas;
			var mainCanvas = this.canvasInfo.main.canvas;
			var viewCanvas = this.canvasInfo.view.canvas;
			var mviewCanvas = this.canvasInfo.mView.canvas;
			var pointerCanvas = this.canvasInfo.pointer.canvas;
			
			var setting = this.$element.data('pure.pureCanvas').options.setting;
			
			// 녹화용
			recordCtx.save();
			recordCtx.clearCanvas();
			recordCtx.drawImage(bgCanvas, 0, 0);
			// source-over : 새 도형은 기존 내용 위에 그려진다. 기본값
			recordCtx.globalCompositeOperation = 'source-over';
			// target canvas에 source canvas를 덥어 그린다.
			recordCtx.drawImage(mainCanvas, 0, 0);
			//recordCtx.drawImage(pointerCanvas, 0, 0);
			recordCtx.restore();
			
			if(this.setting.pointerDownSend){
				this.sendEvent(null);
			}
			this.isDrawing = false;
		},
		drawOut: function(e){
			//console.log(this.getType() + ' drawOut');
			
			this.pointerMap.me = null;				
			//this.drawForMousePointer();
			this.startDraw();
			
			// 녹화용
			var recordCanvas = this.canvasInfo.record.canvas;
			var recordCtx = this.canvasInfo.record.context;
			var bgCanvas = this.canvasInfo.bg.canvas;
			var mainCanvas = this.canvasInfo.main.canvas;
			var viewCanvas = this.canvasInfo.view.canvas;
			var mviewCanvas = this.canvasInfo.mView.canvas;
			var pointerCanvas = this.canvasInfo.pointer.canvas;
			
			var setting = this.$element.data('pure.pureCanvas').options.setting;
			
			// 녹화용
			recordCtx.save();
			recordCtx.clearCanvas();
			recordCtx.drawImage(bgCanvas, 0, 0);
			// source-over : 새 도형은 기존 내용 위에 그려진다. 기본값
			recordCtx.globalCompositeOperation = 'source-over';
			// target canvas에 source canvas를 덥어 그린다.
			recordCtx.drawImage(mainCanvas, 0, 0);
			//recordCtx.drawImage(pointerCanvas, 0, 0);
			recordCtx.restore();
			
			if((!this.setting.pointerDownSend)|| (this.setting.pointerDownSend && this.isDrawing)){
				this.sendEvent(null);
			}
			this.isDrawing = false;
		},
		
		sendTest: function(){
			var points = ["667 533","667 533","665 533","660 533","653 534","644 536","631 541","618 543","603 548","589 552","575 555","559 560","542 563","520 569","498 572","464 576","431 582","396 584","360 584","336 584","309 584","286 584","258 583","237 575","212 569","198 561","184 553","173 548","164 540","161 534","156 526","155 518","151 507","150 498","150 488","148 477","145 464","145 452","145 438","145 425","145 414","145 405","145 396","145 387","145 378","149 368","154 355","159 340","165 326","166 316","169 303","171 292","171 286","173 277","174 272","175 267","176 256","178 249","180 243","180 237","181 229","181 224","181 217","183 210","186 201","187 194","192 186","195 178","202 166","210 157","221 144","221 144","233 133","246 126","258 119","269 116","285 112","296 111","306 111","315 111","321 111","332 115","341 119","347 122","357 127","363 132","370 138","378 144","384 152","392 163","398 172","407 186","414 198","421 210","422 218","422 227","422 232","422 235","421 239","421 239","421 241","421 242","421 241","425 233","433 224","440 215","446 204","452 194","460 184","467 174","476 162","481 153","484 143","486 132","486 126","482 118","476 112","465 107","457 106","448 103","439 102","431 102","423 102","413 102","403 102","393 102","379 105","365 109","349 114","332 119","317 126","305 134","299 139","296 143","296 147","296 151","296 156","298 161","307 169","318 176","335 184","353 192","374 198","386 200","401 205","411 206","423 207","433 208","438 208","440 210","443 210","445 211","449 212","452 213","456 216","458 217","461 221","464 224","465 226","469 233","470 240","470 249","470 258","470 268","470 280","470 290","475 300","475 310","475 317","475 329","475 336","468 347","461 358","456 368","451 378","447 384","446 391","445 396","443 403","440 408","437 415","432 421","426 427","419 433","408 440","397 446","390 449","379 454","372 455","364 459","352 462","339 464","321 464","303 464","303 464","280 464","261 464","243 464","228 464","216 464","206 462","200 458","199 458","199 456","199 453","199 449","200 443","210 436","224 431","244 427","280 424","320 424","354 425","371 427","384 430","396 432","408 433","415 434","421 438","427 438","428 438","429 438","430 438","435 438","441 435","449 424","458 412","468 394","475 379","480 362","485 342","488 327","490 309","490 294","490 280","490 267","490 258","486 248","480 238","472 231","459 221","449 214","440 209","431 203","425 197","417 192","413 187","408 184","400 179","390 174","379 171","369 166","361 163","354 158","345 154","336 149","330 145","325 142","319 137","308 132","298 129","283 124","271 121","259 117","250 114","240 111","231 108","223 106","218 105","209 102","200 102","189 102","177 102","164 102","155 102","146 102","143 102","136 104","135 105","135 106","135 108","132 110","132 114","132 120","132 130","132 137","132 147","130 157","126 169","126 181","126 188","126 201","126 215","135 229","151 246","165 257","181 266","204 280","217 287","232 296","248 304","263 311","279 320","296 330","304 337","316 345","324 352","329 357","331 365","334 373","335 380","335 387","335 396","335 408","335 418","335 431","335 441","334 450","329 458","322 469","322 469","316 475","307 482","299 487","291 490","285 494","280 495","273 496","266 499","255 499","250 499","242 499","237 499","225 494","218 489","208 483","201 476","199 473","198 469","198 462","198 455","198 446","198 433","199 422","204 409","208 396","215 383","222 371","231 359","237 347","247 337","256 326","263 318","269 308","277 298","282 290","291 280","295 272","298 267","303 257","306 250","310 246","313 240","319 234","325 226","331 220","336 213","340 207","343 203","344 198","346 196","350 193","353 192","362 189","368 187","375 187","384 186","390 186","400 186","411 186","421 186","433 186","446 186","459 186","472 186","482 186","494 185","504 181","513 178","515 177","520 174","521 174","524 171","526 169","527 165","530 160","531 154","533 147","533 140","533 134","533 129","531 125","529 119","526 114","520 108","516 102","514 100","511 97","507 93","502 90","500 89","495 87","486 83","479 82","472 81","464 77","455 76","446 72","436 71","427 70","417 68","406 68","393 68","378 68","361 68","347 68","335 68","323 69","312 69","307 71","300 72","293 73","283 73","278 74","270 78","263 79","256 83","252 85","248 88","246 89","243 93","243 96","239 103","237 109","237 114","237 121","237 126","237 132","237 132","237 138","237 142","238 148","240 155","247 164","253 173","261 181","267 190","278 200","283 204","287 212","295 219","299 224","309 230","319 235","328 237","338 243","349 248","360 252","371 256","380 261","387 265","396 270","403 274","409 281","415 286","419 290","423 296","427 300","433 309","436 313","441 321","445 328","446 331","451 337","453 341","458 347","463 355","468 362","471 372","476 382","478 391","482 403","483 412","484 421","484 427","484 434","484 439","484 444","484 449","482 457","479 461","475 465","467 473","462 476","456 480","451 481","440 486","436 487","427 489","421 490","410 492","399 493","385 495","372 495","358 495","343 495","329 495","310 495","298 495","281 495","261 489","247 487","231 481","219 476","209 470","203 467","199 463","195 454","193 445","193 435","193 427","193 417","195 409","202 399","210 390","215 384","218 378","223 371","227 364","231 356","234 349","238 345","243 341","249 336","255 335","263 330","267 329","273 328","276 325","280 323","285 319","289 316","293 311","301 305","307 299","315 290","321 282","328 272","333 264","336 255","341 247","345 239","347 232","353 224","353 219","357 214","360 206","364 202","366 197","369 193","373 185","374 181","375 175","375 169","375 164","375 156","375 156","375 150","375 144","375 138","374 132","374 126","372 121","372 116","371 111","368 105","368 102","367 97","367 95","367 91","369 89","371 87","374 84","377 84","380 84","384 84","390 84","395 84","402 84","410 84","421 85","435 89","447 92","458 95","468 98","479 102","487 103","494 108","498 110","500 113","500 114","501 117","501 118","502 122","503 126","504 132","507 136","510 143","513 149","517 156","520 160","524 168","525 171","526 175","529 184","531 187","532 193","532 200","532 208","535 217","537 229","538 237","539 249","542 261","544 269","548 281","550 292","553 303","556 311","556 323","556 332","556 343","556 350","556 360","556 368","556 378","556 383","556 390","556 393","556 397","554 400","552 404","549 407","546 411","543 417","538 423","534 427","527 431","521 435","509 440","501 445","490 448","482 452","470 458","463 458","452 463","445 466","434 468","424 471","415 471","403 473","390 473","377 473","364 473","350 473","341 473","327 470","313 465","302 460","291 451","281 441","274 431","268 421","263 409","261 403","261 391","261 379","261 368","261 355","261 342","261 329","261 314","264 301","269 286","274 272","279 260","286 248","293 236","300 226","306 218","313 210","317 202","324 195","324 195","330 189","336 181","341 174","348 169","354 165","359 163","367 157","375 155","384 151","396 145","404 144","418 138","431 135","441 132","453 130","467 125","477 122","490 118","506 117","520 111","532 108","547 104","561 101","577 99","596 96","614 95","637 90","663 87"];
			
			var THIS = this;
			
			var sendTimer = function(){
				if(points.length <= 0){
					THIS.sendEvent(null);
					return;
				}
				var point = points.shift();
				
				THIS.sendEvent([point]);
				
				setTimeout(sendTimer, 6);
			};
			setTimeout(sendTimer, 0);
//			$.each(points, function(index, point){
//				THIS.sendEvent([point]);
//			});
		},
		
		sendEvent: function(points){
			var THIS = this;
			
			// 지연 설정 이후에 이벤트를 발생한다. 과도한 이벤트 발생 방지
			clearTimeout(this.eventCaller);
			this.eventCaller = setTimeout(function(){THIS.sendDrawData(points);}, this.setting.delayMousePoint);
		},
		
		drawForMousePointer: function(ctx){
			if(!ctx) ctx = this.canvasInfo.pointer.context;
			
			var THIS = this;
			ctx.clearCanvas();
			
			$.each(this.pointerMap, function(key, data){
				if(!data){return;}
				
				var style = data.style;
				var points = data.points;
				
				var nowTime = new Date().getTime();
				if(key != 'me' && (nowTime - (10 * 1000) > data.timeStamp)){
					points = null;
					delete THIS.pointerMap[key];
				}
				
				// pointer의 위치가 canvas를 떠났을 경우 points가 null로 전송된다.
				if(!points){
					ctx.clearCanvas();
					return;
				}
				var drawPoints = THIS.getPointSplitList(points);
				var point = THIS.getPointSplit(drawPoints[0]);
				
				if(key != 'me'){
					point.x *= THIS.setting.rateVal;
					point.y *= THIS.setting.rateVal;
				}
				
				ctx.save();
				
				ctx.beginPath();
				ctx.arc(point.x, point.y, 50, 2 * Math.PI, false);
				
				// create radial gradient
				var grd;
				// down전송 시 mousedown event가 발생하지 않은 경우, mousepointer를 작게 표시
				if(key == 'me' && THIS.setting.pointerDownSend && !THIS.isDrawing){
					grd = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, 13);
				}
				// mousepointer 일반적인 크기
				else{
					grd = ctx.createRadialGradient(point.x, point.y, 5, point.x, point.y, 15);
				}
				grd.addColorStop(0, style.strokeStyle);
		      	grd.addColorStop(1, "rgba(255,255,255,0)");
		      	ctx.fillStyle = grd;
		      	ctx.fill();
		      	
				ctx.closePath();
				ctx.restore();	
			});
		},
		
		draw: function(e){
			var toolkitData = e.toolkitData;
			
			// 좌표정보가 있는 경우 마우스포인트 정보를 설정한다.
			if(toolkitData.points){
				this.pointerMap[toolkitData.id] = {style: toolkitData.style, points: toolkitData.points, timeStamp: e.timeStamp};
			}
			// 좌표정보가 없는 경우 마우스포인트 정보를 삭제한다.
			else{
				delete this.pointerMap[toolkitData.id];
			}
			//this.drawForMousePointer();
			this.startDraw();
		},	
	}
	$.pureCanvas.toolkit.addToolkit(MousePointer);
	
	/************************************************************************************/
	/** add native function **/
	
	// Canvas Context - Clear Canvas
	CanvasRenderingContext2D.prototype.clearCanvas = function(){
		this.clearRect(0, 0, this.canvas.width, this.canvas.height);
	};
	/************************************************************************************/
	
}(jQuery);
