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
        this.selectedPoints = new Set(); // Track selected points
        this.lastSelectedIndex = -1; // For shift selection
        this.lastSnapIndicator = null; // For snap indicator cleanup
        
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
        this.saveBtn = document.getElementById('saveBtn');
        this.loadBtn = document.getElementById('loadBtn');
        this.fileInput = document.getElementById('fileInput');
        this.clearSplineBtn = document.getElementById('clearSplineBtn');
        this.clearShapesBtn = document.getElementById('clearShapesBtn');
        this.toolButtons = document.querySelectorAll('.tool-btn');
        this.saveSettingsBtn = document.getElementById('saveSettings');
        this.resetSettingsBtn = document.getElementById('resetSettings');
        this.closeBtn = document.querySelector('.close');
        
        // Side panel elements
        this.tabButtons = document.querySelectorAll('.tab-btn');
        this.splineTableBody = document.getElementById('splineTableBody');
        this.shapesTableBody = document.getElementById('shapesTableBody');
        this.selectAllPointsBtn = document.getElementById('selectAllPoints');
        this.bulkVelocityInput = document.getElementById('bulkVelocity');
        this.applyBulkVelocityBtn = document.getElementById('applyBulkVelocity');
        this.pointCountDisplay = document.getElementById('pointCount');
        this.selectedCountDisplay = document.getElementById('selectedCount');
        this.shapesCountDisplay = document.getElementById('shapesCount');
        
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
        
        // File buttons
        if (this.saveBtn) {
            this.saveBtn.addEventListener('click', () => this.saveProject());
        }
        
        if (this.loadBtn) {
            this.loadBtn.addEventListener('click', () => this.fileInput.click());
        }
        
        if (this.fileInput) {
            this.fileInput.addEventListener('change', (e) => this.loadProject(e));
        }
        
        // Clear buttons
        if (this.clearSplineBtn) {
            this.clearSplineBtn.addEventListener('click', () => this.clearSpline());
        }
        
        if (this.clearShapesBtn) {
            this.clearShapesBtn.addEventListener('click', () => this.clearShapes());
        }
        
        // Canvas events
        if (this.splineCanvas) {
            this.splineCanvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
            this.splineCanvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
            this.splineCanvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
            this.splineCanvas.addEventListener('mouseleave', (e) => this.handleMouseUp(e));
        }
        
        // Tab events
        if (this.tabButtons) {
            this.tabButtons.forEach(btn => {
                btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
            });
        }
        
        // Side panel events
        if (this.selectAllPointsBtn) {
            this.selectAllPointsBtn.addEventListener('change', (e) => this.toggleSelectAllPoints(e.target.checked));
        }
        
        if (this.applyBulkVelocityBtn) {
            this.applyBulkVelocityBtn.addEventListener('click', () => this.applyBulkVelocity());
        }
        
        // Event listener per il checkbox "Seleziona tutto"
        const selectAllCheckbox = document.getElementById('selectAllPoints');
        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.selectAllPoints();
                } else {
                    this.clearSelection();
                }
            });
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
        
        // Use the smaller scale to ensure 1:1 aspect ratio (square pixels)
        const scale = Math.min(scaleX, scaleY);
        
        console.log(`Original scales: ${scaleX.toFixed(2)}px/mm (X), ${scaleY.toFixed(2)}px/mm (Y)`);
        console.log(`Uniform scale: ${scale.toFixed(2)}px/mm`);
        
        // Calculate position of X=0 and Y=0 axes with uniform scale
        const zeroX = (0 - this.settings.minX) * scale;
        const zeroY = this.canvasHeight - (0 - this.settings.minY) * scale;
        
        // Secondary grid lines (fine grid)
        this.gridCtx.strokeStyle = '#e8e8e8';
        this.gridCtx.lineWidth = 0.5;
        this.gridCtx.beginPath();
        
        // Vertical lines
        for (let x = this.settings.minX; x <= this.settings.maxX; x += this.settings.gridSize) {
            const canvasX = (x - this.settings.minX) * scale;
            this.gridCtx.moveTo(canvasX, 0);
            this.gridCtx.lineTo(canvasX, this.canvasHeight);
        }
        
        // Horizontal lines  
        for (let y = this.settings.minY; y <= this.settings.maxY; y += this.settings.gridSize) {
            const canvasY = this.canvasHeight - (y - this.settings.minY) * scale;
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
                const canvasX = (x - this.settings.minX) * scale;
                this.gridCtx.moveTo(canvasX, 0);
                this.gridCtx.lineTo(canvasX, this.canvasHeight);
            }
        }
        
        // Major horizontal lines
        for (let y = this.settings.minY; y <= this.settings.maxY; y += majorStep) {
            if (y % majorStep === 0) {
                const canvasY = this.canvasHeight - (y - this.settings.minY) * scale;
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
        this.drawGridLabels(scale, scale, zeroX, zeroY);
        
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
        
        // Use uniform scale to maintain 1:1 aspect ratio
        const scale = Math.min(scaleX, scaleY);
        
        const worldX = this.settings.minX + (canvasX / scale);
        const worldY = this.settings.maxY - (canvasY / scale);
        
        return { x: worldX, y: worldY };
    }

    worldToScreen(worldX, worldY) {
        const totalRangeX = this.settings.maxX - this.settings.minX;
        const totalRangeY = this.settings.maxY - this.settings.minY;
        const scaleX = this.canvasWidth / totalRangeX;
        const scaleY = this.canvasHeight / totalRangeY;
        
        // Use uniform scale to maintain 1:1 aspect ratio
        const scale = Math.min(scaleX, scaleY);
        
        const canvasX = (worldX - this.settings.minX) * scale;
        const canvasY = (this.settings.maxY - worldY) * scale;
        
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
        this.updateSplineTable();
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
            this.updateSplineTable();
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
        this.updateShapesTable();
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

    // Side Panel Management
    switchTab(tabId) {
        // Update tab buttons
        this.tabButtons.forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
        
        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        document.getElementById(tabId).classList.add('active');
    }

    updateSplineTable() {
        if (!this.splineTableBody) return;
        
        this.splineTableBody.innerHTML = '';
        
        this.splinePoints.forEach((point, index) => {
            if (!point.velocity) point.velocity = 30; // Default velocity in mm/s
            if (!point.id) point.id = index + 1;
            
            const row = document.createElement('tr');
            const isSelected = this.selectedPoints.has(index);
            if (isSelected) row.classList.add('selected');
            
            row.innerHTML = `
                <td><input type="checkbox" class="point-checkbox" data-index="${index}" ${isSelected ? 'checked' : ''}></td>
                <td>${point.id}</td>
                <td><input type="number" class="coord-input" data-index="${index}" data-coord="x" value="${point.x.toFixed(2)}" step="0.1"></td>
                <td><input type="number" class="coord-input" data-index="${index}" data-coord="y" value="${point.y.toFixed(2)}" step="0.1"></td>
                <td><input type="number" class="velocity-input" data-index="${index}" value="${point.velocity}" min="0" step="0.1"></td>
                <td>
                    <button class="btn-mini edit" onclick="window.splineApp.focusPoint(${index})">📍</button>
                    <button class="btn-mini" onclick="window.splineApp.removePoint(${index})">🗑️</button>
                </td>
            `;
            this.splineTableBody.appendChild(row);
        });
        
        // Add event listeners for velocity inputs
        document.querySelectorAll('.velocity-input').forEach(input => {
            input.addEventListener('change', (e) => {
                const index = parseInt(e.target.dataset.index);
                const value = parseFloat(e.target.value);
                if (!isNaN(value) && value >= 0) {
                    this.splinePoints[index].velocity = value;
                }
            });
            
            // Add validation on blur
            input.addEventListener('blur', (e) => {
                const value = parseFloat(e.target.value);
                if (isNaN(value) || value < 0) {
                    const index = parseInt(e.target.dataset.index);
                    e.target.value = this.splinePoints[index].velocity || 30;
                }
            });
        });
        
        // Add event listeners for coordinate inputs
        document.querySelectorAll('.coord-input').forEach(input => {
            input.addEventListener('change', (e) => {
                const index = parseInt(e.target.dataset.index);
                const coord = e.target.dataset.coord;
                const value = parseFloat(e.target.value);
                
                if (!isNaN(value)) {
                    // Update the point coordinates
                    this.splinePoints[index][coord] = value;
                    
                    // Redraw the spline and shapes
                    this.drawSpline();
                    this.highlightSelectedPoints();
                }
            });
            
            // Add input validation on blur
            input.addEventListener('blur', (e) => {
                const value = parseFloat(e.target.value);
                if (isNaN(value)) {
                    const index = parseInt(e.target.dataset.index);
                    const coord = e.target.dataset.coord;
                    e.target.value = this.splinePoints[index][coord].toFixed(2);
                }
            });
        });
        
        // Add event listeners for checkboxes with shift selection
        document.querySelectorAll('.point-checkbox').forEach(checkbox => {
            checkbox.addEventListener('click', (e) => this.handlePointSelection(e));
        });
        
        this.updatePointCount();
        this.updateSelectedCount();
        this.highlightSelectedPoints();
    }

    updatePointCount() {
        const pointCountElement = document.getElementById('pointCount');
        if (pointCountElement) {
            pointCountElement.textContent = `${this.splinePoints.length} punti`;
        }
    }

    updateSelectedCount() {
        const selectedCountElement = document.getElementById('selectedCount');
        if (selectedCountElement) {
            selectedCountElement.textContent = `${this.selectedPoints.size} selezionati`;
        }
        
        // Update select all checkbox
        const selectAllCheckbox = document.getElementById('selectAllPoints');
        if (selectAllCheckbox) {
            if (this.splinePoints.length === 0) {
                selectAllCheckbox.checked = false;
                selectAllCheckbox.indeterminate = false;
            } else if (this.selectedPoints.size === this.splinePoints.length) {
                selectAllCheckbox.checked = true;
                selectAllCheckbox.indeterminate = false;
            } else if (this.selectedPoints.size > 0) {
                selectAllCheckbox.checked = false;
                selectAllCheckbox.indeterminate = true;
            } else {
                selectAllCheckbox.checked = false;
                selectAllCheckbox.indeterminate = false;
            }
        }
    }

    updateShapesTable() {
        if (!this.shapesTableBody) return;
        
        this.shapesTableBody.innerHTML = '';
        
        this.shapes.forEach((shape, index) => {
            if (!shape.id) shape.id = index + 1;
            
            const dimensions = this.getShapeDimensions(shape);
            const position = this.getShapePosition(shape);
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${shape.id}</td>
                <td>${shape.type === 'rectangle' ? 'Rettangolo' : 'Cerchio'}</td>
                <td><input type="number" class="shape-coord-input" data-index="${index}" data-coord="x" value="${position.x.toFixed(2)}" step="0.1"></td>
                <td><input type="number" class="shape-coord-input" data-index="${index}" data-coord="y" value="${position.y.toFixed(2)}" step="0.1"></td>
                <td>${this.getEditableDimensions(shape, index)}</td>
                <td>
                    <button class="btn-mini edit" onclick="window.splineApp.focusShape(${index})">📍</button>
                    <button class="btn-mini" onclick="window.splineApp.removeShape(${index})">🗑️</button>
                </td>
            `;
            this.shapesTableBody.appendChild(row);
        });
        
        // Add event listeners for shape coordinate inputs
        document.querySelectorAll('.shape-coord-input').forEach(input => {
            input.addEventListener('input', (e) => {
                const index = parseInt(e.target.dataset.index);
                const coord = e.target.dataset.coord;
                const value = parseFloat(e.target.value);
                
                if (!isNaN(value)) {
                    this.updateShapePosition(index, coord, value);
                }
            });
            
            input.addEventListener('change', (e) => {
                const index = parseInt(e.target.dataset.index);
                const coord = e.target.dataset.coord;
                const value = parseFloat(e.target.value);
                
                if (!isNaN(value)) {
                    this.updateShapePosition(index, coord, value);
                }
            });
            
            input.addEventListener('blur', (e) => {
                const value = parseFloat(e.target.value);
                if (isNaN(value)) {
                    const index = parseInt(e.target.dataset.index);
                    const coord = e.target.dataset.coord;
                    const position = this.getShapePosition(this.shapes[index]);
                    e.target.value = position[coord].toFixed(2);
                }
            });
        });
        
        // Add event listeners for shape dimension inputs
        document.querySelectorAll('.shape-dimension-input').forEach(input => {
            input.addEventListener('input', (e) => {
                const index = parseInt(e.target.dataset.index);
                const dimension = e.target.dataset.dimension;
                const value = parseFloat(e.target.value);
                
                if (!isNaN(value) && value > 0) {
                    this.updateShapeDimension(index, dimension, value);
                }
            });
            
            input.addEventListener('change', (e) => {
                const index = parseInt(e.target.dataset.index);
                const dimension = e.target.dataset.dimension;
                const value = parseFloat(e.target.value);
                
                if (!isNaN(value) && value > 0) {
                    this.updateShapeDimension(index, dimension, value);
                }
            });
        });
        
        this.updateShapesCount();
    }

    getShapeDimensions(shape) {
        const width = Math.abs(shape.end.x - shape.start.x);
        const height = Math.abs(shape.end.y - shape.start.y);
        
        if (shape.type === 'rectangle') {
            return `${width.toFixed(1)} × ${height.toFixed(1)} mm`;
        } else if (shape.type === 'circle') {
            const radius = Math.sqrt(width * width + height * height);
            return `⌀ ${(radius * 2).toFixed(1)} mm`;
        }
        return '';
    }

    getEditableDimensions(shape, index) {
        const width = Math.abs(shape.end.x - shape.start.x);
        const height = Math.abs(shape.end.y - shape.start.y);
        
        if (shape.type === 'rectangle') {
            return `<input type="number" class="shape-dimension-input" data-index="${index}" data-dimension="width" value="${width.toFixed(1)}" min="0.1" step="0.1" style="width:45px"> × 
                    <input type="number" class="shape-dimension-input" data-index="${index}" data-dimension="height" value="${height.toFixed(1)}" min="0.1" step="0.1" style="width:45px"> mm`;
        } else if (shape.type === 'circle') {
            // Per i cerchi, il raggio è la distanza tra start e end
            const radius = Math.sqrt(width * width + height * height);
            const diameter = radius * 2;
            return `⌀ <input type="number" class="shape-dimension-input" data-index="${index}" data-dimension="diameter" value="${diameter.toFixed(1)}" min="0.1" step="0.1" style="width:55px"> mm`;
        }
        return '';
    }

    getShapePosition(shape) {
        if (shape.type === 'rectangle') {
            // Per i rettangoli, restituiamo la posizione dell'angolo di partenza (start)
            return {
                x: shape.start.x,
                y: shape.start.y
            };
        } else if (shape.type === 'circle') {
            return shape.start; // Center of circle
        }
        return { x: 0, y: 0 };
    }

    updatePointCount() {
        if (this.pointCountDisplay) {
            this.pointCountDisplay.textContent = `${this.splinePoints.length} punti`;
        }
    }

    handlePointSelection(e) {
        const checkbox = e.target;
        const index = parseInt(checkbox.dataset.index);
        const isShiftPressed = e.shiftKey;
        
        if (isShiftPressed && this.lastSelectedIndex !== -1) {
            // Shift selection: select range
            const start = Math.min(this.lastSelectedIndex, index);
            const end = Math.max(this.lastSelectedIndex, index);
            
            // Clear previous selection if not holding Ctrl
            if (!e.ctrlKey) {
                this.selectedPoints.clear();
            }
            
            // Select range
            for (let i = start; i <= end; i++) {
                this.selectedPoints.add(i);
                const cb = document.querySelector(`.point-checkbox[data-index="${i}"]`);
                if (cb) cb.checked = true;
            }
        } else {
            // Normal selection
            if (checkbox.checked) {
                this.selectedPoints.add(index);
            } else {
                this.selectedPoints.delete(index);
            }
        }
        
        this.lastSelectedIndex = index;
        this.updateSelectedCount();
        this.updateTableSelection();
        this.highlightSelectedPoints();
    }

    updateTableSelection() {
        // Update row styling based on selection
        document.querySelectorAll('#splineTableBody tr').forEach((row, index) => {
            if (this.selectedPoints.has(index)) {
                row.classList.add('selected');
            } else {
                row.classList.remove('selected');
            }
        });
    }

    highlightSelectedPoints() {
        // Redraw spline to clear previous highlights
        this.drawSpline();
        
        // Highlight selected points on canvas
        if (this.selectedPoints.size > 0) {
            this.splineCtx.save();
            this.splineCtx.strokeStyle = '#ff6600';
            this.splineCtx.fillStyle = '#ff6600';
            this.splineCtx.lineWidth = 3;
            
            this.selectedPoints.forEach(index => {
                if (index < this.splinePoints.length) {
                    const point = this.splinePoints[index];
                    const screenPos = this.worldToScreen(point.x, point.y);
                    
                    // Draw selection ring
                    this.splineCtx.beginPath();
                    this.splineCtx.arc(screenPos.x, screenPos.y, 8, 0, 2 * Math.PI);
                    this.splineCtx.stroke();
                    
                    // Draw filled center
                    this.splineCtx.beginPath();
                    this.splineCtx.arc(screenPos.x, screenPos.y, 4, 0, 2 * Math.PI);
                    this.splineCtx.fill();
                }
            });
            
            this.splineCtx.restore();
        }
    }

    updateSelectedCount() {
        if (this.selectedCountDisplay) {
            this.selectedCountDisplay.textContent = `${this.selectedPoints.size} selezionati`;
        }
    }

    updateShapesCount() {
        if (this.shapesCountDisplay) {
            this.shapesCountDisplay.textContent = `${this.shapes.length} geometrie`;
        }
    }

    toggleSelectAllPoints(selectAll) {
        if (selectAll) {
            // Select all points
            this.selectedPoints.clear();
            for (let i = 0; i < this.splinePoints.length; i++) {
                this.selectedPoints.add(i);
            }
        } else {
            // Deselect all points
            this.selectedPoints.clear();
        }
        
        // Update checkboxes
        document.querySelectorAll('.point-checkbox').forEach((checkbox, index) => {
            checkbox.checked = selectAll;
        });
        
        this.updateSelectedCount();
        this.updateTableSelection();
        this.highlightSelectedPoints();
    }

    applyBulkVelocity() {
        const velocity = parseFloat(this.bulkVelocityInput.value);
        if (isNaN(velocity) || velocity < 0) {
            alert('Inserire una velocità valida (mm/s)');
            return;
        }
        
        if (this.selectedPoints.size === 0) {
            alert('Selezionare almeno un punto');
            return;
        }
        
        this.selectedPoints.forEach(index => {
            if (index < this.splinePoints.length) {
                this.splinePoints[index].velocity = velocity;
            }
        });
        
        this.updateSplineTable();
        this.bulkVelocityInput.value = '';
    }

    removePoint(index) {
        if (confirm('Rimuovere questo punto?')) {
            this.splinePoints.splice(index, 1);
            
            // Update selected points after removal
            const newSelectedPoints = new Set();
            this.selectedPoints.forEach(selectedIndex => {
                if (selectedIndex < index) {
                    newSelectedPoints.add(selectedIndex);
                } else if (selectedIndex > index) {
                    newSelectedPoints.add(selectedIndex - 1);
                }
                // Skip the removed index
            });
            this.selectedPoints = newSelectedPoints;
            
            this.drawSpline();
            this.updateSplineTable();
        }
    }

    removeSelectedPoints() {
        if (this.selectedPoints.size === 0) {
            alert('Nessun punto selezionato');
            return;
        }
        
        if (confirm(`Rimuovere ${this.selectedPoints.size} punti selezionati?`)) {
            // Convert to array and sort in descending order to avoid index shifting
            const sortedIndices = Array.from(this.selectedPoints).sort((a, b) => b - a);
            
            sortedIndices.forEach(index => {
                this.splinePoints.splice(index, 1);
            });
            
            this.selectedPoints.clear();
            this.lastSelectedIndex = null;
            this.drawSpline();
            this.updateSplineTable();
        }
    }

    removeShape(index) {
        if (confirm('Rimuovere questa geometria?')) {
            this.shapes.splice(index, 1);
            this.redrawShapes();
            this.updateShapesTable();
        }
    }

    focusPoint(index) {
        // Highlight point on canvas (temporary visual feedback)
        const point = this.splinePoints[index];
        const screenPos = this.worldToScreen(point.x, point.y);
        
        this.splineCtx.save();
        this.splineCtx.strokeStyle = '#ff0000';
        this.splineCtx.lineWidth = 3;
        this.splineCtx.beginPath();
        this.splineCtx.arc(screenPos.x, screenPos.y, 8, 0, 2 * Math.PI);
        this.splineCtx.stroke();
        this.splineCtx.restore();
        
        setTimeout(() => this.drawSpline(), 1000);
    }

    focusShape(index) {
        // Highlight shape on canvas (temporary visual feedback)
        const shape = this.shapes[index];
        const start = this.worldToScreen(shape.start.x, shape.start.y);
        const end = this.worldToScreen(shape.end.x, shape.end.y);
        
        this.shapeCtx.save();
        this.shapeCtx.strokeStyle = '#ff0000';
        this.shapeCtx.lineWidth = 4;
        this.shapeCtx.setLineDash([5, 5]);
        this.shapeCtx.beginPath();
        
        if (shape.type === 'rectangle') {
            const width = end.x - start.x;
            const height = end.y - start.y;
            this.shapeCtx.rect(start.x, start.y, width, height);
        } else if (shape.type === 'circle') {
            const radius = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
            this.shapeCtx.arc(start.x, start.y, radius, 0, 2 * Math.PI);
        }
        
        this.shapeCtx.stroke();
        this.shapeCtx.restore();
        
        setTimeout(() => this.redrawShapes(), 1000);
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

    clearSnapIndicator() {
        if (this.lastSnapIndicator) {
            // Instead of clearRect (which might erase parts of the spline),
            // redraw the spline to remove the indicator
            this.drawSpline();
            this.lastSnapIndicator = null;
        }
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

    clearSpline() {
        if (confirm('Eliminare tutti i punti della spline?')) {
            this.splinePoints = [];
            this.selectedPoints.clear();
            this.lastSelectedIndex = null;
            
            // Clear the spline canvas
            this.splineCtx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
            
            this.updateSplineTable();
        }
    }

    clearShapes() {
        if (confirm('Eliminare tutte le geometrie?')) {
            this.shapes = [];
            
            // Clear the shapes canvas
            this.shapeCtx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
            
            this.updateShapesTable();
        }
    }

    saveProject() {
        const projectData = {
            version: '1.0',
            timestamp: new Date().toISOString(),
            settings: this.settings,
            splinePoints: this.splinePoints,
            shapes: this.shapes
        };
        
        const dataStr = JSON.stringify(projectData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        // Ottieni il nome del progetto dall'input o usa il timestamp come fallback
        const projectNameInput = document.getElementById('projectName');
        let fileName = 'spline-project';
        
        if (projectNameInput && projectNameInput.value.trim()) {
            // Usa il nome del progetto specificato, rimuovendo caratteri non validi
            fileName = projectNameInput.value.trim().replace(/[^a-zA-Z0-9_\-]/g, '-');
        } else {
            // Usa il timestamp come fallback
            fileName = `spline-project-${new Date().toISOString().slice(0,10)}`;
        }
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `${fileName}.json`;
        link.click();
        
        URL.revokeObjectURL(link.href);
    }

    loadProject(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const projectData = JSON.parse(e.target.result);
                
                // Validate project data
                if (!projectData.version || !projectData.splinePoints || !projectData.shapes) {
                    throw new Error('File non valido');
                }
                
                // Clear everything before loading new project
                this.splinePoints = [];
                this.shapes = [];
                this.selectedPoints.clear();
                this.lastSelectedIndex = null;
                this.lastSnapIndicator = null;
                
                // Clear all canvases
                this.splineCtx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
                this.shapeCtx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
                
                // Load data from project
                if (projectData.settings) {
                    this.settings = { ...this.settings, ...projectData.settings };
                    this.saveSettings(); // Update localStorage
                }
                
                this.splinePoints = projectData.splinePoints || [];
                this.shapes = projectData.shapes || [];
                
                // Redraw everything
                this.drawGrid();
                this.drawSpline();
                this.redrawShapes();
                this.updateSplineTable();
                this.updateShapesTable();
                
                alert('Progetto caricato con successo!');
                
            } catch (error) {
                alert('Errore nel caricamento del file: ' + error.message);
            }
        };
        
        reader.readAsText(file);
        
        // Reset file input
        event.target.value = '';
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

    updateShapePosition(index, coord, value) {
        const shape = this.shapes[index];
        if (!shape) return;
        
        const currentPosition = this.getShapePosition(shape);
        const deltaX = coord === 'x' ? value - currentPosition.x : 0;
        const deltaY = coord === 'y' ? value - currentPosition.y : 0;
        
        console.log(`Updating shape ${index} position: ${coord} = ${value}, delta: ${deltaX}, ${deltaY}`);
        
        if (shape.type === 'rectangle') {
            // Per i rettangoli: spostiamo entrambi i punti per mantenere le dimensioni
            shape.start.x += deltaX;
            shape.start.y += deltaY;
            shape.end.x += deltaX;
            shape.end.y += deltaY;
        } else if (shape.type === 'circle') {
            // For circles: move start (center), keep radius by updating end
            const radius = Math.sqrt(
                Math.pow(shape.end.x - shape.start.x, 2) + 
                Math.pow(shape.end.y - shape.start.y, 2)
            );
            shape.start.x += deltaX;
            shape.start.y += deltaY;
            // Update end to maintain radius
            shape.end.x = shape.start.x + radius;
            shape.end.y = shape.start.y;
        }
        
        this.redrawShapes();
        // Don't call updateShapesTable() to avoid recursion - table will be updated when input loses focus
    }

    updateShapeDimension(index, dimension, value) {
        const shape = this.shapes[index];
        if (!shape) return;
        
        console.log(`Updating shape ${index} dimension: ${dimension} = ${value}`);
        
        if (shape.type === 'rectangle') {
            // Per i rettangoli: start è l'angolo, end è l'angolo opposto
            // Manteniamo start fisso e cambiamo end per ridimensionare
            if (dimension === 'width') {
                // Cambia solo la coordinata X di end mantenendo la larghezza
                const direction = shape.end.x > shape.start.x ? 1 : -1;
                shape.end.x = shape.start.x + (value * direction);
            } else if (dimension === 'height') {
                // Cambia solo la coordinata Y di end mantenendo l'altezza
                const direction = shape.end.y > shape.start.y ? 1 : -1;
                shape.end.y = shape.start.y + (value * direction);
            }
        } else if (shape.type === 'circle' && dimension === 'diameter') {
            // Per i cerchi: start è il centro, end definisce il raggio
            const radius = value / 2;
            // Manteniamo start come centro del cerchio
            const center = { x: shape.start.x, y: shape.start.y };
            // end rappresenta un punto sul raggio (distanza = raggio)
            shape.end.x = center.x + radius;
            shape.end.y = center.y; // punto sulla linea orizzontale per semplicità
        }
        
        this.redrawShapes();
        // Don't call updateShapesTable() to avoid recursion - table will be updated when input loses focus
    }

    getShapeCenter(shape) {
        return {
            x: (shape.start.x + shape.end.x) / 2,
            y: (shape.start.y + shape.end.y) / 2
        };
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing SplineGenerator...');
    
    try {
        const app = new SplineGenerator();
        console.log('SplineGenerator initialized successfully');
        
        // Make app globally accessible for debugging and HTML onclick handlers
        window.splineApp = app;
        window.splineGenerator = app;
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