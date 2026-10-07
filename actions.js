// actions.js - Masaüstü ve mobilde ortak kullanıcı eylemleri
//
// Buton eylemleri (sıfırla, ortala, kaydet/aç, tam ekran, indir, panel
// göster/gizle, tablodan silme, araç seçimi, dil), model yükleme ve ayar
// girdilerinin dinleyicileri burada tek bir kez tanımlanır. desktop-events.js
// ve mobile-events.js yalnızca platforma özgü işaretçi (fare/dokunmatik)
// etkileşimini içerir.

/** Model değişikliğini işler: tuvali yeniden boyutlandırıp çizer, hesabı ve diyagramları yeniler. */
function commitModelChange() {
    scaleCanvasForHiDPI(canvas, ctx);
    redrawCanvas();
    updateAll();
}

// Etkileşim (çizim/sürükleme) durum bayraklarını başlangıç değerine döndürür
function resetInteractionState() {
    isDrawing = false; drawingStage = 0; loadStartPoint = null; confirmedMagnitude1 = 0;
    isResizing = false; activeHandle = null; hasDragged = false;
    isDrawingConcentratedLoad = false; concentratedLoadStartPoint = null;
    isDrawingConcentratedMoment = false; isDrawingTorsionMoment = false; momentStartPoint = null;
    isDraggingSupport = false; draggedSupportIndex = null;
    isDraggingHinge = false; draggedHingeIndex = null;
    isMovingConcentratedLoad = false; draggedConcentratedLoadIndex = null; clickedConcentratedLoadIndex = null;
    isResizingDistLoad = false; resizedDistLoadIndex = null; activeDistLoadHandle = null; clickedDistLoadIndex = null;
    isResizingTrapLoad = false; resizedTrapLoadIndex = null; activeTrapLoadHandle = null; clickedTrapLoadIndex = null;
    isMovingDistLoad = false; draggedDistLoadIndex = null;
    isMovingTrapLoad = false; draggedTrapLoadIndex = null;
    isMovingConcentratedMoment = false; draggedConcentratedMomentIndex = null; clickedConcentratedMomentIndex = null;
    isMovingTorsionMoment = false; draggedTorsionMomentIndex = null; clickedTorsionMomentIndex = null;
    firstTapPoint = null;
}

function selectTool(toolName) {
    document.querySelectorAll('.tool-button').forEach(btn => btn.classList.remove('active'));
    const btn = document.getElementById('tool-' + toolName);
    if (btn) btn.classList.add('active');
    currentTool = toolName;
    updateHintBox();
}

/**
 * Uygulamayı boş modele döndürür (onay sorulmadan; onay ui-handler.js'te).
 * Diğer modüller sıfırlamayı 'vetin:model-reset' olayıyla dinler.
 */
function resetApplication() {
    clearModelState();
    resetInteractionState();
    lastAnalysis = null;
    calculatedReactions = []; calculatedMomentReaction = 0; calculatedAxialReaction = null;

    const output = document.getElementById('reactions-output');
    if (output) output.innerHTML = '';
    [shearChart, momentChart, normalForceChart, torsionChart].forEach(c => { if (c) c.destroy(); });
    shearChart = null; momentChart = null; normalForceChart = null; torsionChart = null;
    if (fbdCtx) fbdCtx.clearRect(0, 0, fbdCanvas.clientWidth, fbdCanvas.clientHeight);

    selectTool('beam');
    document.getElementById('elastic-curve-diagram-wrapper')?.classList.add('hidden');
    document.getElementById('elastic-curve-3d-wrapper')?.classList.add('hidden');

    redrawCanvas();
    updateTables();
    updateDiagramsVisibility();
    document.dispatchEvent(new CustomEvent('vetin:model-reset'));
}

/**
 * Dosya verisini (sürüm 1 piksel ya da sürüm 2 metre) uygulamaya yükler.
 * @returns {boolean} başarılıysa true
 */
