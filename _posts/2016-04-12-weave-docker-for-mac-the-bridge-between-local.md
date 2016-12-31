---
layout: post
title: 'Weave + Docker for Mac: The bridge between local and remote services'
author: anand_p
category: Engineering
excerpt: 'Integration testing and debugging many microservices can be painful. Often, I need to debug a service on a staging environment. This article shows how we use Docker for Mac with Weave (an overlay network) to connect our local machine to our remote staging environments.<br><br>In my workflow, I usually create a WIP git commit, push it to staging, and try to debug with the Ubuntu server’s limited tools. I <em class="em">could</em> set up a bunch of SSH tunnels to connect to all the remote services, but our stack changes too frequently and finding IP addresses for each service is a pain. My dev machine is a Mac, so most of the tools we use locally don’t work on Linux.<br><br>I wanted something better that would speed up my dev and debugging flow. The first thing I tested with the Docker for Mac beta was Weave integration. Weave creates an overlay network to connect containers across multiple hosts together, which is very useful when distributing containers across a Swarm cluster.'
---

<p>Integration testing and debugging many microservices can be painful. Often, I need to debug a service on a staging environment. This article shows how we use Docker for Mac with Weave (an overlay network) to connect our local machine to our remote staging environments.</p>

<p>In my workflow, I usually create a WIP git commit, push it to staging, and try to debug with the Ubuntu server’s limited tools. I <em class="em">could</em> set up a bunch of SSH tunnels to connect to all the remote services, but our stack changes too frequently and finding IP addresses for each service is a pain. My dev machine is a Mac, so most of the tools we use locally don’t work on Linux.</p>

<p>I wanted something better that would speed up my dev and debugging flow. The first thing I tested with the Docker for Mac beta was Weave integration. Weave creates an overlay network to connect containers across multiple hosts together, which is very useful when distributing containers across a Swarm cluster.</p>

<img src="http://static.tumblr.com/mpxyjs6/7uEo5ibgb/weave-graphic.png" width="840" height="400" class="img post-graphic" alt="image">

<h3 class="h3">Requirements:</h3>

<ol class="ol"><li class="li">
    <p>Remote docker-engine. I used the latest engine (v1.10.3).</p>
  </li>
  <li class="li">
    <p><a class="link" href="https://github.com/weaveworks/weave#installation" target="_blank">Weave binary</a> on local and remote machine:</p>
    <p class="monospace"><code>sudo curl -L git.io/weave -o /usr/local/bin/weave</code></p>
    <p class="monospace"><code>sudo chmod a+x /usr/local/bin/weave</code></p>
  </li>
  <li class="li">
    <p><a class="link" href="https://beta.docker.com/" target="_blank">Docker for Mac</a> installed locally (similar steps can be followed if connecting from a Linux machine).</p>
  </li>
</ol>

<p class="em">Note: You don’t need to have Weave running beforehand; we can dynamically attach the Weave network to any existing container.</p>

<h3 class="h3">Step 1: Set up Weave network routers and proxy</h3>

<p>The first step is to set up our Weave overlay network so that we can connect to it from our local machine.</p>

<p class="strong">Remote machine:</p>
<ol class="ol"><li class="li">
    <p>Launch Weave router: <a id="footnote-1-source" href="#footnote-1" class="link">[1]</a></p>
    <p class="monospace"><code>weave launch-router --password &lt;password&gt;</code></p>
    <p>This will pull the latest Weave images and start the Weave router container. The password field is optional but recommended to prevent others from accessing your network while you are debugging.</p>
  </li>
  <li class="li">
    <p>Launch Weave proxy:</p>
    <p class="monospace"><code>weave launch-proxy</code></p>
    <p>This proxy will automatically attach your IP address. More info <a class="link" href="http://docs.weave.works/weave/latest_release/proxy.html" target="_blank">here</a>.</p>
  </li>
