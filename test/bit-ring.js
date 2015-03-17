var assert = require('assert');
var BitRing = require('../bit-ring');
var test = global.it;

test('empty bit ring', function(end) {
    var bitRing = new BitRing(3);
    assert.equal(bitRing.length, 0);
    assert.equal(bitRing.count(), 0);
    end();
});

test('set bit', function(end) {
    var bitRing = new BitRing(3);
    bitRing.push(true);
    assert.equal(bitRing.length, 1);
    assert.equal(bitRing.count(), 1);
    end();
});

test('clear bit', function(end) {
    var bitRing = new BitRing(3);
    bitRing.push(true);
    bitRing.push(true);
    assert.equal(bitRing.length, 2);
    assert.equal(bitRing.count(), 2);
    bitRing.push(false);
    assert.equal(bitRing.length, 3);
    assert.equal(bitRing.count(), 2);
    bitRing.push(false);
    assert.equal(bitRing.length, 3);
    assert.equal(bitRing.count(), 1);
    end();
});
