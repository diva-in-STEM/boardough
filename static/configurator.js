// Card type configurations - easy to modify and extend
const CARD_TYPES = {
    title: {
        title: 'Title Widget',
        description: 'Add a large heading to your dashboard',
        icon: 'fa-heading',
        span: 'col-span-full',
        showHeader: false,
        hoverColor: 'blue',
        defaultSize: { cols: 4, rows: 1 },
        content: {
            type: 'editable',
            placeholder: 'Click to edit title...',
            classes: 'text-3xl font-bold text-gray-900 dark:text-white text-center py-4',
            defaultText: 'Dashboard Title'
        }
    },
    chart: {
        title: 'Chart Widget',
        description: 'Add interactive charts to your dashboard',
        icon: 'fa-chart-line',
        span: 'col-span-1',
        showHeader: true,
        hoverColor: 'blue',
        defaultSize: { cols: 1, rows: 1 },
        content: {
            type: 'placeholder',
            html: `
                <div class="py-8 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center">
                    <i class="fas fa-chart-line text-4xl text-gray-400"></i>
                </div>
                <div class="mt-3 text-xs text-gray-500 dark:text-gray-400 text-center">Chart visualization will appear here</div>
            `
        }
    },
    stats: {
        title: 'Statistics',
        description: 'Display key metrics and statistics',
        icon: 'fa-chart-bar',
        span: 'col-span-1',
        showHeader: true,
        hoverColor: 'green',
        defaultSize: { cols: 1, rows: 1 },
        content: {
            type: 'stats',
            stats: [
                { value: '1,234', label: 'Total Users', color: 'blue' },
                { value: '89%', label: 'Success Rate', color: 'green' }
            ]
        }
    },
    table: {
        title: 'Data Table',
        description: 'Show data in a structured table format',
        icon: 'fa-table',
        span: 'col-span-1',
        showHeader: true,
        hoverColor: 'purple',
        defaultSize: { cols: 2, rows: 1 },
        content: {
            type: 'table',
            headers: ['Name', 'Value'],
            rows: [
                ['Item 1', '100'],
                ['Item 2', '200']
            ]
        }
    },
    notes: {
        title: 'Notes',
        description: 'Add text notes and reminders',
        icon: 'fa-sticky-note',
        span: 'col-span-1',
        showHeader: true,
        hoverColor: 'yellow',
        defaultSize: { cols: 1, rows: 2 },
        content: {
            type: 'editable',
            placeholder: 'Click to add your notes...',
            classes: 'bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded p-3 text-sm text-gray-700 dark:text-gray-300 min-h-[100px] resize-none',
            defaultText: 'Sample note content...'
        }
    },
    weather: {
        title: 'Weather',
        description: 'Show current weather conditions',
        icon: 'fa-cloud-sun',
        span: 'col-span-1',
        showHeader: true,
        hoverColor: 'indigo',
        defaultSize: { cols: 1, rows: 1 },
        content: {
            type: 'weather',
            temperature: '22°C',
            condition: 'Sunny',
            icon: 'fa-sun',
            iconColor: 'text-yellow-500'
        }
    }
};

// Grid settings
const MAX_COLUMNS = 4;
let resizeState = { isResizing: false, currentCard: null, startX: 0, startCols: 0 };

// Reference to the grid container
const grid = document.getElementById('card-grid');

document.addEventListener('DOMContentLoaded', () => {
  generateComponentLibrary();
  initializeDragAndDrop();
  initThemeToggle();
  // Initialize resize for any existing cards
  document.querySelectorAll('.resizable-card').forEach(card => initializeCardResize(card));
});

// Create resize handles (only horizontal)
function createResizeHandles() {
  const resizeHandles = document.createElement('div');
  resizeHandles.className = 'resize-handles opacity-0 group-hover:opacity-100 transition-opacity duration-200';
  resizeHandles.innerHTML = `
    <div class="resize-handle resize-handle-right" data-resize-type="width"></div>
  `;
  return resizeHandles;
}

// Attach resize handlers to a card
function initializeCardResize(card) {
  const handles = card.querySelectorAll('.resize-handle');
  handles.forEach(handle => {
    if (handle.dataset.resizeType === 'width') {
      handle.addEventListener('mousedown', e => startResize(e, card));
    }
  });
}

