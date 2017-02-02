---
layout: post
title: External API Caching with Varnish & Nginx
author: ryan_r
category: Engineering
excerpt: 'We use a number of external services to handle data retrieval, monitoring, and reporting. The importance of each service depends on its role in our sandboxes product. For instance, it’s generally fine if we miss a few reports sent to Datadog but it is not okay if we are unable to reach the GitHub API. In this post, we’ll discuss the issues we’ve faced when interfacing with external services and dive into how we use Varnish Cache to handle them.'
legacy_url: http://blog.runnable.com/post/144975295096/external-api-caching-with-varnish-nginx
---

<p class="p">We use a number of external services to handle data retrieval, monitoring, and reporting. The importance of each service depends on its role in our sandboxes product. For instance, it’s generally fine if we miss a few reports sent to Datadog but it is not okay if we are unable to reach the GitHub API. In this post, we’ll discuss the issues we’ve faced when interfacing with external services and dive into how we use Varnish Cache to handle them.</p>

<h3 class="h3">Three Problems</h3>

<p class="p">We’ve faced three major problems concerning external services during the course of building out the Runnable sandboxes product:</p>

<ol class="ol"><li class="li"><span class="strong">Latency</span> — the amount of time it takes for the service to handle our requests.</li>
<li class="li"><span class="strong">Availability</span> — whether or not the service can be used and is not experiencing an outage.</li>
<li class="li"><span class="strong">Rate Limiting</span> — whether or not we have hit the maximum number of requests allowed by the provider.</li>
</ol>

<p class="p">From our perspective, latency is a tough problem since there is often little we can do to address it directly <a href="#footnote-1" class="link" id="footnote-1-source">[1]</a>. Similarly we are, for the most part <a href="#footnote-2" class="link" id="footnote-2-source">[2]</a>, powerless to directly fix service outages. Which leaves us with rate limiting, the only problem we can directly address when designing our software.</p>

<p class="p">Since we’ve moved to a microservice architecture, outbound requests can come from a variety of sources and it can be difficult to directly track and optimize our usage. Furthermore, even if we were able to achieve an optimal minimum, the number of external requests in our system is directly proportional to number of active users. This means as we grow we will make more requests, and eventually we will hit the limits set forth by our external service providers.</p>

<p class="p">There were many ways we could go about solving the rate limiting problem, but the one that seemed most promising (and familiar) was to use a distributed HTTP cache, like <a href="https://www.varnish-cache.org/" class="link">Varnish Cache</a>.</p>

<h3 class="h3">Caching Outside of the Box</h3>

<p class="p">Varnish is a very fast “caching HTTP reverse proxy” <a href="#footnote-3" class="link" id="footnote-3-source">[3]</a> that has seen a lot of success as an in-datacenter frontend for any HTTP based service (APIs, web servers, etc.). In the standard use-case one simply sets a varnish server in front of one or many backend web services, customizes how caching and proxying works via a VCL configuration, then sets memory limits on the LRU cache during the daemon start.</p>

<img src="images/posts/varnish-1.png" class="img post-graphic" width="427" height="150" alt="image">

<p class="p">Once running, Varnish will handle all incoming requests on behalf of the application server. When the first request is made to a cacheable resource, it will forward the request to the application server, cache the response, and then send the response back to the end user. Subsequent requests to the same resource will bypass application server entirely and Varnish will simply respond with the cached content. Finally after a manual purge, timeout, or via LRU, the content for the resource will be removed from the cache, and the cycle will begin anew.</p>

<p class="p">By flipping this standard use case around, using the right VCL configuration, and relying on some advanced Varnish features, we can address all three problems discussed in the previous section.</p>

<img src="images/posts/varnish-2.png" class="img post-graphic" width="430" height="150" alt="image">

<p class="p"><span class="strong">Latency</span> is a problem that can be directly solved by putting varnish between internal services and external APIs <a href="#footnote-4" class="link" id="footnote-4-source">[4]</a>. Given that the data remains relatively static (persists longer than a minute or two), one can bypass external requests entirely. This has the effect of dramatically reducing latency when fetching external resources <a href="#footnote-5" class="link" id="footnote-5-source">[5]</a>.</p>

<p class="p">We can partially address the problem of <span class="strong">availability</span> by way of a “<a href="https://www.varnish-cache.org/trac/wiki/VCLExampleGrace" class="link">grace periods</a>”. Roughly under certain circumstances (such as when it cannot reach backends) one can configure Varnish to serve stale content even if it has been purged or expired from the cache. This means that if the external service is having an outage, you can still get stale “responses” from the service and do as much as you can until things settle down.</p>

