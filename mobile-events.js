// mobile/mobile-events.js

function initializeMobileEventListeners() {

const fileInput = document.getElementById('file-input');

function performCanvasUpdate() {
    scaleCanvasForHiDPI(canvas, ctx); 
    redrawCanvas(); 
    updateAll();
}

function loadProjectFromFile(file) {
    if (!file || !file.type.match('application/json')) { return; }
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const projectData = JSON.parse(e.target.result);
            window.__skipResetConfirm = true;
            document.getElementById('reset-btn').click();
            window.__skipResetConfirm = false;
            beam = projectData.beam; supports = projectData.supports || []; hinges = projectData.hinges || [];
            concentratedLoads = projectData.concentratedLoads || []; distributedLoads = projectData.distributedLoads || [];
            trapezoidalLoads = projectData.trapezoidalLoads || []; concentratedMoments = projectData.concentratedMoments || [];
            torsionMoments = projectData.torsionMoments || [];
            if (projectData.gridSettings) {
                metersPerGridInput.value = projectData.gridSettings.metersPerGrid;
                kNPerGridInput.value = projectData.gridSettings.kNPerGrid;
                gridSizeInput.value = projectData.gridSettings.gridSize;
            }
            performCanvasUpdate();
            if (typeof getCurrentModelHash === 'function') {
                window.__lastSavedHash = getCurrentModelHash();
            }
        } catch (error) { console.error("JSON dosyası okunurken hata oluştu:", error); alert("Geçersiz veya bozuk bir model dosyası seçildi."); }
    };
    reader.readAsText(file);
}

