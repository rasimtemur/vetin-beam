// common/ui-handler.js

function drawFreeBodyDiagram(allReactions, M_reaction, T_reaction, axialReaction, loadsToDraw = distributedLoads, trapLoadsToDraw = trapezoidalLoads, hingeData = null, drawGridLines = true) {
    scaleCanvasForHiDPI(fbdCanvas, fbdCtx);
    
    fbdCtx.save();
    
    // Karanlık mod kontrolü
    const isDarkMode = document.body.classList.contains('dark-mode');
    
    if (isDarkMode) {
        fbdCtx.fillStyle = '#0F1419'; // Kesit referansı
    } else {
        fbdCtx.fillStyle = 'white';
    }
    
    fbdCtx.fillRect(0, 0, fbdCanvas.width, fbdCanvas.height);
    fbdCtx.restore();

    fbdCtx.save();
    
    // YENİ: Sadece masaüstünde (geniş ekranlarda) padding'i telafi etmek için sola kaydır.
    if (window.innerWidth > 800) {
        fbdCtx.translate(-20, 0);
    }

    // YENİ: Izgara genişliğini ekran boyutuna göre ayarla.
    const gridWidth = window.innerWidth > 800 ? fbdCanvas.clientWidth + 20 : fbdCanvas.clientWidth;
    if (drawGridLines) {
        drawGrid(fbdCtx, gridWidth, fbdCanvas.clientHeight);
    }
    
    if (!beam) {
        fbdCtx.restore();
        return;
    }
    const y_beam = fbdCanvas.clientHeight / 2;

    const drawVerticalArrow = (x, mag, color, isUp, position, label = `${mag.toFixed(2)} kN`) => {
        const L = 40, T = 5, beamTop = y_beam - 10, beamBottom = y_beam + 10;
        let startY, targetY, textY, textBaseline;
        if (position === 'above') {
            if (isUp) { startY = beamTop; targetY = startY - L; textY = targetY - T; textBaseline = 'bottom'; } 
            else { startY = beamTop - L; targetY = beamTop; textY = startY - T; textBaseline = 'bottom'; }
        } else {
            if (isUp) { startY = beamBottom + L; targetY = beamBottom; textY = startY + T; textBaseline = 'top'; } 
            else { startY = beamBottom; targetY = startY + L; textY = targetY + T; textBaseline = 'top'; }
        }
        fbdCtx.save(); fbdCtx.strokeStyle = color; fbdCtx.fillStyle = color; fbdCtx.lineWidth = 2;
        fbdCtx.beginPath(); fbdCtx.moveTo(x, startY); fbdCtx.lineTo(x, targetY); fbdCtx.stroke();
        const tipOffset = isUp ? 10 : -10;
        fbdCtx.beginPath(); fbdCtx.moveTo(x, targetY); fbdCtx.lineTo(x - 5, targetY + tipOffset);
        fbdCtx.moveTo(x, targetY); fbdCtx.lineTo(x + 5, targetY + tipOffset); fbdCtx.stroke();
        fbdCtx.font = '12px Arial'; fbdCtx.textAlign = 'center'; fbdCtx.textBaseline = textBaseline;
        fbdCtx.fillText(label, x, textY);
        fbdCtx.restore();
    };

    const drawHorizontalArrow = (x, mag, color) => {
        const isLeft = mag < 0;
        fbdCtx.save();
        fbdCtx.strokeStyle = color; fbdCtx.fillStyle = color; fbdCtx.lineWidth = 2; fbdCtx.font = '12px Arial'; fbdCtx.textBaseline = 'middle';
        if (isLeft) {
            const startX = x + 40; const endX = x;
            fbdCtx.beginPath(); fbdCtx.moveTo(startX, y_beam); fbdCtx.lineTo(endX, y_beam); fbdCtx.moveTo(endX, y_beam); fbdCtx.lineTo(endX + 10, y_beam - 5); fbdCtx.moveTo(endX, y_beam); fbdCtx.lineTo(endX + 10, y_beam + 5); fbdCtx.stroke();
            fbdCtx.textAlign = 'right'; fbdCtx.fillText(`${Math.abs(mag).toFixed(2)} kN`, endX - 5, y_beam);
        } else {
            const startX = x - 40; const endX = x;
            fbdCtx.beginPath(); fbdCtx.moveTo(startX, y_beam); fbdCtx.lineTo(endX, y_beam); fbdCtx.moveTo(endX, y_beam); fbdCtx.lineTo(endX - 10, y_beam - 5); fbdCtx.moveTo(endX, y_beam); fbdCtx.lineTo(endX - 10, y_beam + 5); fbdCtx.stroke();
            fbdCtx.textAlign = 'left'; fbdCtx.fillText(`${Math.abs(mag).toFixed(2)} kN`, endX + 5, y_beam);
        }
        fbdCtx.restore();
    };

    drawBeam(fbdCtx, beam.startX, y_beam, beam.endX, y_beam);

    concentratedLoads.forEach(l => {
        const verticalForce = l.magnitude * Math.sin(l.angle);
        if (Math.abs(verticalForce) > EPSILON) {
            drawVerticalArrow(l.x, Math.abs(verticalForce), COLORS.LOAD, verticalForce < 0, 'above');
        }
        const horizontalForce = l.magnitude * Math.cos(l.angle);
        if (Math.abs(horizontalForce) > EPSILON) {
            drawHorizontalArrow(l.x, horizontalForce, COLORS.LOAD);
        }
    });

    concentratedMoments.forEach(m => {

        const updatedMoment = { ...m, y: y_beam };
        drawConcentratedMoment(fbdCtx, updatedMoment, COLORS.LOAD);
    });

    torsionMoments.forEach(t => {
        const updatedTorsion = { ...t, y: y_beam };
        drawTorsionMoment(fbdCtx, updatedTorsion);
    });
    
    if (allReactions) {
        allReactions.forEach(reaction => {
            if (Math.abs(reaction.magnitude) > EPSILON) {
                drawVerticalArrow(reaction.x, Math.abs(reaction.magnitude), COLORS.REACTION, reaction.magnitude > 0, 'below');
            }
        });
    }

    if (M_reaction && Math.abs(M_reaction) > EPSILON) {
        const fixedSupport = supports.find(s => s.type === 'fixed-support');
        if (fixedSupport) {
            drawConcentratedMoment(fbdCtx, { x: fixedSupport.x, y: y_beam, magnitude: M_reaction }, COLORS.REACTION);
        }
    }

    if (axialReaction) {
        drawHorizontalArrow(axialReaction.x, axialReaction.magnitude, COLORS.REACTION);
    }

    if (T_reaction && Math.abs(T_reaction.magnitude) > EPSILON) {
        drawTorsionMoment(fbdCtx, { x: T_reaction.x, y: y_beam, magnitude: T_reaction.magnitude }, COLORS.REACTION);
    }

    loadsToDraw.forEach(l => drawDistributedLoad(fbdCtx, l.startX, l.endX, y_beam, l.magnitude, false));
    trapLoadsToDraw.forEach(l => drawTrapezoidalLoad(fbdCtx, l.startX, l.endX, y_beam, l.startMagnitude, l.endMagnitude, false));
    
    drawDimensions(fbdCtx, y_beam + 80);

    fbdCtx.restore();
}

