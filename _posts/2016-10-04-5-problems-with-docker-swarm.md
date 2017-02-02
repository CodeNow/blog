---
layout: post
title: 5 Problems with Docker Swarm
author: anand_p
category: Engineering
excerpt: 'When we first started deploying containers across multiple servers, we managed scheduling ourselves. We had to maintain cluster state and determine the best place to schedule a container. We had a solution, but it was not elegant or pretty. When Swarm came out, it promised to solve our scheduling woes. Unfortunately, using it in production hasn’t been as straightforward as we’d hoped. In this post, I’ll cover the problems we encountered and how we worked around them.'
legacy_url: http://blog.runnable.com/post/151334076901/5-problems-with-docker-swarm
---

When we first started deploying containers across multiple servers, we managed scheduling ourselves. We had to maintain cluster state and determine the best place to schedule a container. We had a solution, but it was not elegant or pretty. When Swarm came out, it promised to solve our scheduling woes. Unfortunately, using it in production hasn’t been as straightforward as we’d hoped. In this post, I’ll cover the problems we encountered and how we worked around them.

### Swarm event stream

Our architecture is [fully based on events](event-driven-microservices-using-rabbitmq), which makes Docker’s event stream a critical component for us. Swarm’s event stream API seemed like a perfect feature for us because we would no longer have to connect to each Docker daemon ourselves. But we ran into issues in production that we hadn’t seen in our testing.

