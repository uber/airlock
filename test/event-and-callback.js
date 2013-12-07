var assert = require('assert');
var sinon = require('sinon');
var test = global.it;

var Prober = require('../index');

test('Prober detecting failures by both callback and event', function() {
    var prober = new Prober({
        detectFailuresBy: Prober.detectBy.BOTH,
        backend: {
            on: function() {}
        },
        failureEvent: '',
        successEvent: ''
    });

    var spy = sinon.spy();
    prober.probe(function(callback) { callback(); }, assert.fail, spy);
    assert.ok(spy.calledOnce);
});