// --- YENİ YARDIMCI FONKSİYONLAR ---
let isHighRes = false; // Yüksek çözünürlük modunda olup olmadığımızı takip etmek için

function switchToHighResDiagrams() {
    if (!isHighRes && calculatedReactions) {
        isHighRes = true;
        generateAndDrawDiagrams(calculatedReactions, calculatedMomentReaction, null, true, distributedLoads, trapezoidalLoads, null, 1200);
    }
}

function switchToLowResDiagrams() {
    if (isHighRes && calculatedReactions) {
        isHighRes = false;
        generateAndDrawDiagrams(calculatedReactions, calculatedMomentReaction, null, true, distributedLoads, trapezoidalLoads, null, 50);
    }
}
// ------------------------------------

// ------------------------------------

function drawDiagrams(shearPoints, momentPoints, elasticCurvePoints, L, isLiveUpdate = false) {
    if (shearChart) shearChart.destroy();
    if (momentChart) momentChart.destroy();
    if (elasticCurveChart) elasticCurveChart.destroy();

    const metersPerGrid = parseFloat(metersPerGridInput.value) || 1;
    const currentLang = document.documentElement.lang || 'tr';
    const axisTitles = translations[currentLang].diagramAxes;

    const baseChartOptions = {
        scales: {
            x: { 
                type: 'linear', 
                min: 0, 
                max: L, 
                ticks: { 
                    autoSkip: false, 
                    stepSize: metersPerGrid, 
                    font: { size: 10 }, 
                    callback: function(v) { return v.toFixed(1) + 'm'; } 
                },
                title: {
                    display: true,
                    text: `${axisTitles.length} (${axisTitles.unitM})`
                }
            },
            y: { 
                grid: { color: COLORS.GRID }, 
                ticks: { padding: 10 },
                title: { display: true, padding: { top: 25 } }, // Pushes title right (away from left edge)
                afterFit: (axis) => { axis.width = 100; }
            }
        },
        plugins: { legend: { display: false }, tooltip: { intersect: false, mode: 'index' } },
        elements: { point: { radius: 0, hoverRadius: 4 } }, // Show point on hover?
        maintainAspectRatio: false,
        hover: { mode: 'index', intersect: false, animation: { duration: 0 } }
    };
    if (isLiveUpdate) { baseChartOptions.animation = { duration: 0 }; }

    const shearChartOptions = {
        ...baseChartOptions,
        scales: {
            ...baseChartOptions.scales,
            y: {
                ...baseChartOptions.scales.y,
                title: { 
                    ...baseChartOptions.scales.y.title,
                    display: true, 
                    text: `${axisTitles.shearForce} (${axisTitles.unitKN})` 
                }
            }
        }
    };
    
    const momentChartOptions = {
        ...baseChartOptions,
        scales: {
            ...baseChartOptions.scales,
            y: {
                ...baseChartOptions.scales.y,
                reverse: true,
                title: { 
                    ...baseChartOptions.scales.y.title,
                    display: true, 
                    text: `${axisTitles.bendingMoment} (${axisTitles.unitKNM})` 
                }
            }
        }
    };

    shearChart = new Chart(document.getElementById('shearForceDiagram').getContext('2d'), { 
        type: 'line', 
        data: { datasets: [{ data: shearPoints, borderColor: COLORS.LOAD, backgroundColor: COLORS.LOAD + '33', borderWidth: 2, fill: 'origin', tension: 0 }] }, 
        plugins: [chartAlignmentPlugin],
        options: shearChartOptions
    });
    
    momentChart = new Chart(document.getElementById('bendingMomentDiagram').getContext('2d'), { 
        type: 'line', 
        data: { datasets: [{ data: momentPoints, borderColor: COLORS.BEAM_STROKE, backgroundColor: COLORS.BEAM_STROKE + '33', borderWidth: 2, fill: 'origin', tension: 0 }] }, 
        plugins: [chartAlignmentPlugin],
        options: momentChartOptions
    });
    
    const elasticCurveChartOptions = {
        ...baseChartOptions,
        scales: {
            ...baseChartOptions.scales,
            y: {
                ...baseChartOptions.scales.y,
                grace: '10%',
                title: { 
                    ...baseChartOptions.scales.y.title,
                    display: true, 
                    text: `${axisTitles.displacement} (${axisTitles.unitMM})` 
                },
                ticks: {
                    ...baseChartOptions.scales.y.ticks,
                    callback: function(value) { return value.toFixed(1); }
                },
                afterFit: (axis) => { axis.width = 100; }
            }
        }
    };
    
    elasticCurveChart = new Chart(document.getElementById('elasticCurveDiagram').getContext('2d'), { 
        type: 'line', 
        data: { datasets: [{ data: elasticCurvePoints, borderColor: COLORS.BEAM_STROKE, backgroundColor: COLORS.BEAM_STROKE + '33', borderWidth: 2, fill: 'origin', tension: 0.1 }] }, 
        plugins: [chartAlignmentPlugin],
        options: elasticCurveChartOptions
    });
    
    // Update 3D Elastic Curve
    if (typeof drawElasticCurve3D === 'function') {
        drawElasticCurve3D();
    }
    
    // --- YENİ EKLENEN OLAY DİNLEYİCİLERİ ---
    const shearCanvas = document.getElementById('shearForceDiagram');
    const momentCanvas = document.getElementById('bendingMomentDiagram');
    const elasticCurveCanvas = document.getElementById('elasticCurveDiagram');

    [shearCanvas, momentCanvas, elasticCurveCanvas].forEach(canvas => {
        if (canvas) {
            canvas.addEventListener('mouseenter', switchToHighResDiagrams);
            canvas.addEventListener('touchstart', switchToHighResDiagrams, { passive: true });
            canvas.addEventListener('mouseleave', switchToLowResDiagrams);
        }
    });
    
    // Mobil cihazda diyagram dışına dokunulduğunda düşük çözünürlüğe dön
    if (isTouchDevice) {
        document.body.addEventListener('touchstart', (e) => {
            if (!e.target.closest('#shear-force-diagram-wrapper, #bending-moment-diagram-wrapper, #elastic-curve-diagram-wrapper')) {
                switchToLowResDiagrams();
            }
        });
    }
    // ------------------------------------
    if (typeof drawElasticCurve3D === 'function') drawElasticCurve3D();
}

