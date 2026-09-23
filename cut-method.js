// cut-method.js - Kesim Yöntemi (ders anlatımı için etkileşimli kesit)
//
// "Kesim Yöntemi" butonu açıkken Yapısal Model ve SCD tuvallerine aynı
// hizada, fareyle/dokunarak sürüklenebilen düşey bir kesim çizgisi çizilir.
// Çizgi kirişi kesiyorsa:
//   - Çizginin sağında kalan tüm çizim unsurları grinin tonlarına çevrilir.
//   - SCD'de kesim noktasında, sol parça için sanki ankastre mesnet varmış
//     gibi mesnet tepkileri (N, V, M) hesaplanıp kesimin sağına çizilir.
//   - Kuvvet diyagramlarında (EKD, KKD, EMD, BMD) ve elastik eğride de aynı kesim çizgisi
//     gösterilir; sağ taraf griye döner, kesimdeki değer eğri üzerinde
//     işaretlenip yazılır. Çizgi diyagramlar üzerinden de sürüklenebilir.

let cutModeActive = false;
let cutPositionM = null;          // Kesim konumu (kiriş başlangıcından itibaren, m)
let isDraggingCut = false;
let lastFbdArgs = null;           // SCD'yi hesap yapmadan yeniden çizmek için son argümanlar

const CUT_COLOR = '#8e24aa';
const CUT_FORCE_COLOR = COLORS.FBD_REACTION; // Kesimdeki iç kuvvetler (N, V, M), mesnet tepkileriyle aynı
const CUT_HIT_TOLERANCE_PX = isTouchDevice ? 20 : 8;

// SCD tuvali masaüstünde kart dolgusunu telafi etmek için 20 px sola kaydırılarak
// çizilir (bkz. drawFreeBodyDiagram). Kesim çizgisi de aynı dönüşümü kullanır;
// böylece iki tuvaldeki çizgi, kirişlerle birlikte aynı hizada kalır.
function getFbdOffsetX() {
    return window.innerWidth > 800 ? 20 : 0;
}

function getCutPixelX() {
    if (!beam) return null;
    if (cutPositionM === null) {
        const { toMeters } = getConversionFunctions();
        cutPositionM = Math.round(toMeters(beam.endX) / 2 * 100) / 100;
    }
    return getConversionFunctions().toPixels(cutPositionM);
}

function setCutPixelX(px) {
    if (!beam) return;
    const { toMeters } = getConversionFunctions();
    cutPositionM = Math.round(toMeters(px) * 100) / 100;
}

function cutIntersectsBeam(cutX) {
    return beam && cutX > beam.startX + 0.5 && cutX < beam.endX - 0.5;
}

/**
 * Kesimin solunda kalan parçanın dengesinden, kesim noktasına konmuş hayali
 * ankastre mesnetin tepkileri. Yönler: Rx (+ sağa), Ry (+ yukarı),
 * Mz (+ saat yönü tersi). İç kuvvet işaretleri: N (+ çekme), V, M (+ pozitif
 * kesme / sehim momenti) — mevcut kesme ve moment diyagramlarıyla uyumludur.
 */
function computeCutReactions(cutX, allReactions, M_reaction, axialReaction) {
    const { toMeters } = getConversionFunctions();
    // Tam kesim noktasındaki tekil etki sağ parçaya bırakılır (sol limit).
    const x_m = toMeters(cutX) - 1e-6;

    const V = getShearAt(x_m, allReactions || [], toMeters);
    const M = getMomentAt(x_m, allReactions || [], M_reaction, toMeters);

    let leftHorizontal = 0;
    concentratedLoads.forEach(l => {
        if (toMeters(l.x) <= x_m) leftHorizontal += l.magnitude * Math.cos(l.angle);
    });
    if (axialReaction && toMeters(axialReaction.x) <= x_m) leftHorizontal += axialReaction.magnitude;

    return { Rx: -leftHorizontal, Ry: -V, Mz: M };
}

// --- Çizim yardımcıları ---

