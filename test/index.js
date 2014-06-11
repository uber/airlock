var assert = require('assert');
var timer = require('time-mock');
var times = require('lodash.times');
var test = global.it;

var Prober = require('../index');

test('Prober is a function', function (end) {
    assert.equal(typeof Prober, 'function');
    end();
});

test('Prober should make request with no previous probes', function(end) {
    var wasCalled;
    var prober = new Prober();
    prober.probe(function() { wasCalled = true; });
    assert.ok(wasCalled);
    end();
});

test('can disabled prober', function (end) {
    var prober = new Prober({ enabled: false });

    assert.equal(prober.enabled, false);

    end();
});

test('Prober should make request when amount of healthy probes are less than window', function(end) {
    var prober = new Prober();
    times(prober.threshold, function() { prober.ok(); });

    var wasCalled;

    prober.probe(function() { wasCalled = true; });

    assert.ok(wasCalled);
    end();
});

test('should make request when amount of unhealthy probes are less than window', function(end) {
    var prober = new Prober();
    times(prober.threshold, function() { prober.notok(); });

    var wasCalled;

    prober.probe(function() { wasCalled = true; });

    assert.ok(wasCalled);
    end();
});

test('should make request when amount of healthy requests is above threshold', function(end) {
    var prober = new Prober();
    times(prober.threshold, function() { prober.ok(); });
    times(prober.window - prober.threshold, function() { prober.notok(); });

    var wasCalled;

    prober.probe(function() { wasCalled = true; });

    assert.ok(wasCalled);
    end();
});

test('should bypass backend request when amount of unhealthy requests is above threshold', function(end) {
    var prober = new Prober();
    times(prober.threshold, function() { prober.notok(); });
    times(prober.window - prober.threshold, function() { prober.ok(); });

    var backendWasCalled = false;
    var callbackWasCalled = false;

    prober.probe(
        function() { backendWasCalled = true; },
        function() { callbackWasCalled = true; });

    assert.ok(!prober.isHealthy());
    assert.ok(!backendWasCalled);
    assert.ok(callbackWasCalled);
    end();
});

test('should bypass backend request until coming back to health', function(end) {
    var prober = new Prober();
    times(prober.window, function() { prober.notok(); });

    times(prober.threshold, function() {
        assert.ok(!prober.isHealthy());
        prober.probe(assert.fail);
        prober.ok();
    });

    // After healthy threshold has been hit, backend should be healthy
    assert.ok(prober.isHealthy());

    var wasCalled = false;
    prober.probe(function() { wasCalled = true; });
    assert.ok(wasCalled);
    end();
});

test('should be healthy after returning to health', function(end) {
    var prober = new Prober();
    times(prober.window, function() { prober.notok(); });
    times(prober.threshold - 1, function() { prober.ok(); });

    prober.probe(function() { });

    assert.ok(!prober.isHealthy());

    // Returns backend back to health
    prober.ok();

    assert.ok(prober.isHealthy());
    end();
});

test('should be unhealthy after getting sick', function(end) {
    var prober = new Prober();
    times(prober.threshold, function() { prober.ok(); });
    times(prober.window - prober.threshold, function() { prober.notok(); });

    prober.probe(function() { });

    assert.ok(prober.isHealthy());

    // Gets sick
    prober.notok();

    assert.ok(!prober.isHealthy());
    end();
});

test('should have default wait period after becoming sick', function(end) {
    var prober = new Prober();
    // Set to healthy
    times(prober.window, function() { prober.ok(); });

    // Close to becoming sick
    times(prober.window - prober.threshold, function() { prober.notok(); });

    assert.ok(prober.isHealthy());

    prober.notok();

    assert.ok(prober.isSick());
    assert.equal(prober.waitPeriod, prober.defaultWaitPeriod);
    end();
});

test('should allow backend request only after wait period', function(end) {
    // create a fake timer.
    var clock = timer(Date.now());
    var prober = new Prober({
        // overwrite now to be a fake Date.now() based on our clock
        now: clock.now
    });

    prober.waitPeriod = prober.maxWaitPeriod / 2;

    // Set to healthy
    times(prober.window, function() { prober.ok(); });

    // Will set wait period to twice as long
    times(prober.window - prober.threshold + 2, function() { prober.notok(); });

    // Should not call `assert.fail`
    prober.probe(assert.fail);

    // Simulate time after wait period
    clock.advance(prober.waitPeriod);

    var called = false;
    prober.probe(function () {
        called = true;
    });

    // Backend request was made
    assert.ok(called);

    end();
});

test('should be unhealthy after request err', function(end) {
    var prober = new Prober();
    prober.threshold = 1;
    prober.window = 1;

    prober.probe(function(fn) {
        fn(new Error('Some kind of bad going on'));
    });

    assert.ok(prober.isSick());
    end();
});

test('should be unhealthy after request server err', function(end) {
    var prober = new Prober();
    prober.threshold = 1;
    prober.window = 1;

    prober.probe(function(fn) {
        fn(null, {
            statusCode: 500
        });
    });

    assert.ok(prober.isSick());
    end();
});

test('should be healthy after request client err', function(end) {
    var prober = new Prober();
    prober.threshold = 1;
    prober.window = 1;

    prober.probe(function(fn) {
        fn(null, {
            statusCode: 400
        });
    });

    assert.ok(prober.isHealthy());
    end();
});


test('should be healthy after custom handling expected error', function(end) {
    var prober = new Prober();
    prober.threshold = 1;
    prober.window = 1;

    prober.customProbe(function(fn) {
        fn(new Error('Some kind of bad going on'));
    }, function() {
        prober.ok();
    });

    assert.ok(prober.isHealthy());
    end();
});