document.body.addEventListener('click', (event) => {
    const target = event.target;
    if (target.matches('.tool-group-title')) {
        if (window.innerWidth <= 800) {
            const clickedGroup = target.closest('.tool-group');
            if (!clickedGroup) return;
            document.querySelectorAll('.toolbar .tool-group').forEach(group => {
                if (group !== clickedGroup) {
                    group.classList.remove('is-open');
                }
            });
            clickedGroup.classList.toggle('is-open');
        }
        return;
    }
    const button = target.closest('button');
    if (!button) {
        const panel = target.closest('.diagram-container, #data-tables-container');
        if (panel) {
            const content = panel.querySelector('.content-wrapper, .table-grid-wrapper');
            if (content && content.classList.contains('hidden')) {
                const toggleBtn = panel.querySelector('.toggle-button');
                if (toggleBtn) toggleBtn.click();
            }
        }
        return;
    }
    if (button.parentElement.classList.contains('language-switcher') && button.dataset.lang) {
        setLanguage(button.dataset.lang); return;
    }
    if (button.classList.contains('delete-btn')) {

        const type = button.dataset.type;
        const index = parseInt(button.dataset.index, 10);
        if (isNaN(index)) return;
        let wasDeleted = false;
        switch (type) {
            case 'support': if(supports[index]) { supports.splice(index, 1); wasDeleted = true; } break;
            case 'hinge': if(hinges[index]) { hinges.splice(index, 1); wasDeleted = true; } break;
            case 'concentratedLoad': if(concentratedLoads[index]) { concentratedLoads.splice(index, 1); wasDeleted = true; } break;
            case 'distributedLoad': if(distributedLoads[index]) { distributedLoads.splice(index, 1); wasDeleted = true; } break;
            case 'trapezoidalLoad': if(trapezoidalLoads[index]) { trapezoidalLoads.splice(index, 1); wasDeleted = true; } break;
            case 'concentratedMoment': if(concentratedMoments[index]) { concentratedMoments.splice(index, 1); wasDeleted = true; } break;
            case 'torsionMoment': if(torsionMoments[index]) { torsionMoments.splice(index, 1); wasDeleted = true; } break;
        }
        if (wasDeleted) updateAll(); return;
    }
    if (button.id === 'reset-btn') {
        beam=null; supports=[]; hinges=[]; concentratedLoads=[]; distributedLoads=[]; trapezoidalLoads=[];
        concentratedMoments=[]; torsionMoments=[];
        isDrawing=false; drawingStage = 0; isDrawingConcentratedLoad = false;
        isResizing=false; activeHandle=null; isDraggingSupport=false; draggedSupportIndex=null; isDraggingHinge=false; draggedHingeIndex=null; isMovingConcentratedLoad = false; draggedConcentratedLoadIndex = null; isResizingDistLoad = false; resizedDistLoadIndex = null; activeDistLoadHandle = null; isResizingTrapLoad = false; resizedTrapLoadIndex = null; activeTrapLoadHandle = null;

        isMovingConcentratedMoment = false; draggedConcentratedMomentIndex = null; clickedConcentratedMomentIndex = null;
        isMovingTorsionMoment = false; draggedTorsionMomentIndex = null; clickedTorsionMomentIndex = null;
        isDrawingConcentratedMoment = false; isDrawingTorsionMoment = false; momentStartPoint = null;
        firstTapPoint = null;
        
        if(document.getElementById('reactions-output')) document.getElementById('reactions-output').innerHTML="";
        if(shearChart){shearChart.destroy(); shearChart=null;} if(momentChart){momentChart.destroy(); momentChart=null;} if(normalForceChart){normalForceChart.destroy(); normalForceChart=null;} if(torsionChart){torsionChart.destroy(); torsionChart=null;}
        if(fbdCtx) fbdCtx.clearRect(0,0,fbdCanvas.clientWidth,fbdCanvas.clientHeight); 
        
        document.querySelectorAll('.tool-button').forEach(btn => btn.classList.remove('active'));
        document.getElementById('tool-beam').classList.add('active');
        currentTool = 'beam';

        updateHintBox(); // DÜZELTME: Sıfırlama sonrası ipucunu güncelle

        redrawCanvas(); updateTables(); updateDiagramsVisibility(); return;
    }
    
    if (button.id === 'center-btn' && beam) {
        centerDrawing();
        redrawCanvas();
        if (calculatedReactions || calculatedMomentReaction || calculatedAxialReaction) {
             drawFreeBodyDiagram(calculatedReactions, calculatedMomentReaction, null, calculatedAxialReaction);
        }
        return;
    }
    
    if (button.id === 'fullscreen-btn') {
        body.classList.toggle('fullscreen-mode');
        const isFullscreen = body.classList.contains('fullscreen-mode');
        const currentLang = document.documentElement.lang || 'tr';
        const expandIcon = fullscreenBtn.querySelector('.icon-expand');
        const shrinkIcon = fullscreenBtn.querySelector('.icon-shrink');
        if (isFullscreen) {
            expandIcon.style.display = 'none'; shrinkIcon.style.display = 'block';
            button.setAttribute('title', translations[currentLang]['hideFullscreen']);
            button.dataset.i18nTitle = 'hideFullscreen';
        } else {
            expandIcon.style.display = 'block'; shrinkIcon.style.display = 'none';
            button.setAttribute('title', translations[currentLang]['showFullscreen']);
            button.dataset.i18nTitle = 'showFullscreen';
        }
        setTimeout(() => {
            if(beam) { centerDrawing(); }
            performCanvasUpdate();
        }, 100);
        return;
    }

    // --- YENİ EKLENEN KOD BLOĞU ---
    if (button.id.startsWith('download-')) {
        switch(button.id) {
            case 'download-model-btn': downloadDrawingAsTrueSvg('model', 'vetin_structural_model.svg'); break;
            case 'download-fbd-btn': downloadDrawingAsTrueSvg('fbd', 'vetin_free_body_diagram.svg'); break;
            case 'download-nfd-btn': if (normalForceChart) downloadCanvasAsPngInSvg(normalForceChart.canvas, 'vetin_normal_force_diagram.png'); break;
            case 'download-sfd-btn': if (shearChart) downloadCanvasAsPngInSvg(shearChart.canvas, 'vetin_shear_force_diagram.png'); break;
            case 'download-bmd-btn': if (momentChart) downloadCanvasAsPngInSvg(momentChart.canvas, 'vetin_bending_moment_diagram.png'); break;
            case 'download-tmd-btn': if (torsionChart) downloadCanvasAsPngInSvg(torsionChart.canvas, 'vetin_torsion_diagram.png'); break;
            case 'download-ecd-btn': if (elasticCurveChart) downloadCanvasAsPngInSvg(elasticCurveChart.canvas, 'vetin_elastic_curve_diagram.png'); break;
            case 'download-tables-btn': downloadTablesAsCsv('vetin_data_tables.csv'); break;
        }
        return;
    }

    if (button.classList.contains('toggle-button')) {
        const parentContainer = button.closest('.diagram-container, #data-tables-container');
        if(!parentContainer) return;
        let contentWrapper = parentContainer.querySelector('.content-wrapper, .table-grid-wrapper');
        if (!contentWrapper) return;
        const currentLang = document.documentElement.lang || 'tr';
        const showIcon = `<svg viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5C21.27 7.61 17 4.5 12 4.5zm0 13c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6zm0-10c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4z"/></svg>`;
        const hideIcon = `<svg viewBox="0 0 24 24"><path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l3.28 3.28.02.06C3.93 8.5 2.73 10.11 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l3.15 3.15L21 21.18 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02.05c0-1.66-1.34-3-3-3l-.05-.02-3.15-3.15-.05-.02c0-1.66 1.34-3-3z"/></svg>`;
        contentWrapper.classList.toggle('hidden');
        const isHidden = contentWrapper.classList.contains('hidden');
        
        if (parentContainer.id) {
            userVisibilityPrefs[parentContainer.id] = !isHidden;
        }

        if (isHidden) { button.innerHTML = showIcon; button.setAttribute('title', translations[currentLang]['show']); button.dataset.i18nTitle = 'show'; } 
        else { 
            button.innerHTML = hideIcon; button.setAttribute('title', translations[currentLang]['hide']); button.dataset.i18nTitle = 'hide'; 
            if (parentContainer.id === 'elastic-curve-3d-wrapper' && typeof onWindowResize3d === 'function') {
                setTimeout(() => {
                    onWindowResize3d();
                    drawElasticCurve3D();
                }, 50);
            }
        }
        return;
    }
    if (button.classList.contains('tool-button')) {
        document.querySelectorAll('.tool-button').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        currentTool = button.id.replace('tool-', '');

        updateHintBox(); // DÜZELTME: Araç değiştiğinde i18n ipucunu güncelle

        isDrawing = false; drawingStage = 0; loadStartPoint = null; firstTapPoint = null;
        confirmedMagnitude1 = 0; isDrawingConcentratedLoad = false;
        isDrawingConcentratedMoment = false; isDrawingTorsionMoment = false; momentStartPoint = null;
        redrawCanvas();
        return;
    }
    // --- KOD BLOĞU SONU ---
});

