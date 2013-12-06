type Prober := {
    isHealthy: () => Boolean,
    isSick: () => Boolean,
    notok: () => void,
    ok: () => void,
    prober: (
        request: (Callback<Error, HttpResponse>) => void,
        bypass: (Error) => void,
        callback: (Callback<Error, HttpResponse>) => void
    ) => void
}

rt-prober := ({
    title: String,
    threshold: NUmber,
    window: Number,
    defaultWaitPeriod: Number,
    maxWaitPeriod: Number,
    enabled: Boolean,
    detectFailuresBy: 'event' | 'callback' | 'both',
    statsd: RtStatsdClient | null
}) => Prober
