---
layout: post
title: 'Runnable Unveils Kubernetes Integration @ Google Cloud Next'
author: sundip_p
category: Announcements
excerpt: 'Last week, the Runnable team attended Google Cloud Next and had the privilege to speak with tons of developers and DevOps professionals. We kicked off the conference with the announcement of support for Kubernetes on Google Cloud Platform. We also gave away a ton of swag and sparked several meaningful relationships. A big thanks to everyone who stopped by our booth and said hi! It was awesome to meet and talk to so many of you.'
date: 2017-03-20 18:00:00 -0800
---

Last week, the Runnable team attended Google Cloud Next and had the privilege to speak with tons of developers and DevOps professionals. We kicked off the conference with the announcement of support for Kubernetes on Google Cloud Platform. We also gave away a ton of swag and sparked several meaningful relationships. A big thanks to everyone who stopped by our booth and said “Hi”! It was awesome to meet and talk to so many of you.

### Announcing Kubernetes & GKE Integration

On opening day of Google Next, we announced our private beta for using Runnable with Kubernetes on Google Container Engine. Teams who currently use, or plan to use k8s will enjoy having Runnable’s preview and test environments spun up using their production Kubernetes configurations.  In short, every code branch will have its own namespace with the Deployments, Volumes, Services, Config Maps, etc. defined by your production configuration. As you can imagine, this generated a lot of excitement and a ton of questions.

<img src="images/posts/cloud-next-booth.jpg" width="660" height="435">

#### Bringing Kubernetes to Your Development

For many, Kubernetes is the ideal orchestration framework for production. That said, not everyone is taking advantage of its benefits throughout their development workflow. Runnable’s vision is to make the most of your team’s investment in Kubernetes by creating production-fidelity environments for every code branch, and for every test. This includes all of the databases and services necessary to run your full stack. Runnable automatically keeps environments up-to-date with the branch’s latest code changes, and tears down environments when their associated branch is removed.

#### One Config to Rule Them All

Since Runnable creates your preview and test environments from your production Kubernetes configuration, that config becomes the only one you need to run all your environments. This means:

1. You’ll no longer have to manage multiple sets of configuration files.
2. QA and testing on Runnable environments will enable you to find Kubernetes configuration-related bugs earlier, *before* you merge your code branch.

If you’re interested in Runnable’s Kubernetes integration, [sign up for our private beta](https://runnable.com/google).

### More on Google Cloud Next ‘17

<p class="caption"><img src="images/posts/cloud-next-demo.jpg" width="660" height="371">Source: <a href="https://twitter.com/GetRunnable/status/841425415185059840/photo/1">@GetRunnable</a></p>

We really enjoyed our time at Google Cloud Next. We were fortunate to meet a ton of people who were excited by our demo, which featured building and using preview and test environments for every code branch.

<img src="images/posts/cloud-next-swag.jpg" width="660" height="374">

Of our swag, the purple water bottles and our stickers were the crowd favorites. Can you spot the homage in our stickers? They were inspired by the Kubernetes logo’s seven spokes from its original name, [Project Seven of Nine](https://cloudplatform.googleblog.com/2016/07/from-Google-to-the-world-the-Kubernetes-origin-story.html).

<p class="caption"><img src="images/posts/cloud-next-stickers.jpg" width="660" height="400">Sources: <a href="https://twitter.com/rickcrawford/status/840255088362889217">@rickcrawford</a>, <a href="https://twitter.com/krbhardwaj/status/840339500857405440">@krbhardwaj</a>, <a href="https://twitter.com/LeoP_TCTO/status/840333431506534400">@LeoP_TCTO</a></p>

Along with the swag, we gave away two DJI Mavic Pro drones! Thanks to everyone who participated, and congratulations to our winners, Adam Blank and Rick Crawford! We hope you both enjoy them!

<p class="caption"><img src="images/posts/cloud-next-drones.jpg" width="660" height="400">Source: <a href="https://twitter.com/GetRunnable/status/841425415185059840/photo/1">@GetRunnable</a></p>

### Next Up: DockerCon

We left Google Cloud Next excited by the comments and feedback we collected around both our core product and our Kubernetes integration. We can’t wait for DockerCon. If you’re heading to Austin next month, stop by our booth (E11) to say “Hi” and run through a demo of Runnable. You might just take something memorable back with you.
