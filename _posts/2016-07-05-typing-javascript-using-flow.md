---
layout: post
title: Typing JavaScript Using Flow
author: bryan_k
category: Engineering
excerpt: 'One of the things that I found difficult when writing and refactoring in <a href="introducing-ponos-a-rabbitmq-based-worker-server" class="link">Ponos</a> was maintaining the borders between the few classes and their functions. Some of the class methods returned values, some could throw errors, and others returned Promises. Relying on the inline documentation was insufficient because methods were changing faster than I was updating the documentation. Beyond these issues, I found myself moving or copying large chunks of testing code around for relatively small refactors, further fueling my motivation to find a better way.'
legacy_url: http://blog.runnable.com/post/146913218961/typing-javascript-using-flow
---

<p class="p">One of the things that I found difficult when writing and refactoring in <a href="/blogs/introducing-ponos-a-rabbitmq-based-worker-server" class="link">Ponos</a> was maintaining the borders between the few classes and their functions. Some of the class methods returned values, some could throw errors, and others returned Promises. Relying on the inline documentation was insufficient because methods were changing faster than I was updating the documentation. Beyond these issues, I found myself moving or copying large chunks of testing code around for relatively small refactors, further fueling my motivation to find a better way.</p>

<p class="p">Upon examining these tests, I noticed that all of them were validating the exceptions thrown by methods when given invalid inputs. While these tests were necessary to get 100% test coverage, the return on investment (ROI) <a id="footnote-1-source" href="#footnote-1" class="link">[1]</a> was miniscule. I started looking for a way to get a better ROI than these type tests. A great deal of backend languages (e.g. Java, Go) are statically typed: if I type my JavaScript, that would help get rid of all these type tests and give me a much better ROI.</p>

<h3 class="h3">Enter Flow</h3>

<p class="p">The tool that I settled on was <a href="https://flowtype.org/" class="link">Flow</a>. Flow is a type annotation system that is added on top of normal JavaScript. It had two strengths that influenced the decision. First, Flow is opt-in on a per-file basis. This means that types can be slowly added to a project over time, rather than all at once. Second, it has a ‘weak mode’ which will ignore untyped values, allowing developers to slowly roll out typing to a file and then disable weak mode when everything is typed. These two properties allow a minimal initial investment to get started with Flow, but give the developer a strong confidence in the typing system and the checks it provides.</p>

<p class="p">An example is worth a thousand words. Below is a majorly reduced code snippet from Ponos showing the relevant code for setting up a subscription to a topic queue:</p>

<div class="pre-label">src/rabbitmq.js</div>
<pre class="pre ln"><code class="monospace no-wrap"><span>const Immutable = require('immutable')</span>
<span class="ln-ellipsis"></span>
<span class="ln-reset" style="counter-increment: ln 50">class RabbitMQ {</span>
<span>  // This is the way Flow defines instance variable types</span>
<span>  subscribed: Set&lt;string&gt;;</span>
<span>  subscriptions: Map&lt;string, Function&gt;;</span>
<span class="ln-ellipsis"></span>
<span class="ln-reset" style="counter-increment: ln 100">  constructor () {</span>
<span>    this.subscriptions = new Immutable.Map()</span>
<span>    this.subscribed = new Immutable.Set()</span>
<span>  }</span>
<span class="ln-ellipsis"></span>
<span class="ln-reset" style="counter-increment: ln 200">  subscribeToQueue (queue: string, handler: Function): Promise&lt;void&gt; {</span>
<span>    if (this.subscribed.has(`queue:::${queue}`)) {</span>
<span>      log.warn('already subscribed to queue')</span>
<span>      return Promise.resolve()</span>
<span>    }</span>
<span>    return this.channel.assertQueue(queue)</span>
<span>      .then(() =&gt; {</span>
<span>        this.subscriptions = this.subscriptions.set(queue, handler)</span>
<span>        this.subscribed = this.subscribed.add(`queue:::${queue}`)</span>
<span>      })</span>
<span>  }</span>
<span>}</span></code></pre>

<p class="p">Flow gives us very quick insight into what variables are being used and their types. In this case, we can quickly see that when we create a new instance of RabbitMQ, we are creating a new string set (<code class="monospace">subscribed</code>) as well as a string-to-function map (<code class="monospace">subscriptions</code>). Finally, when we start looking at <code class="monospace">subscribeToQueue</code>, we can see that it takes a string and a function as its parameters. However, there are no type checks in the implementation! If we use <code class="monospace">subscribeToQueue</code> in any other way in the rest of the code base, Flow will return an error saying that the types are incompatible. This allows us to trust Flow to validate all the types we are passing, enabling us to safely delete all the unit tests that were maintained to test type handling.</p>

