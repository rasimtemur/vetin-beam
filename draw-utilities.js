// common/draw-utilities.js

function drawGrid(context, width, height) {
    const gridSize = parseInt(gridSizeInput.value);
    context.beginPath();
    context.strokeStyle = COLORS.GRID;
    context.lineWidth = 1;

    for (let x = 0; x <= width; x += gridSize) {
        context.moveTo(x, 0);
        context.lineTo(x, height);
    }

    for (let y = 0; y <= height; y += gridSize) {
        context.moveTo(0, y);
        context.lineTo(width, y);
    }

    context.stroke();
}

// YENİ: Kullanıcının ilk tıkladığı noktayı göstermek için bir işaretçi çizer.
function drawTapIndicator(context, point) {
    if (!point) return;
    context.save();
    context.fillStyle = 'rgba(0, 122, 255, 0.8)';
    context.strokeStyle = 'white';
    context.lineWidth = 1;
    const size = 10;
    context.beginPath();
    context.arc(point.x, point.y, size / 2, 0, Math.PI * 2);
    context.fill();
    context.stroke();
    context.restore();
}

function drawResizeHandles(context) {
    if (!beam) return;
    const handleSize = 8;
    const gridSize = parseInt(gridSizeInput.value);
    const kNPerGrid = parseFloat(kNPerGridInput.value) || 1;
    const pixelsPerKN = gridSize / kNPerGrid;
    const beamTopY = beam.startY - (gridSize / 2);

    context.fillStyle = 'rgba(0, 122, 255, 0.8)';
    context.strokeStyle = 'white';
    context.lineWidth = 1;

    context.fillRect(beam.startX - handleSize / 2, beam.startY - handleSize / 2, handleSize, handleSize);
    context.strokeRect(beam.startX - handleSize / 2, beam.startY - handleSize / 2, handleSize, handleSize);
    context.fillRect(beam.endX - handleSize / 2, beam.startY - handleSize / 2, handleSize, handleSize);
    context.strokeRect(beam.endX - handleSize / 2, beam.startY - handleSize / 2, handleSize, handleSize);

    distributedLoads.forEach(load => {
        const loadHeight = Math.abs(load.magnitude) * pixelsPerKN;
        const y_pos = (load.magnitude < 0) ? beamTopY - loadHeight : beamTopY + loadHeight;
        
        context.fillRect(load.startX - handleSize / 2, y_pos - handleSize / 2, handleSize, handleSize);
        context.strokeRect(load.startX - handleSize / 2, y_pos - handleSize / 2, handleSize, handleSize);
        context.fillRect(load.endX - handleSize / 2, y_pos - handleSize / 2, handleSize, handleSize);
        context.strokeRect(load.endX - handleSize / 2, y_pos - handleSize / 2, handleSize, handleSize);
    });

    trapezoidalLoads.forEach(load => {
        const h1 = Math.abs(load.startMagnitude) * pixelsPerKN;
        const h2 = Math.abs(load.endMagnitude) * pixelsPerKN;
        const y1_pos = (load.startMagnitude < 0) ? beamTopY - h1 : beamTopY + h1;
        const y2_pos = (load.endMagnitude < 0) ? beamTopY - h2 : beamTopY + h2;

        context.fillRect(load.startX - handleSize / 2, y1_pos - handleSize / 2, handleSize, handleSize);
        context.strokeRect(load.startX - handleSize / 2, y1_pos - handleSize / 2, handleSize, handleSize);
        context.fillRect(load.endX - handleSize / 2, y2_pos - handleSize / 2, handleSize, handleSize);
        context.strokeRect(load.endX - handleSize / 2, y2_pos - handleSize / 2, handleSize, handleSize);
    });
}
    