function loadModelIntoApp(data) {
    let parsed;
    try {
        parsed = deserializeModel(data, { startX: getGridSize() * 5, gridSize: getGridSize(), metersPerGrid: getMetersPerGrid() });
    } catch (err) {
        console.error('Model verisi okunamadı:', err);
        alert('Geçersiz veya bozuk bir model dosyası seçildi.');
        return false;
    }
    resetApplication();
    setModelState(parsed);
    // Metre cinsinden (sürüm 2) dosyalar tuvalde ortalanır; eski dosyalar kayıtlı konumunda açılır
    if (parsed.version >= 2) centerDrawing();
    commitModelChange();
    window.__lastSavedHash = getCurrentModelHash();
    return true;
}

function loadProjectFromFile(file) {
    if (!file) return;
    // Bazı sistemler .json için MIME türü vermez; uzantı da kabul edilir
    if (!/json/.test(file.type) && !/\.json$/i.test(file.name || '')) {
        console.warn('Sadece JSON dosyaları desteklenmektedir.');
        return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
        let data;
        try { data = JSON.parse(e.target.result); }
        catch (err) { console.error('JSON dosyası okunurken hata oluştu:', err); alert('Geçersiz veya bozuk bir model dosyası seçildi.'); return; }
        loadModelIntoApp(data);
    };
    reader.readAsText(file);
}

function saveModelToFile() {
    if (!beam) { alert('Kaydedilecek bir model bulunmuyor.'); return; }
    downloadModelAsJson();
}

function toggleFullscreen(button) {
    body.classList.toggle('fullscreen-mode');
    const isFullscreen = body.classList.contains('fullscreen-mode');
    const currentLang = document.documentElement.lang || 'tr';
    const key = isFullscreen ? 'hideFullscreen' : 'showFullscreen';
    fullscreenBtn.querySelector('.icon-expand').style.display = isFullscreen ? 'none' : 'block';
    fullscreenBtn.querySelector('.icon-shrink').style.display = isFullscreen ? 'block' : 'none';
    button.setAttribute('title', translations[currentLang][key]);
    button.dataset.i18nTitle = key;
    setTimeout(() => {
        if (beam) centerDrawing();
        commitModelChange();
    }, 100);
}

function togglePanel(button) {
    const panel = button.closest('.diagram-container, #data-tables-container');
    if (!panel) return;
    const content = panel.querySelector('.content-wrapper, .table-grid-wrapper');
    if (!content) return;
    const currentLang = document.documentElement.lang || 'tr';
    content.classList.toggle('hidden');
    const isHidden = content.classList.contains('hidden');
    if (panel.id) userVisibilityPrefs[panel.id] = !isHidden;

    const key = isHidden ? 'show' : 'hide';
    button.innerHTML = isHidden ? ICON_EYE_SHOW : ICON_EYE_HIDE;
    button.setAttribute('title', translations[currentLang][key]);
    button.dataset.i18nTitle = key;
    if (isHidden) return;

    redrawFbdIfShown(panel); // gizliyken değişen SCD'yi yeniden çiz
    if (panel.id === 'elastic-curve-3d-wrapper' && typeof onWindowResize3d === 'function') {
        setTimeout(() => { onWindowResize3d(); drawElasticCurve3D(); }, 50);
    }
}

const DELETABLE_ARRAYS = {
    support: () => supports, hinge: () => hinges,
    concentratedLoad: () => concentratedLoads, distributedLoad: () => distributedLoads,
    trapezoidalLoad: () => trapezoidalLoads, concentratedMoment: () => concentratedMoments,
    torsionMoment: () => torsionMoments
};

function deleteModelItem(type, index) {
    const getter = DELETABLE_ARRAYS[type];
    const arr = getter && getter();
    if (!arr || isNaN(index) || !arr[index]) return;
    arr.splice(index, 1);
    commitModelChange();
}

