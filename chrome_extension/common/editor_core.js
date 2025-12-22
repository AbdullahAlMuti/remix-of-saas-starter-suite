(() => {
    const STORAGE_KEY = 'watermarkedImages';
    const STICKER_KEY = 'userStickers';
    const THEME_STORAGE_KEY = 'snipeEditorTheme';
    const CANVAS_ID = 'editor-canvas';
    const GALLERY_ID = 'sticker-gallery';
    // Overlay ID is 'snipe-editor-root' in the new HTML
    const OVERLAY_ID = 'snipe-editor-root';

    let canvas, ctx, baseImg;
    let dragging = false, resizing = false, activeSticker = null, dragOffset = { x: 0, y: 0 };
    let isInitialized = false;
    const stickers = [];
    const MAX_STICKERS = 20;

    // Responsive & Zoom state
    let zoomLevel = 1;
    let baseCanvasWidth = 0;
    let baseCanvasHeight = 0;
    let isSidebarOpen = false;
    let resizeTimeout = null;

    // Touch/pinch state
    let lastTouchDistance = 0;
    let initialPinchZoom = 1;

    // U2Net model
    let u2Model = null;
    let modelLoading = false;
    let modelLoadError = null;

    // Tool State
    const toolState = {
        activeTool: null,
        toolSettings: {},
        selection: null,
        textObjects: [],
        shapeObjects: [],
        drawHistory: []
    };

    // ─────────────────────────────────────────────
    // 🌉 Iframe Communication Bridge
    // ─────────────────────────────────────────────
    window.addEventListener('message', async (event) => {
        // Only accept messages from our extension (trusted source)
        // We can't strictly validate origin for file:// or extension:// in all cases easily here
        // without knowing the ID, but validation via functionality is okay.

        const { type, payload } = event.data;
        if (!type) return;

        console.log('[Editor Core] Received message:', type);

        switch (type) {
            case 'INIT_IMAGE':
                await initEditor(payload.src, payload.index);
                break;
            case 'REQUEST_SAVE':
                saveEditedImage();
                break;
        }
    });

    // Notify Host we are ready
    function notifyHostReady() {
        console.log('[Editor Core] Sending EDITOR_READY');
        window.parent.postMessage({ type: 'EDITOR_READY' }, '*');
    }

    // ─────────────────────────────────────────────
    // 🚀 Initialization
    // ─────────────────────────────────────────────
    async function initEditor(src, index) {
        try {
            console.log('🎨 Initializing Editor Core with image...');

            canvas = document.getElementById(CANVAS_ID);
            if (!canvas) throw new Error('Canvas element not found in iframe');
            ctx = canvas.getContext('2d');

            // Load Image
            baseImg = await loadImage(src);

            // Reset State
            zoomLevel = 1;
            stickers.length = 0;
            activeSticker = null;
            if (typeof undoManager !== 'undefined') undoManager.clear();

            // Show the UI (Overlay is always visible in the iframe, as the iframe itself is toggled)
            // But we can ensure classes are correct.
            document.getElementById(OVERLAY_ID).style.display = 'flex';

            // Calculate initial size
            handleWindowResize();

            // Setup Config
            ctx.imageSmoothingEnabled = false;
            ctx.imageSmoothingQuality = 'high';

            // Initial Draw
            drawCanvas();

            // Initialize Dependencies
            // setupEventListeners called on load now.

            // Load stickers if gallery exists
            await loadStickers();

            updateCanvasSizeDisplay();
            await initTheme();

            // Initial State Save
            saveStateBeforeOperation('open editor');

            console.log('✅ Editor Core Initialized');
        } catch (error) {
            console.error('❌ Failed to init editor core:', error);
            showToast('Failed to load editor: ' + error.message, 'error');
        }
    }

    function loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous'; // Important for canvas export
            img.onload = () => resolve(img);
            img.onerror = (e) => reject(new Error('Failed to load image source'));
            img.src = src;
        });
    }

    // ─────────────────────────────────────────────
    // 💾 Save & Close (Overridden for Iframe)
    // ─────────────────────────────────────────────
    async function saveEditedImage() {
        try {
            console.log('💾 Saving to Host...');
            window.__SNIPE_SAVING__ = true; // Prevent internal observers if any
            drawCanvas();

            // We use PNG for quality
            const dataUrl = canvas.toDataURL('image/png');
            window.__SNIPE_SAVING__ = false;

            // Post back to host
            window.parent.postMessage({
                type: 'SAVE_IMAGE',
                payload: { dataUrl }
            }, '*');

            // Confirmed by host closing us, but we can log
            console.log('✅ Save request sent');
        } catch (e) {
            console.error('Save failed', e);
            showToast('Failed to generate image data', 'error');
        }
    }

    function closeEditor(saved = false) {
        console.log('[Editor Core] Requesting Close');
        window.parent.postMessage({
            type: 'CLOSE_EDITOR',
            payload: { saved }
        }, '*');
    }

    // ─────────────────────────────────────────────
    // 🎨 Canvas & Sticker Logic (The Core Algorithm)
    // ─────────────────────────────────────────────
    // Adapted from image_editor.js to work in this scope

    function drawCanvas() {
        if (!canvas || !ctx || !baseImg) return;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Save context
        ctx.save();

        // Scale context for zoom
        // Note: The canvas DOM size is controlled by CSS/style, but the internal resolution 
        // is set by width/height properties. 
        // In the original code, `canvas.width` was set to `baseCanvasWidth` which IS scaled by `scale`.
        // But `zoomLevel` was applied via CSS transform or style width?
        // Let's check `applyCanvasZoom`: canvas.style.width = (baseCanvasWidth * zoomLevel) + 'px';
        // So the internal resolution is `baseCanvasWidth`.

        // Draw base image
        // Draw base image
        // validation to prevent zero-size errors
        if (baseCanvasWidth > 0 && baseCanvasHeight > 0) {
            ctx.drawImage(baseImg, 0, 0, baseCanvasWidth, baseCanvasHeight);
        }

        // 🌈 Apply Pending Filters (Preview)
        if (typeof applyLiveFilters === 'function') {
            applyLiveFilters(ctx);
        }

        // Draw stickers
        stickers.forEach(sticker => {
            ctx.save();

            // Position relative to canvas size
            const x = sticker.x;
            const y = sticker.y;
            const w = sticker.w;
            const h = sticker.h;

            // Translate to center of sticker for rotation
            ctx.translate(x + w / 2, y + h / 2);
            ctx.rotate((sticker.rotation || 0) * Math.PI / 180);
            ctx.globalAlpha = sticker.opacity !== undefined ? sticker.opacity : 1.0;

            // Draw sticker image
            if (sticker.img) {
                try {
                    ctx.drawImage(sticker.img, -w / 2, -h / 2, w, h);
                } catch (e) { /* ignore drawing errors for deleted images */ }
            }

            // Draw selection border if selected (and not saving)
            if (sticker.selected && !window.__SNIPE_SAVING__) {
                ctx.strokeStyle = '#00aaff';
                ctx.lineWidth = 2;
                ctx.strokeRect(-w / 2, -h / 2, w, h);

                // Draw resize handles
                const handleSize = 10;
                ctx.fillStyle = '#ffffff';
                ctx.strokeStyle = '#00aaff';

                // Corner handles
                const handles = [
                    { x: -w / 2, y: -h / 2 },
                    { x: w / 2, y: -h / 2 },
                    { x: w / 2, y: h / 2 },
                    { x: -w / 2, y: h / 2 }
                ];

                handles.forEach(h => {
                    ctx.beginPath();
                    // Draw centered on point
                    ctx.rect(h.x - handleSize / 2, h.y - handleSize / 2, handleSize, handleSize);
                    ctx.fill();
                    ctx.stroke();
                });
            }

            ctx.restore();
            ctx.restore();
        });

        // 🔲 Draw Crop Overlay (if active)
        if (toolState.activeTool === 'crop' && typeof editorTools !== 'undefined' && editorTools.CropTool) {
            editorTools.CropTool.drawOverlay(ctx);
        }

        // 🐞 Debug Visualization
        if (typeof debugDraw === 'function') debugDraw(ctx);

        ctx.restore();
    }

    // ─────────────────────────────────────────────
    // 🖱️ Interaction Handlers
    // ─────────────────────────────────────────────

    // 🖐️ RESIZE LOGIC
    let activeHandle = null; // 'tl', 'tr', 'bl', 'br'
    let resizeStart = { x: 0, y: 0, w: 0, h: 0 };

    function getResizeHandles(sticker) {
        const { x, y, w, h } = sticker;
        return {
            tl: { x: x, y: y },
            tr: { x: x + w, y: y },
            bl: { x: x, y: y + h },
            br: { x: x + w, y: y + h }
        };
    }

    function checkResizeHandles(x, y, sticker) {
        if (!sticker || !sticker.selected) return null;
        const handles = getResizeHandles(sticker);
        const touchRadius = 15; // Generous hit area

        for (const [key, pos] of Object.entries(handles)) {
            if (Math.abs(x - pos.x) <= touchRadius && Math.abs(y - pos.y) <= touchRadius) {
                return key;
            }
        }
        return null;
    }

    function handleMouseDown(e) {
        if (toolState.activeTool) {
            if (toolState.activeTool === 'draw') startDrawing(getEvtX(e), getEvtY(e));
            else if (toolState.activeTool === 'eraser') startErasing(getEvtX(e), getEvtY(e));
            else if (toolState.activeTool === 'shapes') startShape(getEvtX(e), getEvtY(e));
            return;
        }

        const { x, y } = getEventPos(e);
        console.log('[Mouse] Down at:', Math.round(x), Math.round(y));

        // DEBUG: Visual Feedback + Toast
        lastClickPos = { x, y };
        drawCanvas();
        // showToast(`Click: ${Math.round(x)},${Math.round(y)}`, 'info'); 
        setTimeout(() => { lastClickPos = null; drawCanvas(); }, 500);

        // 1. Check Resize Handles FIRST (Priority over move)
        if (activeSticker && activeSticker.selected) {
            const handle = checkResizeHandles(x, y, activeSticker);
            if (handle) {
                console.log('📐 Resizing handle:', handle);
                resizing = true;
                activeHandle = handle;
                resizeStart = {
                    x: x, y: y,
                    w: activeSticker.w, h: activeSticker.h,
                    sx: activeSticker.x, sy: activeSticker.y
                };
                return;
            }
        }

        // 2. Check Sticker Selection (Robust Rotation Logic)
        let clickedSticker = null;
        // Search iterate in reverse (top-most first)
        for (let i = stickers.length - 1; i >= 0; i--) {
            const s = stickers[i];
            // Use improved hit test
            if (isPointInSticker(x, y, s)) {
                clickedSticker = s;
                break;
            }
        }

        if (clickedSticker) {
            stickers.forEach(s => s.selected = false);
            clickedSticker.selected = true;
            activeSticker = clickedSticker;

            dragging = true;
            dragOffset.x = x - clickedSticker.x;
            dragOffset.y = y - clickedSticker.y;

            showPropertiesPanel();
            drawCanvas();
        } else {
            // Clicked empty space
            if (!resizing) {
                stickers.forEach(s => s.selected = false);
                activeSticker = null;
                hidePropertiesPanel();
                drawCanvas();
            }
        }
    }

    function handleMouseMove(e) {
        const { x, y } = getEventPos(e);

        // Tool delegation
        if (toolState.activeTool === 'draw') { continueDrawing(getEvtX(e), getEvtY(e)); return; }
        if (toolState.activeTool === 'eraser') { continueErasing(getEvtX(e), getEvtY(e)); return; }
        if (toolState.activeTool === 'shapes') { drawShape(getEvtX(e), getEvtY(e)); return; }

        // � RESIZING
        if (resizing && activeSticker && activeHandle) {
            const dx = x - resizeStart.x;
            const dy = y - resizeStart.y;

            // Maintain Aspect Ratio? Usually yes for stickers.
            // We'll scale based on the dominant axis change or just width
            const aspectRatio = resizeStart.w / resizeStart.h;

            let newW = resizeStart.w;
            let newH = resizeStart.h;
            let newX = resizeStart.sx;
            let newY = resizeStart.sy;

            // Simple Logic: dragging Corner BR
            if (activeHandle === 'br') {
                newW = resizeStart.w + dx;
                newH = newW / aspectRatio;
            }
            else if (activeHandle === 'bl') {
                newW = resizeStart.w - dx;
                newH = newW / aspectRatio;
                newX = resizeStart.sx + (resizeStart.w - newW);
            }
            else if (activeHandle === 'tr') {
                newW = resizeStart.w + dx;
                newH = newW / aspectRatio;
                newY = resizeStart.sy + (resizeStart.h - newH); // Move Y up as H grows
            }
            else if (activeHandle === 'tl') {
                newW = resizeStart.w - dx;
                newH = newW / aspectRatio;
                newX = resizeStart.sx + (resizeStart.w - newW);
                newY = resizeStart.sy + (resizeStart.h - newH);
            }

            // Apply min size constraint
            if (newW > 20 && newH > 20) {
                activeSticker.w = newW;
                activeSticker.h = newH;
                activeSticker.x = newX;
                activeSticker.y = newY;
                drawCanvas();
            }
            return;
        }

        // 🖱️ DRAGGING
        if (dragging && activeSticker) {
            const newX = x - dragOffset.x;
            const newY = y - dragOffset.y;

            activeSticker.x = newX;
            activeSticker.y = newY;

            drawCanvas();

            // Cursor update??
            canvas.style.cursor = 'move';
        } else {
            // HOVER STATE (Visual feedback)
            if (toolState.activeTool) {
                canvas.style.cursor = 'crosshair';
                return;
            }

            const handle = checkResizeHandles(x, y, activeSticker);
            if (handle) {
                canvas.style.cursor = (handle === 'tl' || handle === 'br') ? 'nwse-resize' : 'nesw-resize';
            } else {
                // Check if over sticker
                let overSticker = stickers.some(s => x >= s.x && x <= s.x + s.w && y >= s.y && y <= s.y + s.h);
                canvas.style.cursor = overSticker ? 'move' : 'default';
            }
        }
    }

    function handleMouseUp(e) {
        // Tool delegation
        if (toolState.activeTool === 'draw') { stopDrawing(); return; }
        if (toolState.activeTool === 'eraser') { stopErasing(); return; }
        if (toolState.activeTool === 'shapes') { finishShape(getEvtX(e), getEvtY(e)); return; }

        if (dragging) {
            dragging = false;
            canvas.style.cursor = 'default';
            saveStateBeforeOperation('move sticker');
        }
        if (resizing) {
            resizing = false;
            activeHandle = null;
            saveStateBeforeOperation('resize sticker');
        }
    }

    // Helpers for coordinates
    function setupEventListeners() {
        console.log('🔌 Connecting UI Event Listeners...');

        // Tools
        document.getElementById('btn-tool-crop')?.addEventListener('click', handleCropTool);
        document.getElementById('btn-tool-rotate')?.addEventListener('click', handleRotate);
        document.getElementById('btn-tool-flip-h')?.addEventListener('click', handleFlipHorizontal);
        document.getElementById('btn-tool-flip-v')?.addEventListener('click', handleFlipVertical);

        document.getElementById('btn-tool-draw')?.addEventListener('click', () => activateTool('draw'));
        document.getElementById('btn-tool-eraser')?.addEventListener('click', () => activateTool('eraser'));
        document.getElementById('btn-tool-text')?.addEventListener('click', () => activateTool('text'));
        document.getElementById('btn-tool-shapes')?.addEventListener('click', () => activateTool('shapes'));
        document.getElementById('btn-tool-filters')?.addEventListener('click', () => activateTool('filters'));
        document.getElementById('btn-tool-blur')?.addEventListener('click', () => activateTool('blur'));
        document.getElementById('btn-tool-color')?.addEventListener('click', () => activateTool('color'));

        document.getElementById('btn-duplicate')?.addEventListener('click', duplicateSticker);

        // Canvas
        const canvasEl = document.getElementById(CANVAS_ID);
        if (canvasEl) {
            canvasEl.addEventListener('mousedown', handleMouseDown);
            canvasEl.style.touchAction = 'none'; // CRITICAL: Prevent scrolling while dragging
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);

            canvasEl.addEventListener('touchstart', (e) => { e.preventDefault(); handleMouseDown(e); }, { passive: false });
            canvasEl.addEventListener('touchmove', (e) => { e.preventDefault(); handleMouseMove(e); }, { passive: false });
            canvasEl.addEventListener('touchend', (e) => handleMouseUp(e));
        }

        // Scale/Zoom
        document.getElementById('btn-zoom-in')?.addEventListener('click', () => {
            if (zoomLevel < 3) zoomLevel += 0.1; applyCanvasZoom();
        });
        document.getElementById('btn-zoom-out')?.addEventListener('click', () => {
            if (zoomLevel > 0.2) zoomLevel -= 0.1; applyCanvasZoom();
        });
        document.getElementById('btn-reset')?.addEventListener('click', () => {
            zoomLevel = 1; applyCanvasZoom();
        });

        // Actions
        document.getElementById('btn-save-edit')?.addEventListener('click', saveEditedImage);
        document.getElementById('btn-cancel-edit')?.addEventListener('click', () => closeEditor(false));

        // Sticker Actions
        document.getElementById('sticker-upload')?.addEventListener('change', handleStickerUpload);
        document.getElementById('btn-clear-all')?.addEventListener('click', clearAllStickers);

        // Undo/Redo
        document.getElementById('btn-undo')?.addEventListener('click', () => {
            if (undoManager) undoManager.undo(canvas, ctx, stickers, drawCanvas);
        });
        document.getElementById('btn-redo')?.addEventListener('click', () => {
            if (undoManager) undoManager.redo(canvas, ctx, stickers, drawCanvas);
        });

        // Wire up the Property Panel buttons
        document.getElementById('btn-text-add')?.addEventListener('click', handleAddText);
        document.getElementById('btn-crop-apply')?.addEventListener('click', applyCrop);
        document.getElementById('btn-crop-cancel')?.addEventListener('click', () => deactivateTool('crop'));

        document.getElementById('crop-aspect-ratio')?.addEventListener('change', () => {
            if (toolState.activeTool === 'crop') handleCropTool();
        });

        // Initialize Filter/Export Listeners
        if (typeof bindFilterEvents === 'function') bindFilterEvents();
        if (typeof bindAIEvents === 'function') bindAIEvents();
    }

    function getEventPos(e) {
        const rect = canvas.getBoundingClientRect();

        // 🎯 UNIFIED COORDINATE SYSTEM
        // Map screen pixels -> canvas internal pixels
        // This handles CSS Zoom, Device Pixel Ratio, and Canvas Scaling automatically
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        let clientX = e.clientX;
        let clientY = e.clientY;

        if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        }

        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    }


    // Alternative helpers for tools (using same logic)
    function getEvtX(e) { return getEventPos(e).x; }
    function getEvtY(e) { return getEventPos(e).y; }


    // ─────────────────────────────────────────────
    // 🧩 Load Stickers
    // ─────────────────────────────────────────────
    async function loadStickers() {
        const gallery = document.getElementById(GALLERY_ID);
        if (!gallery) return;

        gallery.innerHTML = '<div class="loading">Loading...</div>';

        // Default stickers (placeholder list for now, or fetch from extension)
        // The previous code had a list. I'll include a basic list or allow upload.
        // NOTE: In strict isolation, we can't access `chrome.runtime.getURL` if we are not a web-accessible resource? 
        // Actually, `editor_frame.html` IS an extension page (or web accessible), so it refers to extension origin.
        // `chrome.runtime.getURL` works perfectly.

        const defaultStickers = [
            'assets/stickers/sale.png',
            'assets/stickers/new.png',
            'assets/stickers/best-seller.png',
            'assets/stickers/exclusive.png'
        ];

        gallery.innerHTML = '';

        defaultStickers.forEach(src => {
            const div = document.createElement('div');
            div.className = 'sticker-item';
            div.innerHTML = `<img src="${src}" alt="Sticker" draggable="false">`;
            div.onclick = () => addSticker(src);
            gallery.appendChild(div);
        });

        // Add visual confirming toast for debug
        showToast('Stickers Loaded', 'info');
    }

    function handleStickerUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            addSticker(event.target.result);
        };
        reader.readAsDataURL(file);
        e.target.value = ''; // Reset
    }

    // ─────────────────────────────────────────────
    // 🧱 Hit Testing Helpers
    // ─────────────────────────────────────────────

    // Check if point (px, py) is inside rotated rectangle
    function isPointInSticker(px, py, s) {
        // Translate point to rectangle local space
        const cx = s.x + s.w / 2;
        const cy = s.y + s.h / 2;

        // Rotate point by -rotation around center
        const rad = -(s.rotation || 0) * Math.PI / 180;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);

        const dx = px - cx;
        const dy = py - cy;

        // rotated dx/dy
        const rdx = dx * cos - dy * sin;
        const rdy = dx * sin + dy * cos;

        const halfW = s.w / 2;
        const halfH = s.h / 2;

        return Math.abs(rdx) <= halfW && Math.abs(rdy) <= halfH;
    }

    async function addSticker(src) {
        if (stickers.length >= MAX_STICKERS) {
            alert('Max stickers reached');
            return;
        }

        try {
            const img = await loadImage(src);

            // 📏 CORRECT SCALING STRATEGY
            // 1. Determine target size relative to CANVAS, not image natural size
            // 2. Default to 25% of the shortest canvas dimension for initial size
            const canvasMinDim = Math.min(canvas.width, canvas.height);
            const targetSize = canvasMinDim * 0.25;

            // 3. Calculate aspect ratio
            const aspect = img.width / img.height;

            let w, h;
            if (aspect >= 1) {
                w = targetSize;
                h = targetSize / aspect;
            } else {
                h = targetSize;
                w = targetSize * aspect;
            }

            const sticker = {
                img: img,
                imgSrc: src,
                // Center the sticker
                x: (canvas.width - w) / 2,
                y: (canvas.height - h) / 2,
                w: w,
                h: h,
                rotation: 0,
                opacity: 1,
                selected: true
            };

            // Force switch to Select Mode (disable tools)
            deactivateTool(toolState.activeTool);

            // Deselect others
            stickers.forEach(s => s.selected = false);

            stickers.push(sticker);
            activeSticker = sticker;

            drawCanvas();
            saveStateBeforeOperation('add sticker');
            updateStickerCount();
            showPropertiesPanel();

        } catch (e) {
            console.error('Failed to add sticker', e);
        }
    }

    // DEBUG: Visualize hits
    let lastClickPos = null;
    function debugDraw(ctx) {
        if (lastClickPos) {
            ctx.save();
            ctx.fillStyle = 'red';
            ctx.beginPath();
            ctx.arc(lastClickPos.x, lastClickPos.y, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    function deleteSticker(sticker) {
        const idx = stickers.indexOf(sticker);
        if (idx > -1) {
            stickers.splice(idx, 1);
            if (activeSticker === sticker) activeSticker = null;
            drawCanvas();
            updateStickerCount();
            hidePropertiesPanel();
        }
    }

    function clearAllStickers() {
        if (confirm('Clear all stickers?')) {
            stickers.length = 0;
            activeSticker = null;
            drawCanvas();
            updateStickerCount();
            hidePropertiesPanel();
        }
    }

    // ─────────────────────────────────────────────
    // 🛠️ Tools (Draw, Crop, etc) - Wrapper
    // ─────────────────────────────────────────────
    // These rely on editor-tools.js being loaded.

    function activateTool(name) {
        toolState.activeTool = name;

        // Visual update
        document.querySelectorAll('.btn-tool').forEach(b => b.classList.remove('active'));
        const btn = document.getElementById(`btn-tool-${name}`);
        if (btn) btn.classList.add('active');

        // Show properties
        document.querySelectorAll('.tool-property-panel').forEach(p => p.style.display = 'none');
        const panel = document.getElementById(`properties-${name}`);
        if (panel) panel.style.display = 'block';

        // Hide sidebar if needed? No, keep it open for properties.
    }

    function deactivateTool(name) {
        if (toolState.activeTool === name) {
            toolState.activeTool = null;
            document.querySelectorAll('.btn-tool').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tool-property-panel').forEach(p => p.style.display = 'none');
        }
    }

    // ─────────────────────────────────────────────
    // 📸 State Management
    // ─────────────────────────────────────────────
    function saveStateBeforeOperation(opName) {
        if (typeof undoManager !== 'undefined') {
            undoManager.saveState(canvas, stickers, opName);
        }
    }

    // ─────────────────────────────────────────────
    // 📐 Layout
    // ─────────────────────────────────────────────
    function handleWindowResize() {
        if (resizeTimeout) clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            if (!baseImg || !canvas) return;

            const availableSpace = calculateAvailableSpace();
            const scale = Math.min(availableSpace.width / baseImg.width, availableSpace.height / baseImg.height);

            baseCanvasWidth = baseImg.width * scale;
            baseCanvasHeight = baseImg.height * scale;

            canvas.width = baseCanvasWidth;
            canvas.height = baseCanvasHeight;

            applyCanvasZoom();
            drawCanvas();
            updateCanvasSizeDisplay();
        }, 200);
    }

    function calculateAvailableSpace() {
        // We are in the iframe, so window.innerWidth IS the editor size.
        // Sidebar is fixed on left.
        const sidebarWidth = 280; // Standard
        const headerHeight = 60;
        const footerHeight = 60;
        const padding = 40;

        // TODO: Verify if sidebar is hidden/collapsed
        const effectiveSidebar = isSidebarOpen ? 0 : sidebarWidth;
        // Oops, logic inverse? Sidebar usually open on desktop.

        return {
            width: window.innerWidth - sidebarWidth - padding,
            height: window.innerHeight - headerHeight - footerHeight - padding
        };
    }

    function applyCanvasZoom() {
        if (!canvas) return;
        // Actually, we usually scale via CSS transform or Width
        // The existing code did: canvas.style.width = ...
        // Let's keep it simple
        canvas.style.width = (baseCanvasWidth * zoomLevel) + 'px';
        canvas.style.height = (baseCanvasHeight * zoomLevel) + 'px';

        const disp = document.getElementById('zoom-level');
        if (disp) disp.textContent = Math.round(zoomLevel * 100) + '%';
    }

    // ─────────────────────────────────────────────
    // 🎬 Setup Event Listeners (The Big One)
    // ─────────────────────────────────────────────
    // ─────────────────────────────────────────────
    // 🛠️ Tool Controllers (Missing Implementations)
    // ─────────────────────────────────────────────

    // ✏️ Draw Tool
    function startDrawing(x, y) {
        if (!editorTools.DrawTool) return;
        const color = document.getElementById('draw-color')?.value || '#000000';
        const size = document.getElementById('draw-brush-size')?.value || 5;
        const opacity = (document.getElementById('draw-opacity')?.value || 100) / 100;

        editorTools.DrawTool.init({ color, brushSize: parseInt(size), opacity });
        editorTools.DrawTool.startDrawing(ctx, x, y);

        // Save state for undo? Drawing is continuous, save at start or end?
        // Usually save at end.
    }

    function continueDrawing(x, y) {
        if (!editorTools.DrawTool) return;
        editorTools.DrawTool.draw(ctx, x, y);
    }

    function stopDrawing() {
        if (editorTools.DrawTool) {
            editorTools.DrawTool.stopDrawing();
            saveStateBeforeOperation('draw');
        }
    }

    // 🧹 Eraser Tool
    function startErasing(x, y) {
        if (!editorTools.EraserTool) return;
        const size = document.getElementById('eraser-size')?.value || 20;
        editorTools.EraserTool.init(parseInt(size));
        editorTools.EraserTool.startErasing(ctx, x, y);
    }

    function continueErasing(x, y) {
        if (!editorTools.EraserTool) return;
        editorTools.EraserTool.erase(ctx, x, y);
    }

    function stopErasing() {
        if (editorTools.EraserTool) {
            editorTools.EraserTool.stopErasing();
            saveStateBeforeOperation('erase');
        }
    }

    // ⬜ Shapes Tool
    let shapeStart = null;
    function startShape(x, y) {
        shapeStart = { x, y };
    }

    function drawShape(x, y) {
        if (!shapeStart || !editorTools.ShapesTool) return;

        // Redraw canvas to clear previous preview
        drawCanvas();

        const type = document.getElementById('shape-type')?.value || 'rectangle';
        const color = document.getElementById('shape-color')?.value || '#000000';
        const filled = document.getElementById('shape-filled')?.checked || false;

        const w = x - shapeStart.x;
        const h = y - shapeStart.y;

        ctx.save();
        switch (type) {
            case 'rectangle':
                editorTools.ShapesTool.drawRectangle(ctx, shapeStart.x, shapeStart.y, w, h, color, filled);
                break;
            case 'circle':
                const radius = Math.sqrt(w * w + h * h);
                editorTools.ShapesTool.drawCircle(ctx, shapeStart.x, shapeStart.y, radius, color, filled);
                break;
            case 'arrow':
                editorTools.ShapesTool.drawArrow(ctx, shapeStart.x, shapeStart.y, x, y, color);
                break;
            case 'line':
                // Simple line
                ctx.strokeStyle = color;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(shapeStart.x, shapeStart.y);
                ctx.lineTo(x, y);
                ctx.stroke();
                break;
        }
        ctx.restore();
    }

    function finishShape(x, y) {
        if (shapeStart) {
            // Final draw is already done by last mousemove, or we do one last time?
            // drawShape called drawCanvas() which clears. So we validly drew on top.
            // But if we just mouseup, we should ensure it's "baked".
            // Actually `drawCanvas` redraws base image + stickers. 
            // The function `drawShape` draws DIRECTLY on ctx on top of that. 
            // So to persist, we probably need to "bake" it into baseImg or add as a sticker/layer.
            // Current code architecture seems to draw on the single canvas over baseImg.
            // If `drawCanvas` is called again (e.g. by sticker move), this shape will be LOST 
            // unless we update `baseImg` with the current canvas content!

            bakeCanvasToBase();
            shapeStart = null;
            saveStateBeforeOperation('add shape');
        }
    }

    // 📝 Text Tool (Click to add)
    // Handled by `activateTool('text')` which matches `handleCropTool` pattern or separate logic?
    // In `setupEventListeners`: click event on btn-text calls `activateTool('text')`.
    // Then `setupEventListeners` also has `btn-text-add` inside properties panel?
    // Let's check HTML. Yes, `btn-text-add`.

    // We need to implement the Add Function
    function handleAddText() {
        if (!editorTools.TextTool) return;
        const text = document.getElementById('text-input')?.value;
        if (!text) return;

        const font = document.getElementById('text-font')?.value || 'Arial';
        const size = parseInt(document.getElementById('text-size')?.value || 32);
        const color = document.getElementById('text-color')?.value || '#000000';
        const bold = document.getElementById('text-bold')?.checked;
        const italic = document.getElementById('text-italic')?.checked;

        editorTools.TextTool.init({ font, size, color, bold, italic });

        // Add to center of canvas
        editorTools.TextTool.addText(ctx, text, canvas.width / 2, canvas.height / 2);

        // Bake it?
        bakeCanvasToBase();
        saveStateBeforeOperation('add text');
    }


    // 🔄 Helper to Bake Changes into Base Image
    // (Crucial for Draw/Eraser/Shapes/Text so they persist when stickers move)
    function bakeCanvasToBase() {
        if (!canvas) return;
        const newImg = new Image();
        newImg.onload = () => {
            baseImg = newImg;
            // Native width/height must match logic
            // If we resized canvas, baseImg should adopt?
            // For now, assume canvas size = baseImg scaled default. 
            // Re-assigning baseImg works for "flattening".
        };
        newImg.src = canvas.toDataURL();
    }


    // ─────────────────────────────────────────────
    // 🔄 Transform Logic (Rotate/Flip)
    // ─────────────────────────────────────────────
    async function handleRotate() {
        if (!editorTools.RotateTool) return;

        try {
            // Rotate 90 degrees clockwise
            const newImg = await editorTools.RotateTool.rotate(canvas, baseImg, 90);
            baseImg = newImg;

            // Adjust canvas size to match new dimensions
            handleWindowResize();
            saveStateBeforeOperation('rotate');
        } catch (e) {
            console.error('Rotate failed', e);
        }
    }

    async function handleFlipHorizontal() {
        if (!editorTools.RotateTool) return;
        try {
            const newImg = await editorTools.RotateTool.flipHorizontal(canvas, baseImg);
            baseImg = newImg;
            drawCanvas();
            saveStateBeforeOperation('flip horizontal');
        } catch (e) {
            console.error('Flip H failed', e);
        }
    }

    async function handleFlipVertical() {
        if (!editorTools.RotateTool) return;
        try {
            const newImg = await editorTools.RotateTool.flipVertical(canvas, baseImg);
            baseImg = newImg;
            drawCanvas();
            saveStateBeforeOperation('flip vertical');
        } catch (e) {
            console.error('Flip V failed', e);
        }
    }


    // ─────────────────────────────────────────────
    // 📋 Sticker Logic (Duplicate)
    // ─────────────────────────────────────────────
    function duplicateSticker() {
        if (!activeSticker) return;

        const newSticker = { ...activeSticker };
        // Offset slightly so it's visible
        newSticker.x += 20;
        newSticker.y += 20;
        // Ensure unique reference if deep clone needed? 
        // Image object uses same ref, which is fine.

        stickers.push(newSticker);
        activeSticker = newSticker;

        // Deselect others
        stickers.forEach(s => { if (s !== newSticker) s.selected = false; });

        drawCanvas();
        saveStateBeforeOperation('duplicate sticker');
        updateStickerCount();
    }


    // ─────────────────────────────────────────────
    // 🎨 Filter Logic
    // ─────────────────────────────────────────────

    // Track current filter values for live preview
    const filterState = {
        brightness: 0,
        contrast: 0,
        saturation: 0,
        blur: 0,
        sharpen: 0
    };

    function updateFilterState(key, value) {
        filterState[key] = parseInt(value);
        drawCanvas();
    }

    // Apply live filters to the context (called inside drawCanvas)
    function applyLiveFilters(context) {
        if (!editorTools.FiltersTool) return;

        // Apply in order
        if (filterState.brightness !== 0) editorTools.FiltersTool.brightness(context, canvas, filterState.brightness);
        if (filterState.contrast !== 0) editorTools.FiltersTool.contrast(context, canvas, filterState.contrast);
        if (filterState.saturation !== 0) editorTools.FiltersTool.saturation(context, canvas, filterState.saturation);
        // Note: Blur/Sharpen might need their own tool methods if they involve convolution
        // Ignoring blur/sharpen for now as they weren't fully in FiltersTool we reviewed, 
        // essentially I saw brightness/contrast/sat/grayscale/sepia.
    }

    async function applyFiltersToImage() {
        // Baking logic:
        // We need to commit the current visual state of the Base Image (with filters) to a new Base Image.
        // We can't just take the whole canvas because that includes stickers.
        // So we draw ONLY global image + filters to a temp canvas, then export that as new baseImg.

        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tCtx = tempCanvas.getContext('2d');

        // Draw current base
        tCtx.drawImage(baseImg, 0, 0, canvas.width, canvas.height); // Scaled? 
        // Wait, baseImg might be large, canvas small. 
        // Ideally we apply filters to full res image.
        // But `editorTools` uses `getImageData` from the passed canvas.
        // For simplicity/performance in this UI-focused extension, modifying the displayed resolution is acceptable 
        // OR we temporarily resize tempCanvas to match baseImg?
        // editorTools operates on the canvas context given.

        // Let's stick to canvas resolution for the "Preview".
        // But for final "Apply", we probably want to apply to full res.
        // This is complex for pixel manipulation in JS on large images.
        // Let's just bake what is seen (canvas resolution) which effectively resamples.
        // User is doing quick edits for eBay.

        applyLiveFilters(tCtx);

        const newImg = new Image();
        newImg.onload = () => {
            baseImg = newImg;
            // Reset sliders
            resetFilterControls();
            drawCanvas();
            saveStateBeforeOperation('apply filters');
        };
        newImg.src = tempCanvas.toDataURL();
    }

    function resetFilterControls() {
        filterState.brightness = 0;
        filterState.contrast = 0;
        filterState.saturation = 0;

        document.getElementById('filter-brightness').value = 0;
        document.getElementById('filter-contrast').value = 0;
        document.getElementById('filter-saturation').value = 0;

        document.getElementById('filter-brightness-value').textContent = '0';
        document.getElementById('filter-contrast-value').textContent = '0';
        document.getElementById('filter-saturation-value').textContent = '0';
    }

    // ─────────────────────────────────────────────
    // 📤 Export Logic
    // ─────────────────────────────────────────────
    function handleExport() {
        const format = document.getElementById('export-format')?.value || 'png';
        if (editorTools.ExportTool) {
            editorTools.ExportTool.download(canvas, 'edited-image', format, 0.9);
        }
    }

    async function handleCopyToClipboard() {
        if (editorTools.ExportTool) {
            const success = await editorTools.ExportTool.copyToClipboard(canvas);
            showToast(success ? 'Copied to clipboard!' : 'Failed to copy', success ? 'success' : 'error');
        }
    }

    // ─────────────────────────────────────────────
    // 🤖 AI Tools Logic (Stubs/Simulation)
    // ─────────────────────────────────────────────

    function handleAutoEnhance() {
        showToast('🪄 Auto Enhancing...', 'info');
        // Simulate enhancement by applying general contrast/saturation boost
        updateFilterState('contrast', 20);
        updateFilterState('saturation', 20);
        updateFilterState('brightness', 5);

        applyFiltersToImage(); // Commit
    }

    function handleAIStub(featureName) {
        if (typeof u2Model === 'undefined' || !u2Model) {
            showToast(`⚠️ ${featureName} requires AI Model (not loaded)`, 'warning');
            // In a real scenario, we'd trigger a model load here
            return;
        }
        showToast(`Running ${featureName}...`, 'info');
    }

    function deleteActiveSticker() {
        if (activeSticker) {
            deleteSticker(activeSticker);
        }
    }


    // ─────────────────────────────────────────────
    // 🎬 Additional Event Bindings (AI & Sticker Delete)
    // ─────────────────────────────────────────────
    function bindAIEvents() {
        document.getElementById('btn-auto-enhance')?.addEventListener('click', handleAutoEnhance);
        document.getElementById('btn-clean-bg')?.addEventListener('click', () => handleAIStub('Clean Background'));
        document.getElementById('btn-remove-bg-local')?.addEventListener('click', () => handleAIStub('Remove Background'));
        document.getElementById('btn-upscale')?.addEventListener('click', () => handleAIStub('Upscale'));

        document.getElementById('btn-delete-sticker')?.addEventListener('click', deleteActiveSticker);
    }



    // ✂️ Crop Tool Logic
    function handleCropTool() {
        activateTool('crop');
        // Initialize crop overlay
        if (editorTools.CropTool) {
            const aspect = document.getElementById('crop-aspect-ratio')?.value || 'custom';
            editorTools.CropTool.init(canvas, aspect);
            drawCanvas();
        }
    }

    // We need to modify `drawCanvas` to support crop overlay
    // Or we just add a hack here.
    const originalDrawCanvas = drawCanvas;
    // Overwriting drawCanvas locally or referencing it? 
    // `drawCanvas` is defined above. We can just add check inside it if we could edit it.
    // Instead, let's inject a hook or use `requestAnimationFrame` loop?
    // Simpler: Update `drawCanvas` implementation above? I am replacing lines 597+ so I can't effectively change lines 173 easily without a second call.
    // I can redefine `drawCanvas` here since `var/function` hoisting or just reassignment if it was let/var (it's function declaration).
    // Actually, function declarations are hoisted. 
    // Let's rely on the fact that `drawCanvas` delegates to `editorTools.CropTool.drawOverlay(ctx)` if active?
    // No, `drawCanvas` above doesn't know about it.

    // HACK: We will hook into `toolState.activeTool === 'crop'` inside `drawCanvas`.
    // But `drawCanvas` is up there.
    // I will rewrite `drawCanvas` entirely in a separate `replace_file_content` call if needed.
    // For now, let's implement `applyCrop`.

    async function applyCrop() {
        if (!editorTools.CropTool) return;
        const newImg = await editorTools.CropTool.apply(canvas, baseImg);
        baseImg = newImg;
        // Reset
        deactivateTool('crop');
        handleWindowResize(); // Recalc size
        saveStateBeforeOperation('crop');
    }


    // ─────────────────────────────────────────────
    // 🧩 Load Stickers (Fixed Path)
    // ─────────────────────────────────────────────
    async function loadStickers() {
        const gallery = document.getElementById(GALLERY_ID);
        if (!gallery) return;

        gallery.innerHTML = '<div class="loading">Loading...</div>';

        // Corrected Paths for Extension
        const defaultStickers = [
            '../assets/stickers/sale.png',
            '../assets/stickers/new.png',
            '../assets/stickers/best-seller.png',
            '../assets/stickers/top-rated.png',
            '../assets/stickers/free-shipping.png',
            '../assets/stickers/limited-time.png'
        ];

        gallery.innerHTML = '';

        // Create Sticker Elements
        defaultStickers.forEach(src => {
            const div = document.createElement('div');
            div.className = 'sticker-item';
            div.onclick = () => addSticker(src);

            const img = document.createElement('img');
            img.src = src;
            img.alt = 'Sticker';

            div.appendChild(img);
            gallery.appendChild(div);
        });

        // Ensure upload button works
        const uploadInput = document.getElementById('sticker-upload');
        if (uploadInput) uploadInput.addEventListener('change', handleStickerUpload);
    }

    // ─────────────────────────────────────────────
    // 🎬 Additional Event Bindings
    // ─────────────────────────────────────────────
    // Wire up the Property Panel buttons
    document.getElementById('btn-text-add')?.addEventListener('click', handleAddText);
    document.getElementById('btn-crop-apply')?.addEventListener('click', applyCrop);
    document.getElementById('btn-crop-cancel')?.addEventListener('click', () => deactivateTool('crop'));

    document.getElementById('crop-aspect-ratio')?.addEventListener('change', () => {
        if (toolState.activeTool === 'crop') handleCropTool(); // Re-init
    });


    // Initialize on load
    setupEventListeners();
    notifyHostReady();

})();
