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

var timeframe = 'week'

var coin = (program.coin || 'BTC').toUpperCase()
if ([ 'BTC', 'ETH', 'LTC' ].indexOf(coin) == -1) {
	console.log(coin + ' is not a valid coin')
	return process.exit(0)
}

if (program.hour) timeframe = 'hour'
if (program.day) timeframe = 'day'
if (program.week) timeframe = 'week'
if (program.month) timeframe = 'month'
if (program.year) timeframe = 'year'
if (program.all) timeframe = 'all'

var url = 'https://www.coinbase.com/api/v2/prices/' + coin + '-USD/historic?period=' + timeframe

var axios = require('axios')
var blessed = require('blessed')
var contrib = require('blessed-contrib')
var moment = require('moment')
var screen = blessed.screen()
var options = require('./options.js')
options.label = coin + ' Price over the last ' + timeframe

var line = contrib.line(options)
screen.append(line)

var coinData = {
	x: [],
	y: []
}

screen.key([ 'escape', 'q', 'C-c' ], function(ch, key) {
	return process.exit(0)
})

screen.key([ 'r' ], updateBTCGraph)

async function updateBTCGraph() {
	var { data } = await axios.get(url)
	var { prices } = data.data
	var min = Infinity
	coinData = {
		x: [],
		y: []
	}
	for (var i = prices.length - 1; i >= 0; i--) {
		var p = prices[i]
		var price = Number(p.price)
		coinData.x.push(moment(p.time).format('M-D-YY HH:MM:ss'))
		coinData.y.push(Number(price))
		if (min > price) min = price
	}
	min -= 10
	options.minY = min
	redraw()
}

function redraw() {
	screen.remove(line)

	line = contrib.line(options)
	screen.append(line)
	line.setData(coinData)
	screen.render()
}
updateBTCGraph()
setInterval(async () => {
	updateBTCGraph()
}, 5000)

screen.on('resize', function() {
	redraw()
})
screen.render()
