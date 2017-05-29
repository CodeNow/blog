---
layout: post
title: Embracing Event-Driven Microservices
author: sohail_a
category: Engineering
excerpt: 'A few months ago, <a href="/blog/event-driven-microservices-using-rabbitmq" class="link">Anand discussed</a> the benefits of transitioning from traditional HTTP communication to event-driven microservices. He noted how this transition decoupled our services, forced scalable patterns, and increased our resilience. Here, we’ll detail the lessons we learned when we re-implemented our <a href="https://en.wikipedia.org/wiki/Cron" class="link">Cron-esque</a> scheduler service, Khronos.'
legacy_url: http://blog.runnable.com/post/154101163771/embracing-event-driven-microservices
---

<p class="p">A few months ago, <a href="/blog/event-driven-microservices-using-rabbitmq" class="link">Anand discussed</a> the benefits of transitioning from traditional HTTP communication to event-driven microservices. He noted how this transition decoupled our services, forced scalable patterns, and increased our resilience. Here, we’ll detail the lessons we learned when we re-implemented our <a href="https://en.wikipedia.org/wiki/Cron" class="link">Cron-esque</a> scheduler service, Khronos.</p>

<h3 class="h3">Keeping Microservices Domain Specific</h3>

<p class="p">Khronos handled many tasks for us: health checks, container cleanup, network tests, gathering metrics, and more. While very effective, we determined that this microservice was guilty of violating many domain boundaries throughout its processes. Khronos required knowledge of the internal workings of other services in order to perform its scheduled tasks. This meant that using similar dependencies or external libraries, and even code duplication was needed to perform actions already handled in another service. Additionally, any changes made to other services could lead to breaking changes in Khronos if not updated simultaneously.</p>

<p class="p">In order to adhere to our microservices pattern, we needed to decouple our microservices. Rather than performing tasks cross-domain, Khronos could be stripped down to solely it's timekeeping duties, moving external tasks to their respective microservice.</p>

<h3 class="h3">Before Vs. After</h3>

<p class="p">Before, Khronos would schedule its own workers to perform tasks in other domains. This meant that scheduling new tasks with Khronos required multiple pull requests. Not only did you have to add a new worker to Khronos, but you also had to modify deploy scripts to trigger your worker within Khronos. Khronos became bloated with external dependencies since these workers had to perform actions in other domains.</p>

<p class="p">Because the event-driven nature of our infrastructure, we realized all of this bloat was unnecessary. Now, Khronos exclusively publishes timekeeping events that other microservices can listen to. Domain specific code remains within the respective microservice and our services can be decoupled. Code duplication and external dependencies have been minimized. Developers can now add scheduled tasks to their services by simply listening to these timekeeping events.</p>

<h3 class="h3">Timekeeping Event Listener</h3>

<p class="p">Our intent is to <strong class="weight-strong">listen to global events</strong> and <strong class="weight-strong">publish local tasks</strong> for the service workers to consume. This way, certain events like the passing of a set duration of time, can trigger tasks to run in many different domains, without direct communication. Ponos is our <a href="https://runnable.github.io/ponos/" class="link">open-source RabbitMQ based worker server</a>, that allows us to easily accomplish this. In our case, a Ponos worker would consume the event <code class="monospace">time.one-day.passed</code>, and then publish a <code class="monospace">docker.images.cleanup</code> task that will trigger a worker to cleanup stale docker images.</p>

<h3 class="h3">Naming Timekeeping Events</h3>

<p class="p">Below is an excerpt from the Ponos constructor within Khronos pertaining to our timekeeping events. Events that we propagate throughout our messaging queue should be well-named and descriptive of what exactly has transpired. We start with the domain: <code class="monospace">time</code>, for obvious reasons. This is followed by the duration: <code class="monospace">one-day</code> or <code class="monospace">thirty-minutes</code> to keep our events human readable and understandable at a glance. We finish with the past-tense verb <code class="monospace">passed</code>, correlating to what had happened.</p>

<pre class="pre">
const publisher = new RabbitMQ(
  events: [
    { 'time.one-day.passed',
      jobSchema: joi.object({}).unknown()
    },
    { 'time.four-hours.passed',
      jobSchema: joi.object({}).unknown()
    },
    { 'time.one-hour.passsed',
      jobSchema: joi.object({}).unknown()
    },
    { 'time.thirty-minutes.passed',
      jobSchema: joi.object({}).unknown()
    },
    { 'time.five-minutes.passed',
      jobSchema: joi.object({}).unknown()
    },
  ])
})
</pre>

<h3 class="h3">Conclusions</h3>

<p class="p">Some of the major benefits that we have found after making this switch is that:</p>

<ul class="ul"><li class="li">Our code is easier to maintain.
  </li><li class="li">We can listen on any number of timekeeping events.
  </li><li class="li">We have a single source of truth for the passage of time (other services don’t need to use their own <code class="monospace">setInterval</code>).
  </li><li class="li">And that adding scheduled tasks do not require multiple PRs or changes to deploy scripts.
</li></ul><h3 class="h3">Future Ideas</h3>

<p class="p">Moving forward, I would like to make Khronos even more robust by:</p>

<ul class="ul"><li class="li">Adding a listener that can create customizable timekeeping events.
  </li><li class="li">And publishing Khronos as an open-source project!
</li></ul>