// Start horizontal resize
function startResize(e, card) {
  e.preventDefault();
  e.stopPropagation();
  resizeState = {
    isResizing: true,
    currentCard: card,
    startX: e.clientX,
    startCols: parseInt(card.dataset.cols, 10) || 1
  };
  document.addEventListener('mousemove', handleResize);
  document.addEventListener('mouseup', endResize);
}

// Handle horizontal resize movement
function handleResize(e) {
  if (!resizeState.isResizing) return;
  const { startX, startCols, currentCard } = resizeState;
  const deltaX = e.clientX - startX;
  const colWidth = grid.offsetWidth / MAX_COLUMNS;
  const newCols = Math.min(MAX_COLUMNS, Math.max(1, startCols + Math.round(deltaX / colWidth)));
  if (newCols !== startCols) {
    currentCard.dataset.cols = newCols;
    currentCard.style.gridColumnEnd = `span ${newCols}`;
  }
}

// End horizontal resize
function endResize() {
  document.removeEventListener('mousemove', handleResize);
  document.removeEventListener('mouseup', endResize);
  resizeState.isResizing = false;
}

// Create a new card (horizontal resizing only)
function createCard(type) {
  const config = CARD_TYPES[type];
  if (!config) return;
  const cols = config.defaultSize.cols;
  const card = document.createElement('div');
  card.className = 'resizable-card relative group';
  card.dataset.cardType = type;
  card.dataset.cols = cols;
  card.style.gridColumnEnd = `span ${cols}`;

  // Add content (not shown) and horizontal resize handle
  const handles = createResizeHandles();
  card.appendChild(handles);
  initializeCardResize(card);
  grid.appendChild(card);
}


// Content renderers for different card types
const CONTENT_RENDERERS = {
    placeholder: (config) => config.html,
    
    editable: (config) => `
        <div contenteditable="true" 
             class="${config.classes}" 
             data-placeholder="${config.placeholder}"
             onclick="handleEditableClick(this)"
             onblur="handleEditableBlur(this)"
             onkeydown="handleEditableKeydown(event)">${config.defaultText}</div>
    `,
    
    stats: (config) => {
        const statsHtml = config.stats.map(stat => `
            <div class="text-center py-2">
                <div class="text-2xl font-bold text-${stat.color}-600 dark:text-${stat.color}-400">${stat.value}</div>
                <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">${stat.label}</div>
            </div>
        `).join('');
        return `<div class="grid grid-cols-${config.stats.length} gap-4">${statsHtml}</div>`;
    },
    
    table: (config) => {
        const headersHtml = config.headers.map(header => `<th class="px-2 py-1 text-left">${header}</th>`).join('');
        const rowsHtml = config.rows.map(row => 
            `<tr>${row.map(cell => `<td class="px-2 py-1">${cell}</td>`).join('')}</tr>`
        ).join('');
        
        return `
            <div class="overflow-x-auto">
                <table class="w-full text-sm">
                    <thead class="bg-gray-50 dark:bg-gray-700">
                        <tr>${headersHtml}</tr>
                    </thead>
                    <tbody>${rowsHtml}</tbody>
                </table>
            </div>
        `;
    },
    
    weather: (config) => `
        <div class="flex items-center justify-center py-4">
            <div class="text-center">
                <i class="fas ${config.icon} text-3xl ${config.iconColor}"></i>
                <div class="text-lg font-semibold dark:text-white mt-2">${config.temperature}</div>
                <div class="text-xs text-gray-500 dark:text-gray-400">${config.condition}</div>
            </div>
        </div>
    `
};

// Generate component library from CARD_TYPES
function generateComponentLibrary() {
    const library = document.getElementById('component-library');
    library.innerHTML = '<div class="space-y-4">';
    
    Object.keys(CARD_TYPES).forEach(type => {
        const config = CARD_TYPES[type];
        const componentHtml = `
            <div class="draggable-component mb-3 group cursor-move p-3 border-2 border-gray-200 dark:border-gray-600 rounded-lg hover:border-${config.hoverColor}-400 dark:hover:border-${config.hoverColor}-500 hover:bg-${config.hoverColor}-50 dark:hover:bg-${config.hoverColor}-900/30 transition-colors" 
                 data-component="${type}">
                <div class="flex flex-col items-center">
                    <i class="fa-solid ${config.icon} text-2xl text-gray-600 dark:text-gray-300 group-hover:text-${config.hoverColor}-600 dark:group-hover:text-${config.hoverColor}-400"></i>
                    <span class="text-xs mt-1 text-gray-500 dark:text-gray-400">${config.title.replace(' Widget', '').replace(' Data', '')}</span>
                </div>
            </div>
        `;
        library.innerHTML += componentHtml;
    });
    
    library.innerHTML += '</div>';
}

