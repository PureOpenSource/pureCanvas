/*********************************************************************************************
 * PureCanvas. v0.1-beta
 * ===========================================================================================
 * homepage: http://pureopensource.github.io/pureCanvas/
 * 
 * Copyright 2015 Pure OpenSource.
 * Licensed under MIT (https://github.com/PureOpenSource/pureCanvas/blob/master/LICENSE)
 *********************************************************************************************/

+function($){
	'use strict';
	
	/**
	 * Pure Canvas - Class Definition.
	 */
	
	var PureCanvas = function(element, options){
		this.$element = $(element);
		this.$main = null;
		this.$container = null;
		this.options = options;
		
		// Canvas ID 지정
		if(!this.options.setting.id) this.options.setting.id = this.createUUID(); 
		// Canvas 정보
		this.canvasInfo = {};
		
		// Canvas 생성
		this.createCanvas();
		// Event 생성
		this.makeCanvasEvent();
	}
	
	PureCanvas.VERSION = '0.1-beta';

	PureCanvas.DEFIN = {
		optionNames: 'toolkit setting resize', 
	}
	
	// 사용자에 의해 설정 변경 가능한 항목
	PureCanvas.DEFAULTS = {
		// Canvas의 설정 정보
		setting: {
			authForDraw: true,
			PointerForDraw: true,
			notAuthForDrawCursor: 'not-allowed',
			
			pointerDownSend: true,
			resizeType: 'rate',
			rateVal: 1,
		},
		// Toolkit 정보
		toolkit: {
			type: 'Cursor',
			style: {
				lineCap: 'round',
				lineJoin: 'round',
				strokeStyle: "rgba(0,0,0,100)",
				fillStyle: "rgba(0,0,0,100)",
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
				// Background Canvas 생성 
				bg: {domView: true, resize: true}, //true
				// Main Canvas 생성 - view을 비율에 맞게 조정한 Canvas
				main: {domView: true, resize: true}, //true
				// View Canvas 생성 - recvDraw+drawTemp+mView를 합친 Canvas
				view: {domView: false, resize: false}, // false
				// recvDraw Canvas 생성 - 외부 수신 데이터를 임시 Draw하는 Canvas
				recvDraw: {domView: false, resize: false}, //false
				// mView Canvas 생성 - 중요 포인트를 Draw하는 Canvas
				mView: {domView: false, resize: false}, //false
				// Pointer Canvas 생성 - 마우스포인트를 Draw하는 Canvas
				pointer: {domView: true, resize: true}, //true
				// DrawTemp Canvas 생성 - 원본 크기로 Draw에서 그린 데이터를 원본 크기로 임시로 다시 그리는 Canvas
				drawTemp: {domView: false, resize: false}, //false
				// Draw Canvas 생성 - 비율에 따른 변경되는 사용자가 임시로 그리고 있는 Canvas
				draw: {domView: true, resize: true}, //true
			}

			// Style & Attribute setting, append element
			this.$element.css({'display': 'table'})
				.attr('data-pure-canvas', 'element');
			var $main = $('<div></div>')
				.attr('data-pure-canvas', 'main')
				.css({'display': 'block', 'position': 'absolute', 'overflow': 'auto', 'width': 'inherit', 'height': 'inherit'})
				.appendTo(this.$element); 
			var $container = $('<div></div>')
				.attr('data-pure-canvas', 'container')
				.css({'border': '1px solid'})
				.appendTo($main);
			
			this.$main = $main;
			this.$container = $container;
			
			// Canvas 정보 목록에 존재하는 Canvas 생성
			for(var key in this.canvasInfo){
				var data = this.canvasInfo[key];
				
				// Canvas 생성 및 설정
				var $canvas = $('<canvas></canvas>').attr('data-pure-canvas', key);
				this.settingDefaultStyle($canvas);
				if(data.domView) this.$container.append($canvas);
				//if(!data.domView) $canvas.css({'display': 'none'});
				//$container.append($canvas);
				
				// Canvas 추가 정보 설정
				data.type = $canvas.attr('data-pure-canvas');
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
			var setting = this.options.setting;
			var toolkit = this.options.toolkit;
			var $drawCanvas = this.canvasInfo.draw.$canvas;
			
			$drawCanvas.on('mousedown mousemove mouseup mouseover mouseout touchstart touchmove touchend', function(e){
				// 그리기 권한이 없는 경우 이벤트를 수행하지 않음.
				if(!setting.authForDraw){
					return;
				}
				if(e.type.indexOf('touch') >= 0) e.preventDefault();
				
				var type = e.type;
				var callMethod = null;
				
				// 이벤트 분류
				switch (type) {
				case 'mousedown':
				case 'touchstart':
					callMethod = 'drawStart';
					break;
				case 'mousemove':
				case 'mouseover':
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
				
				e.type = 'drawEvent-' + toolkit.type;
				e.callMethod = callMethod;
				e.eventType = type;

				//console.log(e.eventType, e.type, e.callMethod, e.timeStamp, e);
				// PureCanvas Event 호출
				$drawCanvas.trigger(e);				
			})
		}		
	});
	
	/**
	 * Pure Canvas - Context Style Setting - 'toolkit' options 
	 */
	PureCanvas.prototype.toolkit = function(targetName, value){
		return this[targetName] ? this[targetName](value) : undefined;
	}	
	$.extend(PureCanvas.prototype, {
		type: function(value){
			var toolkit = this.options.toolkit;
			
			toolkit.type = value;
			console.debug('setting toolkit.type : ' + value, toolkit);
			
			var cursor = $.pureCanvas.toolkit.type[toolkit.type].getCursor();
			//this.canvasInfo.draw.canvas.css({cursor: cursor});
			this.canvasInfo.draw.canvas.style.cursor = cursor;
		},
		lineWidth: function(value){
			// Use : BallPen, highlighter, StraightLine, Rectangle
			this.contextStyle('lineWidth', value);
		},
		lineCap: function(value){
			// Use : BallPen, highlighter, StraightLine
			// Style : butt, round, square
			this.contextStyle('lineCap', value);
		},
		lineJoin: function(value){
			// Use : BallPen, highlighter
			// Style : miter, round, bevel
			this.contextStyle('lineJoin', value);
		},
		strokeStyle: function(value){
			if(typeof value == 'string') value = {color: value, opacity: 100};
			// Use : BallPen, highlighter, StraightLine, Circle, Triangle, Rectangle
			this.contextStyle('strokeStyle', this.pureCanvasToolkit.hexToRgba(value.color, value.opacity));
		},
		fillStyle: function(value){
			if(typeof value == 'string') value = {color: value, opacity: 100};
			// Use : BallPen, highlighter, StraightLine, Circle, Triangle, Rectangle
			this.contextStyle('fillStyle', this.pureCanvasToolkit.hexToRgba(value.color, value.opacity));
		},
		contextStyle: function(styleName, value){
			var toolkit = this.options.toolkit;
			
			toolkit.style[styleName] = value;
			console.debug('setting style [' + styleName + '] apply:' + toolkit.style[styleName] + ' , input:' + value);			
		},
	});
	
	/**
	 * Pure Canvas - Canvas Setting - 'setting' options 
	 */	
	PureCanvas.prototype.setting = function(targetName, value){
		return this[targetName] ? this[targetName](value) : undefined;
	}	
	$.extend(PureCanvas.prototype, {
		authForDraw: function(value){
			this.options.setting.authForDraw = value;
			
			if(value){
				var cursor = $.pureCanvas.toolkit.type[toolkit.type].getCursor();
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
			var image = new Image();
			
			var sDate = new Date();
			image.onload = function(){
				var printWidth, printHeight;
				
				var imageWidth = image.width;
				var imageHeight = image.height;
				
				// 이미지 원본 크기와 동일해야 되는 Canvas 크기 조정, cavnasInfo: resize = false
				$.each(THIS.canvasInfo, function(key, canvas){
					if(!canvas.resize){
						canvas.canvas.width = imageWidth;
						canvas.canvas.height = imageHeight;
					}
				});
				
				//THIS.canvasInfo.bg.context.drawImage(image, 0, 0, imageWidth, imageHeight);
				
				THIS.backgroundImage = {
					image: image,
					imgSrc: value,
					orgImageWidth: imageWidth,
					orgImageHeight: imageHeight,
					isSetting: true
				}

				THIS.$element.trigger({
					type: 'show.bg.pure'
				});
				
				THIS.resize();
				
				var eDate = new Date();
				console.debug("image loading time: ", eDate - sDate);
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
			
			this.backgroundImage.isSetting = true;
			this.resize();
			
			console.debug('setting resizeType: ' + this.options.setting.resizeType, this.options.setting.rateVal);			
		}
	});
	
	/**
	 * Canvas 확대/축소 처리
	 */
	PureCanvas.prototype.resize = function(){
		this.resize[this.options.setting.resizeType] ? this.resize[this.options.setting.resizeType](this) : undefined;
		
		this.$element.trigger({
			type: 'canvas-resize.pure'
		});
	}
	$.extend(PureCanvas.prototype.resize, {
		// 비율(%)
		rate: function(THIS){
			var image = THIS.backgroundImage;
			var rateVal = THIS.options.setting.rateVal;
			
			var width = image.orgImageWidth * rateVal;
			var height = image.orgImageHeight * rateVal;
			
			this.canvasResizeNDraw(THIS, width, height);
		},
		
		//쪽맞춤
		page: function(THIS){
			var image = THIS.backgroundImage;
			var rateVal = THIS.options.setting.rateVal;
			
			var elementWidth = THIS.$main.width();
			var elementHeight = THIS.$main.height();
			
			var rateWidth = elementWidth / image.orgImageWidth;
			var rateHeight = elementHeight / image.orgImageHeight;
			
			rateVal = (rateWidth > rateHeight) ? rateHeight : rateWidth;
			THIS.options.setting.rateVal = rateVal;
			
			var width = image.orgImageWidth * rateVal;
			var height = image.orgImageHeight * rateVal;
			
			image.isSetting = true;
			this.canvasResizeNDraw(THIS, width, height);
		},
		
		canvasResizeNDraw: function(THIS, width, height){
			var image = THIS.backgroundImage;
			var rateVal = THIS.options.setting.rateVal;
			
			var marginLeft = THIS.$main.width() / 2 - (width / 2);
			var marginTop = THIS.$main.height() / 2 - (height / 2)
			
			THIS.$container.css({width: width, height: height, 'margin-left': marginLeft < 0 ? 0 : marginLeft, 'margin-top': marginTop < 0 ? 0 : marginTop});
			
			if(image.isSetting){
				// 이미지 원본 크기와 동일해야 되는 Canvas 크기 조정, cavnasInfo: resize = false
				$.each(THIS.canvasInfo, function(key, canvas){
					if(canvas.resize){
						canvas.canvas.width = width;
						canvas.canvas.height = height;
					}
				});

				var mainCtx = THIS.canvasInfo.main.context;
				var mainCanvas = THIS.canvasInfo.main.canvas;
				
				// 메인의 draw data가 비율에 맞게 변경하여 다시 출력한다.
				mainCtx.clearRect(0, 0, mainCanvas.width, mainCanvas.height);
				mainCtx.save();
				mainCtx.setTransform(rateVal, 0, 0, rateVal, 0, 0);
				mainCtx.drawImage(THIS.canvasInfo.view.canvas, 0, 0);
				mainCtx.drawImage(THIS.canvasInfo.mView.canvas, 0, 0);
				mainCtx.restore();
				
				THIS.canvasInfo.bg.context.drawImage(image.image, 0, 0, width, height);
				
				image.isSetting = false;
			}				
		}
	});
	
	
	/**
	 * Pure Canvas - Plug-in Definition.
	 */
	
	function Plugin(option, _relatedTarget, _relatedValue){
		var $this = $(this);
		
		var data    = $this.data('pure.pureCanvas');
		var options = $.extend({}, PureCanvas.DEFAULTS, $this.data, typeof option == 'object' && option);

		if(!data){
			$this.data('pure.pureCanvas', (data = new PureCanvas(this, options)));
			data.pureCanvasToolkit = new $.pureCanvas.toolkit(this);
		}
		
		if(typeof option == 'string'){
			var returnValue = data[option](_relatedTarget, _relatedValue);
			return returnValue == undefined ? $this : returnValue;
		}	
	}
	
	$.fn.pureCanvas = Plugin;
	$.fn.pureCanvas.Constructor = PureCanvas;
	
	
	/**
	 * Pure Canvas - Event
	 */
	$(window).on('load', function(){
		$(window).on('resize', function(){
			$('[data-pure-canvas="element"]').each(function(index, element){
				$(element).pureCanvas('resize');
			});
		});
	});
	
	/*******************************************************************************************************************************/
	
	$.pureCanvas = {};
	$.pureCanvas.toolkit = function(element){
		this.$element = element;
		this.canvasInfo = this.$element.data('pure.pureCanvas').canvasInfo;
		this.options = this.$element.data('pure.pureCanvas').options;
		this.setting = this.options.setting;
		this.toolkit = this.options.toolkit;
		
		this.drawCanvas = this.canvasInfo.draw.canvas;
		this.$drawCanvas = this.canvasInfo.draw.$canvas;
		this.drawCtx = this.canvasInfo.draw.context;
		this.drawTempCanvas = this.canvasInfo.drawTemp.canvas;
		this.drawTempCtx = this.canvasInfo.drawTemp.context;
		
		this.init();
	}

	$.extend($.pureCanvas.toolkit, {
		prototype: {
			init: function(){
				var THIS = this;
				
				// Toolkit 별 event 생성
				$.each($.pureCanvas.toolkit.type, function(toolkitType, toolkit){
					// $.pureCanvas.toolkit의 공통 function을 사용하기 위해 $.extend 함.
					$.extend(toolkit, THIS);
					
					THIS.$drawCanvas.on('drawEvent-' + toolkitType, function(e){
						// 좌표 계산, touchend event는 값 없음.
						var point = THIS.getPoint(e);
						e.point = point;
						
						// Toolkit Type의 callMethod가 있는 경우 수행한다.
						var toolkitType = $.pureCanvas.toolkit.type[THIS.toolkit.type];
						if(toolkitType[e.callMethod]) toolkitType[e.callMethod](e);	
					});
				});
			},
			
			sendDrawData: function(points){
				var data = {
					type: this.toolkit.type,
					style: this.toolkit.style,
					id: this.setting.id,
					points: points ? (Object.prototype.toString.call(points) === "[object Array]") ? points.join(',') : points : null
				}
				
				this.$element.trigger({
					type: 'complate.draw.pure',
					drawData: data,
				});
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
				var rx = Math.ceil(x / rateVal);
				var ry = Math.ceil(y / rateVal);
				
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
				var obj = {x:Number(pointSplit[0]), y:Number(pointSplit[1])};
				return obj;
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

			    if(opacity==null) opacity = 100;
			    var result = "rgba("+r+","+g+","+b+","+opacity/100+")";
			    return result;
			},

			/*
			 * rgba(xxx, xxx, xxx, x) 값을 hex(#000000) 값으로 변환
			 */
			rgbaToHex: function(rgba){
			/*	rgb = rgb.match(/^rgba?[\s+]?\([\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?/i);
				return (rgb && rgb.length === 4) ? "#"
							+ ("0" + parseInt(rgb[1], 10).toString(16)).slice(-2)
							+ ("0" + parseInt(rgb[2], 10).toString(16)).slice(-2)
							+ ("0" + parseInt(rgb[3], 10).toString(16)).slice(-2) : "";*/
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
				
				target.context.save();
				// source-over : 새 도형은 기존 내용 위에 그려진다. 기본값
				target.context.globalCompositeOperation = 'source-over';
				// target canvas에 source canvas를 덥어 그린다.
				target.context.drawImage(src.canvas, 0, 0);
				target.context.restore();
				
				if(data.clear){
					if(typeof data.clear == 'object'){
						$.each(data.clear, function(index, element){
							element.context.clearRect(0, 0, element.canvas.width, element.canvas.height);
						});						
					}
				}	
				
				
				this.mainCanvasChange();
			},
			
			/**
			 * view, mview의 Image를 비율에 맞게 main에 draw한다.
			 */
			mainCanvasChange: function(){
				var mainCanvas = this.canvasInfo.main.canvas;
				var mainCtx = this.canvasInfo.main.context;
				var viewCanvas = this.canvasInfo.view.canvas;
				var mviewCanvas = this.canvasInfo.mView.canvas;
				
				var setting = this.$element.data('pure.pureCanvas').options.setting;
				
				mainCtx.save();
				mainCtx.clearRect(0, 0, mainCanvas.width, mainCanvas.height);
				mainCtx.setTransform(setting.rateVal, 0, 0, setting.rateVal, 0, 0);
				// source-over : 새 도형은 기존 내용 위에 그려진다. 기본값
				mainCtx.globalCompositeOperation = 'source-over';
				// target canvas에 source canvas를 덥어 그린다.
				mainCtx.drawImage(viewCanvas, 0, 0);
				mainCtx.drawImage(mviewCanvas, 0, 0);
				mainCtx.restore();
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
	/*******************************************************************************
	 * Cursor
	 *******************************************************************************/
	var Cursor = function(){
		console.log('new Cursor');
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
		console.log('new HandCursor');
	}
	HandCursor.prototype = {
		getType: function(){
			return 'HandCursor'; 
		},
		getCursor: function(){
			return 'all-scroll';
		},
	}
	$.pureCanvas.toolkit.addToolkit(HandCursor);
	
	
	/*******************************************************************************
	 * Pen Interface
	 *******************************************************************************/
	var IPen = {
		drawForArc: function(ctx, canvas, style, points){
			ctx.save();
			var point = this.getPointSplit(points);
			
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			
			ctx.beginPath();
			ctx.arc(point.x, point.y, style.lineWidth / 2, 0, Math.PI * 2, false);
			ctx.lineWidth = style.lineWidth;
			ctx.lineCap = 'round';
			ctx.lineJoin = 'round';
			ctx.fillStyle = style.strokeStyle;
			ctx.fill();
			ctx.restore();
		},
		drawForLine: function(ctx, canvas, style, drawPoints){
			if(drawPoints.length < 3){
				var p = this.getPointSplit(drawPoints[0]);
				
				ctx.beginPath();
				ctx.arc(p.x, p.y, style.lineWidth / 2, 0, Math.PI * 2, false);
				ctx.lineWidth = style.lineWidth;
				ctx.lineCap = 'round';
				ctx.lineJoin = 'round';
				ctx.fillStyle = style.strokeStyle;
				ctx.fill();
				ctx.closePath();
				return;
			}
			
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			
			ctx.beginPath();
			ctx.lineWidth = style.lineWidth;
			ctx.lineCap = 'round';
			ctx.lineJoin = 'round';
			ctx.strokeStyle = style.strokeStyle;
			ctx.fillStyle = style.strokeStyle;
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
		}
	}
	
	/*******************************************************************************
	 * BallPen
	 *******************************************************************************/
	var BallPen = function(){
		console.log('new ballPen');
		
		this.isDrawing = false;
		
		this.points = [];
		this.pointsRate = [];
	}
	BallPen.prototype = {
		getType: function(){
			return 'BallPen'; 
		},
		getCursor: function(){
			return 'crosshair';
		},
	
		drawStart: function(e){
			console.log(this.getType() + ' drawStart');
			
			this.isDrawing = true;
			
			this.drawing(e);
		},
		drawing: function(e){
			console.log(this.getType() + ' drawing');
			
			var point = e.point.org;
			
			if(this.isDrawing){
				this.points.push(e.point.org);
				this.pointsRate.push(e.point.rate);
				
				this.drawForLine(this.drawCtx, this.drawCanvas, this.getDrawStyle(), this.points);
				this.drawForLine(this.drawTempCtx, this.drawTempCanvas, this.toolkit.style, this.pointsRate);
			}else{
				this.drawForArc(this.drawCtx, this.drawCanvas, this.getDrawStyle(), point);
			}
		},
		drawEnd: function(e){
			console.log(this.getType() + ' drawEnd');
			
			this.complateDraw({
				copyFrom: this.canvasInfo.drawTemp,
				copyTo: this.canvasInfo.view,
				clear: [this.canvasInfo.draw, this.canvasInfo.drawTemp]
			});
			
			this.sendDrawData(this.points);
			
			this.isDrawing = false;
			this.points = [];
			this.pointsRate = [];
		},
		drawOut: function(e){
			console.log(this.getType() + ' drawOut');
			
			if(!this.isDrawing){
				this.drawCtx.clearRect(0, 0, this.drawCanvas.width, this.drawCanvas.height);
			}
		},
		draw: function(e){
			console.log(this.getType() + ' draw');
		},
	}
	$.extend(BallPen.prototype, IPen);
	$.pureCanvas.toolkit.addToolkit(BallPen);
	
	/*******************************************************************************
	 * highlighter
	 *******************************************************************************/
	var Highlighter = function(){
		console.log('new Highlighter');
		
		this.isDrawing = false;
		
		this.points = [];
		this.pointsRate = [];
	}
	Highlighter.prototype = {
		getType: function(){
			return 'Highlighter'; 
		},
		getCursor: function(){
			return 'crosshair';
		},
	
		drawStart: function(e){
			console.log(this.getType() + ' drawStart');
			
			this.isDrawing = true;
			
			this.drawing(e);
		},
		drawing: function(e){
			console.log(this.getType() + ' drawing');
			
			var point = e.point.org;
			
			if(this.isDrawing){
				this.points.push(e.point.org);
				this.pointsRate.push(e.point.rate);
				
				this.drawForLine(this.drawCtx, this.drawCanvas, this.getDrawStyle(), this.points);
				this.drawForLine(this.drawTempCtx, this.drawTempCanvas, this.toolkit.style, this.pointsRate);
			}else{
				this.drawForArc(this.drawCtx, this.drawCanvas, this.getDrawStyle(), point);
			}
		},
		drawEnd: function(e){
			console.log(this.getType() + ' drawEnd');
			
			this.complateDraw({
				copyFrom: this.canvasInfo.drawTemp,
				copyTo: this.canvasInfo.view,
				clear: [this.canvasInfo.draw, this.canvasInfo.drawTemp]
			});
			
			this.sendDrawData(this.points);
			
			this.isDrawing = false;
			this.points = [];
			this.pointsRate = [];
		},
		drawOut: function(e){
			console.log(this.getType() + ' drawOut');
			
			if(!this.isDrawing){
				this.drawCtx.clearRect(0, 0, this.drawCanvas.width, this.drawCanvas.height);
			}
		},
		draw: function(e){
			console.log(this.getType() + ' draw');
		},
		
		getStrokeStyle: function(strokeStyle){
			var hexStyle = this.rgbaToHex(strokeStyle);
			var returnStrokeStyle = this.hexToRgba(hexStyle.hex, 50);
			return returnStrokeStyle;
		},
		
		drawForArc: function(ctx, canvas, style, points){
			ctx.save();
			var point = this.getPointSplit(points);
			
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			
			ctx.beginPath();
			ctx.arc(point.x, point.y, style.lineWidth / 2, 0, Math.PI * 2, false);
			ctx.lineWidth = style.lineWidth;
			ctx.lineCap = 'round';
			ctx.lineJoin = 'round';
			ctx.fillStyle = this.getStrokeStyle(style.strokeStyle);
			ctx.fill();
			ctx.restore();
		},
		drawForLine: function(ctx, canvas, style, drawPoints){
			if(drawPoints.length < 3){
				var p = this.getPointSplit(drawPoints[0]);
				
				ctx.beginPath();
				ctx.arc(p.x, p.y, style.lineWidth / 2, 0, Math.PI * 2, false);
				ctx.lineWidth = style.lineWidth;
				ctx.lineCap = 'round';
				ctx.lineJoin = 'round';
				ctx.fillStyle = this.getStrokeStyle(style.strokeStyle);
				ctx.fill();
				ctx.closePath();
				return;
			}
			
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			
			ctx.beginPath();
			ctx.lineWidth = style.lineWidth;
			ctx.lineCap = 'round';
			ctx.lineJoin = 'round';
			ctx.strokeStyle = this.getStrokeStyle(style.strokeStyle);
			ctx.fillStyle = this.getStrokeStyle(style.strokeStyle);
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
		}
	}
	$.pureCanvas.toolkit.addToolkit(Highlighter);	
	
	/*******************************************************************************
	 * MousePointer
	 *******************************************************************************/
	var MousePointer = function(){
		console.log('new pointer');
		
		this.isDrawing = false;
		
		this.pointerMap = {
			me: null
		}
	}
	MousePointer.prototype = {
		getType: function(){
			return 'MousePointer'; 
		},
		getCursor: function(){
			return 'crosshair';
		},
	
		drawStart: function(e){
			console.log(this.getType() + ' drawStart');
			
			this.isDrawing = true;
			this.pointerMap.me = {
				style: this.toolkit.style,
				points: e.point.org
			}
			
			this.drawForMousePointer(this.canvasInfo.pointer.context, this.canvasInfo.pointer.canvas);
			
			if(this.setting.pointerDownSend && this.isDrawing){
				this.sendDrawData([this.pointerMap.me.points]);
			}
		},
		drawing: function(e){
			console.log(this.getType() + ' drawing');
			
			this.pointerMap.me = {
				style: this.toolkit.style,
				points: e.point.org
			}
			
			this.drawForMousePointer(this.canvasInfo.pointer.context, this.canvasInfo.pointer.canvas);
			
			
			if((!this.setting.pointerDownSend )|| (this.setting.pointerDownSend && this.isDrawing)){
				this.sendDrawData([this.pointerMap.me.points]);
			}
		},
		drawEnd: function(e){
			console.log(this.getType() + ' drawEnd');
			
			this.isDrawing = false;
			
			this.drawForMousePointer(this.canvasInfo.pointer.context, this.canvasInfo.pointer.canvas);
			
			if(this.setting.pointerDownSend){
				this.sendDrawData(null);
			}
		},
		drawOut: function(e){
			console.log(this.getType() + ' drawOut');
			
			this.isDrawing = false;
			this.pointerMap.me = null;
			
			this.drawForMousePointer(this.canvasInfo.pointer.context, this.canvasInfo.pointer.canvas);
			
			this.sendDrawData(null);
		},
		
		drawForMousePointer: function(ctx, canvas){
			var THIS = this;
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			
			$.each(this.pointerMap, function(key, data){
				if(!data){
					return;
				}
				
				var style = data.style;
				var points = data.points;
				
				// pointer의 위치가 canvas를 떠났을 경우 points가 null로 전송된다.
				if(!points){
					ctx.clearRect(0, 0, canvas.width, canvas.height);
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
				
				if(THIS.setting.pointerDownSend && !THIS.isDrawing){
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
	}
	$.pureCanvas.toolkit.addToolkit(MousePointer);
	
	
}(jQuery);