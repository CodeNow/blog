---
layout: post
title: Preserving web terminals during connection hiccups
author: ryan_k
category: Engineering
excerpt: 'Sockets can be hard. Scaling out websockets can be even harder. At Runnable, we make use of websockets heavily — for notifying users that their containers are running, for implementing deployment messages, and for powering our terminals in the browser. Terminals are a tricky beast to tackle. I learned that a few weeks ago, when our users’ terminals were getting lost and reset based on uncontrollable network issues.'
legacy_url: http://blog.runnable.com/post/143398925001/preserving-web-terminals-during-connection-hiccups
---

<p class="p">Sockets can be hard. Scaling out websockets can be even harder. At Runnable, we make use of websockets heavily — for notifying users that their containers are running, for implementing deployment messages, and for powering our terminals in the browser. Terminals are a tricky beast to tackle. I learned that a few weeks ago, when our users’ terminals were getting lost and reset based on uncontrollable network issues.</p>

<h3 class="h3">Background</h3>

<p class="p">Before I dive into the details of the problem, I need to give you a little overview of how our service works under the hood. Runnable spins up several docker containers per branch in order to test and verify code changes. This is all orchestrated through <a href="https://github.com/docker/swarm" class="link">docker swarm</a>, which handles networking across the multiple instances that are typically needed to adequately service a team. We have a web interface that provides file system and terminal access. The terminal access is built using websockets with the <a href="https://github.com/primus/primus" class="link">primus</a> and <a href="https://github.com/primus/substream" class="link">primus/substream</a> libraries.</p>

<p class="p">In order to make a terminal connection to your container, the browser would send a message on the main primus channel requesting a terminal be created on a particular substream. The backend would then create a connection by running a docker exec with the `bash` command. Once the connection to the docker container is established, we’d pipe all the data through the primus substream we created.</p>

<h3 class="h3">Problem</h3>

<p class="p">Our problems came when the user’s socket connection dropped out due to internet hiccups. This would cause the front end to display a "Disconnected" message, and start the process of making a brand new connection from scratch. After the connection was regained, we gleefully spat out "Connection Regained!"; however, this was far too late. This process caused the user to lose all of their terminal history, as well as the output of their current running command (any active commands would still be running on the container). Obviously, this was a sub-par user experience that needed to be resolved.</p>

<h3 class="h3">Investigation</h3>

<p class="p">The first thing we did was investigate the possible approaches to this problem, big and small. We realized that sockets and reconnection handling are hard, so our knee-jerk reaction was to let other people do it for us! I started researching possible solutions (<a href="https://www.pubnub.com/" class="link">PubNub</a>, <a href="https://pusher.com/" class="link">Pusher</a>, and the like) and studying other systems that used terminals and maintained connections. In the end, we decided that converting everything over to an external solution would make our lives easier in the long-term. However, we knew that implementing it would be high risk due to the many unknowns we’d likely face. So we had to quickly do something in-house with few changes to our infrastructure.</p>

<p class="p">If we could implement our socket connections to reconnect to the same socket server rather than creating a brand-new connection, (we have to support scaling this out to multiple servers, of course) then we could change how we think about terminal connections. Our front end could then just attempt to re-attach to the existing terminal connection which the backend kept alive.</p>

<h3 class="h3">Solution</h3>

<p class="p">When a request to connect to a container comes through, that request will come with an ID of the terminal connection it’s configured to use. If a terminal connection exists with this ID, we just re-connect the user to their existing terminal connection. (If not, we create a new connection and assign it an ID.) With this approach, all their history is maintained and their experience is seamless. The front end keeps track of its terminal session using local storage, and when a connection becomes severed, it attempts to reconnect to the same terminal session. The kicker? This solution also added a nice little feature of preserving terminal sessions when reloading the page.</p>

<img class="post-graphic" src="http://static.tumblr.com/mpxyjs6/MQco687ac/socket-graphic.png" width="897" height="391" alt="image">

<p class="p">Our socket servers are now in charge of connecting to existing pipes instead of always creating new ones. In order to keep the existing pipes around, we built a small in-memory cache that has a last-used timer on it. If a terminal doesn’t have any messages in a set period of time, we close the connection and clean up some memory footprint.</p>

<p class="p">We also encountered a problem during page reloads — if all messages (including the prompt) had already been sent to the front end, users would be greeted with a big, blank terminal window. This looked broken, so we added another small cache to the socket server to keep the last message sent in memory and re-send it on successful connections. However, in the case where we were handling a dropped connection, we knew the message had already been received. To prevent re-displaying the same message twice to the user, we added some logic in the front end to ignore it.</p>

<p class="p">We know this is a temporary solution, but it’s the right fit for our needs right now. It’ll buy us some time until we’re able to research and integrate with an external socket provider. In the meantime, our users get a much better terminal experience while we are freed up to solve the next issue. ^_^</p>
