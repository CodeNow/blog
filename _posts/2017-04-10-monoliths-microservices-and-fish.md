---
layout: post
title: 'Monoliths, Microservices, and Fish'
author: damien_h
category: Engineering
excerpt: 'I recently joined Runnable, a service that’s built on a service and event-driven architecture. Having come from a series of monoliths, it's taken some adjustments, some of which go well beyond simple syntax. Using microservices and events changed the way I think.'
date: 2017-04-10 18:30:00 -0800
---

I recently joined Runnable, a service that’s built on a service and event-driven architecture. Having come from a series of monoliths, it's taken some adjustments, some of which go well beyond simple syntax. Using microservices and events changed the way I think.

### Whale Babel

In traditional monoliths, I used a wide range of communication protocols. The specifics were determined by the implementer, with maybe some input from the consumer. Every group either operated autonomously, or there was coordination and oversight by senior technical staff. Both approaches are problematic. In one case we had multiple protocols; jars, SOAP, and REST all coming from a single team. In another instance it took months and many man hours from our most expensive technical staff to decide small changes.

### Babel Fish

At Runnable we’re running dozens of services; some with entirely different technology stacks. Thanks to a [central communication manager](http://blog.runnable.com/post/150022242931/event-driven-microservices-using-rabbitmq), They all talk to each other without translation and we know when one service speaks or listens. If our user service needs to know when the payment service has processed a user, it tells our communication manager, “hey let me know when the pay service updates a user's billing information”.

### Small Ponds

When working with a monolith, even small projects can get mired in callbacks, configurations, injections, and dependencies. Let’s use updating a credit card as an example. The user edits the credit card date and hits save, then the process credit card modal does its thing. The user profile widget needs to be updated to reflect those changes, so we add a callback to the the credit card modal to start the user profile update. We then discovered we needed to add another callback in the user profile update, to update the org budget configuration. Now we need to change the injected credit card widget… Over the years the glue code piles up and you wind up with a sticky mess.

### Daughter of Babel Fish

Extending the principles of event-driven communication to our intra-service communication allows us to avoid the mess that is glue code. Each individual set of functionality does its thing and only its thing, If the pay modal closing impacts the billing status, all the modal publishes is its completion event. It’s up to the billing status to listen and do its own thing. There are no callbacks, no configurations, no dependencies.

### Lonely Fish

One thing managers like to talk about is code ownership; this sounds easy, but never is in a monolith. The boundaries between pieces of functionality blur as communications are wired in to external functionality. On a project I worked on, the reports team broke the job scheduler because they were both using the same UI widget, and the reports team fixed a bug that job scheduler considered a feature. Not so easy, right? Code ownership was just never resolved.

### Schools of Fish

With the atomic nature of our components, we not only have well-defined things that a single developer can own, but groups of things that can be owned. Currently, I own a couple of related popovers we’re adding in, as well as the entry points for activating them. I don’t own the nav that those entry points plug into. It’s okay though, because I can just listen for when the underlying data changes. I don’t care who changes it, just that the communication manager tells me it’s changed.

### Something Smells Fishy

In monoliths, if the user sees an error, we often started debugging from the UI down. There was some logging at the interface points, but it was often incomplete. Making matters more difficult was resource allocation; why should the db team allocate man hours to troubleshooting something that, at first glance, looks like a UI issue? Even when teams worked together it would take a developer from each layer to find where the smell was coming from.

### Ocean Breeze

With Runnable’s central approach, tracking down bad smells becomes much easier. Our communication manager logs everything and its primary concern is the communication life cycle. With one place for all communication, we do a better job logging the communication details for both the consumer and producer, and only need to allocate a single person to find the smell.

### Who Needs Fish?

None of these shifts necessarily require microservices or event-driven communication. You can have an approval board, documentation, registries, etc., but they all cost time and energy. With a microservice event-driven architecture, they are baked into how you code. You will speak one language, and you will like it.

Gone Fishing,
Damien
