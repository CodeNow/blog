---
layout: post
title: Cost-efficient container scheduling with Docker Swarm
author: anand_p
category: Engineering
excerpt: 'We run hundreds of thousands of containers across hundreds of servers a day. One of the biggest challenges we face is how to efficiently schedule containers. In this sense, scheduling is managing the allocation of containers to a set of servers in order to keep things running smoothly. Because the containers we schedule are components of our customers’ applications, we have to schedule them with no prior knowledge of their performance characteristics.'
legacy_url: http://blog.runnable.com/post/147970274996/cost-efficient-container-scheduling-with-docker
---

<p class="p">We run hundreds of thousands of containers across hundreds of servers a day. One of the biggest challenges we face is how to efficiently schedule containers. In this sense, scheduling is managing the allocation of containers to a set of servers in order to keep things running smoothly. Because the containers we schedule are components of our customers’ applications, we have to schedule them with no prior knowledge of their performance characteristics.</p>

<p class="p">Poor scheduling methods lead to one of two possible outcomes:</p>

<ol class="ol"><li class="li"><p class="p">Over-provisioning of resources — which means higher costs for us.</p></li>
<li class="li">

<p class="p">Under-provisioning of resources — which means poor stability for our users.</p></li></ol>

<p class="p">It’s important for us to get this right so we can provide the best experience for our users in a cost-efficient way.</p>

<h3 class="h3">Random</h3>

<p class="p">Initially, we used the same scheduling method we used in our <a href="http://code.runnable.com" class="link">original product</a>. This method (which was before the existence of Docker Swarm) did not constrain containers in any way and simply picked a server at random.</p>

<p class="p">However, running full stack environments is a whole different beast than running code snippets — we saw very quickly that this solution was not ideal. Our servers were frequently on fire due to CPU overloading, and we constantly fought with “out of memory” errors.</p>

<h3 class="h3">Hard Limits</h3>

<p class="p">We put our heads together and defined what we needed in a new scheduler. We knew we couldn’t randomly pick servers anymore; we needed something that could constrain resources, and ideally something that would be easy to deploy.</p>

<p class="p">Luckily, Docker Swarm had all these qualities right out of the box, and it had recently become production-ready. We used the <a href="https://docs.docker.com/swarm/scheduler/strategy/#/spread-strategy-example" class="link">spread</a> scheduling strategy to reduce the number of containers lost during server failures. We also set affinities based on images so that similar containers ran on the same boxes.</p>

<p class="p">We used <a href="http://docs.datadoghq.com/integrations/docker/" class="link">Datadog’s Docker integration</a> to look more closely at how our containers were using resources. Datadog contained all the data we needed to figure out RAM/CPU usage per container, and disk usage per server.</p>

<p class="p">Using this data, we found that RAM was the limiting factor (not CPU or disk), so we decided to use hard memory limits to schedule our containers. We looked at the memory distribution from Datadog and set our hard limit at the 99th percentile, at 1GB. We still had the ability to manually override this limit on a per-container basis.</p>

<img src="https://s3-us-west-1.amazonaws.com/runnable-design/scheduling-1.png" class="img post-graphic" width="750" height="514" alt="image">

<p class="p">This method worked great! We no longer saw our servers running out of memory, or crawling due to being overloaded.</p>

<h3 class="h3">Soft Limits</h3>

<p class="p">After a while of enjoying this newfound stability, we noticed that we were vastly over-provisioning our servers. The real RAM usage of most containers was far lower than the 1GB hard limit we had set, which meant we that we were paying for much more than we are actually using.</p>

<p class="p">We wanted to be more efficient, but without losing stability. Lowering the hard limit was not an option because apps that needed the memory would crash due to the constraint.</p>

<p class="p">We needed a way to schedule based on an estimated limit that could still be exceeded when necessary. Thankfully, Docker provides a <code class="monospace"><a href="https://docs.docker.com/engine/reference/run/#user-memory-constraints" class="link">--memory-reservation</a></code> option which sets soft memory limits. When a soft limit is set, the container is free to use as much memory as it needs, but Docker will attempt to shrink its consumption back to the soft limit when there is memory contention on the server. Scheduling based on soft limits would reduce our waste, and setting a hard limit would stop runaway processes. However, Swarm did not have this functionality, so it was time to get our hands dirty in some GOlang.</p>

<p class="p">We forked Swarm and built a <a href="https://github.com/CodeNow/swarm/pull/2/files" class="link">custom version</a> that schedules with memory reservation instead of a hard memory limit. Once again using the data we collected in Datadog, we picked the ideal soft limit based on probability and set the hard limit to the max we’ve seen a container use. This method reduced our waste significantly without hurting stability.</p>

<img src="https://s3-us-west-1.amazonaws.com/runnable-design/scheduling-2.png" class="img post-graphic" width="750" height="514" alt="image">

<h3 class="h3">Dynamic Limits and Beyond</h3>

<p class="p">Among all the cool features in the Docker 1.12.0 release is the ability to schedule with soft limits built in! Although it is still in release candidate we have experimented with it and can use its soft limit scheduling out of the box with <code class="monospace">docker service create --reserve-memory &lt;SOFT_LIMIT&gt;</code></p>

<p class="p">Given the success of the soft memory limits, our next step is to dynamically pick hard and soft limits per container. Since we have all the data piped to Datadog, we can run a query and come up with an ideal soft and hard limit that keeps containers stable without burning cash. Stay tuned to the blog and we’ll let you know the results when we have them!</p>
