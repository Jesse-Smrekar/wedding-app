var USER_RESULTS = [];

function getUsers() {
    fetch(`${this.location.origin}/admin/users`)
    .then(res => {
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          return res.json(); // or response.text() for non-JSON responses
    })
    .then(data => {

        var userTable = document.getElementById('user-results');

        if (!!data && data.length > 0) {
            userTable.innerHTML = '';
        }

        USER_RESULTS = data;

        for (inc in data) {
            var entry = data[inc];

            var timeToDisplay = new Date(entry.NEXT_MUSIC_QUEUE_DATE);
            if (timeToDisplay > new Date("2030-01-01") || timeToDisplay < new Date()) {
                timeToDisplay = "now";
            } else {
                timeToDisplay = new Date(entry.NEXT_MUSIC_QUEUE_DATE).toLocaleTimeString();
            }


            userTable.innerHTML += 
            '<tr id="search-result-' + inc +'">' +
            // '<div id="search-result-' + inc +'" onclick=javascript:makeSelection(' + inc + ')>' +
            '<td>' + entry.FIRST_NAME + '</td>' +
            '<td>' + entry.LAST_NAME + '</td>' +
            '<td>' + timeToDisplay + '</td>' +
            '</tr>';
        }
    })
    .catch(error => {
        console.error('There was a problem with the fetch operation:', error);
        // Handle the error
    });
}



window.onload = () => {
    getUsers();
}
