// common/localization.js

/**
 * Sayfanın ilk HTML yapısını (toolbar, diagram kapları, footer vb.) oluşturur.
 * @param {string} lang - Başlangıçta kullanılacak dil kodu ('tr', 'en' vb.).
 */
function buildInitialHTML(lang) {
    const t = translations[lang];

    // Toolbar HTML'ini oluştur
    const toolbarHTML = `
        <div class="toolbar-scroll-wrapper">
            <button class="toolbar-scroll-btn toolbar-scroll-btn--left" id="toolbar-scroll-left"><svg viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg></button>
            <div class="toolbar-left">
            <div class="tool-group">
                <p class="tool-group-title" data-i18n="elementGroup">${t.elementGroup}</p>
                <div class="tool-group-buttons">
                    <button class="tool-button active" id="tool-beam" data-i18n-title="beamTitle" title="${t.beamTitle}">
                        <svg viewBox="0 0 24 24"><path d="M 2 8 h 20 v 8 H 2 z"></path></svg>
                        <span data-i18n="beam">${t.beam}</span>
                    </button>
                </div>
            </div>
            <div class="tool-group">
                <p class="tool-group-title" data-i18n="supports">${t.supports}</p>
                <div class="tool-group-buttons">
                    <button class="tool-button" id="tool-pin-support" data-i18n-title="pinSupportTitle" title="${t.pinSupportTitle}"><svg viewBox="0 0 24 24"><path d="m 12 8 L 5 17 L 19 17 Z M 2 19 l 19 0"></path></svg><span data-i18n="pinSupport">${t.pinSupport}</span></button>
                    <button class="tool-button" id="tool-fixed-support" data-i18n-title="fixedSupportTitle" title="${t.fixedSupportTitle}"><svg viewBox="0 0 24 24"><path d="M 8 2 V 22 M 8 4 L 3 9 M 8 10 L 3 15 M 8 16 L 3 21"></path></svg><span data-i18n="fixedSupport">${t.fixedSupport}</span></button>
                    <button class="tool-button" id="tool-roller-support" data-i18n-title="rollerSupportTitle" title="${t.rollerSupportTitle}"><svg viewBox="0 0 24 24"><path d="m 12 8 L 5 17 L 19 17 Z M 10 19 A 1 1 0 0 0 14 19 A 1 1 0 0 0 10 19"></path></svg><span data-i18n="rollerSupport">${t.rollerSupport}</span></button>
                    <button class="tool-button" id="tool-hinge" data-i18n-title="hingeTitle" title="${t.hingeTitle}"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"></circle></svg><span data-i18n="hinge">${t.hinge}</span></button>
                </div>
            </div>
            
            <!-- === DEĞİŞİKLİK BURADA BAŞLIYOR === -->
            <div class="tool-group">
                <p class="tool-group-title" data-i18n="loads">${t.loads}</p>
                <div class="tool-group-buttons tool-group-buttons--loads">
                    <button class="tool-button" id="tool-concentrated-load" data-i18n-title="pointLoadTitle" title="${t.pointLoadTitle}"><svg viewBox="0 0 24 24"><path d="M12 4v14m-4-4l4 4 4-4"></path></svg><span data-i18n="pointLoad">${t.pointLoad}</span></button>
                    <div class="loads-grid">
                        <button class="tool-button" id="tool-concentrated-moment" data-i18n-title="momentTitle" title="${t.momentTitle}"><svg viewBox="0 0 24 24"><path d="M 12 5 A 7 7 0 1 0 12 19 M 12 5 L 10 9 M 12 5 L 8 3"></path></svg><span data-i18n="bendingMoment">${t.bendingMoment}</span></button>
                        <button class="tool-button" id="tool-distributed-load" data-i18n-title="distLoadTitle" title="${t.distLoadTitle}"><svg viewBox="0 0 24 24"><path d="M 6 8 h 16 M 6 14 V 8 m 4 6 V 8 m 4 6 V 8 M 18 14 V 8 M 22 14 V 8 M 5 13 L 6 14 M 7 13 L 6 14 M 9 13 L 10 14 M 11 13 L 10 14 M 13 13 L 14 14 M 15 13 L 14 14 M 17 13 L 18 14 M 19 13 L 19 13 L 18 14 M 21 13 L 22 14 M 23 13 L 22 14"></path></svg><span data-i18n="distributedLoad">${t.distributedLoad}</span></button>
                        <button class="tool-button" id="tool-torsion-moment" data-i18n-title="torsionTitle" title="${t.torsionTitle}"><svg viewBox="0 0 24 24"><path d="M 2 12 H 22 M 18 9 L 22 12 L 18 15 M 15 9 L 19 12 L 15 15 M 6 15 L 2 12 L 6 9 M 9 15 L 5 12 L 9 9"></path></svg><span data-i18n="torsionMoment">${t.torsionMoment}</span></button>
                        <button class="tool-button" id="tool-triangular-load" data-i18n-title="trapLoadTitle" title="${t.trapLoadTitle}"><svg viewBox="0 0 24 24"><path d="M 2 14 M 22 4 L 2 14 M 6 14 V 12 m 4 2 V 10 m 4 4 V 8 M 18 14 V 6 M 22 14 V 4 M 5 13 L 6 14 M 7 13 L 6 14 M 9 13 L 10 14 M 11 13 L 10 14 M 13 13 L 14 14 M 15 13 L 14 14 M 17 13 L 18 14 M 19 13 L 19 13 L 18 14 M 21 13 L 22 14 M 23 13 L 22 14"></path></svg><span data-i18n="trapezoidalLoad">${t.trapezoidalLoad}</span></button>
                    </div>
                </div>
            </div>
            <!-- === DEĞİŞİKLİK BURADA BİTİYOR === -->

            <div class="tool-group">
                <p class="tool-group-title" data-i18n="actions">${t.actions}</p>
                <div class="tool-group-actions">
                    <button class="tool-button tool-button-large" id="tool-edit" data-i18n-title="editMoveTitle" title="${t.editMoveTitle}"><svg viewBox="0 0 24 24"><path d="M 18 2 l -9 9 l -2 5 l 5 -2 l 9 -9 l -3 -3 z M 10 10 l 3 3"></path></svg><span data-i18n="editMove">${t.editMove}</span></button>
                    <div class="actions-stack" style="display: none;">
                        <button class="tool-button" id="save-btn" data-i18n-title="saveTitle" title="${t.saveTitle}"><svg viewBox="0 0 24 24"><path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"></path></svg><span data-i18n="save">${t.save}</span></button>
                        <button class="tool-button" id="open-btn" data-i18n-title="openTitle" title="${t.openTitle}"><svg viewBox="0 0 24 24"><path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z"></path></svg><span data-i18n="open">${t.open}</span></button>
                        <input type="file" id="file-input" accept=".json" style="display: none;" />
                    </div>
                    <button class="tool-button tool-button-large" id="reset-btn" data-i18n-title="resetTitle" title="${t.resetTitle}">
                        <svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"></path></svg>
                        <span data-i18n="reset">${t.reset}</span>
                    </button>
                </div>
            </div>
            
            <div class="tool-group">
                <p class="tool-group-title" data-i18n="gridSettings">${t.gridSettings}</p>
                <div class="grid-settings">
                    <div><label for="metersPerGrid" data-i18n="horizontal">${t.horizontal}</label><input type="number" id="metersPerGrid" value="0.2" min="0.1" step="0.1"><span>m</span></div>
                    <div><label for="kNPerGrid" data-i18n="vertical">${t.vertical}</label><input type="number" id="kNPerGrid" value="2" min="0.1" step="0.1"><span>kN</span></div>
                    <div><label for="gridSize" data-i18n="grid">${t.grid}</label><input type="number" id="gridSize" value="20" min="10"><span>px</span></div>
                </div>
            </div>
            
            <div class="tool-group">
                <p class="tool-group-title" data-i18n="materialProperties">${t.materialProperties}</p>
                <div class="grid-settings">
                    <div><label for="elasticityModulus" data-i18n="elasticityModulus">${t.elasticityModulus}</label><input type="number" id="elasticityModulus" value="200" min="1"><span>${t.unitGPA}</span></div>
                    <div><label for="momentOfInertia" data-i18n="momentOfInertia">${t.momentOfInertia}</label><input type="number" id="momentOfInertia" value="100000" min="1"><span>${t.unitCM4}</span></div>
                </div>
            </div>
            </div>
            <button class="toolbar-scroll-btn toolbar-scroll-btn--right" id="toolbar-scroll-right"><svg viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg></button>
        </div>
        <div class="toolbar-right">

        </div>
    `;
    document.querySelector('.toolbar').innerHTML = toolbarHTML;

    

    document.getElementById('modeling-area-title').setAttribute('data-i18n', 'structuralModel');
    document.getElementById('modeling-area-title').innerText = t.structuralModel;

    document.getElementById('download-model-btn').innerHTML = `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"></path></svg>`;
    document.getElementById('download-model-btn').setAttribute('title', t.downloadModelTitle);

    // DÜZELTME: Simgenin <path> elementine fill="currentColor" ve stroke="none" özellikleri eklendi.
    document.getElementById('center-btn').innerHTML = `<svg viewBox="0 0 24 24"><path fill="currentColor" stroke="none" d="M5 15H3v4c0 1.1.9 2 2 2h4v-2H5v-4zM5 5h4V3H5c-1.1 0-2 .9-2 2v4h2V5zm14-2h-4v2h4v4h2V5c0-1.1-.9-2-2-2zm0 16h-4v2h4c1.1 0 2-.9 2-2v-4h-2v4zM12 9c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>`;
    document.getElementById('center-btn').setAttribute('title', t.centerViewTitle);

    document.getElementById('fullscreen-btn').innerHTML = `<svg class="icon-expand" viewBox="0 0 24 24"><path d="M15 3h6v6l-2-2-4 4-2-2 4-4-2-2zM9 21H3v-6l2 2 4-4 2 2-4 4 2 2z"></path></svg><svg class="icon-shrink" viewBox="0 0 24 24" style="display: none;"><path d="m 20 2 M 10 14 L 4 14 L 6 16 L 2 20 L 4 22 L 8 18 L 10 20 L 10 14 M 14 10 L 20 10 L 18 8 L 22 4 L 20 2 L 16 6 L 14 4 L 14 10"></path></svg>`;
    document.getElementById('fullscreen-btn').setAttribute('title', t.fullscreenTitle);

    const diagramsHTML = `
        <div id="diagram-grid">
            <div id="free-body-diagram-wrapper" class="diagram-container"><h4 data-i18n="freeBodyDiagram">${t.freeBodyDiagram}</h4><button id="download-fbd-btn" class="download-btn" data-i18n-title="downloadDiagram"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"></path></svg></button><button class="toggle-button" data-i18n-title="show"><svg viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5C21.27 7.61 17 4.5 12 4.5zm0 13c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6zm0-10c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4z"></path></svg></button><div class="content-wrapper hidden"><canvas id="freeBodyDiagramCanvas"></canvas><p id="reactions-output"></p></div></div>
            <div id="normal-force-diagram-wrapper" class="diagram-container"><h4 data-i18n="normalForceDiagram">${t.normalForceDiagram}</h4><button id="download-nfd-btn" class="download-btn" data-i18n-title="downloadDiagram"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"></path></svg></button><button class="toggle-button" data-i18n-title="show"><svg viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5C21.27 7.61 17 4.5 12 4.5zm0 13c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6zm0-10c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4z"></path></svg></button><div class="content-wrapper hidden"><div class="diagram-wrapper"><canvas id="normalForceDiagram"></canvas></div></div></div>
            <div id="shear-force-diagram-wrapper" class="diagram-container"><h4 data-i18n="shearForceDiagram">${t.shearForceDiagram}</h4><button id="download-sfd-btn" class="download-btn" data-i18n-title="downloadDiagram"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"></path></svg></button><button class="toggle-button" data-i18n-title="show"><svg viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5C21.27 7.61 17 4.5 12 4.5zm0 13c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6zm0-10c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4z"></path></svg></button><div class="content-wrapper hidden"><div class="diagram-wrapper"><canvas id="shearForceDiagram"></canvas></div></div></div>
            <div id="bending-moment-diagram-wrapper" class="diagram-container"><h4 data-i18n="bendingMomentDiagram">${t.bendingMomentDiagram}</h4><button id="download-bmd-btn" class="download-btn" data-i18n-title="downloadDiagram"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"></path></svg></button><button class="toggle-button" data-i18n-title="show"><svg viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5C21.27 7.61 17 4.5 12 4.5zm0 13c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6zm0-10c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4z"></path></svg></button><div class="content-wrapper hidden"><div class="diagram-wrapper"><canvas id="bendingMomentDiagram"></canvas></div></div></div>
            <div id="torsion-moment-diagram-wrapper" class="diagram-container"><h4 data-i18n="torsionMomentDiagram">${t.torsionMomentDiagram}</h4><button id="download-tmd-btn" class="download-btn" data-i18n-title="downloadDiagram"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"></path></svg></button><button class="toggle-button" data-i18n-title="show"><svg viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5C21.27 7.61 17 4.5 12 4.5zm0 13c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6zm0-10c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4z"></path></svg></button><div class="content-wrapper hidden"><div class="diagram-wrapper"><canvas id="torsionMomentDiagram"></canvas></div></div></div>
        </div>
    `;
    document.getElementById('all-diagrams-container').innerHTML = diagramsHTML;
    
    const dataTablesHTML = `
        <div class="data-tables-header"><h4 data-i18n="dataTables">${t.dataTables}</h4><button id="download-tables-btn" class="download-btn" data-i18n-title="downloadData"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"></path></svg></button><button class="toggle-button" data-i18n-title="hide"><svg viewBox="0 0 24 24"><path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l3.28 3.28.02.06C3.93 8.5 2.73 10.11 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l3.15 3.15L21 21.18 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02.05c0-1.66-1.34-3-3-3l-.05-.02-3.15-3.15-.05-.02c0-1.66 1.34-3-3z"></path></svg></button></div>
        <div class="table-grid-wrapper">
            <div class="table-grid">
                <div class="table-wrapper"><h3 data-i18n="beamTable">${t.beamTable}</h3><table id="beam-table"><thead><tr><th data-i18n="property">${t.property}</th><th data-i18n="valueM">${t.valueM}</th></tr></thead><tbody></tbody></table></div>
                <div class="table-wrapper"><h3 data-i18n="supportsTable">${t.supportsTable}</h3><table id="supports-table"><thead><tr><th data-i18n="number">${t.number}</th><th data-i18n="type">${t.type}</th><th data-i18n="positionM">${t.positionM}</th><th data-i18n="tableColDelete">${t.tableColDelete}</th></tr></thead><tbody></tbody></table></div>
                <div class="table-wrapper"><h3 data-i18n="distributedLoadsTable">${t.distributedLoadsTable}</h3><table id="distributed-loads-table"><thead><tr><th data-i18n="number">${t.number}</th><th data-i18n="startM">${t.startM}</th><th data-i18n="endM">${t.endM}</th><th data-i18n="magnitudeKNM">${t.magnitudeKNM}</th><th data-i18n="tableColDelete">${t.tableColDelete}</th></tr></thead><tbody></tbody></table></div>
                <div class="table-wrapper"><h3 data-i18n="trapezoidalLoadsTable">${t.trapezoidalLoadsTable}</h3><table id="trapezoidal-loads-table"><thead><tr><th data-i18n="number">${t.number}</th><th data-i18n="startM">${t.startM}</th><th data-i18n="endM">${t.endM}</th><th data-i18n="magnitude1KNM">${t.magnitude1KNM}</th><th data-i18n="magnitude2KNM">${t.magnitude2KNM}</th><th data-i18n="tableColDelete">${t.tableColDelete}</th></tr></thead><tbody></tbody></table></div>
                <div class="table-wrapper"><h3 data-i18n="concentratedLoadsTable">${t.concentratedLoadsTable}</h3><table id="concentrated-loads-table"><thead><tr><th data-i18n="number">${t.number}</th><th data-i18n="positionM">${t.positionM}</th><th data-i18n="magnitudeKN">${t.magnitudeKN}</th><th data-i18n="angleDeg">${t.angleDeg}</th><th data-i18n="tableColDelete">${t.tableColDelete}</th></tr></thead><tbody></tbody></table></div>
                <div class="table-wrapper"><h3 data-i18n="concentratedMomentsTable">${t.concentratedMomentsTable}</h3><table id="concentrated-moments-table"><thead><tr><th data-i18n="number">${t.number}</th><th data-i18n="positionM">${t.positionM}</th><th data-i18n="magnitudeKNM2">${t.magnitudeKNM2}</th><th data-i18n="tableColDelete">${t.tableColDelete}</th></tr></thead><tbody></tbody></table></div>
                <div class="table-wrapper"><h3 data-i18n="torsionMomentsTable">${t.torsionMomentsTable}</h3><table id="torsion-moments-table"><thead><tr><th data-i18n="number">${t.number}</th><th data-i18n="positionM">${t.positionM}</th><th data-i18n="magnitudeKNM2">${t.magnitudeKNM2}</th><th data-i18n="tableColDelete">${t.tableColDelete}</th></tr></thead><tbody></tbody></table></div>
            </div>
        </div>
    `;
    document.getElementById('data-tables-container').innerHTML = dataTablesHTML;

    const footerHTML = `
        <div class="footer-content">
            <div class="footer-text">
                <p><strong data-i18n="footerText1">${t.footerText1}</strong></p>
                <p><span data-i18n="copyright">${t.copyright}</span> &copy; <span id="copyright-year"></span> · <a href="https://www.rasimtemur.com" target="_blank" rel="noopener noreferrer">Rasim Temür</a><span data-i18n="footerText2">${t.footerText2}</span> · <a href="https://opensource.org/licenses/MIT" target="_blank" rel="noopener noreferrer" style="color: inherit;">MIT License</a></p>
            </div>
            <div class="language-switcher">
                <button id="app-menu-toggle" title="Menu">
                    <svg viewBox="0 0 24 24" style="width: 20px; height: 20px;" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                        <line x1="4" y1="7" x2="20" y2="7"></line>
                        <line x1="4" y1="12" x2="20" y2="12"></line>
                        <line x1="4" y1="17" x2="20" y2="17"></line>
                    </svg>
                </button>
                <div id="appMenu" class="app-menu">
                    <button id="menu-new" class="app-menu-item">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                            <line x1="12" y1="12" x2="12" y2="18"></line>
                            <line x1="9" y1="15" x2="15" y2="15"></line>
                        </svg>
                        <span data-i18n="appMenuNew">${t.appMenuNew || 'New'}</span>
                    </button>
                    <button id="menu-open" class="app-menu-item">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                        </svg>
                        <span data-i18n="open">${t.open || 'Open'}</span>
                    </button>
                    <button id="menu-save" class="app-menu-item">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                            <polyline points="17 21 17 13 7 13 7 21"></polyline>
                            <polyline points="7 3 7 8 15 8"></polyline>
                        </svg>
                        <span data-i18n="save">${t.save || 'Save'}</span>
                    </button>
                    <div class="app-menu-separator"></div>
                    <button id="dark-mode-toggle" class="app-menu-item">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path class="moon-icon" d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                            <g class="sun-icon" style="display: none;">
                                <circle cx="12" cy="12" r="4"></circle>
                                <line x1="12" y1="2" x2="12" y2="4"></line>
                                <line x1="12" y1="20" x2="12" y2="22"></line>
                                <line x1="4.93" y1="4.93" x2="6.34" y2="6.34"></line>
                                <line x1="17.66" y1="17.66" x2="19.07" y2="19.07"></line>
                                <line x1="2" y1="12" x2="4" y2="12"></line>
                                <line x1="20" y1="12" x2="22" y2="12"></line>
                                <line x1="4.93" y1="19.07" x2="6.34" y2="17.66"></line>
                                <line x1="17.66" y1="6.34" x2="19.07" y2="4.93"></line>
                            </g>
                        </svg>
                        <span data-i18n="appMenuView">${t.appMenuView || 'View'}</span>
                    </button>
                    <button id="about-toggle" class="app-menu-item">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="16" x2="12" y2="12"></line>
                            <line x1="12" y1="8" x2="12.01" y2="8"></line>
                        </svg>
                        <span data-i18n="appMenuAbout">${t.appMenuAbout || 'About'}</span>
                    </button>
                </div>
                <button data-lang="tr" title="Türkçe">TR</button>
                <button data-lang="en" title="English">EN</button>
                <button data-lang="de" title="Deutsch">DE</button>
                <button data-lang="cn" title="中文">CN</button>
                <button id="btnMoreLanguages" title="More Languages">+</button>
                <div id="languageDropdown" class="language-dropdown">
                    <!-- Diller buraya JS ile doldurulacak -->
                </div>
            </div>
            <div class="footer-socials"><a href="http://www.iuc.edu.tr"><img src="IUC.svg" width="160" height="43"></a></div>
        </div>
    `;
    document.querySelector('.page-footer').innerHTML = footerHTML;
}


