// common/calculations.js

function isSystemStable() {
    if (!beam) return false;
    const fixedCount = supports.filter(s => s.type === 'fixed-support').length;
    const pinCount = supports.filter(s => s.type === 'pin-support').length;
    const rollerCount = supports.filter(s => s.type === 'roller-support').length;
    const unknownCount = fixedCount * 3 + pinCount * 2 + rollerCount * 1;
    const equationCount = 3 + (hinges ? hinges.length : 0);
    if (hinges && hinges.length > 0) {
        return unknownCount === equationCount;
    }
    const simpleCount = pinCount + rollerCount;
    const isCantilever = fixedCount === 1 && simpleCount === 0;
    const isSimplySupported = fixedCount === 0 && simpleCount === 2;
    return isCantilever || isSimplySupported;
}

function calculate(isLiveUpdate = false) {
    if (!beam || beam.length <= 0) return;
    if (hinges && hinges.length > 0) {
        solveGerberSystem(isLiveUpdate);
    } else {
        solveStandardSystem(isLiveUpdate);
    }
}

function solveStandardSystem(isLiveUpdate = false) {
    const results = solveIsostaticPart(beam, supports, {
        concentrated: concentratedLoads,
        distributed: distributedLoads,
        trapezoidal: trapezoidalLoads,
        moments: concentratedMoments
    });
    if (!results) return;
    generateAndDrawDiagrams(results.allReactions, results.M_fixed, null, isLiveUpdate, distributedLoads, trapezoidalLoads, null);
}

