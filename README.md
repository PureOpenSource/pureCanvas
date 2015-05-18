# Pure Canvas
HTML5 Canvas API, JQuery

## 시작하기
js 파일을 추가합니다.
```html
<html>
	...
	<body>
		<div id="pureCanvas"></div>
		... 
		<script type="text/javascript" src="jquery.pureCanvas.js"></script>
	</body>
	...
</html>
```
`div` tag에 `.pureCanavs()` 
```javascript
$("#pureCanvas").pureCanvas(options);
```

## Options
PureCanvas를 생성 시 전달할 수 있다.

#### setting
옵션명|유형|기본값|설명
----|----|----|----|
authForDraw|boolean|true|그리기 권한
notAuthForDrawCursor|string|not-allowed|그리기 권한이 없는 경우 기본 커서 모양
pointerForDraw|boolean|true|마우스 포인트 사용 권한
pointerDownSend|boolean|true|마우스 포인트, 마우스 클릭 시 전송 여부
delayMousePoint|integer|5|마우스 포인트 전송 지연 시간(ms)
resizeType|string|page|Canvavs 크기 설정, page: 쪽맞춤, rate: 비율
rateVal|integer|1|화면 비율, 1 = 100%

```javascript
$("#pureCanvas").pureCanvas({
	setting: {
		authForDraw: false,
		notAuthForDrawCursor: 'none'
	}
});
```

#### toolkit
옵션명|유형|기본값|설명
----|----|----|----|
type|string|Cursor|Toolkit 타입
style.strokeStyle|string|rgba(0,0,0,100)|색상
style.fillStyle|string|rgba(0,0,0,100)|색상
style.lineWidth|string|5|선 크기

```javascript
$("#pureCanvas").pureCanvas({
	toolkit: {
		type: 'HandCursor'
		style: {
			lineWidth: 10
		}
	}
});
```

## Method


## Event
PureCanvas는 아래와 같은 이벤트를 제공합니다.

이벤트|설명
-----|-----
complate.draw.pureCanvas|Toolkit Draw 완료 후 호출
show.bg.pureCanvas|Background Image 출력 완료 후 호출
canvas-resize.pureCanvas|Background Image 변경 또는 resizeType, window size 변경 시 canvas resize 처리 완료 후 호출
scroll-move.pureCanvas|canvas scroll event 발생 시 호출
history.pureCanvas|history 관련 처리 완료 시 호출

```javascript
$("#pureCanvas").on('complate.draw.pureCanvas', function(e){
	//do something...
})
```

