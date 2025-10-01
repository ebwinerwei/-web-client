export const drawPolygon = (canvasId, options) => {
  // Default options
  var defaultOptions = {
    strokeStyle: 'rgba(102,168,255,1)',
    lineWidth: 4,
    fillColor: 'rgba(161,195,255,0.5)',
    pointRadius: 8,
  };
  options = Object.assign({}, defaultOptions, options);

  var canvas = document.getElementById(canvasId);
  var ctx = canvas.getContext('2d');
  var points = [];
  var isDrawing = false;
  var isDraggingPoint = false;
  var isDraggingPolygon = false;
  var hoverIndex = -1;
  var dragStartX = 0;
  var dragStartY = 0;

  // Event listeners
  canvas.addEventListener('mousedown', handleMouseDown);
  canvas.addEventListener('mousemove', handleMouseMove);
  canvas.addEventListener('mouseup', handleMouseUp);

  function handleMouseDown(event) {
    var mouseX = event.offsetX;
    var mouseY = event.offsetY;

    if (!isDrawing) {
      // Check if clicked on a point
      for (var i = 0; i < points.length; i++) {
        var dx = mouseX - points[i].x;
        var dy = mouseY - points[i].y;
        if (dx * dx + dy * dy < options.pointRadius * options.pointRadius) {
          isDraggingPoint = true;
          hoverIndex = i;
          return;
        }
      }
      // Check if clicked inside the polygon
      if (isPointInPolygon(mouseX, mouseY)) {
        isDraggingPolygon = true;
        dragStartX = mouseX;
        dragStartY = mouseY;
        return;
      }
    }

    isDrawing = true;
    points.push({ x: mouseX, y: mouseY });
    draw();
  }

  function handleMouseMove(event) {
    var mouseX = event.offsetX;
    var mouseY = event.offsetY;

    if (isDrawing) {
      draw(event);
    } else if (isDraggingPoint) {
      points[hoverIndex] = { x: mouseX, y: mouseY };
      draw();
    } else if (isDraggingPolygon) {
      var dx = mouseX - dragStartX;
      var dy = mouseY - dragStartY;
      for (var i = 0; i < points.length; i++) {
        points[i].x += dx;
        points[i].y += dy;
      }
      draw();
      dragStartX = mouseX;
      dragStartY = mouseY;
    } else {
      hoverIndex = -1;
      for (var i = 0; i < points.length; i++) {
        var dx = mouseX - points[i].x;
        var dy = mouseY - points[i].y;
        if (dx * dx + dy * dy < options.pointRadius * options.pointRadius) {
          hoverIndex = i;
          canvas.style.cursor = 'pointer';
          return;
        } else {
          canvas.style.cursor = 'default';
        }
      }
    }
  }

  function handleMouseUp(event) {
    isDrawing = false;
    isDraggingPoint = false;
    isDraggingPolygon = false;
  }

  function draw(event) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = options.strokeStyle;
    ctx.lineWidth = options.lineWidth;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (var i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    if (isDrawing && event) {
      ctx.lineTo(event.offsetX, event.offsetY);
    }
    ctx.closePath();
    ctx.fillStyle = options.fillColor;
    ctx.fill();
    ctx.stroke();

    drawPoints();
  }

  function drawPoints() {
    for (var i = 0; i < points.length; i++) {
      ctx.beginPath();
      ctx.arc(points[i].x, points[i].y, options.pointRadius, 0, Math.PI * 2);
      ctx.fillStyle = i === hoverIndex ? options.fillStyle : options.fillStyle;
      ctx.fill();
    }
  }

  function isPointInPolygon(x, y) {
    var inside = false;
    for (var i = 0, j = points.length - 1; i < points.length; j = i++) {
      var xi = points[i].x,
        yi = points[i].y;
      var xj = points[j].x,
        yj = points[j].y;
      var intersect = yi > y != yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }
    return inside;
  }

  function drawPolygonFromPoints(fillColor) {
    if (!points?.[0]?.x) {
      return;
    }
    // 找到最小和最大的 x 和 y 坐标，以便设置 canvas 尺寸
    var minX = points[0].x,
      maxX = points[0].x,
      minY = points[0].y,
      maxY = points[0].y;
    for (var i = 1; i < points.length; i++) {
      var point = points[i];
      minX = Math.min(minX, point.x);
      maxX = Math.max(maxX, point.x);
      minY = Math.min(minY, point.y);
      maxY = Math.max(maxY, point.y);
    }

    // 这边使用全覆盖
    minX = 0;
    minY = 0;
    maxX = canvas.width;
    maxY = canvas.height;

    // 计算 canvas 尺寸并创建 canvas 元素
    var canvasWidth = canvas.width; //maxX - minX + 1;
    var canvasHeight = canvas.height; //maxY - minY + 1;
    var canvas2 = document.createElement('canvas');
    canvas2.width = canvasWidth;
    canvas2.height = canvasHeight;
    var ctx = canvas2.getContext('2d');

    // 绘制多边形
    ctx.beginPath();
    ctx.moveTo(points[0].x - minX, points[0].y - minY);
    for (var i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x - minX, points[i].y - minY);
    }
    ctx.closePath();

    // 填充多边形区域
    ctx.fillStyle = fillColor;
    ctx.fill();

    return canvas2;
  }

  return {
    clear: function () {
      points = [];
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    },
    getPoints: function () {
      return points;
    },
    drawPolygonFromPoints: function (fillColor) {
      return drawPolygonFromPoints(fillColor);
    },
  };
};
