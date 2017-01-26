---
layout: post
title: 'Bluebird in the wild: Advanced promise-based workflows'
author: jorge_s
category: Engineering
excerpt: 'Over the last months, we‘ve been converting our code from using callbacks to using promises. In our coding style, we‘ve found promises to be a cleaner way to organize code and a better way to deal with error handling. As we‘ve done more and more of this, we‘ve gotten better at identifying effective patterns for using promises and the best ways to migrate to them. We‘ve also found <a class="link" href="http://bluebirdjs.com/">Bluebird</a> to be the best promise library out there. Bluebird not only provides solid performance, but it also provides wonderful abstractions over promises.<br><br>In this article, I‘ll show you some of the more useful methods in Bluebird and how we use these here at Runnable. Some of these are taken directly from our codebase in order to help out anyone looking to start migrating to promises or just improve and clean up your current implementations.'
legacy_url: http://blog.runnable.com/post/143035495456/bluebird-in-the-wild-advanced-promise-based
---

<p class="p">Over the last months, we've been converting our code from using callbacks to using promises. In our coding style, we've found promises to be a cleaner way to organize code and a better way to deal with error handling. As we've done more and more of this, we've gotten better at identifying effective patterns for using promises and the best ways to migrate to them. We've also found <a class="link" href="http://bluebirdjs.com/">Bluebird</a> to be the best promise library out there. Bluebird not only provides solid performance, but it also provides wonderful abstractions over promises.</p>

<p class="p">In this article, I'll show you some of the more useful methods in Bluebird and how we use these here at Runnable. Some of these are taken directly from our codebase in order to help out anyone looking to start migrating to promises or just improve and clean up your current implementations.</p>

<p class="p em">Quick Note: I'm presuming you're already familiar with callbacks and promises so I won't go into what they are and the basics of using promises. If you're not familiar with promises, you should check out <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise" class="link">MDN's entry for Promises</a>.</p>

<h3 class="h3">Promise.promisify and Promise.promisifyAll</h3>

<p class="p">The first two methods I want to point out are <code class="monospace">Promise.promisify</code> and <code class="monospace">Promise.promisifyAll</code>. <code class="monospace">Promise.promisify</code> takes a function that takes a callback as its last argument and converts it into a function that returns a promise (without the need for a callback). <code class="monospace">Promise.promisifyAll</code> does the same for all function properties in an object by adding a new function with <code class="monospace">Async</code> appended to the name of the original function (e.g.<code class="monospace">readFile</code> becomes <code class="monospace">readFileAsync</code>).</p>

<p class="p">This method is really useful for libraries which use callbacks, but you want to convert to use promises. You can require the library and pass it into <code class="monospace">Promise.promisifyAll</code> to quickly integrate it into your project. This method can also be use to quickly migrate your old callback-based code into promises. Currently, we use these on most of our Mongoose models and some our dependencies that don't use promises such as <code class="monospace"><a href="https://github.com/request/request" class="link">request</a></code> and <code class="monospace"><a href="https://www.npmjs.com/package/dockerode" class="link">dockerode</a></code>.</p>

<div class="pre-label">Before:</div>
<pre class="pre"><code class="monospace no-wrap">const fs = require('fs')

fs.readFile('./helloWorld', (err, fileContents) =&gt; {
  if (err) return errorHandler(err)
  console.log(fileContents)
})</code></pre>

<div class="pre-label">After:</div>
<pre class="pre"><code class="monospace no-wrap">const Promise = require('bluebird')
const fs = Promise.promisifyAll(require('fs'))

fs.readFileAsync('./helloWorld')
  .then(fileContents =&gt; console.log(fileContents))
  .catch(errorHandler)</code></pre>

<h3 class="h3">Promise.fromCallback and Promise.asCallback</h3>

<p>Most times, promisifying functions will get you close enough to being able to use promises, but not every time. Sometimes, you might still want to interact with a function through a callback, but might not want to or be able to promisify it. For that, there's <code class="monospace">Promise.fromCallback</code>. This method provides a callback you can pass to any other function and it will return a promise. This is much cleaner than having to interact with <code class="monospace">resolve</code> and <code class="monospace">reject</code> functions.</p>

<div class="pre-label">Before:</div>
<pre class="pre"><code class="monospace no-wrap">const Promise = require('bluebird')
const User = require('./models/user')

return new Promise((resolve, reject) =&gt; {
  User.findById(ID, (err, user) =&gt; {
    if (err) {
      return reject(err)
    }
    return resolve(user)
  })
})
  .then(user =&gt; console.log(user))
</code></pre>

<div class="pre-label">After:</div>
<pre class="pre"><code class="monospace no-wrap">const Promise = require('bluebird')
const User = require('./models/user')

