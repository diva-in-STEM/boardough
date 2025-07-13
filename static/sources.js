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

const subrouteContainer = document.getElementById('subroutes')
let subrouteCounter = 1
document.getElementById('btnNewSub').onclick = () => {
    const label = document.createElement('label')
    label.classList.add('floating-label', 'mb-3')

    const labelText = document.createElement('span')
    subrouteCounter += 1
    labelText.innerText = `Subroute ${subrouteCounter}`
    
    const input = document.createElement('input')
    input.type = 'text'
    input.placeholder = "/data/posts"
    input.classList.add('input', 'input-md')
    input.name = `subroute${subrouteCounter}`

    label.appendChild(labelText)
    label.appendChild(input)

    subrouteContainer.appendChild(label)
}