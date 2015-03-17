var assert = require('assert');

function BitRing(capacity) {
    assert.ok(capacity < 32, 'Capacity must be less than 32');
    this.capacity = capacity;
    this.bits = 0;
    this.head = 0;
    this.length = 0;
}

// Set or clear the next bit in the ring and advance the head
BitRing.prototype.push = function(bool) {
    this.bits ^= (-bool ^ this.bits) & (1 << this.head);
    this.head = (this.head + 1) % this.capacity;
    if (this.length < this.capacity) {
        this.length++;
    }
};

// Count the number of bits set
// http://graphics.stanford.edu/~seander/bithacks.html#CountBitsSetParallel
BitRing.prototype.count = function() {
    var v = this.bits;
    v = v - ((v >>> 1) & 0x55555555);
    v = (v & 0x33333333) + ((v >>> 2) & 0x33333333);
    return ((v + (v >>> 4) & 0xF0F0F0F) * 0x1010101) >>> 24;
};

module.exports = BitRing;