gridSizeInput.addEventListener('change', redrawCanvas);
metersPerGridInput.addEventListener('change', () => { if (beam) { beam.metersPerGridOnCreation = parseFloat(metersPerGridInput.value); } redrawCanvas(); updateAll(); });
kNPerGridInput.addEventListener('change', redrawCanvas);
elasticityInput.addEventListener('change', updateAll);
momentOfInertiaInput.addEventListener('change', updateAll);
fileInput.addEventListener('change', (event) => { const file = event.target.files; if (!file) return; loadProjectFromFile(file); fileInput.value = ''; });

function handleTouchStart(e) {
    // --- DEĞİŞİKLİK: Kaydırmayı engellemek için hem <html> hem <body> hedefleniyor ---
    document.documentElement.classList.add('no-scroll');
    document.body.classList.add('no-scroll');
    e.preventDefault(); 
    
    const rawPos = getRawMousePos(e);
    const snappedPos = getSnappedMousePos(e);
    const draggableTools = ['beam', 'pin-support', 'roller-support', 'fixed-support', 'hinge'];
    const mobileDrawableLoads = ['concentrated-load', 'concentrated-moment', 'torsion-moment', 'distributed-load', 'triangular-load'];

    if (currentTool === 'edit') {
        activeHandle = getHandleAtPos(rawPos);
        draggedSupportIndex = getSupportAtPos(rawPos);
        draggedHingeIndex = getHingeAtPos(rawPos);
        const distLoadHandleData = getDistLoadHandleAtPos(rawPos);
        const trapLoadHandleData = getTrapLoadHandleAtPos(rawPos);
        draggedConcentratedLoadIndex = getConcentratedLoadAtPos(rawPos);
        clickedConcentratedLoadIndex = draggedConcentratedLoadIndex; 
        draggedDistLoadIndex = getDistLoadAtPos(rawPos);
        clickedDistLoadIndex = draggedDistLoadIndex;
        draggedTrapLoadIndex = getTrapLoadAtPos(rawPos);
        clickedTrapLoadIndex = draggedTrapLoadIndex;
        draggedConcentratedMomentIndex = getConcentratedMomentAtPos(rawPos);
        clickedConcentratedMomentIndex = draggedConcentratedMomentIndex;
        draggedTorsionMomentIndex = getTorsionMomentAtPos(rawPos);
        clickedTorsionMomentIndex = draggedTorsionMomentIndex;

        if (activeHandle) isResizing = true; 
        else if (distLoadHandleData) { isResizingDistLoad = true; resizedDistLoadIndex = distLoadHandleData.index; activeDistLoadHandle = distLoadHandleData.handle; } 
        else if (trapLoadHandleData) { isResizingTrapLoad = true; resizedTrapLoadIndex = trapLoadHandleData.index; activeTrapLoadHandle = trapLoadHandleData.handle; } 
        else if (draggedSupportIndex !== null) isDraggingSupport = true;
        else if (draggedHingeIndex !== null) isDraggingHinge = true;
        else if (draggedConcentratedLoadIndex !== null) isMovingConcentratedLoad = true;
        else if (draggedDistLoadIndex !== null) isMovingDistLoad = true;
        else if (draggedTrapLoadIndex !== null) isMovingTrapLoad = true;
        else if (draggedConcentratedMomentIndex !== null) isMovingConcentratedMoment = true;
        else if (draggedTorsionMomentIndex !== null) isMovingTorsionMoment = true;
    } 
    
    else if (mobileDrawableLoads.includes(currentTool)) {
        if (!beam) return;
        if (currentTool === 'concentrated-load') {
            isDrawingConcentratedLoad = true;
            drawingStage = 1;
            concentratedLoadStartPoint = { x: snappedPos.x, y: beam.startY - (parseInt(gridSizeInput.value) / 2) };
        } else if (currentTool === 'concentrated-moment' || currentTool === 'torsion-moment') {
            isDrawingConcentratedMoment = (currentTool === 'concentrated-moment');
            isDrawingTorsionMoment = (currentTool === 'torsion-moment');
            drawingStage = 1;
            momentStartPoint = { x: snappedPos.x, y: rawPos.y };
        } else if (currentTool === 'distributed-load') {
            isDrawing = true;
            drawingStage = 1;
            loadStartPoint = { x: snappedPos.x, y: rawPos.y };
        } else if (currentTool === 'triangular-load') {
            isDrawing = true;
            drawingStage = 1;
            loadStartPoint = { x: snappedPos.x, y: rawPos.y };
        }
    } else if (draggableTools.includes(currentTool)) {
        if (!beam && currentTool !== 'beam') return;
        isDrawing = true;
        const gridSize = parseInt(gridSizeInput.value);
        const canvasCenterY = canvas.clientHeight / 2;
        const nearestGridY = Math.floor(canvasCenterY / gridSize) * gridSize;
        startPoint = { x: snappedPos.x, y: nearestGridY + gridSize / 2 };
    }
}

