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
        { type: "calculate", label: "Calculate", desc: "Create calculated fields" },
        { type:"chart", label:"Chart", desc:"Convert data for Chart.js visualization" }
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
        case"chart":
            return processChart(step, data);
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

function processChart(step, inputData) {
    const config = step.config || {};
    
    if (!config.xField || !config.yField) {
        throw new Error('Chart step requires both X and Y field configuration');
    }
    
    if (!Array.isArray(inputData)) {
        throw new Error('Chart step requires array input');
    }
    
    // Handle grouped data (arrays with items property)
    let data = inputData;
    if (inputData.length > 0 && inputData[0].items && Array.isArray(inputData[0].items)) {
        data = inputData.flatMap(group => group.items);
    }
    
    // Filter and map data points
    const chartData = data.map(item => ({
        x: item[config.xField],
        y: item[config.yField],
        _original: item
    })).filter(point => 
        point.x !== undefined && point.x !== null && 
        point.y !== undefined && point.y !== null
    );
    
    // Sort by X values if requested
    if (config.sortByX) {
        chartData.sort((a, b) => {
            if (typeof a.x === 'number' && typeof b.x === 'number') {
                return a.x - b.x;
            }
            return String(a.x).localeCompare(String(b.x));
        });
    }
    
    return {
        chartType: config.chartType || 'line',
        data: chartData,
        xField: config.xField,
        yField: config.yField,
        title: config.title || `${config.yField} by ${config.xField}`,
        xLabel: config.xLabel || config.xField,
        yLabel: config.yLabel || config.yField
    };
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
        case "chart":
            return generateChartForm(config, inputData);
        default:
            return "<p>No configuration needed for this step.</p>";
    }
}

