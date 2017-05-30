---
layout: post
title: 'Runnable Sandboxes: Full-stack environments for every GitHub branch'
author: yash_k
category: Engineering
excerpt: 'Today we’re announcing a new product we’ve been working on for over a year. Visit our <a class="link" href="//runnable.com">homepage</a> to learn more, or read on.'
legacy_url: http://blog.runnable.com/post/141200219146/runnable-sandboxes-full-stack-environments-for
---

<p class="p intro">Today we’re announcing a new product we’ve been working on for over a year. Visit our <a class="link" href="//runnable.com">homepage</a> to learn more, or read on.</p>

<h3 class="h3">What?</h3>

<p class="p">Runnable creates full-stack environments for every branch across all your GitHub repositories. These environments can be used to integrate and test branches end-to-end, before they’re merged into master.</p>

<p class="p">Watch the <a class="link" href="https://youtu.be/mBR-_5dXH4w">90 second video</a> and browse through our <a class="link" href="https://runnable.com/product.html">feature tour</a>.</p>

<h2>Why?</h2>

<p class="p">We believe there are some very good services that help run containers in production, but they don’t do a great job with development and testing. We’re focused on building the best possible developer workflow experience for teams. This includes:</p>

<ol class="ol"><li class="li"><p class="p"><strong class="strong">Deep integration with GitHub</strong> — Your workflow is completely orchestrated by GitHub. So when branches are created or updated, so are their environments on Runnable.</p></li>

<li class="li"><p class="p"><strong class="strong">Fast build/run cycles</strong> — Every GitHub organization on Runnable gets a dedicated fleet of EC2 servers that are scaled up/down based on load, so your builds are never queued. Our scheduler builds and runs containers on the same host, avoiding image transfers and maximising the use of cache. This means environments can be spun up in seconds instead of hours.</p></li>

<li class="li"><p class="p"><strong class="strong">Clone Gigabyte Databases</strong> — Runnable applies Copy-on-Write, not just to app containers, but also to stateful ones like databases and key-value stores. This means you can instantly clone large data sets to test migrations or schema changes.</p></li>

<li class="li"><p class="p"><strong class="strong">Configure once, run many environments</strong> — Every production and staging environment you set up needs to be configured with environment variables, 3rd party services, and database files. This makes setting up multiple test and integration environments hard, even with Docker Compose or Amazon ECS, because each environment has different variables.</p><p class="p">With Runnable, you no longer have to do this. Every branch on Runnable runs in the same sandboxed environment using the same environment variables and 3rd party services. With the help of an HTTP proxy and a dynamic DNS server, we can route traffic to the right set of containers for the branch you want to test.</p></li>

<li class="li"><p class="p"><strong class="strong">End-to-End and Integration tests</strong> — There are lots of services that let you run unit tests across components in your stack. But to run end-to-end tests, you need to merge your code into a development branch or master branch so it can be deployed to a Staging or QA server for testing.</p><p class="p">With Runnable, every branch runs in a full-stack environment, so end-to-end tests can be run anytime during development. This lets your team get faster feedback on when new code is breaking your application.</p></li>

<li class="li"><p class="p"><strong class="strong">Simpler dev environments with our CLI</strong> — As a project gets larger, it’s hard to maintain an up-to-date local environment that includes all your services, components and data.</p><p class="p">With Runnable, teams don’t have to maintain a complex development environment. Developers can pull individual components or services locally and connect to the rest of the stack on Runnable. We provide a CLI that lets you SSH into your containers and sync files straight from your terminal.</p><p class="p">Runnable ensures your stack is always up-to-date and ready to test end-to-end.</p></li>
</ol><h2 class="h2">How?</h2>

<p class="p"><a class="link" href="//runnable.com">Sign up to get started</a>. Each team gets its own dedicated EC2 infrastructure, so we’ll be screening sign-up requests and will activate accounts within 24–48 hours.</p>

<p class="p">Once your account is provisioned, it’s 100% free to use during our preview period. <a class="link" href="/pricing/">Learn more about pricing</a>.</p>

<p class="p">Setting up your sandbox with Runnable is simple. We scan your source code to automatically create Dockerfiles for you. If you’re already using Docker, we can import the Dockerfile into Runnable. <a class="link" href="/docs/">See our docs for more</a>.</p>
