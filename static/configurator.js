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

// Enhanced Modal Content for Calculated Fields
function generateCalculatedModalContent() {
    const sourceOptions = dashboardState.dataSources.map(source => 
        `<option value="${source[3]}">${source[2]}</option>`
    ).join("");
    
    return `
        <div class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Data Source</label>
                <select id="calc-source" class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white">
                    <option value="">Select a source...</option>
                    ${sourceOptions}
                </select>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Formula</label>
                <textarea id="calc-formula" class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white" rows="3" placeholder="e.g., SUM(data.amount) / COUNT(data)"></textarea>
                <div class="text-xs text-gray-500 mt-1">
                    Available functions: SUM(), AVG(), COUNT(), MIN(), MAX()<br>
                    Data access: dataSource.fieldName
                </div>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Label</label>
                <input type="text" id="calc-label" class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white" placeholder="e.g., Average Revenue">
            </div>
            <div>
                <button type="button" class="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm" onclick="testCalculation()">
                    Test Formula
                </button>
                <span id="calc-test-result" class="ml-2 text-sm text-gray-600 dark:text-gray-400"></span>
            </div>
        </div>
    `;
}

async function testCalculation() {
    const source = document.getElementById('calc-source').value;
    const formula = document.getElementById('calc-formula').value;
    const resultElement = document.getElementById('calc-test-result');
    
    if (!source || !formula) {
        resultElement.textContent = "Please select source and enter formula";
        return;
    }
    
    try {
        const calculation = createCalculatedField(formula, [{ name: 'data', url: source }]);
        const result = await calculation.calculate();
        resultElement.textContent = `Result: ${result}`;
        resultElement.className = "ml-2 text-sm text-green-600 dark:text-green-400";
    } catch (error) {
        resultElement.textContent = `Error: ${error.message}`;
        resultElement.className = "ml-2 text-sm text-red-600 dark:text-red-400";
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
            <button onclick="exportDashboard()" class="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm hover:cursor-pointer">
                <i class="fas fa-download mr-1"></i> Export
            </button>
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
    const sourceName = document.getElementById('stats-source').value;
    const leftSubroutePath = document.getElementById('stats-subroute-left').value;
    const rightSubroutePath = document.getElementById('stats-subroute-right').value;
    const leftField = document.getElementById('stats-left-field').value;
    const rightField = document.getElementById('stats-right-field').value;
    console.log(leftSubroutePath, rightSubroutePath)
    
    if (!sourceName || !leftSubroutePath || !rightSubroutePath) {
        alert('Please select both a source and endpoint');
        return;
    }
    
    // Find the source route
    const source = dashboardSource
    if (!source) {
        alert('Source not found');
        return;
    }
    
    // Construct the API URL
    const leftApiUrl = `${source[3]}${leftSubroutePath}`;
    const rightApiUrl = `${source[3]}${rightSubroutePath}`;
    
    try {
        const responseLeft = await fetch(leftApiUrl);
        if (!responseLeft.ok) {
            throw new Error(`HTTP error! status: ${responseLeft.status}`);
        }

        const responseRight = await fetch(rightApiUrl);
        if (!responseRight.ok) {
            throw new Error(`HTTP error! status: ${responseRight.status}`);
        }
        
        const leftData = await responseLeft.json();
        const rightData = await responseRight.json();
        console.log('Stats data fetched:', leftData, rightData);
        
        // Update the card content with fetched data
        updateStatsCard(currentCustomizingCard, leftData, rightData, leftField, rightField);
        
    } catch (error) {
        console.error('Error fetching stats data:', error);
        alert('Failed to fetch data. Check console for details.');
    }
}

async function applyChartCustomization() {
    const calcId = document.getElementById('chart-calculation').value;
    const chartType = document.getElementById('chart-type').value;
    const xField = document.getElementById('chart-x-field').value;
    const yField = document.getElementById('chart-y-field').value;
    let chartData = [];
    if (calcId) {
        // Use calculation
        const calc = dashboardState.calculations[calcId];
        if (!calc) return alert('Calculation not found');
        // Fetch both subroutes
        const sourceUrl = dashboardSource[3];
        const usersRes = await fetch(sourceUrl + calc.subroute1);
        const postsRes = await fetch(sourceUrl + calc.subroute2);
        const users = await usersRes.json();
        const posts = await postsRes.json();
        // Run user logic
        try {
            chartData = Function('users', 'posts', `return ${calc.logic}`)(users, posts);
        } catch (e) {
            alert('Calculation error: ' + e.message);
            return;
        }
    } else {
        // Manual mode (existing logic)
        const sourceName = document.getElementById('chart-source').value;
        const subroutePath = document.getElementById('chart-subroute').value;
        if (!sourceName || !subroutePath) return alert('Please select both a source and endpoint');
        const source = dashboardSource.find(s => s[0] === sourceName);
        if (!source) return alert('Source not found');
        const apiUrl = `${source[3]}${subroutePath}`;
        const res = await fetch(apiUrl);
        chartData = await res.json();
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

function showCalculationsPage() {
    document.getElementById('calculations-page').classList.remove('hidden');
    document.getElementById('drop-zone').classList.add('hidden');
    document.getElementById('calculations-list').innerHTML = '';
    // Render the list of calculations only (not the builder)
    renderCalculationsList();
    const createBtn = document.querySelector('#calculations-page button[onclick="showCalculationModal()"]');
    if (createBtn) {
        createBtn.onclick = function() { showCalculationBuilder(); };
    }
}

function renderCalculationsList() {
    const list = document.getElementById('calculations-list');
    list.innerHTML = '';
    const calcs = dashboardState.calculations || {};
    if (Object.keys(calcs).length === 0) {
        list.innerHTML = '<div class="text-gray-500 dark:text-gray-400">No calculations yet. Click "Create New Calculation" to add one.</div>';
        return;
    }
    Object.entries(calcs).forEach(([id, calc]) => {
        const item = document.createElement('div');
        item.className = 'calculation-list-item bg-white dark:bg-gray-800 rounded shadow p-4 mb-2 flex justify-between items-center border border-gray-200 dark:border-gray-700';
        
        const leftContent = document.createElement('div');
        leftContent.className = 'flex flex-col';
        leftContent.innerHTML = `
            <span class="font-semibold text-gray-900 dark:text-white">${calc.name || 'Untitled Calculation'}</span>
            <span class="text-sm text-gray-600 dark:text-gray-400">
                ${calc.flow ? calc.flow.length : 0} steps • Created ${new Date(parseInt(id.replace('calc_', ''))).toLocaleDateString()}
            </span>
        `;
        
        const rightContent = document.createElement('div');
        rightContent.className = 'flex gap-2';
        
        // Edit button
        const editBtn = document.createElement('button');
        editBtn.className = 'px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors';
        editBtn.innerHTML = '<i class="fa fa-edit mr-1"></i>Edit';
        editBtn.onclick = function() { showCalculationBuilder(id); };
        
        // Delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors';
        deleteBtn.innerHTML = '<i class="fa fa-trash mr-1"></i>Delete';
        deleteBtn.onclick = function() { deleteCalculation(id); };
        
        rightContent.appendChild(editBtn);
        rightContent.appendChild(deleteBtn);
        
        item.appendChild(leftContent);
        item.appendChild(rightContent);
        list.appendChild(item);
    });
}

function deleteCalculation(calcId) {
    if (confirm('Are you sure you want to delete this calculation?')) {
        delete dashboardState.calculations[calcId];
        renderCalculationsList();
    }
}

function showCalculationBuilder(calcId = null) {
    const builderContainer = document.getElementById('calculations-list');
    builderContainer.innerHTML = '';
    // Initialize current calculation for editing
    window.currentCalcId = calcId;
    if (calcId && dashboardState.calculations[calcId]) {
        window.currentCalcFlow = JSON.parse(JSON.stringify(dashboardState.calculations[calcId].flow)) || [];
        window.currentCalcName = dashboardState.calculations[calcId].name || '';
    } else {
        window.currentCalcFlow = [];
        window.currentCalcName = '';
    }
    // Render the drag-and-drop builder (the original node-based flow builder)
    renderCalculationsBuilder(calcId);
}

// Add missing renderCalculationsBuilder function
function renderCalculationsBuilder(calcId = null) {
    // Calculation builder UI with dropzone full width at bottom
    const list = document.getElementById('calculations-list');
    list.innerHTML = '';
    const builder = document.createElement('div');
    builder.className = 'calculation-builder bg-white dark:bg-gray-800 rounded shadow p-6 flex flex-col';
    
    const isEditing = calcId !== null;
    const headerText = isEditing ? 'Edit Calculation' : 'Create New Calculation';
    
    builder.innerHTML = `
        <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-bold text-gray-900 dark:text-white">${headerText}</h3>
            <button class="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm" onclick="cancelCalculationBuilder()">
                <i class="fa fa-times mr-1"></i>Cancel
            </button>
        </div>
        
        <!-- Calculation Name Input -->
        <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Calculation Name</label>
            <input type="text" id="calc-name-input" 
                   class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm 
                          focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white" 
                   placeholder="Enter calculation name..." 
                   value="${window.currentCalcName || ''}">
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
                    <i class="fa fa-save mr-1"></i>${isEditing ? 'Update Calculation' : 'Save Calculation'}
                </button>
                <button class="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors" onclick="previewCalculationFlow()">
                    <i class="fa fa-eye mr-1"></i>Preview
                </button>
            </div>
        </div>
        <div id="calc-flow-preview" class="mt-6"></div>
    `;
    list.appendChild(builder);
    renderCalculationDataSources();
    renderCalculationOperations();
    renderCalculationFlow();
    
    // Focus on name input for new calculations
    if (!isEditing) {
        setTimeout(() => {
            document.getElementById('calc-name-input').focus();
        }, 100);
    }
}

function cancelCalculationBuilder() {
    // Reset global variables
    window.currentCalcFlow = [];
    window.currentCalcName = '';
    window.currentCalcId = null;
    // Go back to list view
    renderCalculationsList();
}

// Add missing renderCalculationDataSources function
function renderCalculationDataSources() {
    const dsList = document.getElementById('calc-datasource-list');
    dsList.innerHTML = '';
    // Render subroutes as data sources for calculation builder
    subroutes.forEach((subroute, idx) => {
        // subroute: [id, path, source_name, source_created_by]
        const btn = document.createElement('button');
        btn.className = 'draggable-ds bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded shadow hover:bg-blue-100 dark:hover:bg-blue-800 text-gray-800 dark:text-white w-full text-left transition-colors';
        btn.draggable = true;
        btn.textContent = subroute[1]; // Show the subroute path
        btn.dataset.subrouteIdx = idx;
        btn.addEventListener('dragstart', function(e) {
            e.dataTransfer.setData('text/plain', JSON.stringify({
                subrouteIdx: idx
            }));
        });
        dsList.appendChild(btn);
    });
}

// Add missing renderCalculationOperations function
function renderCalculationOperations() {
    const opsList = document.getElementById('calc-operations-list');
    opsList.innerHTML = '';
    const operations = [
        { type: 'filter', label: 'Filter', desc: 'Filter data by field/value' },
        { type: 'group', label: 'Group By', desc: 'Group data by field' },
        { type: 'count', label: 'Count', desc: 'Count items' },
        { type: 'sum', label: 'Sum', desc: 'Sum field values' },
        { type: 'join', label: 'Join', desc: 'Join two data sources' },
        { type: 'map', label: 'Map', desc: 'Transform fields' }
    ];
    operations.forEach(op => {
        const btn = document.createElement('button');
        btn.className = 'draggable-op bg-blue-100 dark:bg-blue-800 px-3 py-2 rounded shadow hover:bg-blue-200 dark:hover:bg-blue-900 text-blue-900 dark:text-blue-200 transition-colors';
        btn.draggable = true;
        btn.textContent = op.label;
        btn.title = op.desc;
        btn.dataset.opType = op.type;
        btn.addEventListener('dragstart', handleCalcDragStart);
        opsList.appendChild(btn);
    });
}

// Add missing drag and drop handlers for calculation builder dropzone
function handleCalcDragStart(e) {
    e.dataTransfer.setData('text/plain', JSON.stringify({
        dsIdx: e.target.dataset.dsIdx,
        opType: e.target.dataset.opType
    }));
}

function handleCalcDrop(e) {
    e.preventDefault();
    const data = JSON.parse(e.dataTransfer.getData('text/plain'));
    window.currentCalcFlow = window.currentCalcFlow || [];
    // Dragging a subroute (data source)
    if (data.subrouteIdx !== undefined) {
        const subroute = subroutes[data.subrouteIdx];
        window.currentCalcFlow.push({ type: 'source', sourceName: subroute[1], sourceUrl: dashboardSource[3] + subroute[1] });
    }
    // Dragging an operation
    else if (data.opType) {
        // By default, attach previous node(s) as inputs
        let inputs = [];
        if (window.currentCalcFlow.length > 0) {
            inputs.push(window.currentCalcFlow[window.currentCalcFlow.length - 1]);
        }
        window.currentCalcFlow.push({ type: data.opType, label: data.opType.charAt(0).toUpperCase() + data.opType.slice(1), inputs });
    }
    renderCalculationFlow();
}

function renderCalculationFlow() {
    const flowZone = document.getElementById('calc-flow-dropzone');
    flowZone.innerHTML = '';
    flowZone.addEventListener('dragover', function(e) { e.preventDefault(); });
    flowZone.addEventListener('drop', handleCalcDrop);
    
    // Show current flow steps as nodes (simple version)
    window.currentCalcFlow = window.currentCalcFlow || [];
    
    if (window.currentCalcFlow.length === 0) {
        flowZone.innerHTML = '<div class="text-gray-500 dark:text-gray-400 text-center w-full">Drag data sources and operations here to build your calculation</div>';
        return;
    }
    
    window.currentCalcFlow.forEach((step, idx) => {
        const node = document.createElement('div');
        node.className = 'calc-flow-node bg-white dark:bg-gray-700 border border-blue-300 dark:border-blue-700 rounded px-4 py-3 flex flex-col items-center justify-center min-w-[120px] relative shadow-sm';
        node.innerHTML = `<span class="font-semibold text-gray-900 dark:text-white">${step.label || step.type || step.sourceName}</span>`;
        
        // Show data sources for operations
        if (step.type !== 'source' && step.inputs && step.inputs.length) {
            node.innerHTML += `<div class="text-xs mt-2 text-gray-500 dark:text-gray-400">Inputs: ${step.inputs.map(i => i.sourceName || i.label || i.type).join(', ')}</div>`;
        }
        
        node.innerHTML += `<button class="absolute top-1 right-1 text-red-500 hover:text-red-700 w-6 h-6 flex items-center justify-center" onclick="removeCalcFlowStep(${idx})" title="Remove step"><i class="fa fa-times"></i></button>`;
        node.onclick = function(e) { 
            if (!e.target.closest('button')) {
                editCalcFlowNode(idx); 
            }
        };
        flowZone.appendChild(node);
        
        // Draw simple arrows (not SVG, just a line for now)
        if (idx < window.currentCalcFlow.length - 1) {
            const arrow = document.createElement('div');
            arrow.className = 'calc-flow-arrow flex items-center justify-center';
            arrow.innerHTML = '<span class="mx-2 text-blue-400 text-xl">→</span>';
            flowZone.appendChild(arrow);
        }
    });
}

function removeCalcFlowStep(idx) {
    window.currentCalcFlow = window.currentCalcFlow || [];
    window.currentCalcFlow.splice(idx, 1);
    renderCalculationFlow();
}

function previewCalculationFlow() {
    executeCalculationFlow(false); // Preview mode
}

async function saveCalculationFlow() {
    const nameInput = document.getElementById('calc-name-input');
    const calcName = nameInput.value.trim();
    
    if (!calcName) {
        alert('Please enter a name for the calculation.');
        nameInput.focus();
        return;
    }
    
    const success = await executeCalculationFlow(true, calcName); // Save mode
    if (success) {
        // Reset global variables
        window.currentCalcFlow = [];
        window.currentCalcName = '';
        window.currentCalcId = null;
        // Go back to list view
        renderCalculationsList();
    }
}

async function executeCalculationFlow(saveMode = false, calcName = '') {
    const preview = document.getElementById('calc-flow-preview');
    let resultData = null;
    let error = null;
    
    try {
        if (!window.currentCalcFlow || window.currentCalcFlow.length === 0) {
            throw new Error('No flow defined');
        }
        
        let sourceNode = window.currentCalcFlow.find(n => n.type === 'source');
        if (!sourceNode) {
            throw new Error('No data source in flow');
        }
        
        // Fetch data from source
        const res = await fetch(sourceNode.sourceUrl);
        if (!res.ok) {
            throw new Error(`Failed to fetch data: ${res.status} ${res.statusText}`);
        }
        const data = await res.json();
        
        // Apply operation (very basic demo)
        let opNode = window.currentCalcFlow.find(n => n.type !== 'source');
        if (opNode) {
            if (opNode.type === 'count') {
                resultData = Array.isArray(data) ? data.length : 0;
            } else if (opNode.type === 'sum') {
                // Sum first numeric field
                if (Array.isArray(data) && data.length > 0) {
                    const keys = Object.keys(data[0]);
                    const numKey = keys.find(k => typeof data[0][k] === 'number');
                    resultData = data.reduce((acc, item) => acc + (item[numKey] || 0), 0);
                } else {
                    resultData = 0;
                }
            } else {
                // Just pass through for now
                resultData = data;
            }
        } else {
            resultData = data;
        }
    } catch (e) {
        error = e.message;
        console.error('Error in executeCalculationFlow:', e);
    }
    
    // Display preview (moved outside try-catch to ensure it always runs)
    const previewClass = error ? 'border-red-200 bg-red-50 dark:bg-red-900/20' : 'border-green-200 bg-green-50 dark:bg-green-900/20';
    preview.innerHTML = `<div class="p-4 border rounded ${previewClass}">` +
        '<strong class="text-gray-900 dark:text-white">Calculation Steps:</strong><br>' +
        window.currentCalcFlow.map((step, i) => `${i+1}. ${step.label || step.type || step.sourceName}`).join('<br>') +
        (error ? `<div class="mt-4 text-red-600 dark:text-red-400"><strong>Error:</strong> ${error}</div>` :
            `<div class="mt-4"><strong class="text-gray-900 dark:text-white">Result Preview:</strong><pre class="bg-white dark:bg-gray-900 p-2 rounded text-xs mt-2 border overflow-auto max-h-48">${JSON.stringify(resultData, null, 2)}</pre></div>`) +
        '</div>';
    
    // Only save if there's no error and we're in save mode
    if (!error && saveMode) {
        // Initialize calculations object if it doesn't exist
        if (!dashboardState.calculations) {
            dashboardState.calculations = {};
        }
        
        // Use existing ID for editing or create new one
        const calcId = window.currentCalcId || 'calc_' + Date.now();
        
        dashboardState.calculations[calcId] = {
            name: calcName,
            flow: JSON.parse(JSON.stringify(window.currentCalcFlow)),
            result: resultData,
            lastModified: Date.now()
        };
        
        return true; // Success
    }
    
    return false; // Failed or preview mode
}

function editCalcFlowNode(idx) {
    // Placeholder for future node editing functionality
    console.log('Edit node:', idx);
    // This could open a modal to edit node parameters
}

function hideCalculationsPage() {
    document.getElementById('calculations-page').classList.add('hidden');
    document.getElementById('drop-zone').classList.remove('hidden');
}