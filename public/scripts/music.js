
function checkQueueTime() {
    makeAuthenticatedRequest('GET', '/music/info')
    .then(data => {
        if (data.queueLimitEnabled && new Date(data.nextQueueTime) > new Date()) {
            showQueueOverlay(new Date(data.nextQueueTime), data.queuedTracks || []);
        }
    });
}

function showQueueOverlay(nextQueueTime, queuedTracks) {
    var overlay = document.getElementById('queue-wait-overlay');
    var countdown = document.getElementById('queue-countdown');
    var list = document.getElementById('queued-tracks-list');

    list.innerHTML = '';
    queuedTracks.forEach(function(track) {
        var img = track.album.images[2]?.url ?? track.album.images[0]?.url ?? '';
        var orderLabel = track.order === 0 ? 'Up Next!' : 'In ' + track.order + (track.order === 1 ? ' song' : ' songs');

        var item = document.createElement('div');
        item.className = 'queued-track-item';
        item.innerHTML =
            '<img src="' + img + '" class="queued-track-thumb" />' +
            '<div class="queued-track-info">' +
                '<span class="queued-track-name">' + track.name + '</span>' +
                '<span class="queued-track-artist">' + track.artists[0].name + '</span>' +
            '</div>' +
            '<span class="queued-track-order">' + orderLabel + '</span>';
        list.appendChild(item);
    });

    overlay.style.display = 'flex';

    function tick() {
        var remaining = nextQueueTime - new Date();
        if (remaining <= 0) {
            overlay.style.display = 'none';
            return;
        }
        var minutes = Math.floor(remaining / (60 * 1000));
        var seconds = Math.floor((remaining % (60 * 1000)) / 1000);
        countdown.textContent = minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
    }

    tick();
    var interval = setInterval(function() {
        var remaining = nextQueueTime - new Date();
        if (remaining <= 0) {
            clearInterval(interval);
            overlay.style.display = 'none';
            return;
        }
        tick();
    }, 1000);
}

function adjustResultsOffset() {
    var staticTop = document.getElementById('static-top');
    var container = document.getElementById('search-results-container');
    if (staticTop && container) {
        container.style.paddingTop = staticTop.offsetHeight + 'px';
    }
}

document.addEventListener('DOMContentLoaded', function() {
    adjustResultsOffset();
    checkQueueTime();
});