function solveGerberSystem(isLiveUpdate = false) {
    if (hinges.length !== 1) {
        alert("Bu çözüm şimdilik yalnızca bir adet ara mafsal içeren sistemleri desteklemektedir.");
        return;
    }
    let computationalDistLoads = [...distributedLoads];
    let computationalTrapLoads = [...trapezoidalLoads];
    const { toMeters } = getConversionFunctions();
    hinges.forEach(hinge => {
        const hinge_x = hinge.x;
        const newDistLoads = [];
        computationalDistLoads.forEach(load => {
            const startX = Math.min(load.startX, load.endX);
            const endX = Math.max(load.startX, load.endX);
            if (hinge_x > startX + EPSILON && hinge_x < endX - EPSILON) {
                const load1 = { ...load, startX: load.startX, endX: hinge_x };
                const load2 = { ...load, startX: hinge_x, endX: load.endX };
                newDistLoads.push(load1, load2);
            } else { newDistLoads.push(load); }
        });
        computationalDistLoads = newDistLoads;
        const newTrapLoads = [];
        computationalTrapLoads.forEach(load => {
            const startX = Math.min(load.startX, load.endX);
            const endX = Math.max(load.startX, load.endX);
            if (hinge_x > startX + EPSILON && hinge_x < endX - EPSILON) {
                const hinge_m = toMeters(hinge_x);
                const magnitudeAtHinge = getDistributedLoadAt(hinge_m, toMeters, load);
                const load1 = { ...load, startX: load.startX, endX: hinge_x, startMagnitude: load.startMagnitude, endMagnitude: magnitudeAtHinge };
                const load2 = { ...load, startX: hinge_x, endX: load.endX, startMagnitude: magnitudeAtHinge, endMagnitude: load.endMagnitude };
                newTrapLoads.push(load1, load2);
            } else { newTrapLoads.push(load); }
        });
        computationalTrapLoads = newTrapLoads;
    });
    const hinge = hinges[0];
    const hinge_x = hinge.x;
    const supports_part1 = supports.filter(s => s.x < hinge_x);
    const supports_part2 = supports.filter(s => s.x > hinge_x);
    const hasFixedPart1 = supports_part1.some(s => s.type === 'fixed-support');
    const hasFixedPart2 = supports_part2.some(s => s.type === 'fixed-support');
    let primarySupports, secondarySupports, primaryBeam, secondaryBeam;
    if (hasFixedPart1) {
        primarySupports = supports_part1; secondarySupports = supports_part2;
        primaryBeam = { startX: beam.startX, endX: hinge_x }; secondaryBeam = { startX: hinge_x, endX: beam.endX };
    } else if (hasFixedPart2) {
        primarySupports = supports_part2; secondarySupports = supports_part1;
        primaryBeam = { startX: hinge_x, endX: beam.endX }; secondaryBeam = { startX: beam.startX, endX: hinge_x };
    } else {
        if (supports_part1.length === 1 && supports_part2.length >= 1) {
            secondarySupports = supports_part1; primarySupports = supports_part2;
            secondaryBeam = { startX: beam.startX, endX: hinge_x }; primaryBeam = { startX: hinge_x, endX: beam.endX };
        } else if (supports_part2.length === 1 && supports_part1.length >= 1) {
            secondarySupports = supports_part2; primarySupports = supports_part1;
            secondaryBeam = { startX: hinge_x, endX: beam.endX }; primaryBeam = { startX: beam.startX, endX: hinge_x };
        } else { console.error("Sistem çözülemiyor..."); return; }
    }
    const tempHingeSupport = { type: 'pin-support', x: hinge_x };
    const secondarySupportsWithHinge = [...secondarySupports, tempHingeSupport];
    const secondaryLoads = {
        concentrated: concentratedLoads.filter(l => l.x >= secondaryBeam.startX && l.x <= secondaryBeam.endX),
        distributed: computationalDistLoads.filter(l => Math.max(l.startX, l.endX) <= secondaryBeam.endX && Math.min(l.startX, l.endX) >= secondaryBeam.startX),
        trapezoidal: computationalTrapLoads.filter(l => Math.max(l.startX, l.endX) <= secondaryBeam.endX && Math.min(l.startX, l.endX) >= secondaryBeam.startX),
        moments: concentratedMoments.filter(m => m.x >= secondaryBeam.startX && m.x <= secondaryBeam.endX)
    };
    const secondaryResult = solveIsostaticPart(secondaryBeam, secondarySupportsWithHinge, secondaryLoads);
    if (!secondaryResult) return;
    const hingeReaction = secondaryResult.allReactions.find(r => r.x === hinge_x);
    if (!hingeReaction) return;
    const reactionAsLoad = { x: hinge_x, y: beam.startY - 10, magnitude: hingeReaction.magnitude, angle: Math.PI / 2 };
    const primaryLoads = {
        concentrated: concentratedLoads.filter(l => l.x >= primaryBeam.startX && l.x < primaryBeam.endX),
        distributed: computationalDistLoads.filter(l => Math.max(l.startX, l.endX) <= primaryBeam.endX && Math.min(l.startX, l.endX) >= primaryBeam.startX),
        trapezoidal: computationalTrapLoads.filter(l => Math.max(l.startX, l.endX) <= primaryBeam.endX && Math.min(l.startX, l.endX) >= primaryBeam.startX),
        moments: concentratedMoments.filter(m => m.x >= primaryBeam.startX && m.x < primaryBeam.endX)
    };
    primaryLoads.concentrated.push(reactionAsLoad);
    const primaryResult = solveIsostaticPart(primaryBeam, primarySupports, primaryLoads);
    if (!primaryResult) return;
    const finalReactions = [ ...primaryResult.allReactions, ...secondaryResult.allReactions.filter(r => r.x !== hinge_x) ];
    const hingeData = { x: hinge.x, magnitude: hingeReaction.magnitude };
    generateAndDrawDiagrams(finalReactions, primaryResult.M_fixed, null, isLiveUpdate, computationalDistLoads, computationalTrapLoads, hingeData);
}