function handleTouchEnd(e) {
    // --- DEĞİŞİKLİK: Kilidi hem <html> hem <body> etiketinden kaldırıyoruz ---
    document.documentElement.classList.remove('no-scroll');
    document.body.classList.remove('no-scroll');

    const pos = getSnappedMousePos(e);
    const rawPos = getRawMousePos(e);

    if (currentTool === 'edit' && !hasDragged) {
        if (clickedConcentratedLoadIndex !== null) {
            const load = concentratedLoads[clickedConcentratedLoadIndex];
            const newMagStr = prompt("Yeni yük şiddetini girin (kN):", load.magnitude.toFixed(2));
            if (newMagStr !== null) {
                const newMag = parseFloat(newMagStr);
                if (!isNaN(newMag)) load.magnitude = newMag;
            }
            const newAngleStr = prompt("Yeni yük açısını girin (°):", (load.angle * 180 / Math.PI).toFixed(1));
            if (newAngleStr !== null) {
                const newAngle = parseFloat(newAngleStr);
                if (!isNaN(newAngle)) load.angle = newAngle * Math.PI / 180;
            }
        } else if (clickedDistLoadIndex !== null) {
            const load = distributedLoads[clickedDistLoadIndex];
            const newMagStr = prompt("Yeni yayılı yük şiddetini girin (kN/m):", (load.magnitude).toFixed(2));
            if (newMagStr !== null) {
                const newMag = parseFloat(newMagStr);
                if (!isNaN(newMag)) load.magnitude = newMag;
            }
        } else if (clickedTrapLoadIndex !== null) {
            const load = trapezoidalLoads[clickedTrapLoadIndex];
            const newMag1Str = prompt("Yeni başlangıç şiddetini girin (kN/m):", (load.startMagnitude).toFixed(2));
            if (newMag1Str !== null) {
                const newMag1 = parseFloat(newMag1Str);
                if (!isNaN(newMag1)) {
                    const newMag2Str = prompt("Yeni bitiş şiddetini girin (kN/m):", (load.endMagnitude).toFixed(2));
                    if (newMag2Str !== null) {
                       const newMag2 = parseFloat(newMag2Str);
                       if (!isNaN(newMag2)) {
                            load.startMagnitude = newMag1;
                            load.endMagnitude = newMag2;
                        }
                    }
                }
            }
        } else if (clickedConcentratedMomentIndex !== null) {
            const moment = concentratedMoments[clickedConcentratedMomentIndex];
            const newMagStr = prompt("Yeni eğilme momenti şiddetini girin (kNm):", moment.magnitude.toFixed(2));
            if (newMagStr !== null) {
                const newMag = parseFloat(newMagStr);
                if (!isNaN(newMag)) moment.magnitude = newMag;
            }
        } else if (clickedTorsionMomentIndex !== null) {
            const moment = torsionMoments[clickedTorsionMomentIndex];
            const newMagStr = prompt("Yeni burulma momenti şiddetini girin (kNm):", moment.magnitude.toFixed(2));
            if (newMagStr !== null) {
                const newMag = parseFloat(newMagStr);
                if (!isNaN(newMag)) moment.magnitude = newMag;
            }
        }
    }

    if (isDrawingConcentratedLoad) {
        const startPos = concentratedLoadStartPoint;
        const endPos = rawPos;
        const dx = endPos.x - startPos.x;
        const dy = endPos.y - startPos.y;
        if (Math.abs(dx) > EPSILON || Math.abs(dy) > EPSILON) {
            const finalAngleRad = Math.atan2(dy, dx);
            const length = Math.sqrt(dx * dx + dy * dy);
            const gridSize = parseInt(gridSizeInput.value), kNPerGrid = parseFloat(kNPerGridInput.value) || 1;
            const magnitude = (length / gridSize) * kNPerGrid;
            concentratedLoads.push({ x: startPos.x, y: startPos.y, magnitude: magnitude, angle: finalAngleRad });
        }
    } else if (isDrawingConcentratedMoment || isDrawingTorsionMoment) {
        const startPos = momentStartPoint;
        const endPos = rawPos;
        const dy = endPos.y - startPos.y;
        const magnitude = -(dy / 5);
        if (Math.abs(magnitude) > EPSILON) {
            const finalX = pos.x; 

            if (isDrawingConcentratedMoment) { concentratedMoments.push({ x: finalX, y: beam.startY, magnitude: magnitude }); } 
            else { torsionMoments.push({ x: finalX, y: beam.startY, magnitude: magnitude }); }
        }
    } else if (isDrawing && currentTool === 'distributed-load') {
        const gridSize = parseInt(gridSizeInput.value), kNPerGrid = parseFloat(kNPerGridInput.value) || 1;
        const beamTopY = beam.startY - (gridSize / 2);
        const endVerticalDistance = rawPos.y - beamTopY;
        const endMag = (endVerticalDistance / gridSize) * kNPerGrid;
        distributedLoads.push({ startX: loadStartPoint.x, endX: pos.x, magnitude: endMag });
    } else if (isDrawing && currentTool === 'triangular-load') {
         if (drawingStage === 2) {
            const gridSize = parseInt(gridSizeInput.value), kNPerGrid = parseFloat(kNPerGridInput.value) || 1;
            const beamTopY = beam.startY - (gridSize / 2);
            const startMag = confirmedMagnitude1;
            const endMag = ((rawPos.y - beamTopY) / gridSize) * kNPerGrid;
            trapezoidalLoads.push({ startX: loadStartPoint.x, endX: pos.x, startMagnitude: startMag, endMagnitude: endMag });
        }
    } else if (isDrawing && currentTool === 'beam') {
        if (Math.abs(startPoint.x - pos.x) > 0) { 
            beam = { startX: Math.min(startPoint.x, pos.x), startY: startPoint.y, endX: Math.max(startPoint.x, pos.x), gridSizeOnCreation: parseInt(gridSizeInput.value), metersPerGridOnCreation: parseFloat(metersPerGridInput.value) }; 
            beam.length = beam.endX - beam.startX; 
        }
    } else if (isDrawing && ['pin-support', 'roller-support', 'fixed-support'].includes(currentTool)) {
        if (beam) supports.push({ type: currentTool, x: pos.x });
    } else if (isDrawing && currentTool === 'hinge') {
        if (beam) hinges.push({ x: pos.x });
    }
    
    isDrawing = false; isDrawingConcentratedLoad = false; isDrawingConcentratedMoment = false; isDrawingTorsionMoment = false;
    concentratedLoadStartPoint = null; momentStartPoint = null; drawingStage = 0; loadStartPoint = null; confirmedMagnitude1 = 0;
    
    isResizing = false; activeHandle = null; isDraggingSupport = false; draggedSupportIndex = null; isDraggingHinge = false; draggedHingeIndex = null;
    isMovingConcentratedLoad = false; draggedConcentratedLoadIndex = null; isMovingDistLoad = false; draggedDistLoadIndex = null; isMovingTrapLoad = false; draggedTrapLoadIndex = null;
    isResizingDistLoad = false; resizedDistLoadIndex = null; activeDistLoadHandle = null; isResizingTrapLoad = false; resizedTrapLoadIndex = null; activeTrapLoadHandle = null;
    isMovingConcentratedMoment = false; draggedConcentratedMomentIndex = null; isMovingTorsionMoment = false; draggedTorsionMomentIndex = null;
    hasDragged = false; clickedConcentratedLoadIndex = null; clickedDistLoadIndex = null; clickedTrapLoadIndex = null; clickedConcentratedMomentIndex = null; clickedTorsionMomentIndex = null;

    redrawCanvas(); updateAll();
}

