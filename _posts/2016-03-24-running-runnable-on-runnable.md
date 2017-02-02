---
layout: post
title: Running Runnable on Runnable
author: forrest_j
category: Engineering
excerpt: 'It’s an exciting time for us. Our team adopted Docker early when building <a>Runnable CodeSnippets</a>, a collaborative place for developer learning. From there we took on the bigger challenge of providing <a class="link" href="/">development and test environments for teams</a>. All while in the backdrop of the <a class="link" href="http://www.zdnet.com/article/what-is-docker-and-why-is-it-so-darn-popular/">growth and early adoption of the container ecosystem</a>.'
legacy_url: http://blog.runnable.com/post/141634984741/running-runnable-on-runnable
---

<p class="p">It’s an exciting time for us. Our team adopted Docker early when building <a>Runnable CodeSnippets</a>, a collaborative place for developer learning. From there we took on the bigger challenge of providing <a class="link" href="/">development and test environments for teams</a>. All while in the backdrop of the <a class="link" href="http://www.zdnet.com/article/what-is-docker-and-why-is-it-so-darn-popular/">growth and early adoption of the container ecosystem</a>.</p>

<h3 class="h3">Reward</h3>

<p class="p">The thing that amazed me the most when coming to Runnable was the ability to quickly test and see all of the services in live environments for Runnable itself. One way to evaluate the power of a platform is its ability to support itself. So we took on the challenge of testing our service in our service.</p>

<p class="p">The challenges have been substantial; however, the empowerment to the team has been huge.</p>

<p class="p">The developers at Runnable want to receive fast feedback from coworkers, not just automation. Instead of managing a slow, painful process on a limited set of staging servers and databases, they get as many as they like.</p>

<h3 class="h3">Workflow</h3>

<p class="p">We follow a simple GitHub workflow with a branch per work item (e.g. bug, feature) and pull requests to the master branch with a peer review. This gets us around a hundred branches, which means we have over 100 different container test environments available to share any time.</p>

<p class="p">Most of those containers are split along over 20 Node.js micro services and our Angular web application. To back that, we use several types of databases including Redis, MongoDB, and Neo4j.</p>

<p class="p">Containers are updated automatically, so developers can make the most of these containers while authoring their changes. It’s as simple as that.</p>

<p class="p">When a branch is ready, the reviewers will look through its PR for gotchas and automation, but they’ll also test the changes in the live environment. This is where they catch issues with redirection, styling, synchronization, page load, third-party integration, etc. Things you need to catch as soon as possible.</p>

<h3 class="h3">Future</h3>

<p class="p">Runnable engineering is committed to using the product. We look forward to sharing our experience and hope you can learn from it in your own development endeavours. You’ll find more blog posts in the coming weeks about all aspects of our engineering.</p>
