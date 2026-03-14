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
    let jwt = 'FOOBAR';
    fetch(`${this.location.origin}${url}`, {
        method: httpMethod, 
        headers: {
            "Authorization": `Bearer ${jwt}`
        }
    }).then( res => {
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return res.json(); // or response.text() for non-JSON responses
    })

}

function musicSearch(searchText) {
    document.getElementById('musicsearch').blur();
    fetch(`${this.location.origin}/music/search?search=${searchText}`)
    .then(res => {
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return res.json(); // or response.text() for non-JSON responses
    })
    .then(data => {

        if (!!data && data.length > 0) {
            document.getElementById('search-results').innerHTML = '';
            document.getElementById('add-to-queue-button').disabled = true;
        }

        MUSIC_SEARCH_RESULTS = data;

        for (inc in data) {
            var entry = data[inc];
            document.getElementById('search-results').innerHTML += 
            // '<div class="result-button">' +
            '<tr id="search-result-' + inc +'" class="result-button" onclick=javascript:makeSelection(' + inc + ')>' +
            '<td class="cell-left" style="text-align:center;width:65px;">' + '<img src="' + entry.album_image + '" style="max-width:66%;"/></td>' +
            '<td style="width:80%;max-width:300px;">' + entry.track + 
            '<div class="under-text">' + entry.artist + ' - ' + entry.album + '</div>' +
            '</td>' +
            // '<td style="max-width:100px;">' + entry.artist + '</td>' +
            // '<td style="width:30px;max-width:100px;">' + entry.album + '</td>' +
            // '<td class="cell-right" style="width:10%;">' + millisToMinutesAndSeconds(entry.duration) + '</td>' +
            '</tr>';
            // '</div>';
        }

        document.getElementById('search-result-header').style.visibility = 'visible';
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

    fetch(`${this.location.origin}/music/queue?trackId=${MUSIC_SEARCH_RESULTS[SELECTION].uri}`)
    .then(res => {
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return res.json(); // or response.text() for non-JSON responses
    })
    .then(data => {

        console.log("queued song. Response: " + data);
        window.alert('Added to the queue!');
    })
    .catch(error => {
        console.error('There was a problem with the fetch operation:', error);
        // Handle the error
    });
}

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

