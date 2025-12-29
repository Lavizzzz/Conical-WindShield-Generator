// === INPUT ===
const diametroPentolinoInput = document.getElementById("diametroPentolino");
const altezzaPentolinoInput = document.getElementById("altezzaPentolino");
const altezzaFornelloInput = document.getElementById("altezzaFornello");

const diametroBaseSpan = document.getElementById("diametroBase");
const altezzaParaventoSpan = document.getElementById("altezzaParavento");
const dimensioneFoglioSpan = document.getElementById("dimensioneFoglio");

// === CANVAS SEZIONE ===
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// === CANVAS SVILUPPO PIANO ===
const canvasFlatPattern = document.getElementById("canvasFlatPattern");
const ctxFlat = canvasFlatPattern.getContext("2d");

// === CALCOLO ===
document.getElementById("calcolaBtn").addEventListener("click", () => {
    const dp = parseFloat(diametroPentolinoInput.value);
    const hp = parseFloat(altezzaPentolinoInput.value);
    const hf = parseFloat(altezzaFornelloInput.value);
    const ha = 25; // spazio di aria tra fornellino e fondo del pentolino

    const baseDiameter = dp * 1.261;
    const windscreenHeight = hp + hf + ha;

    diametroBaseSpan.textContent = baseDiameter.toFixed(2);
    altezzaParaventoSpan.textContent = windscreenHeight.toFixed(2);
    dimensioneFoglioSpan.textContent =
        `${windscreenHeight.toFixed(2)} x ${(baseDiameter * Math.PI).toFixed(2)}`;

    drawWindshield(dp, baseDiameter, windscreenHeight, hf, hp);
    drawFlatPattern(dp, baseDiameter, windscreenHeight);
});

// ============================================================
// FUNZIONE 1: VISTA IN SEZIONE
// ============================================================
function drawWindshield(dp, db, hpv, hf, hp) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "rgba(0,255,255,0.2)";
    ctx.strokeStyle = "cyan";
    ctx.lineWidth = 2;

    const offsetX = 50;
    const offsetY = 50;
    const scale = 1.5;

    const xBase = offsetX;
    const yBase = offsetY + hpv * scale;
    const xTop = offsetX + ((db - dp) / 2) * scale;
    const yTop = offsetY;

    // Trapezio paravento
    ctx.beginPath();
    ctx.moveTo(xBase, yBase);
    ctx.lineTo(xTop, yTop);
    ctx.lineTo(xTop + dp * scale, yTop);
    ctx.lineTo(xBase + db * scale, yBase);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Pentolino
    ctx.fillStyle = "orange";
    ctx.fillRect(xTop, yTop, dp * scale, hp * scale);

    // Fornello
    ctx.fillStyle = "brown";
    ctx.fillRect(
        xTop + dp * scale * 0.25,
        yBase - hf * scale,
        dp * scale * 0.5,
        hf * scale
    );

    // Titolo
    ctx.fillStyle = "#fff";
    ctx.font = "16px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Vista Sezione", canvas.width / 2, canvas.height - 20);
}

