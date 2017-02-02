---
layout: post
title: Lessons Learned While Building Microservices, Part I
author: anton_p
category: Engineering
excerpt: 'The microservices architecture, like any solution, has its <a href="libraries-we-use-when-building-microservices" class="link">tradeoffs</a>. Most have heard the main talking points — the decoupling of components, faster and more frequent deployments, and improved fault tolerance. Over the past couple of years, I’ve observed these first-hand, along with other subtle advantages of the microservices architecture.'
legacy_url: http://blog.runnable.com/post/149676042396/lessons-learned-while-building-microservices-part
---

The microservices architecture, like any solution, has its [tradeoffs](libraries-we-use-when-building-microservices). Most have heard the main talking points — the decoupling of components, faster and more frequent deployments, and improved fault tolerance. Over the past couple of years, I’ve observed these first-hand, along with other subtle advantages of the microservices architecture.

### Migrating API to Node v4

Our API is one of the largest, oldest, and most important services at Runnable. Its lifetime spans several years now, and during this time it’s changed dramatically in size, complexity and scope. It was written in Node 0.10.

After Node 4 was released, we immediately began using it to write new services, and soon after migrated our existing, smaller services as well. Our API wasn’t one of them. It had several dependencies that were incompatible with Node 4. For the past 6 months, several developers have attempted to migrate API, but they all end up stopping due to the amount of work that unravels.

***Lesson #1:** Larger services are more difficult to change.*

Having API running on Node 4 with all of its nice new JavaScript features would have been nice, but that wasn’t enough for us to allocate the engineering time needed to complete the migration.

We use a [couple of libraries](libraries-we-use-when-) almost universally across our microservices. One of them is [Ponos](introducing-ponos-a-rabbitmq-based-worker-server) — our RabbitMQ based worker server. Ponos was rewritten with Node 4 in mind, and used in any services which were also using Node 4.

Recently, we added a very important feature to Ponos: Transaction ID (TID) support, which is an identifier that allows us to track event flows across all of our services. All our new services had TID support immediately, except our most important service, API.

We had 2 options:

1. Backport the TID changes in Ponos to an old branch that supported Node 0.10
2. Upgrade API to Node 4

We bit the bullet and finally upgraded API to Node 4, which gave us the Ponos updates and TID support goodness. We also noticed a significant side-effect: our engineering team felt more productive using ES5, and that resulted in an uplift in morale.

There are a couple of important pieces to call out:

1. Right before we migrated API, 70% of our codebase was already running on Node 4 and had TID support. That happened organically over time.
2. If we had started with a monolithic architecture, we’d still be running Node 0.10, because we never would have been able to justify the work and risk involved in migrating our entire application.

***Lesson #2:** A microservices architecture promotes keeping your technology stack more up-to-date and fresh by allowing your components to evolve organically and independently. Large tasks (like a Node version migration) are naturally split into smaller, more manageable subtasks.*

### Exploring new technologies

Runnable started out with a well-defined technology stack, composed of 5 components (1 monolithic API and 4 smaller services). All used the same code patterns, libraries and style. When you have a monolith, it becomes difficult to experiment with new ideas and patterns because it makes your code inconsistent with other services. Inconsistent code is more difficult to support. Good luck explaining to a new team member why the business logic in one service is implemented differently from similar logic in another service.

This situation shackles your team to your existing architecture and style. And if you can’t experiment, your knowledge and technology stagnates and gets obsolete pretty quickly. You end up using patterns and libraries because you’re used to them, not because they are the best option at this moment. Basically, your team stops improving, and that’s a very dangerous thing.

It didn’t take us long to begin adopting a microservices-based architecture, and that changed this pattern. Our team started **to explore** different libraries and techniques more on their own.

This is how we switched to Promises. Someone just implemented them in a new service they wrote, and showed its advantages to the team. Then Promises were adopted across the team and our services as the standard way to write async code. The same happened with our Node 4 migration, and with our [PostgreSQL usage](think-before-you-mongo). Using PostgreSQL for one of our services allowed us to build some engineering and operation expertise, which led us to choose PostgreSQL for our new user and organizations management service.

***Lesson #3:** Microservices promote trying out new technologies. They enable experimentation with patterns and tools.*

### Conclusion

The examples above help illustrate how a microservices architecture enforces healthy changes in the system. These changes first occur at the bottom (or edges) of the system and, if adopted, naturally propagate to other parts. This is the opposite behavior to monolithic architectures, where decisions are typically made at the top by architects and end up taking weeks, months, or years to promote and deploy throughout.
