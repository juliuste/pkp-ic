'use strict'

const tape = require('tape')
const pkp = require('./index')
const moment = require('moment-timezone')
const isNumber = require('lodash.isnumber')
const isObject = require('lodash.isobject')
const isString = require('lodash.isstring')
const isDate = require('lodash.isdate')

tape('pkp-ic.stations', (t) => {
	pkp.stations().then((stations) => {
		t.ok(stations.length > 30, 'stations length')
		for(let s of stations){
			t.ok(s.type === 'station', `station ${s.id} type`)
			t.ok(isString(s.id) && s.id.length === 9, `station ${s.id} id`)
			t.ok(isString(s.name) && s.name.length > 0, `station ${s.id} name`)
			if(s.location){
				t.ok(isObject(s.location), `station ${s.id} location`)
				t.ok(s.location.type === 'location', `station ${s.id} location type`)
				t.ok(isNumber(s.location.longitude), `station ${s.id} location longitude`)
				t.ok(s.location.longitude > -20 && s.location.longitude < 90, `station ${s.id} location longitude`)
				t.ok(isNumber(s.location.latitude), `station ${s.id} location latitude`)
				t.ok(s.location.latitude > 20 && s.location.latitude < 90, `station ${s.id} location latitude`)
			}
		}
		const gdansk = stations.find(x => x.id === '005100009')
		t.ok(gdansk.name === 'Gdańsk Główny', 'station gdansk name')
		t.end()
	})
})

const isStation = (s) => s.type === 'station' && isString(s.id) && s.id.length === 9 && isString(s.name) && s.name.length > 0
const isPKPIC = (o) => o.type === 'operator' && o.id === 'PKPIC' && o.name === 'PKP Intercity' && isString(o.url) && o.url.length > 5

tape('pkp-ic.journeys', (t) => {
	const gdansk = '005100009'
	const bydgoszcz = '005100005'
	const date = moment.tz('Europe/Warsaw').add(5, 'days').toDate()
	const opt = {results: 10}
	pkp.journeys(bydgoszcz, {id: gdansk, type: 'station'}, date, opt).then((j) => {
		t.ok(j.length === opt.results, 'journeys length')
		const journey = j[0]
		t.ok(journey.type === 'journey', 'journey type')
		t.ok(journey.id, 'journey id')
		for(let leg of journey.legs){
			t.ok(isStation(leg.origin), 'leg origin')
			t.ok(isStation(leg.destination), 'leg destination')
			t.ok(isDate(leg.departure), 'leg departure')
			t.ok(isDate(leg.arrival), 'leg arrival')
			t.ok(isPKPIC(leg.operator), 'leg operator')
			t.ok(leg.mode === 'train', 'leg mode')
			t.ok(leg.public === true, 'leg public')
			t.ok(isObject(leg.line), 'leg line')
			t.ok(leg.line.type === 'line', 'line type')
			t.ok(isString(leg.line.id) && leg.line.id.length > 0, 'line id')
			t.ok(isString(leg.line.name) && leg.line.name.length > 0, 'line name')
			t.ok(isString(leg.line.product) && leg.line.product.length > 0, 'line product')
		}
		t.ok(journey.legs[0].origin.id === bydgoszcz, 'journey origin')
		t.ok(journey.legs[journey.legs.length-1].destination.id === gdansk, 'journey destination')
		t.end()
	})
})
