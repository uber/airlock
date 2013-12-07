function Prober(options) {
    if (!(this instanceof Prober)) {
        return new Prober(options);
    }

    options = options || {};

    this.title = options.title || 'general';
    this.threshold = options.threshold || 3;
    this.window = options.window || 5;
    this.defaultWaitPeriod = options.defaultWaitPeriod || 1000;
    this.maxWaitPeriod = options.maxWaitPeriod || 60000;
    this.enabled = options.enabled || true;
    var detectFailuresBy = options.detectFailuresBy || Prober.detectBy.CALLBACK;
    this.detectFailuresByCallback =
        (detectFailuresBy === Prober.detectBy.CALLBACK) ||
        (detectFailuresBy === Prober.detectBy.BOTH);
    this.detectFailuresByEvent =
        (detectFailuresBy === Prober.detectBy.EVENT) ||
        (detectFailuresBy === Prober.detectBy.BOTH);

    this.failureHandler = options.failureHandler;
    this.logger = options.logger || null;
    this.probes = [];
    this.waitPeriod = this.defaultWaitPeriod;
    this.lastBackendRequest = Date.now();
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

Prober.prototype.isHealthy = function isHealth() {
    return this.probes.length < this.window ||
        this._getOks().length >= this.threshold;
};

Prober.prototype.isSick = function isSick() {
    return !this.isHealthy();
};

Prober.prototype.notok = function notok() {
    this._addProbe(false);
    if (this.statsd) {
        this.statsd.increment('prober.' + this.title + '.probe.notok');
    }
};

Prober.prototype.notOk = Prober.prototype.notok;

Prober.prototype.ok = function ok() {
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
        try {
            request(wrappedCallback);
        } catch (e) {
            // we can't log the error here in case the prober is used
            // within the loger. So instead we pass it to the failureHandler
            // the user of this module should not log in the failureHandler
            // maybe send an email instead
            this.failureHandler({
                subject: "Exception in Prober while probing " + this.title,
                body: e.stack
            });
        }

        this.lastBackendRequest = Date.now();
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
    var timestamp = Date.now();
    var logger = this.logger;
    var statsd = this.statsd;

    var wasHealthy = this.isHealthy();
    var thisProbe = { isOk: isOk, timestamp: timestamp };
    this.probes.unshift(thisProbe);
    this.probes = this.probes.slice(0, this.window);
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

        if (thisProbe.isOk) {
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
    }
};

Prober.prototype._getOks = function _getOks() {
    return this.probes.filter(function(probe) { return probe.isOk; });
};

Prober.prototype._isPityProbe = function _isPityProbe() {
    return this.lastBackendRequest && Date.now() >=
        (this.lastBackendRequest + this.waitPeriod);
};

module.exports = Prober;
