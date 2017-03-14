---
layout: post
title: 'Why is Docker Swarm consuming all available RAM?'
author: anand_p
category: Engineering
excerpt: 'A few weeks ago we were alerted that Docker Swarm was using over 8GB of RAM. Our investigation led us to discover an unexpected factor that determines its memory usage. After a bit of graphing and math, we were able to locate the code behind this unexpected behavior.'
date: 2017-03-13 22:00:00 -0800
---

A few weeks ago we were alerted that Docker Swarm was using over 8GB of RAM. Our investigation led us to discover an unexpected factor that determines its memory usage. After a bit of graphing and math, we were able to locate the code behind this unexpected behavior.

### What is Swarm?

Docker Swarm manages multiple Docker hosts in a way that makes it look like you are running on a single Docker host. Swarm takes container create requests and finds the best host to run it on. Swarm abstracts hosts away so you don’t need to know what host a container is running on to perform an action on them (such as stop, start, inspect, or exec).

### The Rise

One day we received an alert saying Swarm was using over 1GB of memory. Our metrics and canaries reported healthy, so we assumed Swarm was just consuming memory as needed. A few days later, it climbed up to 2GB. Again, everything was normal and the number of hosts we had were increasing, so we assumed it was typical usage. At the end of the month, Swarm was using 8GB of memory; it was time to investigate.

### The Investigation

At first we thought it was a memory leak, and simply redeployed the Docker Swarm container. But within 2 minutes the memory usage was back to 8GB. This ruled out a simple memory leak. Next, we looked into our metric graphs alongside Swarm’s memory usage.

<img src="images/posts/swarm-cpu.png" width="900" height="325">

First we looked at CPU usage. It was increasing when memory was, but CPU usage does not normally correlate to RAM usage, so we classified this as a symptom rather than the root cause. We needed to find something that could be mapped to memory usage, like holding a file in memory.

<img src="images/posts/swarm-running-containers.png" width="900" height="325">

Next we looked at the number of running containers since we knew Swarm was responsible for scheduling containers. But the graph showed no correlation so we moved on.

<img src="images/posts/swarm-hosts.png" width="900" height="325">

Next, we looked at the number of Docker hosts as Swarm is also responsible for keeping track of hosts. At first, it looked like there was a correlation when we only looked a few weeks back, but the picture became more clear when we zoomed out to see the rest of the year. The number of hosts has increased at a pretty constant rate over time, and that didn’t account for our recent jump in Swarm memory usage.

<img src="images/posts/swarm-network.png" width="900" height="325">

The next thing we looked at was network traffic. We found a correlation between network traffic and memory. To dig deeper, we ran `iptraf` and `iftop` and found that the majority of traffic was coming back from the Docker host. This traffic was made up of packets sent in response to a request that was initiated by Swarm. To determine the contents of these packets, we used `tcpdump`.

The dump showed us that most of the traffic was made up of container inspect data. Interestingly, most of the inspect data was coming from *dead containers*. This prompted us to pull up another graph that showed the number of running *and* stopped containers.

<img src="images/posts/swarm-all-containers.png" width="900" height="325">

There was a correlation here too. Using this graph, we found the ratio of memory per container to be around 12KB. We knew most of the network traffic was made up of inspect data, so we did a Docker inspect on our containers and confirmed the average size to be around 12KB per container. This strongly suggested that we had found the reason for our memory increase.

Now it was obvious to us that Swarm stores the inspect object for each container in memory, whether it’s started or stopped. This make sense because otherwise Swarm would have to inspect all the Docker hosts to get the inspect data.

### The Code

Graphs and math are cool, but the proof is in the code. We dug into the Swarm codebase to see how Swarm was saving container data:

```go
// AddContainer injects a container into the internal state.
func (n *Node) AddContainer(container *cluster.Container) error {
  if container.Config != nil {
    memory := container.Config.HostConfig.Memory
    cpus := container.Config.HostConfig.CPUShares
    if n.TotalMemory-memory < 0 || n.TotalCpus-cpus < 0 {
      return errors.New("not enough resources")
    }
    n.UsedMemory = n.UsedMemory + memory
    n.UsedCpus = n.UsedCpus + cpus
  }
  n.Containers = append(n.Containers, container) // 👈 THIS LINE
  return nil
}
```

The line I’ve commented on above is where Swarm saves a container object into an in-memory array, confirming that Swarm’s memory usage is tied with the size of a container’s inspect data.

### Conclusion

We now know the amount of memory used by Swarm is around the size of the inspect data for all your containers. This should help you plan how much memory you need to give Swarm based on the number of containers you expect to be managing. I will leave you with 2 tips to help keep RAM usage down:

1. Always delete containers when they are not needed anymore. Use something like [docker-cleanup](https://github.com/meltwater/docker-cleanup).
2. Do not use labels to pack a lot of information. Instead, simply store a database key or S3 link to get data back from containers.

If you have any questions, feel free to tweet me [@akaDJFaZe](https://twitter.com/akaDJFaZe)!
