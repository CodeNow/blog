---
layout: post
title: Libraries We Use When Building Microservices
author: anton_p
category: Engineering
excerpt: 'Like any other generic solution, the microservices architecture has its tradeoffs; some things become easier and some become harder. When switching to microservices, one of the most common challenges is the question of where to put shared code.'
legacy_url: http://blog.runnable.com/post/147612899961/libraries-we-use-when-building-microservices
---

<p class="p">Like any other generic solution, the microservices architecture has its tradeoffs; some things become easier and some become harder. When switching to microservices, one of the most common challenges is the question of where to put shared code.</p>

<p class="p">At first, it’s tempting to pull out all common code into separate libraries. The reasoning is simple: in programming we try to avoid code duplications. If you have the same code in two different files, you would usually try to extract it into a new function in a new file, so why not do the same on a higher level?</p>

<p class="p">It’s not as simple as that. Shared libraries introduce hard dependencies between microservices, so they should be created with careful thought about the roles they’ll play across your entire set of services. I experienced this challenge first-hand before I joined Runnable.</p>

<p class="p">For example, if you’ve abstracted your domain models in a library and you want to change the model, you would need to update all services that use that library at the same time. This involves updating code, passing reviews, tests, staging, etc. This makes your microservice architecture feel like a monolith.</p>

<p class="p">So, does this mean that we shouldn’t ever use libraries with microservices? Not really. Philipp Hauer explains the exception in <a href="http://blog.philipphauer.de/dont-share-libraries-among-microservices/" class="link">his post</a> about the challenges of shared libraries and microservices:</p>

<blockquote class="blockquote">It’s okay to have libraries for technical concerns (e.g. for logging or monitoring), because it’s not likely for a business requirement to affect these concerns.</blockquote>

<p class="p">This is a very important point. Microservices are usually composed of two categories of code:</p>

<ol class="ol"><li class="li"><p class="p">Domain specific code. This code is specific to the problem that a given service tries to solve; i.e. all your domain models and business logic.</p></li>

<li class="li"><p class="p">Support code (“technical concerns” in Philipp’s words). From my experience, a large part of microservices’ code is support code, so it’s natural that we should dedicate some time thinking about the best way of organizing it.</p></li>
</ol><p class="p">We have several libraries that we use at Runnable. Some were developed in-house, others are third-party code. Those libraries are our building blocks for any new microservices we develop.</p>

<p class="p">Here is the list of those technical concerns with the specific libraries we use:</p>

<ul class="ul"><li class="li"><p class="p">Monitoring (<a href="https://github.com/Runnable/monitor-dog" class="link" target="_blank">monitor dog</a>) — Reports data to Datadog in a normalized way; e.g. prefixing each event with the service name.</p></li>

<li class="li"><p class="p">Error handling (<a href="https://github.com/Runnable/error-cat" class="link" target="_blank">error cat</a>) — Provides a error hierarchy that can be extended by each service and reports errors to Rollbar.</p></li>

<li class="li"><p class="p">Configuration (<a href="https://github.com/Runnable/loadenv" class="link" target="_blank">loadenv</a>) — Ensures that every microservice loads environment variables in the same way.</p></li>

<li class="li"><p class="p">Worker server (<a href="https://github.com/Runnable/ponos" class="link" target="_blank">ponos</a>) — A common worker server with standard monitoring and error reporting built-in.</p></li>

<li class="li"><p class="p">Docker/Swarm client (<a href="https://github.com/Runnable/loki" class="link" target="_blank">loki</a>) — A Docker/Swarm client library with standard monitoring built-in.</p></li>

<li class="li"><p class="p">Validation (<a href="https://github.com/hapijs/joi" class="link" target="_blank">joi</a>) — A validation library for email addresses, dates, etc.</p></li>
</ul><h3 class="h3">Conclusion</h3>

<p class="p">It’s important to be aware of when your code is a bad fit for a library. Here are few general rules of thumb:</p>

<ul class="ul"><li class="li"><p class="p">If it contains business logic or domain-specific code — it shouldn’t be a library.</p></li>

<li class="li"><p class="p">If it changes frequently based on new requirements — it shouldn’t be a library.</p></li>

<li class="li"><p class="p">If it introduces coupling between consumers — it shouldn’t be a library.</p></li>
</ul><p class="p">Otherwise, go for it! Pulling out common code into separate libraries can speed up development of new services by allowing you to focus only on the specific problem your service needs to solve. Plus it can make monitoring, error handling, and managing configurations more consistent across all your modules.</p>
