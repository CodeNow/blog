---
layout: post
title: Rethinking Our Development Pipeline
author: sundip_p
category: Engineering
excerpt: 'While building two products over the past four years, our team has grown in both headcount and dev speed. Adopting a process to improve our speed of development took us a while to get right. As we all reflect and make resolutions at the start of the new year, we think other teams might benefit from how we identified our slowdowns and improved our dev speed.'
legacy_url: http://blog.runnable.com/post/155416472416/rethinking-our-development-pipeline
---

<p class="p">While building two products over the past four years, our team has grown in both headcount and dev speed. Adopting a process to improve our speed of development took us a while to get right. As we all reflect and make resolutions at the start of the new year, we think other teams might benefit from how we identified our slowdowns and improved our dev speed.</p>

<h3 class="h3">Identifying Bottlenecks</h3>

<p class="p">To improve the speed of development in your team, you must first identify what’s slowing down your pipeline. Sounds easy, but it’s often difficult when your team grows accustomed to their current development habits.</p>

<p class="p">Through daily standups and regular team retrospective meetings, we’ve adopted a team driven process which helps us identify bottlenecks in our workflow. Our daily standups consist of brief status reports on work in progress, and our bi-monthly team retrospectives give us an opportunity to discuss highlights, lowlights, and solutions for improvement. Having a requirement to convert every lowlight mentioned into an actionable task for improvement has acted as a forcing function to fix our bad development habits.</p>

<h3 class="h3">Some of our Lowlights</h3>

<p class="p">Here are a few of the habits we’ve identified in our development process:</p>

<ol class="ol"><li class="li">
   <b>Waiting for a staging environment.</b>
   <br>When we first started building <a href="http://code.runnable.com" class="link">CodeSnippets</a>, we had three staging environments to test changes and obtain signoff before deploying them to production. Even then, some features were still blocked on staging! We were in the middle of creating a fourth environment when the idea of having a staging environment for all changes dawned on us.
 </li>
 <li class="li">
   <b>Fixing broken staging environments.</b>
   <br>At least one of our staging environments would always need fixing, which may in part be why three environments wasn’t enough. Faults in our staging environment were almost always due to a stateful component containing malformed data or an incorrect configuration value being set. Debugging and fixing a staging environment did little to move the needle with building essential features, and thus, would often get punted until after a major release was completed.
 </li>
 <li class="li">
   <b>Waiting on a code review.</b>
   <br>As we grew in developer headcount and lines of code, we ran into another bottleneck earlier than staging—code review. Peer reviewing every change has saved us from shipping bugs and sloppy code to production countless times. However, it came with the cost of slowing down our dev speed across all changes.
 </li>
</ol><h3 class="h3">Improving Dev Speed</h3>

<p class="p">There are several ways to address the issues listed above, and we’ve tried quite a few. Teams typically invest in automation, deployment scripts, managing environments, and the like to keep their development pipeline operational.</p>

<p class="p">Our experiences led us down the path of building <a href="/" class="link">Runnable</a>, and through the benefits of dogfooding, we’ve molded it to solve some of the issues we’ve faced in our own development cycle. Here’s how Runnable helps improve dev speed for our team:</p>

<ol class="ol"><li class="li">
    <b>Infinite staging environments.</b>
    <br>This has changed our pipeline dramatically. Rather than waiting for an environment to free up, each of our developers have their own staging-quality environment ready to use after creating a new git branch. Our environments help us with <a href="https://runnable.com/use-cases/peer-review-changes-in-your-application-stack-quickly/" class="link">several tasks</a>, such as trying out changes during reviews, viewing features while they’re still in development, demoing larger changes with the team, and running more tests (see below).
  </li>
  <li class="li">
    <b>Dockerizing our stack.</b>
    <br>We recognized early on using Docker would enable us to quickly provide clean, repeatable environments. <a href="/blog/running-runnable-on-runnable" class="link">To dogfood Runnable</a>, we dockerized all of our services (and <a href="/blog/9-common-dockerfile-mistakes" class="link">productized our learnings</a> in our setup flow for non-Docker experts). Coupled with the automation Runnable provides with building and running fresh environments on every code change, using Docker has effectively solved our broken staging environment problem. If an environment becomes broken during use, all we need to do is click “Rebuild” in Runnable.
  </li>
  <li class="li">
    <b>End-to-end testing <i>before</i> code reviews.</b>
    <br>We’ve invested in a few automation testing frameworks in the past to help with finding bugs before a manual review. This practice added increased pressure on our limited staging environments, and added additional steps to our development pipeline. Soon after we started dogfooding Runnable, we added support for running automated test on our environments. In short, we have our environments set up to run all of our automated tests anytime we push code to a branch. Runnabot, our GitHub bot, <a href="https://runnable.com/use-cases/finish-your-code-reviews-in-5-minutes/" class="link">posts environment URLs and test results</a> on the Pull Request page so developers know their PR meets the functional quality bar before asking their neighbor for a review.
  </li>
</ol><p class="p">Our tool of choice is biased, but there are <a href="/blog/testing-your-app-on-a-budget" class="link">several</a> ways to unlock greater dev speed. We hope our processes inspire your team to identify bottlenecks in your development pipeline. If your team’s lowlights are similar to ours, consider <a href="https://runnable.com/signup/" class="link">evaluating Runnable</a>. Your first 14-days are free, and you’ll enjoy great support from our entire team who build and dogfood our service every day. Promise :)</p>
