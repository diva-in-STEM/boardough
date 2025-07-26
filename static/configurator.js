const CARD_TYPES = {
    text: {
        title: "Text Widget",
        description: "Add a text to your dashboard",
        icon: "fa-heading",
        span: "col-span-full",
        showHeader: false,
        hoverColor: "blue",
        defaultSize: { cols: 4, rows: 1 },
        content: {
            type: "editable",
            placeholder: "Click to edit text...",
            classes: "text-3xl font-bold text-gray-900 dark:text-white text-center py-4 text-wrap flex align-center justify-center",
            defaultText: "Some Text"
        }
    },
    chart: {
        title: "Chart Widget",
        description: "Add interactive charts to your dashboard",
        icon: "fa-chart-line",
        span: "col-span-1",
        showHeader: true,
        hoverColor: "blue",
        defaultSize: { cols: 1, rows: 1 },
        content: {
            type: "placeholder",
            html: `
                <div class="py-8 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center">
                    <i class="fas fa-chart-line text-4xl text-gray-400"></i>
                </div>
                <div class="mt-3 text-xs text-gray-500 dark:text-gray-400 text-center">Chart visualization will appear here</div>
            `
        }
    },
    stats: {
        title: "Statistics",
        description: "Display key metrics and statistics",
        icon: "fa-chart-bar",
        span: "col-span-1",
        showHeader: true,
        hoverColor: "green",
        defaultSize: { cols: 1, rows: 1 },
        content: {
            type: "stats",
            stats: [
                { value: "1,234", label: "Total Users", color: "blue" },
                { value: "89%", label: "Success Rate", color: "green" }
            ]
        }
    },
    table: {
        title: "Data Table",
        description: "Show data in a structured table format",
        icon: "fa-table",
        span: "col-span-1",
        showHeader: true,
        hoverColor: "purple",
        defaultSize: { cols: 2, rows: 1 },
        content: {
            type: "table",
            headers: ["Name", "Value"],
            rows: [["Item 1", "100"], ["Item 2", "200"]]
        }
    },
    notes: {
        title: "Notes",
        description: "Add text notes and reminders",
        icon: "fa-sticky-note",
        span: "col-span-1",
        showHeader: true,
        hoverColor: "yellow",
        defaultSize: { cols: 1, rows: 1 },
        content: {
            type: "editable",
            placeholder: "Click to add your notes...",
            classes: "bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded p-3 text-sm text-gray-700 dark:text-gray-300 min-h-[100px] resize-none",
            defaultText: "Sample note content..."
        }
    }
};

const MAX_COLUMNS = 4;

// Dashboard State Management
const dashboardInfo = JSON.parse(document.getElementById("dashboard-info").innerText);
let dashboardState = {
    id: dashboardInfo[0],
    name: dashboardInfo[3],
    pages: [
        {
            id: 'home',
            name: 'Home',
            cards: [],
            isActive: true
        }
    ],
    currentPageId: 'home',
    dataSources: [],
    subroutes: [],
    calculations: {},
    settings: {
        theme: 'light',
        autoRefresh: false,
        refreshInterval: 30000
    }
};

let resizeState = {
    isResizing: false,
    currentCard: null,
    startX: 0,
    startCols: 0
};

const grid = document.getElementById("card-grid");

// Initialize dashboard
document.addEventListener("DOMContentLoaded", function() {
    try {
        loadDashboard();
        loadPageState(dashboardState.currentPageId);
        initializeDashboardData();
        generateComponentLibrary();
        initializeDragAndDrop();
        initThemeToggle();
        initializePageNavigation();
        initializeDataRefresh();
    } catch (error) {
        console.error("Error initializing dashboard:", error);
    }
});

function initializeDashboardData() {
    const sourcesElement = document.getElementById("dashboard-sources");
    const subroutesElement = document.getElementById("subroutes-data");
    
    if (sourcesElement) {
        dashboardState.dataSources = JSON.parse(sourcesElement.textContent) || [];
    }
    if (subroutesElement) {
        dashboardState.subroutes = JSON.parse(subroutesElement.textContent) || [];
    }
}

// Page Management Functions
function initializePageNavigation() {
    updatePagesList();
    // Add "Add Page" button functionality
    const addPageButton = document.createElement('li');
    addPageButton.className = 'w-47';
    addPageButton.innerHTML = `
        <button class="hover:cursor-pointer flex items-center dark:hover:bg-gray-700 dark:text-gray-300 group hover:bg-gray-100 p-2 rounded-lg text-gray-700 w-full ml-4 border-2 border-dashed border-gray-300 mr-4"
                onclick="addNewPage()" type="button">
            <i class="dark:text-gray-400 text-gray-500 dark:group-hover:text-gray-300 fa-solid group-hover:text-gray-700 h-3 w-3 mr-3 fa-plus"></i>
            Add Page
        </button>
    `;
    document.getElementById('pages-dropdown').appendChild(addPageButton);
}

function updatePagesList() {
    const pagesDropdown = document.getElementById('pages-dropdown');
    // Clear existing pages except the last add button
    const existingPages = pagesDropdown.querySelectorAll('li:not(:last-child)');
    existingPages.forEach(page => page.remove());
    
    dashboardState.pages.forEach(page => {
        const pageElement = document.createElement('li');
        pageElement.className = 'w-47';
        pageElement.innerHTML = `
            <button class="hover:cursor-pointer flex items-center dark:hover:bg-gray-700 dark:text-gray-300 group hover:bg-gray-100 p-2 rounded-lg text-gray-700 w-full ml-4 ${page.isActive ? 'border-2 border-indigo-200' : ''} mr-4"
                    onclick="switchToPage('${page.id}')" type="button">
                <i class="dark:text-gray-400 text-gray-500 dark:group-hover:text-gray-300 fa-solid group-hover:text-gray-700 h-3 w-3 mr-3 fa-file"></i>
                ${page.name}
                ${page.id !== 'home' ? `<i class="fa-solid fa-times ml-auto text-xs hover:text-red-600" onclick="deletePage('${page.id}', event)"></i>` : ''}
            </button>
        `;
        pagesDropdown.insertBefore(pageElement, pagesDropdown.lastElementChild);
    });
}

function addNewPage() {
    const pageName = prompt("Enter page name:");
    if (!pageName) return;
    
    const pageId = `page_${Date.now()}`;
    const newPage = {
        id: pageId,
        name: pageName,
        cards: [],
        isActive: false
    };
    
    dashboardState.pages.push(newPage);
    updatePagesList();
    switchToPage(pageId);
}

function deletePage(pageId, event) {
    event.stopPropagation();
    if (confirm("Are you sure you want to delete this page?")) {
        dashboardState.pages = dashboardState.pages.filter(p => p.id !== pageId);
        if (dashboardState.currentPageId === pageId) {
            switchToPage('home');
        }
        updatePagesList();
    }
}

function switchToPage(pageId) {
    // Save current page state
    saveCurrentPageState();
    
    // Switch to new page
    dashboardState.pages.forEach(page => {
        page.isActive = page.id === pageId;
    });
    dashboardState.currentPageId = pageId;
    
    // Load new page
    loadPageState(pageId);
    updatePagesList();
    hideCalculationsPage();
}

function saveCurrentPageState() {
    const currentPage = dashboardState.pages.find(p => p.id === dashboardState.currentPageId);
    if (currentPage) {
        currentPage.cards = serializeCurrentCards();
    }
}

function loadPageState(pageId) {
    const page = dashboardState.pages.find(p => p.id === pageId);
    if (page) {
        clearGrid();
        page.cards.forEach(cardData => {
            deserializeCard(cardData);
        });
        
        // Show/hide drag instructions based on card count
        toggleDragInstructions(page.cards.length === 0);
    }
}

function serializeCurrentCards() {
    const cards = [];
    document.querySelectorAll('.resizable-card').forEach(cardElement => {
        const cardData = {
            id: cardElement.dataset.cardId,
            type: cardElement.dataset.cardType,
            cols: parseInt(cardElement.dataset.cols),
            rows: parseInt(cardElement.dataset.rows),
            config: extractCardConfig(cardElement)
        };
        cards.push(cardData);
    });
    return cards;
}

function deserializeCard(cardData) {
    const cardElement = createCard(cardData.type);
    cardElement.dataset.cardId = cardData.id;
    cardElement.dataset.cols = cardData.cols;
    cardElement.dataset.rows = cardData.rows;
    updateCardGridSpan(cardElement, cardData.cols, cardData.rows);
    
    // Apply saved configuration
    if (cardData.config) {
        applyCardConfig(cardElement, cardData.config);
    }
}

function extractCardConfig(cardElement) {
    const cardType = cardElement.dataset.cardType;
    const config = {};
    
    if (cardType === 'text' || cardType === 'notes') {
        const editableElement = cardElement.querySelector('[contenteditable]');
        if (editableElement) {
            config.text = editableElement.textContent;
        }
    }
    // Add more config extraction for other card types
    
    return config;
}

function applyCardConfig(cardElement, config) {
    const cardType = cardElement.dataset.cardType;
    
    if (cardType === 'text' || cardType === 'notes') {
        const editableElement = cardElement.querySelector('[contenteditable]');
        if (editableElement && config.text) {
            editableElement.textContent = config.text;
        }
    }
    // Add more config application for other card types
}

// Data Refresh and Auto-update
function initializeDataRefresh() {
    if (dashboardState.settings.autoRefresh) {
        setInterval(refreshAllData, dashboardState.settings.refreshInterval);
    }
}

async function refreshAllData() {
    const cards = document.querySelectorAll('.resizable-card[data-card-type="stats"], .resizable-card[data-card-type="chart"]');
    
    for (const card of cards) {
        try {
            await refreshCardData(card);
        } catch (error) {
            console.error("Error refreshing card data:", error);
        }
    }
}

async function refreshCardData(cardElement) {
    const cardType = cardElement.dataset.cardType;
    
    if (cardType === 'stats') {
        // Re-fetch stats data
        const config = extractCardConfig(cardElement);
        if (config.dataSource) {
            await applyStatsCustomization(cardElement, config);
        }
    } else if (cardType === 'chart') {
        // Re-fetch chart data
        const config = extractCardConfig(cardElement);
        if (config.dataSource) {
            await applyChartCustomization(cardElement, config);
        }
    }
}

// Custom Calculations Engine
function createCalculatedField(formula, dataSources) {
    return {
        formula: formula,
        dataSources: dataSources,
        calculate: async function() {
            try {
                // Fetch all required data sources
                const dataMap = {};
                for (const source of this.dataSources) {
                    const response = await fetch(source.url);
                    const data = await response.json();
                    dataMap[source.name] = data;
                }
                
                // Execute formula with data context
                const result = evaluateFormula(this.formula, dataMap);
                return result;
            } catch (error) {
                console.error("Calculation error:", error);
                return "Error";
            }
        }
    };
}

function evaluateFormula(formula, dataMap) {
    // Simple formula evaluator - can be extended with more complex operations
    // Supports basic math operations and data references like SUM(dataSource.field)
    
    let processedFormula = formula;
    
    // Replace data references
    Object.keys(dataMap).forEach(sourceName => {
        const sourceData = dataMap[sourceName];
        
        // Handle SUM function
        const sumRegex = new RegExp(`SUM\\(${sourceName}\\.([\\w]+)\\)`, 'g');
        processedFormula = processedFormula.replace(sumRegex, (match, field) => {
            if (Array.isArray(sourceData)) {
                const sum = sourceData.reduce((acc, item) => {
                    const value = parseFloat(item[field]) || 0;
                    return acc + value;
                }, 0);
                return sum.toString();
            }
            return "0";
        });
        
        // Handle AVG function
        const avgRegex = new RegExp(`AVG\\(${sourceName}\\.([\\w]+)\\)`, 'g');
        processedFormula = processedFormula.replace(avgRegex, (match, field) => {
            if (Array.isArray(sourceData) && sourceData.length > 0) {
                const sum = sourceData.reduce((acc, item) => {
                    const value = parseFloat(item[field]) || 0;
                    return acc + value;
                }, 0);
                return (sum / sourceData.length).toString();
            }
            return "0";
        });
        
        // Handle COUNT function
        const countRegex = new RegExp(`COUNT\\(${sourceName}\\)`, 'g');
        processedFormula = processedFormula.replace(countRegex, () => {
            return Array.isArray(sourceData) ? sourceData.length.toString() : "0";
        });
        
        // Handle direct field access
        const fieldRegex = new RegExp(`${sourceName}\\.([\\w]+)`, 'g');
        processedFormula = processedFormula.replace(fieldRegex, (match, field) => {
            if (Array.isArray(sourceData) && sourceData.length > 0) {
                return sourceData[0][field] || "0";
            } else if (sourceData && typeof sourceData === 'object') {
                return sourceData[field] || "0";
            }
            return "0";
        });
    });
    
    // Evaluate the mathematical expression safely
    try {
        // Simple eval alternative for basic math operations
        const result = Function(`"use strict"; return (${processedFormula})`)();
        return isNaN(result) ? "Invalid" : result;
    } catch (error) {
        return "Error";
    }
}

