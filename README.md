# mono-ts-apollo-bp

[![lerna](https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg)](https://lerna.js.org/)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![Code style: airbnb](https://img.shields.io/badge/code%20style-airbnb-blue.svg)](https://github.com/airbnb/javascript)

**Welcome to mono-ts-apollo-bp!**

This repository is a sample boilerplate project (titled `monots`) composed of a FE (via [CRA](https://github.com/facebook/create-react-app)) and [Apollo GraphQL](https://www.apollographql.com/docs/apollo-server/) BE, managed via [Lerna](https://github.com/lerna/lerna) and [TypeScript](https://www.typescriptlang.org/) throughout.

The sample project sits within a [Docker](https://www.docker.com/) container and locally orchestrated using [docker-compose](https://docs.docker.com/compose/). A 3rd package stores shared utility functions and type definitions between the FE and BE. This project uses PostgreSQL as the persistence layer and [Auth0](https://auth0.com/) as the 3rd party for authentication.

Digging into the technicals a bit further: [prettier](https://prettier.io/) and [ESLint](https://eslint.org/) are used for linting and analysis, [jest](https://jestjs.io/) for unit tests/coverage, and [TailwindCSS](https://tailwindcss.com/) for styles/themeing.

## Getting Started

```bash
git clone git@github.com:davidvuong/mono-ts-apollo-bp.git
```

Install dependencies on your host machine, allowing VSCode or otherwise to pick up linting and autocompletion:

```bash
yarn
```

_Configure environment variables for `api`, renaming `example.env.list` to `local.env.list`._

Spin up `docker-compose` to start the sample React app, Apollo GraphQL API, and PostgreSQL database.

```bash
yarn db:migrate
```

## Database Migrations

Database migrations are fully managed by Flyway. To create a new migration, create a new file in `packages/api/migrations`. The pattern must be in the form of:

```bash
# Pattern
Vxxx__<name>.sql

# For instance,
V002__Create_accounts_relation.sql
V003__Add_indexes_to_accounts.sql
```

Read more about [flyway here](https://flywaydb.org/).