function solveIsostaticPart(partBeam, partSupports, partLoads) {
    const { toMeters } = getConversionFunctions();
    const fixedCount = partSupports.filter(s => s.type === 'fixed-support').length;
    const simpleCount = partSupports.filter(s => s.type !== 'fixed-support').length;
    if (!((fixedCount === 1 && simpleCount === 0) || (fixedCount === 0 && simpleCount === 2))) { return null; }
    let allReactions = [], M_fixed = 0;
    if (fixedCount === 1) {
        const fixedSupport = partSupports.find(s => s.type === 'fixed-support');
        const fixed_pos_m = toMeters(fixedSupport.x);
        let totalMomentAboutFixed = 0, totalForce = 0;
        partLoads.concentrated.forEach(l => { const f = -l.magnitude * Math.sin(l.angle); totalMomentAboutFixed += f * (toMeters(l.x) - fixed_pos_m); totalForce += f; });
        partLoads.distributed.forEach(l => { const s = toMeters(Math.min(l.startX, l.endX)), e = toMeters(Math.max(l.startX, l.endX)), len = e - s, w = Math.abs(l.magnitude), f = -w * len, c = s + len / 2; totalMomentAboutFixed += f * (c - fixed_pos_m); totalForce += f; });
        partLoads.trapezoidal.forEach(l => { const s = toMeters(Math.min(l.startX, l.endX)), e = toMeters(Math.max(l.startX, l.endX)), len = e - s; if (len < EPSILON) return; const w1 = Math.abs((l.startX < l.endX) ? l.startMagnitude : l.endMagnitude), w2 = Math.abs((l.startX < l.endX) ? l.endMagnitude : l.startMagnitude), f = -len * (w1 + w2) / 2; let c = s + len / 2; if (Math.abs(w1 + w2) > EPSILON) { c = s + (len / 3) * (w1 + 2 * w2) / (w1 + w2); } totalMomentAboutFixed += f * (c - fixed_pos_m); totalForce += f; });
        partLoads.moments.forEach(m => { totalMomentAboutFixed -= m.magnitude; });
        const R_vertical = -totalForce;
        M_fixed = -totalMomentAboutFixed;
        allReactions.push({ x: fixedSupport.x, magnitude: R_vertical });
    } else {
        const supportLeft = partSupports[0].x < partSupports[1].x ? partSupports[0] : partSupports[1];
        const supportRight = partSupports[0].x < partSupports[1].x ? partSupports[1] : partSupports[0];
        const left_pos_m = toMeters(supportLeft.x), right_pos_m = toMeters(supportRight.x);
        let totalMomentAboutLeft = 0, totalForce = 0;
        partLoads.concentrated.forEach(l => { const f = -l.magnitude * Math.sin(l.angle); totalMomentAboutLeft += f * (toMeters(l.x) - left_pos_m); totalForce += f; });
        partLoads.distributed.forEach(l => { const s = toMeters(Math.min(l.startX, l.endX)), e = toMeters(Math.max(l.startX, l.endX)), len = e - s, w = Math.abs(l.magnitude), f = -w * len, c = s + len / 2; totalMomentAboutLeft += f * (c - left_pos_m); totalForce += f; });
        partLoads.trapezoidal.forEach(l => { const s = toMeters(Math.min(l.startX, l.endX)), e = toMeters(Math.max(l.startX, l.endX)), len = e - s; if (len < EPSILON) return; const w1 = Math.abs((l.startX < l.endX) ? l.startMagnitude : l.endMagnitude), w2 = Math.abs((l.startX < l.endX) ? l.endMagnitude : l.startMagnitude), f = -len * (w1 + w2) / 2; let c = s + len / 2; if (Math.abs(w1 + w2) > EPSILON) { c = s + (len / 3) * (w1 + 2 * w2) / (w1 + w2); } totalMomentAboutLeft += f * (c - left_pos_m); totalForce += f; });
        partLoads.moments.forEach(m => { totalMomentAboutLeft -= m.magnitude; });
        const R_right = -totalMomentAboutLeft / (right_pos_m - left_pos_m);
        const R_left = -totalForce - R_right;
        allReactions.push({ x: supportLeft.x, magnitude: R_left });
        allReactions.push({ x: supportRight.x, magnitude: R_right });
    }
    return { allReactions, M_fixed };
}

function calculateAxialReaction() {
    const pinOrFixedSupport = supports.find(s => s.type === 'pin-support' || s.type === 'fixed-support');
    if (!pinOrFixedSupport) { return null; }
    const totalAxialLoad = concentratedLoads.reduce((sum, load) => sum + (load.magnitude * Math.cos(load.angle)), 0);
    return { x: pinOrFixedSupport.x, magnitude: -totalAxialLoad };
}