async function recalculateField(cardElement) {
    const formula = cardElement.dataset.formula;
    const dataSource = cardElement.dataset.dataSource;
    
    if (!formula || !dataSource) return;
    
    const calculation = createCalculatedField(formula, [{ name: 'data', url: dataSource }]);
    const result = await calculation.calculate();
    
    const resultElement = cardElement.querySelector('.calculation-result');
    if (resultElement) {
        resultElement.textContent = result;
    }
}

// Database Saving Functions
async function saveDashboard(dashboardID) {
    try {
        // Save current state before sending
        saveCurrentPageState();

        // Serialize dashboard state to JSON
        const jsonDash = JSON.stringify(dashboardState, null, 2);
        const blob = new Blob([jsonDash], { type: 'application/json' });

        // Send POST request
        const response = await fetch(`/api/dashboards/save/${dashboardID}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: blob
        });

        // Check if the response was redirected
        if (response.redirected) {
            // Use the final URL in the response
            location.href = response.url;
        } else if (response.ok) {
            // If the request succeeded, parse JSON and redirect
            const result = await response.json();
            dashboardState.id = result.id;
            showNotification("Dashboard saved successfully!", "success");
            location.href = '/home';
        } else {
            // If the response is not a redirect and not successful, show an error
            throw new Error(`Request failed with status: ${response.status}`);
        }
    } catch (error) {
        console.error("Error saving dashboard:", error);
        showNotification("Error saving dashboard", "error");
    }
}

async function loadDashboard() {
    try {
        if (dashboardInfo[7]) {
            dashboardState = JSON.parse(dashboardInfo[7])
        }
    } catch (error) {
        console.error("Error loading dashboard:", error);
        showNotification("Error loading dashboard", "error");
    }
}

// window.onload = function() {
//     loadDashboard()
// }

function updateBrowserUrl() {
    if (dashboardState.id) {
        const newUrl = `${window.location.pathname}?id=${dashboardState.id}`;
        window.history.replaceState(null, '', newUrl);
    }
}

// Export Functions
async function exportDashboard() {
    try {
        saveCurrentPageState();
        
        const exportData = {
            dashboard: dashboardState,
            timestamp: new Date().toISOString()
        };
        
        const response = await fetch('/api/dashboards/export', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(exportData)
        });
        
        if (response.ok) {
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `dashboard_export_${dashboardState.name || 'unnamed'}.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            showNotification("Dashboard exported successfully!", "success");
        } else {
            throw new Error('Failed to export dashboard');
        }
    } catch (error) {
        console.error("Error exporting dashboard:", error);
        showNotification("Error exporting dashboard", "error");
    }
}

// Utility Functions
function clearGrid() {
    const cardGrid = document.getElementById("card-grid");
    cardGrid.innerHTML = '';
}

