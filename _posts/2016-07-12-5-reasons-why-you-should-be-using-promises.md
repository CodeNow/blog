---
layout: post
title: 5 Reasons Why You Should Be Using Promises
author: nathan_m
category: Engineering
excerpt: 'Promises are amazing! The concept has been around for decades, <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise" class="link">but they are finally here in ES6</a>! Before we switched to promises, our code was full of confusing callback tricks and <a href="https://github.com/caolan/async" class="link">async</a>. Switching to promises made our code easier to read, understand, and test. There are so many reasons to love promises, but here are my top five.'
legacy_url: http://blog.runnable.com/post/147262856601/5-reasons-why-you-should-be-using-promises
---

<p class="p">Promises are amazing! The concept has been around for decades, <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise" class="link">but they are finally here in ES6</a>! Before we switched to promises, our code was full of confusing callback tricks and <a href="https://github.com/caolan/async" class="link">async</a>. Switching to promises made our code easier to read, understand, and test. There are so many reasons to love promises, but here are my top five.</p>

<h3 class="h3">5. Synchronously asynchronous</h3>

<p class="p">Being able to write synchronous-looking asynchronous code has always been a struggle. Without promises, or installing a <a href="https://github.com/caolan/async" class="link">library</a> to make it a little better you usually get something like this:</p>

<pre class="pre"><code class="monospace no-wrap">asyncCall('hello', () =&gt; {
  asyncCall2('hello', () =&gt; {
    asyncCall3('hello', () =&gt; {
      asyncCall4('hello', cb)
    })
  })
})</code></pre>

<p class="p">Promises in ES6 come with some great basic tools.</p>

<p class="p"><code class="monospace">.then</code> is your standard serial function. It always gets the return value of what it’s connected to.</p>

<p class="p"><code class="monospace">.all</code> is your standard parallel function. It will complete when all of the promises have resolved, and will return an array of the results (in the same order as the input).</p>

<pre class="pre"><code class="monospace no-wrap">Promise
  .all([promises])
  .then((resultArray) =&gt; {
    ...
  })</code></pre>

<p class="p"><code class="monospace">.race</code> finishes when the first promise resolves, like they are in a race. The results of that promise are returned to the next promise in the chain.</p>

<pre class="pre"><code class="monospace no-wrap">Promise
  .race([promises])
  .then((fastestPromiseResult) =&gt; {
    ...
  })</code></pre>

<p class="p">My digital circuits professor loved to say, “If you were trapped on a desert island with only NAND and NOR logic gates, you could still build anything!” He was definitely strange, but he was talking about how the <code class="monospace">NAND</code> and <code class="monospace">NOR</code> gates can basically be used to make all of the other gates (<code class="monospace">OR</code>, <code class="monospace">AND</code>, <code class="monospace">XOR</code>, and so on), and thus were incredibly powerful.</p>

<p class="p">Those functions don’t seem like much, but they work the same way. When used together, these promise functions can do almost anything.</p>

<p class="p">If you’d like even more amazingness, you should look at <a href="http://bluebirdjs.com/" class="link">Bluebird</a>, a promises library that we use in several of our modules. It has great, time-saving functions; some of my favorites are <code class="monospace"><a href="http://bluebirdjs.com/docs/api/promise.some.html" class="link">.some</a></code>, <code class="monospace"><a href="http://bluebirdjs.com/docs/api/promise.reduce.html" class="link">.reduce</a></code>, and <code class="monospace"><a href="http://bluebirdjs.com/docs/api/promise.props.html" class="link">.props</a></code>.</p>

<h3 class="h3">4. Promise Error handling is Fantastic</h3>

<p class="p">I love the way promises handle errors, because I’ve ALWAYS hated doing this:</p>

<pre class="pre"><code class="monospace no-wrap">if (err) {
  return cb(err);
}</code></pre>

<p class="p">So many bugs have been attributed to this, and so much other awfulness. It’ll make your code look like a Jackson Pollock painting.</p>

