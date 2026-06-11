// tests/run-tests.js
// calculations.js içindeki saf statik hesap fonksiyonları için birim testleri.
// Çalıştırma: node tests/run-tests.js
//
// calculations.js tarayıcı globalleri kullandığından, dosya bir vm bağlamında
// gerekli stub'larla yüklenir ve fonksiyonlar doğrudan çağrılır.
// Koordinat sistemi: 10 px = 1 m (toMeters = px / 10), kiriş 0 px'ten başlar.

'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

// --- vm bağlamı: calculations.js'in ihtiyaç duyduğu globaller ---
const sandbox = {
    console,
    // Uygulama durumu (testler sırasında yeniden atanır)
    beam: { startX: 0, endX: 100, startY: 0 },
    supports: [],
    hinges: [],
    concentratedLoads: [],
    distributedLoads: [],
    trapezoidalLoads: [],
    concentratedMoments: [],
    torsionMoments: [],
    // Sabitler / yardımcılar (setup.js karşılıkları)
    EPSILON: 1e-9,
    COLORS: { LOAD: '#d9534f', BEAM_STROKE: '#389fb6', REACTION: '#5cb85c', GRID: '#eee' },
    diagramData: { normal: {}, shear: {}, moment: {}, torsion: {}, elasticCurve: {} },
    calculatedReactions: [],
    calculatedMomentReaction: 0,
    calculatedAxialReaction: null,
    normalForceChart: null,
    torsionChart: null,
    elasticityInput: { value: '200' },
    momentOfInertiaInput: { value: '100000' },
    metersPerGridInput: { value: '0.1' },
    gridSizeInput: { value: '10' },
    kNPerGridInput: { value: '2' },
    getGridSize: () => 10,
    getMetersPerGrid: () => 0.1,
    getKNPerGrid: () => 2,
    getConversionFunctions: () => ({ toMeters: (px) => px / 10, toPixels: (m) => m * 10 }),
    // DOM / çizim stub'ları (testlerde çağrılmazlar)
    document: { documentElement: { lang: 'en' }, getElementById: () => null },
    translations: { en: { diagramAxes: {} } },
    Chart: function () { this.destroy = () => {}; },
    chartAlignmentPlugin: {},
    upsertLineChart: () => null,
    drawFreeBodyDiagram: () => {},
    drawDiagrams: () => {},
    showCalcWarning: () => {},
};
sandbox.globalThis = sandbox;
const context = vm.createContext(sandbox);

const source = fs.readFileSync(path.join(__dirname, '..', 'calculations.js'), 'utf8');
vm.runInContext(source, context, { filename: 'calculations.js' });
// Üst düzey const ile tanımlı fonksiyonları dışarı al
vm.runInContext(
    'globalThis.__fns = { solveIsostaticPart, getShearAt, getMomentAt, getDistributedLoadAt, getElasticCurvePoints, isSystemStable, calculateAxialReaction };',
    context
);
const fns = sandbox.__fns;
const toMeters = (px) => px / 10;

// --- Mini test çerçevesi ---
let passed = 0, failed = 0;
function approx(actual, expected, tol, label) {
    const ok = Math.abs(actual - expected) <= tol;
    if (ok) { passed++; console.log(`  PASS  ${label}  (${actual.toFixed(6)} ≈ ${expected})`); }
    else { failed++; console.error(`  FAIL  ${label}  beklenen ${expected}, bulunan ${actual}`); }
}
function check(cond, label) {
    if (cond) { passed++; console.log(`  PASS  ${label}`); }
    else { failed++; console.error(`  FAIL  ${label}`); }
}
function resetState() {
    sandbox.beam = { startX: 0, endX: 100, startY: 0 };
    sandbox.supports = [];
    sandbox.hinges = [];
    sandbox.concentratedLoads = [];
    sandbox.distributedLoads = [];
    sandbox.trapezoidalLoads = [];
    sandbox.concentratedMoments = [];
    sandbox.torsionMoments = [];
}
const emptyLoads = () => ({ concentrated: [], distributed: [], trapezoidal: [], moments: [] });

// =====================================================================
console.log('\n1) Basit kiriş, açıklık ortasında tekil yük (L=10 m, P=10 kN)');
{
    resetState();
    const partBeam = { startX: 0, endX: 100 };
    const partSupports = [{ type: 'pin-support', x: 0 }, { type: 'roller-support', x: 100 }];
    const loads = emptyLoads();
    loads.concentrated.push({ x: 50, magnitude: 10, angle: Math.PI / 2 });
    const r = fns.solveIsostaticPart(partBeam, partSupports, loads);
    approx(r.allReactions.find(x => x.x === 0).magnitude, 5, 1e-9, 'Sol mesnet R = P/2 = 5 kN');
    approx(r.allReactions.find(x => x.x === 100).magnitude, 5, 1e-9, 'Sağ mesnet R = P/2 = 5 kN');
}

