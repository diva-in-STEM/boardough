const dialog = document.getElementById('add_source_modal');

const pages = [...dialog.querySelectorAll('.step-page')];
const steps = [...dialog.querySelectorAll('#steps .step')];
const btnNext = document.getElementById('btnNext');
const btnSubmit = document.getElementById('btnSubmit');
const btnBack = document.getElementById('btnBack');
let current = 0;

function updateView() {
    pages.forEach((p, i) => p.classList.toggle('hidden', i !== current));
    steps.forEach((s, i) => {
        s.classList.toggle('step-primary', i <= current);
    });
    
    btnBack.toggleAttribute('hidden', current === 0);
    
    // Check if we're on the last step
    if (current === pages.length - 1) {
        btnNext.hidden = true;
        btnSubmit.hidden = false;
        btnSubmit.classList.remove('hidden');
    } else {
        btnNext.hidden = false;
        btnSubmit.hidden = true;
        btnSubmit.classList.add('hidden');
    }
}

document.getElementById('btnNext').onclick = () => {
    // Only validate if there are inputs on the current page
    const inputs = pages[current].querySelectorAll('input');
    if (inputs.length > 0) {
        for (let inp of inputs) {
            if (!inp.value.trim()) return alert('Please fill all fields');
        }
    }
    current++;
    updateView();
};

document.getElementById('btnBack').onclick = () => {
    current--;
    updateView();
};

// Initialize the view - make sure buttons are in correct state
updateView();

// Edit modal functionality
let editCurrentStep = 0;
let editSubrouteCount = 0;

function openEditSourceModal(sourceName, createdBy, route, subroutes = []) {
    // Set the composite primary key values
    document.getElementById('edit-source-original-name').value = sourceName;
    document.getElementById('edit-source-created-by').value = createdBy;
    document.getElementById('edit-source-form').action = `/api/update/source/${sourceName}/${createdBy}`;
    
    // Update the modal title
    document.getElementById('edit-source-modal-title').textContent = 'Updating source: ' + sourceName;
    
    // Fill in the form fields
    document.getElementById('edit_source_name').value = sourceName;
    document.getElementById('edit_source_route').value = route;
    
    // Reset to first step
    editCurrentStep = 0;
    showEditStep(editCurrentStep);
    
    // Clear and populate subroutes
    const editSubroutesContainer = document.getElementById('edit-subroutes');
    editSubroutesContainer.innerHTML = '';
    editSubrouteCount = 0;
    
    // Add existing subroutes
    if (subroutes && subroutes.length > 0) {
        subroutes.forEach(subroute => {
            // subroute structure: (id, route, source_name, created_by)
            const subrouteRoute = subroute[1]; // Extract the route from the tuple
            addEditSubroute(subrouteRoute, subroute[0]); // Pass route and id
        });
    } else {
        // Add at least one empty subroute field if no existing subroutes
        addEditSubroute();
    }
    
    // Show the modal
    document.getElementById('edit_source_modal').classList.remove('hidden');
}

function showEditStep(step) {
    const editSteps = document.querySelectorAll('.edit-step-page');
    const editStepIndicators = document.querySelectorAll('#edit-steps li');
    const editStepConnectors = document.querySelectorAll('.edit-step-connector');
    const btnEditNext = document.getElementById('btnEditNext');
    const btnEditBack = document.getElementById('btnEditBack');
    const btnEditSubmit = document.getElementById('btnEditSubmit');
    const btnEditDelete = document.getElementById('btnEditDelete');

    editSteps.forEach((stepEl, index) => {
        stepEl.classList.toggle('hidden', index !== step);
    });

    editStepIndicators.forEach((indicator, index) => {
        const circle = indicator.querySelector('div');
        if (index <= step) {
            circle.classList.remove('bg-gray-100', 'dark:bg-gray-700');
            circle.classList.add('bg-blue-100', 'dark:bg-blue-800');
            indicator.classList.add('text-blue-600', 'dark:text-blue-500');
        } else {
            circle.classList.remove('bg-blue-100', 'dark:bg-blue-800');
            circle.classList.add('bg-gray-100', 'dark:bg-gray-700');
            indicator.classList.remove('text-blue-600', 'dark:text-blue-500');
        }
    });

    editStepConnectors.forEach((connector, index) => {
        if (index < step) {
            connector.classList.remove('border-gray-100', 'dark:border-gray-700');
            connector.classList.add('border-blue-100', 'border-blue-600', 'dark:border-blue-500');
        } else {
            connector.classList.remove('border-blue-100', 'border-blue-600', 'dark:border-blue-500');
            connector.classList.add('border-gray-100', 'dark:border-gray-700');
        }
    });

    btnEditBack.classList.toggle('hidden', step === 0);
    btnEditNext.classList.toggle('hidden', step === editSteps.length - 1);
    btnEditSubmit.classList.toggle('hidden', step !== editSteps.length - 1);
    btnEditDelete.classList.remove('hidden'); // Always show delete button
}

