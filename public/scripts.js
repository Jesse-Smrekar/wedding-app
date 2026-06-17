var MUSIC_SEARCH_RESULTS = {};
var SELECTION = null;


function toggleActionMenu() {
    var open = document.getElementById('menu-slide').classList.contains('open');
    
    if (open) {
        document.getElementById('menu-slide').classList.remove('open');
        document.getElementById('menu-caret').classList.remove('spin');
        document.getElementById('menu-caret').classList.add('menu-caret-closed');
    } else {
        document.getElementById('menu-slide').classList.add('open');
        document.getElementById('menu-caret').classList.add('spin');
        document.getElementById('menu-caret').classList.add('menu-caret-closed');
    }
}


function makeAuthenticatedRequest(httpMethod, url) {
    return new Promise((resolve, reject) => {
        fetch(`${this.location.origin}${url}`, {
            method: httpMethod,
            credentials: 'same-origin' // send the httpOnly jwt cookie automatically
        }).then( res => {
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }

            if (res.headers.get('content-type').indexOf('html') > 0) {
                res.text()
                .then(doc => {
                    document.body.innerHTML = doc;
                });
            }

            if (res.redirected) {
                window.location.assign(res.url);
                resolve();
            }


            resolve(res.json()); // or response.text() for non-JSON responses
        })
    });

}

function musicSearch(searchText) {
    document.getElementById('musicsearch').blur();
    makeAuthenticatedRequest('GET', `/music/search?search=${searchText}`)
    .then(data => {

        if (!!data && data.length > 0) {
            document.getElementById('search-results').innerHTML = '';
            document.getElementById('add-to-queue-button').disabled = true;
        }

        MUSIC_SEARCH_RESULTS = data;

        for (inc in data) {
            var entry = data[inc];
            var rowClass = 'result-button' + (entry.disabled ? ' disabled' : '');
            var onclick = entry.disabled ? '' : ' onclick=javascript:makeSelection(' + inc + ')';
            document.getElementById('search-results').innerHTML +=
            // '<div class="result-button">' +
            '<tr id="search-result-' + inc +'" class="' + rowClass + '"' + onclick + '>' +
            '<td class="cell-left" style="text-align:center;width:48px;">' + '<img src="' + entry.album_image + '" style="width:48px;height:48px;object-fit:cover;display:block;"/></td>' +
            '<td style="width:80%;max-width:300px;">' + entry.track +
			'<div class="under-text">' + (entry.explicit ? '🅴 ' : '') + entry.artist + ' - ' + entry.album + '</div>' +
            '</td>' +
            '</tr>';
        }
    })
    .catch(error => {
        console.error('There was a problem with the fetch operation:', error);
        // Handle the error
    });
}

function millisToMinutesAndSeconds(millis) {
    var minutes = Math.floor(millis / 60000);
    var seconds = ((millis % 60000) / 1000).toFixed(0);
    return minutes + ":" + (seconds < 10 ? '0' : '') + seconds;
}

function makeSelection(record) {

    if (MUSIC_SEARCH_RESULTS && MUSIC_SEARCH_RESULTS[record] && MUSIC_SEARCH_RESULTS[record].disabled) {
        return;
    }

    if (SELECTION != null) {
        document.getElementById('search-result-' + SELECTION).classList.remove('selected');
    }

    SELECTION = record;
    document.getElementById('search-result-' + record).classList.add('selected');
    document.getElementById('add-to-queue-button').disabled = false;
    document.getElementById('add-to-queue-button').style.visibility = 'visible';


}









function addToQueue() {

    if (!MUSIC_SEARCH_RESULTS || SELECTION == null) {
        window.alert('Please search for a song and select one from the list to add it to the queue! :)');
        return;
    }

    if (!MUSIC_SEARCH_RESULTS[SELECTION].uri) {
        window.alert('Something went wrong. Please try selecting a song again.');
        return;
    }

    makeAuthenticatedRequest('POST', `/music/queue/${MUSIC_SEARCH_RESULTS[SELECTION].uri}`)
    .then(data => {
        var message = ''
        if (data.success) {
            message = 'Added to the queue!';
        } else if (data.message == 'TOO_SOON') {
            message = `Woah there, the next time you can queue a song is ${new Date(data.time).toLocaleTimeString()}. Go dance!`;
        } else {
            message = 'Oops! Something went wrong. Go find Jesse!'
        }
        window.alert(message);

        location.reload();
    })
    .catch(error => {
        console.error('There was a problem with the fetch operation:', error);
        window.alert('Oops! Something went wrong. Go find Jesse!');
    });
}


// Auth is enforced server-side: the auth middleware redirects unauthenticated
// requests for protected pages to /login. The jwt cookie is httpOnly and is sent
// automatically by the browser, so the client no longer needs to read it.

/*
// TROUBLESHOOTING HORIZONTAL SCROLL

function getOverflowEle() {
    var docWidth = document.documentElement.offsetWidth;

    document.querySelectorAll('*').forEach(el => {
        if (el.offsetWidth >= docWidth) {
            console.log(el);
        }
    }
    );
}
*/

