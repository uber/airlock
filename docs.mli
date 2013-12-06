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
    threshold: Number,
    window: Number,
    defaultWaitPeriod: Number,
    maxWaitPeriod: Number,
    enabled: Boolean,
    detectFailuresBy: 'event' | 'callback' | 'both',
    statsd?: StatsdClient | null,
    logger?: WinstonLoggerClient,
    backend: EventEmitter,
    failureEvent: String,
    successEvent: String,
    failureHandler: ({ subject: String, body: String }) => void,
    statsd: { increment: (String) => void }
}) => Prober
