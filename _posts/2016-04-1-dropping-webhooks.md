---
layout: post
title: Dropping Webhooks
author: ryan_r
category: Engineering
excerpt: 'Auto-deploy is a really important feature of our product here at Runnable. It takes the tedium out of managing multiple testing and development environments. Via a <a class="link" href="https://developer.github.com/webhooks/" target="_blank">GitHub webhook</a>, we listen to push events that occur on our customers’ repositories and automatically deploy the changes to the Runnable Sandbox application.<br><br>A few weeks ago I ran into a situation that was rather troubling: a new branch I created didn’t show up in the app. Wondering if I had accidentally botched the command, I rechecked my terminal and confirmed that I had successfully pushed the branch to GitHub. A bit puzzled by the state of things, I decided to dig in and investigate the problem.'
legacy_url: http://blog.runnable.com/post/142092495506/dropping-webhooks
---

<p class="p">Auto-deploy is a really important feature of our product here at Runnable. It takes the tedium out of managing multiple testing and development environments. Via a <a class="link" href="https://developer.github.com/webhooks/" target="_blank">GitHub webhook</a>, we listen to push events that occur on our customers’ repositories and automatically deploy the changes to the Runnable Sandbox application.</p>

<p class="p">A few weeks ago I ran into a situation that was rather troubling: a new branch I created didn’t show up in the app. Wondering if I had accidentally botched the command, I rechecked my terminal and confirmed that I had successfully pushed the branch to GitHub. A bit puzzled by the state of things, I decided to dig in and investigate the problem.</p>

<p class="p">Starting with the webhook history in GitHub, I found that our API had responded to webhook handler with a 500 error. This was a bit odd since logic that handles webhooks is relatively straightforward and not prone to falling over. Still not fully grokking what had happened, I surfed over to our ops dashboards to see if anything was afoot during the time of the push. The graphs showed that the API was under unusually heavy load during the time. The API must have choked due to resource constraints and my push event was lost.</p>

<p class="p">Noting that this was a pretty serious consistency problem, I talked the situation over with some of the other members on the team. One person said we should simply add more API instances to more evenly distribute the load. Another suggested that we take on the arduous task of factoring the webhook handling out of API completely. Yet another questioned if it was really all that important, since the existing implementation did work most of the time.</p>

<p class="p">First, I considered if we should should scale-out the API, but that solution was subpar because no matter how far we scaled the system out it would eventually buckle and we’d lose push events. Next, I thought about factoring out the webhook functionality completely. Given enough time I would have loved to gone this route, but it would take quite a while and the currently implementation was working (albeit with minor hiccups). Finally, I mulled over the easiest tactic: doing nothing. This was not ideal because a single missed webhook could cause a lot of confusion for our customers.</p>

<p class="p">While all fine ideas, none of the proposed solutions directly addressed the problem of losing push events. It seemed that what we needed was a thin persistence layer where the webhooks could “chillax” if the API didn’t have the resources to immediately handle them. After reviewing <a class="link" href="https://developer.github.com/guides/best-practices-for-integrators/#favor-asynchronous-work-over-synchronous" target="_blank">GitHub’s best practices article</a> the solution became crystal clear. What we needed was a fire-and-forget worker microservice to support the API when it was overloaded.</p>

<p class="p">Since we already use RabbitMQ internally the design of the new service was relatively straightforward. It would consist of exactly two parts:</p>

<ol class="ol"><li class="li"><p class="p">An HTTP server that listened for GitHub webhook events and enqueued jobs</p></li>

<li class="li"><p class="p">A worker server that dequeued jobs, deferred the logic to the API, and retried if something went wrong</p></li></ol>

<img class="img img-wide hidden-xs post-graphic" src="http://static.tumblr.com/b89zjri/zoWo55850/drake-wide.png" width="920" height="600" alt="image">

<img class="img visible-xs post-graphic" src="http://static.tumblr.com/b89zjri/aAso55859/drake-tall.png" alt="image" width="720" height="960">

<p>I was very pleased with the solution. First, we didn’t have to undertake a large and lengthy refactor of an existing implementation. Second, we weren’t going to be arbitrarily scaling the API to handle a simple corner-case. And finally, it gave a us a place to start if we wanted to move the logic out of the API.</p>

<p>But what I loved most about the solution is that it was dead simple. Start to finish the project only took four days. This included 100% test coverage, sanity checking, code review, migrating existing webhooks, and the final production deploy.</p>

<p>We’ve been running the project, affectionately named “Drake” <a href="#footnote-1" id="footnote-1-source" class="link strong">[1]</a>, for the last couple weeks and have seen some great results. Auto-deploys across all customer sandboxes have been much more consistent with zero dropped push events. Because we decoupled the entrypoint and isolated the error handling, we’ve uncovered a few quirks of API logic that were once hidden in a sea of logs. And finally, due to the exponential backoff scheme employed by our <a class="link" href="https://www.npmjs.com/package/ponos" target="_blank">worker server library</a>, we’ve even seen a slight drop in API resource usage.</p>

<p>My main takeaway from the whole process was that even though the big solutions held a lot of appeal, sometimes all one needs is something simple. And I’ll take simple elegance over debt inducing complexity any day of the week.</p>

<p class="footnote"><a id="footnote-1" href="#footnote-1-source" class="link strong">1:</a> Six-degrees of naming projects at Runnable: Webhook to Hook, to Captain hook, to Pirates, to Sir Francis Drake, and finally to Drake. Its deploy song? You guessed it: <a class="link" href="https://www.youtube.com/watch?v=uxpDa-c-4Mc" target="_blank">Hotline Bling</a>.</p>
