var USER_RESULTS = [];
var SELECTED_USERS = new Set();

function getUsers() {
    fetch(`${location.origin}/admin/users`)
    .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
    })
    .then(data => {
        USER_RESULTS = data;
        SELECTED_USERS.clear();
        renderUsers();
        updateDeleteButton();
    })
    .catch(error => console.error('Error fetching users:', error));
}

function renderUsers() {
    var userTable = document.getElementById('user-results');
    userTable.innerHTML = '';

    for (var i = 0; i < USER_RESULTS.length; i++) {
        var entry = USER_RESULTS[i];
        var t = new Date(entry.next_music_queue_date);
        var timeToDisplay;
        if (t > new Date("2030-01-01") || t < new Date()) {
            timeToDisplay = "now";
        } else {
            timeToDisplay = t.toLocaleTimeString();
        }

        var selectedClass = SELECTED_USERS.has(i) ? ' selected' : '';
        userTable.innerHTML +=
            `<tr id="user-row-${i}" class="result-button${selectedClass}" onclick="toggleUser(${i})">` +
            `<td class="cell-left">${entry.first_name}</td>` +
            `<td>${entry.last_name}</td>` +
            `<td class="cell-right">${timeToDisplay}</td>` +
            `</tr>`;
    }
}

function toggleUser(index) {
    if (SELECTED_USERS.has(index)) {
        SELECTED_USERS.delete(index);
    } else {
        SELECTED_USERS.add(index);
    }
    renderUsers();
    updateDeleteButton();
}

function updateDeleteButton() {
    var btn = document.getElementById('delete-selected-button');
    if (btn) btn.disabled = SELECTED_USERS.size === 0;
}

function deleteSelectedUsers() {
    var toDelete = Array.from(SELECTED_USERS).map(i => USER_RESULTS[i]);
    var requests = toDelete.map(user =>
        fetch(`${location.origin}/admin/users?firstName=${encodeURIComponent(user.first_name)}&lastName=${encodeURIComponent(user.last_name)}`, {
            method: 'DELETE'
        })
    );
    Promise.all(requests).then(() => getUsers());
}

function purgeUsers() {
    if (!confirm('Delete all users? This cannot be undone.')) return;
    fetch(`${location.origin}/admin/users?firstName=*`, { method: 'DELETE' })
        .then(() => getUsers());
}


function toggleMusicQueue() {
    fetch(`${location.origin}/admin/toggleMusicQueue`, { method: 'PATCH' })
    .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
    })
    .then(data => window.alert(`Music queue limit is: ${data.queueLimitEnabled ? 'ON' : 'OFF'}`));
}

window.onload = () => {
    getUsers();
}
