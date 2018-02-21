'use strict'

const request = require('./request')
const merge = require('lodash.merge')
const isString = require('lodash.isstring')

const defaults = {
    language: 'en'
}

// cheap workaround because for some reason one latitude looked like this '47.994459,' *sigh*
const parseNumber = (n) => +(n.replace(',', ''))

const createStation = (s) => {
    const station = {
        type: 'station',
        id: s.hafas_name,
        name: s.name
    }
    if(station.id.length === 7) station.id = '00'+station.id // todo
    if(s.pos_x && s.pos_y) station.location = {
        type: 'location',
        longitude: parseNumber(s.pos_x),
        latitude: parseNumber(s.pos_y)
    }
    return station
}

const stations = (opt) => {
    const options = merge(defaults, opt || {})
    if(!isString(options.language) || options.language.length !== 2) throw new Error('`opt.language` must be a valid ISO language string')
    return request({
        action: 'stations',
        lang: options.language
    })
    .then(list => list.map(createStation))
    // turns out there is one place "Park Bug" (yes, its literally called Park *Bug* xD) without an id, todo: turn into POI.
    .then(list => list.filter(s => !!s.id))
}

module.exports = stations