function addEditSubroute(defaultValue = '', subrouteId = null) {
    editSubrouteCount++;
    const editSubroutesContainer = document.getElementById('edit-subroutes');
    const newSubroute = document.createElement('div');
    newSubroute.className = 'edit-subroute-item';
    
    // Include hidden input for subroute ID if it exists (for existing subroutes)
    const hiddenIdInput = subrouteId ? 
        `<input type="hidden" name="subroute_id${editSubrouteCount}" value="${subrouteId}">` : '';
    
    newSubroute.innerHTML = `
        <label for="edit_subroute${editSubrouteCount}" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Subroute ${editSubrouteCount}</label>
        <div class="flex gap-2">
            ${hiddenIdInput}
            <input type="text" name="subroute${editSubrouteCount}" id="edit_subroute${editSubrouteCount}" value="${defaultValue}" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500" placeholder="/data/endpoint${editSubrouteCount}">
            <button type="button" class="text-red-600 hover:text-red-800 p-2.5 rounded-lg hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20 remove-edit-subroute">
                <i class="fa-solid fa-minus"></i>
            </button>
        </div>
    `;
    editSubroutesContainer.appendChild(newSubroute);
    updateEditRemoveButtons();
}

function updateEditRemoveButtons() {
    const removeButtons = document.querySelectorAll('.remove-edit-subroute');
    const subrouteItems = document.querySelectorAll('.edit-subroute-item');
    
    removeButtons.forEach(button => {
        button.classList.toggle('hidden', subrouteItems.length <= 1);
    });
}

function confirmSourceDelete() {
    document.getElementById('edit_source_modal').classList.add('hidden');
    document.getElementById('delete_source_confirmation_modal').classList.remove('hidden');
}

function deleteSource() {
    const originalName = document.getElementById('edit-source-original-name').value;
    const createdBy = document.getElementById('edit-source-created-by').value;
    
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = `/api/delete/source/${originalName}/${createdBy}`;
    
    // Add the composite primary key as form data
    const originalNameInput = document.createElement('input');
    originalNameInput.type = 'hidden';
    originalNameInput.name = 'original_name';
    originalNameInput.value = originalName;
    form.appendChild(originalNameInput);
    
    const createdByInput = document.createElement('input');
    createdByInput.type = 'hidden';
    createdByInput.name = 'created_by';
    createdByInput.value = createdBy;
    form.appendChild(createdByInput);
    
    document.body.appendChild(form);
    form.submit();
}

// Event listeners for edit modal
document.addEventListener('DOMContentLoaded', function() {
    // Edit modal navigation
    const btnEditNext = document.getElementById('btnEditNext');
    const btnEditBack = document.getElementById('btnEditBack');
    
    if (btnEditNext) {
        btnEditNext.addEventListener('click', function() {
            const editSteps = document.querySelectorAll('.edit-step-page');
            if (editCurrentStep < editSteps.length - 1) {
                editCurrentStep++;
                showEditStep(editCurrentStep);
            }
        });
    }
    
    if (btnEditBack) {
        btnEditBack.addEventListener('click', function() {
            if (editCurrentStep > 0) {
                editCurrentStep--;
                showEditStep(editCurrentStep);
            }
        });
    }
    
    // Add edit subroute functionality
    const btnEditNewSub = document.getElementById('btnEditNewSub');
    if (btnEditNewSub) {
        btnEditNewSub.addEventListener('click', function() {
            addEditSubroute();
        });
    }
    
    // Remove edit subroute function
    document.addEventListener('click', function(e) {
        if (e.target.closest('.remove-edit-subroute')) {
            const subrouteItem = e.target.closest('.edit-subroute-item');
            subrouteItem.remove();
            updateEditRemoveButtons();
        }
    });
});

