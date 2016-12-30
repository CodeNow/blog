---
layout: post
title: Feature Flag Routes Safely with Express Middleware
author: ryan_k
category: Engineering
excerpt: 'We had a new feature request come down the pipeline while we were testing Runnable with some of our early users — to allow teams to opt-in to our elastic URL routing behavior, as opposed to having it enabled by default. (We have a fairly complex URL routing system which would take its own blog post to explain. In short, it handles routing all user traffic to their respective Docker containers.) This system was one of the earlier services written when building out our infrastructure, and has gone through several bug fixes and tuning to get it working just right.'
---

<p class="p">We had a new feature request come down the pipeline while we were testing Runnable with some of our early users — to allow teams to opt-in to our elastic URL routing behavior, as opposed to having it enabled by default. (We have a fairly complex URL routing system which would take its own blog post to explain. In short, it handles routing all user traffic to their respective Docker containers.) This system was one of the earlier services written when building out our infrastructure, and has gone through several bug fixes and tuning to get it working just right.</p>

<p class="p">It turned out that this new feature request would fundamentally change how our routing service works on a per-customer basis. Which is worrisome because this would require a change in an otherwise hardened, core service in our infrastructure. However, by leveraging the idea of feature flags, we were able to come up with a relatively naive implementation that enabled us to add a new routing feature fairly quickly.
</p>

<p class="p">We first thought of implementing this feature by adding conditional logic to our existing code which would prevent the elastic behavior and just serve the requested pages. However, we had enough customers who still needed the elastic routing magic to work, and we couldn’t risk destabilizing a core, actively used part of our service.</p><p class="p">Instead, we decide to work around the existing code by feature flagging customers who haven’t opted-in to the elastic URL behavior. Here’s how:</p>


<p class="p">We added a piece of middleware at the start of the request chain that checks if the feature flag is enabled for this request.</p>

<ul class="ul"><li class="li"><p class="p">If not set, we simply call <code class="monospace">next</code> and are on our way to the original, elastic routing behavior.</p></li>
  <li class="li"><p class="p">If set, we handle all routing in another path, with all new code, ideally written in a more maintainable fashion.</p></li>
</ul><p class="p">Our existing routing looked something like this:</p>

<pre class="pre"><code class="monospace no-wrap">app.get(‘/foo’, handleAuth, legacyRouting)</code></pre>

<p class="p">We were able to change it to this:</p>

<pre class="pre"><code class="monospace no-wrap">app.get(‘/foo’, handleAuth, featureFlaggedRouting, legacyRouting)

const featureFlaggedRouting = (req, res, next) =&gt; {
  if (req.user.featureFlagExists) {
    return newRoutingLogic(req, res, next)
  }
  next()
}</code></pre>

<p class="p">Apart from introducing this feature with low risk, this method allowed us to deploy our changes to production and enable it for a few customers as a beta period — just like you’d expect with feature flagging. When issues were encountered, we flipped the feature flag back to the old style and then went in and fixed the issue. This approach was beneficial in that it introduced zero customer downtime, enabled us to gradually roll out changes in production and instantly rollback when necessary.</p>

<p class="p">The downside is that we now have some duplicated code, specifically the bits that proxy requests for us. However, this enabled our duplicated code to be given enough time to be battle tested, so we can go into our older elastic routing system and update it, bit by bit, using flags at each step of the way. This enabled us to do slow, stable roll outs to our customer base.</p>

<p class="p">In this scenario, forking the request path based on a feature flag has helped us maintain a stable system and allowed us to deliver a new feature to customers quickly. We’ve been bitten before by going overboard with middleware forking, an entirely different story for another time, so remember moderation in all things. Using feature flags to implement changes with new code, battle testing it, and then going back in to clean up old code, allows us to easily isolate and constantly improve parts of our express application.</p>