// =====================================================================
console.log('\n2) Konsol kiriş, düzgün yayılı yük (L=10 m, w=2 kN/m aşağı)');
{
    resetState();
    const partBeam = { startX: 0, endX: 100 };
    const partSupports = [{ type: 'fixed-support', x: 0 }];
    const loads = emptyLoads();
    loads.distributed.push({ startX: 0, endX: 100, magnitude: 2 });
    const r = fns.solveIsostaticPart(partBeam, partSupports, loads);
    approx(r.allReactions[0].magnitude, 20, 1e-9, 'Düşey reaksiyon R = wL = 20 kN (yukarı)');
    approx(r.M_fixed, 100, 1e-9, 'Ankastre moment M = wL²/2 = 100 kNm');
}

// =====================================================================
console.log('\n3) Konsol kiriş, YUKARI yönlü yayılı yük (w=-2 kN/m) — işaret düzeltmesi');
{
    resetState();
    const partBeam = { startX: 0, endX: 100 };
    const partSupports = [{ type: 'fixed-support', x: 0 }];
    const loads = emptyLoads();
    loads.distributed.push({ startX: 0, endX: 100, magnitude: -2 });
    const r = fns.solveIsostaticPart(partBeam, partSupports, loads);
    approx(r.allReactions[0].magnitude, -20, 1e-9, 'Reaksiyon R = -20 kN (aşağı) — yukarı yük doğru işlendi');
    approx(r.M_fixed, -100, 1e-9, 'Ankastre moment M = -100 kNm');
}

// =====================================================================
console.log('\n4) Basit kiriş, üçgen yük (0→3 kN/m, L=6 m)');
{
    resetState();
    const partBeam = { startX: 0, endX: 60 };
    const partSupports = [{ type: 'pin-support', x: 0 }, { type: 'roller-support', x: 60 }];
    const loads = emptyLoads();
    loads.trapezoidal.push({ startX: 0, endX: 60, startMagnitude: 0, endMagnitude: 3 });
    const r = fns.solveIsostaticPart(partBeam, partSupports, loads);
    // W = 9 kN, ağırlık merkezi x = 4 m → R_sağ = 9·4/6 = 6, R_sol = 3
    approx(r.allReactions.find(x => x.x === 0).magnitude, 3, 1e-9, 'Sol mesnet R = 3 kN');
    approx(r.allReactions.find(x => x.x === 60).magnitude, 6, 1e-9, 'Sağ mesnet R = 6 kN');
}

// =====================================================================
console.log('\n5) Kesme ve moment fonksiyonları (basit kiriş + UDL, w=2, L=10)');
{
    resetState();
    sandbox.supports = [{ type: 'pin-support', x: 0 }, { type: 'roller-support', x: 100 }];
    sandbox.distributedLoads = [{ startX: 0, endX: 100, magnitude: 2 }];
    const reactions = [{ x: 0, magnitude: 10 }, { x: 100, magnitude: 10 }];
    approx(fns.getShearAt(0.001, reactions, toMeters), 10, 0.01, 'V(0⁺) = +10 kN');
    approx(fns.getShearAt(5, reactions, toMeters), 0, 1e-9, 'V(L/2) = 0');
    approx(fns.getShearAt(9.999, reactions, toMeters), -10, 0.01, 'V(L⁻) = -10 kN');
    approx(fns.getMomentAt(5, reactions, 0, toMeters), 25, 1e-9, 'M(L/2) = wL²/8 = 25 kNm');
    approx(fns.getMomentAt(10, reactions, 0, toMeters), 0, 1e-9, 'M(L) = 0');
}

// =====================================================================
console.log('\n6) Yukarı yönlü UDL ile kesme/moment işaretleri (w=-2, L=10)');
{
    resetState();
    sandbox.supports = [{ type: 'pin-support', x: 0 }, { type: 'roller-support', x: 100 }];
    sandbox.distributedLoads = [{ startX: 0, endX: 100, magnitude: -2 }];
    const reactions = [{ x: 0, magnitude: -10 }, { x: 100, magnitude: -10 }];
    approx(fns.getShearAt(0.001, reactions, toMeters), -10, 0.01, 'V(0⁺) = -10 kN (ters işaret)');
    approx(fns.getMomentAt(5, reactions, 0, toMeters), -25, 1e-9, 'M(L/2) = -25 kNm (ters işaret)');
}

