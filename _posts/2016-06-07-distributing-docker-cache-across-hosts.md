---
layout: post
title: Distributing Docker Cache across Hosts
author: anand_p
category: Engineering
excerpt: 'Building and compiling code can take a huge hit on our time and resources. If you have dockerized your application, you may have noticed how much of a time-saver Docker cache is. Lengthy build commands can be cached and not have to be run at all! This works great when you’re building on a single host; however, once you start to scale up your Docker hosts, you start to lose that caching goodness.'
---

<p class="p">Building and compiling code can take a huge hit on our time and resources. If you have dockerized your application, you may have noticed how much of a time-saver Docker cache is. Lengthy build commands can be cached and not have to be run at all! This works great when you’re building on a single host; however, once you start to scale up your Docker hosts, you start to lose that caching goodness.</p>

<p class="p">In order to take advantage of Docker caching on multiple hosts, we need a multi-host cache distribution system. Our requirements for preserving a single-tenant infrastructure for our customers meant we needed a horizontally scalable solution. This post will go through some methods we considered to distribute Docker cache across multiple Docker hosts.</p>

<h3 class="h3">Everyday Example</h3>

<p class="p">First, let’s look at how Docker cache can affect builds with this simple example:</p>

<div class="pre-label">Dockerfile</div>

<pre class="pre"><code class="monospace no-wrap">FROM node
RUN apt-get update &amp;&amp; apt-get install curl vim -y
ADD ./package.json /package.json
RUN npm install
ADD . /nodejs-app
CMD npm start</code></pre>

<p class="p">Running <code class="monospace">docker build</code> for the first time produces the following:</p>

<pre class="pre"><code class="monospace no-wrap"><span class="text-purple-light">scripts$</span> docker build .
Sending build context to Docker daemon 50.09 MB
Step 1 : FROM node
 ---&gt; 708e372a5f46
Step 2 : RUN apt-get update &amp;&amp; apt-get install curl vim -y
 ---&gt; Running in 50dfd682678d
Get:1 http://security.debian.org jessie/updates InRelease [63.1 kB]
# ... Time passed
Processing triggers for libc-bin (2.19-18+deb8u4) ...
 ---&gt; 0fc75922c6d2
Step 3 : ADD ./package.json /package.json
 ---&gt; 042ad2a02487
Step 4 : RUN npm install
 ---&gt; Running in aada9b1e6ff0
npm info it worked if it ends with ok
# ... Resources used
npm info ok
 ---&gt; e14b9bc77d41
Step 5 : ADD . /nodejs-app
 ---&gt; 36286c4d2f21
Step 6 : CMD npm start
 ---&gt; Running in b6b558c42604
 ---&gt; 38fbb662b182
Successfully built 38fbb662b182</code></pre>

<p class="p">Re-building on the same host with no changes shows Docker cache in action:</p>

<pre class="pre"><code class="monospace no-wrap"><span class="text-purple-light">scripts$</span> docker build .
Sending build context to Docker daemon 50.09 MB
Step 1 : FROM node
 ---&gt; 708e372a5f46
Step 2 : RUN apt-get update &amp;&amp; apt-get install curl vim -y
 ---&gt; Using cache
 ---&gt; 0fc75922c6d2
Step 3 : ADD ./package.json /package.json
 ---&gt; Using cache
 ---&gt; 042ad2a02487
Step 4 : RUN npm install
 ---&gt; Using cache
 ---&gt; e14b9bc77d41
Step 5 : ADD . /nodejs-app
 ---&gt; Using cache
 ---&gt; 36286c4d2f21
Step 6 : CMD npm start
 ---&gt; Using cache
 ---&gt; 38fbb662b182
Successfully built 38fbb662b182</code></pre>

<p class="p">In the example above, you can see <code class="monospace">apt-get update &amp;&amp; apt-get install curl vim -y</code> and <code class="monospace">npm install</code> were cached (meaning they didn’t need to run). This saves considerable time, network, and compute resources for those who have several packages to install. This is a short example, but most Dockerfiles have many more dependencies installed before application code is added. You get all the caching goodness when all builds are run on the same host. The problem is if this host goes down, or if this build is run on a different host, you’re going to have to wait for the full build. You can read more about Docker caching <a href="https://docs.docker.com/engine/userguide/eng-image/dockerfile_best-practices/#build-cache" class="link" target="_blank">in the documentation</a>.</p>

<p class="p">How do we get this wonderful Docker cache to all of our build servers?</p>

<h3 class="h3">Copious Caching</h3>

<img src="http://static.tumblr.com/mpxyjs6/U54o87rzd/cache-1.png" class="post-graphic" width="480" height="360" alt="image">

<p class="p">Before Docker version 1.10, distributing cache was easy with the <a href="https://hub.docker.com/_/registry/" class="link" target="_blank">Docker registry</a>. We ran a Docker registry container on each host backed by an S3 bucket. After every build, we pushed the image to the registry:</p>

<pre class="pre monospace"><code class="monospace">docker push IMAGE</code></pre>

