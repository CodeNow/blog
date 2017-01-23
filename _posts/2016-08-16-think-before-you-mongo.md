---
layout: post
title: Think Before You Mongo
author: nathan_m
category: Engineering
excerpt: 'I believe choosing the right database for your application is an even more important decision than choosing your programing language. Picking the wrong database can really hurt you down the road.<br><br>MongoDB is the go-to database for many NodeJS applications. It has its uses, but despite the hype, it’s probably not the best choice for your application’s main database. Many people choose Mongo for the same reason we did: its schema-less design makes it simple to set up. This enabled us to focus on quickly building out our MVP. But if you take this path, beware that you may be charging a large sum to your tech-debt card.'
legacy_url: http://blog.runnable.com/post/149000201856/think-before-you-mongo
---

I believe choosing the right database for your application is an even more important decision than choosing your programing language. Picking the wrong database can really hurt you down the road.

MongoDB is the go-to database for many NodeJS applications. It has its uses, but despite the hype, it’s probably not the best choice for your application’s main database. Many people choose Mongo for the same reason we did: its schema-less design makes it simple to set up. This enabled us to focus on quickly building out our MVP. But if you take this path, beware that you may be charging a large sum to your tech-debt card.

We learned this the hard way. For example, we noticed some of our models weren’t being updated. We were optimizing Runnable’s build speeds by reusing pre-built images when possible. This changed our one-to-one mapping of builds to containers into a one-to-many mapping. Since we were using Mongo to store this mapping, we had to modify our code so that every update to a shared doc caused an updated to any related collections as well.

Going forward with this approach inevitably caused some collection updates to fall through the cracks. It was a nightmare. Our workaround was to make the shared model its own doc, and give the docs its ID. We essentially created a relational model, which went against what Mongo is all about. It fought us the whole way.

The moral of this story: think before you use Mongo. Here are some other points you should consider when shopping around for a database:

* Do you foresee your application updating several different tables/docs in a single route/call?
* Do your app need atomicity in multiple writes?
* Is your app storing/using data that needs to be normalized?
* Will your models grow to have many-to-many relationships?

If you answered "yes" to any of these questions, Mongo may not be a good long-term choice for your main database.

Don’t get me wrong, MongoDB and other NoSQL databases have their uses. It’s a great choice for the following:

* Storing large (16MB) documents
* Storing data with a high amount of variance
* Performing real-time analytics on blobs of data
* Building an MVP on a super-tight schedule (early-stage apps, school projects, hackathons, etc.)

We’ve lived and we’ve learned, and now we’re in the process of migrating from MongoDB to PostgreSQL. Our microservice architecture makes this easier to do slowly with lots of fault tolerance, but it’s still not fun.

So unless you’re in a time crunch, or just don’t plan to be around very long, spend some time looking at other options. Sure, they can seem daunting, but you know what else is daunting? Having to migrate your database.
