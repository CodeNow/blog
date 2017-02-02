---
layout: post
title: How is Runnable Different From CI Solutions?
author: yash_k
category: Engineering
excerpt: 'After Runnable launched last September, we’ve received lots of interest from dev teams looking to improve their development process. One of the questions we often get is, “how does Runnable compare to my current CI solution?”'
legacy_url: http://blog.runnable.com/post/155694013156/how-is-runnable-different-from-ci-solutions
---

<p class="p">After Runnable launched last September, we’ve received lots of interest from dev teams looking to improve their development process. One of the questions we often get is, “how does Runnable compare to my current CI solution?”</p>

<h3 class="h3">Runnable vs Traditional CI Tooling</h3>

<p class="p">To understand how Runnable is different from CI, let’s break down the types of testing or validation you may perform, into two categories:</p>

<table class="table"><thead class="thead"><th class="th"> </th>
<th class="th">High Cadence Tests</th>
<th class="th">Low Cadence Tests</th>
</thead><tbody class="tbody"><tr class="tr"><td class="td">Frequency</td>
      <td class="td">Continuous</td>
      <td class="td">Daily or Weekly</td>
    </tr><tr class="tr"><td class="td">Types of Tests</td>
      <td class="td">
        <ul class="ul"><li class="li">Unit
          </li><li class="li">Functional
          </li><li class="li">Integration / Headless
        </li></ul></td>
      <td class="td">
        <ul class="ul"><li class="li">End-to-End
          </li><li class="li">PM / Design Review
          </li><li class="li">QA Testing
          </li><li class="li">UAT
          </li><li class="li">Penetration Testing
          </li><li class="li">Performance
          </li><li class="li">Chaos Monkey
          </li><li class="li">A/B Testing
          </li><li class="li">Load
        </li></ul></td>
    </tr><tr class="tr"><td class="td">Tooling</td>
      <td class="td">Jenkins, CircleCI, TravisCI, etc.</td>
      <td class="td">Selenium, JMeter, SauceLabs, New Relic, etc.</td>
    </tr></tbody></table><p class="p"><b>High Cadence Tests</b> are typically focused on a single service, so they build and run on lightweight, ephemeral environments continuously throughout development. Fixtures and mocks are added when other services are needed to perform the test.</p>

<p class="p"><b>Low Cadence Tests</b> require a production-like environment to run, usually staging or pre-production. And because most companies have limited number of production-like environments, they can’t run tests in parallel. This forces tests to be batched and run less often, causing a number of problems:</p>

<ol class="ol"><li class="li">
   <b>Attribution becomes hard:</b>
   Since changes are batched, it’s harder to attribute a test failure to a particular developer or code change.
 </li>
 <li class="li">
   <b>Failure becomes costly:</b>
   Because tests are run less often, breaking changes are caught less often. This results in rollbacks and wasted hours.
 </li>
 <li class="li">
   <b>Gating becomes the norm:</b>
   Gating releases is the practice of forcing critical tests to pass before a release can go live. If a code change breaks a critical test, it may block a release (and other changes) for days or weeks - slowing down your business.
 </li>
</ol><p class="p">Runnable aims to let you run all your End-to-End tests continuously. And by doing so, it will help you catch more bugs before merging a code change. Runnable does this by creating production-like environments for every branch. In practical terms, this means we are different from CI in the following ways:</p>

<ol class="ol"><li class="li">
   <b>Persistent Environments:</b>
   Unlike CI where environments are ephemeral, Runnable maintains environments for the lifetime of a branch. This is important because debugging End-to-End tests is hard. You may need to login to the environment, tail logs and modify data or code to identify the cause of a failure. In addition, you may need to collaborate with a PM or another developer to identify issues.<br><br>
   With persistent environments, End-to-End Testing and Review becomes a lot easier.
 </li>
 <li class="li">
   <b>Re-use Docker Compose and Kubernetes Compose:</b>
   With Runnable, you don’t need to create custom Travis or CircleCI YAML files. Container orchestration is here to stay, and simplifies how companies configure their applications. Runnable is container-native, meaning you can easily reproduce how you configure your application in production.
 </li>
 <li class="li">
   <b>Fast Database Replication:</b>
   Runnable provides a dedicated data set for every environment. To do this, we apply Copy-on-Write replication to stateful containers like databases and key-value stores. This means you can instantly clone large data sets to test migrations or schema changes.
 </li>
  <li class="li">
   <b>Elastic Hostnames for APIs and External Services:</b>
   APIs and externals services such as CDNs or Load Balancers present a challenge for CI tools. This is because every CI environment gets a unique hostname. APIs and External Services need to be reconfigured for that hostname for every test run. Environment variables are often tied to a hostname or an environment and also need to be reconfigured. This makes performing exhaustive End-to-End tests difficult.<br><br>
   Runnable solves this problem with Elastic Hostnames. Every environment can share the same hostname and environment variables. With the help of an <a href="elastic-routing-in-runnable" class="link">HTTP proxy and a dynamic DNS server</a>, we can route traffic to the right set of containers for the branch you want to test or validate.
 </li>
  <li class="li">
   <b>Fast Build/Run Cycles:</b>
   Every team on Runnable gets a dedicated fleet of EC2 servers that are automatically scaled based on load, so your builds are never queued. Our scheduler builds and runs containers on the same host, avoiding image transfers and maximizing the use of cache. This means environments can be spun up in seconds instead of hours.
 </li>
  <li class="li">
   <b>Flat Pricing:</b>
   Creating many persistent environments can be expensive, especially if they are running 24x7 like your staging environment. Runnable scales environments based on how your team works, so we can offer an unlimited number of environments for a flat monthly fee.
 </li>
</ol><p class="p">So, while CI focuses on high cadence testing using ephemeral environments, we built Runnable to perform all your End-to-End testing on persistent environments. If a shortage of clean, staging or pre-production environments holds your team back from testing every code change End-to-End, Runnable will make a huge impact on your team’s velocity. <a href="https://runnable.com/signup" class="link">Try Runnable free for two weeks</a> and let us know what you think.</p>