// =====================================================================
console.log('\n7) Tekil moment yükü (M=10 kNm @ L/2, basit kiriş L=10)');
{
    resetState();
    const partBeam = { startX: 0, endX: 100 };
    const partSupports = [{ type: 'pin-support', x: 0 }, { type: 'roller-support', x: 100 }];
    const loads = emptyLoads();
    loads.moments.push({ x: 50, magnitude: 10 });
    const r = fns.solveIsostaticPart(partBeam, partSupports, loads);
    const rl = r.allReactions.find(x => x.x === 0).magnitude;
    const rr = r.allReactions.find(x => x.x === 100).magnitude;
    approx(rl, -1, 1e-9, 'Sol mesnet R = -M/L = -1 kN');
    approx(rr, 1, 1e-9, 'Sağ mesnet R = +M/L = +1 kN');
    approx(rl + rr, 0, 1e-9, 'ΣF = 0 (denge)');
    sandbox.concentratedMoments = [{ x: 50, magnitude: 10 }];
    sandbox.supports = partSupports;
    approx(fns.getMomentAt(4.999, r.allReactions, 0, toMeters), -5, 0.01, 'M(L/2⁻) ≈ -5 kNm');
    approx(fns.getMomentAt(5.001, r.allReactions, 0, toMeters), 5, 0.01, 'M(L/2⁺) ≈ +5 kNm (10 kNm sıçrama)');
}

// =====================================================================
console.log('\n8) Elastik eğri: basit kiriş + UDL orta nokta sehimi (5wL⁴/384EI)');
{
    resetState();
    sandbox.supports = [{ type: 'pin-support', x: 0 }, { type: 'roller-support', x: 100 }];
    sandbox.distributedLoads = [{ startX: 0, endX: 100, magnitude: 2 }];
    const reactions = [{ x: 0, magnitude: 10 }, { x: 100, magnitude: 10 }];
    const points = [];
    for (let i = 0; i <= 200; i++) points.push(i * 0.05); // 0..10 m, 5 cm adım
    const curve = fns.getElasticCurvePoints(points, reactions, 0, toMeters, 200, 100000);
    const mid = curve.find(p => Math.abs(p.x - 5) < 1e-9);
    // EI = 200e6 kN/m² · 1e-3 m⁴ = 2e5 kNm² → δ = 5·2·10⁴/(384·2e5) m = 1.3021 mm
    // Uygulama kuralı: aşağı yönlü sehim negatif y (grafikte aşağı çizilir)
    const expected = -(5 * 2 * Math.pow(10, 4)) / (384 * 200000) * 1000;
    approx(mid.y, expected, Math.abs(expected) * 0.01, `Orta nokta sehimi ≈ ${expected.toFixed(4)} mm (%1 tolerans)`);
    const end = curve.find(p => Math.abs(p.x - 10) < 1e-9);
    approx(end.y, 0, 0.01, 'Mesnette sehim ≈ 0');
}

// =====================================================================
console.log('\n9) Stabilite kontrolleri');
{
    resetState();
    sandbox.beam = { startX: 0, endX: 100, startY: 0, length: 100 };
    sandbox.supports = [{ type: 'pin-support', x: 0 }, { type: 'roller-support', x: 100 }];
    check(fns.isSystemStable() === true, 'Sabit + hareketli mesnet → stabil');

    sandbox.supports = [{ type: 'pin-support', x: 0 }, { type: 'pin-support', x: 100 }];
    sandbox.concentratedLoads = [{ x: 50, magnitude: 10, angle: 0 }]; // yatay yük
    check(fns.isSystemStable() === false, 'İki sabit mesnet + eksenel yük → hiperstatik (reddedilir)');
    check(fns.calculateAxialReaction() === null, 'İki yatay tutucu → eksenel reaksiyon belirsiz (null)');

    sandbox.concentratedLoads = [];
    sandbox.supports = [{ type: 'fixed-support', x: 0 }];
    check(fns.isSystemStable() === true, 'Konsol kiriş → stabil');

    // Mafsallı sistem: ankastre + mafsal + hareketli (Gerber) → stabil
    sandbox.supports = [{ type: 'fixed-support', x: 0 }, { type: 'roller-support', x: 100 }];
    sandbox.hinges = [{ x: 50 }];
    check(fns.isSystemStable() === true, 'Ankastre + mafsal + hareketli → stabil (Gerber)');

    // Mafsalın bir tarafında mesnet yok → mekanizma
    sandbox.supports = [{ type: 'fixed-support', x: 0 }, { type: 'roller-support', x: 30 }];
    check(fns.isSystemStable() === false, 'Mafsalın sağında mesnet yok → mekanizma (reddedilir)');
}

// =====================================================================
console.log(`\nSonuç: ${passed} başarılı, ${failed} başarısız\n`);
process.exit(failed > 0 ? 1 : 0);
