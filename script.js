document.addEventListener("DOMContentLoaded", function () {
    const curveCanvas = document.getElementById("curveCanvas");
    const curveCtx = curveCanvas.getContext("2d");
    const hodographCanvas = document.getElementById("hodographCanvas");
    const hodographCtx = hodographCanvas.getContext("2d");
    const slider = document.getElementById("t-slider");
    const tValueDisplay = document.getElementById("t-value");

    let controlPoints = [];
    let hodographCanvasPoints = [];
    let t = 0.5;
    let selectedPoint = null;

    slider.value = t;
    tValueDisplay.textContent = t.toFixed(2);

    slider.addEventListener("input", function () {
        t = parseFloat(slider.value);
        tValueDisplay.textContent = t.toFixed(2);
        draw();
    });

    curveCanvas.addEventListener("mousedown", function (event) {
        const { offsetX, offsetY } = event;
        if (event.button === 0) {
            if (!selectPoint(offsetX, offsetY)) {
                addPoint(offsetX, offsetY);
            }
        }
    });

    curveCanvas.addEventListener("contextmenu", function (event) {
        event.preventDefault();
        removePoint(event.offsetX, event.offsetY);
    });

    curveCanvas.addEventListener("mousemove", function (event) {
        if (selectedPoint) {
            selectedPoint.x = event.offsetX;
            selectedPoint.y = event.offsetY;
            draw();
        }
    });

    curveCanvas.addEventListener("mouseup", function () {
        selectedPoint = null;
    });

    function resizeCanvas() {
        curveCanvas.width = curveCanvas.clientWidth;
        curveCanvas.height = curveCanvas.clientHeight;
        hodographCanvas.width = hodographCanvas.clientWidth;
        hodographCanvas.height = hodographCanvas.clientHeight;
        draw();
    }
    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    function addPoint(x, y) {
        controlPoints.push({ x, y });
        draw();
    }

    function removePoint(x, y) {
        controlPoints = controlPoints.filter(p => Math.hypot(p.x - x, p.y - y) > 10);
        draw();
    }

    function selectPoint(x, y) {
        for (let p of controlPoints) {
            if (Math.hypot(p.x - x, p.y - y) < 10) {
                selectedPoint = p;
                return true;
            }
        }
        return false;
    }

    function bezierPoint(t, points) {
        if (points.length < 2) return points[0] || { x: 0, y: 0 };
        let temp = points.map(p => ({ x: p.x, y: p.y }));
        let n = temp.length - 1;
        for (let r = 1; r <= n; r++) {
            for (let i = 0; i <= n - r; i++) {
                temp[i].x = (1 - t) * temp[i].x + t * temp[i + 1].x;
                temp[i].y = (1 - t) * temp[i].y + t * temp[i + 1].y;
            }
        }
        return temp[0];
    }

    function drawBezierCurve(ctx, points) {
        if (points.length < 2) return;
        ctx.strokeStyle = "red";
        ctx.lineWidth = 2;
        ctx.beginPath();
        let start = bezierPoint(0, points);
        ctx.moveTo(start.x, start.y);
        for (let tVal = 0; tVal <= 1; tVal += 0.01) {
            let p = bezierPoint(tVal, points);
            ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
    }

    function drawConnections(ctx, points) {
        if (points.length < 2) return;
        ctx.strokeStyle = "blue";
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.stroke();
    }

    function drawPoints(ctx, points, color) {
        ctx.fillStyle = color;
        for (let p of points) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 5, 0, 2 * Math.PI);
            ctx.fill();
        }
    }

    function drawGreenLines(ctx, t, points) {
        if (points.length < 2) return;
        let temp = points.map(p => ({ x: p.x, y: p.y }));
        let n = temp.length - 1;
        ctx.strokeStyle = "green";
        ctx.lineWidth = 1;
        for (let r = 1; r <= n; r++) {
            ctx.beginPath();
            for (let i = 0; i < n - r + 1; i++) {
                let midX = (1 - t) * temp[i].x + t * temp[i + 1].x;
                let midY = (1 - t) * temp[i].y + t * temp[i + 1].y;
                temp[i].x = midX;
                temp[i].y = midY;
                if (i > 0) ctx.lineTo(temp[i].x, temp[i].y);
                else ctx.moveTo(temp[i].x, temp[i].y);
            }
            ctx.stroke();
        }
    }

    function drawMovingPoint(ctx, points) {
        if (points.length < 2) return;
        let p = bezierPoint(t, points);
        ctx.fillStyle = "green";
        ctx.beginPath();
        ctx.arc(p.x, p.y, 6, 0, 2 * Math.PI);
        ctx.fill();
        drawGreenLines(ctx, t, points);
    }

    const radius = 4;
    function point(x, y) {
        this.x = x;
        this.y = y;
    }

    function hCenterPoint() {
        var x = hodographCanvas.width / 2;
        var y = hodographCanvas.height / 2;
        return new point(x, y);
    }

    function computeHodographCanvasPoint(i) {
        var cent = hCenterPoint();
        var a = controlPoints[i];
        var b = controlPoints[i - 1];
        var x = cent.x + a.x - b.x;
        var y = cent.y + a.y - b.y;
        return new point(x, y);
    }

    function rehodographCanvas() {
        hodographCanvasPoints = [];
        for (var i = 1; i < controlPoints.length; i++) {
            hodographCanvasPoints.push(computeHodographCanvasPoint(i));
        }
    }

    function hDrawControlPoint(context, pt, color) {
        context.beginPath();
        context.arc(pt.x, pt.y, radius, 0, 2 * Math.PI, false);
        context.lineWidth = 2;
        context.fillStyle = color;
        context.fill();
        context.strokeStyle = color;
        context.stroke();
    }

    function hDrawControlPoints(context, points, color) {
        for (var i = 0; i < points.length; i++) {
            hDrawControlPoint(context, points[i], color);
        }
    }

    function hConnectControlPoints(context, points) {
        if (points.length === 0) return;
        var cent = hCenterPoint();
        context.beginPath();
        context.strokeStyle = "gray";
        context.lineWidth = 1;
        for (var i = 0; i < points.length - 1; i++) {
            context.moveTo(points[i].x, points[i].y);
            context.lineTo(points[i + 1].x, points[i + 1].y);
            context.stroke();
            context.moveTo(cent.x, cent.y);
            context.lineTo(points[i].x, points[i].y);
            context.stroke();
        }

        if (points.length > 0) {
            context.moveTo(cent.x, cent.y);
            context.lineTo(points[points.length - 1].x, points[points.length - 1].y);
            context.stroke();
        }
    }

    function hDrawHodographCurve(context, points) {
        if (points.length === 0) return;
        context.strokeStyle = "orange";
        for (var tVal = 0; tVal < 1; tVal += 0.001) {
            var pt = bezierPoint(tVal, points);
            context.strokeRect(pt.x, pt.y, 1, 1);
        }
        hConnectControlPoints(context, points);
    }


    function draw() {
        curveCtx.clearRect(0, 0, curveCanvas.width, curveCanvas.height);
        hodographCtx.clearRect(0, 0, hodographCanvas.width, hodographCanvas.height);

        drawConnections(curveCtx, controlPoints);
        drawBezierCurve(curveCtx, controlPoints);
        drawPoints(curveCtx, controlPoints, "blue");
        drawMovingPoint(curveCtx, controlPoints);

        rehodographCanvas();
        hDrawHodographCurve(hodographCtx, hodographCanvasPoints);
        hDrawControlPoints(hodographCtx, hodographCanvasPoints, "orange");
        hDrawControlPoint(hodographCtx, hCenterPoint(), "orange");
    }
});
