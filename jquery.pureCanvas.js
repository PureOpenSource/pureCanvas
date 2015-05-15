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
		optionName: {
			toolkit: 'toolkit',
			setting: 'setting',
			resize: 'resize'
		}
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
			if(this.$element.attr('data-pure-canvas')){
				return;
			}
			
			// Canvas 정보
			this.canvasInfo = {
				// Background Canvas 생성 
				bg: {domView: true, resize: true, clearView: false}, //true
				// Main Canvas 생성 - view을 비율에 맞게 조정한 Canvas
				main: {domView: true, resize: true, clearView: true}, //true
				// View Canvas 생성 - recvDraw+drawTemp+mView를 합친 Canvas
				view: {domView: false, resize: false, clearView: true}, // false
				// recvDraw Canvas 생성 - 외부 수신 데이터를 임시 Draw하는 Canvas
				recvDraw: {domView: false, resize: false, clearView: false}, //false
				// mView Canvas 생성 - 중요 포인트를 Draw하는 Canvas
				mView: {domView: false, resize: false, clearView: true}, //false
				// Pointer Canvas 생성 - 마우스포인트를 Draw하는 Canvas
				pointer: {domView: true, resize: true, clearView: false}, //true
				// DrawTemp Canvas 생성 - 원본 크기로 Draw에서 그린 데이터를 원본 크기로 임시로 다시 그리는 Canvas
				drawTemp: {domView: false, resize: false, clearView: false}, //false
				// Draw Canvas 생성 - 비율에 따른 변경되는 사용자가 임시로 그리고 있는 Canvas
				draw: {domView: true, resize: true, clearView: false}, //true
			}

			// Style & Attribute setting, append element
			this.$element.css({'display': 'table'}).attr('data-pure-canvas', 'element');
			var $main = $('<div></div>').attr('data-pure-canvas', 'main')
				.css({'display': 'block', 'position': 'absolute', 'overflow': 'auto', 'width': 'inherit', 'height': 'inherit'})
				.appendTo(this.$element); 
			var $container = $('<div></div>').attr('data-pure-canvas', 'container')
				.css({'border': '1px solid'})
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
				if(e.type.indexOf('touch') >= 0){
					e.preventDefault();
					e.isTouch = true;
				}
				
				var type = e.type;
				var callMethod = null;
				
				// 이벤트 분류
				switch (type) {
				case 'mousedown':
				case 'touchstart':
					callMethod = 'drawStart';
					
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
				
				e.type = 'drawEvent-' + toolkit.type;
				e.callMethod = callMethod;
				e.eventType = type;

				//console.log(e.eventType, e.type, e.callMethod, e.timeStamp, e);
				// PureCanvas Event 호출
				$drawCanvas.trigger(e);
			})
		},
		
		loadingBar: function(option, message){
			if(!option || option === 'show'){
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
				
				this.loadingBarDiv.css({width: this.$element.width(), height: this.$element.height()});
				var top = (this.$element.height() / 2) - messageBox.height();
				messageBox.css({'margin-top': top}).html(message);

				this.loadingBarDiv.fadeIn(500);
			}else{
				var THIS = this;
				this.loadingBarDiv.fadeOut(500, function(){
					// this = loadingBarDiv
					//THIS.loadingBarDiv.remove();
					//THIS.loadingBarDiv = null;
				});
			}
		},
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

			console.debug('setting toolkit.type : ' + value, toolkit);

			var toolkitType = $.pureCanvas.toolkit.type[value];
			
			// 즉시 처리 로직 수행
			if(toolkitType.instantProcess){
				toolkitType.instantProcess();
				return;
			}
			
			toolkit.type = value;
			
			// 커서 모양 변경
			this.canvasInfo.draw.canvas.style.cursor = toolkitType.getCursor();
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
			
			if(THIS.imageInfo && THIS.imageInfo.imgSrc === value){
				console.debug('duplication. image.');
				return;
			}
			
			var image = new Image();
			
			var sDate = new Date();
			this.loadingBar('show', 'Image Loading...');
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
				
				THIS.imageInfo = {
					image: image,
					imgSrc: value,
					orgImageWidth: imageWidth,
					orgImageHeight: imageHeight,
					isSetting: true
				}

				THIS.$element.trigger({
					type: 'show.bg.pureCanvas'
				});
				
				THIS.resize();
				
				var eDate = new Date();
				console.debug("image loading time: ", eDate - sDate);
				
				THIS.loadingBar('hide');
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
			
			this.imageInfo.isSetting = true;
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
			type: 'canvas-resize.pureCanvas'
		});
	}
	$.extend(PureCanvas.prototype.resize, {
		// 비율(%)
		rate: function(THIS){
			var imageInfo = THIS.imageInfo;
			var rateVal = THIS.options.setting.rateVal;
			
			var width = imageInfo.orgImageWidth * rateVal;
			var height = imageInfo.orgImageHeight * rateVal;
			
			this.canvasResizeNDraw(THIS, width, height);
		},
		
		//쪽맞춤
		page: function(THIS){
			var imageInfo = THIS.imageInfo;
			var rateVal = THIS.options.setting.rateVal;
			
			var elementWidth = THIS.$main.width();
			var elementHeight = THIS.$main.height();
			
			var rateWidth = elementWidth / imageInfo.orgImageWidth;
			var rateHeight = elementHeight / imageInfo.orgImageHeight;
			
			rateVal = (rateWidth > rateHeight) ? rateHeight : rateWidth;
			THIS.options.setting.rateVal = rateVal;
			
			var width = imageInfo.orgImageWidth * rateVal;
			var height = imageInfo.orgImageHeight * rateVal;
			
			imageInfo.isSetting = true;
			this.canvasResizeNDraw(THIS, width, height);
		},
		
		canvasResizeNDraw: function(THIS, width, height){
			var imageInfo = THIS.imageInfo;
			var rateVal = THIS.options.setting.rateVal;
			
			var marginLeft = THIS.$main.width() / 2 - (width / 2);
			var marginTop = THIS.$main.height() / 2 - (height / 2)
			
			THIS.$container.css({width: width, height: height, 'margin-left': marginLeft < 0 ? 0 : marginLeft, 'margin-top': marginTop < 0 ? 0 : marginTop});
			
			if(imageInfo.isSetting){
				// 이미지 원본 크기와 동일해야 되는 Canvas 크기 조정, cavnasInfo: resize = false
				$.each(THIS.canvasInfo, function(key, canvas){
					if(canvas.resize){
						canvas.canvas.width = width;
						canvas.canvas.height = height;
					}
				});

				var mainCtx = THIS.canvasInfo.main.context;
				var mainCanvas = THIS.canvasInfo.main.canvas;
				var bgCtx = THIS.canvasInfo.bg.context;
				var bgCanvas = THIS.canvasInfo.bg.canvas;
				
				// 메인의 draw data가 비율에 맞게 변경하여 다시 출력한다.
				mainCtx.clearRect(0, 0, mainCanvas.width, mainCanvas.height);
				mainCtx.save();
				mainCtx.setTransform(rateVal, 0, 0, rateVal, 0, 0);
				mainCtx.drawImage(THIS.canvasInfo.view.canvas, 0, 0);
				mainCtx.drawImage(THIS.canvasInfo.mView.canvas, 0, 0);
				mainCtx.restore();
				
				bgCtx.drawImage(imageInfo.image, 0, 0, width, height);
				
				imageInfo.isSetting = false;
			}				
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
				$(element).pureCanvas('resize');
			});
		});
	});
	
	/*******************************************************************************************************************************/
	
	$.pureCanvas = {};
	$.pureCanvas.toolkit = function(element){
		this.$element = element;
		this.$main = this.$element.find('[data-pure-canvas="main"]');
		this.canvasInfo = this.$element.data('pure.pureCanvas').canvasInfo;
		this.options = this.$element.data('pure.pureCanvas').options;
		this.setting = this.options.setting;
		this.toolkit = this.options.toolkit;
		
		this.drawCanvas = this.canvasInfo.draw.canvas;
		this.$drawCanvas = this.canvasInfo.draw.$canvas;
		this.drawCtx = this.canvasInfo.draw.context;
		this.drawTempCanvas = this.canvasInfo.drawTemp.canvas;
		this.drawTempCtx = this.canvasInfo.drawTemp.context;
		this.viewCanvas = this.canvasInfo.view.canvas;
		this.viewCtx = this.canvasInfo.view.context;
		this.mainCanvas = this.canvasInfo.main.canvas;
		this.mainCtx = this.canvasInfo.main.context;
		
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
					if(toolkit.init) toolkit.init();
					
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
					type: 'complate.draw.pureCanvas',
					drawData: data,
				});
			},
			sendScrollData: function(e){
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
					leftRate: leftRate,
					topRate: topRate
				}
				
				this.$element.trigger({
					type: 'scroll-move.pureCanvas',
					scrollData: data
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
					target.context.clearRect(0, 0, target.canvas.width, target.canvas.height);
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
	$.extend($.pureCanvas.toolkit.prototype, {
		isLastSameCurrentPoint: function(points, currentPoint){
			return points && points.length > 0 ? points[points.lenght-1] == currentPoint : false; 
		},
		
		// 굵기, 색에 따라그려질 정보를 출력한다.
		drawForPrePoint: function(ctx, canvas, drawStyle, drawPoint){
			var style = $.extend({}, drawStyle);
			style.fillStyle = style.strokeStyle;
			style.strokeStyle = '#ffffff';
			
			var point = this.getPointSplit(drawPoint);
			
			if(!this.isDrawing) ctx.clearRect(0, 0, canvas.width, canvas.height);
			
			ctx.save();
			ctx.beginPath();
			ctx.arc(point.x, point.y, style.lineWidth / 2, 0, Math.PI * 2, false);
			ctx.lineWidth = 1;
			ctx.lineCap = 'round';
			ctx.lineJoin = 'round';
			ctx.fillStyle = style.fillStyle;
			ctx.fill();
			ctx.strokeStyle = style.strokeStyle;
			ctx.stroke();
			ctx.restore();			
		},
		
		drawForArc: function(ctx, canvas, style, drawPoints){
			var point0 = this.getPointSplit(drawPoints[0]);
			var point1 = this.getPointSplit(drawPoints[1]);
			
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			
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
		drawForLine: function(ctx, canvas, style, drawPoints){
			// drawForStraightLine
			if(drawPoints.length <= 2){
				ctx.beginPath();
				
				if(!style.isNotClear){
					ctx.clearRect(0, 0, canvas.width, canvas.height);
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
				ctx.clearRect(0, 0, canvas.width, canvas.height);
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
		drawForRect: function(ctx, canvas, style, drawPoints){
			var point1 = this.getPointSplit(drawPoints[0]);
			var point2 = this.getPointSplit(drawPoints[1]);

			if(!style.isNotClear){
				ctx.clearRect(0, 0, canvas.width, canvas.height);
			}
			
			ctx.beginPath();
			if(style.isStroke){
				ctx.strokeRect(point1.x, point1.y, point2.x - point1.x, point2.y - point1.y);
			}else if(style.isFill){
				ctx.rect(point1.x, point1.y, point2.x - point1.x, point2.y - point1.y);
			}
			
			ctx.lineWidth = style.lineWidth;
			ctx.lineCap = 'round';
			ctx.lineJoin = 'round';
			ctx.strokeStyle = style.strokeStyle;
			ctx.stroke();
			ctx.fillStyle = style.fillStyle;
			ctx.fill();		
		},
		drawForTriangle: function(ctx, canvas, style, drawPoints){
			var point0 = this.getPointSplit(drawPoints[0]);
			var point1 = this.getPointSplit(drawPoints[1]);
			
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			
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
					
					THIS.eventCaller = setTimeout(function(){
						THIS.sendScrollData(e);
					}, 300);
				}
			});	
		},
		
		drawStart: function(e){
			console.log(this.getType() + ' drawStart');
			
			this.isDrawing = true;
			this.downPoint = this.getPointSplit(e.point.org);
		},
		drawing: function(e){
			console.log(this.getType() + ' drawing');
			
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
			console.log(this.getType() + ' drawEnd');
			
			this.isDrawing = false;
			
			this.sendScrollData();
		},
	}
	$.pureCanvas.toolkit.addToolkit(HandCursor);
	
	/*******************************************************************************
	 * Eraser
	 *******************************************************************************/
	var Eraser = function(){
		this.isDrawing = false;
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
			console.log(this.getType() + ' drawStart');
			
			this.isDrawing = true;
			
			this.viewCtx.globalCompositeOperation = "destination-out";
			this.mainCtx.globalCompositeOperation = "destination-out";
			
			this.drawing(e);			
		},
		drawing: function(e){
			console.log(this.getType() + ' drawing');

			var drawStyle = this.getCustomStyle(this.getDrawStyle());
			var drawTempStyle = this.getCustomStyle(this.toolkit.style);
			
			if(this.isDrawing){
				this.points.push(e.point.org);
				this.pointsRate.push(e.point.rate);				
				
				this.drawForLine(this.mainCtx, this.mainCanvas, drawStyle, this.points);
				this.drawForLine(this.viewCtx, this.viewCanvas, drawTempStyle, this.pointsRate);
			}
			drawStyle.isNotClear = false;
			this.drawForArc(this.drawCtx, this.drawCanvas, drawStyle, e.point.org);
		},
		drawEnd: function(e){
			console.log(this.getType() + ' drawEnd');
			
			this.sendDrawData(this.points);
			
			if(e.isTouch){
				this.drawCtx.clearRect(0, 0, this.drawCanvas.width, this.drawCanvas.height);
			}
			
			this.isDrawing = false;
			this.points = [];
			this.pointsRate = [];
		},
		drawOut: function(e){
			console.log(this.getType() + ' drawOut');
			
			this.drawCtx.clearRect(0, 0, this.drawCanvas.width, this.drawCanvas.height);
		},
		
		getCustomStyle: function(style){
			var custom = $.extend({}, style);
			custom.arcFillStyle = 'rgba(255,255,250, 0.7)';
			custom.fillStyle = 'rgba(255,255,250, 1)';
			custom.strokeStyle = 'black';
			custom.arcLineWidth = 1;
			
			custom.isFill = true;
			custom.isStroke = true;
			custom.isNotClear = true;
			
			return custom;
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
			$.each(this.canvasInfo, function(key, canvas){
				if(canvas.clearView){
					canvas.context.clearRect(0, 0, canvas.canvas.width, canvas.canvas.height);
				}
			});
			this.sendDrawData(null);
		}
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
			console.log(this.getType() + ' drawStart');
			
			this.isDrawing = true;
			this.drawing(e);
		},
		drawing: function(e){
			console.log(this.getType() + ' drawing');
			
			var drawStyle = this.getCustomStyle(this.getDrawStyle());
			var drawTempStyle = this.getCustomStyle(this.toolkit.style);
			
			if(this.isDrawing){
				if(!this.isLastSameCurrentPoint(this.points, e.point.org)){
					this.points.push(e.point.org);
					this.pointsRate.push(e.point.rate);
					
					this.drawForLine(this.drawCtx, this.drawCanvas, drawStyle, this.points);
					this.drawForLine(this.drawTempCtx, this.drawTempCanvas, drawTempStyle, this.pointsRate);					
				}
			}
			this.drawForPrePoint(this.drawCtx, this.drawCanvas, drawStyle, e.point.org);
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
	 * highlighter
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
			console.log(this.getType() + ' drawStart');
			
			this.isDrawing = true;
			
			var point = e.point;
			this.points[0] = point.org;
			this.pointsRate[0] = point.rate;
		},
		drawing: function(e){
			console.log(this.getType() + ' drawing');
			
			var drawStyle = this.getCustomStyle(this.getDrawStyle());
			var drawTempStyle = this.toolkit.style;
			
			if(this.isDrawing){
				var point = e.point;
				this.points[1] = point.org;
				this.pointsRate[1] = point.rate;
				
				this.drawForLine(this.drawCtx, this.drawCanvas, drawStyle, this.points);
				this.drawForLine(this.drawTempCtx, this.drawTempCanvas, drawTempStyle, this.pointsRate);
			}
			this.drawForPrePoint(this.drawCtx, this.drawCanvas, drawStyle, e.point.org);
			
		},
		drawEnd: function(e){
			console.log(this.getType() + ' drawEnd');
			
			this.isDrawing = false;

			this.complateDraw({
				copyFrom: this.canvasInfo.drawTemp,
				copyTo: this.canvasInfo.view,
				clear: [this.canvasInfo.draw, this.canvasInfo.drawTemp]
			});
			
			this.sendDrawData(this.points);
			
			this.points = [];
			this.pointsRate = [];
		},
		drawOut: function(e){
			console.log(this.getType() + ' drawOut');

			if(!this.isDrawing){
				this.drawCtx.clearRect(0, 0, this.drawCanvas.width, this.drawCanvas.height);
			}
		},
		
		getCustomStyle: function(style){
			var custom = $.extend({}, style);
			return custom;
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
			console.log(this.getType() + ' drawStart');
			
			this.isDrawing = true;
			
			var point = e.point;
			this.points[0] = point.org;
			this.pointsRate[0] = point.rate;
		},
		drawing: function(e){
			console.log(this.getType() + ' drawing');
			
			var drawStyle = this.getCustomStyle(this.getDrawStyle());
			var drawTempStyle = this.getCustomStyle(this.toolkit.style);
			
			if(this.isDrawing){
				var point = e.point;
				this.points[1] = point.org;
				this.pointsRate[1] = point.rate;
				
				this.drawForRect(this.drawCtx, this.drawCanvas, drawStyle, this.points);
				this.drawForRect(this.drawTempCtx, this.drawTempCanvas, drawTempStyle, this.pointsRate);
			}
			this.drawForPrePoint(this.drawCtx, this.drawCanvas, drawStyle, e.point.org);
			
		},
		drawEnd: function(e){
			console.log(this.getType() + ' drawEnd');
			
			this.isDrawing = false;

			this.complateDraw({
				copyFrom: this.canvasInfo.drawTemp,
				copyTo: this.canvasInfo.view,
				clear: [this.canvasInfo.draw, this.canvasInfo.drawTemp]
			});
			
			this.sendDrawData(this.points);
			
			this.points = [];
			this.pointsRate = [];
		},
		drawOut: function(e){
			console.log(this.getType() + ' drawOut');

			if(!this.isDrawing){
				this.drawCtx.clearRect(0, 0, this.drawCanvas.width, this.drawCanvas.height);
			}
		},
		
		getCustomStyle: function(style){
			var custom = $.extend({}, style);
			custom.isStroke = true;
			return custom;
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
			console.log(this.getType() + ' drawStart');
			
			this.isDrawing = true;
			
			var point = e.point;
			this.points[0] = point.org;
			this.pointsRate[0] = point.rate;
		},
		drawing: function(e){
			console.log(this.getType() + ' drawing');
			
			var drawStyle = this.getCustomStyle(this.getDrawStyle());
			var drawTempStyle = this.getCustomStyle(this.toolkit.style);
			
			if(this.isDrawing){
				var point = e.point;
				this.points[1] = point.org;
				this.pointsRate[1] = point.rate;
				
				this.drawForArc(this.drawCtx, this.drawCanvas, drawStyle, this.points);
				this.drawForArc(this.drawTempCtx, this.drawTempCanvas, drawTempStyle, this.pointsRate);
			}
			this.drawForPrePoint(this.drawCtx, this.drawCanvas, drawStyle, e.point.org);
			
		},
		drawEnd: function(e){
			console.log(this.getType() + ' drawEnd');
			
			this.isDrawing = false;

			this.complateDraw({
				copyFrom: this.canvasInfo.drawTemp,
				copyTo: this.canvasInfo.view,
				clear: [this.canvasInfo.draw, this.canvasInfo.drawTemp]
			});
			
			this.sendDrawData(this.points);
			
			this.points = [];
			this.pointsRate = [];
		},
		drawOut: function(e){
			console.log(this.getType() + ' drawOut');

			if(!this.isDrawing){
				this.drawCtx.clearRect(0, 0, this.drawCanvas.width, this.drawCanvas.height);
			}
		},
		
		getCustomStyle: function(style){
			var custom = $.extend({}, style);
			custom.isStroke = true;
			return custom;
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
			console.log(this.getType() + ' drawStart');
			
			this.isDrawing = true;
			
			var point = e.point;
			this.points[0] = point.org;
			this.pointsRate[0] = point.rate;
		},
		drawing: function(e){
			console.log(this.getType() + ' drawing');
			
			var drawStyle = this.getCustomStyle(this.getDrawStyle());
			var drawTempStyle = this.getCustomStyle(this.toolkit.style);
			
			if(this.isDrawing){
				var point = e.point;
				this.points[1] = point.org;
				this.pointsRate[1] = point.rate;
				
				this.drawForTriangle(this.drawCtx, this.drawCanvas, drawStyle, this.points);
				this.drawForTriangle(this.drawTempCtx, this.drawTempCanvas, drawTempStyle, this.pointsRate);
			}
			this.drawForPrePoint(this.drawCtx, this.drawCanvas, drawStyle, e.point.org);
			
		},
		drawEnd: function(e){
			console.log(this.getType() + ' drawEnd');
			
			this.isDrawing = false;

			this.complateDraw({
				copyFrom: this.canvasInfo.drawTemp,
				copyTo: this.canvasInfo.view,
				clear: [this.canvasInfo.draw, this.canvasInfo.drawTemp]
			});
			
			this.sendDrawData(this.points);
			
			this.points = [];
			this.pointsRate = [];
		},
		drawOut: function(e){
			console.log(this.getType() + ' drawOut');

			if(!this.isDrawing){
				this.drawCtx.clearRect(0, 0, this.drawCanvas.width, this.drawCanvas.height);
			}
		},
		
		getCustomStyle: function(style){
			var custom = $.extend({}, style);
			custom.isStroke = true;
			return custom;
		},
	}
	$.pureCanvas.toolkit.addToolkit(Triangle);			
	
	/*******************************************************************************
	 * CheckPoint
	 *******************************************************************************/
	var CheckPoint = function(){
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
			console.log(this.getType() + ' drawStart');
			
			this.drawing(e);
		},
		drawing: function(e){
			console.log(this.getType() + ' drawing');
			
			var point = e.point;
			this.points[0] = point.org;
			this.pointsRate[0] = point.rate;
			
			this.drawForCheckPoint(this.drawCtx, this.drawCanvas, this.points);
		},
		drawEnd: function(e){
			console.log(this.getType() + ' drawEnd');
			
			this.drawForCheckPoint(this.drawTempCtx, this.drawTempCanvas, this.pointsRate);
			
			this.complateDraw({
				copyFrom: this.canvasInfo.drawTemp,
				copyTo: this.canvasInfo.view,
				clear: [this.canvasInfo.draw, this.canvasInfo.drawTemp]
			});
			
			this.sendDrawData(this.points);
			
			this.points = [];
			this.pointsRate = [];
		},
		drawOut: function(e){
			console.log(this.getType() + ' drawOut');

			this.drawCtx.clearRect(0, 0, this.drawCanvas.width, this.drawCanvas.height);
		},
		
		defaultStyle: {
			lineCap: 'round',
			lineJoin: 'bevel',
			lineWidth: 2,
			strokeStyle: 'black',
			fillStyle: 'red',			
		},
		drawForCheckPoint: function(ctx, canvas, drawPoints){
			var point = this.getPointSplit(drawPoints[0]);
			
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			
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
		}
	}
	$.pureCanvas.toolkit.addToolkit(CheckPoint);		
	
	/*******************************************************************************
	 * HighlightPoint
	 *******************************************************************************/
	var HighlightPoint = function(){
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
			console.log(this.getType() + ' drawStart');
			
			this.drawing(e);
		},
		drawing: function(e){
			console.log(this.getType() + ' drawing');
			
			var point = e.point;
			this.points[0] = point.org;
			this.pointsRate[0] = point.rate;
			
			this.drawForHighlightPoint(this.drawCtx, this.drawCanvas, this.points);
		},
		drawEnd: function(e){
			console.log(this.getType() + ' drawEnd');
			
			this.drawForHighlightPoint(this.drawTempCtx, this.drawTempCanvas, this.pointsRate);
			
			this.complateDraw({
				copyFrom: this.canvasInfo.drawTemp,
				copyTo: this.canvasInfo.mView,
				copyToPreClear: true,
				clear: [this.canvasInfo.draw, this.canvasInfo.drawTemp]
			});
			
			this.sendDrawData(this.points);
			
			this.points = [];
			this.pointsRate = [];
		},
		drawOut: function(e){
			console.log(this.getType() + ' drawOut');

			this.drawCtx.clearRect(0, 0, this.drawCanvas.width, this.drawCanvas.height);
		},
		
		defaultStyle: {
			lineCap: 'round',
			lineJoin: 'round',
			lineWidth: 3,
			strokeStyle: 'black',
			gradient0: 'rgba(250,120,120, 0.9)',
			gradient1: '#FF0000'
		},
		drawForHighlightPoint: function(ctx, canvas, drawPoints){
			var point = this.getPointSplit(drawPoints[0]);
			
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			
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
		}
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
	
		drawStart: function(e){
			console.log(this.getType() + ' drawStart');
			
			this.isDrawing = true;
			this.pointerMap.me = {style: this.toolkit.style, points: e.point.org}
			
			this.drawForMousePointer(this.canvasInfo.pointer.context, this.canvasInfo.pointer.canvas);
			
			if(this.setting.pointerDownSend && this.isDrawing){
				this.sendEvent([this.pointerMap.me.points]);
			}
		},
		drawing: function(e){
			console.log(this.getType() + ' drawing');
			
			this.pointerMap.me = {style: this.toolkit.style,points: e.point.org}
			
			this.drawForMousePointer(this.canvasInfo.pointer.context, this.canvasInfo.pointer.canvas);
			
			if((!this.setting.pointerDownSend)|| (this.setting.pointerDownSend && this.isDrawing)){
				this.sendEvent([this.pointerMap.me.points]);
			}
		},
		drawEnd: function(e){
			console.log(this.getType() + ' drawEnd');
			
			this.isDrawing = false;
			
			if(e.isTouch) this.pointerMap.me = null;
			
			this.drawForMousePointer(this.canvasInfo.pointer.context, this.canvasInfo.pointer.canvas);
			
			if(this.setting.pointerDownSend){
				this.sendEvent(null);
			}
		},
		drawOut: function(e){
			console.log(this.getType() + ' drawOut');
			
			this.pointerMap.me = null;				
			
			this.drawForMousePointer(this.canvasInfo.pointer.context, this.canvasInfo.pointer.canvas);
			
			if((!this.setting.pointerDownSend)|| (this.setting.pointerDownSend && this.isDrawing)){
				this.sendEvent(null);
			}
			
			this.isDrawing = false;
		},
		
		sendEvent: function(points){
			var THIS = this;
			
			clearTimeout(this.eventCaller);
			this.eventCaller = setTimeout(function(){
				THIS.sendDrawData(points);
			}, 7);
		},
		
		drawForMousePointer: function(ctx, canvas){
			var THIS = this;
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			
			$.each(this.pointerMap, function(key, data){
				if(!data){return;}
				
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