</ol><p class="strong">Local machine:</p>
<ol class="ol"><li class="li">
    <p>Test network connectivity of Weave ports:</p>
    <p class="monospace"><code>nc -z &lt;remote_host_ip_address&gt; 6783</code></p>
    <p>Ensure your firewalls and security groups allow Weave’s control port (TCP 6783) and data ports (UDP 6783/6784) on the remote machine to be accessible from your local machine. If you need to create an intermediate link, refer to <a id="footnote-2-source" class="link" href="#footnote-2">footnote #2</a>.</p>
  </li>
  <li class="li">
    <p>Launch Weave router on your local machine:</p>
    <p class="monospace"><code>weave launch-router --password &lt;password&gt; &lt;remote_host_ip_address&gt;</code></p>
    <p>If you set a password on the remote machine, ensure the same password is set here. <span class="monospace"><code>remote_host_ip_address</code></span> should be the IP address of the remote machine you set up above.</p>
  </li>
  <li class="li">
    <p>Verify Weave connection:</p>
    <p class="monospace"><code>weave status connections</code></p>
  </li>
  <li class="li">
    <p>Launch Weave proxy on the remote machine:</p>
    <p>If we were connecting from a Linux machine, we could use <span class="monospace"><code>weave launch-proxy</code></span>. However, we need to change this for Docker on Mac. The workaround is to tell Weave to listen on an HTTP interface:</p>
    <p class="monospace"><code>WEAVEPROXY_DOCKER_ARGS="-p 9999:9999" weave launch-proxy -H tcp://0.0.0.0:9999</code></p>
    <p><span class="monospace"><code>WEAVEPROXY_DOCKER_ARGS</code></span> tells Weave to publish to port 9999 so the host has access to it, and the <span class="monospace"><code>-H tcp://0.0.0.0:9999</code></span> tells Weave to listen on port 9999. If port 9999 is used on your machine, you can change it to any port, but ensure you replace 9999 with your port throughout the following steps.</p>
  </li>
</ol>

<h3 class="h3">Step 2: Launch containers into Weave network</h3>

<p>Now that we have the Weave routers and proxy set up, we need some containers to talk to. In this example I will use a MongoDB container.</p>

<p class="strong">Remote machine:</p>
<ol class="ol"><li class="li">
    <p>Configure Docker client to go through the Weave proxy.</p>
    <p class="monospace"><code>eval $(weave env)</code></p>
    <p>That command will set the <span class="monospace"><code>DOCKER_HOST</code></span> environment variable to point to the Weave proxy. <span class="em">Note: You’ll have use the same terminal session, or that variable will get unset</span>.</p>
  </li>
  <li class="li">
    <p>Run MongoDB container</p>
    <p class="monospace"><code>docker run -d --name=remote-mongo mongo</code></p>
    <p>The <span class="monospace"><code>--name</code></span> value is important here. It will be the hostname used to connect to this container. Notice that I did not expose any ports. Exposing ports to the host is not needed since all traffic to this container will be going through Weave. If you want to connect to an existing container, refer to <a id="footnote-3-source" class="link" href="#footnote-3">footnote #3</a>.</p>
  </li>