function generateAndDrawDiagrams(allReactions, M_fixed, T_reaction, isLiveUpdate, compDistLoads = distributedLoads, compTrapLoads = trapezoidalLoads, hingeData = null, interpolationPoints = 50) {
    const { toMeters } = getConversionFunctions();
    const L = toMeters(beam.endX) - toMeters(beam.startX);
    let eventPoints_m = [0, L];
    supports.forEach(s => eventPoints_m.push(toMeters(s.x)));
    hinges.forEach(h => eventPoints_m.push(toMeters(h.x)));
    concentratedLoads.forEach(p => eventPoints_m.push(toMeters(p.x)));
    concentratedMoments.forEach(m => eventPoints_m.push(toMeters(m.x)));
    [...distributedLoads, ...trapezoidalLoads].forEach(d => {
        const s = toMeters(Math.min(d.startX, d.endX)), e = toMeters(Math.max(d.startX, d.endX));
        eventPoints_m.push(s, e);
        const intermediatePoints = (interpolationPoints > 100) ? 20 : 5;
        for (let i = 1; i < intermediatePoints; i++) { eventPoints_m.push(s + i * (e - s) / intermediatePoints); }
    });

    const numberOfInterpolationPoints = interpolationPoints;
    if (L > 0 && numberOfInterpolationPoints > 0) {
        const stepSize = L / numberOfInterpolationPoints;
        for (let i = 0; i <= numberOfInterpolationPoints; i++) {
            eventPoints_m.push(i * stepSize);
        }
    }
    
    const uniqueSortedPoints = [...new Set(eventPoints_m)].sort((a, b) => a - b).filter(p => p >= -EPSILON && p <= L + EPSILON);
    let shearPoints = [], momentPoints = [];
    uniqueSortedPoints.forEach(x => {
        const V_before = getShearAt(x - EPSILON, allReactions, toMeters);
        const V_at = getShearAt(x, allReactions, toMeters);
        if (shearPoints.length > 0 && Math.abs(V_at - V_before) > EPSILON && Math.abs(x - shearPoints[shearPoints.length - 1].x) < EPSILON) { shearPoints.pop(); }
        if (shearPoints.length === 0 || Math.abs(x - shearPoints[shearPoints.length - 1].x) > EPSILON) { shearPoints.push({ x: x, y: V_before }); }
        shearPoints.push({ x: x, y: V_at });
        const M_before = getMomentAt(x - EPSILON, allReactions, M_fixed, toMeters);
        const M_at = getMomentAt(x, allReactions, M_fixed, toMeters);
        if (momentPoints.length > 0 && Math.abs(M_at - M_before) > EPSILON && Math.abs(x - momentPoints[momentPoints.length - 1].x) < EPSILON) { momentPoints.pop(); }
        if (momentPoints.length === 0 || Math.abs(x - momentPoints[momentPoints.length - 1].x) > EPSILON) { momentPoints.push({ x: x, y: M_before }); }
        momentPoints.push({ x: x, y: M_at });
    });
    
    diagramData.shear = { labels: shearPoints.map(p => p.x), datasets: [{ data: shearPoints.map(p => p.y), borderColor: COLORS.LOAD }] };
    diagramData.moment = { labels: momentPoints.map(p => p.x), datasets: [{ data: momentPoints.map(p => p.y), borderColor: COLORS.BEAM_STROKE }] };
    
    // Elastic Curve Calculation
    const E = (elasticityInput && elasticityInput.value) ? parseFloat(elasticityInput.value) : 200;
    const I = (momentOfInertiaInput && momentOfInertiaInput.value) ? parseFloat(momentOfInertiaInput.value) : 1000;
    const elasticCurvePoints = getElasticCurvePoints(uniqueSortedPoints, allReactions, M_fixed, toMeters, E, I);
    diagramData.elasticCurve = { labels: elasticCurvePoints.map(p => p.x), datasets: [{ data: elasticCurvePoints.map(p => p.y), borderColor: COLORS.BEAM_STROKE }] };

    const axialReaction = calculateAxialReaction();
    drawFreeBodyDiagram(allReactions, M_fixed, T_reaction, axialReaction, compDistLoads, compTrapLoads, hingeData);
    drawDiagrams(shearPoints, momentPoints, elasticCurvePoints, L, isLiveUpdate);
    
    calculatedReactions = allReactions;
    calculatedMomentReaction = M_fixed;
    calculatedAxialReaction = axialReaction;
}

