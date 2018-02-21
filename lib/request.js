'use strict'

const md5 = require('md5')
const sort = require('sort-keys')
const got = require('got')
const merge = require('lodash.merge')


const stringify = (params) => {
    params = sort(params)
    const base = "*@^xr@#8HsP4"
    let string = base
    for(let key in params){
        string += params[key] + "|"
    }
    if(string.length === base.length){
        throw new Error('invalid params')
    }
    return string.substring(0, string.length-1)
}

const hash = (params) => md5(stringify(params))

const request = (params) =>
got.get("https://www.intercity.pl/api/index2.php", {
    query: merge({}, params, {hash: hash(params)}),
    json: true
})
.then(res => res.body)
.then(res => {
    if(res.errors.length === 0) return res.return
    else throw new Error(res.errors)
})

module.exports = request
