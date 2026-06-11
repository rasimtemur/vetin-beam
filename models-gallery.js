// models-gallery.js - Hazır model galerisi (açılış katmanı)

(function () {
    const MODELS_PATH = 'models/';
    const VISIBLE_MODELS = [1, 3, 7, 8];
    const STORAGE_KEY = 'gallery_dont_show';
    const FIXED_LANGS = ['tr', 'en', 'de', 'cn'];

    // Sayfanın aktif dilini bul
    function resolveLang() {
        if (document.documentElement.lang) return document.documentElement.lang;
        const saved = localStorage.getItem('selectedLanguage');
        if (saved) return saved;
        const browser = (navigator.language || 'tr').split('-')[0];
        if (typeof translations !== 'undefined' && translations[browser]) return browser;
        return 'tr';
    }

    function tr(key, fallback) {
        const lang = resolveLang();
        const dict = (typeof translations !== 'undefined' && translations[lang]) ? translations[lang] : null;
        return (dict && dict[key]) || (translations['en'] && translations['en'][key]) || fallback;
    }

    // JSON model verisini projeye uygular
    function applyModelData(projectData) {
        const resetBtn = document.getElementById('reset-btn');
        if (resetBtn) {
            window.__skipResetConfirm = true;
            resetBtn.click();
            window.__skipResetConfirm = false;
        }
        beam = projectData.beam;
        supports = projectData.supports || [];
        hinges = projectData.hinges || [];
        concentratedLoads = projectData.concentratedLoads || [];
        distributedLoads = projectData.distributedLoads || [];
        trapezoidalLoads = projectData.trapezoidalLoads || [];
        concentratedMoments = projectData.concentratedMoments || [];
        torsionMoments = projectData.torsionMoments || [];
        if (projectData.gridSettings) {
            if (metersPerGridInput) metersPerGridInput.value = projectData.gridSettings.metersPerGrid;
            if (kNPerGridInput) kNPerGridInput.value = projectData.gridSettings.kNPerGrid;
            if (gridSizeInput) gridSizeInput.value = projectData.gridSettings.gridSize;
        }
        scaleCanvasForHiDPI(canvas, ctx);
        redrawCanvas();
        updateAll();
        if (typeof getCurrentModelHash === 'function') {
            window.__lastSavedHash = getCurrentModelHash();
        }
    }

    function scalePanel() {
        const panel = document.querySelector('.model-gallery-panel');
        if (!panel) return;
        const padding = 48;
        const scaleX = (window.innerWidth  - padding) / panel.scrollWidth;
        const scaleY = (window.innerHeight - padding) / panel.scrollHeight;
        const scale = Math.min(scaleX, scaleY, 1);
        panel.style.transform = scale < 1 ? `scale(${scale})` : '';
    }

    function hideGallery() {
        const overlay = document.getElementById('model-gallery-overlay');
        if (!overlay) return;
        overlay.classList.add('hidden');
        overlay.addEventListener('transitionend', () => {
            overlay.style.display = 'none';
        }, { once: true });
    }

    function makeExtraLangBtn(lang) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'gallery-lang-btn gallery-lang-extra';
        btn.dataset.lang = lang;
        const label = typeof getLanguageLabel === 'function' ? getLanguageLabel(lang) : lang.toUpperCase();
        btn.textContent = label;
        btn.title = typeof getLanguageNativeName === 'function' ? getLanguageNativeName(lang) : lang;
        btn.addEventListener('click', () => onLangClick(lang));
        return btn;
    }

    // Galeri metinlerini mevcut dile göre güncelle
    function updateGalleryTexts() {
        const titleEl    = document.querySelector('.model-gallery-panel .gallery-title');
        const subtitleEl = document.querySelector('.model-gallery-panel .gallery-subtitle');
        const newLabelEl  = document.querySelector('.model-card--new .gallery-new-label');
        const openLabelEl = document.querySelector('.model-card--open .gallery-open-label');
        const dontShowEl  = document.querySelector('.gallery-dontshow-text');

        if (titleEl)     titleEl.textContent    = tr('galleryTitle',    'Bir Model Seçin');
        if (subtitleEl)  subtitleEl.textContent  = tr('gallerySubtitle', '');
        if (newLabelEl)  newLabelEl.textContent  = tr('galleryNewModel', 'Yeni Model');
        if (openLabelEl) openLabelEl.textContent = tr('open',            'Dosya Aç');
        if (dontShowEl)  dontShowEl.textContent  = tr('galleryDontShow', 'Bir daha gösterme');

        const lang = resolveLang();

        // Aktif dil butonunu güncelle
        document.querySelectorAll('.gallery-lang-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === lang);
        });

        // Sabit diller dışında bir dil seçiliyse ekstra butonu göster/güncelle
        const switcher = document.querySelector('.gallery-lang-switcher');
        if (switcher) {
            const existing = switcher.querySelector('.gallery-lang-extra');
            if (!FIXED_LANGS.includes(lang)) {
                if (existing && existing.dataset.lang === lang) {
                    existing.classList.add('active');
                } else {
                    if (existing) existing.remove();
                    const extraBtn = makeExtraLangBtn(lang);
                    extraBtn.classList.add('active');
                    const moreBtn = switcher.querySelector('.gallery-lang-more');
                    switcher.insertBefore(extraBtn, moreBtn);
                }
            } else {
                if (existing) existing.remove();
            }
        }
    }

    function loadModel(name) {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', MODELS_PATH + name + '.json', true);
        xhr.responseType = 'json';
        xhr.onload = function () {
            try {
                const data = xhr.response || JSON.parse(xhr.responseText);
                applyModelData(data);
                hideGallery();
            } catch (err) {
                console.error('Model parse hatası:', name, err);
                alert('Model yüklenemedi: ' + name);
            }
        };
        xhr.onerror = function () {
            console.error('Model yüklenemedi:', name);
            alert('Model yüklenemedi: ' + name);
        };
        xhr.send();
    }

    // Dil butonları için tıklama işleyicisi
    function onLangClick(lang) {
        if (typeof setLanguage === 'function') setLanguage(lang);
        if (typeof ensureLanguageButtonExists === 'function') ensureLanguageButtonExists(lang);
        updateGalleryTexts();
        scalePanel();
    }

    function buildLangSwitcher() {
        const switcher = document.createElement('div');
        switcher.className = 'gallery-lang-switcher';

        const currentLang = resolveLang();

        // Sabit dil butonları: TR EN DE CN
        FIXED_LANGS.forEach(lang => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'gallery-lang-btn' + (lang === currentLang ? ' active' : '');
            btn.dataset.lang = lang;
            btn.textContent = lang.toUpperCase();
            btn.title = typeof getLanguageNativeName === 'function' ? getLanguageNativeName(lang) : lang;
            btn.addEventListener('click', () => onLangClick(lang));
            switcher.appendChild(btn);
        });

        // Sabit diller dışında bir dil seçiliyse ekstra buton ekle
        if (!FIXED_LANGS.includes(currentLang)) {
            const extraBtn = makeExtraLangBtn(currentLang);
            extraBtn.classList.add('active');
            switcher.appendChild(extraBtn);
        }

        // "+" düğmesi + dropdown
        const btnMore = document.createElement('button');
        btnMore.type = 'button';
        btnMore.className = 'gallery-lang-btn gallery-lang-more';
        btnMore.textContent = '+';
        btnMore.title = 'More languages';

        const dropdown = document.createElement('div');
        dropdown.className = 'gallery-lang-dropdown';

        // Sabit diller dışındaki tüm dilleri listele
        const allLangs = typeof translations !== 'undefined'
            ? Object.keys(translations).filter(l => !FIXED_LANGS.includes(l))
            : [];
        allLangs.sort((a, b) => {
            const la = typeof getLanguageLabel === 'function' ? getLanguageLabel(a) : a;
            const lb = typeof getLanguageLabel === 'function' ? getLanguageLabel(b) : b;
            return la.localeCompare(lb);
        });
        allLangs.forEach(lang => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.dataset.lang = lang;
            const label = typeof getLanguageLabel === 'function' ? getLanguageLabel(lang) : lang.toUpperCase();
            const native = typeof getLanguageNativeName === 'function' ? getLanguageNativeName(lang) : lang;
            btn.textContent = label;
            btn.title = native;
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                onLangClick(lang);
                dropdown.classList.remove('show');
            });
            dropdown.appendChild(btn);
        });

        btnMore.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('show');
        });
        document.addEventListener('click', () => dropdown.classList.remove('show'));

        switcher.appendChild(btnMore);
        switcher.appendChild(dropdown);
        return switcher;
    }

    function buildGallery() {
        if (localStorage.getItem(STORAGE_KEY) === '1') return;

        const overlay = document.createElement('div');
        overlay.id = 'model-gallery-overlay';

        const panel = document.createElement('div');
        panel.className = 'model-gallery-panel';

        // Başlık
        const header = document.createElement('div');
        header.className = 'model-gallery-header';
        const title = document.createElement('h2');
        title.className = 'gallery-title';
        title.textContent = tr('galleryTitle', 'Bir Model Seçin');
        const subtitle = document.createElement('p');
        subtitle.className = 'gallery-subtitle';
        subtitle.textContent = tr('gallerySubtitle', '');
        header.appendChild(title);
        header.appendChild(subtitle);

        // Kart ızgarası
        const grid = document.createElement('div');
        grid.className = 'model-gallery-grid';

        // Yeni model butonu
        const newCard = document.createElement('button');
        newCard.type = 'button';
        newCard.className = 'model-card model-card--new';
        const newIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>';
        const newSpan = document.createElement('span');
        newSpan.className = 'gallery-new-label';
        newSpan.textContent = tr('galleryNewModel', 'Yeni Model');
        newCard.innerHTML = newIcon;
        newCard.appendChild(newSpan);
        newCard.addEventListener('click', () => {
            const resetBtn = document.getElementById('reset-btn');
            if (resetBtn) {
                window.__skipResetConfirm = true;
                resetBtn.click();
                window.__skipResetConfirm = false;
                window.__lastSavedHash = null;
            }
            hideGallery();
        });
        grid.appendChild(newCard);

        // Dosya aç butonu
        const openCard = document.createElement('button');
        openCard.type = 'button';
        openCard.className = 'model-card model-card--new model-card--open';
        const openIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>';
        const openSpan = document.createElement('span');
        openSpan.className = 'gallery-open-label';
        openSpan.textContent = tr('open', 'Dosya Aç');
        openCard.innerHTML = openIcon;
        openCard.appendChild(openSpan);
        openCard.addEventListener('click', () => {
            const fileInput = document.getElementById('file-input');
            if (fileInput) {
                hideGallery();
                fileInput.click();
            }
        });
        grid.appendChild(openCard);

        // Hazır model kartları
        VISIBLE_MODELS.forEach((n) => {
            const name = 'model_' + n;
            const card = document.createElement('button');
            card.type = 'button';
            card.className = 'model-card';
            card.dataset.model = name;
            const img = document.createElement('img');
            img.alt = name;
            img.loading = 'lazy';
            img.src = MODELS_PATH + name + '.svg';
            img.addEventListener('error', () => { card.remove(); });
            card.appendChild(img);
            card.addEventListener('click', () => loadModel(name));
            grid.appendChild(card);
        });

        // Alt çubuk: sol = dil seçici, sağ = "bir daha gösterme"
        const footer = document.createElement('div');
        footer.className = 'model-gallery-footer';

        footer.appendChild(buildLangSwitcher());

        const label = document.createElement('label');
        label.className = 'model-gallery-dontshow';
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.addEventListener('change', () => {
            localStorage[checkbox.checked ? 'setItem' : 'removeItem'](STORAGE_KEY, '1');
        });
        const dontShowText = document.createElement('span');
        dontShowText.className = 'gallery-dontshow-text';
        dontShowText.textContent = tr('galleryDontShow', 'Bir daha gösterme');
        label.appendChild(checkbox);
        label.appendChild(dontShowText);
        footer.appendChild(label);

        panel.appendChild(header);
        panel.appendChild(grid);
        panel.appendChild(footer);
        overlay.appendChild(panel);
        document.body.appendChild(overlay);

        requestAnimationFrame(scalePanel);
        window.addEventListener('resize', scalePanel);
    }

    document.addEventListener('DOMContentLoaded', () => {
        buildGallery();
    });
})();
