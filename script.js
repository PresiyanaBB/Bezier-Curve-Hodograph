document.addEventListener("DOMContentLoaded", function () {
    const curveCanvas = document.getElementById("curveCanvas");
    const curveCtx = curveCanvas.getContext("2d");

    const slider = document.getElementById("t-slider");
    const tValueDisplay = document.getElementById("t-value");

    const hodographCanvas = document.getElementById("hodographCanvas");
    const hodographCtx = hodographCanvas.getContext("2d");

    let controlPoints = [];
    let t = 0.5; // Default value at center
    let selectedPoint = null;

    slider.value = t;
    tValueDisplay.textContent = t.toFixed(2);

    slider.addEventListener("input", function () {
        t = parseFloat(slider.value);
        tValueDisplay.textContent = t.toFixed(2);
        draw();
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

    curveCanvas.addEventListener("mousedown", function (event) {
        const { offsetX, offsetY } = event;
        if (event.button === 0) { // Left Click
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

    function computeHodograph(points) {
        if (points.length < 2) return [];

        let hodographPoints = [];
        for (let i = 0; i < points.length - 1; i++) {
            let x = (points.length - 1) * (points[i + 1].x - points[i].x);
            let y = (points.length - 1) * (points[i + 1].y - points[i].y);
            hodographPoints.push({ x, y });
        }
        return hodographPoints;
    }

    function drawBezierCurve(ctx, points) {
        if (points.length < 2) return;

        ctx.strokeStyle = "red";
        ctx.lineWidth = 2;
        ctx.beginPath();
        let start = bezierPoint(0, points);
        ctx.moveTo(start.x, start.y);
        for (let t = 0; t <= 1; t += 0.01) {
            let p = bezierPoint(t, points);
            ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
    }

    function drawHodograph(ctx, points) {
        if (points.length < 2) return;

        let hodographPoints = computeHodograph(points);
        let origin = { x: hodographCanvas.width / 2, y: hodographCanvas.height / 2 };

        // Find the bounds of the Hodograph points to scale them
        let minX = Math.min(...hodographPoints.map(p => p.x));
        let maxX = Math.max(...hodographPoints.map(p => p.x));
        let minY = Math.min(...hodographPoints.map(p => p.y));
        let maxY = Math.max(...hodographPoints.map(p => p.y));

        // Calculate scaling factors to fit within the canvas
        let scaleX = (hodographCanvas.width - 40) / (maxX - minX); // Padding to avoid touching canvas borders
        let scaleY = (hodographCanvas.height - 40) / (maxY - minY);

        // Apply scaling and translation
        ctx.strokeStyle = "orange";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(origin.x + (hodographPoints[0].x - minX) * scaleX, origin.y - (hodographPoints[0].y - minY) * scaleY);

        for (let i = 1; i < hodographPoints.length; i++) {
            let x = origin.x + (hodographPoints[i].x - minX) * scaleX;
            let y = origin.y - (hodographPoints[i].y - minY) * scaleY;
            ctx.lineTo(x, y);
        }

        ctx.stroke();

        ctx.fillStyle = "orange";
        hodographPoints.forEach(p => {
            let x = origin.x + (p.x - minX) * scaleX;
            let y = origin.y - (p.y - minY) * scaleY;
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, 2 * Math.PI);
            ctx.fill();
        });
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

    function draw() {
        curveCtx.clearRect(0, 0, curveCanvas.width, curveCanvas.height);
        hodographCtx.clearRect(0, 0, hodographCanvas.width, hodographCanvas.height);

        drawConnections(curveCtx, controlPoints);
        drawBezierCurve(curveCtx, controlPoints);
        drawPoints(curveCtx, controlPoints, "blue");
        drawHodograph(hodographCtx, controlPoints);
        drawMovingPoint(curveCtx, controlPoints);
    }
});