function setDiagramState(wrapperId, shouldBeVisible) {
    const wrapper = document.getElementById(wrapperId);
    if (!wrapper) return;

    const button = wrapper.querySelector('.toggle-button');
    const content = wrapper.querySelector('.content-wrapper');
    const currentLang = document.documentElement.lang || 'tr';
    const showIcon = `<svg viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5C21.27 7.61 17 4.5 12 4.5zm0 13c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6zm0-10c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4z"/></svg>`;
    const hideIcon = `<svg viewBox="0 0 24 24"><path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l3.28 3.28.02.06C3.93 8.5 2.73 10.11 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l3.15 3.15L21 21.18 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02.05c0-1.66-1.34-3-3-3l-.05-.02-3.15-3.15-.05-.02c0-1.66 1.34-3-3z"/></svg>`;

    wrapper.classList.toggle('hidden', !shouldBeVisible);

    if (shouldBeVisible) {
        // Respect user preference. If no preference, use default (true).
        const userPref = userVisibilityPrefs[wrapperId];
        const showContent = (userPref !== undefined) ? userPref : true;

        content.classList.toggle('hidden', !showContent);
        if(button) {
            button.innerHTML = showContent ? hideIcon : showIcon;
            button.setAttribute('title', translations[currentLang][showContent ? 'hide' : 'show']);
            button.dataset.i18nTitle = showContent ? 'hide' : 'show';
        }
    }
}

