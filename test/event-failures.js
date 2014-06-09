var assert = require('assert');
var test = global.it;

var Prober = require('../index');

test('Prober detecting failures by event', function(end) {
    var events = [];
    var mockEmitter = {
        on: function (eventName) {
            events.push(eventName);
        }
    };
    var failureEvent = 'failureEvent';
    var successEvent = 'successEvent';

    var prober = new Prober({
        detectFailuresBy: Prober.detectBy.EVENT,
        backend: mockEmitter,
        window: 1,
        failureEvent: failureEvent,
        successEvent: successEvent
    });

    assert.equal(events.length, 2);
    assert.deepEqual(events, [failureEvent, successEvent]);

    // failures detected by events do not have a callback
    // argument so calling it will throw and thus not trigger
    // the actual callback to probe.
    // instead we just do a side effect and the emitter will
    // emit success & failure events which get probed
    try {
        prober.probe(function(callback) {
            callback();
        }, assert.fail, assert.fail);
    } catch (err) { /*ignore*/ }

    assert.ok(!prober.isHealthy());
    end();
});