function grayOutRightOf(context, canvasEl, cssX, dpr = window.devicePixelRatio || 1) {
    const x0 = Math.max(0, Math.ceil(cssX * dpr));
    const w = canvasEl.width - x0;
    const h = canvasEl.height;
    if (w <= 0 || h <= 0) return;

    const isDarkMode = document.body.classList.contains('dark-mode');
    const bg = isDarkMode ? [15, 20, 25] : [255, 255, 255];
    // %80 şeffaflık: gri ton, düz arka planın üzerine 0.2 opaklıkla bindirilir
    const keep = 0.1;

    context.save();
    context.setTransform(1, 0, 0, 1, 0, 0);
    const img = context.getImageData(x0, 0, w, h);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
        const lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
        d[i]     = bg[0] + (lum - bg[0]) * keep;
        d[i + 1] = bg[1] + (lum - bg[1]) * keep;
        d[i + 2] = bg[2] + (lum - bg[2]) * keep;
    }
    context.putImageData(img, x0, 0);
    context.restore();
}

function drawCutLine(context, x, height) {
    const { toMeters } = getConversionFunctions();
    context.save();
    context.strokeStyle = CUT_COLOR;
    context.lineWidth = 2.5;
    context.setLineDash([10, 6]);
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, height);
    context.stroke();
    context.setLineDash([]);

    // Tutma işaretçileri (sürüklenebilir olduğunu belli etmek için)
    context.fillStyle = CUT_COLOR;
    [[0, 10], [height, height - 10]].forEach(([baseY, tipY]) => {
        context.beginPath();
        context.moveTo(x - 7, baseY);
        context.lineTo(x + 7, baseY);
        context.lineTo(x, tipY);
        context.closePath();
        context.fill();
    });

    drawCutLabel(context, `x = ${toMeters(x).toFixed(2)} m`, x + 10, 14, 'left');
    context.restore();
}

function drawCutLabel(context, text, x, y, align = 'left', color = CUT_COLOR) {
    context.save();
    context.font = 'bold 12px Arial';
    context.textAlign = align;
    context.textBaseline = 'middle';
    const w = context.measureText(text).width;
    const left = align === 'left' ? x - 3 : (align === 'right' ? x - w - 3 : x - w / 2 - 3);
    const isDarkMode = document.body.classList.contains('dark-mode');
    context.fillStyle = isDarkMode ? 'rgba(15, 20, 25, 0.85)' : 'rgba(255, 255, 255, 0.85)';
    context.fillRect(left, y - 9, w + 6, 18);
    context.fillStyle = color;
    context.fillText(text, x, y);
    context.restore();
}

function drawCutReactions(context, cutX, y_beam, r) {
    const halfH = getGridSize() / 2;
    const tiny = 0.005; // Etikette 0.00 görünen değerler için ok çizilmez
    const color = CUT_FORCE_COLOR;

    // Hayali ankastre mesnet sembolü: kesit yüzeyi
    context.save();
    context.strokeStyle = color;
    context.lineWidth = 3;
    context.beginPath();
    context.moveTo(cutX, y_beam - halfH - 4);
    context.lineTo(cutX, y_beam + halfH + 4);
    context.stroke();
    context.restore();

    // Düşey tepki (V): kesimin hemen sağında, kirişin altında
    const vx = cutX + 10;
    const L = 48;
    const beamBottom = y_beam + halfH;
    if (Math.abs(r.Ry) > tiny) {
        const isUp = r.Ry > 0;
        drawFilledArrow(context, vx, isUp ? beamBottom + L : beamBottom, vx, isUp ? beamBottom : beamBottom + L, color);
    }
    drawCutLabel(context, `V = ${Math.abs(r.Ry).toFixed(2)} kN`, vx + 10, beamBottom + L + 10, 'left', color);

    // Eksenel tepki (N): kiriş ekseni boyunca, kesimin sağında
    const hasAxial = Math.abs(r.Rx) > tiny || concentratedLoads.some(l => Math.abs(l.magnitude * Math.cos(l.angle)) > EPSILON);
    if (hasAxial) {
        const len = 60;
        if (Math.abs(r.Rx) > tiny) {
            const toRight = r.Rx > 0;
            drawFilledArrow(context, toRight ? cutX : cutX + len, y_beam, toRight ? cutX + len : cutX, y_beam, color);
        }
        drawCutLabel(context, `N = ${Math.abs(r.Rx).toFixed(2)} kN`, cutX + len + 8, y_beam, 'left', color);
    }

    // Moment tepkisi (M): kesimin sağında yay
    const rad = halfH + 24;
    const a = Math.PI / 3;
    if (Math.abs(r.Mz) > tiny) {
        // Mz > 0: ekranda saat yönü tersi
        if (r.Mz > 0) drawFilledArcArrow(context, cutX, y_beam, rad, a, -a, true, color);
        else drawFilledArcArrow(context, cutX, y_beam, rad, -a, a, false, color);
    }
    drawCutLabel(context, `M = ${Math.abs(r.Mz).toFixed(2)} kNm`, cutX + rad * Math.cos(a) + 8, y_beam - rad * Math.sin(a) - 12, 'left', color);
}