// ============================================================
// FUNZIONE 2: SVILUPPO PIANO CONO (CENTRATO CORRETTAMENTE)
// ============================================================
function drawFlatPattern(dp, baseDiameter, windscreenHeight) {
    const topRadius = dp / 2;
    const baseRadius = baseDiameter / 2;

    // === PARAMETRI CHIUSURA A SCORRIMENTO ===
    const overlapInner = 5; // mm → linguetta interna (da ripiegare dentro)
    const overlapOuter = 5; // mm → linguetta esterna (da ripiegare fuori)

    // === GEOMETRIA ===
    const slantHeight = Math.sqrt(
        windscreenHeight ** 2 + (baseRadius - topRadius) ** 2
    );

    const R = (slantHeight * baseRadius) / (baseRadius - topRadius);
    const r = R - slantHeight;

    const sectorAngleDeg = (360 * baseRadius) / R;
    const baseAngleRad = (sectorAngleDeg * Math.PI) / 180;

    // Angoli extra per le due linguette
    const extraAngleInnerRad = overlapInner / R;
    const extraAngleOuterRad = overlapOuter / R;
    const angleRad = baseAngleRad + extraAngleInnerRad + extraAngleOuterRad;

    // === CANVAS ===
    ctxFlat.clearRect(0, 0, canvasFlatPattern.width, canvasFlatPattern.height);
    ctxFlat.fillStyle = "#ffffff";
    ctxFlat.fillRect(0, 0, canvasFlatPattern.width, canvasFlatPattern.height);

    // === LAYOUT ===
    const padding = 60;
    const headerHeight = 100;
    const footerHeight = 80;

    const yellowZoneX = padding;
    const yellowZoneY = headerHeight;
    const yellowZoneWidth = canvasFlatPattern.width - padding * 2;
    const yellowZoneHeight =
        canvasFlatPattern.height - headerHeight - footerHeight;

    // === CALCOLO BOUNDING BOX REALE ===
    const segments = 200;
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    // Calcola i limiti reali della forma
    for (let i = 0; i <= segments; i++) {
        const a = -angleRad / 2 + (i / segments) * angleRad;
        
        // Arco esterno
        let x = R * Math.cos(a);
        let y = -R * Math.sin(a);
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
        
        // Arco interno
        x = r * Math.cos(a);
        y = -r * Math.sin(a);
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
    }

    const sectorWidth = maxX - minX;
    const sectorHeight = maxY - minY;

    // === SCALA ===
    const scale =
        Math.min(
            yellowZoneWidth / sectorWidth,
            yellowZoneHeight / sectorHeight
        ) * 0.9;

    const scaledR = R * scale;
    const scaledr = r * scale;

    // === CENTRATURA CORRETTA ===
    // Centro della zona disponibile
    const zoneCenterX = yellowZoneX + yellowZoneWidth / 2;
    const zoneCenterY = yellowZoneY + yellowZoneHeight / 2;
    
    // Centro del bounding box della forma (in coordinate scalate)
    const shapeCenterX = (minX + maxX) / 2 * scale;
    const shapeCenterY = (minY + maxY) / 2 * scale;
    
    // Vertice del settore circolare (punto di origine)
    const originX = zoneCenterX - shapeCenterX;
    const originY = zoneCenterY - shapeCenterY;

    // === RIEMPIMENTO ===
    ctxFlat.fillStyle = "rgba(217,70,166,0.08)";
    ctxFlat.beginPath();

    for (let i = 0; i <= segments; i++) {
        const a = -angleRad / 2 + (i / segments) * angleRad;
        const x = originX + scaledR * Math.cos(a);
        const y = originY - scaledR * Math.sin(a);
        i === 0 ? ctxFlat.moveTo(x, y) : ctxFlat.lineTo(x, y);
    }

    for (let i = segments; i >= 0; i--) {
        const a = -angleRad / 2 + (i / segments) * angleRad;
        const x = originX + scaledr * Math.cos(a);
        const y = originY - scaledr * Math.sin(a);
        ctxFlat.lineTo(x, y);
    }

    ctxFlat.closePath();
    ctxFlat.fill();

    // === CONTORNO (TAGLIO) ===
    ctxFlat.strokeStyle = "#d946a6";
    ctxFlat.lineWidth = 4;

    const drawArc = radius => {
        ctxFlat.beginPath();
        for (let i = 0; i <= segments; i++) {
            const a = -angleRad / 2 + (i / segments) * angleRad;
            const x = originX + radius * Math.cos(a);
            const y = originY - radius * Math.sin(a);
            i === 0 ? ctxFlat.moveTo(x, y) : ctxFlat.lineTo(x, y);
        }
        ctxFlat.stroke();
    };

    drawArc(scaledR); // arco esterno
    drawArc(scaledr); // arco interno

    // === LATI ===
    [-angleRad / 2, angleRad / 2].forEach(a => {
        ctxFlat.beginPath();
        ctxFlat.moveTo(
            originX + scaledR * Math.cos(a),
            originY - scaledR * Math.sin(a)
        );
        ctxFlat.lineTo(
            originX + scaledr * Math.cos(a),
            originY - scaledr * Math.sin(a)
        );
        ctxFlat.stroke();
    });

    // === LINEA LINGUETTA INTERNA (tratteggiata blu) ===
    ctxFlat.strokeStyle = "#3b82f6";
    ctxFlat.lineWidth = 2;
    ctxFlat.setLineDash([8, 4]);

    const angleInnerFold = -angleRad / 2 + extraAngleInnerRad;
    ctxFlat.beginPath();
    ctxFlat.moveTo(
        originX + scaledR * Math.cos(angleInnerFold),
        originY - scaledR * Math.sin(angleInnerFold)
    );
    ctxFlat.lineTo(
        originX + scaledr * Math.cos(angleInnerFold),
        originY - scaledr * Math.sin(angleInnerFold)
    );
    ctxFlat.stroke();

    // === LINEA LINGUETTA ESTERNA (tratteggiata rossa) ===
    ctxFlat.strokeStyle = "#ef4444";
    ctxFlat.lineWidth = 2;
    ctxFlat.setLineDash([8, 4]);

    const angleOuterFold = angleRad / 2 - extraAngleOuterRad;
    ctxFlat.beginPath();
    ctxFlat.moveTo(
        originX + scaledR * Math.cos(angleOuterFold),
        originY - scaledR * Math.sin(angleOuterFold)
    );
    ctxFlat.lineTo(
        originX + scaledr * Math.cos(angleOuterFold),
        originY - scaledr * Math.sin(angleOuterFold)
    );
    ctxFlat.stroke();
    ctxFlat.setLineDash([]);

    // === TESTI ===
    ctxFlat.fillStyle = "#000";
    ctxFlat.font = "bold 20px Arial";
    ctxFlat.textAlign = "center";
    ctxFlat.fillText(
        "ANTEPRIMA SVILUPPO PIANO - Pronto per Stampare",
        canvasFlatPattern.width / 2,
        30
    );

    ctxFlat.font = "14px Arial";
    ctxFlat.fillStyle = "#555";
    ctxFlat.textAlign = "left";
    ctxFlat.fillText(`Ø superiore: ${dp.toFixed(1)} mm`, 20, 55);
    ctxFlat.fillText(`Ø base: ${baseDiameter.toFixed(1)} mm`, 20, 75);
    ctxFlat.fillText(`Altezza: ${windscreenHeight.toFixed(1)} mm`, 220, 55);
    ctxFlat.fillText(
        `Angolo settore: ${(angleRad * 180 / Math.PI).toFixed(1)}°`,
        220,
        75
    );
    
    // === LEGENDA CHIUSURA ===
    const legendX = canvasFlatPattern.width - 250;
    const legendY = 55;
    
    ctxFlat.fillStyle = "#000";
    ctxFlat.font = "bold 12px Arial";
    ctxFlat.fillText("CHIUSURA A SCORRIMENTO:", legendX, legendY);
    
    ctxFlat.font = "11px Arial";
    
    // Linea blu
    ctxFlat.strokeStyle = "#3b82f6";
    ctxFlat.lineWidth = 2;
    ctxFlat.setLineDash([8, 4]);
    ctxFlat.beginPath();
    ctxFlat.moveTo(legendX, legendY + 12);
    ctxFlat.lineTo(legendX + 30, legendY + 12);
    ctxFlat.stroke();
    ctxFlat.setLineDash([]);
    ctxFlat.fillStyle = "#3b82f6";
    ctxFlat.fillText("Piega INTERNA (5mm)", legendX + 35, legendY + 15);
    
    // Linea rossa
    ctxFlat.strokeStyle = "#ef4444";
    ctxFlat.lineWidth = 2;
    ctxFlat.setLineDash([8, 4]);
    ctxFlat.beginPath();
    ctxFlat.moveTo(legendX, legendY + 27);
    ctxFlat.lineTo(legendX + 30, legendY + 27);
    ctxFlat.stroke();
    ctxFlat.setLineDash([]);
    ctxFlat.fillStyle = "#ef4444";
    ctxFlat.fillText("Piega ESTERNA (5mm)", legendX + 35, legendY + 30);
}

