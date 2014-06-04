# airlock

A prober to probe HTTP based backends for health

## Example

```js
var Prober = require("airlock")

var prober = new Prober({
    title: 'probe interface',
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

## Installation

`npm install airlock`

## Contributors

 - Raynos
 - markyen
 - jwolski

## MIT Licenced