// SCD'de kiriş başından kesime kadar x mesafesini gösteren ok:
// solda düşey başlangıç çizgisi, ortasında "x = … m" yazan yatay ok.
function drawCutDistanceArrow(context, cutX, y_beam) {
    const { toMeters } = getConversionFunctions();
    const x0 = beam.startX;
    const y = Math.min(y_beam + 150, fbdCanvas.clientHeight - 18);
    const text = `x = ${toMeters(cutX).toFixed(2)} m`;

    // Ölçü oku rengi (karanlık modda okunabilirlik için açık gri)
    const color = document.body.classList.contains('dark-mode') ? '#e0e0e0' : COLORS.FBD_DIMENSION;
    context.save();
    context.strokeStyle = color;
    context.fillStyle = color;
    context.lineWidth = 1;

    // Kiriş başı hizasında kesikli-noktalı referans çizgisi (mesnet tepkisi okunun
    // ve etiketinin altından başlar) ve başlangıç çentiği
    context.setLineDash([8, 3, 2, 3]);
    context.beginPath(); context.moveTo(x0, y_beam + getGridSize() / 2 + 62); context.lineTo(x0, y); context.stroke();
    context.setLineDash([]);
    context.beginPath(); context.moveTo(x0, y - 16); context.lineTo(x0, y + 16); context.stroke();

    context.font = '14px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    const w = context.measureText(text).width;
    const mid = (x0 + cutX) / 2;
    const gap = 6;

    if (cutX - x0 > w + 2 * gap + 20) {
        // Yazı okun ortasında, çizgi yazının iki yanında kesilir
        context.beginPath();
        context.moveTo(x0, y); context.lineTo(mid - w / 2 - gap, y);
        context.moveTo(mid + w / 2 + gap, y); context.lineTo(cutX - 8, y);
        context.stroke();
        context.fillText(text, mid, y);
    } else {
        // Kısa mesafede yazı okun üstüne alınır
        context.beginPath(); context.moveTo(x0, y); context.lineTo(cutX - 8, y); context.stroke();
        context.textAlign = 'left';
        context.fillText(text, x0, y - 12);
    }
    // Dolu, arkası çentikli ince ok ucu
    context.beginPath();
    context.moveTo(cutX, y);
    context.lineTo(cutX - 10, y - 3.5);
    context.lineTo(cutX - 8, y);
    context.lineTo(cutX - 10, y + 3.5);
    context.closePath();
    context.fill();
    context.restore();
}

// --- Tuvallere bağlanan kancalar ---

// redrawCanvas() sonunda çağrılır (ctx CSS pikseline ölçekli).
function drawCutOverlayOnModel(context) {
    if (!cutModeActive || !beam) return;
    const cutX = getCutPixelX();
    if (cutIntersectsBeam(cutX)) grayOutRightOf(context, canvas, cutX);
    drawCutLine(context, cutX, canvas.clientHeight);
}

// drawFreeBodyDiagram() sonunda, SCD'nin kaydırılmış koordinatlarında çağrılır.
function drawCutOverlayOnFbd(context, y_beam, allReactions, M_reaction, axialReaction) {
    if (!cutModeActive || !beam) return;
    const cutX = getCutPixelX();
    const offset = getFbdOffsetX();
    if (cutIntersectsBeam(cutX)) {
        grayOutRightOf(context, fbdCanvas, cutX - offset);
        if (isSystemStable()) {
            drawCutReactions(context, cutX, y_beam, computeCutReactions(cutX, allReactions, M_reaction, axialReaction));
        }
        drawCutDistanceArrow(context, cutX, y_beam);
    }
    drawCutLine(context, cutX, fbdCanvas.clientHeight);
}

