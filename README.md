# bearnaisee-api

API for our school project [Bearnaisee](https://bearnais.ee). Made using Typescript, Express & TypeORM with a Postgresql database.

## Setup

### Database

To run the project you must setup the database first.

The database can found in the [db folder](/db/). Simply navigate to the db folder and run `docker-compose up`

### Application

A .env file is required for connecting to the database. You can find an example .env file [here](.env.example)

```sh
docker build -t bearnaisee-api .
```

```sh
docker run --env PORT=5000 -p 5000:5000 bearnaisee-api .
```