<pre class="pre"><code class="monospace no-wrap">const fs = require('fs')
...
db.fetchFilePath(path, (err, path) =&gt; {
  if (err) {
    log.error({ err: err }, err.message)
    return cb(err)
  }
  fs.readFile(path, (err, data) =&gt; {
    if (err) {
      log.error({ err: err }, err.message)
      return cb(err) <span class="strong">// I swear there is a cb that isn’t returned around here...</span>
    }
    doSomethingElseWithFile(path, (err, data) =&gt; {
      if (err) {
        log.error({ err: err }, err.message)
        cb(err)
      }
      ...
      console.log(data)
    }
  }
}
...</code></pre>

<p class="caption">Ugh, I just threw up a little writing that block.</p>

<p class="p">Look at how promises handle errors. I’m using Bluebird’s <code class="monospace">.promisifyAll</code> method in this example, but this can also be done with ES6.</p>

<pre class="pre"><code class="monospace no-wrap">const bluebird = require('bluebird')
const fs = require('fs')

bluebird.promisifyAll(fs)
...
db.fetchFilePathAsync(fileId)
  .then((path) =&gt; {
    return fs.readFileAsync(path)
  })
  .then(console.log.bind(this))
  .catch((err) =&gt; {
    // All those errors are all here, no fuss
    log.error({ err: err }, err.message)
    if (err.level === ‘critical’) {
      // Rethrow so the caller gets the error, too
      throw err
    }
    // Don’t rethrow the error so we can ignore it
  })
  ...
}
...</code></pre>

<p class="caption">ooooo, so nice 😍</p>

<p class="p">Promises will really help clean up your code, and even help keep away some creeping spaghetti code.</p>

<p class="p">If you want to just eat up an error and keep going, just return in the .catch function. If you want to pass along the error to the promise consumer, all you need to do is rethrow it, and you’re good.</p>

<p class="p">Bluebird has something amazing called <a href="http://bluebirdjs.com/docs/api/catch.html#filtered-catch" class="link">Filtered Catch</a>, which lets you catch specific errors. It’s one of the key things that makes ponos work so well.</p>

<h3 class="h3">3. Promises can be used as a valueStore</h3>

<p class="p">Promises represent a "value that is <span class="em">promised</span>", and once resolved, will always resolve to that same value. This can be used to aggregate a lot of repeated calls into the same promise, which would fire all of the <code class="monospace">.then</code> functions attached to it like an event.</p>

<pre class="pre"><code class="monospace no-wrap">// This is a very simple cache missing important features like invalidate

var comcastDataPromise = downloadDataOver14kBaud()

comcastDataPromise
  .then(streamDataFaster)

comcastDataPromise
  .then(console.log.bind(this)) // Slow as hell anyway, might as well read it all /nsa</code></pre>

<p class="p">Promises can also be passed around throughout the app with chains attached to them to keep the asynchronous code flowing:</p>

<pre class="pre"><code class="monospace no-wrap">function fetchBranches (userPromise) {
  return userPromise
    .then((user) =&gt; {
      return user.fetchBranches()
    })
    .then(console.log.bind(this))
  })
}</code></pre>

<p class="p">This is something I love about promises. Especially in the front end, where you may have multiple components which have logic based off the same data. This makes it easy to start processing right after they resolve, or immediately if they already have.</p>

<h3 class="h3">2. Modify signatures of methods more easily</h3>

<p class="p">In standard Node, the last value of a function is always the callback of an async function. This makes it a pain to change the signature of a method.</p>

<p class="p">Do you use optional-value function overloading in your code? Like this:</p>

<pre class="pre"><code class="monospace no-wrap">function doStuff (user, opts, cb) {
  if (typeof opts === 'function' &amp;&amp; cb === undefined) {
    cb = opts
    opts = {}
  }
}</code></pre>

<p class="p">We used to have these checks everywhere. Refactoring to change a signature used to take hours, but since Promises use the return value, now we just leave those optional params null without any hassle.</p>

<h3 class="h3">1. Ease of use</h3>

<p class="p">Promises just make your code look so much nicer, and they’re easy to learn and understand! I love how easy it is to modify promise chains for adding features. In the following examples, I’ll be using a lot of Bluebird stuff, but there is still much love for the plain old ES6 ones.</p>

<p class="p">Here is what it would look like with callbacks:</p>

<div class="pre-label">Before:</div>
<pre class="pre"><code class="monospace no-wrap">// Here, we’ll add a parallel call to fs.stat during the read

