# airlock

A prober to probe HTTP based backends for health

## Example

```js
var Prober = require("airlock")

var prober = new Prober({
    title: 'probe interface',
    failureHandler: function (opts) {
        /* prober failed to probe a thunk.
            handle this case somehow, maybe send email or log
            to a known working logger.
        */
    },
    statsd: { increment: function (key) {
        // send increment command to a statsd server.
    } },
    logger: {
        warn: function (message) {
            /* sink this message to your logging system */
        }
    }
})

var thunk = request.bind(null, {
    uri: 'http://www.example.com/foo',
    method: 'POST',
    json: { ... }
})
prober.probe(thunk, function (err, res, body) {
    /* we probed the async task and have the result
        if the async task fails a lot then the prober
        automatically rate limits
    */
})
```

## Options

- title             default: `'general'`
- threshold         default: `6`
- window            default: `10`
- now               default: `Date.now`
- defaultWaitPeriod default: `1000`
- maxWaitPeriod     default: `60 * 1000`
- enabled           default: `true`
- detectFailuresBy  default: `Prober.detectBy.CALLBACK`
- failureHandler
- logger
- statsd
- backend
- failureEvent
- successEvent

## Installation

`npm install airlock`

## Contributors

 - Raynos
 - markyen
 - jwolski

## MIT Licenced
