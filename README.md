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
`.pureCanavs()`로 Canvas를 생성합니다. 
```javascript
$("#pureCanvas").pureCanvas(options);
```

## Kind of Toolkit Type
Type|설명
----|----
Cursor|일반 커서
HandCursor|스크롤을 움직일 수 있는 커서
Eraser|지우개
ClearAll|모두 지우기
BallPen|볼펜
Highlighter|형광펜(50% 투명도)
StraightLine|직선
Rectangle|사각형
Circle|원
Triangle|삼각형
CheckPoint|체크포인트
HighlightPoint|중요 포인트 (하나만 Draw 가능)
MousePointer|마우스포인터

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

#### setting
Method Name|설명
----|----|
authForDraw|그리기 권한 설정
pointerForDraw|마우스포인터 사용 권한 설정
pointerDownSend|마우스포인터 클릭 시 전송 여부 설정
backgroundImage|배경 이미지 설정
resizeType|확대/축소 타입 설정
scroll|스크롤 위치 변경

```javascript
// getter
$("#pureCanvas").pureCanvas('setting');
$("#pureCanvas").pureCanvas('setting', MethodName);

// setter
$("#pureCanvas").pureCanvas('setting', MethodName, value);
```

#### toolkit
Method Name|설명
----|----|
type|Toolkit Type 설정
lineWidth|선 굵기 설정
strokeStyle|선색 설정
fillStyle|채움 색 설정
draw|Draw Object 정보로 그리기

```javascript
// getter
$("#pureCanvas").pureCanvas('toolkit');
$("#pureCanvas").pureCanvas('toolkit', MethodName);

// setter
$("#pureCanvas").pureCanvas('toolkit', MethodName, value);
```

#### resize
Method Name|설명
----|----|
resize|Canvas 크기 조정

```javascript
$("#pureCanvas").pureCanvas('resize');
```

#### history
Method Name|return type|설명
----|----|----|
prev||Draw 취소(undo)
next||Draw 다시 실행(redo)
hasPrev|boolean|Draw 취소(undo) 가능 여부
hasNext|boolean|Draw 다시 실행(redo) 가능 여부

```javascript
$("#pureCanvas").pureCanvas('history', methodName);
```

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

