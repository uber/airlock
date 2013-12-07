var assert = require('assert');
var sinon = require('sinon');
var test = global.it;

var Prober = require('../index');

test('Prober detecting failures by event', function(end) {
    var mockEmitter = {
        on: sinon.spy()
    };
    var failureEvent = 'failureEvent';
    var successEvent = 'successEvent';
    var failed = false;

    var prober = new Prober({
        detectFailuresBy: Prober.detectBy.EVENT,
        backend: mockEmitter,
        failureEvent: failureEvent,
        successEvent: successEvent,
        failureHandler: function () {
            failed = true;
        }
    });

    assert(mockEmitter.on.calledTwice);
    assert(mockEmitter.on.firstCall.calledWith(failureEvent));
    assert(mockEmitter.on.secondCall.calledWith(successEvent));

    // failures deteted by events do not have a callback
    // argument so calling it will throw and thus not trigger
    // the actual callback to probe.
    // instead we just do a side effect and the emitter will
    // emit success & failure events which get probed
    prober.probe(function(callback) {
        callback();
    }, assert.fail, assert.fail);
    assert.ok(failed);
    end();
});