document.addEventListener('DOMContentLoaded', function() {

    // Toast auto-hide functionality
    const toastElements = document.querySelectorAll('[id^="toast-"]');
    
    toastElements.forEach(function(toast) {
        setTimeout(function() {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.3s ease-out';
            
            setTimeout(function() {
                toast.remove();
            }, 300);
        }, 10000);
    });

    // Multi-step form functionality
    let currentStep = 0;
    const steps = document.querySelectorAll('.step-page');
    const stepIndicators = document.querySelectorAll('#steps li');
    const stepConnectors = document.querySelectorAll('.step-connector');
    const btnNext = document.getElementById('btnNext');
    const btnBack = document.getElementById('btnBack');
    const btnSubmit = document.getElementById('btnSubmit');

    function showStep(step) {
        steps.forEach((stepEl, index) => {
            stepEl.classList.toggle('hidden', index !== step);
        });

        stepIndicators.forEach((indicator, index) => {
            const circle = indicator.querySelector('div');
            if (index <= step) {
                circle.classList.remove('bg-gray-100', 'dark:bg-gray-700');
                circle.classList.add('bg-blue-100', 'dark:bg-blue-800');
                indicator.classList.add('text-blue-600', 'dark:text-blue-500');
            } else {
                circle.classList.remove('bg-blue-100', 'dark:bg-blue-800');
                circle.classList.add('bg-gray-100', 'dark:bg-gray-700');
                indicator.classList.remove('text-blue-600', 'dark:text-blue-500');
            }
        });

        // Update step connectors to only fill when previous step is completed
        stepConnectors.forEach((connector, index) => {
            if (index < step) {
                connector.classList.remove('border-gray-100', 'dark:border-gray-700');
                connector.classList.add('border-blue-100', 'border-blue-600', 'dark:border-blue-500');
            } else {
                connector.classList.remove('border-blue-100', 'border-blue-600', 'dark:border-blue-500');
                connector.classList.add('border-gray-100', 'dark:border-gray-700');
            }
        });

        btnBack.classList.toggle('hidden', step === 0);
        btnNext.classList.toggle('hidden', step === steps.length - 1);
        btnSubmit.classList.toggle('hidden', step !== steps.length - 1);
    }

    btnNext.addEventListener('click', function() {
        if (currentStep < steps.length - 1) {
            currentStep++;
            showStep(currentStep);
        }
    });

    btnBack.addEventListener('click', function() {
        if (currentStep > 0) {
            currentStep--;
            showStep(currentStep);
        }
    });
    
    function updateRemoveButtons() {
        const removeButtons = document.querySelectorAll('.remove-subroute');
        const subrouteItems = document.querySelectorAll('.subroute-item');
        
        removeButtons.forEach(button => {
            button.classList.toggle('hidden', subrouteItems.length <= 0);
        });
    }
    let subrouteCounter = 1;
    document.getElementById('btnNewSub').addEventListener('click', function() {
        subrouteCounter++;
        const subroutesContainer = document.getElementById('subroutes');
        const newSubroute = document.createElement('div');
        newSubroute.className = 'subroute-item';
        newSubroute.innerHTML = `
            <label for="subroute${subrouteCounter}" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Subroute ${subrouteCounter}</label>
            <div class="flex gap-2">
                <input type="text" name="subroute${subrouteCounter}" id="subroute${subrouteCounter}" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500" placeholder="/data/endpoint${subrouteCounter}">
                <button type="button" class="text-red-600 hover:text-red-800 p-2.5 rounded-lg hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20 remove-subroute">
                    <i class="fa-solid fa-minus"></i>
                </button>
            </div>
        `;
        subroutesContainer.appendChild(newSubroute);
        updateRemoveButtons();
    });

    
    // Remove subroute function
    document.addEventListener('click', function(e) {
        if (e.target.closest('.remove-subroute')) {
            const subrouteItem = e.target.closest('.subroute-item');
            subrouteItem.remove();
            subrouteCounter--;
            updateRemoveButtons();
        }
    });
});