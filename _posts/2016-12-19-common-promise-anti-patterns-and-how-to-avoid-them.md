---
layout: post
title: Common Promise Anti-Patterns and How to Avoid Them
author: ryan_k
category: Engineering
excerpt: 'Engineers making the move from callbacks to promises make common mistakes and introduce anti-patterns into their codebase. During my time working with promises at Runnable, I’ve identified a few common anti-patterns people use that cause issues maintaining the codebase. As I go through these anti-patterns I’ll explain what the pattern is, how to avoid it, and then take it a step further using <a href="http://bluebirdjs.com/docs/getting-started.html" class="link">Bluebird</a> to make the code cleaner.'
legacy_url: http://blog.runnable.com/post/154695425511/
---

<p class="p">Engineers making the move from callbacks to promises make common mistakes and introduce anti-patterns into their codebase. During my time working with promises at Runnable, I’ve identified a few common anti-patterns people use that cause issues maintaining the codebase. As I go through these anti-patterns I’ll explain what the pattern is, how to avoid it, and then take it a step further using <a href="http://bluebirdjs.com/docs/getting-started.html" class="link">Bluebird</a> to make the code cleaner.</p>

<h3 class="h3">Variable Nesting</h3>
<p class="p">Keeping a variable as a temporary value for the result of a promise can lead to timing issues and debugging problems down the line. Often times this anti-pattern leads to the loss of programming flexibility, specifically when changing the order of operations or refactoring code. Here is an example of this anti-pattern:</p>

<pre class="pre monospace no-wrap">
// Defining a variable to store later
var user
var accountInfo

fetchUser()
  .then((fetchedUser) =&gt; {
    // Setting the variable that we will use later
    user = fetchedUser
  })
  .then(() =&gt; {
    return fetchAccountInfo(user)
  })
  .then((fetchedAccountInfo) =&gt; {
    accountInfo = fetchedAccountInfo
  })
  .then(() =&gt; {
    // Using the variables that have been set previously
    return {
      user: user,
      accountInfo: accountInfo
    }
  })
</pre>

<p class="p">This can make code-refactoring incredibly difficult, because a variable which may be used later down in the file may not be properly set if you change the execution order. A better way to accomplish this:</p>

<pre class="pre monospace no-wrap">
var userFetchPromise = fetchUser()
var accountInfoFetchPromise = userFetchPromise
  .then((user) =&gt; {
    return fetchAccountInfo(user)
  })
return Promise.all([userFetchPromise, accountInfoFetchPromise])
  .then((results) =&gt; {
    return {
      user: results[0],
      accountInfo: results[1]
    }
  })
</pre>

<p class="p">This makes it so we are working with the direct response of the promises instead of storing the responses in variables. Remember, you can re-use promise results as many times as you want. This is a common issue for engineers migrating from a callback style, and once this is understood the world of promises often clicks in their minds.</p>

<p class="p">We can clean this up a bit more if we use Bluebird’s Promise.props to avoid having to deal with the array indexes:</p>

<pre class="pre monospace no-wrap">
var userFetchPromise = fetchUser()
var accountInfoFetchPromise = userFetchPromise
  .then((user) =&gt; {
    return fetchAccountInfo(user)
  })
return Promise.props({
  user: userFetchPromise,
  accountInfo: accountInfoFetchPromise
})
</pre>

<p class="p">Often times people will forget that they can do this and re-run the same promise many times. While technically this works, It is going to run fetchUser twice:</p>

<pre class="pre monospace no-wrap">
return Promise.props({
  user: fetchUser(),
  accountInfo: fetchUser()
    .then((user) =&gt; {
      return fetchAccountInfo(user)
    })
})
</pre>

<p class="p">Instead you should stash that promise into a variable and reuse it. Unlike callbacks which can only have one response, promise chains can be forked multiple times at any stage.</p>

<h3 class="h3">Creating New Promises</h3>

<p class="p">Another common issue people run into is manually creating the first promise in the chain. This is typically an anti-pattern and you shouldn’t need to create a promise explicitly to manually call resolve or reject. Here you can see an antipattern where the logic is calling <code class="monospace">new Promise</code>:</p>

<pre class="pre monospace no-wrap">
new Promise((resolve, reject) =&gt; {
  fetchUser().then(resolve).catch(reject)
})
  .then((user) =&gt; {
    // Do something with user
  })
