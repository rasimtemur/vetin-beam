// main.js - Hibrit Model için Uygulama Başlatıcı

document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Platformu belirle ve body'e sınıf olarak ekle
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const platform = isTouchDevice ? 'mobile' : 'desktop';
    document.body.classList.add(platform);

    // 2. Dil ayarlarını yap ve HTML'i oluştur
    const savedLang = localStorage.getItem('selectedLanguage');
    const browserLang = navigator.language.split('-')[0];
    const initialLang = savedLang || (translations[browserLang] ? browserLang : 'tr');
    
    buildInitialHTML(initialLang);
    
    // 3. DOM'a bağlı global değişkenleri ata
    initializeDOMVariables(); 
    
    // 3.1 Temayı Başlat
    initializeTheme(); 

    // 3.2 3B Elastik Eğri Başlat
    if (typeof initElasticCurve3D === 'function') {
        initElasticCurve3D();
    }

    // 4. Sadece mevcut platforma ait olay dinleyicilerini kur
    if (platform === 'desktop') {
        initializeDesktopEventListeners(); // desktop-events.js'deki fonksiyon
    } else {
        initializeMobileEventListeners(); // mobile-events.js'deki fonksiyon
    }

    // 5. Dili ayarla
    // initialLang ile hemen dili uygula (buton aktif sınıfı, data-i18n elementleri)
    setLanguage(initialLang);

    // Dil butonlarını ve dropdown menüyü başlat
    if (typeof initializeLanguageButtons === 'function') {
        initializeLanguageButtons();
    }

    // Kaydedilmiş dil yoksa geolocation ile otomatik dil tespiti yap
    if (!savedLang && typeof detectLanguageByLocation === 'function') {
        detectLanguageByLocation().then(lang => {
            if (lang) {
                setLanguage(lang);
                if (typeof ensureLanguageButtonExists === 'function') {
                    ensureLanguageButtonExists(lang);
                }
            }
        });
    }

    scaleCanvasForHiDPI(canvas, ctx);
    redrawCanvas();

    // 6. Telif hakkı yılını ayarla
    const copyrightYear = document.getElementById('copyright-year');
    if (copyrightYear) {
        copyrightYear.textContent = new Date().getFullYear();
    }
});