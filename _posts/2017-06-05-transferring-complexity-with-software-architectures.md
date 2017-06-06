---
layout: post
title: 'Transferring Complexity with Software Architectures'
author: anton_p
category: Engineering
excerpt: '<p class="p">Different architectures and patterns are all about different tradeoffs. More specifically, they’re about <em>transferring</em> and <em>transforming</em> complexity from one place to another, and from one type into another. The same is of course true about the event-driven architecture that we use here at Runnable.</p><p class="p">Let’s dive into where event-driven architecture reduces complexity and where it makes things more difficult. <em>Warning: lots of code ahead.</em></p>'
date: 2017-06-05 15:00:00 -0800
---

Different architectures and patterns are all about different tradeoffs. More specifically, they’re about *transferring* and *transforming* complexity from one place to another, and from one type into another. The same is of course true about the event-driven architecture that we use.

Let’s dive into where event-driven architecture reduces complexity and where it makes things more difficult. *Warning: lots of code ahead.*

### Use Case

Let’s say you are building a platform like Runnable from scratch. Your app allows users to create and run containers based on Docker. Containers should be single-tenant (isolated per customer organization) and they should be able to communicate with each other inside the org.

In your app, a user would need to specify an instance name, a base Docker image, some environment variables, etc. All this data will be passed to your backend.

### Initial Implementation

On the backend for your MVP, you might write logic like this:

```javascript
const instance = db.saveInstanceData(data)
const host = orchestrator.createHostIfNeeded(data)
const networkData = network.setupNetworkIfNeeded(data)
const image = docker.buildImage(data, host)
const build = db.saveBuildData(data, image, host)
const dockerContainer = docker.createAndRunContainer(data, build)
const container = db.saveContainerData(data, dockerContainer, instance)
const containerIP = network.attachContainerToNetwork(networkData, container)
const networkData = db.saveNetworkData(container, ip)
sendNotifications(data, instance, container)
```

This approach is simple on the surface, but it achieves this by transferring complexity to other problems. One of the main issues is handling errors. Please spend some time investigating this new code which has error handling implemented (it’s quite long!).

<script src="https://gist.github.com/podviaznikov/a66e26b08209336b1da798b2ef213f73.js"></script>

### Initial Problems

So instead of 10 lines of code, now we have over 80 lines in the same function. The amount of code is not even the main problem; there are a few bigger ones:

- *Complexity* which arises from the fact that we need to do different things in case of different errors. E.g. when we are trying to handle a [network creation error](https://gist.github.com/podviaznikov/a66e26b08209336b1da798b2ef213f73#file-error-handling-js-L45) we also want to [delete the created host](https://gist.github.com/podviaznikov/a66e26b08209336b1da798b2ef213f73#file-error-handling-js-L48), because we don’t want to have a machine around that wasn’t properly set up. And when we [failed to save the new IP address](https://gist.github.com/podviaznikov/a66e26b08209336b1da798b2ef213f73#file-error-handling-js-L33) of the container into the DB, we want to [revert the network change and delete the running container](https://gist.github.com/podviaznikov/a66e26b08209336b1da798b2ef213f73#file-error-handling-js-L92) in order to prevent wasting resources. And what do you do when your rollback functionality in the error handler fails? If you wanted to delete a host or container and it failed, do you retry one more time?
- *Cost of errors*. In this setup, we have one critical path. All code exists in that path. If we want to add a new notification provider, that code would also leave in the same path, and it would have the potential to break the core flow for a running container.
- *Expertise demand*. Dealing with complex code requires high expertise and code familiarity. If you are working on notifications functionality, you also need to be very familiar with the whole core flow and understand each case of the error handling in that path.

There are different solutions to these problems of course. We went with adopting an event-driven architecture. It’s changed (we can argue that it’s simplified) our problems with error-handling and provided a [framework](https://runnable.com/blog/event-driven-microservices-using-rabbitmq) to handle retries and timeouts in a declarative way.

### New Implementation

In an event-driven architecture, the code above would be split across separate workers that would handle errors independently from the whole flow context.

    onContainerDataSaved = function (container) {
      let networkData
      try {
        networkData = network.fetchNetworkData()
        network.attachContainerToNetwork(networkData, container)
        websockets.sendErrorToClients("Cannot attach container to the network")
      } catch (err) {
        if (err instanceof NetworkAttachError) {
          messageBus.emit('network.attach.failed', { container, networkData })
        }
      }
    }

    // we can set in configuration the retry policy for such worker: exponential back-off, timeout, max number of retries etc,
    onNetworkAttachFailed = function (container, networkData) {
      docker.removeContainer(container)
    }

This is cleaner, more scalable in terms of development, and uses less mental energy when thinking about programming error cases. It also has fewer effects when bugs are deployed to production.

### New Problems

This solution addresses the complexity with error handling states above but creates new complexity in the following areas:

- It takes longer to develop and deploy initially because you need to have the framework in place, deployment infrastructure, etc.
- Sometimes each worker would have some additional code that wasn’t in the original synchronous implementation. E.g. in order to ensure idempotency, we would need to re-fetch some additional data or use conditional updates.
- It can be tricky to propagate an error from the microservice in which it occured up to the user who initiated the action.

The first two problems are well understood. The last problem is less obvious. This problem is discussed in the paper [Exception Handling in an Event-Driven System](https://www.academia.edu/27326556/Exception_Handling_in_an_Event-Driven_System) by Jan Ploski and Wilhelm Hasselbring. The problem arises when you replace a request/response or RPC communication mechanism with an asynchronous one. This problem is not trivial, but it’s solvable in the architecture we have. In general, it’s very similar to the debugging process of event-based systems that we covered in [Debugging Event-Driven Microservices](https://runnable.com/blog/debugging-event-driven-microservices).

### Conclusion

For us, switching to an event-driven architecture solved old problems with the complexity and difficulty of error-handling and created new ones that we found more manageable. Your case might be entirely different, so pick the architecture that suits your problem domain, team, and budget.