</pre>

<p class="p">Instead you should use the first promise to trigger the chain:</p>

<pre class="pre monospace no-wrap">
fetchUser()
  .then((user) =&gt; {
    // Do something with user
  })
</pre>

<p class="p">This results in cleaner, more concise code. If you are concerned about errors escaping the promise chain before your first async call, you can create a new promise in a few ways. Our recommended way via Bluebird is to use <a href="http://bluebirdjs.com/docs/api/promise.method.html" class="link">Promise.method</a>:</p>

<pre class="pre monospace no-wrap">
var fetchUser = Promise.method((userId) =&gt; {
  if (!userId) {
    throw new Error('User ID required')
  }
  return goFetchUser(userId)
})
</pre>

<p class="p">If you use Promise.method you won’t accidentally miss wrapping errors because you haven’t started the promise chain yet. This will handle the error and reject the promise as expected. Another way to do this is to immediately start the chain:</p>

<pre class="pre monospace no-wrap">
var fetchUser = (userId) =&gt; {
  return Promise.resolve()
    .then(() =&gt; {
      if (!userId) {
        throw new Error('User ID required')
      }
        return goFetchUser(userId)
    })
}
</pre>

<p class="p">Or you can use <a href="http://bluebirdjs.com/docs/api/promise.try.html" class="link">Promise.try</a>:</p>

<pre class="pre monospace no-wrap">
var fetchUser = (userId) =&gt; {
  return Promise.try(() =&gt; {
    if (!userId) {
      throw new Error('User ID required')
    }
    return goFetchUser(userId)
  })
}
</pre>

<p class="p">Our suggestion is to use Promise.method from Bluebird, and use Promise.try when you can’t; like in scenarios when you need logic before starting the promise chain.</p>

<h3 class="h3">Concurrency</h3>

<p class="p">Another common problem that people have is with concurrency and promises. Engineers used to working with callbacks often don’t plan for concurrent requests because it takes more cognitive overhead to make work properly. With promises, helpers exist to make concurrency easy.</p>

<p class="p">I regularly see people thinking that the promise chain should always be linear. In this example, insertUser and insertOrganization don’t need to be run in sequence:</p>

<pre class="pre monospace no-wrap">
createDatabase()
  .then(() =&gt; {
    return insertUser()
  })
  .then(() =&gt; {
    return insertOrganization()
  })
</pre>

<p class="p">insertUser and insertOrganization should be run in parallel after creating the database:</p>

<pre class="pre monospace no-wrap">
createDatabase()
  .then(() =&gt; {
    return Promise.all([insertUser(), insertOrganization()])
  })
</pre>

<p class="p">We used Promise.all to make this work. There are a bunch of utilities that Bluebird provides to do concurrent operations with different logic. Pretty much any array operation you can think of, Bluebird does it with promises out of the box.</p>

<h3 class="h3">Anonymous Functions</h3>

<p class="p">A common anti-pattern is creating anonymous functions. I even did it for clarity in most of the examples above, but I can can clean up my code quite a bit. Let’s use my first example as a demonstration of how this anti-pattern can be cleaned up:</p>

<pre class="pre monospace no-wrap">
var userFetchPromise = fetchUser()
return Promise.props({
  user: userFetchPromise,
  accountInfo: userFetchPromise.then((user) =&gt; {
    return fetchAccountInfo(user)
  })
})
</pre>

<p class="p">This code can be cleaned up and we don’t need to create an anonymous function to make it work:</p>

<pre class="pre monospace no-wrap">
var userFetchPromise = fetchUser()
return Promise.props({
  user: userFetchPromise,
  accountInfo: userFetchPromise.then(fetchAccountInfo)
})
</pre>

<p class="p">If you want to pass a parameter into the method that’s a static value just use <code class="monospace">.bind</code>:</p>

<pre class="pre monospace no-wrap">
fetchUser()
  .then(fetchPlansForUser.bind(this, 'all'))
</pre>

<p class="p">Fully understanding how you can reduce the creation of anonymous functions will make your code easier to read and improve the flow of your application.</p>

<p class="p">These are just a handful of the promise gotchas and a few ways that Bluebird can provide easy ways to get yourself out of them.</p>