function drawDimensions(context, y_pos) {
    if (!beam) return;
    const { toMeters } = getConversionFunctions();
    
    // --- YENİ KOD ---
    let points = [beam.startX, beam.endX];
    supports.forEach(s => points.push(s.x));
    hinges.forEach(h => points.push(h.x));
    concentratedLoads.forEach(l => points.push(l.x));
    distributedLoads.forEach(l => {
        points.push(l.startX);
        points.push(l.endX);
    });
    trapezoidalLoads.forEach(l => {
        points.push(l.startX);
        points.push(l.endX);
    });
    // EKLENEN SATIRLAR
    concentratedMoments.forEach(m => points.push(m.x)); 
    torsionMoments.forEach(t => points.push(t.x));
    // EKLENEN SATIRLARIN SONU

    const sortedPoints = [...new Set(points)].sort((a,b)=>a-b);
    context.save();
    context.strokeStyle=COLORS.DIMENSION;
    context.fillStyle=COLORS.DIMENSION;
    context.lineWidth=1;
    context.font='12px Arial';
    context.textAlign='center';
    context.textBaseline='top';
    
    // Parçalı Boyutları Çiz
    for (let i = 0; i < sortedPoints.length - 1; i++) {
        const p1=sortedPoints[i];
        const p2=sortedPoints[i+1];
        if(p2-p1<EPSILON) continue;
        context.beginPath();
        context.moveTo(p1, y_pos-10);
        context.lineTo(p1, y_pos+10);
        context.stroke();
        context.beginPath();
        context.moveTo(p2, y_pos-10);
        context.lineTo(p2, y_pos+10);
        context.stroke();
        context.beginPath();

        context.moveTo(p1, y_pos);
        context.lineTo(p2, y_pos);
        context.stroke();
        const lengthInMeters = toMeters(p2) - toMeters(p1);
        context.fillText(lengthInMeters.toFixed(2) + " m", (p1+p2)/2, y_pos+5);
    }

    // --- YENİ EKLENDİ: Toplam boyut çizgisini sadece gerekliyse çiz ---
    // Eğer parçalı boyut çizgisi birden fazla bölümden oluşuyorsa
    // (yani kiriş başlangıç ve bitişi dışında ara noktalar varsa),
    // o zaman toplam uzunluk çizgisini de çiz.
    if (sortedPoints.length > 2) {
        const gridSize = parseInt(gridSizeInput.value) || 20;
        const totalLengthY = y_pos + (2 * gridSize);
        const beamStart = beam.startX;
        const beamEnd = beam.endX;

        // Başlangıç ve bitiş için dikey uzatma çizgileri
        context.beginPath();
        context.moveTo(beamStart, y_pos + 10); 
        context.lineTo(beamStart, y_pos - 10);
        context.stroke();

        context.beginPath();
        context.moveTo(beamEnd, y_pos + 10);
        context.lineTo(beamEnd, y_pos - 10);
        context.stroke();
        
        const tickHeight = gridSize / 2;
        // Bu kısım artık gereksiz, çünkü yukarıdaki uzun çizgiler bu işi görüyor.
        // İsterseniz estetik olarak kalabilir veya silebilirsiniz. Şimdilik yorum satırı yapıyorum.
        
        context.beginPath();
        context.moveTo(beamStart, totalLengthY - tickHeight);
        context.lineTo(beamStart, totalLengthY + tickHeight);
        context.stroke();

        context.beginPath();
        context.moveTo(beamEnd, totalLengthY - tickHeight);
        context.lineTo(beamEnd, totalLengthY + tickHeight);
        context.stroke();
        
        // Toplam uzunluk için yatay çizgi
        context.beginPath();
        context.moveTo(beamStart, totalLengthY);
        context.lineTo(beamEnd, totalLengthY);
        context.stroke();

        // Toplam uzunluk metni
        const totalLengthInMeters = toMeters(beamEnd) - toMeters(beamStart);
        context.fillText(totalLengthInMeters.toFixed(2) + " m", (beamStart + beamEnd) / 2, totalLengthY + 5);
    }
    // --- YENİ KOŞUL BİTTİ ---

    context.restore();
}

function drawPreviewDimension(context, previewX_px, allPoints_px, y_pos) {
    const gridSize = parseInt(gridSizeInput.value);
    const metersPerGrid = parseFloat(metersPerGridInput.value) || 1;

    const pointsWithPreview = [...new Set([...allPoints_px, previewX_px])].sort((a, b) => a - b);
    const previewIndex = pointsWithPreview.indexOf(previewX_px);

    context.save();
    context.strokeStyle = COLORS.PREVIEW;
    context.fillStyle = COLORS.PREVIEW;
    context.lineWidth = 1;
    context.font = '12px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'top';
    context.setLineDash([2, 3]);

    const drawTick = (x) => {
        context.beginPath();
        context.moveTo(x, y_pos - 10);
        context.lineTo(x, y_pos + 10);
        context.stroke();
    };
    
    drawTick(previewX_px);

    const pixelsToMeters = (px) => (px / gridSize) * metersPerGrid;

    if (previewIndex > 0) {
        const prevPointX = pointsWithPreview[previewIndex - 1];
        drawTick(prevPointX);
        
        if (previewX_px - prevPointX > EPSILON) {
            context.beginPath();
            context.moveTo(prevPointX, y_pos);
            context.lineTo(previewX_px, y_pos);
            context.stroke();
            const lengthInMeters = pixelsToMeters(previewX_px - prevPointX);
            context.fillText(lengthInMeters.toFixed(2) + " m", (prevPointX + previewX_px) / 2, y_pos + 5);
        }
    }

    if (previewIndex < pointsWithPreview.length - 1) {
        const nextPointX = pointsWithPreview[previewIndex + 1];
        drawTick(nextPointX);
        
        if (nextPointX - previewX_px > EPSILON) {
            context.beginPath();
            context.moveTo(previewX_px, y_pos);
            context.lineTo(nextPointX, y_pos);
            context.stroke();
            const lengthInMeters = pixelsToMeters(nextPointX - previewX_px);
            context.fillText(lengthInMeters.toFixed(2) + " m", (previewX_px + nextPointX) / 2, y_pos + 5);
        }
    }
    
    context.restore();
}