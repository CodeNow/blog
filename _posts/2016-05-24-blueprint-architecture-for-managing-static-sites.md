---
layout: post
title: Blueprint Architecture for Managing Static Sites
author: anton_p
category: Engineering
excerpt: 'I see Runnable as a very versatile, and therefore powerful, tool. It enables teams to deploy and run code on every commit. The concept sounds simple, but it lights up a vast number of not-so-obvious use cases.<br><br>For example, here’s how Runnable can be added to an existing revision workflow for static sites / blogs to improve how updates can be made.'
legacy_url: http://blog.runnable.com/post/144847158716/blueprint-architecture-for-managing-static-sites
---

<p class="p">I see Runnable as a very versatile, and therefore powerful, tool. It enables teams to deploy and run code on every commit. The concept sounds simple, but it lights up a vast number of not-so-obvious use cases.</p>

<p class="p">For example, here’s how Runnable can be added to an existing revision workflow for static sites / blogs to improve how updates can be made.</p>

<h3 class="h3">Context</h3>

<p class="p">Let’s say you’ve picked your favorite static site generator from <a class="link"href="https://www.staticgen.com/">this list</a>, and you’ve set up your blog / static site and have everything running locally. Now you need to deploy your site somewhere. There are plenty of options including <a class="link"href="https://aws.amazon.com/s3/">Amazon S3</a>, <a class="link"href="https://surge.sh/">Surge</a>, and <a class="link"href="https://www.firebase.com/docs/hosting/">Firebase Hosting</a>. You’re able to manually deploy your site easily enough from your local machine to your favorite provider, or you use continuous integration tools and deploy your site automatically with a flow like this:</p>

<ol class="ol"><li class="li">Push your content or revisions to the master branch on GitHub</li>
  <li class="li">CI/CD tools build/generate assets for static site</li>
  <li class="li">CI/CD tools push assets to your favorite hosting provider</li>
</ol>

<img class="img post-graphic" src="images/posts/static-before.png" width="470" height="276" alt="image">

<p class="caption">This workflow, while straightforward, lacks a simple solution for testing and sharing in-progress work.</p>

<h3 class="h3">Problem and Solution</h3>

<p class="p">This flow works great if you’re a single person working on your site. But once you start building your team, adding content writers, and needing multiple changes reviewed, it starts to show its limits pretty quickly. Satisfying these requirements is more challenging.</p>

<p class="p">Here’s how Runnable can help keep it simple. Below is a blueprint architecture proposal that enables teams that manage static sites and blogs to work together more efficiently.</p>

<p class="p">Here are the tools you’ll need:</p>

<ul class="ul"><li class="li">Static site generator of your choice</li>
  <li class="li">GitHub for hosting your source code and content</li>
  <li class="li">Runnable to build and run your site on every branch</li>
  <li class="li">CI/CD of your choice to automatically build and deploy site</li>
  <li class="li">Hosting provider of your choice</li>
</ul>

<p class="p">The only addition to this setup is Runnable. Here’s how the flow changes:</p>

<ol class="ol"><li class="li">Create a branch on GitHub and open a PR</li>
  <li class="li">Edit your content on GitHub. Tools like <a class="link"href="https://prose.io/">Prose.io</a> can make this easier.</li>
  <li class="li">Open / Share a link running your changes that Runnable adds on the PR page. That link can be sent to anyone for reviewing content, visual regressions, CSS problems or layout issues.<a id="footnote-1-source" class="link" href="#footnote-1">[1]</a></li>
  <li class="li">Merge the PR with your changes into the master branch.</li>
  <li class="li">CI/CD tool is triggered to publish new version of your static site to production</li>
</ol>

<img class="img post-graphic" src="images/posts/static-after.png" width="470" height="276" alt="image">

<p class="caption">With Runnable, every branch runs on a container with its own endpoint for testing and sharing.</p>

<h3 class="h3">Benefits</h3>

<p class="p">The obvious benefit to this flow is with unblocking your team to collaborate by providing live instances of their changes as they push them. Using pull requests enables your team to easily view a log of what’s changed for every branch. It also enables integration with other tools into the flow. For example, you can integrate a spell checker that will run on every change and mark the PR status to fail if any misspellings were found.</p>

<p class="p">Runnable enables some improvements here:</p>

<ul class="ul"><li class="li"><span class="em">Automatic</span> live instances of each change on every branch for faster reviews</li>
<li class="li">Exposing the instance URL on the pull request page for easy access</li>
<li class="li">Restricting access to these live instances for security (not supported by GitHub Pages at the time of this writing)</li>
</ul>

<h3 class="h3">Downsides</h3>

<p class="p">Although this solution is quite sound for publishing content, it does have some downsides. This flow is ultimately enabled by configuring a series of tools, each of which requires some level of understanding on how it operates. As with any other tool, you’d also need to learn how to configure Runnable. For those who use Docker, Runnable automatically imports Dockerfiles from your repository and uses it to build and run your container. (Runnable also has a setup flow for non-Docker users as well.) It goes without saying that a single tool that enabled this flow would be preferred for teams in general.</p>

<h3 class="h3">Conclusion</h3>

<p class="p">There are a lot of tools that can enable content creators to collaborate on the static sites in a more scalable way. Composing great tools together allows us to enable new use cases beyond any one’s original scope. Although this philosophy is far from original, (think about UNIX philosophy where the real power there is in the composition of simple tools) it can be beneficial and exciting to explore what’s possible.</p>

<p id="footnote-1" class="footnote">Runnable receives a webhook from GitHub when you push your changes, which triggers a build and launches a container with your changes automatically. After your container is running, Runnable adds the link to the branch’s PR page for review. <a class="link" href="#footnote-1-source">↩</a></p>
