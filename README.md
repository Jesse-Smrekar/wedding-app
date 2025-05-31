#### Wedding App

blah blah blah wedding app stuff. Access and manage music yada yada. Lorem Ipsum...


## Prerequisites
- NodeJS
- npm

## How to Run
Open Powershell and navigate to the root of the project. Execute the following:
```ps1
npm install -y
node server.js
```
This will start the server on port `3000`. You can access the app via browser at:
http://localhost:3000


You will likely want to start by going to http://localhost:3000/spotify/login to refresh your spotify session/token. You can then grab the token from the logs and add it to the .env file for dev convenience. 