db.fetchFilePath(fileId, (err, path) =&gt; {
  if (err) {
    log.error({ err: err }, err.message)
    return cb(err)
  }
  fs.readFile(path, (err, data) =&gt; {
    if (err) {
      log.error({ err: err }, err.message)
      return cb(err)
    }
    ...
    console.log(data)
  }
}</code></pre>

<div class="pre-label">After:</div>
<pre class="pre"><code class="monospace no-wrap">// Here, we’ll add a parallel call to fs.stat during the read

db.fetchFilePath(fileId, (err, path) =&gt; {
  if (err) {
    log.error({ err: err }, err.message)
    return cb(err)
  }
  async
    .parallel({
      data: fs.readFile.bind(fs, path),
      stats: fs.stat.bind(fs, path)
    }, (err, results) =&gt; {
      if (err) {
        log.error({ err: err }, err.message)
        return cb(err)
      }
      console.log('stats: ', results.stats, 'data: ', results.data)
      return cb(null, results)
    }
}</code></pre>

<p class="p">Here is the same logic using promises:</p>

<div class="pre-label">Before:</div>
<pre class="pre"><code class="monospace no-wrap">// Here, we’ll add a parallel call to fs.stat during the read

return db.fetchFilePathAsync(fileId)
  .then((path) =&gt; {
    return fs.readFileAsync(path)
  })
  .then(console.log.bind(this))
  .catch((err) =&gt; {
    log.error({ err: err }, err.message)
    throw err
  })
  ...
}</code></pre>

<div class="pre-label">After:</div>
<pre class="pre"><code class="monospace no-wrap">// Here, we’ll add a parallel call to fs.stat during the read

return db.fetchFilePathAsync(fileId)
  .then((path) =&gt; {
    return Promise.props({
      data: fs.readFileAsync(path),
      stats: fs.statAsync(path)
    })
  })
  .tap((results) =&gt; {
    console.log('stats: ', results.stats, 'data: ', results.data)
  })
  .catch((err) =&gt; {
    log.error({ err: err }, err.message)
    throw err
  })
  ...
}
...</code></pre>

<p class="p">If you wanted to add an event to happen in the chain after fstat, you can easily do that with promises:</p>

<pre class="pre"><code class="monospace no-wrap">// Here, we’ll add a parallel call to fs.stat during the read
return db.fetchFilePathAsync(fileId)
  .then((path) =&gt; {
    return {
      data: fs.readFileAsync(path),
      stats: fs
        .statAsync(path)
        .then((stats) =&gt; {
          log.info({stats: stats}, 'stats)
          return sendStatsAsync(stats)
        })
    }
  })
  .tap((results) =&gt; {
    console.log('stats: ', results.stats, 'data: ', results.data)
  })
  .catch((err) =&gt; {
    log.error({ err: err }, err.message)
    throw err
  })
}</code></pre>

<p class="p">By comparison, here’s what we’d have to do with callbacks, using async:</p>

<pre class="pre"><code class="monospace no-wrap">db.fetchFilePath(fileId, (err, path) =&gt; {
  if (err) {
    log.error({ err: err }, err.message)
    return cb(err)
  }
  async
    .parallel({
      data: fs.readFile.bind(fs, path),
      stats: (cb) =&gt; {
        fs.stat(path, (err, stats) =&gt; {
          if (err) {
            log.error({ err: err }, err.message)
            return cb(err)
          }
          log.info({stats: stats}, 'stats)
          sendStats(stats, cb)
        })
      }
    }, (err, results) =&gt; {
      if (err) {
        log.error({ err: err }, err.message)
        return cb(err)
      }
      console.log('stats: ', results.stats, 'data: ', results.data)
      return cb(null, results)
    })
}</code></pre>

<p class="p">Promise error handling is easy to use, and can automatically be handled by the chain. It has  a built-in try-catch, so all of your code is safe by default, and won’t cause you crazy headaches.</p>

<p class="p">Bluebird offers <code class="monospace">Promisify</code>, which makes it super easy to convert any of your existing Node callback- based methods to promises. (You can always use <code class="monospace">.asCallback(cb)</code> to go back). This is incredibly powerful, since it makes converting your existing codebase even easier. One of the biggest issues with adoption is getting your change to work with the existing code. This makes it easy.</p>

<pre class="pre"><code class="monospace no-wrap">const bluebird = require('bluebird')
const fs = require('fs')

bluebird.promisifyAll(fs)

...
return fs.accessAsync(path) // promisified fs.access(path, cb)</code></pre>

<p class="p">That’s it. Ready to go.</p>

<p class="p">Promises aren’t a new concept, and they’re definitely not only a JS thing. Now that it’s officially in the spec, it’ll (hopefully) become the golden standard! They clean up code and make it easier to read and change. Modifying the flow is easy, and since they don’t use the input of the function, refactoring becomes is easier. So much goodness from such a small package!</p>
