---
layout: post
title: '5 Caveats Before Diving into Reactive Microservices Architecture'
author: sohail_a
category: Engineering
excerpt: 'We have been <a href="/blog/event-driven-microservices-using-rabbitmq">pushing</a> <a href="/blog/lessons-learned-while-building-microservices-part-i">reactive</a> <a href="/blog/embracing-event-driven-microservices">microservices</a> for some time now, but there are some considerations to take note of before taking the plunge. Reactive microservices bring a lot of benefits to the the table, but it comes at a cost. Here are some caveats that you should be aware of as you transition away from monoliths…'
date: 2017-06-26 15:00:00 -0800
---

We have been [pushing](/blog/event-driven-microservices-using-rabbitmq) [reactive](/blog/lessons-learned-while-building-microservices-part-i) [microservices](/blog/embracing-event-driven-microservices) for some time now, but there are some considerations to take note of before taking the plunge. Reactive microservices bring a lot of benefits to the the table, but it comes at a cost. Here are some caveats that you should be aware of as you transition away from monoliths:

### Decoupled Means Decoupled

By design, microservices allow for domain specific functionality to be organized into separate modules. Because of this decoupled nature, tracing functionality across several domain boundaries can be quite difficult. This may be manageable while your team is small and everyone is familiar with the stack, but new developers can have a lot of difficulty grokking the entire system. Even if you track events with [transaction IDs](/blog/debugging-event-driven-microservices), you still may have difficulty understanding the flow of your actions. This is especially evident when you are debugging and pulling your hair out because you cannot find where things went wrong.

### Versioning is More Complex

With more services comes separate code bases and more versioning. A monolith can be simple to track with semantic versioning, but now that you have several microservices, you have to deal with tracking many different versions across your stack. You could version your entire stack with a manifest containing the versions of each component, but it can quickly become annoying when you want to manage releases with a multitude of services.

### Documentation is Key

Along with keeping a manifest of your stack, you really need to document your architecture hierarchy. Now that your stack is decoupled, finding specific functionality can really be a hunt. A simple diagram can go a long way to help your fellow developers, but if you have a complex stack, your diagrams can become very convoluted.

### Event Changes Must Be Propagated

One of the benefits of reactive microservices is that you can develop without knowledge of your other services. But changes to an event or its schema can cause unexpected issues when consuming events downstream. For example, if you need additional information to perform a job and modify your job schema to add new flags, you can end up with a situation where other consumers begin to fail. By modifying the schema of the event, you may need to trace down other consumers and ensure that your changes won’t break things downstream. Yet another reason for having good documentation on your stack hierarchy.

### Testing is Not So Straightforward

Now that all of your application does not live in a monolith, you will need to consider additional factors when running tests. Integration testing may involve several microservices that need to publish or consume events to perform certain duties. Docker Compose makes standing up these test environments easy, but you will need to make sure to include all of the services needed for testing that portion of your stack. In addition, you will need to coordinate the versioning of the subsequent services in order to test your desired functionality.

### Worth the Growing Pains

All in all, the downsides are really not strong enough to deter you from breaking up your monolith. Even though there are some growing pains associated with microservices, it can really help you scale in the future. Up-to-date documentation and [architecture diagrams](http://naildrivin5.com/blog/2016/12/08/learn-graphviz-and-up-your-diagramming-game.html) are always important, especially for onboarding, but can also help when investigating issues. [Following best practices](https://dzone.com/articles/best-practices-for-tracing-and-debugging-microserv) will pay dividends in the future when the complexity of your application increases and issues arise. Luckily, much of the industry is moving in this direction, so you are not alone. Good luck!
