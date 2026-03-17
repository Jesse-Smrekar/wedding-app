const MAX_PHOTOS = 10;
const RAW_EXTS = /\.(heic|heif|raw|arw|cr2|nef|orf|rw2|sr2)$/i;
var selectedFiles = [];

var input,uploadArea,grid,countEl,submitBtn;

window.onload = () => {
    input      = document.getElementById('photo-input');
    uploadArea = document.getElementById('upload-area');
    grid       = document.getElementById('preview-grid');
    countEl    = document.getElementById('photo-count');
    submitBtn  = document.getElementById('photos-submit-btn');

    // ── File input change ──
    input.addEventListener('change', () => {
        addFiles(Array.from(input.files));
        input.value = '';
    });

    // ── Drag and drop ──
    uploadArea.addEventListener('dragover', e => {
        e.preventDefault();
        uploadArea.classList.add('drag-over');
    });
    uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('drag-over'));
    uploadArea.addEventListener('drop', e => {
        e.preventDefault();
        uploadArea.classList.remove('drag-over');
        addFiles(Array.from(e.dataTransfer.files));
    });
};

function addFiles(newFiles) {
    const remaining = MAX_PHOTOS - selectedFiles.length;
    newFiles.slice(0, remaining).forEach(f => selectedFiles.push(f));
    renderPreviews();
}

function removeFile(index) {
    selectedFiles.splice(index, 1);
    renderPreviews();
}


function renderPreviews() {
    grid.innerHTML = '';

    selectedFiles.forEach((file, i) => {
        const item = document.createElement('div');
        item.className = 'preview-item';

        const canPreview = file.type.startsWith('image/') && !RAW_EXTS.test(file.name);

        if (canPreview) {
            const img = document.createElement('img');
            const url = URL.createObjectURL(file);
            img.src = url;
            img.onload = () => URL.revokeObjectURL(url);
            item.appendChild(img);
        } else {
            const placeholder = document.createElement('div');
            placeholder.className = 'preview-item-placeholder';
            placeholder.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="currentColor" viewBox="0 0 512 512" style="opacity:0.5;">
                    <path d="M193.1 32c-18.7 0-36.2 9.4-46.6 24.9L120.5 96 64 96C28.7 96 0 124.7 0 160L0 416c0 35.3 28.7 64 64 64l384 0c35.3 0 64-28.7 64-64l0-256c0-35.3-28.7-64-64-64l-56.5 0-26-39.1C355.1 41.4 337.6 32 318.9 32L193.1 32zm-6.7 51.6c1.5-2.2 4-3.6 6.7-3.6l125.7 0c2.7 0 5.2 1.3 6.7 3.6l33.2 49.8c4.5 6.7 11.9 10.7 20 10.7l69.3 0c8.8 0 16 7.2 16 16l0 256c0 8.8-7.2 16-16 16L64 432c-8.8 0-16-7.2-16-16l0-256c0-8.8 7.2-16 16-16l69.3 0c8 0 15.5-4 20-10.7l33.2-49.8zM256 384a112 112 0 1 0 0-224 112 112 0 1 0 0 224zM192 272a64 64 0 1 1 128 0 64 64 0 1 1 -128 0z"/>
                </svg>
                <span class="preview-item-filename">${file.name}</span>
            `;
            item.appendChild(placeholder);
        }

        const removeBtn = document.createElement('button');
        removeBtn.className = 'preview-remove';
        removeBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708"/>
            </svg>
        `;
        removeBtn.onclick = e => { e.stopPropagation(); removeFile(i); };
        item.appendChild(removeBtn);

        grid.appendChild(item);
    });

    const atLimit = selectedFiles.length >= MAX_PHOTOS;
    if (selectedFiles.length > 0) {
        countEl.textContent = `${selectedFiles.length} / ${MAX_PHOTOS} photos selected`;
        countEl.className = 'photo-count' + (atLimit ? ' at-limit' : '');
        countEl.style.display = 'block';
    } else {
        countEl.style.display = 'none';
    }

    uploadArea.style.display = atLimit ? 'none' : 'flex';
    submitBtn.disabled = selectedFiles.length === 0;
}

function updateCharCount() {
    const len = document.getElementById('photo-note').value.length;
    document.getElementById('note-char-count').textContent = `${len} / 500`;
}

function submitPhotos() {
    const note = document.getElementById('photo-note').value.trim();
    const formData = new FormData();
    selectedFiles.forEach(f => formData.append('photos', f));
    if (note) formData.append('note', note);

    // TODO: wire up back-end endpoint
    // fetch('/photos/upload', { method: 'POST', body: formData })
    //     .then(res => res.json())
    //     .then(data => { ... });
}