// Drag and Drop Functionality
let draggedElement = null;
let cardCounter = 0;

function initializeDragAndDrop() {
    document.querySelectorAll('.draggable-component').forEach(component => {
        component.addEventListener('dragstart', handleDragStart);
        component.addEventListener('dragend', handleDragEnd);
        component.setAttribute('draggable', 'true');
    });

    const dropZone = document.getElementById('drop-zone');
    dropZone.addEventListener('dragover', handleDragOver);
    dropZone.addEventListener('drop', handleDrop);
}

function handleDragStart(e) {
    draggedElement = this;
    this.classList.add('opacity-50');
}

function handleDragEnd(e) {
    this.classList.remove('opacity-50');
    draggedElement = null;
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
}

function handleDrop(e) {
    e.preventDefault();
    
    if (draggedElement) {
        const componentType = draggedElement.dataset.component;
        createCard(componentType);
        
        const instructions = document.getElementById('drag-instructions');
        if (instructions) {
            instructions.remove();
        }
    }
}

function updateCardGridSpan(card, cols, rows) {
    // Remove existing grid span classes
    card.classList.forEach(className => {
        if (className.startsWith('col-span-') || className.startsWith('row-span-')) {
            card.classList.remove(className);
        }
    });
    
    // Add new grid span classes
    if (cols === 4) {
        card.classList.add('col-span-full');
    } else {
        card.classList.add(`col-span-${cols}`);
    }
    
    if (rows > 1) {
        card.classList.add(`row-span-${rows}`);
    }
}

function initializeCardResize(card) {
    const resizeHandles = card.querySelectorAll('.resize-handle');
    
    resizeHandles.forEach(handle => {
        handle.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            resizeState.isResizing = true;
            resizeState.currentCard = card;
            resizeState.startX = e.clientX;
            resizeState.startY = e.clientY;
            resizeState.startCols = parseInt(card.dataset.cols);
            resizeState.startRows = parseInt(card.dataset.rows);
            resizeState.resizeType = handle.dataset.resizeType;
            
            document.addEventListener('mousemove', handleResize);
            document.addEventListener('mouseup', handleResizeEnd);
            
            // Add visual feedback
            card.classList.add('resizing', 'border-blue-400', 'shadow-lg');
            document.body.style.cursor = getResizeCursor(resizeState.resizeType);
        });
    });
}

function handleResize(e) {
    if (!resizeState.isResizing || !resizeState.currentCard) return;
    
    const card = resizeState.currentCard;
    const deltaX = e.clientX - resizeState.startX;
    const deltaY = e.clientY - resizeState.startY;
    
    // Calculate new dimensions based on grid cell size (approximately 200px per column, 150px per row)
    const gridCellWidth = 200;
    const gridCellHeight = 150;
    
    let newCols = resizeState.startCols;
    let newRows = resizeState.startRows;
    
    if (resizeState.resizeType === 'width' || resizeState.resizeType === 'both') {
        const colChange = Math.round(deltaX / gridCellWidth);
        newCols = Math.max(1, Math.min(MAX_COLUMNS, resizeState.startCols + colChange));
    }
    
    if (resizeState.resizeType === 'height' || resizeState.resizeType === 'both') {
        const rowChange = Math.round(deltaY / gridCellHeight);
        newRows = Math.max(1, Math.min(MAX_ROWS, resizeState.startRows + rowChange));
    }
    
    // Update card size if changed
    if (newCols !== parseInt(card.dataset.cols) || newRows !== parseInt(card.dataset.rows)) {
        card.dataset.cols = newCols;
        card.dataset.rows = newRows;
        updateCardGridSpan(card, newCols, newRows);
    }
}

function handleResizeEnd(e) {
    if (!resizeState.isResizing) return;
    
    document.removeEventListener('mousemove', handleResize);
    document.removeEventListener('mouseup', handleResizeEnd);
    
    if (resizeState.currentCard) {
        resizeState.currentCard.classList.remove('resizing', 'border-blue-400', 'shadow-lg');
    }
    
    document.body.style.cursor = '';
    resizeState.isResizing = false;
    resizeState.currentCard = null;
}

