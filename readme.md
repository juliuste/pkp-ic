# pkp-ic

JavaScript client for the [PKP intercity](https://www.intercity.pl/) API. Complies with the [friendly public transport format](https://github.com/public-transport/friendly-public-transport-format). Inofficial, using endpoints by *PKP IC*. Ask them for permission before using this module in production. *Still in progress.*

[![npm version](https://img.shields.io/npm/v/pkp-ic.svg)](https://www.npmjs.com/package/pkp-ic)
[![Build Status](https://travis-ci.org/juliuste/pkp-ic.svg?branch=master)](https://travis-ci.org/juliuste/pkp-ic)
[![Greenkeeper badge](https://badges.greenkeeper.io/juliuste/pkp-ic.svg)](https://greenkeeper.io/)
[![dependency status](https://img.shields.io/david/juliuste/pkp-ic.svg)](https://david-dm.org/juliuste/pkp-ic)
[![dev dependency status](https://img.shields.io/david/dev/juliuste/pkp-ic.svg)](https://david-dm.org/juliuste/pkp-ic#info=devDependencies)
[![license](https://img.shields.io/github/license/juliuste/pkp-ic.svg?style=flat)](LICENSE)
[![chat on gitter](https://badges.gitter.im/juliuste.svg)](https://gitter.im/juliuste)

## Installation

```shell
npm install --save pkp-ic
```

## Usage

This package contains data in the [*Friendly Public Transport Format*](https://github.com/public-transport/friendly-public-transport-format).

### `stations(opt = {})`

Get a list of all stations operated by PKP IC.

```js
const pkp = require('pkp-ic')

pkp.stations()
.then(console.log)
.catch(console.error)
```

`defaults`, partially overridden by the `opt` parameter, looks like this:

```js
const defaults = {
    language: 'en'
}
```

Returns a [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/promise) that will resolve in an array of `station`s in the [*Friendly Public Transport Format*](https://github.com/public-transport/friendly-public-transport-format) which looks as follows:

```js
[
    {
        type: 'station',
        id: '005100009',
        name: 'Gdańsk Główny',
        location: {
            type: 'location',
            longitude: 18.644014,
            latitude: 54.355936
        }
    }
    // …
]
```

### `journeys(origin, destination, date = new Date(), opt = {})`

Get connetions from A to B.

```js
const pkp = require('pkp-ic')

const gdansk = '005100009'
const bydgoszcz = '005100005'

pkp.journeys(bydgoszcz, gdansk, new Date(), {duration: 24*60*60*1000})
.then(console.log)
.catch(console.error)
```
`origin` and `destination` can be either station ids or full FPTF station objects. `defaults`, partially overridden by the `opt` parameter, looks like this:

```js
const defaults = {
    // WARNING: If you set "results" or "duration", a new request will be created for every 3rd connection found since the API exposes max. 3 connections per request
    results: null, // number of results returned
    duration: null, // look for the next n milliseconds. if this is set, 'results' must not be set and vice versa.
    via: null, // station id or FPTF station object
    dateIsArrival: false, // date parameter should be treated as an arrival date instead of as a departure date
    direct: false, // direct connetions only
    bike: false,
    sleeper: false,
    couchette: false,
    language: 'en'
}
```

Returns a [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/promise) that will resolve with an array of `journey`s in the [*Friendly Public Transport Format*](https://github.com/public-transport/friendly-public-transport-format) which looks as follows.
*Note that the legs are not fully spec-compatible, as the `schedule` is missing in legs, there's a line object instead.*

```js
[
    {
        type: "journey",
        id: "005100005@1519666620000@005100009@1519673100000@65102",
        legs: [
            {
                origin: {
                    type: "station",
                    id: "005100005",
                    name: "Bydgoszcz Główna"
                },
                destination: {
                    type: "station",
                    id: "005100009",
                    name: "Gdańsk Główny"
                },
                departure: "2018-02-26T17:37:00.000Z",
                arrival: "2018-02-26T19:25:00.000Z",
                mode: "train",
                public: true,
                line: {
                    type: "line",
                    id: "65102",
                    name: "IC 65102",
                    product: "IC",
                    info: {
                        95: "wagon with a platform for disabled travellers",
                        JP: "buffet",
                        P1: "PKP Intercity",
                        RP: "reservation obligatory",
                        CC: "The ability to purchase tickets by mobile phone on m.bilkom.pl",
                        FB: "Number of bicycles conveyed limited",
                        KL: "air conditioning",
                        K: "carriage of parcels"
                    }
                },
                operator: {
                    type: "operator",
                    id: "PKPIC",
                    name: "PKP Intercity",
                    url: "https://www.intercity.pl"
                }
            }
        ]
    }
]
```

## Contributing

If you found a bug, want to propose a feature or feel the urge to complain about your life, feel free to visit [the issues page](https://github.com/juliuste/pkp-ic/issues).