// ============================================================
// FUNZIONE 3: DOWNLOAD SVG CONO (CORRETTO)
// ============================================================
document.getElementById("downloadSvgBtn").addEventListener("click", () => {
    exportConeSVG(
        parseFloat(diametroPentolinoInput.value),
        parseFloat(diametroBaseSpan.textContent),
        parseFloat(altezzaParaventoSpan.textContent)
    );
});

// ============================================================
// FUNZIONE 4: DOWNLOAD PDF (SCALA REALE PER STAMPA A4)
// ============================================================
document.getElementById("downloadPdfBtn").addEventListener("click", () => {
    exportConePDF(
        parseFloat(diametroPentolinoInput.value),
        parseFloat(diametroBaseSpan.textContent),
        parseFloat(altezzaParaventoSpan.textContent)
    );
});

function exportConeSVG(dp, baseDiameter, windscreenHeight) {
    // ===== GEOMETRIA =====
    const topRadius = dp / 2;
    const baseRadius = baseDiameter / 2;
    const overlapInner = 5;
    const overlapOuter = 5;

    const slantHeight = Math.sqrt(
        windscreenHeight ** 2 + (baseRadius - topRadius) ** 2
    );

    const R = (slantHeight * baseRadius) / (baseRadius - topRadius);
    const r = R - slantHeight;

    const sectorAngle = (2 * Math.PI * baseRadius) / R;
    const angle = sectorAngle + (overlapInner / R) + (overlapOuter / R);

    const steps = 300;
    
    // ===== CALCOLO BOUNDING BOX =====
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    for (let i = 0; i <= steps; i++) {
        const a = -angle / 2 + (i / steps) * angle;
        
        let x = R * Math.cos(a);
        let y = -R * Math.sin(a);
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
        
        x = r * Math.cos(a);
        y = -r * Math.sin(a);
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
    }

    const width = maxX - minX;
    const height = maxY - minY;

    // ===== PATH =====
    let d = "";

    for (let i = 0; i <= steps; i++) {
        const a = -angle / 2 + (i / steps) * angle;
        const x = R * Math.cos(a) - minX;
        const y = -R * Math.sin(a) - minY;
        d += i === 0 ? `M ${x} ${y} ` : `L ${x} ${y} `;
    }

    for (let i = steps; i >= 0; i--) {
        const a = -angle / 2 + (i / steps) * angle;
        const x = r * Math.cos(a) - minX;
        const y = -r * Math.sin(a) - minY;
        d += `L ${x} ${y} `;
    }

    d += "Z";

    // ===== SVG =====
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg"
     width="${width}mm"
     height="${height}mm"
     viewBox="0 0 ${width} ${height}">
    <!-- Forma principale -->
    <path d="${d}"
          fill="none"
          stroke="black"
          stroke-width="0.4"/>
    
    <!-- Linea piega INTERNA (blu tratteggiata) -->
    <line x1="${(R * Math.cos(-angle/2 + overlapInner/R) - minX)}"
          y1="${(-R * Math.sin(-angle/2 + overlapInner/R) - minY)}"
          x2="${(r * Math.cos(-angle/2 + overlapInner/R) - minX)}"
          y2="${(-r * Math.sin(-angle/2 + overlapInner/R) - minY)}"
          stroke="blue"
          stroke-width="0.3"
          stroke-dasharray="2,2"/>
    
    <!-- Linea piega ESTERNA (rosso tratteggiata) -->
    <line x1="${(R * Math.cos(angle/2 - overlapOuter/R) - minX)}"
          y1="${(-R * Math.sin(angle/2 - overlapOuter/R) - minY)}"
          x2="${(r * Math.cos(angle/2 - overlapOuter/R) - minX)}"
          y2="${(-r * Math.sin(angle/2 - overlapOuter/R) - minY)}"
          stroke="red"
          stroke-width="0.3"
          stroke-dasharray="2,2"/>
</svg>`;

    // ===== DOWNLOAD =====
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "paravento-cono.svg";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function exportConePDF(dp, baseDiameter, windscreenHeight) {
    // ===== GEOMETRIA =====
    const topRadius = dp / 2;
    const baseRadius = baseDiameter / 2;
    const overlapInner = 5;
    const overlapOuter = 5;

    const slantHeight = Math.sqrt(
        windscreenHeight ** 2 + (baseRadius - topRadius) ** 2
    );

    const R = (slantHeight * baseRadius) / (baseRadius - topRadius);
    const r = R - slantHeight;

    const sectorAngle = (2 * Math.PI * baseRadius) / R;
    const angle = sectorAngle + (overlapInner / R) + (overlapOuter / R);

    // ===== DIMENSIONI A4 in mm e conversione in punti (1mm = 2.834645669 punti) =====
    const A4_WIDTH_MM = 210;
    const A4_HEIGHT_MM = 297;
    const MM_TO_PT = 2.834645669;
    
    const pageWidth = A4_WIDTH_MM * MM_TO_PT;
    const pageHeight = A4_HEIGHT_MM * MM_TO_PT;
    
    const margin = 10 * MM_TO_PT; // 10mm di margine

    const steps = 300;
    
    // ===== CALCOLO BOUNDING BOX in mm =====
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    for (let i = 0; i <= steps; i++) {
        const a = -angle / 2 + (i / steps) * angle;
        
        let x = R * Math.cos(a);
        let y = -R * Math.sin(a);
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
        
        x = r * Math.cos(a);
        y = -r * Math.sin(a);
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
    }

    const widthMM = maxX - minX;
    const heightMM = maxY - minY;

    // ===== CALCOLO SCALA PER FIT IN A4 =====
    const availableWidth = A4_WIDTH_MM - 2 * 10; // margini
    const availableHeight = A4_HEIGHT_MM - 2 * 10;
    
    let scale = 1;
    let numPages = 1;
    let pagesX = 1;
    let pagesY = 1;
    
    // Se la forma è troppo grande, calcola quante pagine servono
    if (widthMM > availableWidth || heightMM > availableHeight) {
        pagesX = Math.ceil(widthMM / availableWidth);
        pagesY = Math.ceil(heightMM / availableHeight);
        numPages = pagesX * pagesY;
        scale = 1; // Mantieni scala 1:1
    }

    // ===== GENERA PDF =====
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({
        orientation: widthMM > heightMM ? 'landscape' : 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    // Per ogni pagina necessaria
    for (let py = 0; py < pagesY; py++) {
        for (let px = 0; px < pagesX; px++) {
            if (px > 0 || py > 0) {
                pdf.addPage();
            }

            // Calcola offset per questa pagina
            const offsetX = px * availableWidth;
            const offsetY = py * availableHeight;

            // ===== DISEGNA FORMA =====
            pdf.setDrawColor(217, 70, 166);
            pdf.setLineWidth(0.4);

            // Arco esterno
            let started = false;
            for (let i = 0; i <= steps; i++) {
                const a = -angle / 2 + (i / steps) * angle;
                const x = (R * Math.cos(a) - minX) * scale - offsetX + 10;
                const y = (-R * Math.sin(a) - minY) * scale - offsetY + 10;
                
                // Disegna solo se il punto è visibile in questa pagina
                if (x >= 0 && x <= A4_WIDTH_MM && y >= 0 && y <= A4_HEIGHT_MM) {
                    if (!started) {
                        started = true;
                    } else {
                        pdf.line(prevX, prevY, x, y);
                    }
                    var prevX = x;
                    var prevY = y;
                }
            }

            // Arco interno
            for (let i = steps; i >= 0; i--) {
                const a = -angle / 2 + (i / steps) * angle;
                const x = (r * Math.cos(a) - minX) * scale - offsetX + 10;
                const y = (-r * Math.sin(a) - minY) * scale - offsetY + 10;
                
                if (x >= 0 && x <= A4_WIDTH_MM && y >= 0 && y <= A4_HEIGHT_MM) {
                    if (prevX !== undefined) {
                        pdf.line(prevX, prevY, x, y);
                    }
                    prevX = x;
                    prevY = y;
                }
            }

            // Lati
            [-angle / 2, angle / 2].forEach(a => {
                const x1 = (R * Math.cos(a) - minX) * scale - offsetX + 10;
                const y1 = (-R * Math.sin(a) - minY) * scale - offsetY + 10;
                const x2 = (r * Math.cos(a) - minX) * scale - offsetX + 10;
                const y2 = (-r * Math.sin(a) - minY) * scale - offsetY + 10;
                
                if (x1 >= 0 && x1 <= A4_WIDTH_MM && y1 >= 0 && y1 <= A4_HEIGHT_MM) {
                    pdf.line(x1, y1, x2, y2);
                }
            });

            // ===== LINEE DI PIEGA =====
            // Piega INTERNA (blu tratteggiata)
            pdf.setDrawColor(59, 130, 246);
            pdf.setLineDash([2, 2]);
            const angleInner = -angle / 2 + overlapInner / R;
            const xi1 = (R * Math.cos(angleInner) - minX) * scale - offsetX + 10;
            const yi1 = (-R * Math.sin(angleInner) - minY) * scale - offsetY + 10;
            const xi2 = (r * Math.cos(angleInner) - minX) * scale - offsetX + 10;
            const yi2 = (-r * Math.sin(angleInner) - minY) * scale - offsetY + 10;
            if (xi1 >= 0 && xi1 <= A4_WIDTH_MM && yi1 >= 0 && yi1 <= A4_HEIGHT_MM) {
                pdf.line(xi1, yi1, xi2, yi2);
            }

            // Piega ESTERNA (rosso tratteggiata)
            pdf.setDrawColor(239, 68, 68);
            const angleOuter = angle / 2 - overlapOuter / R;
            const xo1 = (R * Math.cos(angleOuter) - minX) * scale - offsetX + 10;
            const yo1 = (-R * Math.sin(angleOuter) - minY) * scale - offsetY + 10;
            const xo2 = (r * Math.cos(angleOuter) - minX) * scale - offsetX + 10;
            const yo2 = (-r * Math.sin(angleOuter) - minY) * scale - offsetY + 10;
            if (xo1 >= 0 && xo1 <= A4_WIDTH_MM && yo1 >= 0 && yo1 <= A4_HEIGHT_MM) {
                pdf.line(xo1, yo1, xo2, yo2);
            }
            pdf.setLineDash([]);

            // ===== INFORMAZIONI =====
            pdf.setFontSize(8);
            pdf.setTextColor(100);
            pdf.text(`Pagina ${py * pagesX + px + 1} di ${numPages}`, 10, A4_HEIGHT_MM - 5);
            
            if (px === 0 && py === 0) {
                pdf.setFontSize(10);
                pdf.setTextColor(0);
                pdf.text(`Paravento Cono - Scala 1:${scale}`, 10, 5);
                pdf.setFontSize(8);
                pdf.text(`Ø superiore: ${dp.toFixed(1)} mm`, 10, 10);
                pdf.text(`Ø base: ${baseDiameter.toFixed(1)} mm`, 10, 15);
                pdf.text(`Altezza: ${windscreenHeight.toFixed(1)} mm`, 10, 20);
                pdf.text(`Angolo: ${(angle * 180 / Math.PI).toFixed(1)}°`, 10, 25);
                
                // Legenda chiusura a scorrimento
                pdf.setFontSize(9);
                pdf.setTextColor(0);
                pdf.text('CHIUSURA A SCORRIMENTO:', 10, 35);
                
                pdf.setFontSize(8);
                pdf.setDrawColor(59, 130, 246);
                pdf.setLineDash([2, 2]);
                pdf.line(10, 39, 20, 39);
                pdf.setLineDash([]);
                pdf.setTextColor(59, 130, 246);
                pdf.text('Piega INTERNA (5mm verso interno)', 22, 40);
                
                pdf.setDrawColor(239, 68, 68);
                pdf.setLineDash([2, 2]);
                pdf.line(10, 44, 20, 44);
                pdf.setLineDash([]);
                pdf.setTextColor(239, 68, 68);
                pdf.text('Piega ESTERNA (5mm verso esterno)', 22, 45);
            }

            // Linee di taglio per assemblaggio multi-pagina
            if (numPages > 1) {
                pdf.setDrawColor(200, 200, 200);
                pdf.setLineWidth(0.1);
                // Bordi pagina
                pdf.rect(10, 10, availableWidth, availableHeight);
            }
        }
    }

    // ===== SALVA PDF =====
    pdf.save("paravento-cono.pdf");
}