<p class="p">Once the image was pushed, we pulled that image down on other Docker hosts.</p>

<pre class="pre monospace"><code class="monospace">docker pull IMAGE</code></pre>

<p class="p">After the pull completed, Docker would automatically use those image layers when looking up its cache.</p>

<p class="p">Docker 1.10 <a href="https://docs.docker.com/engine/userguide/storagedriver/imagesandcontainers/#content-addressable-storage" class="link" target="_blank">changed</a> the way its images and image layers are addressed. This change removed the parent chain, meaning a simple <code class="monospace">docker pull</code> no longer primed the build cache.</p>

<p class="p">Luckily Docker 1.11 gives us <a href="https://github.com/docker/docker/pull/21385" class="link" target="_blank">a solution</a> with <code class="monospace">docker load</code> and <code class="monospace">docker save</code>. <code class="monospace">docker save IMAGE [IMAGE...]</code> creates a tarred repository for a given image. In order to recreate the cache, we have to pass all layers referenced by the image to the save command:</p>

<pre class="pre"><code class="monospace no-wrap">docker save &lt;IMAGE&gt; $(docker history -q &lt;IMAGE&gt;) &gt; image.tar</code></pre>

<p class="p">The image.tar file now contains the image <span class="em">and</span> its dependent layers. Note that you’ll have to pass the image name with its history if you want to preserve the name of the image.</p>

<p class="p">To load this image in Docker’s cache, we need to use the <code class="monospace">docker load</code> command:</p>

<pre class="pre"><code class="monospace no-wrap">docker load &lt; image.tar</code></pre>

<p class="p">Now, we have to distribute these images across Docker hosts. We came up with the following methods:</p>

<h4 class="h4">Method #1: Direct Transfer</h4>

<img src="http://static.tumblr.com/mpxyjs6/HIQo87rzh/cache-2.png" class="post-graphic" width="480" height="241" alt="image">

<p class="p">We can directly transfer these images from host to host. Since the output of <code class="monospace">docker save</code> is a stream, and <code class="monospace">docker load</code> can also take in a stream, we can simply pipe the streams together. Note that the target Docker engine must be exposed on a port and that port must be accessible by the sending Docker engine.</p>

<pre class="pre"><code class="monospace no-wrap">docker save &lt;IMAGE_NAME&gt; $(docker history -q &lt;IMAGE_NAME&gt;) | docker -H tcp://REMOTE_HOST:REMOTE_PORT load</code></pre>

<h4 class="h4">Method #2: Distributed File Store</h4>

<p class="p">The above method works great when you have a static list of hosts, but maintaining that list becomes harder when you have ephemeral hosts. To better handle dynamic hosts we thought of a distributed file store solution. In this method, we’d start by saving these images as files, and then distribute them across all Docker hosts, and finally load this file into the Docker engine.</p>

<img src="http://static.tumblr.com/mpxyjs6/YCpo87rzk/cache-3.png" class="post-graphic" width="480" height="360" alt="image">

<p class="p"><span class="em">Step 1:</span> On the Docker host where the image was first built, we convert the image to a tar file:</p>

<pre class="pre"><code class="monospace no-wrap">docker save &lt;IMAGE_NAME&gt; $(docker history -q &lt;IMAGE_NAME&gt;) &gt; /shared/image.tar</code></pre>

<p class="p"><span class="em">Step 2:</span> We now can distribute image.tar by using one of the many file distribution methods available today. Some methods of distributing images are <a href="http://aws.amazon.com/s3/" class="link" target="_blank">Amazon’s S3</a>, <a href="https://aws.amazon.com/efs/" class="link" target="_blank">Amazon’s EFS</a>, and <a href="https://hub.docker.com/r/bittorrent/sync/" class="link" target="_blank">Bittorrent Sync</a>.</p>

<p class="p"><span class="em">Step 3:</span> Once the tar is distributed, we load it on the remote host:</p>

<pre class="pre"><code class="monospace no-wrap">docker load &lt; /shared/image.tar</code></pre>

<h3 class="h3">Preserving Potency</h3>

<p class="p">Now that we know how to distribute images, we need to know when to update cache across the hosts. Distributing cache on every build is not desirable since most builds typically break the cache after the ADD or COPY line, where code is introduced.</p>

<p class="p">We applied an optimization to fix this problem: we parse the build logs and only distribute cache if there was a cache break in a line before an ADD or COPY statement. In an auto-scaling system, we pre-load all images on the new host before it comes into rotation. While this tends to use more disk space, we keep it in check by running a cron job to remove old images.</p>

<h3 class="h3">Future Fixes</h3>

<p class="p">The registry method was the ideal way to transfer images and cache. From <a href="https://github.com/docker/docker/issues/20316" class="link" target="_blank">this issue on GitHub</a>, it looks like there are many people who agree. It’s possible that it might be brought back into the registry with certain flags; but in the meantime, we’ll continue to use the <code class="monospace">docker load</code> and <code class="monospace">docker save</code> method as part of our cache distribution.</p>
