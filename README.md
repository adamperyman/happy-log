# happy-log

A simple server-side logger.

![](https://media.giphy.com/media/u33BcMbqQmJGg/giphy.gif)

## Usage

```
import logger from 'happy-log'

// Enable logging for requests.
app.use(logger.expressMiddleware)

try {
  // Nice things happening.
} catch (error) {
  logger.error(`A happy accident occured :(\n ${error}`)
}
```
