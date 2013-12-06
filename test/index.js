var assert = require('assert');
var test = global.it;

var Prober = require('../index');

test('Prober is a function', function (end) {
    assert.equal(typeof Prober, 'function');
    end();
});
