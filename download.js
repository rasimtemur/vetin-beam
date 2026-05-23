// common/download.js

// === GÜNCELLENMİŞ GENEL YARDIMCI: "Farklı Kaydet" Penceresi Kullanır ===

/**
 * Kullanıcıya "Farklı Kaydet" penceresi göstererek içerik indirmeyi tetikler.
 * Modern tarayıcılarda çalışır.
 * @param {string} content - Dosyanın içeriği.
 * @param {string} filename - Varsayılan dosya adı.
 * @param {string} mimeType - Dosyanın MIME türü.
 * @param {string} extension - Dosya uzantısı (örn: '.svg', '.json').
 */
async function triggerDownload(content, filename, mimeType, extension) {
    // 1. Modern File System Access API'sini dene
    if ('showSaveFilePicker' in window) {
        try {
            const handle = await window.showSaveFilePicker({
                suggestedName: filename,
                types: [{
                    description: 'Dosya',
                    accept: { [mimeType]: [extension] },
                }],
            });
            const writable = await handle.createWritable();
            await writable.write(content);
            await writable.close();
            return;
        } catch (err) {
            // Kullanıcı "İptal" butonuna basarsa hata oluşur, bunu yoksay.
            if (err.name !== 'AbortError') {
                console.error(err.name, err.message);
            }
            return;
        }
    }

    // 2. Eski (Fallback) Yöntem: API desteklenmiyorsa veya hata verirse
    // Bu yöntem dosyayı direkt "İndirilenler" klasörüne kaydeder.
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// === PNG TABANLI İNDİRME FONKSİYONU (DİYAGRAMLAR İÇİN) ===

async function downloadCanvasAsPngInSvg(canvasElement, filename) {
    if (!canvasElement) {
        console.error("İndirilecek canvas elementi bulunamadı:", filename);
        return;
    }
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    const scaleFactor = 2;
    tempCanvas.width = canvasElement.clientWidth * scaleFactor;
    tempCanvas.height = canvasElement.clientHeight * scaleFactor;
    tempCtx.fillStyle = 'white';
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    tempCtx.drawImage(canvasElement, 0, 0, tempCanvas.width, tempCanvas.height);
    
    // Modern API için Blob oluştur
    tempCanvas.toBlob(async (blob) => {
        if ('showSaveFilePicker' in window) {
            try {
                const handle = await window.showSaveFilePicker({
                    suggestedName: filename,
                    types: [{
                        description: 'PNG Dosyası',
                        accept: { 'image/png': ['.png'] },
                    }],
                });
                const writable = await handle.createWritable();
                await writable.write(blob);
                await writable.close();
            } catch (err) {
                if (err.name !== 'AbortError') console.error(err.name, err.message);
            }
        } else {
            // Fallback: Eski yöntemle indir
            const dataUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = dataUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(dataUrl);
        }
    }, 'image/png');
}


// === GERÇEK VEKTÖREL SVG OLUŞTURMA FONKSİYONLARI ===
// Bu yardımcı fonksiyonlarda değişiklik yok.
const drawBeamSVG = (beam, yPos) => `<rect x="${beam.startX}" y="${yPos - 10}" width="${beam.endX - beam.startX}" height="20" fill="${COLORS.BEAM_FILL}" stroke="${COLORS.BEAM_STROKE}" stroke-width="2" />`;
const drawHingeSVG = (hinge, yPos) => `<circle cx="${hinge.x}" cy="${yPos}" r="6" fill="white" stroke="${COLORS.SUPPORT}" stroke-width="2" />`;

const drawSupportSVG = (support, yPos) => {
    const { type, x } = support;
    const h = 20;
    const y_bottom = yPos + h / 2;
    let paths = '';
    if (type === 'pin-support') {
        paths = `<path d="M ${x} ${y_bottom} L ${x - 15} ${y_bottom + 15} L ${x + 15} ${y_bottom + 15} Z" />`;
        for (let i = -15; i <= 15; i += 6) { paths += `<path d="M ${i + x - 3} ${y_bottom + 20} L ${i + x + 3} ${y_bottom + 15}" />`; }
    } else if (type === 'roller-support') {
        paths = `<path d="M ${x} ${y_bottom} L ${x - 15} ${y_bottom + 15} L ${x + 15} ${y_bottom + 15} Z" />`;
        for (let i = -12; i <= 12; i += 6) { paths += `<circle cx="${x + i}" cy="${y_bottom + 20}" r="3" stroke="${COLORS.SUPPORT}" fill="none" stroke-width="2" />`; }
    } else if (type === 'fixed-support') {
        const supportHeight = h * 3, topY = yPos - supportHeight / 2, bottomY = yPos + supportHeight / 2;
        let lineDirection = (beam && x > beam.startX + (beam.endX - beam.startX) / 2) ? 10 : -10;
        paths = `<path d="M ${x} ${topY} L ${x} ${bottomY}" />`;
        for (let i = topY; i <= bottomY; i += 8) { paths += `<path d="M ${x} ${i} L ${x + lineDirection} ${i + 10}" />`; }
    }
    return `<g stroke="${COLORS.SUPPORT}" fill="none" stroke-width="2">${paths}</g>`;
};
const drawConcentratedLoadSVG = (load) => {
    const { x, y, magnitude, angle = Math.PI / 2 } = load;
    const lineLength = 50, mag = (magnitude >= 0) ? 1 : -1;
    const startX = (mag >= 0) ? x : x + lineLength * Math.cos(angle), startY = (mag >= 0) ? y : y + lineLength * Math.sin(angle);
    const endX = (mag >= 0) ? x + lineLength * Math.cos(angle) : x, endY = (mag >= 0) ? y + lineLength * Math.sin(angle) : y;
    const effectiveAngle = (mag >= 0) ? angle : angle + Math.PI, angleDeg = effectiveAngle * 180 / Math.PI;
    const line = `<path d="M ${startX} ${startY} L ${endX} ${endY}" />`;
    const arrowhead = `<path d="M 0 0 L -10 -5 M 0 0 L -10 5" transform="translate(${endX}, ${endY}) rotate(${angleDeg})" />`;
    const text = `<text x="${(startX + endX) / 2}" y="${Math.min(startY, endY) - 5}" text-anchor="middle" font-family="Arial" font-size="12px" fill="${COLORS.LOAD}">${Math.abs(magnitude).toFixed(1)} kN</text>`;
    return `<g stroke="${COLORS.LOAD}" fill="none" stroke-width="2">${line}${arrowhead}</g>${text}`;
};
const drawDistributedLoadSVG = (load, yPos) => {
    const y_base = yPos - 10;
    const pixelsPerKN = 10;
    const loadHeight = Math.abs(load.magnitude) * pixelsPerKN;
    const y_top = (load.magnitude < 0) ? y_base - loadHeight : y_base + loadHeight;
    const startX = Math.min(load.startX, load.endX), endX = Math.max(load.startX, load.endX);
    const loadLength = endX - startX;
    const totalArrows = Math.max(2, Math.floor(loadLength / 30) + 1);
    const actualSpacing = loadLength > 0 ? loadLength / (totalArrows - 1) : 0;
    let arrows = '';
    for (let i = 0; i < totalArrows; i++) {
        const x = startX + i * actualSpacing;
        const arrowTip = (load.magnitude < 0) ? `L ${x-4} ${y_base-8} M ${x} ${y_base} L ${x+4} ${y_base-8}` : `L ${x-4} ${y_base+8} M ${x} ${y_base} L ${x+4} ${y_base+8}`;
        arrows += `<path d="M ${x} ${y_top} L ${x} ${y_base} ${arrowTip}" />`;
    }
    const top_line = `<path d="M ${startX} ${y_top} L ${endX} ${y_top}" />`;
    const text_y = (load.magnitude < 0) ? y_top - 5 : y_top + 15;
    const text = `<text x="${(startX + endX) / 2}" y="${text_y}" text-anchor="middle" font-family="Arial" font-size="12px" fill="${COLORS.LOAD}">${Math.abs(load.magnitude).toFixed(2)} kN/m</text>`;
    return `<g stroke="${COLORS.LOAD}" fill="none" stroke-width="2">${top_line}${arrows}</g>${text}`;
};
const drawConcentratedMomentSVG = (moment, color = COLORS.LOAD) => {
    const { x, y, magnitude } = moment;
    const radius = 20, isClockwise = magnitude < 0;
    const startAngle = isClockwise ? -0.4 * Math.PI : 0.4 * Math.PI, endAngle = isClockwise ? 0.6 * Math.PI : -0.6 * Math.PI;
    const largeArcFlag = 0, sweepFlag = isClockwise ? 0 : 1;
    const startX = x + radius * Math.cos(startAngle), startY = y + radius * Math.sin(startAngle);
    const endX = x + radius * Math.cos(endAngle), endY = y + radius * Math.sin(endAngle);
    const arc = `<path d="M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} ${sweepFlag} ${endX} ${endY}" />`;
    let arrowhead;
    if(isClockwise) { arrowhead = `<path d="M ${endX} ${endY} L ${endX - 8} ${endY + 5} M ${endX} ${endY} L ${endX - 2} ${endY - 8}" />`; } 
    else { arrowhead = `<path d="M ${endX} ${endY} L ${endX - 8} ${endY - 5} M ${endX} ${endY} L ${endX - 2} ${endY + 8}" />`; }
    const text = `<text x="${x}" y="${y - radius - 5}" text-anchor="middle" font-family="Arial" font-size="12px" fill="${color}">${Math.abs(magnitude).toFixed(2)} kNm</text>`;
    const centerDot = `<circle cx="${x}" cy="${y}" r="4" fill="white" stroke="${color}" stroke-width="2" />`;
    return `<g stroke="${color}" fill="none" stroke-width="2">${arc}${arrowhead}</g>${text}${centerDot}`;
};
const drawTrapezoidalLoadSVG = (load, yPos) => {
    const y_base = yPos - 10;
    const pixelsPerKN = 10;
    const startX = Math.min(load.startX, load.endX), endX = Math.max(load.startX, load.endX);
    const h1 = Math.abs(load.startMagnitude) * pixelsPerKN, h2 = Math.abs(load.endMagnitude) * pixelsPerKN;
    const y1_top = (load.startMagnitude < 0) ? y_base - h1 : y_base + h1;
    const y2_top = (load.endMagnitude < 0) ? y_base - h2 : y_base + h2;
    const top_line = `<path d="M ${startX} ${y1_top} L ${endX} ${y2_top}" />`;
    let arrows = '';
    const loadLength = endX - startX, totalArrows = Math.max(2, Math.floor(loadLength / 30) + 1);
    const actualSpacing = loadLength > 0 ? loadLength / (totalArrows - 1) : 0;
    for (let i = 0; i < totalArrows; i++) {
        const x = startX + i * actualSpacing;
        const ratio = loadLength > 0 ? (x - startX) / loadLength : 0;
        const currentH = h1 + (h2 - h1) * ratio;
        const currentMag = load.startMagnitude + (load.endMagnitude - load.startMagnitude) * ratio;
        const y_top_current = (currentMag < 0) ? y_base - currentH : y_base + currentH;
        const arrowTip = (currentMag < 0) ? `L ${x-4} ${y_base-8} M ${x} ${y_base} L ${x+4} ${y_base-8}` : `L ${x-4} ${y_base+8} M ${x} ${y_base} L ${x+4} ${y_base+8}`;
        arrows += `<path d="M ${x} ${y_top_current} L ${x} ${y_base} ${arrowTip}" />`;
    }
    const text1 = `<text x="${startX}" y="${(load.startMagnitude < 0) ? y1_top - 5 : y1_top + 15}" text-anchor="middle" font-family="Arial" font-size="12px" fill="${COLORS.LOAD}">${Math.abs(load.startMagnitude).toFixed(2)} kN/m</text>`;
    const text2 = `<text x="${endX}" y="${(load.endMagnitude < 0) ? y2_top - 5 : y2_top + 15}" text-anchor="middle" font-family="Arial" font-size="12px" fill="${COLORS.LOAD}">${Math.abs(load.endMagnitude).toFixed(2)} kN/m</text>`;
    return `<g stroke="${COLORS.LOAD}" fill="none" stroke-width="2">${top_line}${arrows}</g>${text1}${text2}`;
};
const drawTorsionMomentSVG = (moment) => {
    const { x, y, magnitude } = moment;
    const isPositive = magnitude > 0;
    const lineLength = 60, color = COLORS.LOAD;
    let line, arrowhead, text;
    if (isPositive) {
        line = `<path d="M ${x} ${y} L ${x + lineLength} ${y}" />`;
        arrowhead = `<g transform="translate(${x + lineLength}, ${y})"><path d="M 0 0 L -10 -5 M 0 0 L -10 5" /><path d="M -5 0 L -15 -5 M -5 0 L -15 5" /></g>`;
        text = `<text x="${x + lineLength + 5}" y="${y}" alignment-baseline="middle" font-family="Arial" font-size="12px" fill="${color}">${Math.abs(magnitude)} kNm</text>`;
    } else {
        line = `<path d="M ${x} ${y} L ${x - lineLength} ${y}" />`;
        arrowhead = `<g transform="translate(${x - lineLength}, ${y})"><path d="M 0 0 L 10 -5 M 0 0 L 10 5" /><path d="M 5 0 L 15 -5 M 5 0 L 15 5" /></g>`;
        text = `<text x="${x - lineLength - 5}" y="${y}" text-anchor="end" alignment-baseline="middle" font-family="Arial" font-size="12px" fill="${color}">${Math.abs(magnitude)} kNm</text>`;
    }
    const centerDot = `<circle cx="${x}" cy="${y}" r="4" fill="white" stroke="${color}" stroke-width="2" />`;
    return `<g stroke="${color}" fill="none" stroke-width="2">${line}${arrowhead}</g>${text}${centerDot}`;
};
const drawReactionArrowSVG = (reaction, yPos) => {
    const { x, magnitude } = reaction;
    if (Math.abs(magnitude) < EPSILON) return '';
    const L = 40, T = 15, beamBottom = yPos + 10;
    const isUp = magnitude > 0;
    const startY = isUp ? beamBottom + L : beamBottom, targetY = isUp ? beamBottom : beamBottom + L;
    const textY = isUp ? startY + T : startY + T; 
    const tipOffset = isUp ? 10 : -10;
    const line = `<path d="M ${x} ${startY} L ${x} ${targetY}" />`;
    const arrowhead = `<path d="M ${x} ${targetY} L ${x - 5} ${targetY + tipOffset} M ${x} ${targetY} L ${x + 5} ${targetY + tipOffset}" />`;
    const text = `<text x="${x}" y="${textY}" text-anchor="middle" font-family="Arial" font-size="12px" fill="${COLORS.REACTION}">${Math.abs(magnitude).toFixed(2)} kN</text>`;
    return `<g stroke="${COLORS.REACTION}" fill="none" stroke-width="2">${line}${arrowhead}</g>${text}`;
};
const drawAxialReactionSVG = (reaction, yPos) => {
    const { x, magnitude } = reaction;
    if (Math.abs(magnitude) < EPSILON) return '';
    const L = 40, T = 5;
    const isRight = magnitude > 0;
    const startX = isRight ? x - L : x + L;
    const targetX = x;
    const textAnchor = isRight ? 'start' : 'end';
    const textX = isRight ? targetX + T : targetX - T;
    const tipOffset = isRight ? -10 : 10;
    const line = `<path d="M ${startX} ${yPos} L ${targetX} ${yPos}" />`;
    const arrowhead = `<path d="M ${targetX} ${yPos} L ${targetX + tipOffset} ${yPos - 5} M ${targetX} ${yPos} L ${targetX + tipOffset} ${yPos + 5}" />`;
    const text = `<text x="${textX}" y="${yPos}" text-anchor="${textAnchor}" alignment-baseline="middle" font-family="Arial" font-size="12px" fill="${COLORS.REACTION}">${Math.abs(magnitude).toFixed(2)} kN</text>`;
    return `<g stroke="${COLORS.REACTION}" fill="none" stroke-width="2">${line}${arrowhead}</g>${text}`;
};
const drawDimensionsSVG = (y_pos) => {
    if (!beam) return '';
    const { toMeters } = getConversionFunctions();
    let points = [
        beam.startX, beam.endX, 
        ...supports.map(s => s.x), 
        ...hinges.map(h => h.x), 
        ...concentratedLoads.map(l => l.x), 
        ...distributedLoads.flatMap(l => [l.startX, l.endX]), 
        ...trapezoidalLoads.flatMap(l => [l.startX, l.endX]),
        // EKLENEN SATIRLAR
        ...concentratedMoments.map(m => m.x),
        ...torsionMoments.map(t => t.x)
        // EKLENEN SATIRLARIN SONU
    ];
    const sortedPoints = [...new Set(points)].sort((a,b)=>a-b);
    let pathElements = '';
    let textElements = '';
    for (let i = 0; i < sortedPoints.length - 1; i++) {
        const p1=sortedPoints[i], p2=sortedPoints[i+1];
        if(p2-p1 < EPSILON) continue;
        pathElements += `<path d="M ${p1} ${y_pos-10} L ${p1} ${y_pos+10}" /><path d="M ${p2} ${y_pos-10} L ${p2} ${y_pos+10}" /><path d="M ${p1} ${y_pos} L ${p2} ${y_pos}" />`;
        const lengthInMeters = toMeters(p2) - toMeters(p1);
        textElements += `<text x="${(p1+p2)/2}" y="${y_pos+15}" text-anchor="middle" font-family="Arial" font-size="12px" fill="#000000">${lengthInMeters.toFixed(2)} m</text>`;
    }
    return `<g stroke="#000000" stroke-width="1">${pathElements}</g>${textElements}`;
};


function downloadDrawingAsTrueSvg(target, filename) {
    const canvasElement = (target === 'model') ? canvas : fbdCanvas;
    if (!canvasElement || !beam) return;
    const width = canvasElement.clientWidth, height = canvasElement.clientHeight;
    let svgElements = '';
    const yPos = (target === 'model') ? beam.startY : (height / 2 + 20);

    svgElements += drawBeamSVG(beam, yPos);
    if (target === 'model') { supports.forEach(s => svgElements += drawSupportSVG(s, yPos)); }
    hinges.forEach(h => svgElements += drawHingeSVG(h, yPos));
    concentratedLoads.forEach(l => svgElements += drawConcentratedLoadSVG(l));
    distributedLoads.forEach(l => svgElements += drawDistributedLoadSVG(l, yPos));
    trapezoidalLoads.forEach(l => svgElements += drawTrapezoidalLoadSVG(l, yPos));
    concentratedMoments.forEach(m => svgElements += drawConcentratedMomentSVG(m));
    torsionMoments.forEach(t => svgElements += drawTorsionMomentSVG(t));
    if (target === 'fbd' && calculatedReactions) {
        calculatedReactions.forEach(r => svgElements += drawReactionArrowSVG(r, yPos));
        if (calculatedMomentReaction && Math.abs(calculatedMomentReaction) > EPSILON) {
            const fixedSupport = supports.find(s => s.type === 'fixed-support');
            if (fixedSupport) {
                const momentReactionObject = { x: fixedSupport.x, y: yPos, magnitude: calculatedMomentReaction };
                svgElements += drawConcentratedMomentSVG(momentReactionObject, COLORS.REACTION);
            }
        }
        if (calculatedAxialReaction) {
            svgElements += drawAxialReactionSVG(calculatedAxialReaction, yPos);
        }
    }
    svgElements += drawDimensionsSVG(yPos + 80);
    const finalSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="white" />${svgElements}</svg>`;
    
    // Güncellenmiş indirme fonksiyonunu çağır
    triggerDownload(finalSvg, filename, 'image/svg+xml', '.svg');
}

// === JSON ve CSV İNDİRME FONKSİYONLARI ===

function downloadModelAsJson() {
    const projectData = {
        beam: beam,
        supports: supports,
        hinges: hinges,
        concentratedLoads: concentratedLoads,
        distributedLoads: distributedLoads,
        trapezoidalLoads: trapezoidalLoads,
        concentratedMoments: concentratedMoments,
        torsionMoments: torsionMoments,
        gridSettings: {
            metersPerGrid: metersPerGridInput.value,
            kNPerGrid: kNPerGridInput.value,
            gridSize: gridSizeInput.value
        }
    };
    const jsonContent = JSON.stringify(projectData, null, 2);
    triggerDownload(jsonContent, 'vetin_model.json', 'application/json', '.json');
    if (typeof getCurrentModelHash === 'function') {
        window.__lastSavedHash = getCurrentModelHash();
    }
}

function downloadTablesAsCsv(filename) {
    let csvContent = '';
    const visibleTables = document.querySelectorAll('.table-grid .table-wrapper:not(.hidden)');
    visibleTables.forEach(wrapper => { /* ... */ });
    
    triggerDownload(csvContent, filename, 'text/csv', '.csv');
}