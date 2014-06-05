type Prober := {
    isHealthy: () => Boolean,
    isSick: () => Boolean,
    notok: () => void,
    ok: () => void,
    prober: (
        request: (Callback<Error, HttpResponse>) => void,
        bypass: (Error) => void,
        callback: (Callback<Error, HttpResponse>) => void
    ) => void,
    setLogger: (WinstonLoggerClient) => void
}

rt-prober := ({
    title: String,
    statsd?: { increment: (String) => void },
    threshold?: Number,
    window?: Number,
    defaultWaitPeriod?: Number,
    maxWaitPeriod?: Number,
    enabled?: Boolean,
    detectFailuresBy?: 'event' | 'callback' | 'both',
    logger?: WinstonLoggerClient,
    backend?: EventEmitter,
    failureEvent?: String,
    successEvent?: String,
    now?: () => Number
}) => Prober
