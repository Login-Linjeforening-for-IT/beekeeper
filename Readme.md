# BeeKeeper
Service to monitor all the bees.

## Building
To start the frontend run `docker compose up`. This will start the api on port 8001. The secrets required are detailed on the wiki.

Required secrets:
```
DOCTL_TOKEN
PRIVATE_TOKEN
DB
DB_HOST
DB_USER
DB_PASSWORD
BASE_URL
CLIENT_ID
CLIENT_SECRET
REDIRECT_URI
BEEKEEPER_URL
AUTHENTIK_TOKEN
BTG_TOKEN
CRITICAL_ROLE
CRITICAL_DEVELOPMENT_ROLE
WEBHOOK_URL
HEARTBEAT_REFERENCE
```

# BeeKeeper API
This is the API for Beekeeper. BeeKeeper is a subsystem of QueenBee. It previously shipped its own frontend, but this has since been moved to QueenBee.

## Current status
![Current Status](https://cdn.login.no/img/beekeeper/beekeeper_initial.png)