function handleTouchMove(e) {
    e.preventDefault();
    
    const rawPos = getRawMousePos(e); 
    const snappedPos = getSnappedMousePos(e);
    currentMousePos = snappedPos; 
    currentRawMousePos = rawPos; 
    
    let needsLiveUpdate = false;
    if (isResizing) { hasDragged = true; const gridSize = parseInt(gridSizeInput.value); if (activeHandle === 'start') { beam.startX = Math.min(snappedPos.x, beam.endX - gridSize); } else { beam.endX = Math.max(snappedPos.x, beam.startX + gridSize); } beam.length = beam.endX - beam.startX; needsLiveUpdate = true; } 
    else if (isResizingDistLoad) { hasDragged = true; const load = distributedLoads[resizedDistLoadIndex]; if (activeDistLoadHandle === 'start') { load.startX = snappedPos.x; } else { load.endX = snappedPos.x; } needsLiveUpdate = true; } 
    else if (isResizingTrapLoad) { hasDragged = true; const load = trapezoidalLoads[resizedTrapLoadIndex]; if (activeDistLoadHandle === 'start') { load.startX = snappedPos.x; } else { load.endX = snappedPos.x; } needsLiveUpdate = true; } 
    else if (isDraggingSupport) { hasDragged = true; supports[draggedSupportIndex].x = snappedPos.x; needsLiveUpdate = true; } 
    else if (isDraggingHinge) { hasDragged = true; hinges[draggedHingeIndex].x = snappedPos.x; needsLiveUpdate = true; }
    else if (isMovingConcentratedLoad) { hasDragged = true; concentratedLoads[draggedConcentratedLoadIndex].x = snappedPos.x; needsLiveUpdate = true; }
    else if (isMovingDistLoad) { hasDragged = true; const load = distributedLoads[draggedDistLoadIndex]; const dx = snappedPos.x - (load.startX + (load.endX - load.startX) / 2); load.startX += dx; load.endX += dx; needsLiveUpdate = true; }
    else if (isMovingTrapLoad) { hasDragged = true; const load = trapezoidalLoads[draggedTrapLoadIndex]; const dx = snappedPos.x - (load.startX + (load.endX - load.startX) / 2); load.startX += dx; load.endX += dx; needsLiveUpdate = true; }
    else if (isMovingConcentratedMoment) { hasDragged = true; concentratedMoments[draggedConcentratedMomentIndex].x = snappedPos.x; needsLiveUpdate = true; }
    else if (isMovingTorsionMoment) { hasDragged = true; torsionMoments[draggedTorsionMomentIndex].x = snappedPos.x; needsLiveUpdate = true; }
    
    if (isResizing || isDraggingSupport || isDraggingHinge || isMovingConcentratedLoad || isResizingDistLoad || isResizingTrapLoad || isMovingDistLoad || isMovingTrapLoad || isMovingConcentratedMoment || isMovingTorsionMoment || isDrawing || isDrawingConcentratedLoad || isDrawingConcentratedMoment || isDrawingTorsionMoment) {
        hasDragged = true;
    }
    
    if (isDrawing && currentTool === 'triangular-load') {
        const gridSize = parseInt(gridSizeInput.value);
        if (drawingStage === 1) {
            if (Math.abs(snappedPos.x - loadStartPoint.x) >= gridSize) {
                const beamTopY = beam.startY - (gridSize / 2);
                const kNPerGrid = parseFloat(kNPerGridInput.value) || 1;
                const startMag = ((rawPos.y - beamTopY) / gridSize) * kNPerGrid;
                confirmedMagnitude1 = startMag;
                drawingStage = 2;
            }
        }
    }

    redrawCanvas();
    if(hasDragged) updateTables();

    if (isDrawing && currentTool === 'beam') {
        drawDragPreview();
        const gridSize = parseInt(gridSizeInput.value);
        const beamBottomLineY = Math.round((startPoint.y + gridSize / 2) / gridSize) * gridSize;
        const dimensionY = beamBottomLineY + (3 * gridSize);
        drawPreviewDimension(ctx, snappedPos.x, [startPoint.x], dimensionY);
    } else if (isDrawing && beam && ['pin-support', 'roller-support', 'fixed-support', 'hinge'].includes(currentTool)) {
        if (currentTool === 'hinge') { drawHinge(ctx, snappedPos.x, beam.startY, true); } 
        else { drawSupport(ctx, currentTool, snappedPos.x, beam.startY, true); }
        let allPoints = [beam.startX, beam.endX, ...supports.map(s => s.x), ...hinges.map(h => h.x)];
        const gridSize = parseInt(gridSizeInput.value);
        const beamBottomLineY = Math.round((beam.startY + gridSize / 2) / gridSize) * gridSize;
        const dimensionY = beamBottomLineY + (3 * gridSize);
        drawPreviewDimension(ctx, snappedPos.x, allPoints, dimensionY);
    }

    if (needsLiveUpdate && isSystemStable()) { calculate(true); calculateAndDrawAxialDiagram(true); }
}

canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
canvas.addEventListener('touchend', handleTouchEnd);
canvas.addEventListener('touchmove', handleTouchMove, { passive: false });

window.addEventListener('resize', () => { setTimeout(performCanvasUpdate, 100); });
}