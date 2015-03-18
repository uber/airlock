var assert = require('assert');

function BitRing(capacity) {
    assert.ok(capacity < 32, 'Capacity must be less than 32');
    this.capacity = capacity;
    this.bits = 0;
    this.pos = 0;
    this.length = 0;
    this._count = 0;
}

// Update the count and set or clear the next bit in the ring
BitRing.prototype.push = function(bool) {
    var num = bool === true ? 1 : 0;
    this._count += num - ((this.bits >>> this.pos) & 1);
    this.bits ^= (-num ^ this.bits) & (1 << this.pos);
    this.pos = (this.pos + 1) % this.capacity;
    if (this.length < this.capacity) {
        this.length++;
    }
};

// Return the number of bits set
BitRing.prototype.count = function() {
    return this._count;
};

module.exports = BitRing;
