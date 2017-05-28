---
layout: post
title: 'Promise to Never Callback'
author: damien_h
category: Engineering
excerpt: 'Promises are at least <a href="//runnable.com/blog/5-reasons-why-you-should-be-using-promises">5 kinds of awesome</a>. Functionally they are not all that different from callbacks, but those differences resolve code structure problems caused by the more traditional async library and callback approach. They also change the way we approach development.'
date: 2017-05-29 15:00:00 -0800
---

### Promise to Be Awesome

Promises are at least [5 kinds of awesome](//runnable.com/blog/5-reasons-why-you-should-be-using-promises). Functionally they are not all that different from callbacks, but those differences resolve code structure problems caused by the more traditional async library and callback approach. They also change the way we approach development.

Before promises, I was in callback hell, with layers of nesting and error handling, and taking extra care to not couple disparate units of work. The power of async code would still be there, but it was held back by the increasing complexity of callbacks. Let’s look at a real use case using both callbacks and promises.

I am currently working on a component to create, persist, and consume a set of keys. It also needs to send the public key to a third party. It’s a complicated piece that spans the entire stack, adds two new services, and utilizes multiple third party products in new ways. The high level flow looks like *Jane Requests a New Key* from the web service. The web service then starts the story *API Spawns Create Key Job*. Once the key is spawned we need to invoke the story *Update Jane’s Key List*.

### The Road to Hell

When using callbacks we pass `fetchKeyList` from `requestNewKey` to `spawnCreateKeyJob`; wrapping `fetchKeyList` so `spawnCreateKeyJob` knows how to initialize `fetchKeyList`. Now to structure the callback, `requestNewKey` has to know how its callback will be invoked by `spawnCreateKeyJob`.

We could continue, but at two layers deep, three stories in, and zero code written, we’ve got wrapper functions and coupling between all three stories. It’s already clear what road we are on. Let’s look at how promises fix that, and much more.

### Promise of Ignorance

In an ideal world, any unit of code should be understandable to another developer without special knowledge. It should tell me a story simply by reading it, and I should be able to comprehend it without reading any companion work. To understand the story of *Jane Requests a New Key*, I shouldn’t have to read *API Spawns Create Key Job*, or even have to know the referenced work, *Validate Jane’s Credentials*. Promises let us be ignorant, reading *Jane Creates a New Key* is enough to understand the story!

First we define the use case in more detail. The user triggers `requestNewKey` to create a key, which the UI passes to our API service, which then calls `spawnCreateKeyJob` to generate the new key. Now that we have the new key we need to persist it and send the public key to a third party for future requests. And finally update our UI with `fetchKeyList`. With the narrative defined, let’s start coding the UI.

```javascript
// Controller for requestNewKey
```

<div class="grid-block code-overflow">...</div>

```
let hasPermission = true // Stubbed out permission

function validatePermissions () {
  if (!hasPermission) {
    return updatePermissions()
      .then(permissionsWereUpdated)
  }
  return $q.when()
}

validatePermissions()
  .then(saveKey)
  .then(keyWasAdded)
  .then(fetchKeyList)
  .then(makeKeysPretty)
  .then(sendEmailNotification)
```

And the UI is ready to be used. We have written our story and it doesn’t require any supplemental reading. Not only that but we can critique the entire work! The flow is ready so we can find gaps in our thinking. Promises `permissionsWereUpdated` and `keyWasAdded` have no timeout, so they can cause infinite waits. The value of `hasPermission` should be generated in a reusable manner so it should be a service. We can also determine what referenced stories need to be written; `hasPermission`, `updatePermissions`, `permissionsWereUpdated`, etc. Optimize for parallel functionality by moving `sendEmailNotification` right after `saveKey`; since it only requires the name and can run while we wait for the event. And better prioritizing tasks, both `makeKeysPretty` and `sendEmailNotification` are optional and can be written last.

By remaining ignorant, our code stories are discrete and allow us to fully harness asynchronous programming without turning our code into a Jackson Pollock.

Let’s work on our API story next (this assumes the ThirdParty libraries return promises).

```
// Permission Service used by the UI
```

<div class="grid-block code-overflow">...</div>

```
hasPermission = function() {
  return ThirdPartyOath.getUserPermissions(User.getThirdPartyId())
}
getPermission = function() {
  return ThirdPartyOath.setPermissions(PERMISSIONS.KEY_WRITE)
}

// Manage Keys Service
```

<div class="grid-block code-overflow">...</div>

```
function manageKeys(
  keyService
) {
  saveKey = function() {
    return keyService.spawnCreateKeyJob()
      .then(keyWasCreated)
      .then(ThirdPartyOath.savePublicKey)
      .then(publishEventForUI)
  }

  fetchKeyList = function() {
   return Promise.resolve(keysService)
  }
```

<div class="grid-block code-overflow">...</div>

```
}
```

Repeat the analysis we did for the UI and the API microservice is ready to be consumed!

Within an hour we have several services of our app stubbed out, its logic analyzed, and we can have faith that we have parallelized it as much as possible.

### Promise of Infinite Ignorance

With our code being discrete and ignorant we also enjoy two other benefits: simpler unit testing and full parallel development.

Unit testing is driven by the principle that each unit should be individually testable; this just isn’t the case with callbacks. But if we don’t have to worry about other units of code, our units become true black boxes with the only external interface being inputted data and outputted data.

Parallel development is achieved for the same reasons. A developer working on `spawnCreateKeyJob` doesn’t have to know anything about what’s done with it; it has no connections to the outside world except its input and return. So while Kahn is researching Vault and its permission schemes for `spawnCreateKeyJob`, I can knock out `fetchKeyList`, and Nate can work on `updatePermissions`. The only outside knowledge anyone needs is our agreed upon data structures.

### Promise of Promises

Promises have turned the hell that was forming with callbacks into *Jane Requests a New Key*, then *API Spawns Job*, then *Update Jane’s Key List*. They have also made our code more testable by making our stories “ignorant”. Additionally because of the ignorance of promises, our stories can be written independently of each other. In this case, we had three different developers implementing multiple services simultaneously.

All of this because I made a promise, and promises are awesome!
