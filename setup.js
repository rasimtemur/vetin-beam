// common/setup.js

// 1. Global Değişkenlerin DEKLARASYONU (Atama Yok)
// DOM'a bağlı olanlar 'let' ile tanımsız olarak başlatılır.
let canvas, ctx, gridSizeInput, metersPerGridInput, kNPerGridInput, elasticityInput, momentOfInertiaInput, fbdCanvas, fbdCtx, body, fullscreenBtn;

// DOM'a bağlı olmayan durum ve sabit değişkenleri burada tanımlanabilir.
const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
const COLORS = { BEAM_FILL: 'rgba(56, 159, 182, 0.2)', BEAM_STROKE: '#389fb6', SUPPORT: '#4f5659', LOAD: '#d9534f', REACTION: '#5cb85c', PREVIEW: 'rgba(0, 122, 255, 0.5)', DIMENSION: '#555', GRID: '#e9e9ed' };
const EPSILON = 1e-9;

// Application State (Uygulama Durumu)
let currentTool = 'beam', beam = null, supports = [], hinges = [];
let concentratedLoads = [], distributedLoads = [], trapezoidalLoads = [];
let concentratedMoments = [], torsionMoments = [];
let isDrawing = false, isResizing = false, activeHandle = null;
let drawingStage = 0, loadStartPoint = null, confirmedMagnitude1 = 0;
let isDrawingConcentratedLoad = false, concentratedLoadStartPoint = null;
let isDrawingConcentratedMoment = false, isDrawingTorsionMoment = false, momentStartPoint = null;
let isDraggingSupport = false, draggedSupportIndex = null;
let isDraggingHinge = false, draggedHingeIndex = null;
let hasDragged = false;
let isResizingDistLoad = false, resizedDistLoadIndex = null, activeDistLoadHandle = null;
let clickedDistLoadIndex = null;
let isResizingTrapLoad = false, resizedTrapLoadIndex = null, activeTrapLoadHandle = null;
let clickedTrapLoadIndex = null;
let isMovingConcentratedLoad = false, draggedConcentratedLoadIndex = null, clickedConcentratedLoadIndex = null;
let isMovingDistLoad = false, draggedDistLoadIndex = null;
let isMovingTrapLoad = false, draggedTrapLoadIndex = null;
let isMovingConcentratedMoment = false, draggedConcentratedMomentIndex = null, clickedConcentratedMomentIndex = null;
let isMovingTorsionMoment = false, draggedTorsionMomentIndex = null, clickedTorsionMomentIndex = null;
let startPoint = { x: 0, y: 0 };
let currentMousePos = { x: 0, y: 0 };
let currentRawMousePos = { x: 0, y: 0 };
let shearChart = null, momentChart = null, normalForceChart = null, torsionChart = null, elasticCurveChart = null;
let firstTapPoint = null;
let calculatedReactions = [], calculatedMomentReaction = 0, calculatedAxialReaction = null;
let userVisibilityPrefs = {};
let diagramData = {
    normal: { labels: [], datasets: [{ data: [] }] },
    shear: { labels: [], datasets: [{ data: [] }] },
    moment: { labels: [], datasets: [{ data: [] }] },
    torsion: { labels: [], datasets: [{ data: [] }] },
    elasticCurve: { labels: [], datasets: [{ data: [] }] }
};

// --- YENİ EKLENEN HIZALAMA PLUGİNİ (KÜRESEL) ---
const chartAlignmentPlugin = {
    id: 'chartAlignmentPlugin',
    beforeLayout: (chart) => {
        if (!beam || !canvas || !chart.canvas) return;
        
        const yAxisWidth = 100;
        
        const beamRect = canvas.getBoundingClientRect();
        const chartRect = chart.canvas.getBoundingClientRect();
        
        // Exact horizontal offset between structural canvas and diagram canvas
        const canvasDiffX = beamRect.left - chartRect.left;
        
        // Target: paddingLeft + yAxisWidth = canvasDiffX + beam.startX
        const paddingLeft = canvasDiffX + beam.startX - yAxisWidth;
        
        const beamWidth = beam.endX - beam.startX;
        const paddingRight = chartRect.width - (paddingLeft + yAxisWidth + beamWidth);

        chart.options.layout.padding = {
            left: Math.max(0, paddingLeft),
            right: Math.max(0, paddingRight),
            top: 10,
            bottom: 10
        };
    }
};

/**
 * 2. DOM Değişkenlerini ATAMA Fonksiyonu
 * Bu fonksiyon, HTML yapısı oluşturulduktan sonra çağrılmalıdır.
 */
function initializeDOMVariables() {
    canvas = document.getElementById('drawingCanvas');
    ctx = canvas.getContext('2d');
    gridSizeInput = document.getElementById('gridSize');
    metersPerGridInput = document.getElementById('metersPerGrid');
    kNPerGridInput = document.getElementById('kNPerGrid');
    elasticityInput = document.getElementById('elasticityModulus');
    momentOfInertiaInput = document.getElementById('momentOfInertia');
    fbdCanvas = document.getElementById('freeBodyDiagramCanvas');
    fbdCtx = fbdCanvas.getContext('2d');
    body = document.body;
    fullscreenBtn = document.getElementById('fullscreen-btn');
}