function updateDiagramsVisibility() {
    const diagramsContainer = document.getElementById('all-diagrams-container');
    const isSystemDrawable = beam && isSystemStable();

    const hasVerticalLoadsOrMoments = concentratedLoads.some(l => Math.abs(l.magnitude * Math.sin(l.angle)) > EPSILON) || distributedLoads.length > 0 || trapezoidalLoads.length > 0 || concentratedMoments.length > 0;
    const hasAxialForces = concentratedLoads.some(l => Math.abs(l.magnitude * Math.cos(l.angle)) > EPSILON);
    const hasTorsionLoads = torsionMoments.length > 0;

    const shouldShowMainContainer = isSystemDrawable && (hasVerticalLoadsOrMoments || hasAxialForces || hasTorsionLoads);
    
    diagramsContainer.classList.toggle('hidden', !shouldShowMainContainer);

    if (!shouldShowMainContainer) return;

    setDiagramState('free-body-diagram-wrapper', isSystemDrawable && (hasVerticalLoadsOrMoments || hasAxialForces));
    setDiagramState('normal-force-diagram-wrapper', isSystemDrawable && hasAxialForces);
    setDiagramState('shear-force-diagram-wrapper', isSystemDrawable && hasVerticalLoadsOrMoments);
    setDiagramState('bending-moment-diagram-wrapper', isSystemDrawable && hasVerticalLoadsOrMoments);
    setDiagramState('elastic-curve-diagram-wrapper', isSystemDrawable && hasVerticalLoadsOrMoments);
    setDiagramState('elastic-curve-3d-wrapper', isSystemDrawable);
    setDiagramState('torsion-moment-diagram-wrapper', isSystemDrawable && hasTorsionLoads);
}

function updateTables() {
    const tablesContainer = document.getElementById('data-tables-container');
    
    if (!beam) {
        tablesContainer.classList.add('hidden');
        return;
    }
    
    tablesContainer.classList.remove('hidden');

    // Respect user preference for table contents
    const content = tablesContainer.querySelector('.table-grid-wrapper');
    const userPref = userVisibilityPrefs['data-tables-container'];
    if (userPref !== undefined && content) {
        content.classList.toggle('hidden', !userPref);
        const button = tablesContainer.querySelector('.toggle-button');
        if (button) {
            const currentLang = document.documentElement.lang || 'tr';
            const showIcon = `<svg viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5C21.27 7.61 17 4.5 12 4.5zm0 13c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6zm0-10c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4z"/></svg>`;
            const hideIcon = `<svg viewBox="0 0 24 24"><path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l3.28 3.28.02.06C3.93 8.5 2.73 10.11 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l3.15 3.15L21 21.18 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02.05c0-1.66-1.34-3-3-3l-.05-.02-3.15-3.15-.05-.02c0-1.66 1.34-3-3z"/></svg>`;
            button.innerHTML = userPref ? hideIcon : showIcon;
            button.setAttribute('title', translations[currentLang][userPref ? 'hide' : 'show']);
            button.dataset.i18nTitle = userPref ? 'hide' : 'show';
        }
    }
    
    document.querySelectorAll('#data-tables-container tbody').forEach(tbody => tbody.innerHTML = '');

    const currentLang = document.documentElement.lang || 'tr';
    const langTranslations = translations[currentLang];
    
    const { toMeters } = getConversionFunctions();
    
    const setTableVisibility = (tableId, isVisible) => {
        const table = document.getElementById(tableId);
        if (table) {
            const wrapper = table.closest('.table-wrapper');
            if (wrapper) {
                wrapper.classList.toggle('hidden', !isVisible);
            }
        }
    };

    const beamBody = document.getElementById('beam-table').querySelector('tbody');
    const beamEndM = toMeters(beam.endX) - toMeters(beam.startX);
    beamBody.innerHTML = `<tr><td>${langTranslations.beamStartPos}</td><td contenteditable="true" data-property="start">0.00</td></tr>
                          <tr><td>${langTranslations.beamEndPos}</td><td contenteditable="true" data-property="end">${beamEndM.toFixed(2)}</td></tr>`;
    setTableVisibility('beam-table', true);

    const supportsAndHingesExist = supports.length > 0 || hinges.length > 0;
    setTableVisibility('supports-table', supportsAndHingesExist);
    if (supportsAndHingesExist) {
        const supportsBody = document.getElementById('supports-table').querySelector('tbody');
        const supportTypeMap = { 
            'pin-support': langTranslations.tableContent.supportPin, 
            'roller-support': langTranslations.tableContent.supportRoller, 
            'fixed-support': langTranslations.tableContent.supportFixed,
            'hinge': langTranslations.tableContent.supportHinge
        };
        let counter = 1;
        supports.forEach((s, i) => { 
            const row = supportsBody.insertRow();
            row.innerHTML = `<td>${counter++}</td><td>${supportTypeMap[s.type] || langTranslations.tableContent.unknown}</td><td contenteditable="true" data-index="${i}" data-type="support" data-property="x">${toMeters(s.x).toFixed(2)}</td><td><button class="delete-btn" data-type="support" data-index="${i}">X</button></td>`; 
        });
        hinges.forEach((h, i) => {
            const row = supportsBody.insertRow();
            row.innerHTML = `<td>${counter++}</td><td>${supportTypeMap['hinge']}</td><td contenteditable="true" data-index="${i}" data-type="hinge" data-property="x">${toMeters(h.x).toFixed(2)}</td><td><button class="delete-btn" data-type="hinge" data-index="${i}">X</button></td>`; 
        });
    }

    const concentratedLoadsExist = concentratedLoads.length > 0;
    setTableVisibility('concentrated-loads-table', concentratedLoadsExist);
    if (concentratedLoadsExist) {
        const concentratedLoadsBody = document.getElementById('concentrated-loads-table').querySelector('tbody');
        concentratedLoads.forEach((l, i) => {
            const angleDeg = (l.angle * 180 / Math.PI).toFixed(1);
            const row = concentratedLoadsBody.insertRow();
            row.innerHTML = `<td>${i + 1}</td><td contenteditable="true" data-index="${i}" data-property="x">${toMeters(l.x).toFixed(2)}</td><td contenteditable="true" data-index="${i}" data-property="magnitude">${(l.magnitude).toFixed(2)}</td><td contenteditable="true" data-index="${i}" data-property="angle">${angleDeg}</td><td><button class="delete-btn" data-type="concentratedLoad" data-index="${i}">X</button></td>`;
        });
    }

    const distributedLoadsExist = distributedLoads.length > 0;
    setTableVisibility('distributed-loads-table', distributedLoadsExist);
    if (distributedLoadsExist) {
        const distributedLoadsBody = document.getElementById('distributed-loads-table').querySelector('tbody');
        distributedLoads.forEach((l, i) => {
            const row = distributedLoadsBody.insertRow();
            row.innerHTML = `<td>${i + 1}</td><td contenteditable="true" data-index="${i}" data-property="startX">${toMeters(l.startX).toFixed(2)}</td><td contenteditable="true" data-index="${i}" data-property="endX">${toMeters(l.endX).toFixed(2)}</td><td contenteditable="true" data-index="${i}" data-property="magnitude">${(l.magnitude).toFixed(2)}</td><td><button class="delete-btn" data-type="distributedLoad" data-index="${i}">X</button></td>`;
        });
    }

    const trapezoidalLoadsExist = trapezoidalLoads.length > 0;
    setTableVisibility('trapezoidal-loads-table', trapezoidalLoadsExist);
    if (trapezoidalLoadsExist) {
        const trapezoidalLoadsBody = document.getElementById('trapezoidal-loads-table').querySelector('tbody');
        trapezoidalLoads.forEach((l, i) => {
            const row = trapezoidalLoadsBody.insertRow();
            row.innerHTML = `<td>${i + 1}</td><td contenteditable="true" data-index="${i}" data-property="startX">${toMeters(l.startX).toFixed(2)}</td><td contenteditable="true" data-index="${i}" data-property="endX">${toMeters(l.endX).toFixed(2)}</td><td contenteditable="true" data-index="${i}" data-property="startMagnitude">${(l.startMagnitude).toFixed(2)}</td><td contenteditable="true" data-index="${i}" data-property="endMagnitude">${(l.endMagnitude).toFixed(2)}</td><td><button class="delete-btn" data-type="trapezoidalLoad" data-index="${i}">X</button></td>`;
        });
    }

    const concentratedMomentsExist = concentratedMoments.length > 0;
    setTableVisibility('concentrated-moments-table', concentratedMomentsExist);
    if (concentratedMomentsExist) {
        const concentratedMomentsBody = document.getElementById('concentrated-moments-table').querySelector('tbody');
        concentratedMoments.forEach((m, i) => {
            const row = concentratedMomentsBody.insertRow();
            row.innerHTML = `<td>${i + 1}</td><td contenteditable="true" data-index="${i}" data-property="x">${toMeters(m.x).toFixed(2)}</td><td contenteditable="true" data-index="${i}" data-property="magnitude">${(m.magnitude).toFixed(2)}</td><td><button class="delete-btn" data-type="concentratedMoment" data-index="${i}">X</button></td>`;
        });
    }

    const torsionMomentsExist = torsionMoments.length > 0;
    setTableVisibility('torsion-moments-table', torsionMomentsExist);
    if (torsionMomentsExist) {
        const torsionMomentsBody = document.getElementById('torsion-moments-table').querySelector('tbody');
        torsionMoments.forEach((t, i) => {
            const row = torsionMomentsBody.insertRow();
            row.innerHTML = `<td>${i + 1}</td><td contenteditable="true" data-index="${i}" data-property="x">${toMeters(t.x).toFixed(2)}</td><td contenteditable="true" data-index="${i}" data-property="magnitude">${(t.magnitude).toFixed(2)}</td><td><button class="delete-btn" data-type="torsionMoment" data-index="${i}">X</button></td>`;
        });
    }
}

