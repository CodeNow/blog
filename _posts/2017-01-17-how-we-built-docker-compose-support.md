---
layout: post
title: How We Built Docker Compose Support
author: anand_p
category: Engineering
excerpt: '<p class="p">In <a class="link" href="http://blog.runnable.com/post/150022242931/event-driven-microservices-using-rabbitmq">my previous post</a>, I went over how our event-driven architecture allows us to rapidly ship new features. This post covers how we used this model to ship a new feature: Docker Compose support.</p>

<p class="p">Docker Compose enables our customers to build environments on Runnable using the same configuration they use to deploy to production, staging, or wherever they currently use Docker Compose. The best part? They get this with no additional setup.</p>'
legacy_url: http://blog.runnable.com/post/155985933951/how-we-built-docker-compose-support
---

<p class="p">In <a class="link" href="http://blog.runnable.com/post/150022242931/event-driven-microservices-using-rabbitmq">my previous post</a>, I went over how our event-driven architecture allows us to rapidly ship new features. This post covers how we used this model to ship a new feature: Docker Compose support.</p>

<p class="p">Docker Compose enables our customers to build environments on Runnable using the same configuration they use to deploy to production, staging, or wherever they currently use Docker Compose. The best part? They get this with no additional setup.</p>

<h3 class="h3">Approach</h3>

<p class="p">We broke the implementation of this feature down into two flows:</p>

<ul class="ul"><li class="li"><p class="p"><span class="weight-strong">Importing:</span> Pulling in a team's Compose file and using it to build Runnable environments.</p></li>
<li class="li"><p class="p"><span class="weight-strong">Updating:</span> Applying changes to their environments when a user pushes an update to their Compose file.</p></li>
</ul><h3 class="h3">Implementation</h3>

<p class="p">Runnable configurations consist of a Docker image, a run command, environment variables, and port mappings. At the highest level, we just needed to convert the Compose file to a Runnable configuration via an alternate flow of events and tasks. A ponos-based worker server handled the events and tasks, and a parser, which we lovingly named <a class="link" href="https://github.com/Runnable/octobear">octobear</a>, handled the actual conversion.</p>

<p class="p">When a Compose file is imported from a repository, it triggers the following flow:</p>

<ol class="ol"><li class="li"><p class="p">The <code class="monospace">compose.requested</code> event is emitted to our event-driven system. Our worker server listens for this event and creates the following task:</p></li>
<li class="li"><p class="p"><code class="monospace">compose.parse-config</code> parses the Compose file and emits a <code class="monospace">compose.parsed</code> event.</p></li>
<li class="li"><p class="p">A <code class="monospace">compose.cluster.create</code> task is created from the previous event. Here, we wrap back into our core flow; this task creates a cluster and emits the <code class="monospace">cluster.created</code> event which is also emitted in our core flow.</p></li>
</ol><p class="p">When a Compose file is updated on a repository, it triggers the following flow:</p>

<ol class="ol"><li class="li"><p class="p">We monitor <code class="monospace">github.pushed</code> events to see if any were created from a Compose-configured repository. If so, we emit the following event:</p></li>
<li class="li"><code class="monospace">compose.cluster.pushed</code> checks to see if the Compose file was changed. If not, we simply emit the <code class="monospace">cluster.updated</code> event which continues our core flow. If the Compose file was updated, we emit the following event:</li>
<li class="li"><p class="p"><code class="monospace">compose.cluster.config.updated</code> creates a task called <code class="monospace">compose.cluster.sync</code> to sync our Runnable configuration state with the updated Compose file. Once complete, we loop back into our core flow by emitting <code class="monospace">cluster.updated</code>.</p></li>
</ol><h3 class="h3">Benefits</h3>

<p class="p">Our eventful infrastructure helped us ship Compose support faster and with little risk. We kept our core path untouched and were not tied down to our current application’s deployment cycle. The best part of this architecture is how easily we can expand on it to support other multi-container orchestration frameworks (like <a class="link" href="https://kubernetes.io/">k8s</a>). If you’re looking to create a new architecture plan, consider making it event-driven so you too can create apps at light speed with little risk.</p>