return Promise.fromCallback((cb) =&gt; {
  User.findById(ID, cb)
})
  .then(user =&gt; console.log(user))
</code></pre>

<p class="p">On the other hand, you might have functions that take a callback as an argument but you still want to write using promises. For that, there's <code class="monospace">Promise.asCallback</code>. With <code class="monospace">Promise.asCallback</code> you can have a normal promise chain and then just pass the callback into <code class="monospace">.asCallback</code>. One of the ways we use this if for asynchronous tests. We usually write a test with a promise chain and then just pass our <code class="monospace">done</code> function to <code class="monospace">asCallback</code>.</p>

<div class="pre-label">Before:</div>
<pre class="pre"><code class="monospace no-wrap">const Promise = require('bluebird')
const fs = Promise.promisifyAll(require('fs'))

it('should read a file', (done) =&gt; {
  fs.readFileAsync('./fileAsync')
    .then(contents =&gt; {
      expect(contents).to.match(/hello.*world/)
      return done()
    })
    .catch(done)
})</code></pre>

<div class="pre-label">After:</div>
<pre class="pre"><code class="monospace no-wrap">const Promise = require('bluebird')
const fs = Promise.promisifyAll(require('fs'))

it('should read a file', (done) =&gt; {
  fs.readFileAsync('./fileAsync')
    .then(contents =&gt; {
      expect(contents).to.match(/hello.*world/)
    })
    .asCallback(done)
})</code></pre>

<h3 class="h3">Passing error types into catch</h3>

<p class="p">Another really useful utility provided by Bluebird is the ability to pass an error constructor/class as the first argument to <code class="monospace">catch</code> in order to only handle that type of error. We mostly use this feature by creating our own errors classes in our code and throwing them appropriately. Then our <code class="monospace">catch</code> statement is able to filter out the error we've thrown and handles it accordingly.</p>

<div class="pre-label">Before:</div>
<pre class="pre"><code class="monospace no-wrap">const Promise = require('bluebird')
const fs = Promise.promisifyAll(require('fs'))
class FileNotFoundError extends Error {}

fs.readFileAsync('./fileAsync')
  .then(contents =&gt; {
    if (!contents) throw FileNotFoundError()
    expect(contents).to.match(/hello.*world/)
  })
  .catch((err) =&gt; {
    if (err instanceof FileNotFoundError) {
      return false
    }
    throw err
  })</code></pre>

<div class="pre-label">After:</div>
<pre class="pre"><code class="monospace no-wrap">const Promise = require('bluebird')
const fs = Promise.promisifyAll(require('fs'))
class FileNotFoundError extends Error {}

fs.readFileAsync('./fileAsync')
  .then(contents =&gt; {
    if (!contents) throw FileNotFoundError()
    expect(contents).to.match(/hello.*world/)
  })
  .catch(FileNotFoundError, () =&gt; {
    return false
  })</code></pre>

<h3 class="h3">Promise.method and Promise.try</h3>

<p class="p">One of the nice things about promises is that we can throw errors in a synchronous manner. One example of this (and a very good practice in general) is starting a function with some input validation. If the provided inputs don't meet our validation, we want to throw an error explaining to the consumer of the function what we expect. When doing this with promises, we need to wrap that logic around a promise in order for the error to be properly caught. <code class="monospace">Promise.try</code> is a great way to deal with this. Instead of having to create an empty promise, we can just pass a function to <code class="monospace">try</code> that will return a promise and catch errors inside the promise flow.</p>

<div class="pre-label">Before:</div>
<pre class="pre"><code class="monospace no-wrap">const Promise = require('bluebird')

var method = function (input) {
  return Promise.resolve()
    .then() =&gt; {
      if (!input) throw new Error('Hello World')
    })
}</code></pre>

<div class="pre-label">After:</div>
<pre class="pre"><code class="monospace no-wrap">const Promise = require('bluebird')

var method = function (input) {
  return Promise.try(() =&gt; {
    if (!input) throw new Error('Hello World')
  })
}</code></pre>

<p class="p"><code class="monospace">Promise.method</code> takes this idea one step further. With <code class="monospace">Promise.method</code>, we can just pass any function into it, in order to have it always return a promise. The effect is similar to wrapping your function around a <code class="monospace">Promise.try</code>. In our code base we use <code class="monospace">Promise.method</code> to declare functions which we want to always return a promise.</p>

<div class="pre-label">Before:</div>
<pre class="pre"><code class="monospace no-wrap">const Promise = require('bluebird')

var method = function (input) {
  return Promise.try(() =&gt; {
    if (!input) throw new Error('Hello World')
  })
}</code></pre>

<div class="pre-label">After:</div>
<pre class="pre"><code class="monospace no-wrap">const Promise = require('bluebird')

var method = Promise.method(() =&gt; {
  if (!input) throw new Error('Hello World')
})</code></pre>