// === YENİ EKLENEN FONKSİYON ===
/**
 * Seçili olan araca göre ipucu kutusunun içeriğini günceller.
 */
function updateHintBox() {
    const hintBox = document.getElementById('hint-box');
    if (!hintBox) return;

    const lang = document.documentElement.lang || 'tr';
    // 'edit' aracının tam adı 'editMove' olduğu için özel bir kontrol ekliyoruz.
    const toolKey = (currentTool === 'edit') ? 'edit' : currentTool.replace(/-/g, '');
    
    // Çeviri anahtarlarını daha tutarlı hale getirmek için tireleri kaldırıyoruz
    let hintKey = currentTool;
    if (currentTool === 'pin-support') hintKey = 'pinSupport';
    if (currentTool === 'roller-support') hintKey = 'rollerSupport';
    if (currentTool === 'fixed-support') hintKey = 'fixedSupport';
    if (currentTool === 'concentrated-load') hintKey = 'concentratedLoad';
    if (currentTool === 'concentrated-moment') hintKey = 'concentratedMoment';
    if (currentTool === 'torsion-moment') hintKey = 'torsionMoment';
    if (currentTool === 'distributed-load') hintKey = 'distributedLoad';
    if (currentTool === 'triangular-load') hintKey = 'triangularLoad';
    if (currentTool === 'edit') hintKey = 'edit';


    const hintText = translations[lang]?.toolHints?.[hintKey];

    if (hintText && beam) { // Sadece kiriş çizildikten sonra ipuçlarını göster
        hintBox.innerHTML = `🚧 ${hintText}`;
        hintBox.classList.remove('hidden');
    } else if (currentTool === 'beam' && !beam) { // Kiriş yoksa sadece kiriş ipucunu göster
        hintBox.innerHTML = `🚧 ${translations[lang]?.toolHints?.beam}`;
        hintBox.classList.remove('hidden');
    }
    else {
        hintBox.classList.add('hidden');
    }
}

