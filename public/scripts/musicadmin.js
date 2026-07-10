var MUSIC_SETTINGS = {
    musicEnabled: null,
    queueLimitEnabled: null,
    queueWaitMinutes: null,
    explicitAllowed: null,
};

function renderSettings() {
    document.getElementById('music-enabled-toggle').checked =
        !!MUSIC_SETTINGS.musicEnabled;
    document.getElementById('queue-limit-toggle').checked =
        !!MUSIC_SETTINGS.queueLimitEnabled;
    document.getElementById('explicit-toggle').checked =
        !!MUSIC_SETTINGS.explicitAllowed;
    var input = document.getElementById('queue-minutes');
    if (document.activeElement !== input) {
        input.value = MUSIC_SETTINGS.queueWaitMinutes ?? '';
    }
}

function blockNonNumericKeys(e) {
    var allowed = ['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
    if (allowed.includes(e.key)) return true;
    if (/^[0-9]$/.test(e.key)) return true;
    e.preventDefault();
    return false;
}

function loadSettings() {
    fetch(`${location.origin}/musicadmin/settings`)
        .then(res => {
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            return res.json();
        })
        .then(data => {
            MUSIC_SETTINGS = data;
            renderSettings();
        })
        .catch(err => console.error('Error loading music settings:', err));
}

function toggleMusic() {
    fetch(`${location.origin}/musicadmin/toggle-music`, { method: 'PATCH' })
        .then(res => {
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            return res.json();
        })
        .then(data => {
            MUSIC_SETTINGS.musicEnabled = data.musicEnabled;
            renderSettings();
        })
        .catch(err => console.error('Error toggling music:', err));
}

function toggleQueueLimit() {
    fetch(`${location.origin}/musicadmin/toggle-queue-limit`, { method: 'PATCH' })
        .then(res => {
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            return res.json();
        })
        .then(data => {
            MUSIC_SETTINGS.queueLimitEnabled = data.queueLimitEnabled;
            renderSettings();
        })
        .catch(err => console.error('Error toggling queue limit:', err));
}

function toggleExplicit() {
    fetch(`${location.origin}/musicadmin/toggle-explicit`, { method: 'PATCH' })
        .then(res => {
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            return res.json();
        })
        .then(data => {
            MUSIC_SETTINGS.explicitAllowed = data.explicitAllowed;
            renderSettings();
        })
        .catch(err => console.error('Error toggling explicit:', err));
}

function submitQueueMinutes(value) {
    var next = parseInt(value, 10);
    if (Number.isNaN(next) || next < 0) {
        renderSettings();
        return;
    }
    fetch(`${location.origin}/musicadmin/queue-limit?minutes=${next}`, { method: 'PATCH' })
        .then(res => {
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            return res.json();
        })
        .then(data => {
            MUSIC_SETTINGS.queueWaitMinutes = data.queueWaitMinutes;
            renderSettings();
        })
        .catch(err => console.error('Error updating queue minutes:', err));
}

function clearQueueHistory() {
    if (!confirm('Clear the history of queued tracks? Songs that have already been played will be able to be queued again.')) {
        return;
    }
    fetch(`${location.origin}/musicadmin/queue-history`, { method: 'DELETE' })
        .then(res => {
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        })
        .catch(err => console.error('Error clearing queue history:', err));
}

window.onload = () => {
    loadSettings();
};
