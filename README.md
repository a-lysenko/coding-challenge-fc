# Fashion Cloud Coding Challenge

The application provides the API to cache data, retrieve, update and remove already cached data.The mongodb database is used as a cache storage.
Besides, the application has a set of integration tests to cover the implemented functionality.

## Steps to prepare

- clone or download this repository https://github.com/a-lysenko/fashion-cloud-coding-challenge
- `cd ./fashion-cloud-coding-challenge`
- `npm install` (Application was developed and tested with NodeJs **v12.16.2** on Linux Ubuntu 20.04 LTS)

## Execute step

- `npm run dev:start`
OR
- `npm run dev` (watch mode is on)

## Run tests step

- `npm test`

## Structure and Details

### XLSX report?
Yes, the project uses **jest-xlsx-reporter**. The reporter provides test run results are stored into the **xlsx** format. 
A name and a path to the output file can be set in `package.json`, see `"jest-xlsx-reporter": { "outputPath": ...}` there.


### Environment settings
Project needs the following environment properties to be set:
* SERVER_PORT - a port the server is running
* DB_URI - mongodb URI. DB name should be passed here
DB_URI_TEST - test monngodb URI. Used when test are running
* CACHE_LIMIT - max amount of items cache can keep
* CACHE_TTL_MS - time to live in milliseconds - defines how long lives item since its creation or update. It affects the lookup endpoint API GET `api/cache` only

### Project doesn't include
* `.env` - that is not a recommended way to keep this file into a repository; you have to set it up and put in the root of the project

