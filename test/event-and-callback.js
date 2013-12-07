var assert = require('assert');
var test = global.it;

var Prober = require('../index');

test('Prober detecting failures by both callback and event', function(end) {
    var prober = new Prober({
        detectFailuresBy: Prober.detectBy.BOTH,
        backend: {
            on: function() {}
        },
        failureEvent: '',
        successEvent: ''
    });

    var called = false;
    prober.probe(function(callback) { callback(); }, assert.fail, function () {
        called = true;
    });
    assert.ok(called);
    end();
});
