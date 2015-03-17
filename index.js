var BitRing = require('./bit-ring');

var defaults = {
    title: 'general',
    threshold: 6,
    window: 10,
    defaultWaitPeriod: 1000,
    maxWaitPeriod: 60 * 1000,
};

function Prober(options) {
    if (!(this instanceof Prober)) {
        return new Prober(options);
    }

    options = options || {};

    this.title = options.title || defaults.title;
    this.threshold = options.threshold || defaults.threshold;
    this.window = options.window || defaults.window;
    this.now = options.now || Date.now;
    this.defaultWaitPeriod = options.defaultWaitPeriod ||
        defaults.defaultWaitPeriod;
    this.maxWaitPeriod = options.maxWaitPeriod || defaults.maxWaitPeriod;
    this.enabled = 'enabled' in options ? options.enabled : true;
    var detectFailuresBy = options.detectFailuresBy || Prober.detectBy.CALLBACK;
    this.detectFailuresByCallback =
        (detectFailuresBy === Prober.detectBy.CALLBACK) ||
        (detectFailuresBy === Prober.detectBy.BOTH);
    this.detectFailuresByEvent =
        (detectFailuresBy === Prober.detectBy.EVENT) ||
        (detectFailuresBy === Prober.detectBy.BOTH);

    this.logger = options.logger || null;
    this.bitRing = new BitRing(this.window);
    this.waitPeriod = this.defaultWaitPeriod;
    this.lastBackendRequest = this.now();
    this.statsd = options.statsd || null;

    if (this.detectFailuresByEvent) {
        if (!options.backend) {
            if (this.logger) {
                this.logger.warn('Prober missing backend from' +
                    ' initialization options');
            }
            return;
        }

        options.backend.on(options.failureEvent, this.notok.bind(this));
        options.backend.on(options.successEvent, this.ok.bind(this));
    }
}

Prober.detectBy = {
    CALLBACK: 'callback',
    EVENT: 'event',
    BOTH: 'both'
};

Prober.prototype.isHealthy = function isHealthy() {
    return this.bitRing.length < this.window ||
        this.bitRing.count() >= this.threshold;
};

Prober.prototype.isSick = function isSick() {
    return !this.isHealthy();
};

Prober.prototype.notok = function notok() {
    if (!this.enabled) {
        return;
    }

    this._addProbe(false);
    if (this.statsd) {
        this.statsd.increment('prober.' + this.title + '.probe.notok');
    }
};

Prober.prototype.notOk = Prober.prototype.notok;

Prober.prototype.ok = function ok() {
    if (!this.enabled) {
        return;
    }

    this._addProbe(true);
    if (this.statsd) {
        this.statsd.increment('prober.' + this.title + '.probe.ok');
    }
};

Prober.prototype.setLogger = function setLogger(logger) {
    this.logger = logger;
};

Prober.prototype.probe = function probe(request, bypass, callback) {
    var self = this;

    if (!callback) {
        callback = bypass;
    }

    var wrappedCallback;
    if (this.detectFailuresByCallback) {
        wrappedCallback = function(err, resp) {
            var errResponse = resp && !isNaN(resp.statusCode) &&
                resp.statusCode >= 500;
            if (err || errResponse) {
                self.notok();
            } else {
                self.ok();
            }

            if (callback && typeof callback === 'function') {
                callback.apply(null, arguments);
            }
        };
    }

    this.customProbe(request, bypass, wrappedCallback);
};

Prober.prototype.customProbe = function probe(request, bypass, callback) {
    if (!callback) {
        callback = bypass;
    }

    if (!this.enabled) {
        return request(callback);
    }

    // If the backend is healthy, or it's been enough time
    // that we should check to see if the backend is no longer
    // sick, then make a request to the backend.
    if (this.isHealthy() || this._isPityProbe()) {
        if (this.statsd) {
            this.statsd.increment('prober.' + this.title +
                '.request.performed');
        }

        try {
            request(callback);
            this.lastBackendRequest = this.now();
        } catch (err) {
            this.lastBackendRequest = this.now();
            this.notok();

            throw err;
        }
    } else {
        if (this.statsd) {
            this.statsd.increment('prober.' + this.title + '.request.bypassed');
        }

        if (bypass && typeof bypass === 'function') {
            bypass(new Error(this.title + ' backend is unhealthy'));
        }
    }
};

Prober.prototype._addProbe = function addProbe(isOk) {
    var logger = this.logger;
    var statsd = this.statsd;

    var wasHealthy = this.isHealthy();
    this.bitRing.push(isOk);
    var isHealthy = this.isHealthy();

    if (wasHealthy && !isHealthy) {
        if (logger) {
            logger.warn(this.title + ' has gotten sick');
        }
        if (statsd) {
            this.statsd.increment('prober.' + this.title + '.health.sick');
        }
    } else if (!wasHealthy && isHealthy) {
        this.waitPeriod = this.defaultWaitPeriod;
        if (logger) {
            logger.warn(this.title + ' has returned to health');
        }
        if (statsd) {
            this.statsd.increment('prober.' + this.title + '.health.recovered');
        }
    } else if (!wasHealthy && !isHealthy) {
        if (statsd) {
            this.statsd.increment('prober.' + this.title +
                '.health.still-sick');
        }

        if (isOk) {
            this.waitPeriod /= 2;
            if (logger) {
                logger.warn(this.title + ' is still sick but last probe was ' +
                    'healthy. Decreased wait period to ' +
                    this.waitPeriod + 'ms');
            }
        } else {
            this.waitPeriod *= 2;

            if (this.waitPeriod > this.maxWaitPeriod) {
                this.waitPeriod = this.maxWaitPeriod;
                if (logger) {
                    logger.warn(this.title + ' is still sick. Wait period is ' +
                        'at its max, ' + this.waitPeriod + 'ms');
                }
            } else if (logger) {
                logger.warn(this.title + ' is still sick. Increased wait ' +
                    'period to ' + this.waitPeriod + 'ms');
            }
        }
    } else if (statsd) {
        this.statsd.increment('prober.' + this.title + '.health.still-healthy');
    }
};

Prober.prototype._isPityProbe = function _isPityProbe() {
    return this.lastBackendRequest && this.now() >=
        (this.lastBackendRequest + this.waitPeriod);
};

module.exports = Prober;