function getResizeCursor(resizeType) {
    switch (resizeType) {
        case 'width': return 'ew-resize';
        case 'height': return 'ns-resize';
        case 'both': return 'nw-resize';
        default: return 'default';
    }
}

function createCard(type) {
    const config = CARD_TYPES[type];
    if (!config) {
        console.error(`Unknown card type: ${type}`);
        return;
    }

    cardCounter++;
    const cardGrid = document.getElementById('card-grid');
    
    const card = document.createElement('div');
    const defaultSize = config.defaultSize || { cols: 1, rows: 1 };
    
    card.className = `resizable-card bg-white dark:bg-gray-800 dark:text-white rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow duration-200 relative group min-h-fit`;
    card.dataset.cardType = type;
    card.dataset.cardId = `card-${cardCounter}`;
    card.dataset.cols = defaultSize.cols;
    card.dataset.rows = defaultSize.rows;
    
    updateCardGridSpan(card, defaultSize.cols, defaultSize.rows);
    
    let cardHtml = '';
    
    // Add resize handles
    const resizeHandles = createResizeHandles();
    
    // Add header if needed
    if (config.showHeader) {
        cardHtml += `
            <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">${config.title}</h3>
                <div class="flex items-center space-x-2">
                    <button class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" onclick="editCard(this)">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="text-gray-400 hover:text-red-600" onclick="deleteCard(this)">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="text-sm text-gray-600 dark:text-gray-400 mb-4">${config.description}</div>
        `;
    } else {
        // For cards without headers (like title), add a minimal control bar
        cardHtml += `
            <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                <div class="flex items-center space-x-1">
                    <button class="text-gray-400 hover:text-red-600 text-sm p-1" onclick="deleteCard(this)">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `;
    }
    
    // Add content
    cardHtml += `<div class="card-content">${renderCardContent(config.content)}</div>`;
    
    card.innerHTML = cardHtml;
    
    // Add resize handles to the card
    card.appendChild(resizeHandles);
    
    cardGrid.appendChild(card);
    
    // Initialize resize functionality for this card
    initializeCardResize(card);
}

function renderCardContent(contentConfig) {
    const renderer = CONTENT_RENDERERS[contentConfig.type];
    if (!renderer) {
        console.error(`Unknown content type: ${contentConfig.type}`);
        return '<div class="text-gray-500">Unknown content type</div>';
    }
    return renderer(contentConfig);
}

// Editable content handlers
function handleEditableClick(element) {
    const placeholder = element.dataset.placeholder;
    if (element.textContent.trim() === '' || element.textContent === placeholder) {
        element.textContent = '';
    }
    element.focus();
}

function handleEditableBlur(element) {
    const placeholder = element.dataset.placeholder;
    if (element.textContent.trim() === '') {
        element.textContent = placeholder;
        element.classList.add('text-gray-400');
    } else {
        element.classList.remove('text-gray-400');
    }
}

function handleEditableKeydown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        event.target.blur();
    }
}

function editCard(button) {
    const card = button.closest('[data-card-type]');
    const cardType = card.dataset.cardType;
    const config = CARD_TYPES[cardType];
    
    if (!config) return;
    
    const title = card.querySelector('h3').textContent;
    const newTitle = prompt('Enter new title:', title);
    if (newTitle) {
        card.querySelector('h3').textContent = newTitle;
    }
}

function deleteCard(button) {
    const card = button.closest('[data-card-type]');
    if (confirm('Are you sure you want to delete this card?')) {
        card.remove();
        
        // Show instructions again if no cards remain
        const cardGrid = document.getElementById('card-grid');
        if (cardGrid.children.length === 0) {
            const dropZone = document.getElementById('drop-zone');
            const instructionsHtml = `
                <div class="text-center text-gray-500 dark:text-gray-400 mb-8" id="drag-instructions">
                    <i class="fa-solid fa-mouse-pointer text-4xl mb-4"></i>
                    <p class="text-lg">Drag components from the right sidebar to build your dashboard</p>
                </div>
            `;
            dropZone.insertAdjacentHTML('afterbegin', instructionsHtml);
        }
    }
}

// Utility function to easily add new card types
function registerCardType(name, config) {
    CARD_TYPES[name] = config;
    generateComponentLibrary(); // Regenerate the component library
    initializeDragAndDrop(); // Reinitialize drag and drop
}

