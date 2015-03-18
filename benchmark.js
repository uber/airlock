var Benchmark = require('benchmark');
var BitRing = require('./bit-ring');
var Prober = require('./index');

var suite = new Benchmark.Suite();
var prober = new Prober();
var healthy = function(callback) {
    callback();
};
var error = new Error('unhealthy');
var unhealthy = function(callback) {
    callback(error);
};
var bitRing = new BitRing(10);

suite.add('probe healthy', function() {
    prober.probe(healthy);
}).add('probe unhealthy', function() {
    prober.probe(unhealthy);
}).add('bitRing', function() {
    bitRing.count();
    bitRing.push(true);
    bitRing.count();
}).on('cycle', function(event) {
    console.log(String(event.target));
}).run();
