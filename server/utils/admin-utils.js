window.onload = () => {
    getUsers();
}

var USERS = {};


function getUsers() {
    fetch(`${this.location.origin}/users`)
    .then(res => {
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return res.json(); // or response.text() for non-JSON responses
    })
    .then(data => {

        if (!!data && data.length > 0) {
            document.getElementById('user-results').innerHTML = '';
        }

        USERS = data;

        for (inc in data) {
            var entry = data[inc];
            document.getElementById('user-results').innerHTML += 
            '<tr>' +
            '<td>' + entry.rowId + '</td>' +
            '<td>' + entry.firstName + '</td>' +
            '<td>' + entry.lastName + '</td>' +
            '<td>' + entry.nextMusicQueueDate + '</td>' +
            '</tr>';
        }

        document.getElementById('add-to-queue-button').style.visibility = 'visible';
    })
    .catch(error => {
        console.error('There was a problem with the fetch operation:', error);
        // Handle the error
    });
}