// --- Kuvvet diyagramları (Chart.js) ---

const CUT_DIAGRAMS = {
    normalForceDiagram:   { symbol: 'N', unit: 'kN' },
    shearForceDiagram:    { symbol: 'V', unit: 'kN' },
    bendingMomentDiagram: { symbol: 'M', unit: 'kNm' },
    torsionMomentDiagram: { symbol: 'T', unit: 'kNm' },
    elasticCurveDiagram:  { symbol: 'δ', unit: 'mm', digits: 3 }
};

function getCutCharts() {
    return [normalForceChart, shearChart, momentChart, torsionChart, elasticCurveChart].filter(Boolean);
}

function getCutChartFor(canvasEl) {
    return getCutCharts().find(c => c.canvas === canvasEl) || null;
}

// Diyagram verisinin x noktasındaki sol limit değeri (sıçramalarda kesimin
// solundaki değer alınır; SCD'deki "tekil etki sağ parçaya" kuralıyla uyumlu).
function interpolateLeftLimit(points, x) {
    for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i], p1 = points[i + 1];
        if (p1.x - p0.x > EPSILON && x > p0.x && x <= p1.x) {
            return p0.y + (p1.y - p0.y) * (x - p0.x) / (p1.x - p0.x);
        }
    }
    return null;
}

function getCutDiagramValue(chart, symbol) {
    // Kesme ve moment, SCD'deki kesim tepkileriyle birebir aynı olsun diye
    // doğrudan hesaplanır (diyagram eğrisi seyrek noktalarla çizilir).
    if ((symbol === 'V' || symbol === 'M') && lastFbdArgs && isSystemStable()) {
        const [allReactions, M_reaction, , axialReaction] = lastFbdArgs;
        const r = computeCutReactions(getCutPixelX(), allReactions, M_reaction, axialReaction);
        return symbol === 'V' ? -r.Ry : r.Mz;
    }
    // N ve T basamaklı olduğundan veriden okunan değer kesindir; sehim (δ)
    // sürekli olduğundan diyagram noktaları arasında doğrusal okunur
    const data = chart.data.datasets[0] && chart.data.datasets[0].data;
    return data ? interpolateLeftLimit(data, cutPositionM) : null;
}

function drawCutLineOnDiagram(context, x, top, bottom) {
    context.save();
    context.strokeStyle = CUT_COLOR;
    context.lineWidth = 2.5;
    context.setLineDash([10, 6]);
    context.beginPath();
    context.moveTo(x, top);
    context.lineTo(x, bottom);
    context.stroke();
    context.restore();
}

// Chart.js eklentisi: upsertLineChart() ile oluşturulan tüm diyagramlara
// eklenir, yalnızca CUT_DIAGRAMS'taki tuvallerde çizer. Ipucu kutusu
// (tooltip) afterDraw'da çizildiği için bu katman onun altında kalır.
const cutDiagramPlugin = {
    id: 'cutDiagramPlugin',
    afterDatasetsDraw(chart) {
        if (!cutModeActive || !beam) return;
        const info = CUT_DIAGRAMS[chart.canvas.id];
        const area = chart.chartArea;
        if (!info || !area || !cutIntersectsBeam(getCutPixelX())) return;

        const x = chart.scales.x.getPixelForValue(cutPositionM);
        if (x < area.left || x > area.right) return;

        const context = chart.ctx;
        grayOutRightOf(context, chart.canvas, x, chart.currentDevicePixelRatio);
        drawCutLineOnDiagram(context, x, area.top, area.bottom);

        const value = getCutDiagramValue(chart, info.symbol);
        if (value === null || !isFinite(value)) return;
        const digits = info.digits || 2;
        const shown = Math.abs(value) < 0.5 * Math.pow(10, -digits) ? 0 : value; // "-0.00" yazılmasın
        const y = Math.min(Math.max(chart.scales.y.getPixelForValue(value), area.top), area.bottom);

        context.save();
        context.fillStyle = CUT_FORCE_COLOR;
        context.beginPath();
        context.arc(x, y, 4.5, 0, 2 * Math.PI);
        context.fill();
        context.restore();

        // Etiket noktanın solunda (gri olmayan tarafta); yer yoksa sağında
        const text = `${info.symbol} = ${shown.toFixed(digits)} ${info.unit}`;
        context.save();
        context.font = 'bold 12px Arial';
        const fitsLeft = x - area.left > context.measureText(text).width + 16;
        context.restore();
        const labelY = Math.min(Math.max(y - 14, area.top + 10), area.bottom - 10);
        drawCutLabel(context, text, fitsLeft ? x - 10 : x + 10, labelY, fitsLeft ? 'right' : 'left', CUT_FORCE_COLOR);
    }
};