const DOWNLOAD_ACTIONS = {
    'download-model-btn':  () => downloadDrawingAsTrueSvg('model', 'vetin_structural_model.svg'),
    'download-fbd-btn':    () => downloadDrawingAsTrueSvg('fbd', 'vetin_free_body_diagram.svg'),
    'download-nfd-btn':    () => normalForceChart && downloadCanvasAsPngInSvg(normalForceChart.canvas, 'vetin_normal_force_diagram.png'),
    'download-sfd-btn':    () => shearChart && downloadCanvasAsPngInSvg(shearChart.canvas, 'vetin_shear_force_diagram.png'),
    'download-bmd-btn':    () => momentChart && downloadCanvasAsPngInSvg(momentChart.canvas, 'vetin_bending_moment_diagram.png'),
    'download-tmd-btn':    () => torsionChart && downloadCanvasAsPngInSvg(torsionChart.canvas, 'vetin_torsion_diagram.png'),
    'download-ecd-btn':    () => elasticCurveChart && downloadCanvasAsPngInSvg(elasticCurveChart.canvas, 'vetin_elastic_curve_diagram.png'),
    'download-tables-btn': () => downloadTablesAsCsv('vetin_data_tables.csv')
};

// Belgedeki tüm tıklamalar için ortak işleyici (olay yetkilendirmesi)
function handleSharedClick(event) {
    const target = event.target;

    // Dar ekranda araç grubu başlığı akordiyon gibi açılıp kapanır
    if (target.matches('.tool-group-title')) {
        if (window.innerWidth <= 800) {
            const group = target.closest('.tool-group');
            if (!group) return;
            document.querySelectorAll('.toolbar .tool-group').forEach(g => { if (g !== group) g.classList.remove('is-open'); });
            group.classList.toggle('is-open');
        }
        return;
    }

    const button = target.closest('button');
    if (!button) {
        // Kapalı bir panelin herhangi bir yerine tıklanınca panel açılır
        const panel = target.closest('.diagram-container, #data-tables-container');
        const content = panel && panel.querySelector('.content-wrapper, .table-grid-wrapper');
        if (content && content.classList.contains('hidden')) panel.querySelector('.toggle-button')?.click();
        return;
    }

    if (button.parentElement.classList.contains('language-switcher') && button.dataset.lang) { setLanguage(button.dataset.lang); return; }
    if (button.classList.contains('delete-btn')) { deleteModelItem(button.dataset.type, parseInt(button.dataset.index, 10)); return; }

    switch (button.id) {
        case 'reset-btn': resetApplication(); return;
        case 'center-btn': if (beam) { centerDrawing(); commitModelChange(); } return;
        case 'save-btn': saveModelToFile(); return;
        case 'open-btn': document.getElementById('file-input').click(); return;
        case 'fullscreen-btn': toggleFullscreen(button); return;
    }
    if (DOWNLOAD_ACTIONS[button.id]) { DOWNLOAD_ACTIONS[button.id](); return; }
    if (button.classList.contains('toggle-button')) { togglePanel(button); return; }
    if (button.classList.contains('tool-button')) {
        selectTool(button.id.replace('tool-', ''));
        resetInteractionState();
        redrawCanvas();
    }
}

function initializeSharedActions() {
    document.body.addEventListener('click', handleSharedClick);

    gridSizeInput.addEventListener('change', redrawCanvas);
    kNPerGridInput.addEventListener('change', redrawCanvas);
    metersPerGridInput.addEventListener('change', () => {
        if (beam) beam.metersPerGridOnCreation = getMetersPerGrid();
        redrawCanvas();
        updateAll();
    });
    elasticityInput.addEventListener('change', updateAll);
    momentOfInertiaInput.addEventListener('change', updateAll);

    const fileInput = document.getElementById('file-input');
    fileInput.addEventListener('change', (event) => {
        const file = event.target.files && event.target.files[0];
        if (file) loadProjectFromFile(file);
        fileInput.value = '';
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && body.classList.contains('fullscreen-mode')) fullscreenBtn.click();
    });
    window.addEventListener('resize', () => { setTimeout(commitModelChange, 100); });
}