function setLanguage(lang) {
  if (typeof ensureLanguageButtonExists === 'function') {
      ensureLanguageButtonExists(lang);
  }

  if (!translations[lang]) {
    console.warn(`Language '${lang}' not found. Defaulting to English.`);
    lang = 'en';
  }

  localStorage.setItem('selectedLanguage', lang);
  document.documentElement.lang = lang;

  document.querySelectorAll('[data-i18n]').forEach(element => {
    const key = element.dataset.i18n;
    const translation = translations[lang][key];
    if (translation) {
      element.innerText = translation;
    } else {
      console.warn(`Translation key '${key}' not found for language '${lang}'.`);
    }
  });

  document.querySelectorAll('[data-i18n-title]').forEach(element => {
    const key = element.dataset.i18nTitle;
    const translation = translations[lang][key];
    if (translation) {
      element.setAttribute('title', translation);
    } else {
      console.warn(`Title translation key '${key}' not found for language '${lang}'.`);
    }
  });

  if (typeof updateAll === 'function') {
    updateAll();
  }

  if (typeof updateHintBox === 'function') {
    updateHintBox();
  }

  document.querySelectorAll('.language-switcher button[data-lang]').forEach(button => {
    button.classList.toggle('active', button.dataset.lang === lang);
  });

  if (typeof window.updateToolbarScrollArrows === 'function') {
      setTimeout(window.updateToolbarScrollArrows, 50);
  }
}