const getShearAt = (x_m, allReactions, toMetersFunc) => {
    let shear = 0;
    allReactions.forEach(r => { if (x_m >= toMetersFunc(r.x)) { shear += r.magnitude; } });
    concentratedLoads.forEach(l => { if (x_m >= toMetersFunc(l.x)) { shear += -l.magnitude * Math.sin(l.angle); } });
    [...distributedLoads, ...trapezoidalLoads].forEach(l => {
        const s = toMetersFunc(Math.min(l.startX, l.endX)), e = toMetersFunc(Math.max(l.startX, l.endX));
        if (x_m > s) {
            const xe = Math.min(x_m, e), w_s = Math.abs(getDistributedLoadAt(s, toMetersFunc, l)), w_e = Math.abs(getDistributedLoadAt(xe, toMetersFunc, l));
            // Internal shear decreases with downward load
            shear -= (w_s + w_e) / 2 * (xe - s);
        }
    });
    return shear;
};

const getMomentAt = (x_m, allReactions, M_f, toMetersFunc) => {
    let moment = 0;
    allReactions.forEach(r => { const r_pos = toMetersFunc(r.x); if (x_m >= r_pos) { moment += r.magnitude * (x_m - r_pos); } });
    if (M_f) {
        const fixedSupport = supports.find(s => s.type === 'fixed-support');
        // Anti-clockwise reaction M_f at start creates tension at top (negative moment)
        if (fixedSupport && x_m >= toMetersFunc(fixedSupport.x)) { moment -= M_f; }
    }
    concentratedLoads.forEach(l => { const p_pos = toMetersFunc(l.x); if (x_m >= p_pos) { moment += -l.magnitude * Math.sin(l.angle) * (x_m - p_pos); } });
    [...distributedLoads, ...trapezoidalLoads].forEach(l => {
        const s = toMetersFunc(Math.min(l.startX, l.endX)), e = toMetersFunc(Math.max(l.startX, l.endX));
        if (x_m > s) {
            const xe = Math.min(x_m, e), len = xe - s; if (len < EPSILON) return;
            const w_s = Math.abs(getDistributedLoadAt(s, toMetersFunc, l)), w_e = Math.abs(getDistributedLoadAt(xe, toMetersFunc, l)), force = (w_s + w_e) / 2 * len;
            let centroid = s + len / 2;
            if (Math.abs(w_s + w_e) > EPSILON) { centroid = s + (len / 3) * (w_s + 2 * w_e) / (w_s + w_e); }
            // Moment decreases (becomes more negative/tension at top) with downward load
            moment -= force * (x_m - centroid);
        }
    });
    concentratedMoments.forEach(m => { 
        const m_pos = toMetersFunc(m.x); 
        // Clockwise external moment m adds to internal sagging moment? 
        // Balanced internally: -M_int + M_ext = 0 => M_int = M_ext.
        // In solveIsostaticPart, m.magnitude positive = clockwise.
        // Clockwise jump at left is positive moment jump.
        if (x_m >= m_pos) { moment += m.magnitude; } 
    });
    return moment;
};

const getDistributedLoadAt = (x_m, toMetersFunc, load) => {
    if (load.startMagnitude === undefined) { return load.magnitude; }
    const s = toMetersFunc(load.startX), e = toMetersFunc(load.endX), s_m = Math.min(s, e), e_m = Math.max(s, e), len = e_m - s_m;
    if (len < EPSILON) return load.startMagnitude;
    const ratio = (x_m - s_m) / len;
    const w1 = load.startX < load.endX ? load.startMagnitude : load.endMagnitude;
    const w2 = load.startX < load.endX ? load.endMagnitude : load.startMagnitude;
    return w1 + (w2 - w1) * ratio;
};