function toggleDragInstructions(show) {
    const existingInstructions = document.getElementById("drag-instructions");
    if (existingInstructions) {
        existingInstructions.remove();
    }
    
    if (show) {
        const instructions = document.createElement("div");
        instructions.id = "drag-instructions";
        instructions.className = "dark:text-gray-400 text-gray-500 mb-8 text-center";
        instructions.innerHTML = `
            <i class="fa-solid fa-mouse-pointer mb-4 text-4xl"></i>
            <p class="text-lg">Drag components from the right sidebar to build your dashboard</p>
            <p class="mt-2 opacity-75 text-sm">Hover over cards to see resize handles</p>
        `;
        document.getElementById("drop-zone").insertBefore(instructions, document.getElementById("card-grid"));
    }
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
        type === 'success' ? 'bg-green-500 text-white' :
        type === 'error' ? 'bg-red-500 text-white' :
        'bg-blue-500 text-white'
    }`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Add save and export buttons to the header
function addDashboardControls() {
    const headerActions = document.querySelector('header .flex.items-center.space-x-4');
    if (headerActions) {
        const controls = document.createElement('div');
        controls.className = 'flex items-center space-x-2';
        controls.innerHTML = `
            <button onclick="saveDashboard(${dashboardInfo[0]})" class="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm hover:cursor-pointer">
                <i class="fas fa-save mr-1"></i> Save
            </button>
            <!-- <button onclick="exportDashboard()" class="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm hover:cursor-pointer">
                <i class="fas fa-download mr-1"></i> Export
            </button> -->
        `;
        headerActions.insertBefore(controls, headerActions.firstChild);
    }
}

// Initialize dashboard controls
document.addEventListener("DOMContentLoaded", function() {
    addDashboardControls();
});

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
    }
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
        const newCard = createCard(componentType);
        
        // Show customization modal for stats and chart cards
        if (componentType === 'stats' || componentType === 'chart') {
            setTimeout(() => {
                showCustomizationModal(componentType, newCard);
            }, 100);
        }
        
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
                        <i class="fas fa-times"></i>
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
    return card;
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
    
    if (cardType === 'stats' || cardType === 'chart') {
        showCustomizationModal(cardType, card);
    } else {
        const config = CARD_TYPES[cardType];
        if (!config) return;
        
        const title = card.querySelector('h3').textContent;
        const newTitle = prompt('Enter new title:', title);
        if (newTitle) {
            card.querySelector('h3').textContent = newTitle;
        }
    }
}

function deleteCard(button) {
    const card = button.closest('[data-card-type]');
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
// Modal functionality
let currentCustomizingCard = null;
let dashboardSource = [];
let subroutes = [];

// Initialize data when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    try {
        const dashboardSourceElement = document.getElementById('dashboard-sources');
        const subroutesElement = document.getElementById('subroutes-data');
        
        dashboardSource = dashboardSourceElement ? JSON.parse(dashboardSourceElement.textContent) : [];
        subroutes = subroutesElement ? JSON.parse(subroutesElement.textContent) : [];
    } catch (e) {
        console.warn('Error parsing template data:', e);
        dashboardSource = [];
        subroutes = [];
    }
    
    // Existing initialization code
    generateComponentLibrary();
    initializeDragAndDrop();
    initThemeToggle();
});

function showCustomizationModal(cardType, card) {
    currentCustomizingCard = card;
    const modal = document.getElementById('customization-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalContent = document.getElementById('modal-content');
    
    modalTitle.textContent = `Setup ${CARD_TYPES[cardType].title}`;
    
    if (cardType === 'stats') {
        modalContent.innerHTML = generateStatsModalContent();
    } else if (cardType === 'chart') {
        modalContent.innerHTML = generateChartModalContent();
    }
    
    modal.classList.remove('hidden');
}

function closeCustomizationModal() {
    const modal = document.getElementById('customization-modal');
    modal.classList.add('hidden');
    currentCustomizingCard = null;
}

function generateStatsModalContent() {
    const subrouteOptions = subroutes.map(subroute =>
        `<option value="${subroute[1]}">${subroute[1]}</option>`
    ).join('');

    return `
        <div class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Data Source</label>
                <select id="stats-source" class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white" onchange="updateSubrouteOptions('stats')">
                    <option value="">Select a source...</option>
                    <option value="${dashboardSource[3]}">${dashboardSource[2]}</option>
                </select>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Endpoint</label>
                <select id="stats-subroute-left" class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white" disabled="true">
                    <option value="">Subroute for the left stat</option>
                    ${subrouteOptions}
                </select>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Left Label</label>
                <input type="text" id="stats-left-field" class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white" placeholder="e.g., count, total, value">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Endpoint</label>
                <select id="stats-subroute-right" class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white subroute-selector" disabled="true">
                    <option value="">Subroute for the right stat</option>
                    ${subrouteOptions}
                </select>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Right Label</label>
                <input type="text" id="stats-right-field" class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white" placeholder="e.g., name, category, type">
            </div>
        </div>
    `;
}

function generateChartModalContent() {
    const calcOptions = Object.values(dashboardState.calculations || {}).map(c =>
        `<option value="${c.id}">${c.name}</option>`
    ).join('');
    const manualFields = 
        '<div id="chart-manual-fields">' +
            '<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Data Source</label>' +
            '<select id="chart-source" class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white">' +
                '<option value="">Select a source...</option>' +
                `<option value="${dashboardSource[3]}">${dashboardSource[2]}</option>` +
            '</select>' +
            '<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 mt-2">Endpoint</label>' +
            '<select id="chart-subroute" class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white subroute-selector">' +
                '<option value="">Select an endpoint...</option>' +
                subroutes.map(s => `<option value="${s[1]}">${s[1]}</option>`).join('') +
            '</select>' +
        '</div>';
    const axisFields = 
        '<div id="chart-axis-fields">' +
            '<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">X-Axis Field</label>' +
            '<input type="text" id="chart-x-field" class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white" placeholder="e.g., name">' +
            '<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 mt-2">Y-Axis Field</label>' +
            '<input type="text" id="chart-y-field" class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white" placeholder="e.g., count">' +
        '</div>';
    // Return the modal HTML
    return (
        '<div class="space-y-4">' +
            '<div>' +
                '<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Calculation</label>' +
                '<select id="chart-calculation" class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white">' +
                    '<option value="">None (manual)</option>' +
                    calcOptions +
                '</select>' +
            '</div>' +
            manualFields +
            '<div>' +
                '<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Chart Type</label>' +
                '<select id="chart-type" class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white">' +
                    '<option value="line">Line Chart</option>' +
                    '<option value="bar">Bar Chart</option>' +
                    '<option value="pie">Pie Chart</option>' +
                '</select>' +
            '</div>' +
            axisFields +
        '</div>'
    );
}

// Attach calculation dropdown logic after modal is rendered
document.addEventListener('change', async function(e) {
    if (e.target && e.target.id === 'chart-calculation') {
        const calcId = e.target.value;
        const manualFields = document.getElementById('chart-manual-fields');
        const axisFields = document.getElementById('chart-axis-fields');
        if (calcId) {
            manualFields.style.display = 'none';
            const calc = dashboardState.calculations[calcId];
            if (!calc) return;
            const sourceUrl = dashboardSource[3];
            try {
                const usersRes = await fetch(sourceUrl + calc.subroute1);
                const postsRes = await fetch(sourceUrl + calc.subroute2);
                const users = await usersRes.json();
                const posts = await postsRes.json();
                let calcData = [];
                try {
                    calcData = Function('users', 'posts', 'return ' + calc.logic)(users, posts);
                } catch (e) {
                    calcData = [];
                }
                console.log('Calculation data:', calcData);
                var keys = [];
                if (Array.isArray(calcData) && calcData.length > 0 && typeof calcData[0] === 'object') {
                    keys = Object.keys(calcData[0]);
                }
                axisFields.innerHTML =
                    '<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">X-Axis Field</label>' +
                    '<select id="chart-x-field" class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white">' +
                        keys.map(k => `<option value="${k}">${k}</option>`).join('') +
                    '</select>' +
                    '<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 mt-2">Y-Axis Field</label>' +
                    '<select id="chart-y-field" class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white">' +
                        keys.map(k => `<option value="${k}">${k}</option>`).join('') +
                    '</select>';
            } catch (err) {
                axisFields.innerHTML = '<div class="text-red-600">Failed to load calculation data</div>';
            }
        } else {
            manualFields.style.display = 'block';
            axisFields.innerHTML =
                '<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">X-Axis Field</label>' +
                '<input type="text" id="chart-x-field" class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white" placeholder="e.g., name">' +
                '<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 mt-2">Y-Axis Field</label>' +
                '<input type="text" id="chart-y-field" class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white" placeholder="e.g., count">';
        }
    }
});

function updateSubrouteOptions(widgetType) {
    const sourceSelect = document.getElementById(`${widgetType}-source`);
    const leftSubrouteSelector = document.getElementById('stats-subroute-left');
    const rightSubrouteSelector = document.getElementById('stats-subroute-right');
    const selectedSource = sourceSelect.value;
    
    // Clear and disable subroute select
    leftSubrouteSelector.disabled = false;
    rightSubrouteSelector.disabled = false;
    
    if (!selectedSource) return;
    
    // Find matching subroutes for the selected source
    // Assuming subroute tuple structure: [id, path, source_name, source_created_by]
    const matchingSubroutes = subroutes.filter(subroute => 
        subroute[2] === selectedSource
    );
    
    if (matchingSubroutes.length > 0) {
        matchingSubroutes.forEach(subroute => {
            const option = document.createElement('option');
            option.value = subroute[1]; // path is at index 1
            option.textContent = subroute[1];
            subrouteSelect.appendChild(option);
        });
        subrouteSelect.disabled = false;
    }
}

async function applyCustomization() {
    if (!currentCustomizingCard) return;
    
    const cardType = currentCustomizingCard.dataset.cardType;
    
    if (cardType === 'stats') {
        await applyStatsCustomization();
    } else if (cardType === 'chart') {
        await applyChartCustomization();
    }
    
    closeCustomizationModal();
}

async function applyStatsCustomization() {
    if (!currentCustomizingCard) return;

    const source = document.getElementById("stats-source").value;
    const leftSubroute = document.getElementById("stats-subroute-left").value;
    const rightSubroute = document.getElementById("stats-subroute-right").value;
    const leftField = document.getElementById("stats-left-field").value;
    const rightField = document.getElementById("stats-right-field").value;

    if (!source || !leftSubroute || !rightSubroute) {
        return alert("Please select both a source and endpoint");
    }

    const sourceConfig = dashboardSource;
    if (!sourceConfig) {
        return alert("Source not found");
    }

    const leftUrl = `${sourceConfig[3]}${leftSubroute}`;
    const rightUrl = `${sourceConfig[3]}${rightSubroute}`;

    try {
        // Use cached fetch with 10 minute TTL for stats
        const [leftResponse, rightResponse] = await Promise.all([
            cachedFetch(leftUrl, {}, { ttl: 10 * 60 * 1000 }),
            cachedFetch(rightUrl, {}, { ttl: 10 * 60 * 1000 })
        ]);

        const leftData = await leftResponse.json();
        const rightData = await rightResponse.json();

        console.log("Stats data fetched:", leftData, rightData);
        updateStatsCard(currentCustomizingCard, leftData, rightData, leftField, rightField);
    } catch (error) {
        console.error("Error fetching stats data:", error);
        alert("Failed to fetch data. Check console for details.");
    }
}

async function applyChartCustomization() {
    const calculationId = document.getElementById("chart-calculation").value;
    const chartType = document.getElementById("chart-type").value;
    const xField = document.getElementById("chart-x-field").value;
    const yField = document.getElementById("chart-y-field").value;

    let chartData = [];

    if (calculationId) {
        const calculation = dashboardState.calculations[calculationId];
        if (!calculation) {
            return alert("Calculation not found");
        }

        const baseUrl = dashboardSource[3];
        
        try {
            // Use cached fetch with 5 minute TTL for calculation data
            const [response1, response2] = await Promise.all([
                cachedFetch(baseUrl + calculation.subroute1, {}, { ttl: 5 * 60 * 1000 }),
                cachedFetch(baseUrl + calculation.subroute2, {}, { ttl: 5 * 60 * 1000 })
            ]);

            const data1 = await response1.json();
            const data2 = await response2.json();

            try {
                chartData = Function("users", "posts", `return ${calculation.logic}`)(data1, data2);
            } catch (error) {
                return alert("Calculation error: " + error.message);
            }
        } catch (error) {
            console.error("Error fetching calculation data:", error);
            return alert("Failed to fetch calculation data.");
        }
    } else {
        const source = document.getElementById("chart-source").value;
        const subroute = document.getElementById("chart-subroute").value;

        if (!source || !subroute) {
            return alert("Please select both a source and endpoint");
        }

        const sourceConfig = dashboardSource.find(s => s[0] === source);
        if (!sourceConfig) {
            return alert("Source not found");
        }

        const url = `${sourceConfig[3]}${subroute}`;
        
        try {
            // Use cached fetch with 5 minute TTL for chart data
            const response = await cachedFetch(url, {}, { ttl: 5 * 60 * 1000 });
            chartData = await response.json();
        } catch (error) {
            console.error("Error fetching chart data:", error);
            return alert("Failed to fetch chart data.");
        }
    }

    updateChartCard(currentCustomizingCard, chartData, chartType, xField, yField);
}

function updateStatsCard(card, leftData, rightData, leftField, rightField) {
    const cardContent = card.querySelector('.card-content');
    
    // Simple stats update - you can enhance this based on your data structure
    let statsHtml = '';
    
    if (Array.isArray(leftData)) {        
        statsHtml = `
            <div class="grid grid-cols-2 gap-4">
                <div class="text-center py-2">
                    <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">${leftData.length}</div>
                    <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">${leftField}</div>
                </div>
                <div class="text-center py-2">
                    <div class="text-2xl font-bold text-green-600 dark:text-green-400">${rightData.length}</div>
                    <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">${rightField}</div>
                </div>
            </div>
        `;
    } else {
        // If data is an object, show individual metrics
        const metricValue = leftData[leftField] || 'N/A';
        const labelValue = leftData[rightField] || 'Metric';
        
        statsHtml = `
            <div class="text-center py-4">
                <div class="text-3xl font-bold text-blue-600 dark:text-blue-400">${metricValue}</div>
                <div class="text-sm text-gray-500 dark:text-gray-400 mt-2">${labelValue}</div>
            </div>
        `;
    }
    
    cardContent.innerHTML = statsHtml;
}

function updateChartCard(card, data, chartType, xField = 'name', yField = 'count') {
    const cardContent = card.querySelector('.card-content');
    cardContent.innerHTML = `
        <canvas id="chartjs-${card.dataset.cardId}" class="w-full h-64"></canvas>
    `;
    
    setTimeout(() => {
        if (window.Chart) {
            const canvas = document.getElementById(`chartjs-${card.dataset.cardId}`);
            if (!canvas) {
                console.error('Canvas element not found');
                return;
            }
            
            const ctx = canvas.getContext('2d');
            
            // Defensive: filter out undefined/null and empty objects
            const filteredData = Array.isArray(data) ? data.filter(d => d && typeof d === 'object') : [];
            
            if (filteredData.length === 0) {
                cardContent.innerHTML = `<div class="text-gray-600 p-4">No data available for chart</div>`;
                return;
            }
            
            const labels = filteredData.map(d => d[xField] ?? 'Unknown');
            const values = filteredData.map(d => {
                const val = d[yField];
                return typeof val === 'number' ? val : (parseFloat(val) || 0);
            });
            
            // Destroy existing chart if it exists
            if (window.chartInstances && window.chartInstances[card.dataset.cardId]) {
                window.chartInstances[card.dataset.cardId].destroy();
            }
            
            // Initialize chart instances tracker
            if (!window.chartInstances) {
                window.chartInstances = {};
            }
            
            // Create the chart
            window.chartInstances[card.dataset.cardId] = new Chart(ctx, {
                type: chartType,
                data: {
                    labels: labels,
                    datasets: [{
                        label: yField,
                        data: values,
                        backgroundColor: chartType === 'line' ? 'rgba(59,130,246,0.1)' : 'rgba(59,130,246,0.5)',
                        borderColor: 'rgba(59,130,246,1)',
                        borderWidth: 2,
                        fill: chartType === 'line' ? true : false
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { 
                        legend: { 
                            display: true,
                            position: 'top'
                        }
                    },
                    scales: chartType !== 'pie' && chartType !== 'doughnut' ? {
                        y: {
                            beginAtZero: true
                        }
                    } : {}
                }
            });
        } else {
            cardContent.innerHTML = `<div class="text-red-600 mt-2 p-4">ChartJS library not loaded</div>`;
        }
    }, 100);
}

// Load ChartJS if not present
if (!window.Chart) {
    const chartJsScript = document.createElement('script');
    chartJsScript.src = "https://cdn.jsdelivr.net/npm/chart.js";
    document.head.appendChild(chartJsScript);
}

// Enhanced calculation flow with improved operations and better data processing

// In-Memory API Cache System
class APICache {
    constructor(defaultTTL = 5 * 60 * 1000) { // 5 minutes default TTL
        this.cache = new Map();
        this.defaultTTL = defaultTTL;
        this.stats = {
            hits: 0,
            misses: 0,
            requests: 0
        };
    }

    // Generate cache key from URL and options
    generateKey(url, options = {}) {
        const method = options.method || 'GET';
        const body = options.body ? JSON.stringify(options.body) : '';
        return `${method}:${url}:${body}`;
    }

    // Set cache entry with TTL
    set(key, data, ttl = this.defaultTTL) {
        const expiry = Date.now() + ttl;
        this.cache.set(key, {
            data: JSON.parse(JSON.stringify(data)), // Deep clone to prevent mutations
            expiry: expiry,
            timestamp: Date.now()
        });
    }

    // Get cache entry if not expired
    get(key) {
        const entry = this.cache.get(key);
        if (!entry) {
            return null;
        }

        if (Date.now() > entry.expiry) {
            this.cache.delete(key);
            return null;
        }

        return JSON.parse(JSON.stringify(entry.data)); // Return deep clone
    }

    // Check if key exists and is not expired
    has(key) {
        return this.get(key) !== null;
    }

    // Clear expired entries
    cleanup() {
        const now = Date.now();
        for (const [key, entry] of this.cache.entries()) {
            if (now > entry.expiry) {
                this.cache.delete(key);
            }
        }
    }

    // Clear all cache
    clear() {
        this.cache.clear();
        this.stats = { hits: 0, misses: 0, requests: 0 };
    }

    // Get cache statistics
    getStats() {
        return {
            ...this.stats,
            size: this.cache.size,
            hitRate: this.stats.requests > 0 ? (this.stats.hits / this.stats.requests * 100).toFixed(2) + '%' : '0%'
        };
    }

    // Invalidate cache entries by pattern
    invalidateByPattern(pattern) {
        const regex = new RegExp(pattern);
        for (const key of this.cache.keys()) {
            if (regex.test(key)) {
                this.cache.delete(key);
            }
        }
    }
}

function clearAPICache() {
    window.apiCache.clear();
    console.log("API cache cleared");
}

function getCacheStats() {
    const stats = window.apiCache.getStats();
    console.log("Cache Statistics:", stats);
    return stats;
}

function cleanupExpiredCache() {
    window.apiCache.cleanup();
    console.log("Expired cache entries cleaned up");
}

function invalidateCacheByPattern(pattern) {
    window.apiCache.invalidateByPattern(pattern);
    console.log(`Cache entries matching pattern "${pattern}" invalidated`);
}


// Auto cleanup every 10 minutes
setInterval(() => {
    cleanupExpiredCache();
}, 10 * 60 * 1000);


document.addEventListener("change", async function(event) {
    if (event.target && event.target.id === "chart-calculation") {
        const calculationId = event.target.value;
        const manualFields = document.getElementById("chart-manual-fields");
        const axisFields = document.getElementById("chart-axis-fields");

        if (calculationId) {
            manualFields.style.display = "none";
            
            const calculation = dashboardState.calculations[calculationId];
            if (!calculation) return;

            const baseUrl = dashboardSource[3];
            
            try {
                // Use cached fetch for calculation preview
                const [response1, response2] = await Promise.all([
                    cachedFetch(baseUrl + calculation.subroute1, {}, { ttl: 5 * 60 * 1000 }),
                    cachedFetch(baseUrl + calculation.subroute2, {}, { ttl: 5 * 60 * 1000 })
                ]);

                const data1 = await response1.json();
                const data2 = await response2.json();

                let calculationResult = [];
                try {
                    calculationResult = Function("users", "posts", "return " + calculation.logic)(data1, data2);
                } catch (error) {
                    calculationResult = [];
                }

                console.log("Calculation data:", calculationResult);

                let availableFields = [];
                if (Array.isArray(calculationResult) && calculationResult.length > 0 && typeof calculationResult[0] === 'object') {
                    availableFields = Object.keys(calculationResult[0]);
                }

                axisFields.innerHTML = `
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">X-Axis Field</label>
                    <select id="chart-x-field" class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white">
                        ${availableFields.map(field => `<option value="${field}">${field}</option>`).join('')}
                    </select>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 mt-2">Y-Axis Field</label>
                    <select id="chart-y-field" class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white">
                        ${availableFields.map(field => `<option value="${field}">${field}</option>`).join('')}
                    </select>
                `;
            } catch (error) {
                axisFields.innerHTML = '<div class="text-red-600">Failed to load calculation data</div>';
            }
        } else {
            manualFields.style.display = "block";
            axisFields.innerHTML = `
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">X-Axis Field</label>
                <input type="text" id="chart-x-field" class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white" placeholder="e.g., name">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 mt-2">Y-Axis Field</label>
                <input type="text" id="chart-y-field" class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white" placeholder="e.g., count">
            `;
        }
    }
});

// Global cache instance
window.apiCache = new APICache();

// Cached fetch wrapper
async function cachedFetch(url, options = {}, cacheOptions = {}) {
    const {
        ttl = window.apiCache.defaultTTL,
        forceRefresh = false,
        cacheKey = null
    } = cacheOptions;

    const key = cacheKey || window.apiCache.generateKey(url, options);
    window.apiCache.stats.requests++;

    // Check cache first unless force refresh
    if (!forceRefresh) {
        const cached = window.apiCache.get(key);
        if (cached) {
            window.apiCache.stats.hits++;
            console.log(`Cache HIT for ${url}`, window.apiCache.getStats());
            return {
                ok: true,
                json: () => Promise.resolve(cached),
                status: 200,
                fromCache: true
            };
        }
    }

    // Cache miss - make actual request
    window.apiCache.stats.misses++;
    console.log(`Cache MISS for ${url}`, window.apiCache.getStats());

    try {
        const response = await fetch(url, options);
        
        if (response.ok) {
            const data = await response.json();
            window.apiCache.set(key, data, ttl);
            
            return {
                ok: true,
                json: () => Promise.resolve(data),
                status: response.status,
                fromCache: false
            };
        } else {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
    } catch (error) {
        console.error('Fetch error:', error);
        throw error;
    }
}

function showCalculationsPage() {
    document.getElementById("calculations-page").classList.remove("hidden");
    document.getElementById("drop-zone").classList.add("hidden");
    document.getElementById("calculations-list").innerHTML = "";
    document.getElementById("right-sidebar").classList.add("hidden");
    renderCalculationsList();
    
    const e = document.querySelector('#calculations-page button[onclick="showCalculationModal()"]');
    if (e) {
        e.onclick = function() { showCalculationBuilder(); };
    }
}

function renderCalculationsList() {
    const e = document.getElementById("calculations-list");
    e.innerHTML = "";
    const t = dashboardState.calculations || {};
    
    if (Object.keys(t).length !== 0) {
        Object.entries(t).forEach(([t, n]) => {
            const r = document.createElement("div");
            r.className = "calculation-list-item bg-white dark:bg-gray-800 rounded shadow p-4 mb-2 flex justify-between items-center border border-gray-200 dark:border-gray-700";
            
            const a = document.createElement("div");
            a.className = "flex flex-col";
            a.innerHTML = `
                <span class="font-semibold text-gray-900 dark:text-white">${n.name || "Untitled Calculation"}</span>
                <span class="text-sm text-gray-600 dark:text-gray-400">
                    ${n.flow ? n.flow.length : 0} steps • Created ${new Date(parseInt(t.replace("calc_", ""))).toLocaleDateString()}
                </span>
                <span class="text-xs text-blue-600 dark:text-blue-400">
                    ${n.description || "No description"}
                </span>
            `;
            
            const o = document.createElement("div");
            o.className = "flex gap-2";
            
            const i = document.createElement("button");
            i.className = "px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors";
            i.innerHTML = '<i class="fa fa-edit mr-1"></i>Edit';
            i.onclick = function() { showCalculationBuilder(t); };
            
            const l = document.createElement("button");
            l.className = "px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors";
            l.innerHTML = '<i class="fa fa-trash mr-1"></i>Delete';
            l.onclick = function() { deleteCalculation(t); };
            
            o.appendChild(i);
            o.appendChild(l);
            r.appendChild(a);
            r.appendChild(o);
            e.appendChild(r);
        });
    } else {
        e.innerHTML = '<div class="text-gray-500 dark:text-gray-400">No calculations yet. Click "Create New Calculation" to add one.</div>';
    }
}

function deleteCalculation(e) {
    if (confirm("Are you sure you want to delete this calculation?")) {
        delete dashboardState.calculations[e];
        renderCalculationsList();
    }
}

function showCalculationBuilder(calcId = null) {
    document.getElementById("calculations-list").innerHTML = "";
    window.currentCalcId = calcId;
    
    if (calcId && dashboardState.calculations[calcId]) {
        // FIXED: Ensure proper deep cloning with all nested properties
        const calc = dashboardState.calculations[calcId];
        window.currentCalcFlow = calc.flow ? JSON.parse(JSON.stringify(calc.flow)) : [];
        window.currentCalcName = calc.name || "";
        window.currentCalcDescription = calc.description || "";
        
        // Debug: Log the loaded flow to verify config is present
        console.log("Loaded calculation flow:", window.currentCalcFlow);
    } else {
        window.currentCalcFlow = [];
        window.currentCalcName = "";
        window.currentCalcDescription = "";
    }
    
    renderCalculationsBuilder(calcId);
}


function renderCalculationsBuilder(calcId = null) {
    const container = document.getElementById("calculations-list");
    container.innerHTML = "";
    
    const builder = document.createElement("div");
    builder.className = "calculation-builder bg-white dark:bg-gray-800 rounded shadow p-6 flex flex-col";
    
    const isEdit = calcId !== null;
    const title = isEdit ? "Edit Calculation" : "Create New Calculation";
    
    builder.innerHTML = `
        <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-bold text-gray-900 dark:text-white">${title}</h3>
            <button class="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm" onclick="cancelCalculationBuilder()">
                <i class="fa fa-times mr-1"></i>Cancel
            </button>
        </div>
        
        <!-- Calculation Info -->
        <div class="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Calculation Name</label>
                <input type="text" id="calc-name-input" 
                       class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm 
                              focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white" 
                       placeholder="Enter calculation name..." 
                       value="${window.currentCalcName || ""}">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                <input type="text" id="calc-description-input" 
                       class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm 
                              focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white" 
                       placeholder="Describe what this calculation does..." 
                       value="${window.currentCalcDescription || ""}">
            </div>
        </div>
        
        <div class="flex flex-row gap-6 mb-6">
            <div class="w-1/2">
                <h4 class="font-semibold mb-2 text-gray-900 dark:text-white">Data Sources</h4>
                <div id="calc-datasource-list" class="space-y-2"></div>
            </div>
            <div class="w-1/2">
                <h4 class="font-semibold mb-2 text-gray-900 dark:text-white">Available Operations</h4>
                <div id="calc-operations-list" class="flex flex-wrap gap-2"></div>
            </div>
        </div>
        
        <div class="w-full">
            <h4 class="font-semibold mb-2 text-gray-900 dark:text-white">Calculation Flow</h4>
            <div id="calc-flow-dropzone" class="min-h-[120px] w-full border-2 border-dashed border-blue-400 rounded p-4 bg-blue-50 dark:bg-blue-900/20 flex flex-row gap-4 overflow-x-auto"></div>
            <div class="flex gap-2 mt-4">
                <button class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors" onclick="saveCalculationFlow()">
                    <i class="fa fa-save mr-1"></i>${isEdit ? "Update Calculation" : "Save Calculation"}
                </button>
                <button class="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors" onclick="previewCalculationFlow()">
                    <i class="fa fa-eye mr-1"></i>Preview
                </button>
                <button class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors" onclick="addTemplateCalculation()">
                    <i class="fa fa-magic mr-1"></i>Use Template
                </button>
            </div>
        </div>
        
        <div id="calc-flow-preview" class="mt-6"></div>
    `;
    
    container.appendChild(builder);
    renderCalculationDataSources();
    renderCalculationOperations();
    renderCalculationFlow();
    
    if (!isEdit) {
        setTimeout(() => {
            document.getElementById("calc-name-input").focus();
        }, 100);
    }
}

function addTemplateCalculation() {
    const templates = [
        {
            name: "Posts per User",
            description: "Count how many posts each user has made",
            flow: [
                { type: "source", sourceName: "posts", sourceUrl: "" },
                { type: "group", label: "Group By", config: { field: "userID", outputFormat: "array" } },
                { type: "count", label: "Count", config: { countType: "items_per_group" } }
            ]
        },
        {
            name: "User Activity Summary", 
            description: "Detailed user statistics including post counts and averages",
            flow: [
                { type: "source", sourceName: "posts", sourceUrl: "" },
                { type: "group", label: "Group By", config: { field: "userID", outputFormat: "array" } },
                { type: "aggregate", label: "Aggregate", config: { 
                    operations: [
                        { type: "count", field: "", alias: "post_count" },
                        { type: "avg", field: "likes", alias: "avg_likes" },
                        { type: "sum", field: "views", alias: "total_views" }
                    ]
                }}
            ]
        },
        {
            name: "Top Content",
            description: "Find top performing content by engagement",
            flow: [
                { type: "source", sourceName: "posts", sourceUrl: "" },
                { type: "filter", label: "Filter", config: { field: "status", operator: "equals", value: "published" } },
                { type: "sort", label: "Sort", config: { field: "engagement_score", direction: "desc" } },
                { type: "limit", label: "Limit", config: { count: 10 } }
            ]
        }
    ];
    
    showTemplateModal(templates);
}

function showTemplateModal(templates) {
    const modal = document.getElementById("customization-modal");
    const title = document.getElementById("modal-title");
    const content = document.getElementById("modal-content");
    
    title.textContent = "Choose a Template";
    content.innerHTML = `
        <div class="space-y-4">
            ${templates.map((template, index) => `
                <div class="border border-gray-200 dark:border-gray-700 rounded p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                     onclick="applyTemplate(${index})">
                    <h4 class="font-semibold text-gray-900 dark:text-white">${template.name}</h4>
                    <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">${template.description}</p>
                    <div class="text-xs text-blue-600 dark:text-blue-400 mt-2">
                        ${template.flow.length} steps: ${template.flow.map(step => step.label || step.type).join(' → ')}
                    </div>
                </div>
            `).join('')}
        </div>
        <div class="mt-6 flex justify-end gap-2">
            <button class="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded" onclick="closeCustomizationModal()">
                Cancel
            </button>
        </div>
    `;
    
    window.templateList = templates;
    modal.classList.remove("hidden");
}

function applyTemplate(index) {
    const template = window.templateList[index];
    if (!template) return;
    
    document.getElementById("calc-name-input").value = template.name;
    document.getElementById("calc-description-input").value = template.description;
    
    // FIXED: Properly apply template flow with all configurations
    window.currentCalcFlow = template.flow.map(step => {
        if (step.type === "source" && subroutes.length > 0) {
            const matchingRoute = subroutes.find(route => 
                route[1].toLowerCase().includes(step.sourceName.toLowerCase())
            ) || subroutes[0];
            
            return {
                ...step,
                sourceName: matchingRoute[1],
                sourceUrl: dashboardSource[3] + matchingRoute[1]
            };
        }
        
        // FIXED: Ensure config is properly deep-cloned
        return {
            ...step,
            config: step.config ? JSON.parse(JSON.stringify(step.config)) : undefined
        };
    });
    
    console.log("Applied template flow:", window.currentCalcFlow);
    
    renderCalculationFlow();
    closeCustomizationModal();
}


function cancelCalculationBuilder() {
    window.currentCalcFlow = [];
    window.currentCalcName = "";
    window.currentCalcDescription = "";
    window.currentCalcId = null;
    renderCalculationsList();
}

function renderCalculationDataSources() {
    const e = document.getElementById("calc-datasource-list");
    e.innerHTML = "";
    
    subroutes.forEach((t, n) => {
        const r = document.createElement("button");
        r.className = "draggable-ds bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded shadow hover:bg-blue-100 dark:hover:bg-blue-800 text-gray-800 dark:text-white w-full text-left transition-colors";
        r.draggable = true;
        r.textContent = t[1];
        r.dataset.subrouteIdx = n;
        r.addEventListener("dragstart", function(e) {
            e.dataTransfer.setData("text/plain", JSON.stringify({ subrouteIdx: n }));
        });
        e.appendChild(r);
    });
}

function renderCalculationOperations() {
    const e = document.getElementById("calc-operations-list");
    e.innerHTML = "";
    
    const operations = [
        { type: "filter", label: "Filter", desc: "Filter data by field/value conditions" },
        { type: "group", label: "Group By", desc: "Group data by field values" },
        { type: "count", label: "Count", desc: "Count items or groups" },
        { type: "sum", label: "Sum", desc: "Sum numeric field values" },
        { type: "aggregate", label: "Aggregate", desc: "Multiple aggregations (count, sum, avg, etc.)" },
        { type: "sort", label: "Sort", desc: "Sort data by field values" },
        { type: "limit", label: "Limit", desc: "Limit number of results" },
        { type: "join", label: "Join", desc: "Join with another data source" },
        { type: "map", label: "Map", desc: "Transform/rename fields" },
        { type: "distinct", label: "Distinct", desc: "Get unique values" },
        { type: "calculate", label: "Calculate", desc: "Create calculated fields" }
    ];
    
    operations.forEach(t => {
        const n = document.createElement("button");
        n.className = "draggable-op bg-blue-100 dark:bg-blue-800 px-3 py-2 rounded shadow hover:bg-blue-200 dark:hover:bg-blue-900 text-blue-900 dark:text-blue-200 transition-colors text-sm";
        n.draggable = true;
        n.textContent = t.label;
        n.title = t.desc;
        n.dataset.opType = t.type;
        n.addEventListener("dragstart", handleCalcDragStart);
        e.appendChild(n);
    });
}

function handleCalcDragStart(e) {
    e.dataTransfer.setData("text/plain", JSON.stringify({
        dsIdx: e.target.dataset.dsIdx,
        opType: e.target.dataset.opType
    }));
}

function handleCalcDrop(e) {
    e.preventDefault();
    const data = JSON.parse(e.dataTransfer.getData("text/plain"));
    
    window.currentCalcFlow = window.currentCalcFlow || [];
    
    if (data.subrouteIdx !== undefined) {
        const route = subroutes[data.subrouteIdx];
        window.currentCalcFlow.push({
            type: "source",
            sourceName: route[1],
            sourceUrl: dashboardSource[3] + route[1]
        });
    } else if (data.opType) {
        let inputs = [];
        if (window.currentCalcFlow.length > 0) {
            inputs.push(window.currentCalcFlow[window.currentCalcFlow.length - 1]);
        }
        
        // FIXED: Don't add empty config object - let it be undefined initially
        const newStep = {
            type: data.opType,
            label: data.opType.charAt(0).toUpperCase() + data.opType.slice(1),
            inputs: inputs
        };
        
        window.currentCalcFlow.push(newStep);
    }
    
    renderCalculationFlow();
}


function renderCalculationFlow() {
    const e = document.getElementById("calc-flow-dropzone");
    e.innerHTML = "";
    e.addEventListener("dragover", (function(e) { e.preventDefault() }));
    e.addEventListener("drop", handleCalcDrop);
    window.currentCalcFlow = window.currentCalcFlow || [];
    
    if (window.currentCalcFlow.length === 0) {
        e.innerHTML = '<div class="text-gray-500 dark:text-gray-400 text-center w-full">Drag data sources and operations here to build your calculation</div>';
        return;
    }
    
    window.currentCalcFlow.forEach((step, index) => {
        const node = document.createElement("div");
        let nodeClasses = "calc-flow-node bg-white dark:bg-gray-700 border rounded px-4 py-3 flex flex-col items-center justify-center min-w-[120px] relative shadow-sm cursor-pointer";
        
        // Determine if step is configured
        const isConfigured = step.config && Object.keys(step.config).length > 0 && 
            Object.values(step.config).some(value => {
                if (Array.isArray(value)) return value.length > 0;
                if (typeof value === 'object' && value !== null) return Object.keys(value).length > 0;
                return value !== "" && value != null;
            });
        
        if (isConfigured) {
            nodeClasses += " border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20";
        } else if (step.type !== "source") {
            nodeClasses += " border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20";
        } else {
            nodeClasses += " border-blue-300 dark:border-blue-700";
        }
        
        node.className = nodeClasses;
        
        let displayText = step.label || step.type || step.sourceName;
        if (isConfigured) {
            displayText += " ✓";
        } else if (step.type !== "source") {
            displayText += " ⚠";
        }
        
        node.innerHTML = `<span class="font-semibold text-gray-900 dark:text-white text-center">${displayText}</span>`;
        
        // Show configuration summary for configured steps
        if (isConfigured && step.config) {
            let configSummary = "";
            switch(step.type) {
                case "filter":
                    configSummary = `${step.config.field} ${step.config.operator} ${step.config.value}`;
                    break;
                case "group":
                    configSummary = `by ${step.config.field}`;
                    break;
                case "sort":
                    configSummary = `by ${step.config.field} (${step.config.direction})`;
                    break;
                case "limit":
                    configSummary = `${step.config.count} items`;
                    break;
                case "aggregate":
                    configSummary = `${step.config.operations?.length || 0} ops`;
                    break;
                case "calculate":
                    configSummary = `${step.config.calculations?.length || 0} calcs`;
                    break;
                default:
                    configSummary = "configured";
            }
            if (configSummary) {
                node.innerHTML += `<div class="text-xs mt-1 text-gray-600 dark:text-gray-400 text-center">${configSummary}</div>`;
            }
        }
        
        if (step.type !== "source" && step.inputs && step.inputs.length) {
            node.innerHTML += `<div class="text-xs mt-2 text-gray-500 dark:text-gray-400 text-center">Inputs: ${step.inputs.map(e => e.sourceName || e.label || e.type).join(", ")}</div>`;
        }
        
        node.innerHTML += `<button class="absolute top-1 right-1 text-red-500 hover:text-red-700 w-6 h-6 flex items-center justify-center" onclick="removeCalcFlowStep(${index})" title="Remove step"><i class="fa fa-times"></i></button>`;
        
        node.onclick = function(event) {
            if (!event.target.closest("button")) {
                editCalcFlowNode(index);
            }
        };
        
        e.appendChild(node);
        
        if (index < window.currentCalcFlow.length - 1) {
            const arrow = document.createElement("div");
            arrow.className = "calc-flow-arrow flex items-center justify-center";
            arrow.innerHTML = '<span class="mx-2 text-blue-400 text-xl">→</span>';
            e.appendChild(arrow);
        }
    });
}

function removeCalcFlowStep(e) {
    window.currentCalcFlow = window.currentCalcFlow || [];
    window.currentCalcFlow.splice(e, 1);
    renderCalculationFlow();
}

function previewCalculationFlow() {
    executeCalculationFlow(false);
}

async function saveCalculationFlow() {
    const nameInput = document.getElementById("calc-name-input");
    const name = nameInput.value.trim();
    const description = document.getElementById("calc-description-input").value.trim();
    
    if (!name) {
        alert("Please enter a name for the calculation.");
        nameInput.focus();
        return;
    }
    
    const success = await executeCalculationFlow(true, name, description);
    if (success) {
        window.currentCalcFlow = [];
        window.currentCalcName = "";
        window.currentCalcDescription = "";
        window.currentCalcId = null;
        renderCalculationsList();
    }
}

async function executeCalculationFlow(save = false, name = "", description = "") {
    const previewDiv = document.getElementById("calc-flow-preview");
    let result = null;
    let error = null;

    try {
        if (!window.currentCalcFlow || window.currentCalcFlow.length === 0) {
            throw new Error("No flow defined");
        }

        let data = null;
        for (let i = 0; i < window.currentCalcFlow.length; i++) {
            const step = window.currentCalcFlow[i];
            
            if (step.type === "source") {
                try {
                    // Use cached fetch with 3 minute TTL for source data
                    const response = await cachedFetch(step.sourceUrl, {}, { 
                        ttl: 3 * 60 * 1000,
                        cacheKey: `source:${step.sourceName}:${step.sourceUrl}`
                    });
                    
                    if (!response.ok) {
                        throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
                    }
                    data = await response.json();
                } catch (fetchError) {
                    throw new Error(`Failed to fetch source data: ${fetchError.message}`);
                }
            } else {
                data = await processCalculationStep(step, data);
            }
        }
        result = data;
    } catch (err) {
        error = err.message;
        console.error("Error in executeCalculationFlow:", err);
    }

    const borderClass = error ? "border-red-200 bg-red-50 dark:bg-red-900/20" : "border-green-200 bg-green-50 dark:bg-green-900/20";
    
    previewDiv.innerHTML = `
        <div class="p-4 border rounded ${borderClass}">
            <strong class="text-gray-900 dark:text-white">Calculation Steps:</strong><br>
            ${window.currentCalcFlow.map((step, index) => `${index + 1}. ${step.label || step.type || step.sourceName}`).join('<br>')}
            ${error ? 
                `<div class="mt-4 text-red-600 dark:text-red-400"><strong>Error:</strong> ${error}</div>` :
                `<div class="mt-4">
                    <strong class="text-gray-900 dark:text-white">Result Preview:</strong>
                    <pre class="bg-white dark:bg-gray-900 p-2 rounded text-xs mt-2 border overflow-auto max-h-48">${JSON.stringify(result, null, 2)}</pre>
                </div>`
            }
        </div>
    `;

    if (!error && save) {
        dashboardState.calculations = dashboardState.calculations || {};
        const calcId = window.currentCalcId || "calc_" + Date.now();
        
        dashboardState.calculations[calcId] = {
            name: name,
            description: description,
            flow: JSON.parse(JSON.stringify(window.currentCalcFlow)),
            result: result,
            lastModified: Date.now()
        };
        
        return true;
    }

    return false;
}


// Enhanced calculation processing functions

async function processCalculationStep(step, data) {
    if (!data) {
        throw new Error("No input data for step: " + step.type);
    }
    
    switch (step.type) {
        case "filter":
            return processFilter(step, data);
        case "group":
            return processGroupBy(step, data);
        case "count":
            return processCount(step, data);
        case "sum":
            return processSum(step, data);
        case "aggregate":
            return processAggregate(step, data);
        case "sort":
            return processSort(step, data);
        case "limit":
            return processLimit(step, data);
        case "join":
            return processJoin(step, data);
        case "map":
            return processMap(step, data);
        case "distinct":
            return processDistinct(step, data);
        case "calculate":
            return processCalculate(step, data);
        default:
            throw new Error("Unknown step type: " + step.type);
    }
}

function processFilter(step, data) {
    const config = step.config || {};
    if (!config.field || config.value === undefined) {
        throw new Error("Filter step requires field and value configuration");
    }
    
    if (!Array.isArray(data)) {
        throw new Error("Filter step requires array input");
    }
    
    return data.filter(item => {
        const value = item[config.field];
        const targetValue = config.value;
        
        switch (config.operator || "equals") {
            case "equals":
                return value == targetValue;
            case "not_equals":
                return value != targetValue;
            case "greater_than":
                return Number(value) > Number(targetValue);
            case "less_than":
                return Number(value) < Number(targetValue);
            case "greater_equal":
                return Number(value) >= Number(targetValue);
            case "less_equal":
                return Number(value) <= Number(targetValue);
            case "contains":
                return String(value).toLowerCase().includes(String(targetValue).toLowerCase());
            case "starts_with":
                return String(value).toLowerCase().startsWith(String(targetValue).toLowerCase());
            case "ends_with":
                return String(value).toLowerCase().endsWith(String(targetValue).toLowerCase());
            case "is_null":
                return value === null || value === undefined;
            case "is_not_null":
                return value !== null && value !== undefined;
            default:
                return value == targetValue;
        }
    });
}

function processGroupBy(step, data) {
    const config = step.config || {};
    if (!config.field) {
        throw new Error("Group By step requires field configuration");
    }
    
    if (!Array.isArray(data)) {
        throw new Error("Group By step requires array input");
    }
    
    const groups = {};
    data.forEach(item => {
        const key = item[config.field];
        if (!groups[key]) {
            groups[key] = [];
        }
        groups[key].push(item);
    });
    
    if (config.outputFormat === "array") {
        return Object.entries(groups).map(([key, items]) => ({
            [config.field]: key,
            items: items,
            count: items.length
        }));
    }
    
    return groups;
}

function processCount(step, data) {
    const config = step.config || {};
    
    if (Array.isArray(data)) {
        return data.length;
    }
    
    if (typeof data === "object" && data !== null) {
        if (config.countType === "groups") {
            return Object.keys(data).length;
        } else if (config.countType === "items_per_group") {
            const result = {};
            Object.entries(data).forEach(([key, value]) => {
                if (Array.isArray(value)) {
                    result[key] = value.length;
                }
            });
            return result;
        }
        
        // Total items across all groups
        return Object.values(data).reduce((sum, group) => {
            return sum + (Array.isArray(group) ? group.length : 0);
        }, 0);
    }
    
    return 0;
}

function processSum(step, data) {
    const config = step.config || {};
    
    if (!Array.isArray(data)) {
        throw new Error("Sum step requires array input");
    }
    
    if (data.length === 0) return 0;
    
    let field = config.field;
    if (!field) {
        // Auto-detect numeric field
        field = Object.keys(data[0]).find(key => typeof data[0][key] === "number");
        if (!field) {
            throw new Error("Sum step requires numeric field configuration");
        }
    }
    
    return data.reduce((sum, item) => sum + (Number(item[field]) || 0), 0);
}

function processAggregate(step, data) {
    const config = step.config || {};
    const operations = config.operations || [];
    
    if (!Array.isArray(data)) {
        throw new Error("Aggregate step requires array input");
    }
    
    // Check if data is grouped format (array of group objects)
    const isGrouped = data.length > 0 && data[0].items && Array.isArray(data[0].items);
    
    if (isGrouped) {
        // Process each group
        return data.map(group => {
            const result = { ...group };
            delete result.items; // Remove items array from final result
            
            operations.forEach(op => {
                const alias = op.alias || `${op.type}_${op.field || 'value'}`;
                
                switch (op.type) {
                    case "count":
                        result[alias] = group.items.length;
                        break;
                    case "sum":
                        result[alias] = group.items.reduce((sum, item) => 
                            sum + (Number(item[op.field]) || 0), 0);
                        break;
                    case "avg":
                        const sumVal = group.items.reduce((sum, item) => 
                            sum + (Number(item[op.field]) || 0), 0);
                        result[alias] = group.items.length > 0 ? sumVal / group.items.length : 0;
                        break;
                    case "min":
                        result[alias] = Math.min(...group.items.map(item => Number(item[op.field]) || 0));
                        break;
                    case "max":
                        result[alias] = Math.max(...group.items.map(item => Number(item[op.field]) || 0));
                        break;
                    case "distinct_count":
                        const uniqueValues = new Set(group.items.map(item => item[op.field]));
                        result[alias] = uniqueValues.size;
                        break;
                }
            });
            
            return result;
        });
    } else {
        // Process entire dataset
        const result = {};
        
        operations.forEach(op => {
            const alias = op.alias || `${op.type}_${op.field || 'value'}`;
            
            switch (op.type) {
                case "count":
                    result[alias] = data.length;
                    break;
                case "sum":
                    result[alias] = data.reduce((sum, item) => 
                        sum + (Number(item[op.field]) || 0), 0);
                    break;
                case "avg":
                    const sumVal = data.reduce((sum, item) => 
                        sum + (Number(item[op.field]) || 0), 0);
                    result[alias] = data.length > 0 ? sumVal / data.length : 0;
                    break;
                case "min":
                    result[alias] = Math.min(...data.map(item => Number(item[op.field]) || 0));
                    break;
                case "max":
                    result[alias] = Math.max(...data.map(item => Number(item[op.field]) || 0));
                    break;
                case "distinct_count":
                    const uniqueValues = new Set(data.map(item => item[op.field]));
                    result[alias] = uniqueValues.size;
                    break;
            }
        });
        
        return result;
    }
}

function processSort(step, data) {
    const config = step.config || {};
    if (!config.field) {
        throw new Error("Sort step requires field configuration");
    }
    
    if (!Array.isArray(data)) {
        throw new Error("Sort step requires array input");
    }
    
    const direction = config.direction || "asc";
    
    return [...data].sort((a, b) => {
        const aVal = a[config.field];
        const bVal = b[config.field];
        
        // Handle different data types
        if (typeof aVal === "number" && typeof bVal === "number") {
            return direction === "asc" ? aVal - bVal : bVal - aVal;
        }
        
        // String comparison
        const aStr = String(aVal).toLowerCase();
        const bStr = String(bVal).toLowerCase();
        
        if (direction === "asc") {
            return aStr.localeCompare(bStr);
        } else {
            return bStr.localeCompare(aStr);
        }
    });
}

function processLimit(step, data) {
    const config = step.config || {};
    const count = config.count || 10;
    const offset = config.offset || 0;
    
    if (!Array.isArray(data)) {
        throw new Error("Limit step requires array input");
    }
    
    return data.slice(offset, offset + count);
}

function processDistinct(step, data) {
    const config = step.config || {};
    
    if (!Array.isArray(data)) {
        throw new Error("Distinct step requires array input");
    }
    
    if (config.field) {
        // Get distinct values for a specific field
        const seen = new Set();
        return data.filter(item => {
            const value = item[config.field];
            if (seen.has(value)) {
                return false;
            }
            seen.add(value);
            return true;
        });
    } else {
        // Get distinct entire objects (using JSON serialization)
        const seen = new Set();
        return data.filter(item => {
            const serialized = JSON.stringify(item);
            if (seen.has(serialized)) {
                return false;
            }
            seen.add(serialized);
            return true;
        });
    }
}

function processCalculate(step, data) {
    const config = step.config || {};
    const calculations = config.calculations || [];
    
    if (!Array.isArray(data)) {
        throw new Error("Calculate step requires array input");
    }
    
    return data.map(item => {
        const newItem = { ...item };
        
        calculations.forEach(calc => {
            const { field, expression, alias } = calc;
            const targetField = alias || field;
            
            try {
                // Simple expression evaluation
                // Support basic math operations and field references
                let result = expression;
                
                // Replace field references with actual values
                Object.keys(item).forEach(key => {
                    const value = Number(item[key]) || 0;
                    result = result.replace(new RegExp(`\\b${key}\\b`, 'g'), value);
                });
                
                // Evaluate simple math expressions
                // Note: In production, use a proper expression parser for security
                result = Function('"use strict"; return (' + result + ')')();
                newItem[targetField] = result;
            } catch (e) {
                console.warn(`Error calculating field ${targetField}:`, e);
                newItem[targetField] = null;
            }
        });
        
        return newItem;
    });
}

function processMap(step, data) {
    const config = step.config || {};
    if (!config.mapping) {
        throw new Error("Map step requires mapping configuration");
    }
    
    if (!Array.isArray(data)) {
        throw new Error("Map step requires array input");
    }
    
    return data.map(item => {
        const mapped = {};
        Object.entries(config.mapping).forEach(([newField, oldField]) => {
            mapped[newField] = item[oldField];
        });
        return mapped;
    });
}

async function processJoin(step, inputData) {
    const config = step.config || {};
    
    if (!config.joinField || config.joinSource === undefined) {
        throw new Error("Join step requires joinField and joinSource configuration");
    }
    
    if (!Array.isArray(inputData)) {
        throw new Error("Join step requires array input");
    }

    const joinSubroute = subroutes[config.joinSource];
    if (!joinSubroute) {
        throw new Error("Invalid join source");
    }

    const joinUrl = dashboardSource[3] + joinSubroute[1];
    
    try {
        // Use cached fetch for join data
        const response = await cachedFetch(joinUrl, {}, { 
            ttl: 5 * 60 * 1000,
            cacheKey: `join:${joinSubroute[1]}:${joinUrl}`
        });
        
        if (!response.ok) {
            throw new Error("Failed to fetch join data: " + response.status);
        }
        
        const joinData = await response.json();
        
        if (!Array.isArray(joinData)) {
            throw new Error("Join data must be an array");
        }

        const joinType = config.joinType || "inner";
        const joinField = config.joinField;
        const result = [];

        inputData.forEach(leftItem => {
            const matches = joinData.filter(rightItem => leftItem[joinField] === rightItem[joinField]);
            
            if (matches.length > 0) {
                matches.forEach(match => {
                    result.push({ ...leftItem, ...match });
                });
            } else if (joinType === "left") {
                result.push(leftItem);
            }
        });

        if (joinType === "right") {
            joinData.forEach(rightItem => {
                const hasMatch = inputData.some(leftItem => leftItem[joinField] === rightItem[joinField]);
                if (!hasMatch) {
                    result.push(rightItem);
                }
            });
        }

        return result;
    } catch (error) {
        throw new Error(`Join operation failed: ${error.message}`);
    }
}

// Enhanced node configuration functions

function editCalcFlowNode(index) {
    const step = window.currentCalcFlow[index];
    if (step && step.type !== "source") {
        showNodeConfigModal(step, index);
    }
}

async function showNodeConfigModal(step, stepIndex) {
    let inputData = null;
    try {
        if (stepIndex > 0) {
            inputData = await getInputDataForStep(stepIndex);
        }
    } catch (e) {
        console.error("Error getting input data:", e);
    }
    
    const modal = document.getElementById("customization-modal");
    const title = document.getElementById("modal-title");
    const content = document.getElementById("modal-content");
    
    title.textContent = "Configure " + (step.label || step.type);
    
    window.currentEditingStep = {
        step: step,
        stepIndex: stepIndex,
        inputData: inputData
    };
    
    content.innerHTML = generateNodeConfigForm(step, inputData);
    modal.classList.remove("hidden");
}

async function getInputDataForStep(stepIndex) {
    let data = null;
    
    for (let i = 0; i < stepIndex; i++) {
        const step = window.currentCalcFlow[i];
        
        if (step.type === "source") {
            try {
                // Use cached fetch for input data
                const response = await cachedFetch(step.sourceUrl, {}, { 
                    ttl: 3 * 60 * 1000,
                    cacheKey: `input:${step.sourceName}:${step.sourceUrl}`
                });
                
                if (!response.ok) {
                    throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
                }
                data = await response.json();
            } catch (error) {
                throw new Error(`Failed to fetch source data: ${error.message}`);
            }
        } else {
            data = await processCalculationStep(step, data);
        }
    }
    
    return data;
}

function generateNodeConfigForm(step, inputData) {
    const config = step.config || {};
    
    switch (step.type) {
        case "filter":
            return generateFilterForm(config, inputData);
        case "group":
            return generateGroupByForm(config, inputData);
        case "count":
            return generateCountForm(config, inputData);
        case "sum":
            return generateSumForm(config, inputData);
        case "aggregate":
            return generateAggregateForm(config, inputData);
        case "sort":
            return generateSortForm(config, inputData);
        case "limit":
            return generateLimitForm(config, inputData);
        case "join":
            return generateJoinForm(config, inputData);
        case "map":
            return generateMapForm(config, inputData);
        case "distinct":
            return generateDistinctForm(config, inputData);
        case "calculate":
            return generateCalculateForm(config, inputData);
        default:
            return "<p>No configuration needed for this step.</p>";
    }
}

function generateAggregateForm(config, inputData) {
    const fields = inputData && Array.isArray(inputData) && inputData.length > 0 ? 
        Object.keys(inputData[0]) : [];
    const operations = config.operations || [];
    
    return `
        <div class="grid grid-cols-2 gap-4">
            <div>
                <h4 class="font-semibold mb-2 text-gray-900 dark:text-white">Input Data Preview</h4>
                <pre class="bg-gray-100 dark:bg-gray-900 p-2 rounded text-xs max-h-48 overflow-auto">${inputData ? JSON.stringify(inputData.slice(0, 3), null, 2) : "No data"}</pre>
            </div>
            <div>
                <h4 class="font-semibold mb-2 text-gray-900 dark:text-white">Aggregation Operations</h4>
                <div id="aggregate-operations" class="space-y-3 mb-4">
                    ${operations.map((op, index) => `
                        <div class="border border-gray-200 dark:border-gray-600 rounded p-3">
                            <div class="grid grid-cols-3 gap-2">
                                <select class="operation-type px-2 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white text-sm">
                                    <option value="count" ${op.type === "count" ? "selected" : ""}>Count</option>
                                    <option value="sum" ${op.type === "sum" ? "selected" : ""}>Sum</option>
                                    <option value="avg" ${op.type === "avg" ? "selected" : ""}>Average</option>
                                    <option value="min" ${op.type === "min" ? "selected" : ""}>Minimum</option>
                                    <option value="max" ${op.type === "max" ? "selected" : ""}>Maximum</option>
                                    <option value="distinct_count" ${op.type === "distinct_count" ? "selected" : ""}>Distinct Count</option>
                                </select>
                                <select class="operation-field px-2 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white text-sm">
                                    <option value="">Select field...</option>
                                    ${fields.map(field => `<option value="${field}" ${op.field === field ? "selected" : ""}>${field}</option>`).join("")}
                                </select>
                                <input type="text" placeholder="Alias (optional)" value="${op.alias || ""}" 
                                       class="operation-alias px-2 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white text-sm">
                            </div>
                            <button type="button" onclick="removeAggregateOperation(${index})" class="mt-2 text-red-500 hover:text-red-700 text-sm">
                                <i class="fa fa-trash mr-1"></i>Remove
                            </button>
                        </div>
                    `).join("")}
                </div>
                <button type="button" onclick="addAggregateOperation()" class="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
                    <i class="fa fa-plus mr-1"></i>Add Operation
                </button>
                <div class="mt-4">
                    <h5 class="font-medium mb-2 text-gray-900 dark:text-white">Preview Result</h5>
                    <div id="node-preview" class="bg-gray-100 dark:bg-gray-900 p-2 rounded text-xs max-h-32 overflow-auto">Configure operations to see preview</div>
                </div>
            </div>
        </div>
    `;
}

function generateSortForm(config, inputData) {
    const fields = inputData && Array.isArray(inputData) && inputData.length > 0 ? 
        Object.keys(inputData[0]) : [];
    
    return `
        <div class="grid grid-cols-2 gap-4">
            <div>
                <h4 class="font-semibold mb-2 text-gray-900 dark:text-white">Input Data Preview</h4>
                <pre class="bg-gray-100 dark:bg-gray-900 p-2 rounded text-xs max-h-48 overflow-auto">${inputData ? JSON.stringify(inputData.slice(0, 3), null, 2) : "No data"}</pre>
            </div>
            <div>
                <h4 class="font-semibold mb-2 text-gray-900 dark:text-white">Configuration</h4>
                <div class="space-y-3">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sort Field</label>
                        <select id="sort-field" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white">
                            <option value="">Select field...</option>
                            ${fields.map(field => `<option value="${field}" ${config.field === field ? "selected" : ""}>${field}</option>`).join("")}
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Direction</label>
                        <select id="sort-direction" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white">
                            <option value="asc" ${config.direction === "asc" ? "selected" : ""}>Ascending</option>
                            <option value="desc" ${config.direction === "desc" ? "selected" : ""}>Descending</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function generateLimitForm(config, inputData) {
    const dataLength = Array.isArray(inputData) ? inputData.length : 0;
    
    return `
        <div class="grid grid-cols-2 gap-4">
            <div>
                <h4 class="font-semibold mb-2 text-gray-900 dark:text-white">Input Data Preview</h4>
                <pre class="bg-gray-100 dark:bg-gray-900 p-2 rounded text-xs max-h-48 overflow-auto">${inputData ? JSON.stringify(inputData.slice(0, 3), null, 2) : "No data"}</pre>
                ${dataLength > 0 ? `<p class="text-xs text-blue-600 dark:text-blue-400 mt-1">Total items: ${dataLength}</p>` : ""}
            </div>
            <div>
                <h4 class="font-semibold mb-2 text-gray-900 dark:text-white">Configuration</h4>
                <div class="space-y-3">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Limit Count</label>
                        <input type="number" id="limit-count" value="${config.count || 10}" min="1"
                               class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Offset (skip items)</label>
                        <input type="number" id="limit-offset" value="${config.offset || 0}" min="0"
                               class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white">
                    </div>
                </div>
            </div>
        </div>
    `;
}

