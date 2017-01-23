---
layout: post
title: Elastic Routing in Runnable
author: ryan_k
category: Engineering
excerpt: 'Our service gives teams full-stack environments for every branch. This means we run all repository branches simultaneously, each on a different container. As new commits are pushed to a branch, we automatically rebuild its code on a new container. To make all of this useful, we give a URL to each branch that’s always connected to the container with the latest commit. Behind the scenes, our routing system dynamically switches the container that’s connected to the branch URL, which may have ended up on a different host to help distribute load across the instances we provision for every team.'
legacy_url: http://blog.runnable.com/post/149340238426/elastic-routing-in-runnable
---

### An overview

Our service gives teams full-stack environments for every branch. This means we run all repository branches simultaneously, each on a different container. As new commits are pushed to a branch, we automatically rebuild its code on a new container. To make all of this useful, we give a URL to each branch that’s always connected to the container with the latest commit. Behind the scenes, our routing system dynamically switches the container that’s connected to the branch URL, which may have ended up on a different host to help distribute load across the instances we provision for every team.

### The problem

As complicated as our routing was to build, it wasn't enough. We needed to support an additional use case: enabling external server-side integrations to work across all running branches without requiring the user to change their code or modify their 3rd party configuration settings.

Take such an integration — like server-side OAuth, for example — where you’re given a source and callback URL which must be configured with the backend provider you are authenticating with. This means we need to have a single URL that can represent any of the team’s containers (for a particular service) at any time. Otherwise, our users would have to constantly update the source and callback URLs every single time they create a new branch.

### Elastic URLs

To make this work, we came up with a new concept we call “Elastic URLs”. Here’s how it works:

* The user make a request to a branch-container URL, described above.
* We set a session cookie on your browser that stores which branch-container you requested.
* We redirect you to the Elastic URL, which is similar to the branch-container URL.
* Any subsequent time you make a request from the Elastic URL, we check your session token to determine which container to route your request through to.

With this in place, users would only have to modify their configuration once, with the Elastic URL. Sounds fairly straightforward, but it created its own issues.

### Passing cookies for every request

This solution requires our session tokens to be passed for every request made to our servers; however, not every application that runs on Runnable is configured to send cookie information. To work around this, we inject some JavaScript at the top of the page. This script overrides `window.fetch` and `window.xhr` to force our session tokens to be sent to all requests that are sent to our servers.

### Working with CORS

As you may have guessed, sending requests to a server with credentials with CORS (Cross -Origin Resource Sharing) can present its own concerns if the server is not configured to respond with the `Access-Control-Allow-Credentials` header. We worked around this by passing these headers to every request sent from Runnable.

We also needed to enable CORS requests for users behind any proxy that enables CORS automatically; so we also include the following headers as well:

{% highlight javascript %}
Access-Control-Allow-Headers
Access-Control-Allow-Methods
Access-Control-Allow-Origin
{% endhighlight %}

This enables our users to use Runnable without requiring CORS to be set up beforehand.

### External to internal routing

We offer another tool to adjust routing between containers on-the-fly — useful when you need to test against a specific branch of API, for example. While this was fairly straightforward to achieve with branch-container URLs, we also felt the need to preserve this functionality when using an Elastic URL. We achieve this by:

* Reading the `Request Referrer` and `Session Cookie` details on the incoming request to determine which branch-container’s service was used to send the request.
* Performing a look-up to determine which API server that request should be sent to.
* And that’s it. Rather than going into more detail on how our container-to-container routing works, we’ll save that for another post.

Our Elastic URL routing has helped teams with 3rd party server-side integrations (like OAuth) get up and running at an incredible pace. We do recognize that some of the changes required to make this work might not be welcomed by all of our users. That’s precisely why we keep this functionality off by default. If your team can benefit from using Elastic URLs, simply reach out to Support and we’ll get you running in no time.
