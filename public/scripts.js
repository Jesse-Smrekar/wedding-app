var MUSIC_SEARCH_RESULTS = {};


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

function musicSearch(searchText) {
    fetch(`${this.location.origin}/music/search?search=${searchText}`)
    .then(res => {
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return res.json(); // or response.text() for non-JSON responses
    })
    .then(data => {
        MUSIC_SEARCH_RESULTS = data;
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