function generateDistinctForm(config, inputData) {
    const fields = inputData && Array.isArray(inputData) && inputData.length > 0 ? 
        Object.keys(inputData[0]) : [];
    
    return `
        <div class="grid grid-cols-2 gap-4">
            <div>
                <h4 class="font-semibold mb-2 text-gray-900 dark:text-white">Input Data Preview</h4>
                <pre class="bg-gray-100 dark:bg-gray-900 p-2 rounded text-xs max-h-48 overflow-auto">${inputData ? JSON.stringify(inputData.slice(0, 3), null, 2) : "No data"}</pre>
            </div>
            <div>
                <h4 class="font-semibold mb-2 text-gray-900 dark:text-white">Configuration</h4>
                <div class="space-y-3">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Distinct Field</label>
                        <select id="distinct-field" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white">
                            <option value="">Entire object</option>
                            ${fields.map(field => `<option value="${field}" ${config.field === field ? "selected" : ""}>${field}</option>`).join("")}
                        </select>
                        <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Select a field to get unique values for that field, or leave empty for unique entire objects.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function generateCalculateForm(config, inputData) {
    const fields = inputData && Array.isArray(inputData) && inputData.length > 0 ? 
        Object.keys(inputData[0]) : [];
    const calculations = config.calculations || [];
    
    return `
        <div class="grid grid-cols-2 gap-4">
            <div>
                <h4 class="font-semibold mb-2 text-gray-900 dark:text-white">Input Data Preview</h4>
                <pre class="bg-gray-100 dark:bg-gray-900 p-2 rounded text-xs max-h-48 overflow-auto">${inputData ? JSON.stringify(inputData.slice(0, 3), null, 2) : "No data"}</pre>
                <div class="mt-2 text-xs text-gray-600 dark:text-gray-400">
                    <strong>Available fields:</strong> ${fields.join(", ")}
                </div>
            </div>
            <div>
                <h4 class="font-semibold mb-2 text-gray-900 dark:text-white">Calculated Fields</h4>
                <div id="calculated-fields" class="space-y-3 mb-4">
                    ${calculations.map((calc, index) => `
                        <div class="border border-gray-200 dark:border-gray-600 rounded p-3">
                            <div class="space-y-2">
                                <input type="text" placeholder="Field name" value="${calc.field || ""}" 
                                       class="calc-field w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white text-sm">
                                <input type="text" placeholder="Expression (e.g., price * quantity)" value="${calc.expression || ""}" 
                                       class="calc-expression w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white text-sm">
                                <input type="text" placeholder="Alias (optional)" value="${calc.alias || ""}" 
                                       class="calc-alias w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white text-sm">
                            </div>
                            <button type="button" onclick="removeCalculatedField(${index})" class="mt-2 text-red-500 hover:text-red-700 text-sm">
                                <i class="fa fa-trash mr-1"></i>Remove
                            </button>
                        </div>
                    `).join("")}
                </div>
                <button type="button" onclick="addCalculatedField()" class="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
                    <i class="fa fa-plus mr-1"></i>Add Calculation
                </button>
                <div class="mt-4">
                    <p class="text-xs text-gray-500 dark:text-gray-400">
                        Use field names in expressions. Supports +, -, *, /, parentheses.
                        Example: <code>price * quantity</code> or <code>(likes + shares) / views</code>
                    </p>
                </div>
            </div>
        </div>
    `;
}

// Helper functions for dynamic form management

function addAggregateOperation() {
    const container = document.getElementById("aggregate-operations");
    const fields = window.currentEditingStep.inputData && 
        Array.isArray(window.currentEditingStep.inputData) && 
        window.currentEditingStep.inputData.length > 0 ? 
        Object.keys(window.currentEditingStep.inputData[0]) : [];
    
    const index = container.children.length;
    const div = document.createElement("div");
    div.className = "border border-gray-200 dark:border-gray-600 rounded p-3";
    div.innerHTML = `
        <div class="grid grid-cols-3 gap-2">
            <select class="operation-type px-2 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white text-sm">
                <option value="count">Count</option>
                <option value="sum">Sum</option>
                <option value="avg">Average</option>
                <option value="min">Minimum</option>
                <option value="max">Maximum</option>
                <option value="distinct_count">Distinct Count</option>
            </select>
            <select class="operation-field px-2 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white text-sm">
                <option value="">Select field...</option>
                ${fields.map(field => `<option value="${field}">${field}</option>`).join("")}
            </select>
            <input type="text" placeholder="Alias (optional)" value="" 
                   class="operation-alias px-2 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white text-sm">
        </div>
        <button type="button" onclick="this.parentElement.remove()" class="mt-2 text-red-500 hover:text-red-700 text-sm">
            <i class="fa fa-trash mr-1"></i>Remove
        </button>
    `;
    container.appendChild(div);
}

function removeAggregateOperation(index) {
    const operations = document.querySelectorAll("#aggregate-operations > div");
    if (operations[index]) {
        operations[index].remove();
    }
}

function addCalculatedField() {
    const container = document.getElementById("calculated-fields");
    const div = document.createElement("div");
    div.className = "border border-gray-200 dark:border-gray-600 rounded p-3";
    div.innerHTML = `
        <div class="space-y-2">
            <input type="text" placeholder="Field name" value="" 
                   class="calc-field w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white text-sm">
            <input type="text" placeholder="Expression (e.g., price * quantity)" value="" 
                   class="calc-expression w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white text-sm">
            <input type="text" placeholder="Alias (optional)" value="" 
                   class="calc-alias w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white text-sm">
        </div>
        <button type="button" onclick="this.parentElement.remove()" class="mt-2 text-red-500 hover:text-red-700 text-sm">
            <i class="fa fa-trash mr-1"></i>Remove
        </button>
    `;
    container.appendChild(div);
}

function removeCalculatedField(index) {
    const fields = document.querySelectorAll("#calculated-fields > div");
    if (fields[index]) {
        fields[index].remove();
    }
}

// Enhanced configuration application

function closeCustomizationModal() {
    document.getElementById("customization-modal").classList.add("hidden");
    window.currentEditingStep = null;
}

function applyCalcCustomization(){
    if(!window.currentEditingStep) return;
    
    const {step, stepIndex} = window.currentEditingStep;
    const config = {};
    
    switch(step.type) {
        case "filter":
            config.field = document.getElementById("filter-field").value;
            config.operator = document.getElementById("filter-operator").value;
            config.value = document.getElementById("filter-value").value;
            break;
            
        case "group":
            config.field = document.getElementById("group-field").value;
            config.outputFormat = document.getElementById("group-output-format").value;
            break;
            
        case "count":
            // FIX: This was the problem - the count-type element wasn't being found properly
            const countTypeElement = document.getElementById("count-type");
            if (countTypeElement) {
                config.countType = countTypeElement.value;
            }
            // Add a fallback for when there's no count-type selector (for simple arrays)
            else {
                config.countType = "items"; // default for array counting
            }
            break;
            
        case "sum":
            config.field = document.getElementById("sum-field").value;
            break;
            
        case "aggregate":
            const operations = [];
            document.querySelectorAll("#aggregate-operations > div").forEach(opDiv => {
                const type = opDiv.querySelector(".operation-type").value;
                const field = opDiv.querySelector(".operation-field").value;
                const alias = opDiv.querySelector(".operation-alias").value;
                if (type) {
                    operations.push({
                        type: type,
                        field: field || undefined,
                        alias: alias || undefined
                    });
                }
            });
            config.operations = operations;
            break;
            
        case "sort":
            config.field = document.getElementById("sort-field").value;
            config.direction = document.getElementById("sort-direction").value;
            break;
            
        case "limit":
            config.count = parseInt(document.getElementById("limit-count").value) || 10;
            config.offset = parseInt(document.getElementById("limit-offset").value) || 0;
            break;
            
        case "distinct":
            config.field = document.getElementById("distinct-field").value || undefined;
            break;
            
        case "calculate":
            const calculations = [];
            document.querySelectorAll("#calculated-fields > div").forEach(calcDiv => {
                const field = calcDiv.querySelector(".calc-field").value;
                const expression = calcDiv.querySelector(".calc-expression").value;
                const alias = calcDiv.querySelector(".calc-alias").value;
                if (field && expression) {
                    calculations.push({
                        field: field,
                        expression: expression,
                        alias: alias || undefined
                    });
                }
            });
            config.calculations = calculations;
            break;
            
        case "join":
            config.joinField = document.getElementById("join-field").value;
            config.joinSource = parseInt(document.getElementById("join-source").value);
            config.joinType = document.getElementById("join-type").value;
            break;
            
        case "map":
            const mapping = {};
            const newFields = document.querySelectorAll(".field-mapping-new");
            const oldFields = document.querySelectorAll(".field-mapping-old");
            newFields.forEach((newField, index) => {
                const oldField = oldFields[index];
                if (newField.value && oldField.value) {
                    mapping[newField.value] = oldField.value;
                }
            });
            config.mapping = mapping;
            break;
    }
    
    // Apply the config to the step
    window.currentCalcFlow[stepIndex].config = config;
    console.log("Applied config to step:", window.currentCalcFlow[stepIndex]);
    
    renderCalculationFlow();
    closeCustomizationModal();
}

// Keep existing form generation functions with enhancements

function generateFilterForm(config, inputData) {
    const fields = inputData && Array.isArray(inputData) && inputData.length > 0 ? 
        Object.keys(inputData[0]) : [];
    
    return `
        <div class="grid grid-cols-2 gap-4">
            <div>
                <h4 class="font-semibold mb-2 text-gray-900 dark:text-white">Input Data Preview</h4>
                <pre class="bg-gray-100 dark:bg-gray-900 p-2 rounded text-xs max-h-48 overflow-auto">${inputData ? JSON.stringify(inputData.slice(0, 3), null, 2) : "No data"}</pre>
            </div>
            <div>
                <h4 class="font-semibold mb-2 text-gray-900 dark:text-white">Configuration</h4>
                <div class="space-y-3">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Field</label>
                        <select id="filter-field" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white">
                            <option value="">Select field...</option>
                            ${fields.map(field => `<option value="${field}" ${config.field === field ? "selected" : ""}>${field}</option>`).join("")}
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Operator</label>
                        <select id="filter-operator" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white">
                            <option value="equals" ${config.operator === "equals" ? "selected" : ""}>Equals</option>
                            <option value="not_equals" ${config.operator === "not_equals" ? "selected" : ""}>Not Equals</option>
                            <option value="greater_than" ${config.operator === "greater_than" ? "selected" : ""}>Greater Than</option>
                            <option value="less_than" ${config.operator === "less_than" ? "selected" : ""}>Less Than</option>
                            <option value="greater_equal" ${config.operator === "greater_equal" ? "selected" : ""}>Greater or Equal</option>
                            <option value="less_equal" ${config.operator === "less_equal" ? "selected" : ""}>Less or Equal</option>
                            <option value="contains" ${config.operator === "contains" ? "selected" : ""}>Contains</option>
                            <option value="starts_with" ${config.operator === "starts_with" ? "selected" : ""}>Starts With</option>
                            <option value="ends_with" ${config.operator === "ends_with" ? "selected" : ""}>Ends With</option>
                            <option value="is_null" ${config.operator === "is_null" ? "selected" : ""}>Is Null</option>
                            <option value="is_not_null" ${config.operator === "is_not_null" ? "selected" : ""}>Is Not Null</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Value</label>
                        <input type="text" id="filter-value" value="${config.value || ""}" 
                               class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white" 
                               placeholder="Enter value...">
                    </div>
                </div>
                <div class="mt-4">
                    <h5 class="font-medium mb-2 text-gray-900 dark:text-white">Preview Result</h5>
                    <div id="node-preview" class="bg-gray-100 dark:bg-gray-900 p-2 rounded text-xs max-h-32 overflow-auto">Configure and preview will appear here</div>
                </div>
            </div>
        </div>
    `;
}

function generateGroupByForm(config, inputData) {
    const fields = inputData && Array.isArray(inputData) && inputData.length > 0 ? 
        Object.keys(inputData[0]) : [];
    
    return `
        <div class="grid grid-cols-2 gap-4">
            <div>
                <h4 class="font-semibold mb-2 text-gray-900 dark:text-white">Input Data Preview</h4>
                <pre class="bg-gray-100 dark:bg-gray-900 p-2 rounded text-xs max-h-48 overflow-auto">${inputData ? JSON.stringify(inputData.slice(0, 3), null, 2) : "No data"}</pre>
            </div>
            <div>
                <h4 class="font-semibold mb-2 text-gray-900 dark:text-white">Configuration</h4>
                <div class="space-y-3">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Group By Field</label>
                        <select id="group-field" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white">
                            <option value="">Select field...</option>
                            ${fields.map(field => `<option value="${field}" ${config.field === field ? "selected" : ""}>${field}</option>`).join("")}
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Output Format</label>
                        <select id="group-output-format" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white">
                            <option value="object" ${config.outputFormat === "object" ? "selected" : ""}>Object (key: items[])</option>
                            <option value="array" ${config.outputFormat === "array" ? "selected" : ""}>Array (with counts)</option>
                        </select>
                        <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Array format is better for further processing (counting, aggregating, etc.)
                        </p>
                    </div>
                </div>
                <div class="mt-4">
                    <h5 class="font-medium mb-2 text-gray-900 dark:text-white">Preview Result</h5>
                    <div id="node-preview" class="bg-gray-100 dark:bg-gray-900 p-2 rounded text-xs max-h-32 overflow-auto">Configure and preview will appear here</div>
                </div>
            </div>
        </div>
    `;
}

function generateCountForm(config, inputData) {
    const isGroupedData = inputData && typeof inputData === 'object' && !Array.isArray(inputData);
    const isArrayData = Array.isArray(inputData);
    
    return `
        <div class="grid grid-cols-2 gap-4">
            <div>
                <h4 class="font-semibold mb-2 text-gray-900 dark:text-white">Input Data Preview</h4>
                <pre class="bg-gray-100 dark:bg-gray-900 p-2 rounded text-xs max-h-48 overflow-auto">${inputData ? JSON.stringify(isArrayData ? inputData.slice(0,3) : Object.fromEntries(Object.entries(inputData).slice(0,3)), null, 2) : "No data"}</pre>
                ${isGroupedData ? '<p class="text-xs text-blue-600 dark:text-blue-400 mt-1">✓ Grouped data detected</p>' : ''}
                ${isArrayData ? '<p class="text-xs text-green-600 dark:text-green-400 mt-1">✓ Array data detected</p>' : ''}
            </div>
            <div>
                <h4 class="font-semibold mb-2 text-gray-900 dark:text-white">Configuration</h4>
                <div class="space-y-3">
                    ${isGroupedData ? `
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Count Type</label>
                        <select id="count-type" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white">
                            <option value="groups" ${config.countType === "groups" ? "selected" : ""}>Number of Groups</option>
                            <option value="items_per_group" ${config.countType === "items_per_group" ? "selected" : ""}>Items per Group</option>
                            <option value="total" ${config.countType === "total" ? "selected" : ""}>Total Items (all groups)</option>
                        </select>
                        <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            <div><strong>Groups:</strong> Count how many different groups</div>
                            <div><strong>Items per Group:</strong> Count items in each group (perfect for posts per user)</div>
                            <div><strong>Total:</strong> Count all items across groups</div>
                        </div>
                    </div>
                    ` : `
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Count Type</label>
                        <select id="count-type" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white">
                            <option value="items" ${config.countType === "items" ? "selected" : ""}>Count Array Items</option>
                        </select>
                        <div class="bg-blue-50 dark:bg-blue-900/20 p-3 rounded mt-2">
                            <p class="text-sm text-blue-800 dark:text-blue-200">
                                <i class="fa fa-info-circle mr-1"></i>
                                This will count the number of items in the array.
                            </p>
                        </div>
                    </div>
                    `}
                </div>
                <div class="mt-4">
                    <h5 class="font-medium mb-2 text-gray-900 dark:text-white">Preview Result</h5>
                    <div id="node-preview" class="bg-gray-100 dark:bg-gray-900 p-2 rounded text-xs max-h-32 overflow-auto">Configure and preview will appear here</div>
                </div>
            </div>
        </div>
    `;
}

function generateSumForm(config, inputData) {
    const fields = inputData && Array.isArray(inputData) && inputData.length > 0 ? 
        Object.keys(inputData[0]).filter(key => typeof inputData[0][key] === "number") : [];
    
    return `
        <div class="grid grid-cols-2 gap-4">
            <div>
                <h4 class="font-semibold mb-2 text-gray-900 dark:text-white">Input Data Preview</h4>
                <pre class="bg-gray-100 dark:bg-gray-900 p-2 rounded text-xs max-h-48 overflow-auto">${inputData ? JSON.stringify(inputData.slice(0, 3), null, 2) : "No data"}</pre>
            </div>
            <div>
                <h4 class="font-semibold mb-2 text-gray-900 dark:text-white">Configuration</h4>
                <div class="space-y-3">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sum Field</label>
                        <select id="sum-field" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white">
                            <option value="">Auto-detect numeric field</option>
                            ${fields.map(field => `<option value="${field}" ${config.field === field ? "selected" : ""}>${field}</option>`).join("")}
                        </select>
                    </div>
                </div>
                <div class="mt-4">
                    <h5 class="font-medium mb-2 text-gray-900 dark:text-white">Preview Result</h5>
                    <div id="node-preview" class="bg-gray-100 dark:bg-gray-900 p-2 rounded text-xs max-h-32 overflow-auto">Configure and preview will appear here</div>
                </div>
            </div>
        </div>
    `;
}

function generateJoinForm(config, inputData) {
    const fields = inputData && Array.isArray(inputData) && inputData.length > 0 ? 
        Object.keys(inputData[0]) : [];
    
    return `
        <div class="grid grid-cols-2 gap-4">
            <div>
                <h4 class="font-semibold mb-2 text-gray-900 dark:text-white">Input Data Preview</h4>
                <pre class="bg-gray-100 dark:bg-gray-900 p-2 rounded text-xs max-h-48 overflow-auto">${inputData ? JSON.stringify(inputData.slice(0, 3), null, 2) : "No data"}</pre>
            </div>
            <div>
                <h4 class="font-semibold mb-2 text-gray-900 dark:text-white">Configuration</h4>
                <div class="space-y-3">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Join Field</label>
                        <select id="join-field" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white">
                            <option value="">Select field...</option>
                            ${fields.map(field => `<option value="${field}" ${config.joinField === field ? "selected" : ""}>${field}</option>`).join("")}
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Join Data Source</label>
                        <select id="join-source" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white">
                            <option value="">Select data source...</option>
                            ${subroutes.map((route, index) => `<option value="${index}" ${config.joinSource === index ? "selected" : ""}>${route[1]}</option>`).join("")}
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Join Type</label>
                        <select id="join-type" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white">
                            <option value="inner" ${config.joinType === "inner" ? "selected" : ""}>Inner Join</option>
                            <option value="left" ${config.joinType === "left" ? "selected" : ""}>Left Join</option>
                            <option value="right" ${config.joinType === "right" ? "selected" : ""}>Right Join</option>
                        </select>
                    </div>
                </div>
                <div class="mt-4">
                    <h5 class="font-medium mb-2 text-gray-900 dark:text-white">Preview Result</h5>
                    <div id="node-preview" class="bg-gray-100 dark:bg-gray-900 p-2 rounded text-xs max-h-32 overflow-auto">Configure and preview will appear here</div>
                </div>
            </div>
        </div>
    `;
}

function generateMapForm(config, inputData) {
    const fields = inputData && Array.isArray(inputData) && inputData.length > 0 ? 
        Object.keys(inputData[0]) : [];
    
    return `
        <div class="grid grid-cols-2 gap-4">
            <div>
                <h4 class="font-semibold mb-2 text-gray-900 dark:text-white">Input Data Preview</h4>
                <pre class="bg-gray-100 dark:bg-gray-900 p-2 rounded text-xs max-h-48 overflow-auto">${inputData ? JSON.stringify(inputData.slice(0, 3), null, 2) : "No data"}</pre>
            </div>
            <div>
                <h4 class="font-semibold mb-2 text-gray-900 dark:text-white">Configuration</h4>
                <div class="space-y-3">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Field Mapping</label>
                        <div id="field-mappings" class="space-y-2">
                            ${Object.entries(config.mapping || {}).map(([newField, oldField], index) => `
                                <div class="flex gap-2 items-center">
                                    <input type="text" placeholder="New field name" value="${newField}" 
                                           class="field-mapping-new flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white text-sm">
                                    <span class="text-gray-500">←</span>
                                    <select class="field-mapping-old flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white text-sm">
                                        <option value="">Select field...</option>
                                        ${fields.map(field => `<option value="${field}" ${oldField === field ? "selected" : ""}>${field}</option>`).join("")}
                                    </select>
                                    <button type="button" onclick="removeMapping(${index})" class="text-red-500 hover:text-red-700 p-1">
                                        <i class="fa fa-times"></i>
                                    </button>
                                </div>
                            `).join("")}
                        </div>
                        <button type="button" onclick="addMapping()" class="mt-2 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
                            <i class="fa fa-plus mr-1"></i>Add Mapping
                        </button>
                    </div>
                </div>
                <div class="mt-4">
                    <h5 class="font-medium mb-2 text-gray-900 dark:text-white">Preview Result</h5>
                    <div id="node-preview" class="bg-gray-100 dark:bg-gray-900 p-2 rounded text-xs max-h-32 overflow-auto">Configure and preview will appear here</div>
                </div>
            </div>
        </div>
    `;
}

function addMapping() {
    const container = document.getElementById("field-mappings");
    const fields = window.currentEditingStep.inputData && 
        Array.isArray(window.currentEditingStep.inputData) && 
        window.currentEditingStep.inputData.length > 0 ? 
        Object.keys(window.currentEditingStep.inputData[0]) : [];
    
    const div = document.createElement("div");
    div.className = "flex gap-2 items-center";
    div.innerHTML = `
        <input type="text" placeholder="New field name" value="" 
               class="field-mapping-new flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white text-sm">
        <span class="text-gray-500">←</span>
        <select class="field-mapping-old flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white text-sm">
            <option value="">Select field...</option>
            ${fields.map(field => `<option value="${field}">${field}</option>`).join("")}
        </select>
        <button type="button" onclick="this.parentElement.remove()" class="text-red-500 hover:text-red-700 p-1">
            <i class="fa fa-times"></i>
        </button>
    `;
    container.appendChild(div);
}

function removeMapping(index) {
    const mappings = document.querySelectorAll("#field-mappings > div");
    if (mappings[index]) {
        mappings[index].remove();
    }
}

function hideCalculationsPage() {
    document.getElementById("calculations-page").classList.add("hidden");
    document.getElementById("drop-zone").classList.remove("hidden");
    document.getElementById("right-sidebar").classList.remove("hidden");
}