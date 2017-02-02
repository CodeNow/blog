---
layout: post
title: How We Pre-Bake Docker Images to Reduce Infrastructure Spin-Up Time
author: henry_m
category: Engineering
excerpt: '<p class="p">I <a href="/blog/how-were-spinning-up-our-aws-infrastructure-80" class="link">previously outlined</a> the methods I used to speed up our AWS infrastructure spin-up time. The method covered in this post further reduced that time by about 50% by pre-baking all of the services we needed to run an application.</p><p class="p">Our microservice applications are hosted in Docker containers and can be pulled from the Docker registry and our own private registry. Rather than install and configure services on an Ubuntu server using bash scripts, the individual Docker images for each application can be copied onto every instance that we need. This allows us to add instances much faster if we need to quickly scale to handle a heavy load, and is a practice that most organizations should adopt if it can be implemented.</p>'
legacy_url: http://blog.runnable.com/post/154422684406/how-we-pre-bake-docker-images-to-reduce
---

<p class="p">I <a href="/blog/how-were-spinning-up-our-aws-infrastructure-80" class="link">previously outlined</a> the methods I used to speed up our AWS infrastructure spin-up time. The method covered in this post further reduced that time by about 50% by pre-baking all of the services we needed to run an application.</p>

<p class="p">Our microservice applications are hosted in Docker containers and can be pulled from the Docker registry and our own private registry. Rather than install and configure services on an Ubuntu server using bash scripts, the individual Docker images for each application can be copied onto every instance that we need. This allows us to add instances much faster if we need to quickly scale to handle a heavy load, and is a practice that most organizations should adopt if it can be implemented.</p>

<p class="p">The first thing our users experience is our demo flow, which demonstrates how our app builds environments for a team's GitHub branches. We pre-build individual images for our demo application into an EC2 AMI. This way, we only need to start those Docker containers for the user to be able to be able to experience a running app.</p>

<p class="p">Most of the work was done in <a href="https://www.ansible.com/" class="link">Ansible</a>, a scalable IT automation tool. We use it to run a variety of simple tasks like updating a server's hosts file, generating certificates, and pulling required Docker images. To give an example, we can specify which command to run (in bash) and which variables to use in the Ansible YAML configuration files. The following Ansible play is used to pull Docker images when we bake an image:</p>

<pre class="pre"><code class="monospace no-wrap">- name: pulling docker images
  become: true
  command: docker pull {{ item }}
  with_items:
    - "registry.runnable.com/runnable/image-builder:{{ IMAGE_BUILDER_VERSION }}"
    - "swarm:{{ SWARM_VERSION }}"
    - "google/cadvisor:{{ CADVISOR_VERSION }}"</code></pre>

<p class="p">There are certain considerations about what to bake into the EC2 image, and each needs to be unique. If every image had the same identity files, there would be no way to distinguish one host from another. In order to install Docker and bake the containers into the AMI, we need to delete the Docker key.json file and the Docker pid file. Docker will generate these the next time it starts, so we're okay.</p>

<p class="p">Our instances must be able to be linked to our users so we can assist them with their applications and determine how many resources they utilize. To customize the instances as they are deployed, we bake the Amazon SSM agent into the image so that we can communicate with the instance as soon as it is provisioned. The faster we can allocate and configure these instances for each user, the faster our internal DNS and routing configurations can make the application reachable.</p>

<p class="p">While we have very specific, actionable reasons for pre-baking Docker images into our Amazon AMIs, this practice can be applied to nearly any architecture. It is especially useful for Runnable, where an instance can be used to host a wide variety of applications, databases or services, but can even apply if you know exactly what an instance needs to have at deployment. Multiple AMIs can be used to fill every role, or an instance can have a multitude of Docker images that are never run but are not a drain on resources. This would greatly contribute to a highly available infrastructure that can scale in seconds.</p>

<p class="p">The practice of baking things that you need to run into your servers is a no-brainer. Although we can't preemptively generate certs or set host-specific configurations because of the duplication involved, those are short processes that don't comprise the majority of wait time. Network transfers and, to a lesser extent, disk I/O will typically comprise most of the duration of creating and starting new Docker containers on a server, so eliminating those has greatly sped up our spin-up time. Additionally, these considerations are not specific to our particular product. Creating pre-baked AMIs is a valuable process that will speed up wait times for any team when creating a new instance.</p>