</ol><p class="strong">Local machine:</p>
<ol class="ol"><li class="li">
    <p>Configure our Docker client to go through the Weave proxy.</p>
    <p>We also need to setup the Mac Docker client to point to our proxy. This is a bit tricky since we did a custom proxy configuration.</p>
    <ol class="ol"><li class="li">
        <p>Obtain <span class="monospace"><code>docker.local</code></span> IP address:</p>
        <p class="monospace"><code>ping -c1 docker.local</code></p>
      </li>
      <li class="li">
        <p>Set <span class="monospace"><code>DOCKER_HOST</code></span> environment variable:</p>
        <p class="monospace"><code>export DOCKER_HOST=&lt;docker.local_ip_address&gt;:9999</code></p>
        <p><span class="monospace"><code>docker.local_ip_address</code></span> should be the IP address returned from the ping command. Same note from above — you have to say in the same terminal session or that variable will get unset.</p>
      </li>
    </ol></li>
  <li class="li">
    <p>Create a port forward container</p>
    <p class="monospace"><code>docker run -e REMOTE_HOST=remote-mongo -e REMOTE_PORT=27017 -p 27017:80 -d djfaze/port-forward</code></p>
    <p>In order to gain access to the remote machine, we need to set up a simple port forwarding container on our local machine. I used <a class="link" href="https://hub.docker.com/r/djfaze/port-forward/" target="_blank">this image</a>, which requires the following options to be passed to the <span class="monospace"><code>docker run</code></span> command:</p>
    <ol class="ul"><li class="li">
        <p class="monospace"><code>-e REMOTE_HOST=&lt;remote_container_name&gt;</code></p>
        <p>where <span class="monospace"><code>remote_container_name</code></span> is set to the hostname or Weave IP you want to forward to. Since we started the remote container with <span class="monospace"><code>--name=remote-mongo</code></span>, Weave DNS will resolve that name to the Weave IP address.</p>
      </li>
      <li class="li">
        <p class="monospace"><code>-e REMOTE_PORT=&lt;remote_container_port&gt;</code></p>
        <p>where <span class="monospace"><code>remote_container_port</code></span> is set to the port you want to connect to.</p>
      </li>
      <li class="li">
        <p class="monospace"><code>-p &lt;host_port&gt;:80</code></p>
        <p>where <span class="monospace"><code>host_port</code></span> is set to the port on your local machine you want to map to the remote container.</p>
      </li>
    </ol><p>The above example maps the local machine’s port 27017 to the remote container’s MongoDB port 27017.</p>
  </li>
</ol>

<h3 class="h3">Step 3: Connect and Play</h3>

<p>After everything is set up, <span class="monospace"><code>docker.local:27017</code></span> will point to the remote MongoDB container. I can now run my sample app server locally with all my local tools and simply configure my application to <span class="monospace"><code>docker.local:27017</code></span>. Integrating this with Runnable allows me to develop on my local machine with my entire isolated production stack without affecting anyone else, speeding up my feature development and bug bashing.</p>

<p>Using this technique, you can easily connect your local development machine to a staging environment and debug services just like you’d debug code locally.</p>

<p id="footnote-1" class="footnote">1: Weave’s default subnet is <span class="monospace"><code>10.32.0.0/12</code></span>. If your subnet overlaps, you will run into some issues. Add <span class="monospace"><code>--ipalloc-default-subnet &lt;subnet&gt;</code></span> and <span class="monospace"><code>--ipalloc-range &lt;subnet&gt;</code></span> to the Weave launch command where <span class="monospace"><code>subnet</code></span> is a CIDR for a non-overlapping network. <a class="link" href="#footnote-1-source">↩</a></p>

<p id="footnote-2" class="footnote">2: If your application is on a private network, you can create an intermediate link with a server on a public network that can talk to your private network. On the intermittent server, run <span class="monospace"><code>weave launch --password=&lt;your password&gt; &lt;ip_addr_of_private_host&gt;</code></span> and on your local, run <span class="monospace"><code>weave launch --password=&lt;your password&gt; &lt;ip_addr_of_intermediate_server&gt;</code></span>. <a class="link" href="#footnote-2-source">↩</a></p>

<p id="footnote-3" class="footnote">3: If you already have a container running and would like to attach to it, use <span class="monospace"><code>weave attach &lt;container_ID&gt;</code></span>. Note that DNS will not work. You will have to use the IP address returned from the <span class="monospace"><code>attach</code></span> command to connect. When using the port forwarder, use <span class="monospace"><code>-e REMOTE_HOST=&lt;weave_ip&gt;</code></span> where <span class="monospace"><code>weave ip</code></span> is the address returned from the <span class="monospace"><code>weave_attach</code></span> command. <a class="link" href="#footnote-3-source">↩</a></p>
