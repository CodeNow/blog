---
layout: post
title: 'Runnable is now GA: Staging environments and microservices don’t mix.'
author: yash_k
category: Announcements
excerpt: 'I’m excited to announce Runnable is now generally available. Runnable makes developing container-based applications a lot faster and easier.<br><br>Since we started in 2013, our vision has remained the same — make it easy for anyone to run code without worrying about infrastructure. As software teams around the globe adopt containers and microservices, we think the time is finally right for Runnable.'
legacy_url: http://blog.runnable.com/post/150655663306/runnable-is-now-ga-staging-environments-and
---

I’m excited to announce Runnable is now generally available. Runnable makes developing container-based applications a lot faster and easier.

Since we started in 2013, our vision has remained the same — make it easy for anyone to run code without worrying about infrastructure. As software teams around the globe adopt containers and microservices, we think the time is finally right for Runnable.

### Your staging server is the problem.

Containers and microservices let teams split up their applications into a lot of small pieces. This allows developers to build and operate parts of their application independently, and in parallel. But before someone can ship their code, they have to make sure it works with the rest of the application.

So teams rely on the staging environment. But it’s easy to break this environment by deploying buggy code, which happens often. It’s also easy to break the database with a schema change or a migration. Since a staging environment is a shared environment, it can be noisy as multiple developers try to reproduce issues or wait in line for someone else to finish up.

The staging server creates a bottleneck and a lot of frustration. It doesn’t scale in the world of containers. In fact, we think staging environments and microservices don’t mix.

### Runnable has a simple solution.

To be able to build and operate parts of your application independently, you need the ability to integrate and test these parts independently as well.

Our idea is simple: whenever a developer creates a new git branch for their feature or hotfix, they get a full-stack environment on-demand. They can use this environment to test and integrate their code without being bottlenecked on a central staging environment. They can run end-to-end Selenium tests anytime, and share their progress with a PM, QA person or another developer.

Environments on Runnable are always available and up-to-date with the latest code changes. You can spin up as many environments as your team needs at [a low, predictable cost](/pricing/).

### Check it out today.

Runnable is generally available as of today with a 14-day free trial. All new signups before September 30th are eligible for a 25% discount. [Try it out for yourself](/signup/).
