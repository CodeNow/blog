---
layout: post
title: Event-driven Microservices Using RabbitMQ
author: anand_p
category: Engineering
excerpt: 'Using the right patterns to communicate between microservices can help scale your application and solve most distributed systems problems. We started with direct HTTP calls for all communication, but decided to move to an event-driven system. This system changed the way we thought about interactions between services, forced scalable patterns, and increased our resilience.<br><br>We moved to using events over traditional HTTP communication for a few reasons. First, it forced decoupling of services. From our experience with HTTP, one service would make calls to every service it needed to, and that meant the original service would need a client library for every service it communicated with. The client library would ensure errors would not stop or block functionality, and would be consistent with each service.'
---

Using the right patterns to communicate between microservices can help scale your application and solve most distributed systems problems. We started with direct HTTP calls for all communication, but decided to move to an event-driven system. This system changed the way we thought about interactions between services, forced scalable patterns, and increased our resilience.

We moved to using events over traditional HTTP communication for a few reasons. First, it forced decoupling of services. From our experience with HTTP, one service would make calls to every service it needed to, and that meant the original service would need a client library for every service it communicated with. The client library would ensure errors would not stop or block functionality, and would be consistent with each service.

As we scaled out to 20+ services, maintaining client libraries became a long, arduous process. New services that replaced older functionality would require an update to all dependencies. This made the development and deployment process longer and more error prone due to all the moving parts.

Another benefit to using events is that services no longer need to orchestrate functionality, removing direct calls to clients. Services can come in and out of existence without having to update client libraries or add new HTTP calls. We can rapidly deploy prototype applications which listen to events, without worrying about them bringing the entire system down.

Third, this change allowed us to implement global patterns. We added rate limits and timeouts to each worker without having to implement them in each of our different client libraries (GitHub, AWS, internal services, etc). We were also able to easily implement a [circuit breaker](https://en.wikipedia.org/wiki/Circuit_breaker_design_pattern) pattern by cutting off the listener of an event until it was healthy again. Only the worker needed to change, not all the callers of the service.

Finally, we are not limited to holding an open HTTP connection for long running workers (which can be disconnected or limited due to open sockets, etc).

### Events and Tasks

There are two different patterns that make up our event driven system: events and tasks.

*Events* are notifications that tell subscribed applications when something has happened. Applications subscribe to certain events and respond by creating tasks for themselves. Events should never modify state directly.

*Tasks* are actions which modify state. The only thing that can create a task for a given application is the application itself. This way, applications cannot directly modify each other‘s states.

Strict naming conventions help us maintain consistency and clarity when it comes to naming events and tasks. Tasks start with the application name to ensure they‘re only handled by the intended application. Next comes the model whose state is to be modified by the task, followed by a descriptive *present-tense* verb. An example of a task would be `api.user.authorize`. Based on the convention we know this task is handled by the `api` service, and it wants to perform an `authorize` on a `user` object.

Events have no application name because they can be subscribed to by multiple applications. They start with the model, and end with a *past-tense* verb that describes what has happened. An example of an event would be `user.authorized`.

Having our application broken up into tasks and events has forced us to change the way we think. Before, if we wanted to send an email after we received a payment we would just add a [SendGrid](https://sendgrid.com/docs/API_Reference/Web_API_v3/Mail/index.html) call to our payments service. Simple and straightforward.

But with our new event system, our payment service emits an event `org.payment.processed`. Our email service, Pheidi, then picks up that event and creates a task: `pheidi.email.send`. We now need to think in terms of reactions instead of commands. If we need additional data that was not provided in the event (registered name on the credit card, for example), we still use an HTTP call to our billing service.

There are some cons that come along with the benefits of an events-based approach. Since you do not explicitly call a service, you can’t know for sure what the response will be to the event you emitted. This makes debugging difficult, because the system is more complex and harder to understand.

### Implementation

We use RabbitMQ as our messaging system. It‘s responsible for distributing events to the services that listen for them. Tasks also go through RabbitMQ so it can balance load across multiple instances of an application. We picked RabbitMQ because it was easy to deploy and has a [NPM client module](https://www.npmjs.com/package/amqplib) ready for us to use.

<img src="https://s3-us-west-1.amazonaws.com/runnable-design/tasks-and-events.png" class="post-graphic" width="779" height="420" alt="image">

We created [Ponos](https://github.com/Runnable/ponos) to be our uniform worker server to interact with RabbitMQ. Here are some patterns we use to handle our queues.

#### Exponential Backoff

From the start we added exponential backoff per job. If a job threw a retriable error, it would retry after a delay. Each job is started with a minimum time delay and is doubled until it reaches a predefined max limit (or to infinity if no limit is defined).

Initially, we wanted jobs to retry forever, thinking if something was “stuck” our alert systems would fire and one of us would go save the day. This worked well initially, but as we added more jobs, the number of items “stuck” in the queue grew for various reasons.

#### Max Retry Limit & Recovery Function

To combat the growing queues, we added a max retry limit to each queue. If the job retried a given number of times, we would stop it from retrying and run a recovery function. The recovery function logged and updated the database with an error. Now our alert systems will trigger on the recovery functions, enabling us to prioritize fixing the issues instead of having our queues back up. We found it better to fail fast and show our users errors instead of having them wait a long time for something to happen.

#### Prefetch

Prefetch is an important option to set on a RabbitMQ channel. Without this, your worker will take all available jobs in the queue. For example, if your application  experienced a spike in load and enqueued 10,000 jobs, all 10,000 jobs would be sent to the worker and become stored in memory, which would typically cause it to crash. Prefetch limits the amount of jobs your worker will hold in memory. This [blog post](https://www.rabbitmq.com/blog/2012/05/11/some-queuing-theory-throughput-latency-and-bandwidth/) from RabbitMQ helped us determine the best way to implement prefetch.

#### Exchanges and Queues

To implement events and tasks, we use the following RabbitMQ constructs. Tasks use a single queue with the `sendToQueue` API. Since tasks are only to be used by one application, we do not create an exchange for them. Events are a bit more complicated to set up. The publisher of an event creates a fanout exchange and each subscriber will create and bind a queue to that exchange. This allows any application to receive any event without affecting other applications.

#### Transaction IDs

One thing that has helped us debug and provide introspection into our event system are Transaction IDs (TID). Each job we send out to RabbitMQ is prepended with a TID. If this job was the result of an event or task, then it uses the same TID. If the job isn’t created from an event or task, we generate a new TID. This helps us track which events causes which tasks to run.

Our event-driven system has sped up our development, made us more resilient to failures, and has improved our product’s responsiveness for our users. We hope these techniques will help your product scale as well.
