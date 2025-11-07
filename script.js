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
        
        // Animation properties
        this.isAnimating = false;
        this.isPaused = false;
        this.animationProgress = 0;
        this.animationStartTime = 0;
        this.animationRequestId = null;
        this.totalAnimationTime = 0;
        this.pausedTime = 0;
        
        // Draw grid after everything is initialized
        setTimeout(() => {
            this.drawGrid();
            this.updateTableHeaders();
            console.log('Grid drawn');
        }, 100);
    }

    initializeElements() {
        console.log('Initializing elements...');
        
        // Canvas elements
        this.gridCanvas = document.getElementById('gridCanvas');
        this.shapeCanvas = document.getElementById('shapeCanvas');
        this.splineCanvas = document.getElementById('splineCanvas');
        this.animationCanvas = document.getElementById('animationCanvas');
        
        if (!this.gridCanvas || !this.shapeCanvas || !this.splineCanvas || !this.animationCanvas) {
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
        
        // Animation buttons
        this.playBtn = document.getElementById('playBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.timeDisplay = document.getElementById('timeDisplay');
        
        // Export elements
        this.robotType = document.getElementById('robotType');
        this.exportBtn = document.getElementById('exportBtn');
        
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
        this.splineLengthDisplay = document.getElementById('splineLength');
        
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
            shapeColor: '#0066cc',
            xAxisLabel: 'X',
            yAxisLabel: 'Y'
        };
        this.loadSettingsFromStorage();
        this.updateSettingsUI();
    }

    initializeCanvases() {
        console.log('Initializing canvases...');
        
        if (!this.gridCanvas || !this.shapeCanvas || !this.splineCanvas || !this.animationCanvas) {
            console.error('Cannot initialize canvases - elements not found');
            console.log('gridCanvas:', this.gridCanvas);
            console.log('shapeCanvas:', this.shapeCanvas);
            console.log('splineCanvas:', this.splineCanvas);
            console.log('animationCanvas:', this.animationCanvas);
            return;
        }
        
        [this.gridCanvas, this.shapeCanvas, this.splineCanvas, this.animationCanvas].forEach(canvas => {
            if (canvas) {
                canvas.style.display = 'block';
                canvas.style.position = 'absolute';
                canvas.style.top = '0';
                canvas.style.left = '0';
                
                // Disable pointer events on animation canvas
                if (canvas === this.animationCanvas) {
                    canvas.style.pointerEvents = 'none';
                    console.log('Disabled pointer events on animation canvas');
                }
            }
        });
        
        this.gridCtx = this.gridCanvas.getContext('2d');
        this.shapeCtx = this.shapeCanvas.getContext('2d');
        this.splineCtx = this.splineCanvas.getContext('2d');
        this.animationCtx = this.animationCanvas.getContext('2d');
        
        // Set canvas size
        this.canvasWidth = 1200;
        this.canvasHeight = 800;
        
        [this.gridCanvas, this.shapeCanvas, this.splineCanvas, this.animationCanvas].forEach(canvas => {
            canvas.width = this.canvasWidth;
            canvas.height = this.canvasHeight;
        });
        
        this.centerX = this.canvasWidth / 2;
        this.centerY = this.canvasHeight / 2;
        
        console.log('Canvases initialized successfully');
        console.log('Final splineCanvas check:', this.splineCanvas);
        console.log('SplineCanvas ID:', this.splineCanvas?.id);
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
        
        // Animation buttons
        if (this.playBtn) {
            this.playBtn.addEventListener('click', () => this.startAnimation());
        }
        
        if (this.pauseBtn) {
            this.pauseBtn.addEventListener('click', () => this.pauseAnimation());
        }
        
        if (this.stopBtn) {
            this.stopBtn.addEventListener('click', () => this.stopAnimation());
        }
        
        // Export button
        if (this.exportBtn) {
            this.exportBtn.addEventListener('click', () => this.exportRobotCode());
        }
        
        // Canvas events
        if (this.splineCanvas) {
            console.log('Adding mouse events to canvas');
            console.log('Canvas element:', this.splineCanvas);
            console.log('Canvas getBoundingClientRect:', this.splineCanvas.getBoundingClientRect());
            
            this.splineCanvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
            this.splineCanvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
            this.splineCanvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
            
            // Don't end drawing when mouse leaves canvas - allow continuation
            this.splineCanvas.addEventListener('mouseleave', (e) => {
                console.log('Mouse left canvas, but continuing drawing...');
                // Don't call handleMouseUp here to allow drawing continuation
            });
            
            // Global events to continue drawing outside canvas
            document.addEventListener('mousemove', (e) => {
                if (this.isMouseDown) {
                    this.handleMouseMove(e);
                }
            });
            
            document.addEventListener('mouseup', (e) => {
                if (this.isMouseDown) {
                    this.handleMouseUp(e);
                }
            });
            
            // Test click event
            this.splineCanvas.addEventListener('click', (e) => {
                console.log('Click event received on canvas!', e);
            });
        } else {
            console.error('splineCanvas not found!');
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
        
        // Axis label validation
        const xAxisSelect = document.getElementById('xAxisLabel');
        const yAxisSelect = document.getElementById('yAxisLabel');
        
        if (xAxisSelect && yAxisSelect) {
            const validateAxisLabels = () => {
                const xValue = xAxisSelect.value;
                const yValue = yAxisSelect.value;
                
                if (xValue === yValue) {
                    // Reset to different values
                    if (xValue === 'X') {
                        yAxisSelect.value = 'Y';
                    } else if (xValue === 'Y') {
                        yAxisSelect.value = 'Z';
                    } else {
                        yAxisSelect.value = 'X';
                    }
                    alert('Le etichette degli assi devono essere diverse!');
                }
            };
            
            xAxisSelect.addEventListener('change', validateAxisLabels);
            yAxisSelect.addEventListener('change', validateAxisLabels);
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
        
        // Calculate the actual used dimensions with uniform scale
        const usedWidth = totalRangeX * scale;
        const usedHeight = totalRangeY * scale;
        
        // Center the content in the canvas
        const offsetX = (this.canvasWidth - usedWidth) / 2;
        const offsetY = (this.canvasHeight - usedHeight) / 2;
        
        console.log(`Original scales: ${scaleX.toFixed(2)}px/mm (X), ${scaleY.toFixed(2)}px/mm (Y)`);
        console.log(`Uniform scale: ${scale.toFixed(2)}px/mm`);
        console.log(`Offset: X=${offsetX.toFixed(1)}px, Y=${offsetY.toFixed(1)}px`);
        
        // Calculate position of X=0 and Y=0 axes with uniform scale and centering
        const zeroX = offsetX + (0 - this.settings.minX) * scale;
        const zeroY = offsetY + (this.settings.maxY - 0) * scale;
        
        // Secondary grid lines (fine grid)
        this.gridCtx.strokeStyle = '#e8e8e8';
        this.gridCtx.lineWidth = 0.5;
        this.gridCtx.beginPath();
        
        // Vertical lines
        for (let x = this.settings.minX; x <= this.settings.maxX; x += this.settings.gridSize) {
            const canvasX = offsetX + (x - this.settings.minX) * scale;
            this.gridCtx.moveTo(canvasX, offsetY);
            this.gridCtx.lineTo(canvasX, offsetY + usedHeight);
        }
        
        // Horizontal lines  
        for (let y = this.settings.minY; y <= this.settings.maxY; y += this.settings.gridSize) {
            const canvasY = offsetY + (this.settings.maxY - y) * scale;
            this.gridCtx.moveTo(offsetX, canvasY);
            this.gridCtx.lineTo(offsetX + usedWidth, canvasY);
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
                const canvasX = offsetX + (x - this.settings.minX) * scale;
                this.gridCtx.moveTo(canvasX, offsetY);
                this.gridCtx.lineTo(canvasX, offsetY + usedHeight);
            }
        }
        
        // Major horizontal lines
        for (let y = this.settings.minY; y <= this.settings.maxY; y += majorStep) {
            if (y % majorStep === 0) {
                const canvasY = offsetY + (this.settings.maxY - y) * scale;
                this.gridCtx.moveTo(offsetX, canvasY);
                this.gridCtx.lineTo(offsetX + usedWidth, canvasY);
            }
        }
        
        this.gridCtx.stroke();
        
        // Main axes (X=0, Y=0) - only if they're within the visible range
        this.gridCtx.strokeStyle = '#333333';
        this.gridCtx.lineWidth = 2;
        this.gridCtx.beginPath();
        
        // Y axis (X=0) - draw only if X=0 is within range
        if (0 >= this.settings.minX && 0 <= this.settings.maxX) {
            this.gridCtx.moveTo(zeroX, offsetY);
            this.gridCtx.lineTo(zeroX, offsetY + usedHeight);
        }
        
        // X axis (Y=0) - draw only if Y=0 is within range
        if (0 >= this.settings.minY && 0 <= this.settings.maxY) {
            this.gridCtx.moveTo(offsetX, zeroY);
            this.gridCtx.lineTo(offsetX + usedWidth, zeroY);
        }
        
        this.gridCtx.stroke();
        
        // Draw labels for both minor and major grid lines
        this.drawGridLabels(scale, scale, zeroX, zeroY, offsetX, offsetY, usedWidth, usedHeight);
        
        console.log('Grid drawing completed');
    }
    
    drawGridLabels(scaleX, scaleY, zeroX, zeroY, offsetX, offsetY, usedWidth, usedHeight) {
        // Set up text style
        this.gridCtx.fillStyle = '#666666';
        this.gridCtx.font = '11px Arial';
        
        // X axis labels (horizontal)
        this.gridCtx.textAlign = 'center';
        this.gridCtx.textBaseline = 'top';
        
        for (let x = this.settings.minX; x <= this.settings.maxX; x += this.settings.gridSize) {
            if (x !== 0) { // Skip zero, we'll handle it separately
                const canvasX = offsetX + (x - this.settings.minX) * scaleX;
                let labelY;
                
                if (0 >= this.settings.minY && 0 <= this.settings.maxY) {
                    // Zero line is visible, place labels on it
                    labelY = zeroY + 4;
                } else {
                    // Zero line not visible, place at bottom of used area
                    labelY = offsetY + usedHeight - 15;
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
                const canvasY = offsetY + (this.settings.maxY - y) * scaleY;
                let labelX;
                
                if (0 >= this.settings.minX && 0 <= this.settings.maxX) {
                    // Zero line is visible, place labels on it
                    labelX = zeroX - 4;
                } else {
                    // Zero line not visible, place at left of used area
                    labelX = offsetX - 4;
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
        
        // Draw axis labels
        this.drawAxisLabels(zeroX, zeroY);
    }
    
    drawAxisLabels(zeroX, zeroY) {
        this.gridCtx.fillStyle = '#000000';
        this.gridCtx.font = 'bold 16px Arial';
        
        // X axis label (horizontal axis) - position at right end
        this.gridCtx.textAlign = 'center';
        this.gridCtx.textBaseline = 'middle';
        
        let xLabelX = this.canvasWidth - 20;
        let xLabelY = zeroY;
        
        // If zero line is not visible, place at bottom
        if (!(0 >= this.settings.minY && 0 <= this.settings.maxY)) {
            xLabelY = this.canvasHeight - 20;
        }
        
        this.gridCtx.fillText(this.settings.xAxisLabel, xLabelX, xLabelY);
        
        // Y axis label (vertical axis) - position at top end
        this.gridCtx.textAlign = 'center';
        this.gridCtx.textBaseline = 'middle';
        
        let yLabelX = zeroX;
        let yLabelY = 20;
        
        // If zero line is not visible, place at left
        if (!(0 >= this.settings.minX && 0 <= this.settings.maxX)) {
            yLabelX = 20;
        }
        
        this.gridCtx.fillText(this.settings.yAxisLabel, yLabelX, yLabelY);
    }
    
    updateTableHeaders() {
        // Update spline table headers
        const splineTable = document.getElementById('splineTable');
        if (splineTable) {
            const headers = splineTable.querySelectorAll('thead th');
            if (headers.length >= 4) {
                headers[2].textContent = `${this.settings.xAxisLabel} (mm)`;
                headers[3].textContent = `${this.settings.yAxisLabel} (mm)`;
            }
        }
        
        // Update shapes table headers
        const shapesTable = document.getElementById('shapesTable');
        if (shapesTable) {
            const headers = shapesTable.querySelectorAll('thead th');
            if (headers.length >= 5) {
                headers[2].textContent = `Posizione ${this.settings.xAxisLabel} (mm)`;
                headers[3].textContent = `Posizione ${this.settings.yAxisLabel} (mm)`;
            }
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
        
        // Calculate the actual used dimensions with uniform scale
        const usedWidth = totalRangeX * scale;
        const usedHeight = totalRangeY * scale;
        
        // Center the content in the canvas
        const offsetX = (this.canvasWidth - usedWidth) / 2;
        const offsetY = (this.canvasHeight - usedHeight) / 2;
        
        // Allow conversion even when mouse is outside the canvas bounds
        // This enables drawing continuation when mouse exits the canvas area
        const worldX = this.settings.minX + ((canvasX - offsetX) / scale);
        const worldY = this.settings.maxY - ((canvasY - offsetY) / scale);
        
        return { x: worldX, y: worldY };
    }

    worldToScreen(worldX, worldY) {
        const totalRangeX = this.settings.maxX - this.settings.minX;
        const totalRangeY = this.settings.maxY - this.settings.minY;
        const scaleX = this.canvasWidth / totalRangeX;
        const scaleY = this.canvasHeight / totalRangeY;
        
        // Use uniform scale to maintain 1:1 aspect ratio
        const scale = Math.min(scaleX, scaleY);
        
        // Calculate the actual used dimensions with uniform scale
        const usedWidth = totalRangeX * scale;
        const usedHeight = totalRangeY * scale;
        
        // Center the content in the canvas
        const offsetX = (this.canvasWidth - usedWidth) / 2;
        const offsetY = (this.canvasHeight - usedHeight) / 2;
        
        const canvasX = offsetX + (worldX - this.settings.minX) * scale;
        const canvasY = offsetY + (this.settings.maxY - worldY) * scale;
        
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

    // Get mouse position with snap applied and clamped to graph limits
    getMousePosition(e) {
        const rawPos = this.screenToWorld(e.clientX, e.clientY);
        const snappedPos = this.snapToGrid(rawPos);
        return this.clampToGraphLimits(snappedPos);
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
            // Clear any existing animation when starting a new spline
            if (this.animationCtx) {
                this.animationCtx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
            }
            
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

    clampToGraphLimits(worldPos) {
        // Clamp coordinates strictly to the graph limits without any margin
        // This prevents drawing outside the defined graph area
        return {
            x: Math.max(this.settings.minX, Math.min(this.settings.maxX, worldPos.x)),
            y: Math.max(this.settings.minY, Math.min(this.settings.maxY, worldPos.y))
        };
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
        this.updateSplineLength();
        this.highlightSelectedPoints();
    }

    updatePointCount() {
        const pointCountElement = document.getElementById('pointCount');
        if (pointCountElement) {
            pointCountElement.textContent = `${this.splinePoints.length} punti`;
        }
    }

    updateSplineLength() {
        const splineLengthElement = document.getElementById('splineLength');
        if (splineLengthElement) {
            const length = this.splinePoints.length >= 2 ? this.calculateSplineLength() : 0;
            splineLengthElement.textContent = `Lunghezza: ${length.toFixed(1)} mm`;
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
            
            // For shift selection, we always extend the current selection
            // (don't clear unless Ctrl is explicitly held to modify behavior)
            
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
        
        // Deselect all points after applying velocity
        this.selectedPoints.clear();
        
        // Update checkboxes in table
        document.querySelectorAll('.point-checkbox').forEach(checkbox => {
            checkbox.checked = false;
        });
        
        // Update displays and graphics
        this.updateSelectedCount();
        this.updateTableSelection();
        this.highlightSelectedPoints();
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
                `${this.settings.xAxisLabel}: ${worldPos.x.toFixed(1)} mm → ${snappedPos.x.toFixed(1)} mm, ${this.settings.yAxisLabel}: ${worldPos.y.toFixed(1)} mm → ${snappedPos.y.toFixed(1)} mm`;
        } else {
            this.coordinatesDisplay.textContent = 
                `${this.settings.xAxisLabel}: ${worldPos.x.toFixed(1)} mm, ${this.settings.yAxisLabel}: ${worldPos.y.toFixed(1)} mm`;
        }
    }

    clearSpline() {
        if (confirm('Eliminare tutti i punti della spline?')) {
            this.splinePoints = [];
            this.selectedPoints.clear();
            this.lastSelectedIndex = null;
            
            // Stop any running animation
            this.stopAnimation();
            
            // Clear the spline canvas
            this.splineCtx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
            
            // Clear the animation canvas
            this.animationCtx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
            
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
        // Get project name from input
        const projectNameInput = document.getElementById('projectName');
        const projectName = projectNameInput && projectNameInput.value.trim() 
            ? projectNameInput.value.trim() 
            : '';
        
        const projectData = {
            version: '1.0',
            timestamp: new Date().toISOString(),
            projectName: projectName,
            settings: this.settings,
            splinePoints: this.splinePoints,
            shapes: this.shapes
        };
        
        const dataStr = JSON.stringify(projectData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        // Determine filename
        let fileName = 'spline-project';
        
        if (projectName) {
            // Use project name specified, removing invalid characters
            fileName = projectName.replace(/[^a-zA-Z0-9_\-]/g, '-');
        } else {
            // Use timestamp as fallback
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
                    // Merge settings ensuring all new properties are included
                    this.settings = { 
                        ...this.settings, 
                        ...projectData.settings,
                        // Ensure new axis label settings have defaults if not present
                        xAxisLabel: projectData.settings.xAxisLabel || 'X',
                        yAxisLabel: projectData.settings.yAxisLabel || 'Y'
                    };
                    this.updateSettingsUI();
                    this.saveSettingsToStorage();
                }
                
                // Load project name if available
                if (projectData.projectName) {
                    const projectNameInput = document.getElementById('projectName');
                    if (projectNameInput) {
                        projectNameInput.value = projectData.projectName;
                    }
                }
                
                this.splinePoints = projectData.splinePoints || [];
                this.shapes = projectData.shapes || [];
                
                // Redraw everything with updated settings
                this.drawGrid();
                this.updateTableHeaders();
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

    updateCanvasScaling() {
        // Clear all canvases to ensure clean redraw
        if (this.gridCtx) {
            this.gridCtx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        }
        if (this.shapeCtx) {
            this.shapeCtx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        }
        if (this.splineCtx) {
            this.splineCtx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        }
        if (this.animationCtx) {
            this.animationCtx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        }
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
        this.settings.xAxisLabel = document.getElementById('xAxisLabel').value;
        this.settings.yAxisLabel = document.getElementById('yAxisLabel').value;
        
        // Validate that X and Y axis labels are different
        if (this.settings.xAxisLabel === this.settings.yAxisLabel) {
            alert('Le etichette degli assi devono essere diverse!');
            return;
        }
        
        // Update canvas dimensions and scaling for new ranges
        this.updateCanvasScaling();
        
        this.saveSettingsToStorage();
        this.drawGrid();
        this.updateTableHeaders();
        this.redrawShapes();
        this.drawSpline();
        
        // Clear and redraw animation if any spline exists
        if (this.animationCtx) {
            this.animationCtx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        }
        
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
            shapeColor: '#0066cc',
            xAxisLabel: 'X',
            yAxisLabel: 'Y'
        };
        this.updateSettingsUI();
        this.saveSettingsToStorage();
        this.drawGrid();
        this.updateTableHeaders();
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
            'shapeColor': this.settings.shapeColor,
            'xAxisLabel': this.settings.xAxisLabel,
            'yAxisLabel': this.settings.yAxisLabel
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
    
    // Animation methods
    formatTime(milliseconds) {
        const totalSeconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        const centiseconds = Math.floor((milliseconds % 1000) / 10);
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
    }
    
    updateTimeDisplay(elapsedTime) {
        if (this.timeDisplay) {
            const current = this.formatTime(elapsedTime);
            const total = this.formatTime(this.totalAnimationTime);
            this.timeDisplay.textContent = `${current} / ${total}`;
        }
    }
    
    calculateTotalAnimationTime() {
        if (this.splinePoints.length < 2) return 0;
        
        let totalTime = 0;
        for (let i = 0; i < this.splinePoints.length - 1; i++) {
            const p1 = this.splinePoints[i];
            const p2 = this.splinePoints[i + 1];
            
            const distance = Math.sqrt(
                Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2)
            );
            
            const velocity = p1.velocity || 30; // mm/s
            totalTime += distance / velocity; // seconds
        }
        
        return totalTime * 1000; // Convert to milliseconds
    }
    
    startAnimation() {
        if (this.splinePoints.length < 2) {
            alert('Aggiungi almeno 2 punti alla spline per avviare l\'animazione!');
            return;
        }
        
        this.isAnimating = true;
        
        if (!this.isPaused) {
            // Starting fresh animation - clear previous animation
            this.animationCtx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
            this.animationProgress = 0;
            this.totalAnimationTime = this.calculateTotalAnimationTime();
            this.pausedTime = 0;
            this.updateTimeDisplay(0);
        } else {
            // Resuming from pause
            this.isPaused = false;
        }
        
        // Set start time accounting for paused time
        this.animationStartTime = performance.now() - this.pausedTime;
        
        // Update button visibility
        this.playBtn.style.display = 'none';
        this.pauseBtn.style.display = 'inline-block';
        
        this.animate();
    }
    
    pauseAnimation() {
        this.isPaused = true;
        this.isAnimating = false;
        
        // Save the elapsed time when pausing
        this.pausedTime = performance.now() - this.animationStartTime;
        
        if (this.animationRequestId) {
            cancelAnimationFrame(this.animationRequestId);
            this.animationRequestId = null;
        }
        
        // Update button visibility
        this.playBtn.style.display = 'inline-block';
        this.pauseBtn.style.display = 'none';
    }
    
    stopAnimation() {
        this.isAnimating = false;
        this.isPaused = false;
        this.animationProgress = 0;
        this.pausedTime = 0;
        
        if (this.animationRequestId) {
            cancelAnimationFrame(this.animationRequestId);
            this.animationRequestId = null;
        }
        
        // Clear animation canvas
        this.animationCtx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        
        // Reset time display
        this.updateTimeDisplay(0);
        
        // Update button visibility
        this.playBtn.style.display = 'inline-block';
        this.pauseBtn.style.display = 'none';
    }
    
    animate() {
        if (!this.isAnimating) return;
        
        const currentTime = performance.now();
        const elapsedTime = currentTime - this.animationStartTime;
        
        // Update time display
        this.updateTimeDisplay(elapsedTime);
        
        // Clear animation canvas
        this.animationCtx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        
        // Calculate current position based on velocity
        const position = this.calculateAnimationPosition(elapsedTime);
        
        if (position) {
            // Draw animated spline up to current position
            this.drawAnimatedSpline(position.segmentIndex, position.progress);
            
            // Draw position indicator
            this.drawPositionIndicator(position.x, position.y);
        }
        
        // Continue animation if not finished
        if (elapsedTime < this.totalAnimationTime) {
            this.animationRequestId = requestAnimationFrame(() => this.animate());
        } else {
            // Animation finished - show complete spline and final position
            this.isAnimating = false;
            
            // Draw complete animated spline
            if (this.splinePoints.length >= 2) {
                this.drawAnimatedSpline(this.splinePoints.length - 2, 1);
                const lastPoint = this.splinePoints[this.splinePoints.length - 1];
                this.drawPositionIndicator(lastPoint.x, lastPoint.y);
            }
            
            // Update button visibility but keep the animation displayed
            this.playBtn.style.display = 'inline-block';
            this.pauseBtn.style.display = 'none';
        }
    }
    
    calculateAnimationPosition(elapsedTime) {
        if (this.splinePoints.length < 2) return null;
        
        // Calculate total spline length for proper timing
        const totalSplineLength = this.calculateSplineLength();
        
        // Calculate how far along the spline we should be based on time
        let currentTime = 0;
        let targetDistance = 0;
        
        // First, find the target distance based on elapsed time
        for (let i = 0; i < this.splinePoints.length - 1; i++) {
            const p1 = this.splinePoints[i];
            const velocity = p1.velocity || 30; // mm/s
            const segmentLength = this.calculateSplineSegmentLength(i);
            const segmentTime = (segmentLength / velocity) * 1000; // milliseconds
            
            if (elapsedTime <= currentTime + segmentTime) {
                const segmentProgress = (elapsedTime - currentTime) / segmentTime;
                targetDistance += segmentLength * segmentProgress;
                break;
            }
            
            currentTime += segmentTime;
            targetDistance += segmentLength;
        }
        
        // Now find the position at the target distance along the spline
        return this.getPositionAtDistance(targetDistance);
    }
    
    calculateSplineLength() {
        if (this.splinePoints.length < 2) return 0;
        
        let totalLength = 0;
        for (let i = 0; i < this.splinePoints.length - 1; i++) {
            totalLength += this.calculateSplineSegmentLength(i);
        }
        return totalLength;
    }
    
    calculateSplineSegmentLength(segmentIndex) {
        if (segmentIndex >= this.splinePoints.length - 1) return 0;
        
        const p1 = this.splinePoints[segmentIndex];
        const p2 = this.splinePoints[segmentIndex + 1];
        
        if (this.splinePoints.length === 2) {
            // Simple line distance
            return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
        }
        
        // For spline segments, approximate length by sampling the curve
        const samples = 20;
        let length = 0;
        let prevPoint = this.getSplinePointAt(segmentIndex, 0);
        
        for (let i = 1; i <= samples; i++) {
            const t = i / samples;
            const currentPoint = this.getSplinePointAt(segmentIndex, t);
            length += Math.sqrt(
                Math.pow(currentPoint.x - prevPoint.x, 2) + 
                Math.pow(currentPoint.y - prevPoint.y, 2)
            );
            prevPoint = currentPoint;
        }
        
        return length;
    }
    
    getSplinePointAt(segmentIndex, t) {
        if (this.splinePoints.length === 2) {
            // Linear interpolation for 2 points
            const p1 = this.splinePoints[0];
            const p2 = this.splinePoints[1];
            return {
                x: p1.x + (p2.x - p1.x) * t,
                y: p1.y + (p2.y - p1.y) * t
            };
        }
        
        // Bezier curve calculation for spline segments
        const i = segmentIndex;
        const points = this.splinePoints;
        
        if (i === 0) {
            // First segment
            const p0 = points[0];
            const p1 = points[1];
            const p2 = points[2] || points[1];
            
            const cp1x = p0.x + (p1.x - p0.x) * this.settings.splineSmoothing * 0.2;
            const cp1y = p0.y + (p1.y - p0.y) * this.settings.splineSmoothing * 0.2;
            const cp2x = p1.x - (p2.x - p0.x) * this.settings.splineSmoothing * 0.2;
            const cp2y = p1.y - (p2.y - p0.y) * this.settings.splineSmoothing * 0.2;
            
            return this.bezierPoint(p0, {x: cp1x, y: cp1y}, {x: cp2x, y: cp2y}, p1, t);
        } else if (i >= points.length - 2) {
            // Last segment
            const p0 = points[i - 1] || points[i];
            const p1 = points[i];
            const p2 = points[i + 1];
            
            const cp1x = p1.x + (p2.x - p0.x) * this.settings.splineSmoothing * 0.2;
            const cp1y = p1.y + (p2.y - p0.y) * this.settings.splineSmoothing * 0.2;
            const cp2x = p2.x - (p2.x - p1.x) * this.settings.splineSmoothing * 0.2;
            const cp2y = p2.y - (p2.y - p1.y) * this.settings.splineSmoothing * 0.2;
            
            return this.bezierPoint(p1, {x: cp1x, y: cp1y}, {x: cp2x, y: cp2y}, p2, t);
        } else {
            // Middle segments
            const p0 = points[i - 1];
            const p1 = points[i];
            const p2 = points[i + 1];
            const p3 = points[i + 2];
            
            const cp1x = p1.x + (p2.x - p0.x) * this.settings.splineSmoothing * 0.2;
            const cp1y = p1.y + (p2.y - p0.y) * this.settings.splineSmoothing * 0.2;
            const cp2x = p2.x - (p3.x - p1.x) * this.settings.splineSmoothing * 0.2;
            const cp2y = p2.y - (p3.y - p1.y) * this.settings.splineSmoothing * 0.2;
            
            return this.bezierPoint(p1, {x: cp1x, y: cp1y}, {x: cp2x, y: cp2y}, p2, t);
        }
    }
    
    bezierPoint(p0, p1, p2, p3, t) {
        const u = 1 - t;
        const tt = t * t;
        const uu = u * u;
        const uuu = uu * u;
        const ttt = tt * t;
        
        return {
            x: uuu * p0.x + 3 * uu * t * p1.x + 3 * u * tt * p2.x + ttt * p3.x,
            y: uuu * p0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + ttt * p3.y
        };
    }
    
    getPositionAtDistance(targetDistance) {
        if (this.splinePoints.length < 2) return null;
        
        let currentDistance = 0;
        
        for (let i = 0; i < this.splinePoints.length - 1; i++) {
            const segmentLength = this.calculateSplineSegmentLength(i);
            
            if (currentDistance + segmentLength >= targetDistance) {
                // Target is in this segment
                const segmentProgress = (targetDistance - currentDistance) / segmentLength;
                const position = this.getSplinePointAt(i, segmentProgress);
                
                return {
                    x: position.x,
                    y: position.y,
                    segmentIndex: i,
                    progress: segmentProgress
                };
            }
            
            currentDistance += segmentLength;
        }
        
        // Return last point if beyond total distance
        const lastPoint = this.splinePoints[this.splinePoints.length - 1];
        return {
            x: lastPoint.x,
            y: lastPoint.y,
            segmentIndex: this.splinePoints.length - 2,
            progress: 1
        };
    }
    
    drawAnimatedSpline(currentSegmentIndex, segmentProgress) {
        if (this.splinePoints.length < 2) return;
        
        this.animationCtx.strokeStyle = '#ff6600';
        this.animationCtx.lineWidth = 4;
        this.animationCtx.lineCap = 'round';
        this.animationCtx.lineJoin = 'round';
        
        this.animationCtx.beginPath();
        
        if (this.splinePoints.length === 2) {
            // Simple line for two points
            const p1 = this.splinePoints[0];
            const p2 = this.splinePoints[1];
            
            const currentX = p1.x + (p2.x - p1.x) * segmentProgress;
            const currentY = p1.y + (p2.y - p1.y) * segmentProgress;
            
            const screenP1 = this.worldToScreen(p1.x, p1.y);
            const screenCurrent = this.worldToScreen(currentX, currentY);
            
            this.animationCtx.moveTo(screenP1.x, screenP1.y);
            this.animationCtx.lineTo(screenCurrent.x, screenCurrent.y);
        } else {
            // Draw smooth spline up to current position
            const points = this.splinePoints.map(p => this.worldToScreen(p.x, p.y));
            
            this.animationCtx.moveTo(points[0].x, points[0].y);
            
            // Draw completed segments
            for (let i = 1; i < Math.min(currentSegmentIndex + 1, points.length - 1); i++) {
                const cp1x = points[i].x + (points[i + 1].x - points[i - 1].x) * this.settings.splineSmoothing * 0.2;
                const cp1y = points[i].y + (points[i + 1].y - points[i - 1].y) * this.settings.splineSmoothing * 0.2;
                const cp2x = points[i + 1].x - (points[i + 2] ? points[i + 2].x - points[i].x : 0) * this.settings.splineSmoothing * 0.2;
                const cp2y = points[i + 1].y - (points[i + 2] ? points[i + 2].y - points[i].y : 0) * this.settings.splineSmoothing * 0.2;
                
                if (i <= currentSegmentIndex) {
                    // Complete segment
                    this.animationCtx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, points[i + 1].x, points[i + 1].y);
                }
            }
            
            // Draw partial current segment if needed
            if (currentSegmentIndex < this.splinePoints.length - 1 && segmentProgress > 0) {
                const currentPoint = this.getSplinePointAt(currentSegmentIndex, segmentProgress);
                const screenCurrent = this.worldToScreen(currentPoint.x, currentPoint.y);
                
                // Draw curve up to current position
                const i = currentSegmentIndex + 1;
                if (i < points.length - 1) {
                    const cp1x = points[i].x + (points[i + 1].x - points[i - 1].x) * this.settings.splineSmoothing * 0.2;
                    const cp1y = points[i].y + (points[i + 1].y - points[i - 1].y) * this.settings.splineSmoothing * 0.2;
                    const cp2x = points[i + 1].x - (points[i + 2] ? points[i + 2].x - points[i].x : 0) * this.settings.splineSmoothing * 0.2;
                    const cp2y = points[i + 1].y - (points[i + 2] ? points[i + 2].y - points[i].y : 0) * this.settings.splineSmoothing * 0.2;
                    
                    // Sample the bezier curve up to the current progress
                    const samples = Math.ceil(segmentProgress * 20);
                    for (let s = 1; s <= samples; s++) {
                        const t = (s / 20) / segmentProgress;
                        if (t > 1) break;
                        
                        const samplePoint = this.getSplinePointAt(currentSegmentIndex, t * segmentProgress);
                        const screenSample = this.worldToScreen(samplePoint.x, samplePoint.y);
                        this.animationCtx.lineTo(screenSample.x, screenSample.y);
                    }
                }
            }
        }
        
        this.animationCtx.stroke();
    }
    
    drawPositionIndicator(worldX, worldY) {
        const screenPos = this.worldToScreen(worldX, worldY);
        
        // Draw outer circle (white border)
        this.animationCtx.fillStyle = 'white';
        this.animationCtx.strokeStyle = '#333';
        this.animationCtx.lineWidth = 2;
        this.animationCtx.beginPath();
        this.animationCtx.arc(screenPos.x, screenPos.y, 8, 0, 2 * Math.PI);
        this.animationCtx.fill();
        this.animationCtx.stroke();
        
        // Draw inner circle (orange)
        this.animationCtx.fillStyle = '#ff6600';
        this.animationCtx.beginPath();
        this.animationCtx.arc(screenPos.x, screenPos.y, 5, 0, 2 * Math.PI);
        this.animationCtx.fill();
    }
    
    // Robot code export methods
    exportRobotCode() {
        if (this.splinePoints.length < 2) {
            alert('Aggiungi almeno 2 punti alla spline per esportare!');
            return;
        }
        
        const robotType = this.robotType ? this.robotType.value : 'kuka';
        
        switch (robotType) {
            case 'kuka':
                this.exportKukaCode();
                break;
            case 'fanuc':
                alert('Esportazione FANUC non ancora implementata');
                break;
            case 'abb':
                alert('Esportazione ABB non ancora implementata');
                break;
            case 'motoman':
                alert('Esportazione MOTOMAN non ancora implementata');
                break;
            default:
                alert('Tipo di robot non supportato');
        }
    }
    
    exportKukaCode() {
        const projectNameInput = document.getElementById('projectName');
        let projectName = 'Progetto1';
        
        if (projectNameInput && projectNameInput.value.trim()) {
            projectName = projectNameInput.value.trim().replace(/[^a-zA-Z0-9_]/g, '_');
        }
        
        // Try to load templates, fallback to default if not available
        this.loadKukaTemplates().then(templates => {
            // Generate .dat file
            const datContent = this.generateKukaDatFromTemplate(projectName, templates.dat);
            this.downloadFile(datContent, `${projectName}.dat`, 'text/plain');
            
            // Generate .src file
            const srcContent = this.generateKukaSrcFromTemplate(projectName, templates.src);
            this.downloadFile(srcContent, `${projectName}.src`, 'text/plain');
            
            console.log('KUKA files exported:', `${projectName}.dat`, `${projectName}.src`);
        }).catch(error => {
            console.log('Using embedded templates (templates folder not accessible)');
            // Use embedded templates
            const templates = this.getEmbeddedKukaTemplates();
            
            const datContent = this.generateKukaDatFromTemplate(projectName, templates.dat);
            this.downloadFile(datContent, `${projectName}.dat`, 'text/plain');
            
            const srcContent = this.generateKukaSrcFromTemplate(projectName, templates.src);
            this.downloadFile(srcContent, `${projectName}.src`, 'text/plain');
            
            console.log('KUKA files exported using embedded templates');
        });
    }
    
    getEmbeddedKukaTemplates() {
        return {
            dat: `&ACCESS RVO
&REL 35
&PARAM DISKPATH = KRC:\\R1\\Program\\Support Programs
DEFDAT  {{PROJECT_NAME}} PUBLIC

; positions from SpLine Generator
DECL FRAME pSpl[{{NUM_POINTS}}]
{{FRAME_POSITIONS}}

; calculated points
DECL E6POS pMove[{{NUM_POINTS}}]
{{MOVE_POSITIONS}}
ENDDAT`,
            src: `DEF {{PROJECT_NAME}}(lp0: IN, lTool: IN, lBase: IN)
    E6POS lp0
    FRAME lTool, lBase
    INT liIdx
    
    ; Calculate positions relative to base
    FOR liIdx = 1 TO {{NUM_POINTS}}
        pMove[liIdx] = pToolOffset(lp0, pSpl[liIdx].X, pSpl[liIdx].Y, pSpl[liIdx].Z, 0, 0, 0)
    ENDFOR
    
    $TOOL=lTool
    $BASE=lBase
    
    SPLINE
{{SPLINE_POINTS}}
    ENDSPLINE
END`
        };
    }
    
    async loadKukaTemplates() {
        try {
            // Check if we're running from a web server
            if (window.location.protocol === 'file:') {
                throw new Error('File protocol detected, using embedded templates');
            }
            
            const [datResponse, srcResponse] = await Promise.all([
                fetch('./templates/kuka_template.dat'),
                fetch('./templates/kuka_template.src')
            ]);
            
            if (!datResponse.ok || !srcResponse.ok) {
                throw new Error('Template files not found');
            }
            
            const dat = await datResponse.text();
            const src = await srcResponse.text();
            
            console.log('Templates loaded from files');
            return { dat, src };
        } catch (error) {
            throw new Error('Failed to load template files: ' + error.message);
        }
    }
    
    generateKukaDatFromTemplate(projectName, template) {
        const numPoints = this.splinePoints.length;
        
        // Generate FRAME positions using axis labels
        let framePositions = '';
        for (let i = 0; i < this.splinePoints.length; i++) {
            const point = this.splinePoints[i];
            
            // Use the configured axis labels
            const xAxisLabel = this.settings.xAxisLabel || 'X';
            const yAxisLabel = this.settings.yAxisLabel || 'Y';
            
            // Map canvas coordinates to KUKA coordinates based on axis labels
            let kukaX = 0.0, kukaY = 0.0, kukaZ = 0.0;
            
            // Map horizontal canvas coordinate (point.x) to KUKA axis
            if (xAxisLabel === 'X') {
                kukaX = point.x;
            } else if (xAxisLabel === 'Y') {
                kukaY = point.x;
            } else if (xAxisLabel === 'Z') {
                kukaZ = point.x;
            }
            
            // Map vertical canvas coordinate (point.y) to KUKA axis
            if (yAxisLabel === 'X') {
                kukaX = point.y;
            } else if (yAxisLabel === 'Y') {
                kukaY = point.y;
            } else if (yAxisLabel === 'Z') {
                kukaZ = point.y;
            }
            
            framePositions += `pSpl[${i + 1}]={X ${kukaX.toFixed(1)},Y ${kukaY.toFixed(1)},Z ${kukaZ.toFixed(1)},A 0.0,B 0.0,C 0.0}\n`;
        }
        
        // Generate MOVE positions (all zeros)
        let movePositions = '';
        for (let i = 0; i < this.splinePoints.length; i++) {
            movePositions += `pMove[${i + 1}]={X 0.0,Y 0.0,Z 0.0,A 0.0,B 0.0,C 0.0,S 0,T 0,E1 0.0,E2 0.0,E3 0.0,E4 0.0,E5 0.0,E6 0.0}\n`;
        }
        
        // Replace template variables
        return template
            .replace(/\{\{PROJECT_NAME\}\}/g, projectName)
            .replace(/\{\{NUM_POINTS\}\}/g, numPoints.toString())
            .replace(/\{\{FRAME_POSITIONS\}\}/g, framePositions.trim())
            .replace(/\{\{MOVE_POSITIONS\}\}/g, movePositions.trim());
    }
    
    generateKukaSrcFromTemplate(projectName, template) {
        const numPoints = this.splinePoints.length;
        
        // Generate spline points
        let splinePoints = '';
        for (let i = 0; i < this.splinePoints.length; i++) {
            const point = this.splinePoints[i];
            const velocity = (point.velocity || 30) / 1000; // Convert mm/s to m/s
            
            if (i === 0) {
                splinePoints += `        SPL pMove[${i + 1}] WITH $ORI_TYPE = #CONSTANT, $VEL = {CP ${velocity.toFixed(3)},ORI1 45.0000,ORI2 45.0000}\n`;
            } else {
                splinePoints += `        SPL pMove[${i + 1}] WITH $VEL = {CP ${velocity.toFixed(3)},ORI1 45.0000,ORI2 45.0000}\n`;
            }
        }
        
        // Replace template variables
        return template
            .replace(/\{\{PROJECT_NAME\}\}/g, projectName)
            .replace(/\{\{NUM_POINTS\}\}/g, numPoints.toString())
            .replace(/\{\{SPLINE_POINTS\}\}/g, splinePoints.trim());
    }
    
    generateKukaDatFile(projectName) {
        const numPoints = this.splinePoints.length;
        
        let content = `&ACCESS RVO
&REL 35
&PARAM DISKPATH = KRC:\\R1\\Program\\Support Programs
DEFDAT  ${projectName} PUBLIC

; positions from SpLine Generator
DECL FRAME pSpl[${numPoints}]
`;
        
        // Add FRAME positions
        for (let i = 0; i < this.splinePoints.length; i++) {
            const point = this.splinePoints[i];
            content += `pSpl[${i + 1}]={X ${point.x.toFixed(1)},Y ${point.y.toFixed(1)},Z 0.0,A 0.0,B 0.0,C 0.0}\n`;
        }
        
        content += `
; calculated points
DECL E6POS pMove[${numPoints}]
`;
        
        // Add E6POS positions with default values (all zeros)
        for (let i = 0; i < this.splinePoints.length; i++) {
            content += `pMove[${i + 1}]={X 0.0,Y 0.0,Z 0.0,A 0.0,B 0.0,C 0.0,S 0,T 0,E1 0.0,E2 0.0,E3 0.0,E4 0.0,E5 0.0,E6 0.0}\n`;
        }
        
        content += 'ENDDAT\n';
        
        return content;
    }
    
    generateKukaSrcFile(projectName) {
        const numPoints = this.splinePoints.length;
        
        let content = `DEF ${projectName}(lp0: IN, lTool: IN, lBase: IN)
    E6POS lp0
    FRAME lTool, lBase
    INT liIdx
    
    ; Calculate positions relative to base
    FOR liIdx = 1 TO ${numPoints}
        pMove[liIdx] = pToolOffset(lp0, pSpl[liIdx].X, pSpl[liIdx].Y, pSpl[liIdx].Z, 0, 0, 0)
    ENDFOR
    
    $TOOL=lTool
    $BASE=lBase
    
    SPLINE
`;
        
        // Add spline points
        for (let i = 0; i < this.splinePoints.length; i++) {
            const point = this.splinePoints[i];
            const velocity = (point.velocity || 30) / 1000; // Convert mm/s to m/s
            
            if (i === 0) {
                content += `        SPL pMove[${i + 1}] WITH $ORI_TYPE = #CONSTANT, $VEL = {CP ${velocity.toFixed(3)},ORI1 45.0000,ORI2 45.0000}\n`;
            } else {
                content += `        SPL pMove[${i + 1}] WITH $VEL = {CP ${velocity.toFixed(3)},ORI1 45.0000,ORI2 45.0000}\n`;
            }
        }
        
        content += `    ENDSPLINE
END\n`;
        
        return content;
    }
    
    downloadFile(content, fileName, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
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