First, the stream disconnected almost once every 30 minutes. We didn’t have time to dig into the root cause. Our initial thought was to just get events since the last event we received, after reconnecting. But the `--since` flag is [only supported on the Docker daemon API](https://github.com/docker/swarm/issues/1203), not on Swarm.

Our other option was to inspect the state of the entire system and reconcile our database state on every reconnect. This was too expensive and error prone in our system.

To address these issues, we reverted back to connecting to each Docker daemon individually and using the `-- since` property in the case of disconnection. Now we only use Swarm for `engine_connect` and `engine_disconnect` events, and we poll with docker info to make sure we didn’t miss any.

Also, during disconnections we noticed that sometimes we successfully connected to the Swarm event stream but [no events were emitted](https://github.com/docker/swarm/issues/2309). To fix this, we had to perform an action which triggers an event (we used `top` which had no side effects) and retry the connection if we didn’t get the `top` event back within one second.

### Hidden breaking API changes

According to [SemVer](http://semver.org/), you should update the major version when you make incompatible API changes. However we have seen breaking API changes in minor version updates the Swarm API. Here is just one example:

`docker info`: this is probably the worst-formatted remote API call ever to exist.

{% highlight javascript %}
{ ID: ‘’,
  Containers: 152673,
  ContainersRunning: 138794,
  ContainersPaused: 0,
  ContainersStopped: 13879,
  Images: 3196,
  Driver: '',
  DriverStatus: null,
  SystemStatus:
   [ [ 'Role', 'primary' ],
     [ 'Strategy', 'spread' ],
     [ 'Filters',
       'health, port, containerslots, dependency, affinity, constraint' ],
     [ 'Nodes', '287' ],
     [ ' ip-10-4-128-30.21206356', '10.4.128.30:4242' ],
     [ '  └ ID',
       '3JBF:ACVH:6ERW:4QMI:FWAP:HA7X:M6SO:MTPX:J2F7:MYVU:LOOJ:SQOQ' ],
     [ '  └ Status', 'Healthy' ],
     [ '  └ Containers', '289' ],
     [ '  └ Reserved CPUs', '0 / 2' ],
     [ '  └ Reserved Memory', '0 B / 4.052 GiB' ],
     [ '  └ Labels',
       'executiondriver=, kernelversion=3.13.0-92-generic, operatingsystem=Ubuntu 14.04.4 LTS, org=neferious, storagedriver=aufs' ],
     [ '  └ UpdatedAt', '2016-10-02T02:05:23Z' ],
     [ '  └ ServerVersion', '1.12.0' ],
     [ ' ip-10-4-128-178.22321484', '10.4.128.178:4242' ],
     [ '  └ ID',
       'ABNW:KNAF:HRM2:T7NW:LJGF:TF5Z:IK7B:Y6TO:ABYQ:YO62:GANY:4TIJ' ],
     [ '  └ Status', 'Healthy' ],
     [ '  └ Containers', '289' ],
     [ '  └ Reserved CPUs', '0 / 2' ],
     [ '  └ Reserved Memory', '0 B / 4.052 GiB' ],
     [ '  └ Labels',
       'executiondriver=, kernelversion=3.13.0-92-generic, operatingsystem=Ubuntu 14.04.4 LTS, org=paladin, storagedriver=aufs' ],
… repeat nodes in format above ...
]],
  Plugins: { Volume: null, Network: null, Authorization: null },
  MemoryLimit: true,
/// more keys
}
{% endhighlight %}

<p class="small text-center text-gray caption">Yes, that is `└` in the output!</p>

On minor releases, this API has added and removed tags, and arbitrarily added spaces before the `└`. And to make matters worse, all the nodes and their tags are lumped into one gigantic array, with no hierarchy. This forces us to hardcode what a node looks like so we can parse it ourselves. To deal with these issues, we’ve created [our own Node.js Swarm client](https://github.com/Runnable/swarmerode) that we update with every Swarm API change.

### Scheduling constraints

Out of the box, Swarm has useful [constraints and filters](https://docs.docker.com/swarm/scheduler/filter/#/swarm-filters). You can ask for CPU, labels, images, hard memory limits to find the place for a container to run. However they lack fractional CPU constraints and memory reservation limits. We created a quick workaround by [forking Swarm](https://github.com/CodeNow/swarm) and [adding soft limit scheduling](cost-efficient-container-scheduling-with-docker).

### Manager Scaling

Having a single Swarm manager got us by for a while, however we started seeing it reach 100% CPU and start returning `ECONNRESET` and it would take minutes to recover. This was more than we could afford, because we can only have 1.44 minutes of downtime a day if we want to maintain 99.9% availability.

Ideally, we would spin up more Swarm managers and add a load balancer in front of them, but Swarm’s architecture does not support horizontal load balancing. It only supports high availability, meaning additional nodes have to proxy requests to the master node, which doesn’t reduce its load. In our tests, we found if the master node goes down it takes a few minutes for the others to detect the failure and even more minutes to elect a new master node.

We tried having Swarm managers on standby, but this [increased load](https://github.com/docker/swarm/issues/1752) on the Docker hosts and ate up network bandwidth due to the engine refresh loop. The workaround we came up with was to shard Swarm managers. We spin up a few managers which are shared based on host names, and we added a proxy in front of the Swarm managers.

Our current solution works, but we’d prefer not to have to maintain our own solution. [Docker 12’s Swarm mode](https://docs.docker.com/engine/swarm/) adopted a distributed manager approach similar to Kubernetes and Mesos. Unless Swarm follows suit, we might have to switch.

### Draining and removing nodes

Swarm currently does not have a way to drain or remove a Docker node. This is useful when a node becomes unhealthy or runs out of disk space. To work around this, we use Swarm’s [constraint](https://docs.docker.com/swarm/scheduler/filter/#/use-a-constraint-filter) feature. We keep a store of all the nodes we want to drain and add that to the constraint list `-e constraint:node!=<NODE_NAME>`. To remove a node, we kill the Swarm agent on the server. The node will automatically be removed from Swarm after the node TTL expires.

### Conclusion

All in all, Swarm did remove some complexity in our system, but it also came with its own set of problems. We have learned that there is never a golden tool, but just a tool patched with gold. Never expect software to work exactly how you want it. Plan on adding workarounds to fit your exact use case.
