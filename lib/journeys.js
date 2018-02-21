'use strict'

const request = require('./request')
const isString = require('lodash.isstring')
const isObject = require('lodash.isobject')
const isBoolean = require('lodash.isboolean')
const isInteger = require('lodash.isinteger')
const isDate = require('lodash.isdate')
const merge = require('lodash.merge')
const moment = require('moment-timezone')

const defaults = {
    results: null,
    duration: null,
    via: null,
    dateIsArrival: false,
    direct: false,
    bike: false,
    sleeper: false,
    couchette: false,
    language: 'en'
    // todo: types
}

const boolToNumberToString = (b) => (+b)+''

// combine a base date '20181130' and a modifier '00d19:30:00' strings into one JS date object
const createDate = (base, modifier) => {
    // parse modifier, ugly
    let days, time
    [days, time] = modifier.split('d')
    const d = moment.tz(`${base}+${time}`, 'YYYYMMDD+HH:mm:ss', 'Europe/Warsaw').add(+days, 'days')
    return d.toDate()
}

const createLeg = (baseDate) => (l) => ({
    // todo: additional attributes
    origin: {
        type: 'station',
        id: l.staOdjH,
        name: l.staOdj,
    },
    destination: {
        type: 'station',
        id: l.staPrzyH,
        name: l.staPrzy,
    },
    departure: createDate(baseDate, l.dataOdj),
    arrival: createDate(baseDate, l.dataPrzy),
    mode: 'train', // todo
    public: true,
    line: {
        type: 'line',
        id: l.TNumber,
        name: l.TName,
        product: l.TCategory,
        info: l.TType
    },
    operator: {
        type: 'operator',
        id: 'PKPIC',
        name: 'PKP Intercity',
        url: 'https://www.intercity.pl'
    }
})

const hashLeg = (l) => [l.origin.id, +l.departure, l.destination.id, +l.arrival, l.line.id].join('@')

const createJourney = (j) => {
    // todo: additional attributes
    const legs = j.P.map(createLeg(j.data))
    return ({
        type: 'journey',
        id: legs.map(hashLeg).join('#'),
        legs
    })
}

const journeys = async (origin, destination, date = new Date(), opt) => {
	const options = merge(defaults, opt || {})

    if(isString(origin)) origin = {id: origin, type: 'station'}
    if(!isString(origin.id)) throw new Error('invalid or missing origin id')
    if(origin.type !== 'station') throw new Error('invalid or missing origin type')
    origin = origin.id

    if(isString(destination)) destination = {id: destination, type: 'station'}
    if(!isString(destination.id)) throw new Error('invalid or missing destination id')
    if(destination.type !== 'station') throw new Error('invalid or missing destination type')
    destination = destination.id

    if(!isDate(date)){
        throw new Error('`date` must be a JS Date() object')
    }
    date = moment.tz(date, 'Europe/Warsaw')
    const day = date.format('DD.MM.YYYY')
    const time = date.format('HH:mm')

    if(options.via){
        if(isString(options.via)) options.via = {id: options.via, type: 'station'}
        if(!isString(options.via.id)) throw new Error('invalid or missing options.via id')
        if(options.via.type !== 'station') throw new Error('invalid or missing options.via type')
        options.via = options.via.id
    }

    if(options.results && (!isInteger(options.results) || options.results <= 0 || options.results === Infinity)) throw new Error('`opt.results` must be a finite integer > 0')
    if(options.duration && (!isInteger(options.duration) || options.duration < 0 || options.duration === Infinity)) throw new Error('`opt.duration` must be a finite integer >= 0')
    if(options.duration && options.results) throw new Error('Only one of `opt.results` and `opt.duration` can be set')

    if(!isBoolean(options.dateIsArrival)) throw new Error('`opt.dateIsArrival` must be a boolean value')
    if(!isBoolean(options.direct)) throw new Error('`opt.direct` must be a boolean value')
    if(!isBoolean(options.bike)) throw new Error('`opt.bike` must be a boolean value')
    if(!isBoolean(options.sleeper)) throw new Error('`opt.sleeper` must be a boolean value')
    if(!isBoolean(options.couchette)) throw new Error('`opt.couchette` must be a boolean value')

    if(!isString(options.language) || options.language.length !== 2) throw new Error('`opt.language` must be a valid ISO language string')

    const results = await request({
        action: 'search',
        stid0: origin,
        stid1: destination,
        stid2: options.via || '',
        stid3: '', // todo
        date: day,
        time,
        arr: boolToNumberToString(options.dateIsArrival),
        direct: boolToNumberToString(options.direct),
        bike: boolToNumberToString(options.bike),
        sleepe: boolToNumberToString(options.sleeper), // sic! it's really 'sleepe', not a typo, at least according to the 'docs', todo: confirm this
        couchette: boolToNumberToString(options.couchette),
        type_all: '1',
        type_ex: '1',
        type_tlk: '1',
        lang: options.language
    })

    const list = results.conn.map(createJourney)
    let latestNextLink = results.page
    if(list.length > 3) throw new Error('More than 3 results on first try, unexpected behaviour, please contact the developer.')

    while(list.length > 0 && list.length%3 === 0){
        if(options.duration){
            const searchUntil = +(date.toDate())+options.duration
            const lastJourney = list[list.length-1]
            const lastLeg = lastJourney.legs[lastJourney.legs.length-1]
            if(+lastLeg.departure<=searchUntil){
                const fetched = await request({
                    action: 'later',
                    hash_hafas: latestNextLink,
                    lang: options.language
                })
                if(fetched.conn.length > 3) throw new Error('More than 3 results on first try, unexpected behaviour, please contact the developer.')
                latestNextLink = fetched.page
                list.push(...fetched.conn.map(createJourney))
            }
            else break
        }
        else if(options.results && options.results > list.length){
            const fetched = await request({
                action: 'later',
                hash_hafas: latestNextLink,
                lang: options.language
            })
            if(fetched.conn.length > 3) throw new Error('More than 3 results on first try, unexpected behaviour, please contact the developer.')
            latestNextLink = fetched.page
            list.push(...fetched.conn.map(createJourney))
        }
        else break
    }

    if(options.duration) return list.filter(j => +(date.toDate())+options.duration >= +j.legs[j.legs.length-1].departure)
    if(options.results) return list.slice(0, options.results)
    return list
}

module.exports = journeys