function calculateAndDrawAxialDiagram(isLiveUpdate = false) {
    const hasAxialForces = concentratedLoads.some(l => Math.abs(l.magnitude * Math.cos(l.angle)) > EPSILON);
    if (!beam || !isSystemStable() || !hasAxialForces) { if (normalForceChart) { normalForceChart.destroy(); normalForceChart = null; } return; }
    const axialReaction = calculateAxialReaction();
    if (!axialReaction) { return; }
    const { toMeters } = getConversionFunctions();
    const L = toMeters(beam.endX) - toMeters(beam.startX);
    const horizontalComponents = concentratedLoads.map(l => ({ x: l.x, magnitude: l.magnitude * Math.cos(l.angle) }));
    const allHorizontalForces = [...horizontalComponents, axialReaction].sort((a, b) => a.x - b.x);
    let normalForcePoints = [], currentNormalForce = 0;
    normalForcePoints.push({ x: 0, y: currentNormalForce });
    allHorizontalForces.forEach((force) => {
        const x_m = toMeters(force.x) - toMeters(beam.startX);
        if (x_m > 0 && (normalForcePoints.length === 0 || Math.abs(x_m - normalForcePoints[normalForcePoints.length - 1].x) > EPSILON)) { normalForcePoints.push({ x: x_m, y: currentNormalForce }); }
        currentNormalForce += force.magnitude;
        normalForcePoints.push({ x: x_m, y: currentNormalForce });
    });
    if (normalForcePoints.length === 0 || normalForcePoints[normalForcePoints.length - 1].x < L) { normalForcePoints.push({ x: L, y: currentNormalForce }); }
    
    diagramData.normal = { labels: normalForcePoints.map(p => p.x), datasets: [{ data: normalForcePoints.map(p => p.y), borderColor: COLORS.REACTION }] };
    
    const metersPerGrid = parseFloat(metersPerGridInput.value) || 1;
    const currentLang = document.documentElement.lang || 'tr';
    const axisTitles = translations[currentLang].diagramAxes;
    
    const chartOptions = { 
        scales: { 
            x: { 
                type: 'linear', min: 0, max: L, ticks: { autoSkip: false, stepSize: metersPerGrid, font: { size: 10 }, callback: function(v) { return v.toFixed(1) + 'm'; } },
                title: {
                    display: true,
                    text: `${axisTitles.length} (${axisTitles.unitM})`
                }
            }, 
            y: { 
                grid: { color: COLORS.GRID }, 
                ticks: { padding: 10 },
                title: {
                    display: true,
                    text: `${axisTitles.axialForce} (${axisTitles.unitKN})`,
                    padding: { top: 25 }
                },
                afterFit: (axis) => { axis.width = 100; }
            } 
        }, 
        plugins: { legend: { display: false }, tooltip: { intersect: false, mode: 'index' } }, 
        elements: { point: { radius: 0, hoverRadius: 4 } }, 
        maintainAspectRatio: false, 
        hover: { mode: 'index', intersect: false, animation: { duration: 0 } }
    };
    if (isLiveUpdate) chartOptions.animation = { duration: 0 };
    if (normalForceChart) normalForceChart.destroy();
    normalForceChart = new Chart(document.getElementById('normalForceDiagram').getContext('2d'), { 
        type: 'line', 
        data: { datasets: [{ data: normalForcePoints, borderColor: COLORS.REACTION, backgroundColor: COLORS.REACTION + '33', borderWidth: 2, fill: 'origin', stepped: true }] }, 
        plugins: [chartAlignmentPlugin],
        options: chartOptions 
    });
}