// Theme toggle functionality
function initThemeToggle() {
    const themeToggler = document.getElementById('theme-toggler');
    const themeToggleDarkIcon = document.getElementById('theme-toggle-dark-icon');
    const themeToggleLightIcon = document.getElementById('theme-toggle-light-icon');

    // Show the correct icon based on current theme
    if (document.documentElement.classList.contains('dark')) {
        themeToggleLightIcon.classList.remove('hidden');
    } else {
        themeToggleDarkIcon.classList.remove('hidden');
    }

    themeToggler.addEventListener('click', function() {
        // Toggle icons
        themeToggleDarkIcon.classList.toggle('hidden');
        themeToggleLightIcon.classList.toggle('hidden');

        // Toggle theme
        if (document.documentElement.classList.contains('dark')) {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('color-theme', 'light');
        } else {
            document.documentElement.classList.add('dark');
            localStorage.setItem('color-theme', 'dark');
        }
    });
}

// Initialize everything when the page loads
document.addEventListener('DOMContentLoaded', function() {
    generateComponentLibrary();
    initializeDragAndDrop();
    initThemeToggle();
});

// Add CSS for the directional resize handles
const style = document.createElement('style');
style.textContent = `
    /* Resize handles positioning and styling */
    .resize-handles {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        pointer-events: none;
    }
    
    .resize-handle {
        position: absolute;
        pointer-events: auto;
        background: rgba(59, 130, 246, 0.2);
        border: 1px solid rgba(59, 130, 246, 0.5);
        transition: all 0.2s ease;
    }
    
    .resize-handle:hover {
        background: rgba(59, 130, 246, 0.3);
        border-color: rgba(59, 130, 246, 0.8);
    }
    
    /* Right edge handle */
    .resize-handle-right {
        top: 20%;
        right: -4px;
        width: 8px;
        height: 60%;
        cursor: ew-resize;
        border-radius: 4px 0 0 4px;
    }
    
    /* Bottom edge handle */
    .resize-handle-bottom {
        left: 20%;
        bottom: -4px;
        width: 60%;
        height: 8px;
        cursor: ns-resize;
        border-radius: 4px 4px 0 0;
    }
    
    /* Corner handle */
    .resize-handle-corner {
        right: -4px;
        bottom: -4px;
        width: 16px;
        height: 16px;
        cursor: nw-resize;
        border-radius: 4px 0 0 0;
    }
    
    .resize-handle-corner::after {
        content: '';
        position: absolute;
        right: 2px;
        bottom: 2px;
        width: 0;
        height: 0;
        border-left: 6px solid transparent;
        border-bottom: 6px solid rgba(59, 130, 246, 0.6);
    }
    
    /* Visual feedback during resize */
    .resizing {
        transition: none !important;
        z-index: 1000;
    }
    
    .resizing .resize-handles {
        opacity: 1 !important;
    }
    
    /* Improved hover states */
    .group:hover .resize-handles {
        opacity: 0.8;
    }
    
    /* Column and row span utilities */
    .col-span-1 { grid-column: span 1 / span 1; }
    .col-span-2 { grid-column: span 2 / span 2; }
    .col-span-3 { grid-column: span 3 / span 3; }
    .col-span-4 { grid-column: span 4 / span 4; }
    .col-span-full { grid-column: 1 / -1; }
    
    .row-span-2 { grid-row: span 2 / span 2; }
    .row-span-3 { grid-row: span 3 / span 3; }
    
    /* Grid layout improvements */
    #card-grid {
        grid-auto-rows: minmax(150px, auto);
        align-items: start;
        gap: 1rem;
    }
    
    /* Card content improvements */
    .card-content {
        position: relative;
        z-index: 1;
    }
    
    /* Responsive adjustments */
    @media (max-width: 768px) {
        .resize-handle-right,
        .resize-handle-bottom,
        .resize-handle-corner {
            display: none;
        }
        
        .col-span-2, .col-span-3, .col-span-4 {
            grid-column: span 1 / span 1;
        }
        
        .row-span-2, .row-span-3 {
            grid-row: auto;
        }
    }
    
    /* Improve table layout in cards */
    .card-content table {
        margin-bottom: 0;
    }
    
    .card-content .overflow-x-auto {
        margin: -4px;
        padding: 4px;
    }
`;
document.head.appendChild(style);