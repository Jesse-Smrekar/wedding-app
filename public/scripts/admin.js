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
            userTable.innerHTML += 
            '<tr id="search-result-' + inc +'">' +
            // '<div id="search-result-' + inc +'" onclick=javascript:makeSelection(' + inc + ')>' +
            '<td>' + entry.id + '</td>' +
            '<td>' + entry.firstName + '</td>' +
            '<td>' + entry.lastName + '</td>' +
            '<td>' + entry.nextQueueTime + '</td>' +
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
