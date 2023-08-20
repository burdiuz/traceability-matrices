# @actualwave/traceability-matrices

# Work in progress

Integrate requirements into e2e/integration test code and generate traceability matrices for your project. Currently it has an adapter to work with Cypress.
![One file project](./project_a.png)
![Multi-file project](./project_c.png)

## Installation
NPM
`npm install -D @actualwave/traceability-matrices`
Yarn
`yarn add -D @actualwave/traceability-matrices`

## Usage
Add a script to your package.json
`traceability-matrices serve --target-dir=<folder with coverage reports>`

## Cypress integration