function calculateAndDrawTorsionDiagram() {
    if (hinges && hinges.length > 0) { if (torsionChart) { torsionChart.destroy(); torsionChart = null; } return; }
    const hasTorsion = torsionMoments.length > 0;
    if (!beam || !hasTorsion) { if (torsionChart) { torsionChart.destroy(); torsionChart = null; } return; }
    const fixedSupport = supports.find(s => s.type === 'fixed-support');
    if (!fixedSupport) { alert("Burulma momenti diyagramı çizebilmek için sisteme bir Ankastre Mesnet eklemelisiniz."); if (torsionChart) { torsionChart.destroy(); torsionChart = null; } return; }
    const { toMeters } = getConversionFunctions();
    const L = toMeters(beam.endX) - toMeters(beam.startX);
    const totalTorsion = torsionMoments.reduce((sum, t) => sum + t.magnitude, 0);
    const torsionReaction = { x: fixedSupport.x, magnitude: -totalTorsion };
    const allTorsionForces = [...torsionMoments, torsionReaction].sort((a, b) => a.x - b.x);
    let torsionPoints = [], currentTorsion = 0;
    torsionPoints.push({ x: 0, y: currentTorsion });
    allTorsionForces.forEach((force) => {
        const x_m = toMeters(force.x) - toMeters(beam.startX);
        if (x_m > 0 && (torsionPoints.length === 0 || Math.abs(x_m - torsionPoints[torsionPoints.length - 1].x) > EPSILON)) { torsionPoints.push({ x: x_m, y: currentTorsion }); }
        currentTorsion += force.magnitude;
        torsionPoints.push({ x: x_m, y: currentTorsion });
    });
    if (torsionPoints.length === 0 || torsionPoints[torsionPoints.length - 1].x < L) { torsionPoints.push({ x: L, y: currentTorsion }); }
    
    diagramData.torsion = { labels: torsionPoints.map(p => p.x), datasets: [{ data: torsionPoints.map(p => p.y), borderColor: COLORS.LOAD }] };
    
    const metersPerGrid = parseFloat(metersPerGridInput.value) || 1;
    const currentLang = document.documentElement.lang || 'tr';
    const axisTitles = translations[currentLang].diagramAxes;
    
    const chartOptions = { 
        scales: { 
            x: { 
                type: 'linear', min: 0, max: L, ticks: { autoSkip: false, stepSize: metersPerGrid, font: { size: 10 }, callback: function(v) { return v.toFixed(1) + 'm'; } },
                title: {
                    display: true,
                    text: `${axisTitles.length} (${axisTitles.unitM})`
                }
            }, 
            y: { 
                grid: { color: COLORS.GRID }, 
                ticks: { padding: 10 },
                title: {
                    display: true,
                    text: `${axisTitles.torsionalMoment} (${axisTitles.unitKNM})`,
                    padding: { top: 25 }
                },
                afterFit: (axis) => { axis.width = 100; }
            } 
        }, 
        plugins: { legend: { display: false }, tooltip: { intersect: false, mode: 'index' } }, 
        elements: { point: { radius: 0, hoverRadius: 4 } }, 
        maintainAspectRatio: false, 
        hover: { mode: 'index', intersect: false, animation: { duration: 0 } }
    };
    if (torsionChart) torsionChart.destroy();
    torsionChart = new Chart(document.getElementById('torsionMomentDiagram').getContext('2d'), { 
        type: 'line', 
        data: { datasets: [{ data: torsionPoints, borderColor: COLORS.LOAD, backgroundColor: COLORS.LOAD + '33', borderWidth: 2, fill: 'origin', stepped: true }] }, 
        plugins: [chartAlignmentPlugin],
        options: chartOptions 
    });
}

