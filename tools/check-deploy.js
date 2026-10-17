// tools/check-deploy.js
// Sunucuya yüklemeden önce dosya bütünlüğünü denetler ve yüklenecek dosyaların listesini verir.
// Çalıştırma:  node tools/check-deploy.js          → denetim (hata varsa çıkış kodu 1)
//              node tools/check-deploy.js --list   → denetim + yüklenecek dosyaların listesi
//
// Denetlenenler:
//   1. index.html'in yüklediği her yerel dosya (script, stylesheet, manifest, ikon)
//      sw.js içindeki ASSETS listesinde var mı? (yoksa çevrimdışı çalışmaz)
//   2. ASSETS'teki her dosya diskte var mı? (yoksa service worker kurulamaz:
//      cache.addAll tek bir 404'te tümden başarısız olur)
//   3. manifest.json'daki ikon ve ekran görüntüleri var mı?
//   4. models/models-data.js, models/model_*.json ile güncel mi?

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const isLocal = (ref) => ref && !/^(https?:|data:|mailto:|#|\/\/)/i.test(ref);
const normalize = (ref) => ref.replace(/^\.\//, '').split(/[?#]/)[0];

function readIndexReferences(root) {
    const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
    const refs = new Set();
    // Yorumlar içindeki örnek referanslar sayılmasın
    const code = html.replace(/<!--[\s\S]*?-->/g, '');
    for (const m of code.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/gi)) refs.add(m[1]);
    for (const m of code.matchAll(/<link\b[^>]*\bhref="([^"]+)"/gi)) refs.add(m[1]);
    for (const m of code.matchAll(/<img\b[^>]*\bsrc="([^"]+)"/gi)) refs.add(m[1]);
    return [...refs].filter(isLocal).map(normalize);
}

function readServiceWorkerAssets(root) {
    const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
    const block = /const ASSETS\s*=\s*\[([\s\S]*?)\];/.exec(sw);
    if (!block) throw new Error('sw.js içinde ASSETS listesi bulunamadı');
    return [...block[1].matchAll(/'([^']+)'/g)].map(m => m[1]);
}

function readManifestFiles(root) {
    const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));
    return [...(manifest.icons || []), ...(manifest.screenshots || [])].map(i => normalize(i.src));
}

// Çalışma anında istenen (önbelleğe istek anında alınan) ama ASSETS'te olmayan dosyalar
function readRuntimeFiles(root) {
    const dir = path.join(root, 'models');
    return fs.readdirSync(dir)
        .filter(f => /^model_\d+\.(json|svg)$/.test(f))
        .map(f => `models/${f}`);
}

function checkDeploy(root = ROOT) {
    const errors = [];
    const exists = (rel) => fs.existsSync(path.join(root, rel));

    const assets = readServiceWorkerAssets(root);
    const assetSet = new Set(assets.map(normalize).filter(Boolean));

    readIndexReferences(root).forEach(ref => {
        if (!assetSet.has(ref)) errors.push(`index.html "${ref}" dosyasını yüklüyor ama sw.js ASSETS listesinde yok`);
    });
    assets.forEach(a => {
        const rel = normalize(a);
        if (rel && !exists(rel)) errors.push(`sw.js ASSETS içindeki "${a}" diskte yok (service worker kurulamaz)`);
    });
    const manifestFiles = readManifestFiles(root);
    manifestFiles.forEach(f => { if (!exists(f)) errors.push(`manifest.json "${f}" dosyasını gösteriyor ama diskte yok`); });

    try {
        const { readModels, buildSource } = require('./build-models-data.js');
        const current = fs.readFileSync(path.join(root, 'models', 'models-data.js'), 'utf8').replace(/\r\n/g, '\n');
        if (current !== buildSource(readModels())) errors.push('models/models-data.js güncel değil: node tools/build-models-data.js');
    } catch (e) {
        errors.push(`models/models-data.js denetlenemedi: ${e.message}`);
    }

    const files = [...new Set(['sw.js', ...assetSet, ...manifestFiles, ...readRuntimeFiles(root)])]
        .filter(f => f && f !== '')
        .sort();
    return { errors, files };
}

if (require.main === module) {
    const { errors, files } = checkDeploy();
    if (errors.length) {
        console.error('Yükleme denetimi BAŞARISIZ:\n' + errors.map(e => '  ✗ ' + e).join('\n'));
    } else {
        console.log(`Yükleme denetimi başarılı (${files.length} dosya).`);
    }
    if (process.argv.includes('--list')) {
        console.log('\nSunucuya yüklenecek dosyalar (klasör yapısı korunarak):');
        files.forEach(f => console.log('  ' + f));
    }
    process.exit(errors.length ? 1 : 0);
}

module.exports = { checkDeploy };
