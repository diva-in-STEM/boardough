// Drag and Drop Functionality
let draggedElement = null;
let cardCounter = 0;
const instructions = document.getElementById('drag-instructions')

// Add drag event listeners to all draggable components
document.querySelectorAll('.draggable-component').forEach(component => {
    component.addEventListener('dragstart', handleDragStart);
    component.addEventListener('dragend', handleDragEnd);
    component.setAttribute('draggable', 'true');
});

// Add drop event listeners to drop zone
const dropZone = document.getElementById('drop-zone');
dropZone.addEventListener('dragover', handleDragOver);
dropZone.addEventListener('drop', handleDrop);

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
        const componentTitle = draggedElement.dataset.title;
        const componentDescription = draggedElement.dataset.description;
        let componentSpan = 'col-span-1';

        if (componentType == 'title') {
            componentSpan = 'col-span-full';
        };
        
        createCard(componentType, componentTitle, componentDescription, componentSpan);

        if (instructions) {
            instructions.remove()
        }
    }
}

function createCard(type, title, description, span) {
    cardCounter++;
    const cardGrid = document.getElementById('card-grid');
    
    const card = document.createElement('div');
    card.className = `bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-200 ${span}`;
    card.innerHTML = `
        <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-900">${title}</h3>
            <div class="flex items-center space-x-2">
                <button class="text-gray-400 hover:text-gray-600" onclick="editCard(this)">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="text-gray-400 hover:text-red-600" onclick="deleteCard(this)">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
        <div class="text-sm text-gray-600 mb-4">${description}</div>
        <div class="card-content">
            ${getCardContent(type)}
        </div>
    `;
    
    cardGrid.appendChild(card);
}

function getCardContent(type) {
    switch(type) {
        case 'title':
            return `
                <div contenteditable="true" class="bg-gray-100 rounded flex">
                        
                </div>
            `;
        case 'chart':
            return `
                <div class="h-32 bg-gray-100 rounded flex items-center justify-center">
                    <i class="fas fa-chart-line text-4xl text-gray-400"></i>
                </div>
                <div class="mt-2 text-xs text-gray-500">Chart visualization will appear here</div>
            `;
        case 'stats':
            return `
                <div class="grid grid-cols-2 gap-4">
                    <div class="text-center">
                        <div class="text-2xl font-bold text-blue-600">1,234</div>
                        <div class="text-xs text-gray-500">Total Users</div>
                    </div>
                    <div class="text-center">
                        <div class="text-2xl font-bold text-green-600">89%</div>
                        <div class="text-xs text-gray-500">Success Rate</div>
                    </div>
                </div>
            `;
        case 'table':
            return `
                <div class="overflow-x-auto">
                    <table class="w-full text-sm">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-2 py-1 text-left">Name</th>
                                <th class="px-2 py-1 text-left">Value</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr><td class="px-2 py-1">Item 1</td><td class="px-2 py-1">100</td></tr>
                            <tr><td class="px-2 py-1">Item 2</td><td class="px-2 py-1">200</td></tr>
                        </tbody>
                    </table>
                </div>
            `;
        case 'calendar':
            return `
                <div class="h-32 bg-gray-100 rounded flex items-center justify-center">
                    <i class="fas fa-calendar text-4xl text-gray-400"></i>
                </div>
                <div class="mt-2 text-xs text-gray-500">Calendar events will appear here</div>
            `;
        case 'notes':
            return `
                <div class="bg-yellow-50 border border-yellow-200 rounded p-3">
                    <div class="text-sm text-gray-700">Sample note content...</div>
                </div>
            `;
        case 'weather':
            return `
                <div class="flex items-center justify-center h-20">
                    <div class="text-center">
                        <i class="fas fa-sun text-3xl text-yellow-500"></i>
                        <div class="text-lg font-semibold">22°C</div>
                        <div class="text-xs text-gray-500">Sunny</div>
                    </div>
                </div>
            `;
        default:
            return '<div class="text-gray-500">Component content</div>';
    }
}

function editCard(button) {
    const card = button.closest('.bg-white');
    const title = card.querySelector('h3').textContent;
    const newTitle = prompt('Enter new title:', title);
    if (newTitle) {
        card.querySelector('h3').textContent = newTitle;
    }
}

function deleteCard(button) {
    const card = button.closest('.bg-white');
    if (confirm('Are you sure you want to delete this card?')) {
        card.remove();
    }
}