function getElasticCurvePoints(points, allReactions, M_fixed, toMetersFunc, E_gpa, I_cm4) {
    // E (GPa) = 1e6 kN/m²
    // I (cm⁴) = 1e-8 m⁴
    // EI (kNm²) = E * 1e6 * I * 1e-8 = E * I * 0.01
    // Deflection [m] = ∫∫ (M / EI) dxdx
    // Deflection [mm] = (1000 / EI) * ∫∫ M dxdx
    // Factor = 1000 / (E * I * 0.01) = 100,000 / (E * I)
    const factor = 100000 / (E_gpa * I_cm4);
    
    let F = [], G = [], cIM = 0, cDIM = 0;
    F.push({ x: points[0], y: 0 }); G.push({ x: points[0], y: 0 });
    for (let i = 1; i < points.length; i++) {
        const x0 = points[i-1], x1 = points[i], dx = x1 - x0;
        if (dx <= 0) continue;
        const M0 = getMomentAt(x0 + EPSILON, allReactions, M_fixed, toMetersFunc);
        const M1 = getMomentAt(x1 - EPSILON, allReactions, M_fixed, toMetersFunc);
        cDIM += cIM * dx + (dx * dx / 6) * (2 * M0 + M1);
        cIM += (M0 + M1) / 2 * dx;
        G.push({ x: x1, y: cIM }); F.push({ x: x1, y: cDIM });
    }
    let C1 = 0, C2 = 0;
    if (hinges.length === 0) {
        const fix = supports.find(s => s.type === 'fixed-support');
        if (fix) { const xf = toMetersFunc(fix.x), id = points.findIndex(p => Math.abs(p - xf) < EPSILON); if (id !== -1) { C1 = -G[id].y; C2 = -F[id].y - C1 * xf; } }
        else if (supports.length >= 2) {
            const sl = [...supports].sort((a,b) => a.x - b.x), x1 = toMetersFunc(sl[0].x), x2 = toMetersFunc(sl[sl.length-1].x);
            const i1 = points.findIndex(p => Math.abs(p - x1) < EPSILON), i2 = points.findIndex(p => Math.abs(p - x2) < EPSILON);
            if (i1 !== -1 && i2 !== -1) { C1 = (F[i2].y - F[i1].y) / (x1 - x2); C2 = -F[i1].y - C1 * x1; }
        }
    } else {
        const xh = toMetersFunc(hinges[0].x), sl = supports.filter(s => toMetersFunc(s.x) < xh - EPSILON), sr = supports.filter(s => toMetersFunc(s.x) > xh + EPSILON);
        let ss, ps, ils; if (sl.length === 1 && sr.length >= 1) { ss = sl; ps = sr; ils = true; } else if (sr.length === 1 && sl.length >= 1) { ss = sr; ps = sl; ils = false; }
        if (ss && ps) {
            let P1 = 0, P2 = 0, fixP = ps.find(s => s.type === 'fixed-support');
            if (fixP) { const xf = toMetersFunc(fixP.x), id = points.findIndex(p => Math.abs(p-xf)<EPSILON); if (id !== -1) { P1 = -G[id].y; P2 = -F[id].y - P1 * xf; } }
            else if (ps.length >= 2) { const x1 = toMetersFunc(ps[0].x), x2 = toMetersFunc(ps[ps.length-1].x), i1 = points.findIndex(p => Math.abs(p-x1)<EPSILON), i2 = points.findIndex(p => Math.abs(p-x2)<EPSILON); if (i1!==-1&&i2!==-1) { P1 = (F[i2].y - F[i1].y) / (x1 - x2); P2 = -F[i1].y - P1 * x1; } }
            const idh = points.findIndex(p => Math.abs(p-xh)<EPSILON);
            if (idh !== -1) {
                const vh = F[idh].y + P1 * xh + P2, xs = toMetersFunc(ss[0].x), ids = points.findIndex(p => Math.abs(p-xs)<EPSILON);
                if (ids !== -1) {
                    const Fs = F[ids].y, Fh = F[idh].y, S1 = (-Fs - vh + Fh) / (xs - xh), S2 = -Fs - S1 * xs;
                    let c1, c2, d1, d2; if (ils) { c1 = S1; c2 = S2; d1 = P1; d2 = P2; } else { c1 = P1; c2 = P2; d1 = S1; d2 = S2; }
                    return points.map((x, i) => { const k1 = x < xh ? c1 : d1, k2 = x < xh ? c2 : d2; return { x: x, y: (F[i].y + k1 * x + k2) * factor }; });
                } } } } 
    return points.map((x, i) => ({ x: x, y: (F[i].y + C1 * x + C2) * factor }));
}