// --- TEMA YÖNETİMİ ---
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
        enableDarkMode();
    } else {
        enableLightMode(false); 
    }

    const toggleBtn = document.getElementById('dark-mode-toggle');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            if (document.body.classList.contains('dark-mode')) {
                enableLightMode(true);
            } else {
                enableDarkMode(true);
            }
            const menu = document.getElementById('appMenu');
            if (menu) menu.classList.remove('show');
        });
    }

    const appMenuBtn = document.getElementById('app-menu-toggle');
    const appMenu = document.getElementById('appMenu');
    if (appMenuBtn && appMenu) {
        appMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            appMenu.classList.toggle('show');
        });
        document.addEventListener('click', (e) => {
            if (!appMenu.contains(e.target) && e.target !== appMenuBtn) {
                appMenu.classList.remove('show');
            }
        });
    }

    const proxyMenuClick = (menuId, targetId) => {
        const menuBtn = document.getElementById(menuId);
        if (!menuBtn) return;
        menuBtn.addEventListener('click', () => {
            if (appMenu) appMenu.classList.remove('show');
            const target = document.getElementById(targetId);
            if (target) target.click();
        });
    };
    proxyMenuClick('menu-open', 'open-btn');
    proxyMenuClick('menu-save', 'save-btn');

    const performReset = () => {
        const resetBtn = document.getElementById('reset-btn');
        if (!resetBtn) return;
        window.__skipResetConfirm = true;
        resetBtn.click();
        window.__skipResetConfirm = false;
        window.__lastSavedHash = null;
    };

    const menuNewBtn = document.getElementById('menu-new');
    if (menuNewBtn) {
        menuNewBtn.addEventListener('click', () => {
            if (appMenu) appMenu.classList.remove('show');
            if (isModelEmpty()) { performReset(); return; }
            const currentHash = getCurrentModelHash();
            const isSavedAndClean = window.__lastSavedHash && currentHash === window.__lastSavedHash;
            if (isSavedAndClean) {
                showConfirmModal({
                    titleKey: 'newConfirmTitle',
                    messageKey: 'newConfirmMessage',
                    yesKey: 'newConfirmYes',
                    variant: 'primary',
                    onConfirm: performReset
                });
            } else {
                showConfirmModal({
                    titleKey: 'newUnsavedTitle',
                    messageKey: 'newUnsavedMessage',
                    yesKey: 'newConfirmYes',
                    variant: 'warning',
                    onConfirm: performReset
                });
            }
        });
    }

    const resetBtn = document.getElementById('reset-btn');
    if (resetBtn) {
        resetBtn.addEventListener('click', (e) => {
            if (window.__skipResetConfirm) return;
            e.stopImmediatePropagation();
            e.preventDefault();
            showConfirmModal({
                titleKey: 'resetConfirmTitle',
                messageKey: 'resetConfirmMessage',
                yesKey: 'resetConfirmYes',
                variant: 'danger',
                onConfirm: () => {
                    window.__skipResetConfirm = true;
                    resetBtn.click();
                    window.__skipResetConfirm = false;
                    window.__lastSavedHash = null;
                }
            });
        }, true);
    }

    const aboutBtn = document.getElementById('about-toggle');
    if (aboutBtn) {
        aboutBtn.addEventListener('click', () => {
            if (appMenu) appMenu.classList.remove('show');
            showAboutModal();
        });
    }
}

