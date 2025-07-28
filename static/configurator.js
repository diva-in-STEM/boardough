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
        defaultSize: { cols: 2, rows: 1 },
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
        defaultSize: { cols: 2, rows: 1 },
        content: {
            type: "stats",
            stats: [
                { value: "0", label: "Loading...", color: "blue" },
                { value: "0", label: "Loading...", color: "green" }
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
        defaultSize: { cols: 3, rows: 2 },
        content: {
            type: "table",
            headers: ["Loading..."],
            rows: [["No data available"]]
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
document.addEventListener("DOMContentLoaded", async function() {
    try {
        // Initialize data first
        initializeDashboardData();
        
        // Load dashboard state
        await loadDashboard();
        
        // Load current page
        const currentPageId = getCurrentPageId();
        loadPageState(currentPageId);
        
        // Initialize UI components
        generateComponentLibrary();
        initializeDragAndDrop();
        initThemeToggle();
        initializePageNavigation();
        addDashboardControls();
        
        // Show instructions if needed
        if (document.getElementById("card-grid").children.length === 0) {
            toggleDragInstructions(true);
        }
        
    } catch (error) {
        console.error("Dashboard initialization failed:", error);
        showNotification("Error loading dashboard: " + error.message, "error");
    }
});
function initializeDashboard() {
    try {
        // Load existing dashboard state if available
        loadDashboard();
        
        // Load current page state
        loadPageState(getCurrentPageId());
        
        // If no cards exist, show drag instructions
        if (document.getElementById('card-grid').children.length === 0) {
            toggleDragInstructions(true);
        }
        
    } catch (error) {
        console.error('Error initializing dashboard:', error);
        showNotification('Error loading dashboard', 'error');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Initialize dashboard after other components are ready
    setTimeout(initializeDashboard, 100);
});

function getCurrentPageId() {
    return dashboardState.currentPageId
}

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
    // Ensure pages is always an array
    if (!Array.isArray(dashboardState.pages)) {
        dashboardState.pages = [{id: "home", name: "Home", cards: [], isActive: true}];
    }
    
    const currentPageId = getCurrentPageId() || "home";
    const cards = [];
    
    // Collect all cards
    document.querySelectorAll(".resizable-card").forEach((cardElement, index) => {
        const cardData = {
            id: cardElement.dataset.cardId || `card-${index}`,
            type: cardElement.dataset.cardType,
            cols: parseInt(cardElement.dataset.cols) || 1,
            rows: parseInt(cardElement.dataset.rows) || 1,
            config: extractCardConfig(cardElement),
            position: index
        };
        cards.push(cardData);
    });
    
    // Find and update the current page in the array
    const pageIndex = dashboardState.pages.findIndex(page => page.id === currentPageId);
    if (pageIndex !== -1) {
        dashboardState.pages[pageIndex].cards = cards;
        dashboardState.pages[pageIndex].lastModified = Date.now();
    } else {
        // Create new page if not found
        dashboardState.pages.push({
            id: currentPageId,
            name: currentPageId === "home" ? "Home" : currentPageId,
            cards: cards,
            isActive: true,
            lastModified: Date.now()
        });
    }
}

function loadPageState(pageId) {    
    const page = dashboardState.pages.find(p => p.id === pageId);
    
    if (!page) {
        console.warn("Page not found:", pageId);
        return;
    }
    
    clearGrid();
    
    if (page.cards && page.cards.length > 0) {
        page.cards.forEach((cardConfig, index) => {
            try {
                deserializeCard(cardConfig);
            } catch (error) {
                console.error(`Error deserializing card ${index}:`, error);
            }
        });
    }
    
    toggleDragInstructions(page.cards?.length === 0);
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

function deserializeCard(cardConfig) {
    if (!cardConfig.type || !CARD_TYPES[cardConfig.type]) {
        console.error("Invalid card type:", cardConfig.type);
        return;
    }
    
    try {
        const card = createCard(cardConfig.type);
        
        if (cardConfig.id) card.dataset.cardId = cardConfig.id;
        if (cardConfig.cols) card.dataset.cols = cardConfig.cols;
        if (cardConfig.rows) card.dataset.rows = cardConfig.rows;
        
        updateCardGridSpan(card, cardConfig.cols || 1, cardConfig.rows || 1);
        
        if (cardConfig.config) {
            applyCardConfig(card, cardConfig.config);
        }
        
        return card;
    } catch (error) {
        console.error("Error creating card:", error);
        throw error;
    }
}

function extractCardConfig(cardElement) {
    const cardType = cardElement.dataset.cardType;
    const config = {
        cardType: cardType,
        cols: parseInt(cardElement.dataset.cols) || 1,
        rows: parseInt(cardElement.dataset.rows) || 1
    };

    if (cardType === 'stats') {
        // Extract stats configuration
        const statsConfig = cardElement.dataset.statsConfig;
        if (statsConfig) {
            try {
                config.statsConfig = JSON.parse(statsConfig);
            } catch (e) {
                console.warn('Failed to parse stats config:', e);
            }
        }
        
        // Also store the current display data for reference
        const statsElements = cardElement.querySelectorAll('.text-2xl.font-bold');
        if (statsElements.length >= 2) {
            config.currentStats = {
                leftValue: statsElements[0].textContent,
                rightValue: statsElements[1].textContent,
                leftLabel: cardElement.querySelector('.text-xs')?.textContent || '',
                rightLabel: cardElement.querySelectorAll('.text-xs')[1]?.textContent || ''
            };
        }
    } 
    else if (cardType === 'chart') {
        // Extract chart configuration
        const chartConfig = cardElement.dataset.chartConfig;
        if (chartConfig) {
            try {
                config.chartConfig = JSON.parse(chartConfig);
            } catch (e) {
                console.warn('Failed to parse chart config:', e);
            }
        }
        
        // Find canvas element and extract chart info
        const canvas = cardElement.querySelector('canvas');
        if (canvas && window.chartInstances && window.chartInstances[cardElement.dataset.cardId]) {
            const chartInstance = window.chartInstances[cardElement.dataset.cardId];
            config.chartData = {
                type: chartInstance.config.type,
                labels: chartInstance.data.labels,
                datasets: chartInstance.data.datasets,
                title: chartInstance.options?.plugins?.title?.text || ''
            };
        }
    }
    else if (cardType === 'table') {
        // Extract table configuration
        const tableConfig = cardElement.dataset.tableConfig;
        if (tableConfig) {
            try {
                config.tableConfig = JSON.parse(tableConfig);
            } catch (e) {
                console.warn('Failed to parse table config:', e);
            }
        }
        
        // Extract current table structure
        const table = cardElement.querySelector('table');
        if (table) {
            const headers = Array.from(table.querySelectorAll('thead th')).map(th => th.textContent);
            const rows = Array.from(table.querySelectorAll('tbody tr')).map(tr => 
                Array.from(tr.querySelectorAll('td')).map(td => td.textContent)
            );
            config.tableData = { headers, rows };
        }
    }
    else if (cardType === 'text' || cardType === 'notes') {
        // Extract text content
        const editableElement = cardElement.querySelector('[contenteditable]');
        if (editableElement) {
            config.text = editableElement.textContent;
        }
    }

    return config;
}


function applyCardConfig(cardElement, config) {
    const cardType = cardElement.dataset.cardType;

    // Apply basic sizing
    if (config.cols) {
        cardElement.dataset.cols = config.cols;
        updateCardGridSpan(cardElement, config.cols, config.rows || 1);
    }

    if (cardType === 'text' || cardType === 'notes') {
        // Restore text content
        const editableElement = cardElement.querySelector('[contenteditable]');
        if (editableElement && config.text) {
            editableElement.textContent = config.text;
        }
    }
    else if (cardType === 'stats') {
        // Store configuration data in dataset for later use
        if (config.statsConfig) {
            cardElement.dataset.statsConfig = JSON.stringify(config.statsConfig);
            
            // Restore the stats display if we have the configuration
            if (config.statsConfig.configured) {
                restoreStatsCard(cardElement, config);
            }
        }
    }
    else if (cardType === 'chart') {
        // Store configuration data in dataset for later use
        if (config.chartConfig) {
            cardElement.dataset.chartConfig = JSON.stringify(config.chartConfig);
            
            // Restore the chart if we have the configuration
            if (config.chartConfig.configured) {
                restoreChartCard(cardElement, config);
            }
        }
    }
    else if (cardType === 'table') {
        // Store configuration data in dataset for later use
        if (config.tableConfig) {
            cardElement.dataset.tableConfig = JSON.stringify(config.tableConfig);
            
            // Restore the table if we have the configuration
            if (config.tableConfig.configured) {
                restoreTableCard(cardElement, config);
            }
        }
    }
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

async function saveDashboard(dashboardId) {
    try {
        // Save current page state first
        saveCurrentPageState();
        
        // Add metadata
        dashboardState.lastModified = Date.now();
        dashboardState.version = dashboardState.version ? dashboardState.version + 1 : 1;
        
        const dashboardData = JSON.stringify(dashboardState, null, 2);
        const blob = new Blob([dashboardData], { type: 'application/json' });
        
        const response = await fetch(`/api/dashboards/save/${dashboardId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: blob
        });
        
        if (response.redirected) {
            location.href = response.url;
        } else if (!response.ok) {
            throw new Error(`Request failed with status: ${response.status}`);
        } else {
            const result = await response.json();
            dashboardState.id = result.id;
            
            showNotification('Dashboard saved successfully!', 'success');
            updateBrowserUrl();
            
            // Optional: redirect to home or stay on current page
            // location.href = '/home';
        }
    } catch (error) {
        console.error('Error saving dashboard:', error);
        showNotification(`Error saving dashboard: ${error.message}`, 'error');
    }
}

let autoSaveTimeout;
function scheduleAutoSave() {
    if (autoSaveTimeout) clearTimeout(autoSaveTimeout);
    
    autoSaveTimeout = setTimeout(() => {
        try {
            saveCurrentPageState();
        } catch (error) {
            console.error("Auto-save failed:", error);
        }
    }, 2000);
}

document.addEventListener("DOMContentLoaded", (function() {
    const observer = new MutationObserver((mutations) => {
        let shouldSave = false;
        
        mutations.forEach((mutation) => {
            if (mutation.type === "childList") {
                // Cards added or removed
                shouldSave = true;
            } else if (mutation.type === "attributes") {
                // Card properties changed
                if (["data-cols", "data-rows", "data-card-id", "data-card-type"].includes(mutation.attributeName)) {
                    shouldSave = true;
                }
            }
        });
        
        if (shouldSave) {
            scheduleAutoSave(); // Now actually saves
        }
    });
    
    const cardGrid = document.getElementById("card-grid");
    if (cardGrid) {
        observer.observe(cardGrid, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ["data-cols", "data-rows", "data-card-id", "data-card-type"]
        });
    }
}));

function loadDashboard() {
    try {
        if (dashboardInfo[7]) {
            const loadedState = JSON.parse(dashboardInfo[7]);
            
            // Ensure pages is always an array
            if (loadedState.pages && !Array.isArray(loadedState.pages)) {
                // Convert object format to array format
                loadedState.pages = Object.values(loadedState.pages).map(page => ({
                    id: page.id || 'home',
                    name: page.name || 'Home',
                    cards: page.cards || [],
                    isActive: page.isActive || false
                }));
            }
            
            dashboardState = {
                ...dashboardState,
                ...loadedState
            };
            
        }
    } catch (e) {
        console.error("Error parsing dashboard data:", e);
        throw e;
    }
}

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
function createCard(componentType) {
    const cardType = CARD_TYPES[componentType];
    if (!cardType) {
        console.error(`Unknown card type: ${componentType}`);
        return;
    }

    cardCounter++;
    const cardGrid = document.getElementById('card-grid');
    const cardElement = document.createElement('div');
    const defaultSize = cardType.defaultSize || { cols: 1, rows: 1 };

    cardElement.className = 'resizable-card bg-white dark:bg-gray-800 dark:text-white rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow duration-200 relative group min-h-fit';
    cardElement.dataset.cardType = componentType;
    cardElement.dataset.cardId = `card-${cardCounter}`;
    cardElement.dataset.cols = defaultSize.cols;
    cardElement.dataset.rows = defaultSize.rows;
    
    updateCardGridSpan(cardElement, defaultSize.cols, defaultSize.rows);

    let cardHTML = '';
    const resizeHandles = createResizeHandles();

    if (cardType.showHeader) {
        cardHTML += `
            <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">${cardType.title}</h3>
                <div class="flex items-center space-x-2">
                    <button class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" onclick="editCard(this)">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="text-gray-400 hover:text-red-600" onclick="deleteCard(this)">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
            <div class="text-sm text-gray-600 dark:text-gray-400 mb-4">${cardType.description}</div>
        `;
    } else {
        cardHTML += `
            <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                <div class="flex items-center space-x-1">
                    <button class="text-gray-400 hover:text-red-600 text-sm p-1" onclick="deleteCard(this)">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `;
    }

    cardHTML += `<div class="card-content">${renderCardContent(cardType.content)}</div>`;
    cardElement.innerHTML = cardHTML;
    cardElement.appendChild(resizeHandles);
    cardGrid.appendChild(cardElement);
    initializeCardResize(cardElement);

    // Auto-show customization modal for data-driven cards
    if (['stats', 'chart', 'table'].includes(componentType)) {
        setTimeout(() => {
            showCustomizationModal(componentType, cardElement);
        }, 100);
    }

    setTimeout(() => {
        saveCurrentPageState();
    }, 100);

    return cardElement;
}

function createCardFromConfig(cardConfig) {
    const cardType = CARD_TYPES[cardConfig.type];
    if (!cardType) {
        console.error(`Unknown card type: ${cardConfig.type}`);
        return null;
    }
    
    const cardGrid = document.getElementById('card-grid');
    const cardElement = document.createElement('div');
    
    cardElement.className = 'resizable-card bg-white dark:bg-gray-800 dark:text-white rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow duration-200 relative group min-h-fit';
    cardElement.dataset.cardType = cardConfig.type;
    cardElement.dataset.cardId = cardConfig.id;
    cardElement.dataset.cols = cardConfig.cols;
    cardElement.dataset.rows = cardConfig.rows;
    
    updateCardGridSpan(cardElement, cardConfig.cols, cardConfig.rows);
    
    let cardHTML = '';
    const resizeHandles = createResizeHandles();
    
    if (cardType.showHeader) {
        cardHTML += `
            <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">${cardType.title}</h3>
                <div class="flex items-center space-x-2">
                    <button class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" onclick="editCard(this)">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="text-gray-400 hover:text-red-600" onclick="deleteCard(this)">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
            <div class="text-sm text-gray-600 dark:text-gray-400 mb-4">${cardType.description}</div>
        `;
    } else {
        cardHTML += `
            <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                <div class="flex items-center space-x-1">
                    <button class="text-gray-400 hover:text-red-600 text-sm p-1" onclick="deleteCard(this)">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `;
    }
    
    cardHTML += `<div class="card-content">${renderCardContent(cardType.content)}</div>`;
    cardElement.innerHTML = cardHTML;
    cardElement.appendChild(resizeHandles);
    cardGrid.appendChild(cardElement);
    initializeCardResize(cardElement);
    
    return cardElement;
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
        if (componentType === 'stats' || componentType === 'chart' || componentType === 'table') {
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

function editCard(buttonElement) {
    const cardElement = buttonElement.closest('[data-card-type]');
    const cardType = cardElement.dataset.cardType;
    
    if (['stats', 'chart', 'table'].includes(cardType)) {
        showCustomizationModal(cardType, cardElement);
    } else {
        // Handle other card types (like text cards)
        if (!CARD_TYPES[cardType]) return;
        
        const titleElement = cardElement.querySelector('h3');
        const currentTitle = titleElement.textContent;
        const newTitle = prompt('Enter new title:', currentTitle);
        
        if (newTitle && newTitle !== currentTitle) {
            titleElement.textContent = newTitle;
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

    saveCurrentPageState();
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

function showCustomizationModal(cardType, cardElement) {
    currentCustomizingCard = cardElement;
    const modal = document.getElementById('customization-modal');
    const title = document.getElementById('modal-title');
    const content = document.getElementById('modal-content');
    
    title.textContent = `Setup ${CARD_TYPES[cardType].title}`;
    
    let modalContent = '';
    if (cardType === 'stats') {
        modalContent = generateStatsModalContent();
    } else if (cardType === 'chart') {
        modalContent = generateChartModalContent();
    } else if (cardType === 'table') {
        modalContent = generateTableModalContent();
    }
    
    content.innerHTML = modalContent;
    modal.classList.remove('hidden');
}

function updateModalFooter() {
    const modal = document.getElementById('customization-modal');
    const content = document.getElementById('modal-content');
    
    // Add footer to modal content if it doesn't exist
    if (!content.querySelector('.modal-footer')) {
        const footer = document.createElement('div');
        footer.className = 'modal-footer mt-6 flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-600';
        footer.innerHTML = `
            <button class="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors" onclick="closeCustomizationModal()">
                Cancel
            </button>
            <button class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors" onclick="applyCustomization()">
                <i class="fas fa-check mr-1"></i>Apply
            </button>
        `;
        content.appendChild(footer);
    }
}


function closeCustomizationModal() {
    const modal = document.getElementById('customization-modal');
    modal.classList.add('hidden');
    currentCustomizingCard = null;
}

function generateStatsModalContent(){
    const availableCalculations=Object.entries(dashboardState.calculations||{}).map(([id,calc])=>`<option value="${ id }">${calc.name }</option>`).join('');
    const subrouteOptions=subroutes.map(route=>`<option value="${route[1]}">${route[1]}</option>`).join('');
    return `
        <div class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Data Source</label>
                <div class="flex space-x-2">
                    <label class="flex items-center text-black dark:text-white">
                        <input type="radio" name="stats-source-type" value="calculation" class="mr-2" onchange="toggleStatsSourceType()">
                        <span class="text-black dark:text-white">Use Calculation</span>
                    </label>
                    <label class="flex items-center">
                        <input type="radio" name="stats-source-type" value="manual" class="mr-2 text-black dark:text-white" checked onchange="toggleStatsSourceType()">
                        <span class="text-black dark:text-white">Manual Setup</span>
                    </label>
                </div>
            </div>
            
            <div id="stats-calculation-section" style="display: none;">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Calculation</label>
                <select id="stats-calculation" class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white">
                    <option value="">Choose a calculation...</option>
                    ${ availableCalculations }
                </select>
            </div>
            
            <div id="stats-manual-section">
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Primary Data Source</label>
                    <select id="stats-subroute-left" class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white">
                        <option value="">Select endpoint...</option>
                        ${ subrouteOptions }
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Primary Metric</label>
                    <select id="stats-left-type" class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white">
                        <option value="count">Count of items</option>
                        <option value="field">Specific field value</option>
                    </select>
                    <input type="text" id="stats-left-field" class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white mt-2" placeholder="Field name (if specific field)" style="display: none;">
                    <input type="text" id="stats-left-label" class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white mt-2" placeholder="Display label">
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Secondary Data Source</label>
                    <select id="stats-subroute-right" class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white">
                        <option value="">Select endpoint...</option>
                        ${ subrouteOptions }
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Secondary Metric</label>
                    <select id="stats-right-type" class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white">
                        <option value="count">Count of items</option>
                        <option value="field">Specific field value</option>
                    </select>
                    <input type="text" id="stats-right-field" class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white mt-2" placeholder="Field name (if specific field)" style="display: none;">
                    <input type="text" id="stats-right-label" class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white mt-2" placeholder="Display label">
                </div>
            </div>
        </div>
    `
}

function generateChartModalContent() {
    const availableCalculations = Object.entries(dashboardState.calculations || {})
        .map(([id, calc]) => `<option value="${id}">${calc.name}</option>`)
        .join('');
    
    const subrouteOptions = subroutes.map(route => 
        `<option value="${route[1]}">${route[1]}</option>`
    ).join('');

    return `
        <div class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Data Source</label>
                <div class="flex space-x-2">
                    <label class="flex items-center">
                        <input type="radio" name="chart-source-type" value="calculation" class="mr-2" onchange="toggleChartSourceType()">
                        <span class="text-black dark:text-white">Use Calculation</span>
                    </label>
                    <label class="flex items-center">
                        <input type="radio" name="chart-source-type" value="manual" class="mr-2" checked onchange="toggleChartSourceType()">
                        <span class="text-black dark:text-white">Manual Setup</span>
                    </label>
                </div>
            </div>
            
            <div id="chart-calculation-section" style="display: none;">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Calculation</label>
                <select id="chart-calculation" class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white">
                    <option value="">Choose a calculation...</option>
                    ${availableCalculations}
                </select>
            </div>
            
            <div id="chart-manual-section">
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Data Endpoint</label>
                    <select id="chart-subroute" class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white">
                        <option value="">Select endpoint...</option>
                        ${subrouteOptions}
                    </select>
                </div>
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Chart Type</label>
                <select id="chart-type" class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white">
                    <option value="line">Line Chart</option>
                    <option value="bar">Bar Chart</option>
                    <option value="pie">Pie Chart</option>
                    <option value="doughnut">Doughnut Chart</option>
                </select>
            </div>
            
            <div id="chart-axis-fields">
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">X-Axis Field</label>
                    <input type="text" id="chart-x-field" class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white" placeholder="e.g., name, category">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Y-Axis Field</label>
                    <input type="text" id="chart-y-field" class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white" placeholder="e.g., count, value">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Chart Title</label>
                    <input type="text" id="chart-title" class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white" placeholder="Enter chart title">
                </div>
            </div>
        </div>
    `;
}

function generateTableModalContent() {
    const availableCalculations = Object.entries(dashboardState.calculations || {})
        .map(([id, calc]) => `<option value="${id}">${calc.name}</option>`)
        .join('');
    
    const subrouteOptions = subroutes.map(route => 
        `<option value="${route[1]}">${route[1]}</option>`
    ).join('');

    return `
        <div class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Data Source</label>
                <div class="flex space-x-2">
                    <label class="flex items-center">
                        <input type="radio" name="table-source-type" value="calculation" class="mr-2" onchange="toggleTableSourceType()">
                        <span class="text-black dark:text-white">Use Calculation</span>
                    </label>
                    <label class="flex items-center">
                        <input type="radio" name="table-source-type" value="manual" class="mr-2" checked onchange="toggleTableSourceType()">
                        <span class="text-black dark:text-white">Manual Setup</span>
                    </label>
                </div>
            </div>
            
            <div id="table-calculation-section" style="display: none;">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Calculation</label>
                <select id="table-calculation" class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white">
                    <option value="">Choose a calculation...</option>
                    ${availableCalculations}
                </select>
            </div>
            
            <div id="table-manual-section">
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Data Endpoint</label>
                    <select id="table-subroute" class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white">
                        <option value="">Select endpoint...</option>
                        ${subrouteOptions}
                    </select>
                </div>
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Display Options</label>
                <div class="space-y-2">
                    <div>
                        <label class="block text-sm text-gray-600 dark:text-gray-400 mb-1">Max Rows to Display</label>
                        <input type="number" id="table-max-rows" value="10" min="1" max="100" class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white">
                    </div>
                    <div>
                        <label class="flex items-center">
                            <input type="checkbox" id="table-show-pagination" class="mr-2">
                            <span class="text-sm text-gray-600 dark:text-gray-400">Enable pagination</span>
                        </label>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function toggleStatsSourceType() {
    const sourceType = document.querySelector('input[name="stats-source-type"]:checked').value;
    const calculationSection = document.getElementById('stats-calculation-section');
    const manualSection = document.getElementById('stats-manual-section');
    
    if (sourceType === 'calculation') {
        calculationSection.style.display = 'block';
        manualSection.style.display = 'none';
    } else {
        calculationSection.style.display = 'none';
        manualSection.style.display = 'block';
    }
}

function toggleChartSourceType() {
    const sourceType = document.querySelector('input[name="chart-source-type"]:checked').value;
    const calculationSection = document.getElementById('chart-calculation-section');
    const manualSection = document.getElementById('chart-manual-section');
    
    if (sourceType === 'calculation') {
        calculationSection.style.display = 'block';
        manualSection.style.display = 'none';
    } else {
        calculationSection.style.display = 'none';
        manualSection.style.display = 'block';
    }
}

function toggleTableSourceType() {
    const sourceType = document.querySelector('input[name="table-source-type"]:checked').value;
    const calculationSection = document.getElementById('table-calculation-section');
    const manualSection = document.getElementById('table-manual-section');
    
    if (sourceType === 'calculation') {
        calculationSection.style.display = 'block';
        manualSection.style.display = 'none';
    } else {
        calculationSection.style.display = 'none';
        manualSection.style.display = 'block';
    }
}

async function applyCustomization() {
    if (!currentCustomizingCard) return;
    
    const cardType = currentCustomizingCard.dataset.cardType;
    
    try {
        if (cardType === 'stats') {
            await applyStatsCustomization();
        } else if (cardType === 'chart') {
            await applyChartCustomization();
        } else if (cardType === 'table') {
            await applyTableCustomization();
        }
        closeCustomizationModal();
    } catch (error) {
        console.error('Error applying customization:', error);
        alert('Error applying customization: ' + error.message);
    }
}

async function applyStatsCustomization(){
    const sourceType=document.querySelector('input[name="stats-source-type"]:checked').value;
    const statsConfig={sourceType,configured:true};

    if(sourceType==='calculation'){
        const calculationId=document.getElementById('stats-calculation').value;
        if(!calculationId){
            alert('Please select a calculation');
            return;
        }
        statsConfig.calculationId=calculationId;
        statsConfig.calculationName=dashboardState.calculations[calculationId]?.name||'Unknown';
        try{
            const result=await executeCalculationById(calculationId);
            updateStatsCardFromCalculation(currentCustomizingCard,result,statsConfig.calculationName);
        }catch(error){
            console.error('Error executing calculation:',error);
            alert('Error executing calculation: '+error.message);
            return;
        }
    }else{
        const leftSubroute=document.getElementById('stats-subroute-left').value;
        const rightSubroute=document.getElementById('stats-subroute-right').value;
        const leftType=document.getElementById('stats-left-type').value;
        const rightType=document.getElementById('stats-right-type').value;
        const leftField=document.getElementById('stats-left-field').value;
        const rightField=document.getElementById('stats-right-field').value;
        const leftLabel=document.getElementById('stats-left-label').value;
        const rightLabel=document.getElementById('stats-right-label').value;

        if(!leftSubroute||!rightSubroute){
            alert('Please select both data sources');
            return;
        }

        // CRITICAL FIX: Add validation for dashboardSource[3]
        if(!dashboardSource || !dashboardSource[3] || dashboardSource[3] === 'undefined') {
            alert('Dashboard source URL is not properly configured');
            console.error('Dashboard source is undefined:', dashboardSource);
            return;
        }

        Object.assign(statsConfig,{
            leftSubroute,rightSubroute,leftType,rightType,
            leftField,rightField,leftLabel,rightLabel
        });

        try{
            // Build URLs with validation
            const leftUrl = `${dashboardSource[3]}${leftSubroute}`;
            const rightUrl = `${dashboardSource[3]}${rightSubroute}`;
            
            console.log('Fetching URLs:', leftUrl, rightUrl); // Debug log
            
            const[leftResponse,rightResponse]=await Promise.all([
                cachedFetch(leftUrl,{},{ttl:300000}),
                cachedFetch(rightUrl,{},{ttl:300000})
            ]);

            const leftData=await leftResponse.json();
            const rightData=await rightResponse.json();
            updateStatsCardFromData(currentCustomizingCard,leftData,rightData,{
                leftType,rightType,leftField,rightField,leftLabel,rightLabel
            });
        }catch(error){
            console.error('Error fetching stats data:',error);
            alert('Error fetching data: '+error.message);
            return;
        }
    }

    currentCustomizingCard.dataset.statsConfig=JSON.stringify(statsConfig);
}

async function applyChartCustomization(){
    const sourceType=document.querySelector('input[name="chart-source-type"]:checked').value;
    const chartType=document.getElementById('chart-type').value;
    const xField=document.getElementById('chart-x-field').value;
    const yField=document.getElementById('chart-y-field').value;
    const title=document.getElementById('chart-title').value;

    const chartConfig={sourceType,configured:true,chartType,xField,yField,title};
    let data=[];

    if(sourceType==='calculation'){
        const calculationId=document.getElementById('chart-calculation').value;
        if(!calculationId){
            alert('Please select a calculation');
            return;
        }
        chartConfig.calculationId=calculationId;
        try{
            data=await executeCalculationById(calculationId);
        }catch(error){
            console.error('Error executing calculation:',error);
            alert('Error executing calculation: '+error.message);
            return;
        }
    }else{
        const subroute=document.getElementById('chart-subroute').value;
        if(!subroute){
            alert('Please select a data endpoint');
            return;
        }
        if(!xField||!yField){
            alert('Please specify both X and Y axis fields');
            return;
        }

        // CRITICAL FIX: Add validation for dashboardSource[3]
        if(!dashboardSource || !dashboardSource[3] || dashboardSource[3] === 'undefined') {
            alert('Dashboard source URL is not properly configured');
            console.error('Dashboard source is undefined:', dashboardSource);
            return;
        }

        chartConfig.subroute=subroute;
        try{
            const url = `${dashboardSource[3]}${subroute}`;
            console.log('Fetching chart URL:', url); // Debug log
            
            const response=await cachedFetch(url,{},{ttl:300000});
            data=await response.json();
        }catch(error){
            console.error('Error fetching chart data:',error);
            alert('Error fetching data: '+error.message);
            return;
        }
    }

    updateChartCard(currentCustomizingCard,data,chartType,xField,yField,title);
    currentCustomizingCard.dataset.chartConfig=JSON.stringify(chartConfig);
}

async function applyTableCustomization(){
    const sourceType=document.querySelector('input[name="table-source-type"]:checked').value;
    const maxRows=parseInt(document.getElementById('table-max-rows').value)||10;
    const showPagination=document.getElementById('table-show-pagination').checked;

    const tableConfig={sourceType,configured:true,maxRows,showPagination};
    let data=[];

    if(sourceType==='calculation'){
        const calculationId=document.getElementById('table-calculation').value;
        if(!calculationId){
            alert('Please select a calculation');
            return;
        }
        tableConfig.calculationId=calculationId;
        try{
            data=await executeCalculationById(calculationId);
        }catch(error){
            console.error('Error executing calculation:',error);
            alert('Error executing calculation: '+error.message);
            return;
        }
    }else{
        const subroute=document.getElementById('table-subroute').value;
        if(!subroute){
            alert('Please select a data endpoint');
            return;
        }

        // CRITICAL FIX: Add validation for dashboardSource[3]
        if(!dashboardSource || !dashboardSource[3] || dashboardSource[3] === 'undefined') {
            alert('Dashboard source URL is not properly configured');
            console.error('Dashboard source is undefined:', dashboardSource);
            return;
        }

        tableConfig.subroute=subroute;
        try{
            const url = `${dashboardSource[3]}${subroute}`;
            console.log('Fetching table URL:', url); // Debug log
            
            const response=await cachedFetch(url,{},{ttl:300000});
            data=await response.json();
        }catch(error){
            console.error('Error fetching table data:',error);
            alert('Error fetching data: '+error.message);
            return;
        }
    }

    updateTableCard(currentCustomizingCard,data,maxRows,showPagination);
    currentCustomizingCard.dataset.tableConfig=JSON.stringify(tableConfig);
}

async function executeCalculationById(calculationId) {
    const calculation = dashboardState.calculations[calculationId];
    if (!calculation) {
        throw new Error('Calculation not found');
    }
    
    // Execute the calculation flow
    let data = null;
    
    for (let i = 0; i < calculation.flow.length; i++) {
        const step = calculation.flow[i];
        
        if (step.type === 'source') {
            try {
                const response = await cachedFetch(step.sourceUrl, {}, { ttl: 180000 });
                if (!response.ok) {
                    throw new Error(`Failed to fetch data: ${response.status}`);
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

async function restoreStatsCard(cardElement, config) {
    try {
        const statsConfig = config.statsConfig;
        
        if (statsConfig.sourceType === 'calculation') {
            // Restore from calculation
            const calculationResult = await executeCalculationById(statsConfig.calculationId);
            updateStatsCardFromCalculation(cardElement, calculationResult, statsConfig.calculationName);
        } else if (statsConfig.sourceType === 'manual') {
            // Restore from manual configuration
            const [leftData, rightData] = await Promise.all([
                cachedFetch(`${dashboardSource[3]}${statsConfig.leftSubroute}`, {}, { ttl: 300000 }),
                cachedFetch(`${dashboardSource[3]}${statsConfig.rightSubroute}`, {}, { ttl: 300000 })
            ]);
            
            const leftJson = await leftData.json();
            const rightJson = await rightData.json();
            
            updateStatsCardFromData(cardElement, leftJson, rightJson, {
                leftType: statsConfig.leftType,
                rightType: statsConfig.rightType,
                leftField: statsConfig.leftField,
                rightField: statsConfig.rightField,
                leftLabel: statsConfig.leftLabel,
                rightLabel: statsConfig.rightLabel
            });
        }
    } catch (error) {
        console.error('Error restoring stats card:', error);
        // Show error state or fallback to saved display data
        if (config.currentStats) {
            const cardContent = cardElement.querySelector('.card-content');
            cardContent.innerHTML = `
                <div class="grid grid-cols-2 gap-4">
                    <div class="text-center py-2">
                        <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">${config.currentStats.leftValue}</div>
                        <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">${config.currentStats.leftLabel}</div>
                    </div>
                    <div class="text-center py-2">
                        <div class="text-2xl font-bold text-green-600 dark:text-green-400">${config.currentStats.rightValue}</div>
                        <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">${config.currentStats.rightLabel}</div>
                    </div>
                </div>
                <div class="text-xs text-red-500 mt-2">⚠ Data source temporarily unavailable</div>
            `;
        }
    }
}

// New function to restore chart cards from saved configuration
async function restoreChartCard(cardElement, config) {
    try {
        const chartConfig = config.chartConfig;
        let data = [];
        
        if (chartConfig.sourceType === 'calculation') {
            // Restore from calculation
            data = await executeCalculationById(chartConfig.calculationId);
        } else if (chartConfig.sourceType === 'manual') {
            // Restore from manual configuration
            const response = await cachedFetch(`${dashboardSource[3]}${chartConfig.subroute}`, {}, { ttl: 300000 });
            data = await response.json();
        }
        
        updateChartCard(
            cardElement, 
            data, 
            chartConfig.chartType || 'bar',
            chartConfig.xField || 'x',
            chartConfig.yField || 'y',
            chartConfig.title || ''
        );
    } catch (error) {
        console.error('Error restoring chart card:', error);
        // Fallback to saved chart data if available
        if (config.chartData) {
            const cardContent = cardElement.querySelector('.card-content');
            cardContent.innerHTML = `<canvas id="chartjs-${cardElement.dataset.cardId}" class="w-full h-64"></canvas>`;
            
            setTimeout(() => {
                if (window.Chart) {
                    const canvas = document.getElementById(`chartjs-${cardElement.dataset.cardId}`);
                    if (canvas) {
                        const ctx = canvas.getContext('2d');
                        window.chartInstances = window.chartInstances || {};
                        window.chartInstances[cardElement.dataset.cardId] = new Chart(ctx, {
                            type: config.chartData.type,
                            data: {
                                labels: config.chartData.labels,
                                datasets: config.chartData.datasets
                            },
                            options: {
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    title: {
                                        display: !!config.chartData.title,
                                        text: config.chartData.title + ' (cached)'
                                    }
                                }
                            }
                        });
                    }
                }
            }, 100);
        }
    }
}

// New function to restore table cards from saved configuration
async function restoreTableCard(cardElement, config) {
    try {
        const tableConfig = config.tableConfig;
        let data = [];
        
        if (tableConfig.sourceType === 'calculation') {
            // Restore from calculation
            data = await executeCalculationById(tableConfig.calculationId);
        } else if (tableConfig.sourceType === 'manual') {
            // Restore from manual configuration
            const response = await cachedFetch(`${dashboardSource[3]}${tableConfig.subroute}`, {}, { ttl: 300000 });
            data = await response.json();
        }
        
        updateTableCard(
            cardElement,
            data,
            tableConfig.maxRows || 10,
            tableConfig.showPagination || false
        );
    } catch (error) {
        console.error('Error restoring table card:', error);
        // Fallback to saved table data if available
        if (config.tableData) {
            const cardContent = cardElement.querySelector('.card-content');
            cardContent.innerHTML = `
                <div class="overflow-x-auto">
                    <table class="w-full text-sm">
                        <thead class="bg-gray-50 dark:bg-gray-700">
                            <tr>${config.tableData.headers.map(header => `<th class="px-3 py-2 text-left font-medium text-gray-900 dark:text-white">${header}</th>`).join('')}</tr>
                        </thead>
                        <tbody class="divide-y divide-gray-200 dark:divide-gray-600">
                            ${config.tableData.rows.map(row => `
                                <tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
                                    ${row.map(cell => `<td class="px-3 py-2 text-gray-900 dark:text-white">${cell}</td>`).join('')}
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    <div class="text-xs text-red-500 mt-2">⚠ Showing cached data - source temporarily unavailable</div>
                </div>
            `;
        }
    }
}

function updateStatsCardFromCalculation(cardElement, data, calculationName) {
    const cardContent = cardElement.querySelector('.card-content');
    
    let statsHtml = '';
    
    if (Array.isArray(data)) {
        statsHtml = `
            <div class="grid grid-cols-2 gap-4">
                <div class="text-center py-2">
                    <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">${data.length}</div>
                    <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">Total Items</div>
                </div>
                <div class="text-center py-2">
                    <div class="text-2xl font-bold text-green-600 dark:text-green-400">${data.length > 0 ? Object.keys(data[0]).length : 0}</div>
                    <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">Fields</div>
                </div>
            </div>
        `;
    } else if (typeof data === 'object' && data !== null) {
        const keys = Object.keys(data);
        const firstKey = keys[0];
        const secondKey = keys[1] || keys[0];
        
        statsHtml = `
            <div class="grid grid-cols-2 gap-4">
                <div class="text-center py-2">
                    <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">${data[firstKey] || 'N/A'}</div>
                    <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">${firstKey}</div>
                </div>
                <div class="text-center py-2">
                    <div class="text-2xl font-bold text-green-600 dark:text-green-400">${data[secondKey] || 'N/A'}</div>
                    <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">${secondKey}</div>
                </div>
            </div>
        `;
    } else {
        statsHtml = `
            <div class="text-center py-4">
                <div class="text-3xl font-bold text-blue-600 dark:text-blue-400">${data}</div>
                <div class="text-sm text-gray-500 dark:text-gray-400 mt-2">${calculationName}</div>
            </div>
        `;
    }
    
    cardContent.innerHTML = statsHtml;
}

function updateStatsCardFromData(cardElement, leftData, rightData, config) {
    const cardContent = cardElement.querySelector('.card-content');
    
    let leftValue, rightValue;
    
    // Calculate left value
    if (config.leftType === 'count') {
        leftValue = Array.isArray(leftData) ? leftData.length : 1;
    } else {
        leftValue = config.leftField && leftData[config.leftField] ? leftData[config.leftField] : 'N/A';
    }
    
    // Calculate right value
    if (config.rightType === 'count') {
        rightValue = Array.isArray(rightData) ? rightData.length : 1;
    } else {
        rightValue = config.rightField && rightData[config.rightField] ? rightData[config.rightField] : 'N/A';
    }
    
    const statsHtml = `
        <div class="grid grid-cols-2 gap-4">
            <div class="text-center py-2">
                <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">${leftValue}</div>
                <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">${config.leftLabel || 'Metric 1'}</div>
            </div>
            <div class="text-center py-2">
                <div class="text-2xl font-bold text-green-600 dark:text-green-400">${rightValue}</div>
                <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">${config.rightLabel || 'Metric 2'}</div>
            </div>
        </div>
    `;
    
    cardContent.innerHTML = statsHtml;
}

function updateTableCard(cardElement, data, maxRows = 10, showPagination = false) {
    const cardContent = cardElement.querySelector('.card-content');
    
    if (!Array.isArray(data) || data.length === 0) {
        cardContent.innerHTML = '<div class="text-gray-600 p-4">No data available</div>';
        return;
    }
    
    // Get headers from first object
    const headers = Object.keys(data[0]);
    const displayData = data.slice(0, maxRows);
    
    const tableHtml = `
        <div class="overflow-x-auto">
            <table class="w-full text-sm">
                <thead class="bg-gray-50 dark:bg-gray-700">
                    <tr>
                        ${headers.map(header => `<th class="px-3 py-2 text-left font-medium text-gray-900 dark:text-white">${header}</th>`).join('')}
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-200 dark:divide-gray-600">
                    ${displayData.map(row => `
                        <tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
                            ${headers.map(header => `<td class="px-3 py-2 text-gray-900 dark:text-white">${row[header] || ''}</td>`).join('')}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            ${showPagination && data.length > maxRows ? `
                <div class="mt-3 text-xs text-gray-500 dark:text-gray-400 text-center">
                    Showing ${maxRows} of ${data.length} rows
                </div>
            ` : ''}
        </div>
    `;
    
    cardContent.innerHTML = tableHtml;
}

document.addEventListener('change', function(e) {
    if (e.target && e.target.id === 'stats-left-type') {
        const fieldInput = document.getElementById('stats-left-field');
        fieldInput.style.display = e.target.value === 'field' ? 'block' : 'none';
    }
    
    if (e.target && e.target.id === 'stats-right-type') {
        const fieldInput = document.getElementById('stats-right-field');
        fieldInput.style.display = e.target.value === 'field' ? 'block' : 'none';
    }
    
    // Auto-populate chart fields when calculation is selected
    if (e.target && e.target.id === 'chart-calculation') {
        const calculationId = e.target.value;
        if (calculationId) {
            populateChartFieldsFromCalculation(calculationId);
        }
    }
    
    // Auto-populate chart fields when manual subroute is selected
    if (e.target && e.target.id === 'chart-subroute') {
        const subroute = e.target.value;
        if (subroute) {
            populateChartFieldsFromSubroute(subroute);
        }
    }
});


async function populateChartFieldsFromCalculation(calculationId) {
    try {
        const data = await executeCalculationById(calculationId);
        populateChartAxisFields(data);
    } catch (error) {
        console.error('Error loading calculation data for field population:', error);
    }
}

// Helper function to populate chart fields from subroute
async function populateChartFieldsFromSubroute(subroute) {
    try {
        const response = await cachedFetch(`${dashboardSource[3]}${subroute}`, {}, { ttl: 180000 });
        const data = await response.json();
        populateChartAxisFields(data);
    } catch (error) {
        console.error('Error loading subroute data for field population:', error);
    }
}

// Helper function to populate chart axis field dropdowns
function populateChartAxisFields(data) {
    let fields = [];
    
    if (Array.isArray(data) && data.length > 0) {
        // Handle array data
        if (typeof data[0] === 'object') {
            fields = Object.keys(data[0]);
        }
    } else if (typeof data === 'object' && data !== null) {
        // Handle object data (like grouped results)
        if (data.chartType && data.data) {
            // Handle chart-formatted data from calculations
            fields = data.data.length > 0 ? Object.keys(data.data[0]) : ['x', 'y'];
        } else {
            fields = Object.keys(data);
        }
    }
    
    const xFieldInput = document.getElementById('chart-x-field');
    const yFieldInput = document.getElementById('chart-y-field');
    
    if (fields.length > 0 && xFieldInput && yFieldInput) {
        // Convert text inputs to select dropdowns
        const xFieldSelect = document.createElement('select');
        xFieldSelect.id = 'chart-x-field';
        xFieldSelect.className = xFieldInput.className;
        xFieldSelect.innerHTML = fields.map(field => `<option value="${field}">${field}</option>`).join('');
        
        const yFieldSelect = document.createElement('select');
        yFieldSelect.id = 'chart-y-field';
        yFieldSelect.className = yFieldInput.className;
        yFieldSelect.innerHTML = fields.map(field => `<option value="${field}">${field}</option>`).join('');
        
        xFieldInput.parentNode.replaceChild(xFieldSelect, xFieldInput);
        yFieldInput.parentNode.replaceChild(yFieldSelect, yFieldInput);
    }
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

function updateChartCard(cardElement, data, chartType = 'bar', xField = 'x', yField = 'y', title = '') {
    const cardContent = cardElement.querySelector('.card-content');
    
    cardContent.innerHTML = `
        <canvas id="chartjs-${cardElement.dataset.cardId}" class="w-full h-64"></canvas>
    `;
    
    setTimeout(() => {
        if (window.Chart) {
            const canvas = document.getElementById(`chartjs-${cardElement.dataset.cardId}`);
            if (!canvas) {
                console.error('Canvas element not found');
                return;
            }
            
            const ctx = canvas.getContext('2d');
            let chartData = [];
            
            // Handle different data formats
            if (data && data.chartType && data.data) {
                // Data is already formatted for charts (from calculation)
                chartData = data.data;
                chartType = data.chartType || chartType;
                title = data.title || title;
                xField = data.xField || xField;
                yField = data.yField || yField;
            } else if (Array.isArray(data)) {
                // Regular array data
                chartData = data.filter(item => item && typeof item === 'object');
            } else {
                console.error('Invalid data format for chart');
                cardContent.innerHTML = '<div class="text-gray-600 p-4">Invalid data format for chart</div>';
                return;
            }
            
            if (chartData.length === 0) {
                cardContent.innerHTML = '<div class="text-gray-600 p-4">No data available for chart</div>';
                return;
            }
            
            // Extract labels and values
            const labels = chartData.map(item => {
                const label = item[xField] ?? item.x ?? 'Unknown';
                return String(label);
            });
            
            const values = chartData.map(item => {
                const value = item[yField] ?? item.y ?? item._original?.[yField] ?? 0;
                return typeof value === 'number' ? value : parseFloat(value) || 0;
            });
            
            // Destroy existing chart if it exists
            if (window.chartInstances && window.chartInstances[cardElement.dataset.cardId]) {
                window.chartInstances[cardElement.dataset.cardId].destroy();
            }
            
            if (!window.chartInstances) {
                window.chartInstances = {};
            }
            
            // Create chart configuration
            const config = {
                type: chartType,
                data: {
                    labels: labels,
                    datasets: [{
                        label: yField,
                        data: values,
                        backgroundColor: chartType === 'line' ? 'rgba(59,130,246,0.1)' : 
                                       chartType === 'pie' || chartType === 'doughnut' ? 
                                       labels.map((_, i) => `hsl(${i * 360 / labels.length}, 70%, 60%)`) :
                                       'rgba(59,130,246,0.5)',
                        borderColor: chartType === 'pie' || chartType === 'doughnut' ? 
                                   labels.map((_, i) => `hsl(${i * 360 / labels.length}, 70%, 50%)`) :
                                   'rgba(59,130,246,1)',
                        borderWidth: 2,
                        fill: chartType === 'line'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: !!title,
                            text: title
                        },
                        legend: {
                            display: true,
                            position: 'top'
                        }
                    },
                    scales: chartType !== 'pie' && chartType !== 'doughnut' ? {
                        x: {
                            title: {
                                display: !!xField,
                                text: xField
                            }
                        },
                        y: {
                            beginAtZero: true,
                            title: {
                                display: !!yField,
                                text: yField
                            }
                        }
                    } : {}
                }
            };
            
            window.chartInstances[cardElement.dataset.cardId] = new Chart(ctx, config);
        } else {
            cardContent.innerHTML = '<div class="text-red-600 mt-2 p-4">ChartJS library not loaded</div>';
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
}

function getCacheStats() {
    const stats = window.apiCache.getStats();
    return stats;
}

function cleanupExpiredCache() {
    window.apiCache.cleanup();
}

function invalidateCacheByPattern(pattern) {
    window.apiCache.invalidateByPattern(pattern);
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