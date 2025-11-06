class SplineGenerator {
    constructor() {
        console.log('SplineGenerator constructor called');
        
        // Initialize in correct order
        this.initializeSettings();
        this.initializeElements();
        this.initializeCanvases();
        this.initializeEventListeners();
        
        this.currentTool = 'spline';
        this.isDrawing = false;
        this.isMouseDown = false;
        this.splinePoints = [];
        this.shapes = [];
        this.lastSampleTime = 0;
        
        // Draw grid after everything is initialized
        setTimeout(() => {
            this.drawGrid();
            console.log('Grid drawn');
        }, 100);
    }

    initializeElements() {
        console.log('Initializing elements...');
        
        // Canvas elements
        this.gridCanvas = document.getElementById('gridCanvas');
        this.shapeCanvas = document.getElementById('shapeCanvas');
        this.splineCanvas = document.getElementById('splineCanvas');
        
        if (!this.gridCanvas || !this.shapeCanvas || !this.splineCanvas) {
            console.error('Canvas elements not found!');
            return;
        }
        
        // UI elements
        this.settingsModal = document.getElementById('settingsModal');
        this.coordinatesDisplay = document.getElementById('coordinates');
        
        // Buttons
        this.settingsBtn = document.getElementById('settingsBtn');
        this.clearBtn = document.getElementById('clearBtn');
        this.toolButtons = document.querySelectorAll('.tool-btn');
        this.saveSettingsBtn = document.getElementById('saveSettings');
        this.resetSettingsBtn = document.getElementById('resetSettings');
        this.closeBtn = document.querySelector('.close');
        
        console.log('Elements initialized successfully');
    }

    initializeSettings() {
        this.settings = {
            minX: -100,
            maxX: 100,
            minY: -100,
            maxY: 100,
            gridSize: 10,
            snapSize: 1,
            enableSnap: true,
            pixelsPerMm: 1,
            samplingDistance: 2,
            splineSmoothing: 0.5,
            splineColor: '#ff0000',
            shapeColor: '#0066cc'
        };
        this.loadSettingsFromStorage();
        this.updateSettingsUI();
    }

    initializeCanvases() {
        console.log('Initializing canvases...');
        
        if (!this.gridCanvas || !this.shapeCanvas || !this.splineCanvas) {
            console.error('Cannot initialize canvases - elements not found');
            return;
        }
        
        // Set canvas styles
        [this.gridCanvas, this.shapeCanvas, this.splineCanvas].forEach(canvas => {
            canvas.style.display = 'block';
            canvas.style.position = 'absolute';
            canvas.style.top = '0';
            canvas.style.left = '0';
        });
        
        this.gridCtx = this.gridCanvas.getContext('2d');
        this.shapeCtx = this.shapeCanvas.getContext('2d');
        this.splineCtx = this.splineCanvas.getContext('2d');
        
        // Set canvas size
        this.canvasWidth = 1200;
        this.canvasHeight = 800;
        
        [this.gridCanvas, this.shapeCanvas, this.splineCanvas].forEach(canvas => {
            canvas.width = this.canvasWidth;
            canvas.height = this.canvasHeight;
        });
        
        this.centerX = this.canvasWidth / 2;
        this.centerY = this.canvasHeight / 2;
        
        console.log('Canvases initialized successfully');
    }

    initializeEventListeners() {
        console.log('Initializing event listeners...');
        
        // Check if elements exist before adding listeners
        if (this.settingsBtn) {
            this.settingsBtn.addEventListener('click', () => this.openSettings());
        }
        
        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', () => this.closeSettings());
        }
        
        if (this.saveSettingsBtn) {
            this.saveSettingsBtn.addEventListener('click', () => this.saveSettings());
        }
        
        if (this.resetSettingsBtn) {
            this.resetSettingsBtn.addEventListener('click', () => this.resetSettings());
        }
        
        // Tool selection
        if (this.toolButtons) {
            this.toolButtons.forEach(btn => {
                btn.addEventListener('click', (e) => this.selectTool(e.target.dataset.tool));
            });
        }
        
        // Clear button
        if (this.clearBtn) {
            this.clearBtn.addEventListener('click', () => this.clearAll());
        }
        
        // Canvas events
        if (this.splineCanvas) {
            this.splineCanvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
            this.splineCanvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
            this.splineCanvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
            this.splineCanvas.addEventListener('mouseleave', (e) => this.handleMouseUp(e));
        }
        
        // Settings inputs
        const smoothingSlider = document.getElementById('splineSmoothing');
        if (smoothingSlider) {
            smoothingSlider.addEventListener('input', (e) => {
                const smoothingValue = document.getElementById('smoothingValue');
                if (smoothingValue) {
                    smoothingValue.textContent = e.target.value;
                }
            });
        }
        
        // Modal background click
        if (this.settingsModal) {
            this.settingsModal.addEventListener('click', (e) => {
                if (e.target === this.settingsModal) {
                    this.closeSettings();
                }
            });
        }
        
        console.log('Event listeners initialized');
    }

    // Grid drawing
    drawGrid() {
        console.log('Drawing grid...');
        
        if (!this.gridCtx) {
            console.error('Grid context not available');
            return;
        }
        
        // Clear canvas with white background
        this.gridCtx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        this.gridCtx.fillStyle = '#ffffff';
        this.gridCtx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
        
        // Calculate scale: how many pixels per mm
        const totalRangeX = this.settings.maxX - this.settings.minX;
        const totalRangeY = this.settings.maxY - this.settings.minY;
        const scaleX = this.canvasWidth / totalRangeX;
        const scaleY = this.canvasHeight / totalRangeY;
        
        console.log(`Scale: ${scaleX}px/mm (X), ${scaleY}px/mm (Y)`);
        
        // Calculate position of X=0 and Y=0 axes
        const zeroX = (0 - this.settings.minX) * scaleX;
        const zeroY = this.canvasHeight - (0 - this.settings.minY) * scaleY;
        
        // Secondary grid lines (fine grid)
        this.gridCtx.strokeStyle = '#e8e8e8';
        this.gridCtx.lineWidth = 0.5;
        this.gridCtx.beginPath();
        
        // Vertical lines
        for (let x = this.settings.minX; x <= this.settings.maxX; x += this.settings.gridSize) {
            const canvasX = (x - this.settings.minX) * scaleX;
            this.gridCtx.moveTo(canvasX, 0);
            this.gridCtx.lineTo(canvasX, this.canvasHeight);
        }
        
        // Horizontal lines  
        for (let y = this.settings.minY; y <= this.settings.maxY; y += this.settings.gridSize) {
            const canvasY = this.canvasHeight - (y - this.settings.minY) * scaleY;
            this.gridCtx.moveTo(0, canvasY);
            this.gridCtx.lineTo(this.canvasWidth, canvasY);
        }
        
        this.gridCtx.stroke();
        
        // Major grid lines (every 5 grid units)
        const majorStep = this.settings.gridSize * 5;
        this.gridCtx.strokeStyle = '#d0d0d0';
        this.gridCtx.lineWidth = 1;
        this.gridCtx.beginPath();
        
        // Major vertical lines
        for (let x = this.settings.minX; x <= this.settings.maxX; x += majorStep) {
            if (x % majorStep === 0) {
                const canvasX = (x - this.settings.minX) * scaleX;
                this.gridCtx.moveTo(canvasX, 0);
                this.gridCtx.lineTo(canvasX, this.canvasHeight);
            }
        }
        
        // Major horizontal lines
        for (let y = this.settings.minY; y <= this.settings.maxY; y += majorStep) {
            if (y % majorStep === 0) {
                const canvasY = this.canvasHeight - (y - this.settings.minY) * scaleY;
                this.gridCtx.moveTo(0, canvasY);
                this.gridCtx.lineTo(this.canvasWidth, canvasY);
            }
        }
        
        this.gridCtx.stroke();
        
        // Main axes (X=0, Y=0) - only if they're within the visible range
        this.gridCtx.strokeStyle = '#333333';
        this.gridCtx.lineWidth = 2;
        this.gridCtx.beginPath();
        
        // Y axis (X=0) - draw only if X=0 is within range
        if (0 >= this.settings.minX && 0 <= this.settings.maxX) {
            this.gridCtx.moveTo(zeroX, 0);
            this.gridCtx.lineTo(zeroX, this.canvasHeight);
        }
        
        // X axis (Y=0) - draw only if Y=0 is within range
        if (0 >= this.settings.minY && 0 <= this.settings.maxY) {
            this.gridCtx.moveTo(0, zeroY);
            this.gridCtx.lineTo(this.canvasWidth, zeroY);
        }
        
        this.gridCtx.stroke();
        
        // Draw labels for both minor and major grid lines
        this.drawGridLabels(scaleX, scaleY, zeroX, zeroY);
        
        console.log('Grid drawing completed');
    }
    
    drawGridLabels(scaleX, scaleY, zeroX, zeroY) {
        // Set up text style
        this.gridCtx.fillStyle = '#666666';
        this.gridCtx.font = '11px Arial';
        
        // X axis labels (horizontal)
        this.gridCtx.textAlign = 'center';
        this.gridCtx.textBaseline = 'top';
        
        for (let x = this.settings.minX; x <= this.settings.maxX; x += this.settings.gridSize) {
            if (x !== 0) { // Skip zero, we'll handle it separately
                const canvasX = (x - this.settings.minX) * scaleX;
                let labelY;
                
                if (0 >= this.settings.minY && 0 <= this.settings.maxY) {
                    // Zero line is visible, place labels on it
                    labelY = zeroY + 4;
                } else {
                    // Zero line not visible, place at bottom
                    labelY = this.canvasHeight - 15;
                }
                
                // Major labels (darker, with "mm")
                if (x % (this.settings.gridSize * 5) === 0) {
                    this.gridCtx.fillStyle = '#333333';
                    this.gridCtx.font = 'bold 12px Arial';
                    this.gridCtx.fillText(x + 'mm', canvasX, labelY);
                } else {
                    // Minor labels (lighter)
                    this.gridCtx.fillStyle = '#999999';
                    this.gridCtx.font = '10px Arial';
                    this.gridCtx.fillText(x.toString(), canvasX, labelY);
                }
            }
        }
        
        // Y axis labels (vertical)
        this.gridCtx.textAlign = 'right';
        this.gridCtx.textBaseline = 'middle';
        
        for (let y = this.settings.minY; y <= this.settings.maxY; y += this.settings.gridSize) {
            if (y !== 0) { // Skip zero, we'll handle it separately
                const canvasY = this.canvasHeight - (y - this.settings.minY) * scaleY;
                let labelX;
                
                if (0 >= this.settings.minX && 0 <= this.settings.maxX) {
                    // Zero line is visible, place labels on it
                    labelX = zeroX - 4;
                } else {
                    // Zero line not visible, place at left
                    labelX = this.canvasWidth - 4;
                }
                
                // Major labels (darker, with "mm")
                if (y % (this.settings.gridSize * 5) === 0) {
                    this.gridCtx.fillStyle = '#333333';
                    this.gridCtx.font = 'bold 12px Arial';
                    this.gridCtx.fillText(y + 'mm', labelX, canvasY);
                } else {
                    // Minor labels (lighter)
                    this.gridCtx.fillStyle = '#999999';
                    this.gridCtx.font = '10px Arial';
                    this.gridCtx.fillText(y.toString(), labelX, canvasY);
                }
            }
        }
        
        // Origin label (0,0) - only if origin is visible
        if (0 >= this.settings.minX && 0 <= this.settings.maxX && 0 >= this.settings.minY && 0 <= this.settings.maxY) {
            this.gridCtx.fillStyle = '#000000';
            this.gridCtx.font = 'bold 14px Arial';
            this.gridCtx.textAlign = 'right';
            this.gridCtx.textBaseline = 'bottom';
            this.gridCtx.fillText('0', zeroX - 6, zeroY - 6);
            
            // Draw small markers at origin
            this.gridCtx.strokeStyle = '#000000';
            this.gridCtx.lineWidth = 2;
            this.gridCtx.beginPath();
            // X axis marker
            this.gridCtx.moveTo(zeroX - 5, zeroY);
            this.gridCtx.lineTo(zeroX + 5, zeroY);
            // Y axis marker
            this.gridCtx.moveTo(zeroX, zeroY - 5);
            this.gridCtx.lineTo(zeroX, zeroY + 5);
            this.gridCtx.stroke();
        }
    }

    // Coordinate conversion
    screenToWorld(screenX, screenY) {
        const rect = this.splineCanvas.getBoundingClientRect();
        const canvasX = screenX - rect.left;
        const canvasY = screenY - rect.top;
        
        const totalRangeX = this.settings.maxX - this.settings.minX;
        const totalRangeY = this.settings.maxY - this.settings.minY;
        const scaleX = this.canvasWidth / totalRangeX;
        const scaleY = this.canvasHeight / totalRangeY;
        
        const worldX = this.settings.minX + (canvasX / scaleX);
        const worldY = this.settings.maxY - (canvasY / scaleY);
        
        return { x: worldX, y: worldY };
    }

    worldToScreen(worldX, worldY) {
        const totalRangeX = this.settings.maxX - this.settings.minX;
        const totalRangeY = this.settings.maxY - this.settings.minY;
        const scaleX = this.canvasWidth / totalRangeX;
        const scaleY = this.canvasHeight / totalRangeY;
        
        const canvasX = (worldX - this.settings.minX) * scaleX;
        const canvasY = (this.settings.maxY - worldY) * scaleY;
        
        return { x: canvasX, y: canvasY };
    }

    // Snap coordinates to grid
    snapToGrid(worldPos) {
        if (!this.settings.enableSnap) {
            return worldPos;
        }
        
        const snapSize = this.settings.snapSize;
        const snappedX = Math.round(worldPos.x / snapSize) * snapSize;
        const snappedY = Math.round(worldPos.y / snapSize) * snapSize;
        
        return { 
            x: parseFloat(snappedX.toFixed(2)), 
            y: parseFloat(snappedY.toFixed(2)) 
        };
    }

    // Get mouse position with snap applied
    getMousePosition(e) {
        const rawPos = this.screenToWorld(e.clientX, e.clientY);
        return this.snapToGrid(rawPos);
    }

    // Mouse event handlers
    handleMouseDown(e) {
        this.isMouseDown = true;
        const worldPos = this.getMousePosition(e);
        
        if (this.currentTool === 'spline') {
            this.startSpline(worldPos);
        } else {
            this.startShape(worldPos);
        }
    }

    handleMouseMove(e) {
        const rawWorldPos = this.screenToWorld(e.clientX, e.clientY);
        const snappedWorldPos = this.getMousePosition(e);
        
        // Update coordinates display (show both raw and snapped if different)
        if (this.settings.enableSnap && 
            (Math.abs(rawWorldPos.x - snappedWorldPos.x) > 0.01 || 
             Math.abs(rawWorldPos.y - snappedWorldPos.y) > 0.01)) {
            this.updateCoordinates(rawWorldPos, snappedWorldPos);
        } else {
            this.updateCoordinates(snappedWorldPos);
        }
        
        if (this.isMouseDown) {
            if (this.currentTool === 'spline' && this.isDrawing) {
                this.continueSampling(snappedWorldPos);
            } else if (this.currentTool !== 'spline') {
                this.updateShapePreview(snappedWorldPos);
            }
        }
        
        // Draw snap indicator
        this.drawSnapIndicator(snappedWorldPos);
    }

    handleMouseUp(e) {
        if (this.isMouseDown) {
            const worldPos = this.getMousePosition(e);
            
            if (this.currentTool === 'spline') {
                this.endSpline();
            } else {
                this.finishShape(worldPos);
            }
        }
        
        this.isMouseDown = false;
        this.isDrawing = false;
        this.clearSnapIndicator();
    }

    // Spline functionality
    startSpline(worldPos) {
        if (!this.isDrawing) {
            this.splinePoints = [worldPos];
            this.isDrawing = true;
            this.lastSampleTime = Date.now();
        } else {
            // Single click adds point
            this.splinePoints.push(worldPos);
            this.drawSpline();
        }
    }

    continueSampling(worldPos) {
        const now = Date.now();
        const lastPoint = this.splinePoints[this.splinePoints.length - 1];
        const distance = Math.sqrt(
            Math.pow(worldPos.x - lastPoint.x, 2) + 
            Math.pow(worldPos.y - lastPoint.y, 2)
        );
        
        // Distance is already in mm since worldPos is in mm
        if (distance >= this.settings.samplingDistance) {
            this.splinePoints.push(worldPos);
            this.drawSpline();
        }
    }

    endSpline() {
        this.isDrawing = false;
    }

    drawSpline() {
        if (this.splinePoints.length < 2) return;
        
        this.splineCtx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        this.splineCtx.strokeStyle = this.settings.splineColor;
        this.splineCtx.lineWidth = 2;
        this.splineCtx.lineCap = 'round';
        this.splineCtx.lineJoin = 'round';
        
        this.splineCtx.beginPath();
        
        if (this.splinePoints.length === 2) {
            // Simple line for two points
            const start = this.worldToScreen(this.splinePoints[0].x, this.splinePoints[0].y);
            const end = this.worldToScreen(this.splinePoints[1].x, this.splinePoints[1].y);
            this.splineCtx.moveTo(start.x, start.y);
            this.splineCtx.lineTo(end.x, end.y);
        } else {
            // Smooth spline for multiple points
            this.drawSmoothSpline();
        }
        
        this.splineCtx.stroke();
        
        // Draw points
        this.splineCtx.fillStyle = this.settings.splineColor;
        this.splinePoints.forEach(point => {
            const screenPos = this.worldToScreen(point.x, point.y);
            this.splineCtx.beginPath();
            this.splineCtx.arc(screenPos.x, screenPos.y, 3, 0, 2 * Math.PI);
            this.splineCtx.fill();
        });
    }

    drawSmoothSpline() {
        const points = this.splinePoints.map(p => this.worldToScreen(p.x, p.y));
        
        this.splineCtx.moveTo(points[0].x, points[0].y);
        
        for (let i = 1; i < points.length - 1; i++) {
            const cp1x = points[i].x + (points[i + 1].x - points[i - 1].x) * this.settings.splineSmoothing * 0.2;
            const cp1y = points[i].y + (points[i + 1].y - points[i - 1].y) * this.settings.splineSmoothing * 0.2;
            const cp2x = points[i + 1].x - (points[i + 2] ? points[i + 2].x - points[i].x : 0) * this.settings.splineSmoothing * 0.2;
            const cp2y = points[i + 1].y - (points[i + 2] ? points[i + 2].y - points[i].y : 0) * this.settings.splineSmoothing * 0.2;
            
            this.splineCtx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, points[i + 1].x, points[i + 1].y);
        }
        
        if (points.length > 2) {
            this.splineCtx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
        }
    }

    // Shape functionality
    startShape(worldPos) {
        this.tempShape = {
            type: this.currentTool,
            start: worldPos,
            end: worldPos
        };
    }

    updateShapePreview(worldPos) {
        if (!this.tempShape) return;
        
        this.tempShape.end = worldPos;
        this.redrawShapes();
        this.drawShapePreview();
    }

    finishShape(worldPos) {
        if (!this.tempShape) return;
        
        this.tempShape.end = worldPos;
        this.shapes.push({ ...this.tempShape });
        this.tempShape = null;
        this.redrawShapes();
    }

    drawShapePreview() {
        if (!this.tempShape) return;
        
        this.shapeCtx.strokeStyle = this.settings.shapeColor;
        this.shapeCtx.fillStyle = this.settings.shapeColor + '20';
        this.shapeCtx.lineWidth = 2;
        this.shapeCtx.setLineDash([5, 5]);
        
        this.drawSingleShape(this.tempShape);
        this.shapeCtx.setLineDash([]);
    }

    redrawShapes() {
        this.shapeCtx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        this.shapeCtx.strokeStyle = this.settings.shapeColor;
        this.shapeCtx.fillStyle = this.settings.shapeColor + '20';
        this.shapeCtx.lineWidth = 2;
        
        this.shapes.forEach(shape => this.drawSingleShape(shape));
    }

    drawSingleShape(shape) {
        const start = this.worldToScreen(shape.start.x, shape.start.y);
        const end = this.worldToScreen(shape.end.x, shape.end.y);
        
        this.shapeCtx.beginPath();
        
        switch (shape.type) {
            case 'rectangle':
                const width = end.x - start.x;
                const height = end.y - start.y;
                this.shapeCtx.rect(start.x, start.y, width, height);
                this.shapeCtx.fill();
                this.shapeCtx.stroke();
                break;
                
            case 'circle':
                const radius = Math.sqrt(
                    Math.pow(end.x - start.x, 2) + 
                    Math.pow(end.y - start.y, 2)
                );
                this.shapeCtx.arc(start.x, start.y, radius, 0, 2 * Math.PI);
                this.shapeCtx.fill();
                this.shapeCtx.stroke();
                break;
        }
    }

    // Tool selection
    selectTool(tool) {
        this.currentTool = tool;
        this.toolButtons.forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-tool="${tool}"]`).classList.add('active');
        
        // Update cursor
        const cursor = tool === 'spline' ? 'crosshair' : 'crosshair';
        this.splineCanvas.style.cursor = cursor;
    }

    // Snap indicator
    drawSnapIndicator(worldPos) {
        if (!this.settings.enableSnap) return;
        
        // Clear previous indicator
        this.clearSnapIndicator();
        
        // Draw snap indicator on spline canvas (temporary overlay)
        const screenPos = this.worldToScreen(worldPos.x, worldPos.y);
        
        this.splineCtx.save();
        this.splineCtx.strokeStyle = '#ff6600';
        this.splineCtx.fillStyle = '#ff6600';
        this.splineCtx.lineWidth = 1;
        this.splineCtx.setLineDash([2, 2]);
        
        // Draw crosshair
        this.splineCtx.beginPath();
        this.splineCtx.moveTo(screenPos.x - 8, screenPos.y);
        this.splineCtx.lineTo(screenPos.x + 8, screenPos.y);
        this.splineCtx.moveTo(screenPos.x, screenPos.y - 8);
        this.splineCtx.lineTo(screenPos.x, screenPos.y + 8);
        this.splineCtx.stroke();
        
        // Draw small circle
        this.splineCtx.setLineDash([]);
        this.splineCtx.beginPath();
        this.splineCtx.arc(screenPos.x, screenPos.y, 3, 0, 2 * Math.PI);
        this.splineCtx.fill();
        
        this.splineCtx.restore();
        
        // Store indicator position to clear it later
        this.lastSnapIndicator = { x: screenPos.x, y: screenPos.y };
    }

    // Utility functions
    updateCoordinates(worldPos, snappedPos = null) {
        if (snappedPos && this.settings.enableSnap) {
            this.coordinatesDisplay.textContent = 
                `X: ${worldPos.x.toFixed(1)} mm → ${snappedPos.x.toFixed(1)} mm, Y: ${worldPos.y.toFixed(1)} mm → ${snappedPos.y.toFixed(1)} mm`;
        } else {
            this.coordinatesDisplay.textContent = 
                `X: ${worldPos.x.toFixed(1)} mm, Y: ${worldPos.y.toFixed(1)} mm`;
        }
    }

    clearAll() {
        this.splineCtx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        this.shapeCtx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        this.splinePoints = [];
        this.shapes = [];
        this.isDrawing = false;
    }

    // Settings functionality
    openSettings() {
        this.settingsModal.style.display = 'block';
    }

    closeSettings() {
        this.settingsModal.style.display = 'none';
    }

    saveSettings() {
        this.settings.minX = parseInt(document.getElementById('minX').value);
        this.settings.maxX = parseInt(document.getElementById('maxX').value);
        this.settings.minY = parseInt(document.getElementById('minY').value);
        this.settings.maxY = parseInt(document.getElementById('maxY').value);
        this.settings.gridSize = parseInt(document.getElementById('gridSize').value);
        this.settings.snapSize = parseFloat(document.getElementById('snapSize').value);
        this.settings.enableSnap = document.getElementById('enableSnap').checked;
        this.settings.pixelsPerMm = parseFloat(document.getElementById('pixelsPerMm').value);
        this.settings.samplingDistance = parseFloat(document.getElementById('samplingDistance').value);
        this.settings.splineSmoothing = parseFloat(document.getElementById('splineSmoothing').value);
        this.settings.splineColor = document.getElementById('splineColor').value;
        this.settings.shapeColor = document.getElementById('shapeColor').value;
        
        this.saveSettingsToStorage();
        this.drawGrid();
        this.redrawShapes();
        this.drawSpline();
        this.closeSettings();
    }

    resetSettings() {
        this.settings = {
            minX: -100,
            maxX: 100,
            minY: -100,
            maxY: 100,
            gridSize: 10,
            snapSize: 1,
            enableSnap: true,
            pixelsPerMm: 1,
            samplingDistance: 2,
            splineSmoothing: 0.5,
            splineColor: '#ff0000',
            shapeColor: '#0066cc'
        };
        this.updateSettingsUI();
        this.saveSettingsToStorage();
        this.drawGrid();
        this.redrawShapes();
        this.drawSpline();
    }

    updateSettingsUI() {
        console.log('Updating settings UI...');
        
        const elements = {
            'minX': this.settings.minX,
            'maxX': this.settings.maxX,
            'minY': this.settings.minY,
            'maxY': this.settings.maxY,
            'gridSize': this.settings.gridSize,
            'snapSize': this.settings.snapSize,
            'pixelsPerMm': this.settings.pixelsPerMm,
            'samplingDistance': this.settings.samplingDistance,
            'splineSmoothing': this.settings.splineSmoothing,
            'splineColor': this.settings.splineColor,
            'shapeColor': this.settings.shapeColor
        };
        
        for (const [id, value] of Object.entries(elements)) {
            const element = document.getElementById(id);
            if (element) {
                element.value = value;
            }
        }
        
        // Handle checkbox separately
        const enableSnapElement = document.getElementById('enableSnap');
        if (enableSnapElement) {
            enableSnapElement.checked = this.settings.enableSnap;
        }
        
        const smoothingValue = document.getElementById('smoothingValue');
        if (smoothingValue) {
            smoothingValue.textContent = this.settings.splineSmoothing;
        }
        
        console.log('Settings UI updated');
    }

    saveSettingsToStorage() {
        try {
            localStorage.setItem('splineGenerator_settings', JSON.stringify(this.settings));
            console.log('Settings saved to storage');
        } catch (e) {
            console.error('Error saving settings:', e);
        }
    }

    loadSettingsFromStorage() {
        try {
            const saved = localStorage.getItem('splineGenerator_settings');
            if (saved) {
                this.settings = { ...this.settings, ...JSON.parse(saved) };
                console.log('Settings loaded from storage');
            }
        } catch (e) {
            console.error('Error loading settings:', e);
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing SplineGenerator...');
    
    try {
        const app = new SplineGenerator();
        console.log('SplineGenerator initialized successfully');
        
        // Make app globally accessible for debugging
        window.splineApp = app;
    } catch (error) {
        console.error('Error initializing SplineGenerator:', error);
    }
});

// Fallback initialization if DOMContentLoaded already fired
if (document.readyState === 'loading') {
    // Still loading, wait for DOMContentLoaded
} else {
    // Already loaded, initialize immediately
    console.log('DOM already loaded, initializing SplineGenerator...');
    try {
        const app = new SplineGenerator();
        console.log('SplineGenerator initialized successfully');
        window.splineApp = app;
    } catch (error) {
        console.error('Error initializing SplineGenerator:', error);
    }
}