function redrawFreeBodyDiagramOnly() {
    if (lastFbdArgs) drawFreeBodyDiagram(...lastFbdArgs);
}

function refreshCutViews() {
    redrawCanvas();
    redrawFreeBodyDiagramOnly();
    getCutCharts().forEach(c => c.draw());
}

// --- Etkileşim ---

function ensureFbdVisible() {
    const wrapper = document.getElementById('free-body-diagram-wrapper');
    if (!wrapper || wrapper.classList.contains('hidden')) return;
    const content = wrapper.querySelector('.content-wrapper');
    const toggle = wrapper.querySelector('.toggle-button');
    if (content && content.classList.contains('hidden') && toggle) toggle.click();
}

function setCutMode(active) {
    cutModeActive = active;
    const btn = document.getElementById('cut-btn');
    if (btn) btn.classList.toggle('active', active);
    if (fbdCanvas) fbdCanvas.style.cursor = active ? 'ew-resize' : '';
    if (active) {
        if (beam) {
            const x = getCutPixelX();
            // Önceki konum kirişin dışında kaldıysa ortaya al
            if (!cutIntersectsBeam(x)) cutPositionM = null;
        }
        ensureFbdVisible();
    }
    refreshCutViews();
}

function isNearCutLine(clientX) {
    if (!cutModeActive || !beam) return false;
    const rect = canvas.getBoundingClientRect();
    return Math.abs(clientX - rect.left - getCutPixelX()) <= CUT_HIT_TOLERANCE_PX;
}

// Diyagramın x ekseni metre cinsindendir (0 … L); konum eksenden okunur.
function getChartCutPixelX(chart) {
    getCutPixelX(); // cutPositionM henüz yoksa kirişin ortasına kurar
    return chart.scales.x.getPixelForValue(cutPositionM);
}

function isNearChartCutLine(chart, clientX) {
    const rect = chart.canvas.getBoundingClientRect();
    return Math.abs(clientX - rect.left - getChartCutPixelX(chart)) <= CUT_HIT_TOLERANCE_PX;
}

function moveCutToClientX(clientX, sourceCanvas) {
    const chart = getCutChartFor(sourceCanvas);
    if (chart) {
        const area = chart.chartArea;
        const localX = Math.min(Math.max(clientX - sourceCanvas.getBoundingClientRect().left, area.left), area.right);
        cutPositionM = Math.round(chart.scales.x.getValueForPixel(localX) * 100) / 100;
        refreshCutViews();
        return;
    }
    const rect = sourceCanvas.getBoundingClientRect();
    const offset = sourceCanvas === fbdCanvas ? getFbdOffsetX() : 0;
    const width = sourceCanvas.clientWidth;
    const localX = Math.min(Math.max(clientX - rect.left, 0), width);
    setCutPixelX(localX + offset);
    refreshCutViews();
}

function startCutDrag(sourceCanvas) {
    isDraggingCut = true;
    document.body.classList.add('cut-dragging');

    const onMove = (e) => {
        if (!isDraggingCut) return;
        e.stopPropagation();
        if (e.cancelable) e.preventDefault();
        moveCutToClientX(getEventPosition(e).clientX, sourceCanvas);
    };
    const onUp = (e) => {
        e.stopPropagation();
        isDraggingCut = false;
        document.body.classList.remove('cut-dragging');
        document.documentElement.classList.remove('no-scroll');
        document.body.classList.remove('no-scroll');
        window.removeEventListener('mousemove', onMove, true);
        window.removeEventListener('mouseup', onUp, true);
        window.removeEventListener('touchmove', onMove, true);
        window.removeEventListener('touchend', onUp, true);
        window.removeEventListener('touchcancel', onUp, true);
    };
    window.addEventListener('mousemove', onMove, true);
    window.addEventListener('mouseup', onUp, true);
    window.addEventListener('touchmove', onMove, { capture: true, passive: false });
    window.addEventListener('touchend', onUp, true);
    window.addEventListener('touchcancel', onUp, true);
}

