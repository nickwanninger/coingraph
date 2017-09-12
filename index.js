#!/usr/bin/env node

var program = require('commander')
program
	.version('0.0.1')
	.option('-h, --hour', 'display hour')
	.option('-d, --day', 'display day')
	.option('-w, --week', 'display week')
	.option('-m, --month', 'display month')
	.option('-y, --year', 'display year')
	.option('-a, --all', 'display all')
	.option('-c, --coin [type]', 'Coin Name (btc, eth, ltc)')
	.parse(process.argv)

let timeframe = 'week'

let coin = (program.coin || 'BTC').toUpperCase()
if ([ 'BTC', 'ETH', 'LTC' ].indexOf(coin) == -1) {
	console.log(coin + ' is not a valid coin')
	return process.exit(0)
}

if (program.hour) timeframe = 'hour'
if (program.week) timeframe = 'week'
if (program.month) timeframe = 'month'
if (program.year) timeframe = 'year'
if (program.all) timeframe = 'all'

const url = 'https://www.coinbase.com/api/v2/prices/' + coin + '-USD/historic?period=' + timeframe

const axios = require('axios')
const blessed = require('blessed')
const contrib = require('blessed-contrib')
const moment = require('moment')
const screen = blessed.screen()
const options = require('./options.js')
options.label = coin + ' Price over the last ' + timeframe

let line = contrib.line(options)
screen.append(line) //must append before setting data

screen.key([ 'escape', 'q', 'C-c' ], function(ch, key) {
	return process.exit(0)
})

screen.key([ 'r' ], updateBTCGraph)

async function updateBTCGraph() {
	const btcData = {
		x: [],
		y: []
	}
	const { data } = await axios.get(url)
	const { prices } = data.data
	let min = Infinity
	for (let i = prices.length - 1; i >= 0; i--) {
		const p = prices[i]
		const price = Number(p.price)
		btcData.x.push(moment(p.time).format('M-D-YY HH:MM:ss'))
		btcData.y.push(Number(price))
		if (min > price) min = price
	}
	min -= 10
	screen.remove(line)
	options.minY = min
	line = contrib.line(options)
	screen.append(line)
	line.setData(btcData)
	screen.render()
}
updateBTCGraph()
setInterval(async () => {
	updateBTCGraph()
}, 5000)

screen.on('resize', function() {
	line.emit('attach')
})
screen.render()
