---
layout: post
title: How to Improve Your User Onboarding Flow
author: sohail_a
category: Engineering
excerpt: 'No matter how high your <a href="https://en.wikipedia.org/wiki/Click-through_rate">CTR</a>s are on your advertising, it won’t translate into active users without an onboarding flow that helps users quickly understand the value of your product. This is what we’ve been focusing on now that Runnable is generally available. Here’s the approach we’ve been using to help more users “see the light”.'
---

No matter how high your [CTR](https://en.wikipedia.org/wiki/Click-through_rate)s are on your advertising, it won’t translate into active users without an onboarding flow that helps users quickly understand the value of your product. This is what we’ve been focusing on now that Runnable is generally available. Here’s the approach we’ve been using to help more users “see the light”.

### 1. Define your audience

Our product is designed to cater to a specific group of users, so any improvements should be focused on helping that audience get to its value. Before deciding what needed to be improved, we had to firmly define who our audience is.

For example, our audience:

* Is a developer with a GitHub account (ideally, has a Github Organization)
* Works in a development team (ideally, part of a software company)
* Works on a web application (ideally, a multi-tiered application with different services, databases, and/or caches)

Without defining your audience, you’ll find yourself wasting time and resources attempting to cater to unqualified leads.

### 2. Determine how you can best show the audience your value proposition

Our team coined the term “_aha! moment_” to describe the keystone event that we believe a user needs to experience in order to be sold on our product. For us, it’s when they add their first branch to Runnable. This event doesn’t define our whole product offering, but more than any other moment, it captivates prospective users and helps them envision how their workflow would be improved with Runnable.

Your _aha! moment_ should have a similar effect. You may feel that you have multiple key events, but your _aha! moment_ is the earliest point at which your product “clicks” for prospective users.

### 3. Traverse your product and identify user action

The purpose of this step is to note down every point in your product where the user has to take an action in order to experience your _aha! moment_. In fact, we went so far as to print a screenshot of every one of these actions and display them on the wall. This helped the whole team get a zoomed-out perspective of the flow we were trying to improve. In addition, it became immediately obvious that we could reduce any unnecessary actions and simplify existing steps for prospective users.

### 4. Find the pain points that cause users to get stuck 😠 or drop-off 😢

In order to successfully track users’ progress toward our _aha! moment_, we used [MixPanel](https://mixpanel.com/) to track specific actions in the product. Initially, we were using this data to help customers when they reached out for support, but we realized that we could also use this information to gain insight on how new users interacted with our product.

<img src="https://s3-us-west-1.amazonaws.com/runnable-design/funnel.png" width="855" height="397">

<small class="grid-block small text-center text-gray caption">Example of a dropoff point on a MixPanel user funnel. Each bar represents the number of users that made it to a specific step.</small>

We also started using [Fullstory](https://www.fullstory.com/), which lets you watch your user’s actual experiences as if you were looking over their shoulder. This was a game-changer for us. When reviewing the funnels we’d created in MixPanel, it was easy to assume that people were progressing through each step in a neat, sequential order.

Fullstory gave us a different perspective. Some users were following the path we’d designed, while others were getting stuck in loops, or starting down one path, only to go back and try another. Watching what it really looks like for someone to try your product is a great way to challenge your assumptions and gain better insight into the  problems you can solve.

### 5. Eliminate or iterate on dropoff points

Once you’ve identified your drop-off points, you can start making changes with confidence that you’re focusing on the right areas. Every action your users must take before getting value from your product is point where they may turn away, so be ruthless in cutting out actions that aren’t critical to reaching your _aha! moment_.

If you can’t eliminate an action, you can still iterate on it by making a change that you think will help your users move forward. For example, our product authenticates through GitHub, so we can’t remove that that step or directly make changes to it. But we’ve iterated on ways to prime our users so they can more clearly understand what they need to to do when we send them to GitHub and why they need to do it.

When making a change, make sure you’ve identified in advance what changes you hope to see in your users’ behavior, and make a plan to follow up on the results after you ship. Keep in mind that bad results are still good data — any change in user behavior is something you can learn from that will help you continue to iterate on your funnel.

### Conclusions

Improving your onboarding flow will be a never-ending exercise. You see it on the many products that we use on a daily basis with their ever-changing landing pages and user dashboards. The good thing to note is that with a little user tracking, you can tweak and refine your product to best serve your users. Make sure to maintain who your desired audience is and ensure that they are being directed to the most captivating moments in your product. Good luck!