function initializeCutMethod() {
    const btn = document.getElementById('cut-btn');
    if (btn) btn.addEventListener('click', () => setCutMode(!cutModeActive));

    // Model sıfırlanınca kesim konumu yeni kirişin ortasından başlasın
    const resetBtn = document.getElementById('reset-btn');
    if (resetBtn) resetBtn.addEventListener('click', () => { cutPositionM = null; lastFbdArgs = null; });

    // Yapısal model: çizgiyi yakalama. Dinleyici tuvalin üst öğesinde yakalama
    // fazında çalışır; böylece mevcut çizim/düzenleme işleyicilerinden önce
    // devreye girip olayı onlara ulaştırmaz.
    const wrapper = document.getElementById('canvas-wrapper');
    const grab = (e) => {
        if (e.target !== canvas) return;
        if (e.type === 'mousedown' && e.button !== 0) return;
        if (!isNearCutLine(getEventPosition(e).clientX)) return;
        e.stopPropagation();
        e.preventDefault();
        startCutDrag(canvas);
    };
    wrapper.addEventListener('mousedown', grab, true);
    wrapper.addEventListener('touchstart', grab, { capture: true, passive: false });

    // Çizgi üzerindeyken imleç (mevcut işleyici imleci ayarladıktan sonra çalışır)
    canvas.addEventListener('mousemove', (e) => {
        if (isNearCutLine(e.clientX) || isDraggingCut) canvas.style.cursor = 'ew-resize';
    });

    // SCD: tuvalin herhangi bir yerine basınca çizgi oraya gelir ve sürüklenir.
    const fbdGrab = (e) => {
        if (!cutModeActive || !beam) return;
        if (e.type === 'mousedown' && e.button !== 0) return;
        e.preventDefault();
        moveCutToClientX(getEventPosition(e).clientX, fbdCanvas);
        startCutDrag(fbdCanvas);
    };
    fbdCanvas.addEventListener('mousedown', fbdGrab);
    fbdCanvas.addEventListener('touchstart', fbdGrab, { passive: false });

    // Kuvvet diyagramları: farede grafik alanının herhangi bir yerine basınca
    // çizgi oraya gelir (SCD gibi); dokunmatikte sayfa kaydırması engellenmesin
    // diye yalnızca çizginin yakınından yakalanır (Yapısal Model gibi).
    Object.keys(CUT_DIAGRAMS).forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        const chartGrab = (e) => {
            if (!cutModeActive || !beam) return;
            if (e.type === 'mousedown' && e.button !== 0) return;
            const chart = getCutChartFor(el);
            if (!chart || !chart.chartArea || !cutIntersectsBeam(getCutPixelX())) return;
            const { clientX, clientY } = getEventPosition(e);
            if (e.type === 'touchstart') {
                if (!isNearChartCutLine(chart, clientX)) return;
            } else {
                const a = chart.chartArea;
                const rect = el.getBoundingClientRect();
                const lx = clientX - rect.left, ly = clientY - rect.top;
                if (lx < a.left || lx > a.right || ly < a.top || ly > a.bottom) return;
            }
            e.preventDefault();
            moveCutToClientX(clientX, el);
            startCutDrag(el);
        };
        el.addEventListener('mousedown', chartGrab);
        el.addEventListener('touchstart', chartGrab, { passive: false });
        el.addEventListener('mousemove', (e) => {
            const chart = getCutChartFor(el);
            const active = cutModeActive && beam && chart && chart.chartArea && cutIntersectsBeam(getCutPixelX());
            el.style.cursor = active && (isDraggingCut || isNearChartCutLine(chart, e.clientX)) ? 'ew-resize' : '';
        });
    });
}