function generateChartForm(config, inputData) {
    let data = inputData;
    let availableFields = [];
    
    // Handle different input data formats
    if (Array.isArray(inputData)) {
        if (inputData.length > 0) {
            // Check if it's grouped data with items
            if (inputData[0].items && Array.isArray(inputData[0].items)) {
                data = inputData[0].items.length > 0 ? inputData[0].items : [];
                if (data.length > 0) {
                    availableFields = Object.keys(data[0]);
                }
            } else {
                availableFields = Object.keys(inputData[0]);
            }
        }
    }

    return `
        <div class="grid grid-cols-2 gap-4">
            <div>
                <h4 class="font-semibold mb-2 text-gray-900 dark:text-white">Input Data Preview</h4>
                <pre class="bg-gray-100 dark:bg-gray-900 p-2 rounded text-xs max-h-48 overflow-auto">${
                    inputData ? JSON.stringify(Array.isArray(data) ? data.slice(0, 3) : data, null, 2) : "No data"
                }</pre>
                <div class="mt-2 text-xs text-gray-600 dark:text-gray-400">
                    <strong>Available fields:</strong> ${availableFields.join(", ")}
                </div>
            </div>
            <div>
                <h4 class="font-semibold mb-2 text-gray-900 dark:text-white">Chart Configuration</h4>
                <div class="space-y-3">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Chart Type</label>
                        <select id="chart-type" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white" onchange="previewNodeConfig()">
                            <option value="line" ${config.chartType === "line" ? "selected" : ""}>Line Chart</option>
                            <option value="bar" ${config.chartType === "bar" ? "selected" : ""}>Bar Chart</option>
                            <option value="scatter" ${config.chartType === "scatter" ? "selected" : ""}>Scatter Plot</option>
                            <option value="pie" ${config.chartType === "pie" ? "selected" : ""}>Pie Chart</option>
                            <option value="doughnut" ${config.chartType === "doughnut" ? "selected" : ""}>Doughnut Chart</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">X-Axis Field</label>
                        <select id="chart-x-field" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white" onchange="previewNodeConfig()">
                            <option value="">Select X field...</option>
                            ${availableFields.map(field => 
                                `<option value="${field}" ${config.xField === field ? "selected" : ""}>${field}</option>`
                            ).join("")}
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Y-Axis Field</label>
                        <select id="chart-y-field" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white" onchange="previewNodeConfig()">
                            <option value="">Select Y field...</option>
                            ${availableFields.map(field => 
                                `<option value="${field}" ${config.yField === field ? "selected" : ""}>${field}</option>`
                            ).join("")}
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Chart Title</label>
                        <input type="text" id="chart-title" value="${config.title || ""}" 
                               class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white" 
                               placeholder="Enter chart title..." onchange="previewNodeConfig()">
                    </div>
                    <div class="grid grid-cols-2 gap-2">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">X-Axis Label</label>
                            <input type="text" id="chart-x-label" value="${config.xLabel || ""}" 
                                   class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white" 
                                   placeholder="X-axis label..." onchange="previewNodeConfig()">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Y-Axis Label</label>
                            <input type="text" id="chart-y-label" value="${config.yLabel || ""}" 
                                   class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white" 
                                   placeholder="Y-axis label..." onchange="previewNodeConfig()">
                        </div>
                    </div>
                    <div>
                        <label class="flex items-center">
                            <input type="checkbox" id="chart-sort-x" ${config.sortByX ? "checked" : ""} 
                                   class="mr-2 rounded border-gray-300 dark:border-gray-600" onchange="previewNodeConfig()">
                            <span class="text-sm text-gray-700 dark:text-gray-300">Sort by X-axis values</span>
                        </label>
                    </div>
                    <div class="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                        <h5 class="font-medium text-blue-900 dark:text-blue-100 mb-2">Dashboard Integration</h5>
                        <p class="text-xs text-blue-800 dark:text-blue-200">
                            This chart configuration will be used when you select this calculation in dashboard chart widgets.
                            The chart type, fields, and styling will be automatically applied.
                        </p>
                    </div>
                </div>
                <div class="mt-4">
                    <h5 class="font-medium mb-2 text-gray-900 dark:text-white">Preview Result</h5>
                    <div id="node-preview" class="bg-gray-100 dark:bg-gray-900 p-2 rounded text-xs max-h-32 overflow-auto">Configure fields to see preview</div>
                </div>
            </div>
        </div>
    `;
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

function closeNodeConfigModal() {
    document.getElementById("node-config-modal").classList.add("hidden");
    window.currentEditingStep = null;
}

async function previewNodeConfig() {
    if (!window.currentEditingStep) return;
    
    const previewDiv = document.getElementById("node-preview");
    previewDiv.innerHTML = '<div class="preview-loading"><i class="fa fa-spinner fa-spin mr-2"></i>Generating preview...</div>';
    
    try {
        const config = collectNodeConfig();
        const {step, stepIndex, inputData} = window.currentEditingStep;
        
        // Create a temporary step with the new config
        const tempStep = {...step, config};
        
        // Process the step with the input data
        const result = await processCalculationStep(tempStep, inputData);
        
        // Display the result
        let displayResult = result;
        if (Array.isArray(result) && result.length > 5) {
            displayResult = [...result.slice(0, 5), {__truncated: `... and ${result.length - 5} more items`}];
        }
        
        previewDiv.innerHTML = `<pre>${JSON.stringify(displayResult, null, 2)}</pre>`;
        
    } catch (error) {
        previewDiv.innerHTML = `<div class="preview-error">Error: ${error.message}</div>`;
    }
}

function collectNodeConfig() {
    if (!window.currentEditingStep) return {};
    
    const { step } = window.currentEditingStep;
    const config = {};
    
    switch (step.type) {
        case 'filter':
            config.field = document.getElementById('filter-field')?.value || '';
            config.operator = document.getElementById('filter-operator')?.value || 'equals';
            config.value = document.getElementById('filter-value')?.value || '';
            break;
            
        case 'group':
            config.field = document.getElementById('group-field')?.value || '';
            config.outputFormat = document.getElementById('group-output-format')?.value || 'object';
            break;
            
        case 'count':
            const countType = document.getElementById('count-type');
            config.countType = countType?.value || 'items';
            break;
            
        case 'sum':
            config.field = document.getElementById('sum-field')?.value || '';
            break;
            
        case 'aggregate':
            const operations = [];
            document.querySelectorAll('#aggregate-operations > div').forEach(opDiv => {
                const type = opDiv.querySelector('.operation-type')?.value;
                const field = opDiv.querySelector('.operation-field')?.value;
                const alias = opDiv.querySelector('.operation-alias')?.value;
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
            
        case 'sort':
            config.field = document.getElementById('sort-field')?.value || '';
            config.direction = document.getElementById('sort-direction')?.value || 'asc';
            break;
            
        case 'limit':
            config.count = parseInt(document.getElementById('limit-count')?.value) || 10;
            config.offset = parseInt(document.getElementById('limit-offset')?.value) || 0;
            break;
            
        case 'distinct':
            config.field = document.getElementById('distinct-field')?.value || undefined;
            break;
            
        case 'calculate':
            const calculations = [];
            document.querySelectorAll('#calculated-fields > div').forEach(calcDiv => {
                const field = calcDiv.querySelector('.calc-field')?.value;
                const expression = calcDiv.querySelector('.calc-expression')?.value;
                const alias = calcDiv.querySelector('.calc-alias')?.value;
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
            
        case 'chart':
            config.chartType = document.getElementById('chart-type')?.value || 'line';
            config.xField = document.getElementById('chart-x-field')?.value || '';
            config.yField = document.getElementById('chart-y-field')?.value || '';
            config.title = document.getElementById('chart-title')?.value || '';
            config.xLabel = document.getElementById('chart-x-label')?.value || '';
            config.yLabel = document.getElementById('chart-y-label')?.value || '';
            config.sortByX = document.getElementById('chart-sort-x')?.checked || false;
            break;
            
        case 'join':
            config.joinField = document.getElementById('join-field')?.value || '';
            config.joinSource = parseInt(document.getElementById('join-source')?.value) || 0;
            config.joinType = document.getElementById('join-type')?.value || 'inner';
            break;
            
        case 'map':
            const mapping = {};
            const newFields = document.querySelectorAll('.field-mapping-new');
            const oldFields = document.querySelectorAll('.field-mapping-old');
            newFields.forEach((newField, index) => {
                const oldField = oldFields[index];
                if (newField.value && oldField.value) {
                    mapping[newField.value] = oldField.value;
                }
            });
            config.mapping = mapping;
            break;
    }
    
    return config;
}

function applyNodeConfiguration() {
    if (!window.currentEditingStep) return;
    
    const config = collectNodeConfig();
    const {stepIndex} = window.currentEditingStep;
    
    // Validate configuration
    if (!validateNodeConfig(window.currentEditingStep.step.type, config)) {
        return;
    }
    
    // Update the step configuration
    window.currentCalcFlow[stepIndex].config = config;
    
    // Mark as configured for visual feedback
    window.currentCalcFlow[stepIndex].configured = true;
    
    // Log for debugging
    console.log(`Applied configuration to step ${stepIndex}:`, config);
    console.log("Updated step:", window.currentCalcFlow[stepIndex]);
    
    // Re-render the flow to show updated configuration
    renderCalculationFlow();
    
    // Close modal
    closeNodeConfigModal();
}

function validateNodeConfig(e,t){
    switch(e){
        case"filter":
            if(!t.field)return alert("Please select a field to filter by."),!1;
            if(""===t.value&&"is_null"!==t.operator&&"is_not_null"!==t.operator)return alert("Please enter a value to filter by."),!1;
            break;
        case"group":
            if(!t.field)return alert("Please select a field to group by."),!1;
            break;
        case"chart":
            if(!t.xField)return alert("Please select an X-axis field."),!1;
            if(!t.yField)return alert("Please select a Y-axis field."),!1;
            break;
        case"sum":
        case"distinct":
        case"count":
        default:
            break;
        case"aggregate":
            if(!t.operations||0===t.operations.length)return alert("Please add at least one aggregation operation."),!1;
            break;
        case"sort":
            if(!t.field)return alert("Please select a field to sort by."),!1;
            break;
        case"limit":
            if(t.count<=0)return alert("Limit count must be greater than 0."),!1;
            if(t.offset<0)return alert("Offset cannot be negative."),!1;
            break;
        case"calculate":
            if(!t.calculations||0===t.calculations.length)return alert("Please add at least one calculation."),!1;
            for(let e of t.calculations)if(!e.field||!e.expression)return alert("Each calculation must have both a field name and expression."),!1;
            break;
        case"join":
            if(!t.joinField)return alert("Please select a field to join on."),!1;
            if(void 0===t.joinSource||t.joinSource<0)return alert("Please select a data source to join with."),!1;
            break;
        case"map":
            if(!t.mapping||0===Object.keys(t.mapping).length)return alert("Please add at least one field mapping."),!1
    }
    return!0
}

// Enhanced editCalcFlowNode function to use the new modal
function editCalcFlowNode(index) {
    const step = window.currentCalcFlow[index];
    if (!step || step.type === "source") return;
    
    showNodeConfigModal(step, index);
}

async function showNodeConfigModal(step, stepIndex) {
    // Get input data for this step
    let inputData = null;
    try {
        if (stepIndex > 0) {
            inputData = await getInputDataForStep(stepIndex);
        }
    } catch (e) {
        console.error("Error getting input data:", e);
    }
    
    const modal = document.getElementById("node-config-modal");
    const title = document.getElementById("node-modal-title");
    const content = document.getElementById("node-modal-content");
    
    title.textContent = `Configure ${step.label || step.type}`;
    
    // Store current step info for modal
    window.currentEditingStep = {step, stepIndex, inputData};
    
    content.innerHTML = generateNodeConfigForm(step, inputData);
    
    modal.classList.remove("hidden");
    
    // Add event listeners for real-time preview
    setTimeout(() => {
        addPreviewEventListeners();
    }, 100);
}

function addPreviewEventListeners() {
    // Add change event listeners to form inputs for real-time preview
    const inputs = document.querySelectorAll('#node-modal-content input, #node-modal-content select');
    inputs.forEach(input => {
        input.addEventListener('change', debounce(previewNodeConfig, 500));
        input.addEventListener('input', debounce(previewNodeConfig, 500));
    });
}

// Utility function to debounce function calls
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Enhanced renderCalculationFlow to show configured status
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
    
    window.currentCalcFlow.forEach((t, a) => {
        const n = document.createElement("div");
        let nodeClasses = "calc-flow-node bg-white dark:bg-gray-700 border border-blue-300 dark:border-blue-700 rounded px-4 py-3 flex flex-col items-center justify-center min-w-[120px] relative shadow-sm cursor-pointer";
        
        // Add configured class if the node has configuration
        if (t.config && Object.keys(t.config).length > 0) {
            nodeClasses += " configured";
        }
        
        n.className = nodeClasses;
        
        let displayText = t.sourceName || t.label || t.type;
        if (t.config && Object.keys(t.config).length > 0) {
            displayText += " ✓";
        }
        
        n.innerHTML = `<span class="font-semibold text-gray-900 dark:text-white">${displayText}</span>`;
        
        if (t.type !== "source" && t.inputs && t.inputs.length) {
            n.innerHTML += `<div class="text-xs mt-2 text-gray-500 dark:text-gray-400">Inputs: ${t.inputs.map(e => e.sourceName || e.label || e.type).join(", ")}</div>`;
        }
        
        n.innerHTML += `<button class="absolute top-1 right-1 text-red-500 hover:text-red-700 w-6 h-6 flex items-center justify-center" onclick="removeCalcFlowStep(${a})" title="Remove step"><i class="fa fa-times"></i></button>`;
        
        n.onclick = function(e) {
            if (!e.target.closest("button")) {
                editCalcFlowNode(a);
            }
        };
        
        e.appendChild(n);
        
        if (a < window.currentCalcFlow.length - 1) {
            const t = document.createElement("div");
            t.className = "calc-flow-arrow flex items-center justify-center";
            t.innerHTML = '<span class="mx-2 text-blue-400 text-xl">→</span>';
            e.appendChild(t);
        }
    });
}