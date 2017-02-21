---
layout: post
title: 'Debugging Event-Driven Microservices'
author: ryan_k
category: Engineering
excerpt: '<p class="p">Debugging event-driven microservices can be a nightmare: logging is typically distributed across every service, and the event flow can’t easily be followed through code. This means debugging often involves going code-spelunking; mapping out every event that has been sent and following the chain. But this can yield complicated state diagrams with arrows crossing over themselves as you discover some events can call back up the chain — you can pull your hair out trying to keep all of it in your head.</p><p class="p">The lesson here is that you can’t debug microservices in the same way you’d debug a monolith. But by appending some data to each event, you can start spotting issues more easily:</p>
</p>'
---

Debugging event-driven microservices can be a nightmare: logging is typically distributed across every service, and the event flow can’t easily be followed through code. This means debugging often involves going code-spelunking; mapping out every event that has been sent and following the chain. But this can yield complicated state diagrams with arrows crossing over themselves as you discover some events can call back up the chain — you can pull your hair out trying to keep all of it in your head.

The lesson here is that you can’t debug microservices in the same way you’d debug a monolith. But by appending some data to each event, you can start spotting issues more easily:

- A transaction ID, which is generated from the first event and applied to every subsequent event in the chain.
- The name of the service emitting the event.
- The name of the service consuming the event.

At Runnable we use our open-source task management library, [Ponos](https://github.com/runnable/ponos), to handle this. Now we have everything we need to trace any request from start to finish in our system. To get that information out of the database and into a readable format, we use a tool called [Metabase](http://www.metabase.com/) which gives us a GUI to navigate our databases.

As an example, let’s dig into how this approach helped us debug a particularly nasty bug we had in our architecture. We have a feature that is supposed to automatically update an environment whenever a branch is committed to on GitHub. But we were hearing from users that sometimes this feature would fail and miss a commit. Debugging this issue by manually tracing the event flow would be though; there are several steps that take place (across different services) between a user’s commit and an updated environment.

The debug this issue, we first found the original commit entering the system via [Loggly](https://www.loggly.com/) (our log aggregator), where we store request/response logs for our GitHub endpoint. Using this request hit we found the transaction ID and went to Metabase, where we can get an overview of every event that matches a given transaction ID, sorted chronologically. By comparing this event flow to one where everything worked as it should have, we could identify the issue: the environment never started because the Docker host we were trying to schedule it to had already been filled. From there all it took was a small modification to our scheduling system to address the issue.

Working with microservices often requires a different approach than you’d take with a monolith. Debugging is no exception, but with some smart abstractions and the right tools, you can make sense of even the most complicated architecture.