<p class="p">To illustrate the error reporting, I changed the <code class="monospace">subscribeToQueue</code> call to pass an object (instead of a function) as the second parameter.</p>

<div class="pre-label">src/rabbitmq.js</div>
<pre class="pre ln"><code class="monospace no-wrap"><span class="ln-reset" style="counter-increment: ln 205">return this._rabbitmq.subscribeToQueue(</span>
<span>  queue,</span>
<span>  {</span>
<span>    handler: (job, done) =&gt; { /* ... */ },</span>
<span>    opts: {}</span>
<span>  }</span>
<span>)</span></code></pre>

<p class="p">This results in the following error from Flow:</p>

<pre class="pre"><code class="monospace no-wrap">src/rabbitmq.js:200
200:     handler: Function,
                  ^^^^^^^^ function type. Callable signature not found in
232:         {
             ^ object literal. See: src/server.js:232</code></pre>

<p class="p">Flow is showing me in my typed source where I am making a mistake! I replace the object with just the handler function and the error is resolved.</p>

<h3 class="h3">External Modules</h3>

<p class="p">One thing that I skipped over is how Flow knew about the <code class="monospace">immutable</code> library. This is actually one of the parts where Flow can be a little cumbersome. Roughly, for every external module, you need to create an interface file that tells Flow what types to expect. Flow describes this a bit in their <a href="https://flowtype.org/docs/third-party.html" class="link">documentation</a>, but I’ll give you a rather complicated example of the interface file for this <code class="monospace">Set</code> class, with a little commentary to explain what’s happening.</p>

<p class="p"><a href="#" class="link">Immutable</a> is a rather large library that extends many classes to create inheritance with its typing. Below is a condensed slice that gives us the functionality of the <code class="monospace">Set</code> used above.</p>

<pre class="pre"><code class="monospace no-wrap">declare class Set {
  // this actually inherits from SetCollection, but the two functions
  // we use are:
  add&lt;U&gt;(value: U): Set&lt;T|U&gt;;
  has(key: K): boolean;
}

declare module 'immutable' {
  declare var exports: {
    Set: Class&lt;Set&gt;
  }
}

export {
  Set
}</code></pre>

<p class="p">Starting from the bottom, we can see it is exporting the class <code class="monospace">Set</code>. This is how we can use <code class="monospace">Set&lt;string&gt;</code> as the type for subscribed when we initially define the type in the class. In the constructor of RabbitMQ we actually call <code class="monospace">new Set()</code>. This is enabled by the middle block in the snippet; <code class="monospace">declare module</code> defines what is actually available from the module. Finally, at the top, we see the declaration of a typed <code class="monospace">Set</code>. It has two functions, <code class="monospace">add</code> and <code class="monospace">has</code>, with defined input and output types.</p>

<p class="p">All of this comes together when <code class="monospace">flow</code> is run against our repository. Flow checks all the places where these functions are being used and makes sure all the types are as expected. If we trust Flow, we can then remove all our internal type checking unit tests and simply maintain the much more valuable typing in our code.</p>

<h3 class="h3">Moving Forward</h3>

<p class="p">Typing definitely isn’t new, but it’s very new for JavaScript. There are a couple other ways one can get typing for JavaScript. First, <a href="https://www.typescriptlang.org/" class="link">TypeScript</a> can be transpiled to JavaScript. TypeScript writes very similarly to Flow’d JavaScript but does have some additional functionality available on top of its defined types. Second, though it will take time, future drafts of ECMAScript are <a href="https://esdiscuss.org/topic/es8-proposal-optional-static-typing" class="link">considering including typing</a> directly in JavaScript. This will remove the dependency on anything external for checking types and improve the JavaScript ecosystem.</p>

<p class="p">Until the time comes that JavaScript typing is native, I highly suggest checking out these ways of typing your JavaScript and improving confidence in your code!</p>

<aside id="footnote-1" class="footnote">1. I definitely am borrowing this ROI concept from a book named Working Effectively with Unit Tests by Jay Fields [<a href="https://leanpub.com/wewut" class="link">PDF</a>]. A good read — I definitely recommend it! <a href="#footnote-1-source" class="link">↩</a></aside>