<p class="p">There is an important thing to note here. If a function invoked by a promise throws an error asynchronously, that error will not be caught by the promise. The error will throw outside the promise chain error and the process will exit if not inside a try/catch or a domain. Basically, you have to be careful that all the asynchronous code you use is written using promises or ensure callbacks are properly handled.</p>

<pre class="pre"><code class="monospace no-wrap">'use strict'
const Promise = require('bluebird')

let cb = () =&gt; setTimeout(() =&gt; { throw new Error() }, 0)
let justDoIt = Promise.method((num) =&gt; {
  return cb()
});

justDoIt()
  .catch((err) =&gt; {
    // This line won't run :(
    console.log('Caught Error', err)
  })</code></pre>

<h3 class="h3">Promise.race and Promise.any</h3>

<p class="p"><code class="monospace">Promise.race</code> and <code class="monospace">Promise.any</code> are similar in that they both take an array of values/promises and return the first one to be fulfilled. The main difference between these is that <code class="monospace">Promise.race</code> returns the first resolved or rejected promise, while <code class="monospace">Promise.any</code> returns the first fulfilled promise. In our codebase we use these methods in a couple of ways.</p>

<p class="p">The first one is testing. Some of our tests have to create socket connections and send messages over that connection, expecting something back. As a way to timeout the requests, we pass an array with our promise and a delay promise to ensure it doesn't timeout. Keep in mind that we use <code class="monospace">race</code> here because we want to the promise to be rejected if our socket connection throws an error.</p>

<pre class="pre"><code class="monospace no-wrap">const Promise = require('bluebird')

it('should create a connection', () =&gt; {
  Promise.race([ delay(1000), getFromSocket() ])
  .then((res) =&gt; {
    expect(res).to.not.be('undefined');
  })
  .asCallback(done)
})</code></pre>

<p class="p">The second interesting use case is for simultaneously checking for multiple conditions. For example, we use <code class="monospace">Promise.any</code> to see if a given user is the owner of X or if that user is a moderator. Here, we don't necessarily care about which one is true, just as long as one of them is.</p>

<pre class="pre"><code class="monospace no-wrap">const Promise = require('bluebird')
const User = require('./models/User')

var hasAccess = (container, user) =&gt; {
  return Promise.any([
    User.isModerator(user),
    User.isOwner(container, user)
  ])
    .then((user) =&gt; {
      if (!user) return false
      return document.update()
    })
}</code></pre>

<h3 class="h3">Iterables with Promise.map, Promise.each, and Promise.filter</h3>

<p class="p">Apart from all previously mentioned methods, Bluebird provides some really useful utility methods for iterables (this includes not only arrays, but also maps and sets). Some of these operations are not too different from their synchronous counterparts (<code class="monospace">map</code> and <code class="monospace">filter</code>), but some like <code class="monospace">Promise.each</code> provide really useful abstractions that are cumbersome to write by yourself.</p>

<p class="p">One of the ways in which we use <code class="monospace">Promise.each</code> is for enqueuing jobs into RabbitMQ. When doing this, we don't really care about the result, and enqueuing jobs is a synchronous operation. Enqueuing a job into RabbitMQ is essentially a side effect. <code class="monospace">Promise.each</code> enqueues our jobs and then returns the original array, which is really what we want (not the result of the side-effect).</p>

<div class="pre-label">Before:</div>
<pre class="pre"><code class="monospace no-wrap">const Promise = require('bluebird')
const Container = require('./models/container')
const rabbitmq = require('./utils/rabbitmq-helper')

var removeByName = Promise.method((name) =&gt; {
  return Container.find({ name: name })
    .then((instances) =&gt; {
      let promise = Promise.resolve()
      instances.forEach((instance) =&gt; {
        promise = promise
          .then(() =&gt; {
            return rabbitmq.publish('container:remove', {
              id: instance._id
            })
          })
      })
      return promise
    })
})</code></pre>

<div class="pre-label">After:</div>
<pre class="pre"><code class="monospace no-wrap">const Promise = require('bluebird')
const Container = require('./models/container')
const rabbitmq = require('./utils/rabbitmq-helper')

var removeByName = Promise.method((name) =&gt; {
  return Container.find({ name: name })
    .each((instance) =&gt; {
      return rabbitmq.publish('container:remove', {
        id: instance._id
      })
    })
})</code></pre>

<h3 class="h3">Conclusion</h3>

<p class="p">Bluebird provides a much cleaner, understandable way of dealing with promises. It provides a great abstraction layer over promises, and useful methods to transition your callback-based code. If you're interested in knowing more about Bluebird and other promise workflows, check out <a href="http://bluebirdjs.com/docs/api-reference.html" class="link">Bluebird’s API documentation</a>.</p>