<p class="p">Finally, <span class="strong">rate limiting</span> is addressed in the exact same way as latency. If you have a decent cache hit ratio in Varnish, then you necessarily make fewer requests to the external service. This means that your service has much more breathing room to work with before hitting any eventual rate limits.</p>

<p class="p">From this perspective it’s pretty clear that Varnish is an excellent tool for the job. But there are still a couple of problems. First, we haven’t actually solved the rate limiting problem, but only made it less pressing by giving ourselves a bit more headroom. Second, Varnish does not handle SSL <a href="#footnote-6" class="link" id="footnote-6-source">[6]</a>, and nearly all external APIs one might want to leverage require the use of the <a href="https://en.wikipedia.org/wiki/HTTPS" class="link">HTTPS protocol</a> for secure communication.</p>

<h3 class="h3">Putting It All Together: NGINX + Multiple NATs</h3>

<p class="p">While Varnish doesn’t handle SSL, there is another HTTP proxy that does: NGINX. To make this work, we setup an Nginx instance that translates incoming HTTP traffic from Varnish to HTTPS traffic outbound to the external service. Then Nginx performs the SSL decryption of the response and sends it back to Varnish via HTTP.</p>

<img src="images/posts/varnish-3.png" class="img post-graphic" width="560" height="205" alt="image">

<p class="p">By using the two proxies together, one allows each to do what they do best. Furthermore the solution is actually rather trivial to implement with NGINX <a href="#footnote-7" class="link" id="footnote-7-source">[7]</a>.</p>

<p class="p">With SSL out of the way, the last problem to fully solve is rate limiting. If you are using a Software Defined Networking solution (e.g. AWS VPC) for your production infrastructure, then one solution is to route outbound traffic through different NATs. In this scheme, one sends high priority requests through one NAT, and low priority requests through another.</p>

<img src="https://s3-us-west-1.amazonaws.com/runnable-design/varnish-4.png" class="img post-graphic" width="866" height="395" alt="image">

<p class="p">For instance, HTTP services could be considered high priority, and worker based services could be considered low priority. HTTP services such as internal or external APIs often do not have retry logic built into routes when external calls fail, but worker servers can be easily coded to use a backoff scheme and retry their task at a later date.</p>

<h3 class="h3">Final Thoughts</h3>

<p class="p">While in no way the ultimate solution to handling external services we’re pretty happy with this solution at Runnable. It meets our needs, leverages open source, and is modular enough to easily change in the future. Thanks for reading and happy architecting!</p>

<p id="footnote-1" class="footnote">1: Network latency is directly proportional to the distance between our datacenter and the external service’s datacenter. Request processing time depends on the implementation details of the service in question. <a href="#footnote-1-source" class="link">↩</a></p>

<p id="footnote-2" class="footnote">2: One way we help is to <a href="/blog/introducing-ponos-a-rabbitmq-based-worker-server" class="link">exponentially backoff</a> requests to failing providers so as to avoid DOSing them when they are already buckling under load. <a href="#footnote-2-source" class="link">↩</a></p>

<p id="footnote-3" class="footnote">3: <a href="https://www.varnish-cache.org/intro/index.html#intro" class="link">In-depth information on varnish</a> <a href="#footnote-3-source" class="link">↩</a></p>

<p id="footnote-4" class="footnote">4: Traditionally one uses it to reduce processing time for HTML rendering (via rails, php, etc.), but companies such as <a href="www.fastly.com" class="link">Fastly</a> even use Varnish to help reduce network latency! <a href="#footnote-4-source" class="link">↩</a></p>

<p id="footnote-5" class="footnote">5: By default one usually only caches HTTP GET and HEAD requests, as it often does not make sense to cache routes that perform resource mutation. <a href="#footnote-5-source" class="link">↩</a></p>

<p id="footnote-6" class="footnote">6: There are some <a href="https://www.varnish-cache.org/docs/trunk/phk/ssl_again.html" class="link">very good reasons</a> as to why this is the case <a href="#footnote-6-source" class="link">↩</a></p>

<p id="footnote-7" class="footnote">7: Here’s an example <a href="https://gist.github.com/rsandor/2dce300e5bd8f23f1084faf27b43ca24" class="link">SSL initiation configuration for NGINX</a> <a href="#footnote-7-source" class="link">↩</a></p>
