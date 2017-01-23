---
layout: post
title: Runnable RC and Pricing
author: yash_k
category: Announcements
excerpt: 'We’re very excited to announce that Runnable is now in Release Candidate. The progress we’ve made far exceeds our Beta and Preview releases, and will prepare us for the weeks ahead. Here’s what’s new:'
legacy_url: http://blog.runnable.com/post/149405018916/runnable-rc-and-pricing
---

We’re very excited to announce that Runnable is now in Release Candidate. The progress we’ve made far exceeds our Beta and Preview releases, and will prepare us for the weeks ahead. Here’s what’s new:

### Stability and performance

During our preview period, our team has doubled down on stability improvements. In summary,

1. We improved queue handling to prevent builds from getting backed up, resulting in faster builds and quicker container deployments.
2. We’ve worked to make our state machine fault-tolerant, so containers always resolve to the correct branch commit and status.
3. We improved failover handling to transparently resolve underlying EC2 failures.
4. We shipped new [canaries](http://blog.runnable.com/post/141863901521/testing-your-app-on-a-budget) to ensure containers are always networked correctly.

### Usability improvements

The feedback we’ve collected from our Preview users has helped us identify usability gaps in our product. Here are a couple of key improvements we’ve made.

#### Branch filtering

<img src="https://s3-us-west-1.amazonaws.com/runnable-design/filter.png" class="post-graphic" width="390" height="467" alt="image">
We added a filter above the environments list to help you find your branch environment faster. This is also useful for teams that use longer, more descriptive branch names.

#### Pull request message updates

<img src="https://s3-us-west-1.amazonaws.com/runnable-design/runnabot.png" class="post-graphic" width="660" height="116" alt="image">
We also clarified the messaging that Runnabot provides on the Pull Request page. Status indicators for each container in an environment provide you with useful information before verifying changes.

### Billing & trial experience

Our shift to RC ends our free preview period and the start of enabling payments for Runnable. This wasn’t that exciting to build, but it’s necessary to keep ourselves operational. Our billing experience allows you to add a payment method, view your upcoming balance, and view past invoices.

Starting now, every team will get their first 14 days of Runnable free. As long as you add a valid payment method before that time, service will remain uninterrupted. We’ve put a great deal of effort thinking through this experience, and we look forward to hearing how we can make it even better.

### Pricing

To coincide with billing, we are also publicly announcing pricing. We believe your team should never have to worry about environments, and our plans keep that in mind. All of our plans provide unlimited full-stack environments for a simple, predictable price per developer (3-user minimum).

Our three pricing plans align with your application’s complexity:

* **Starter** — up to 2 configuration templates; $9 per user/month
* **Standard** — up to 7 configuration templates; $29 per user/month
* **Plus** — up to 15 configuration templates; $49 per user/month
A configuration template is a service such as a repository or a database. An Enterprise plan is in the works for teams that require more than 15 configuration templates or need to keep code behind their firewall. Visit our [Pricing page](https://runnable.com/pricing) for more details. One final note: teams that sign up before Runnable announces general availability will be eligible to receive 50% off for 6 months.

A Release Candidate may be a bit outdated for a SaaS company, but we feel it best describes our current state. Thank you for using Runnable during our beta and Preview. We couldn’t have reached this milestone without you, and we hope you share some of the excitement we have towards the weeks ahead as we move closer to general availability.
