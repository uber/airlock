function BitRing(capacity) {
    this.capacity = capacity;
    this.bits = new Uint8ClampedArray(capacity);
    this.pos = 0;
    this.length = 0;
    this._count = 0;
}

// Update the count and set or clear the next bit in the ring
BitRing.prototype.push = function(bool) {
    var num = bool === true ? 1 : 0;
    this._count += num - this.bits[this.pos];
    this.bits[this.pos] = num;
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