function showAboutModal() {
    const lang = document.documentElement.lang || 'en';
    const t = (typeof translations !== 'undefined' && translations[lang]) || (typeof translations !== 'undefined' && translations['en']) || {};
    const title = t.aboutTitle || 'About Vetin';
    const content = t.aboutContent || 'Vetin is an educational software developed for calculating internal forces in beams. Released under the MIT License.';
    const closeText = t.aboutClose || 'Close';

    let backdrop = document.getElementById('about-modal-backdrop');
    if (!backdrop) {
        backdrop = document.createElement('div');
        backdrop.id = 'about-modal-backdrop';
        backdrop.className = 'about-modal-backdrop';
        document.body.appendChild(backdrop);
    }
    const tagline = t.aboutTagline || 'INTERNAL FORCE DIAGRAMS';
    const version = t.aboutVersion || 'v1.0 · MIT License';
    const content2 = t.aboutContent2 || 'You can access other academic solutions in the Vetin ecosystem at';
    backdrop.innerHTML = `
        <div class="about-modal" role="dialog" aria-modal="true">
            <div class="about-modal-grid">
                <div class="about-modal-left">
                    <div class="about-modal-left-content">
                        <img src="logo.svg" alt="Vetin" class="about-logo">
                        <div class="about-modal-tagline">${tagline}</div>
                        <div class="about-modal-version">${version}</div>
                    </div>
                    <a href="http://www.iuc.edu.tr" target="_blank" rel="noopener noreferrer" class="about-iuc-link">
                        <img src="IUC.svg" alt="IUC" class="about-iuc-logo">
                    </a>
                </div>
                <div class="about-modal-right">
                    <h2>${title}</h2>
                    <div class="about-modal-body">
                        <p>${content}</p>
                        <p>${content2} <a href="https://www.rasimtemur.com/vetin/" target="_blank" rel="noopener noreferrer">rasimtemur.com/vetin</a></p>
                    </div>
                    <div class="about-modal-footer">
                        <button id="about-modal-close">${closeText}</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    backdrop.classList.add('show');
    document.getElementById('about-modal-close').addEventListener('click', () => backdrop.classList.remove('show'));
    backdrop.addEventListener('click', (e) => { if (e.target === backdrop) backdrop.classList.remove('show'); });
}

function getCurrentModelHash() {
    try {
        return JSON.stringify({
            beam: typeof beam !== 'undefined' ? beam : null,
            supports: typeof supports !== 'undefined' ? supports : [],
            hinges: typeof hinges !== 'undefined' ? hinges : [],
            concentratedLoads: typeof concentratedLoads !== 'undefined' ? concentratedLoads : [],
            distributedLoads: typeof distributedLoads !== 'undefined' ? distributedLoads : [],
            trapezoidalLoads: typeof trapezoidalLoads !== 'undefined' ? trapezoidalLoads : [],
            concentratedMoments: typeof concentratedMoments !== 'undefined' ? concentratedMoments : [],
            torsionMoments: typeof torsionMoments !== 'undefined' ? torsionMoments : []
        });
    } catch (e) { return ''; }
}

function isModelEmpty() {
    const empty = (arr) => !arr || arr.length === 0;
    return (typeof beam === 'undefined' || !beam) &&
           empty(typeof supports !== 'undefined' ? supports : []) &&
           empty(typeof hinges !== 'undefined' ? hinges : []) &&
           empty(typeof concentratedLoads !== 'undefined' ? concentratedLoads : []) &&
           empty(typeof distributedLoads !== 'undefined' ? distributedLoads : []) &&
           empty(typeof trapezoidalLoads !== 'undefined' ? trapezoidalLoads : []) &&
           empty(typeof concentratedMoments !== 'undefined' ? concentratedMoments : []) &&
           empty(typeof torsionMoments !== 'undefined' ? torsionMoments : []);
}

const CONFIRM_VARIANT_ICONS = {
    danger: '<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line>',
    warning: '<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line>',
    primary: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="12" x2="12" y2="18"></line><line x1="9" y1="15" x2="15" y2="15"></line>'
};

function showConfirmModal(opts) {
    const lang = document.documentElement.lang || 'en';
    const t = (typeof translations !== 'undefined' && translations[lang]) || (typeof translations !== 'undefined' && translations['en']) || {};
    const title = t[opts.titleKey] || opts.title || '';
    const message = t[opts.messageKey] || opts.message || '';
    const yesText = t[opts.yesKey] || opts.yesText || 'OK';
    const cancelText = t.resetConfirmCancel || 'Cancel';
    const variant = opts.variant || 'danger';
    const iconSvg = CONFIRM_VARIANT_ICONS[variant] || CONFIRM_VARIANT_ICONS.danger;
    const yesClass = variant === 'primary' ? 'btn-primary' : (variant === 'warning' ? 'btn-warning' : 'btn-danger');

    let backdrop = document.getElementById('confirm-modal-backdrop');
    if (!backdrop) {
        backdrop = document.createElement('div');
        backdrop.id = 'confirm-modal-backdrop';
        backdrop.className = 'confirm-modal-backdrop';
        document.body.appendChild(backdrop);
    }
    backdrop.innerHTML = `
        <div class="confirm-modal confirm-${variant}" role="dialog" aria-modal="true">
            <div class="confirm-modal-header">
                <div class="icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${iconSvg}</svg>
                </div>
                <h3>${title}</h3>
            </div>
            <p>${message}</p>
            <div class="confirm-modal-footer">
                <button class="btn-cancel" id="confirm-modal-cancel">${cancelText}</button>
                <button class="${yesClass}" id="confirm-modal-yes">${yesText}</button>
            </div>
        </div>
    `;
    backdrop.classList.add('show');

    const close = () => backdrop.classList.remove('show');
    document.getElementById('confirm-modal-cancel').addEventListener('click', close);
    document.getElementById('confirm-modal-yes').addEventListener('click', () => {
        close();
        if (typeof opts.onConfirm === 'function') opts.onConfirm();
    });
    backdrop.addEventListener('click', (e) => { if (e.target === backdrop) close(); });
}

function enableDarkMode(shouldRedraw = false) {
    document.body.classList.add('dark-mode');
    localStorage.setItem('theme', 'dark');
    
    // Koyu Mod Renkleri (Referans: Kesit Projesi)
    COLORS.GRID = '#1E293B';
    COLORS.BEAM_STROKE = '#3B82F6';
    COLORS.SUPPORT = '#A0A0A0';
    COLORS.DIMENSION = '#F0F0F0';
    COLORS.BEAM_FILL = 'rgba(59, 130, 246, 0.4)';
    
    if (shouldRedraw && typeof redrawCanvas === 'function') {
        // FBD güncellemesi - En öncelikli çizim
        const fbdWrapper = document.getElementById('freeBodyDiagramCanvas');
        if (fbdWrapper && !fbdWrapper.closest('.hidden') && typeof calculatedReactions !== 'undefined' && calculatedReactions.length > 0) {
             drawFreeBodyDiagram(calculatedReactions, calculatedMomentReaction, null, calculatedAxialReaction);
        }

        redrawCanvas();
        if (typeof shearChart !== 'undefined' && shearChart) {
             shearChart.options.scales.x.grid.color = COLORS.GRID;
             shearChart.options.scales.y.grid.color = COLORS.GRID;
             shearChart.options.scales.x.ticks.color = COLORS.DIMENSION;
             shearChart.options.scales.y.ticks.color = COLORS.DIMENSION;
             shearChart.options.scales.x.title.color = COLORS.DIMENSION;
             shearChart.options.scales.y.title.color = COLORS.DIMENSION;
             shearChart.update('none');
        }
        if (typeof momentChart !== 'undefined' && momentChart) {
             momentChart.options.scales.x.grid.color = COLORS.GRID;
             momentChart.options.scales.y.grid.color = COLORS.GRID;
             momentChart.options.scales.x.ticks.color = COLORS.DIMENSION;
             momentChart.options.scales.y.ticks.color = COLORS.DIMENSION;
             momentChart.options.scales.x.title.color = COLORS.DIMENSION;
             momentChart.options.scales.y.title.color = COLORS.DIMENSION;
             momentChart.update('none');
        }
        if (typeof elasticCurveChart !== 'undefined' && elasticCurveChart) {
             elasticCurveChart.options.scales.x.grid.color = COLORS.GRID;
             elasticCurveChart.options.scales.y.grid.color = COLORS.GRID;
             elasticCurveChart.options.scales.x.ticks.color = COLORS.DIMENSION;
             elasticCurveChart.options.scales.y.ticks.color = COLORS.DIMENSION;
             elasticCurveChart.options.scales.x.title.color = COLORS.DIMENSION;
             elasticCurveChart.options.scales.y.title.color = COLORS.DIMENSION;
             elasticCurveChart.update('none');
        }
    }
}

function enableLightMode(shouldRedraw = false) {
    document.body.classList.remove('dark-mode');
    localStorage.setItem('theme', 'light');
    
    // Açık Mod Renkleri (Orijinal)
    COLORS.GRID = '#e9e9ed';
    COLORS.BEAM_STROKE = '#389fb6';
    COLORS.SUPPORT = '#4f5659';
    COLORS.DIMENSION = '#555';
    COLORS.BEAM_FILL = 'rgba(56, 159, 182, 0.2)';

    if (shouldRedraw && typeof redrawCanvas === 'function') {
        // FBD güncellemesi - En öncelikli çizim
        const fbdWrapper = document.getElementById('freeBodyDiagramCanvas');
        if (fbdWrapper && !fbdWrapper.closest('.hidden') && typeof calculatedReactions !== 'undefined' && calculatedReactions.length > 0) {
             drawFreeBodyDiagram(calculatedReactions, calculatedMomentReaction, null, calculatedAxialReaction);
        }

        redrawCanvas();
         if (typeof shearChart !== 'undefined' && shearChart) {
             shearChart.options.scales.x.grid.color = COLORS.GRID;
             shearChart.options.scales.y.grid.color = COLORS.GRID;
             shearChart.options.scales.x.ticks.color = COLORS.DIMENSION;
             shearChart.options.scales.y.ticks.color = COLORS.DIMENSION;
             shearChart.options.scales.x.title.color = COLORS.DIMENSION;
             shearChart.options.scales.y.title.color = COLORS.DIMENSION;
             shearChart.update('none');
         }
         if (typeof momentChart !== 'undefined' && momentChart) {
             momentChart.options.scales.x.grid.color = COLORS.GRID;
             momentChart.options.scales.y.grid.color = COLORS.GRID;
             momentChart.options.scales.x.ticks.color = COLORS.DIMENSION;
             momentChart.options.scales.y.ticks.color = COLORS.DIMENSION;
             momentChart.options.scales.x.title.color = COLORS.DIMENSION;
             momentChart.options.scales.y.title.color = COLORS.DIMENSION;
             momentChart.update('none');
         }
         if (typeof elasticCurveChart !== 'undefined' && elasticCurveChart) {
             elasticCurveChart.options.scales.x.grid.color = COLORS.GRID;
             elasticCurveChart.options.scales.y.grid.color = COLORS.GRID;
             elasticCurveChart.options.scales.x.ticks.color = COLORS.DIMENSION;
             elasticCurveChart.options.scales.y.ticks.color = COLORS.DIMENSION;
             elasticCurveChart.options.scales.x.title.color = COLORS.DIMENSION;
             elasticCurveChart.options.scales.y.title.color = COLORS.DIMENSION;
             elasticCurveChart.update('none');
         }
    }
}