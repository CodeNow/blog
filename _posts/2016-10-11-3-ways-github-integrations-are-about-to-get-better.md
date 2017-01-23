---
layout: post
title: 3 Ways GitHub Integrations are About to Get Better
author: nathan_m
category: Engineering
excerpt: 'Recently, GitHub announced a <a href="http://t.umblr.com/redirect?z=https%3A%2F%2Fdeveloper.github.com%2Fchanges%2F2016-09-14-Integrations-Early-Access%2F&t=NmRmMjU0MDQ0YjZjM2E1ZGE3YzQwZjE3M2VlNGM1MDgzNzViMDUyNSx2eTI4TGdmbA%3D%3D&b=t%3ANYUWSMP8glLS4tRmPIbrNA&m=1" class="link">totally new way</a> for applications to integrate with its service. This will allow applications to act as independent entities on GitHub. Currently, applications must always impersonate a user who has the necessary permissions to perform a given action. It can be a headache managing which user an application needs to impersonate in order do the work it needs to do. GitHub’s recent change affects how applications can receive webhooks, how they interact with users, and how they connect to GitHub. Here are three ways Integrations will be easier to implement and maintain.'
legacy_url: http://blog.runnable.com/post/151647975206/3-ways-github-integrations-are-about-to-get-better
---

Recently, GitHub announced a [totally new way](http://t.umblr.com/redirect?z=https%3A%2F%2Fdeveloper.github.com%2Fchanges%2F2016-09-14-Integrations-Early-Access%2F&t=NmRmMjU0MDQ0YjZjM2E1ZGE3YzQwZjE3M2VlNGM1MDgzNzViMDUyNSx2eTI4TGdmbA%3D%3D&b=t%3ANYUWSMP8glLS4tRmPIbrNA&m=1) for applications to integrate with its service. This will allow applications to act as independent entities on GitHub. Currently, applications must always impersonate a user who has the necessary permissions to perform a given action. It can be a headache managing which user an application needs to impersonate in order do the work it needs to do. GitHub’s recent change affects how applications can receive webhooks, how they interact with users, and how they connect to GitHub. Here are three ways Integrations will be easier to implement and maintain.

### 1. Granting Permissions

The most fundamental area GitHub overhauled is how permissions work. Currently, whenever an application wants to perform an action in an organization using the GitHub API, it has to impersonate an authenticated user who has the necessary permissions. This means applications are burdened with validating which of their users have the necessary permissions for which actions.

Furthermore, a user’s permissions can change over time, or they could even be removed from an organization entirely, so the system must be robust enough to handle every case. In the new paradigm, an Integration can act on its own once it is installed, using the permissions it has been granted.

### Integrations as Independent Entities

The fact that applications are limited to impersonating users means they are severely constrained when it comes to interacting on GitHub. For example, we have a bot that leaves helpful comments on pull requests. The most direct way to implement this would have us leaving automated comments on behalf of our users. We decided against this route because we thought it would be disorienting and misleading for teams to see automated comments left by one of their team members.

In order for our application to post as its own user, we had to create a GitHub account for the bot, and require our users to add the bot to their organizations. Not only did this require implementing services to automate this process, but in GitHub’s pricing model, it also requires our users to pay for our bot as a member of their organization. With Integrations, [our app has the ability to act as a bot](http://t.umblr.com/redirect?z=https%3A%2F%2Fdeveloper.github.com%2Fearly-access%2Fintegrations%2F%23first-class-actors&t=ZmQwODJiMzRkZWEyN2M0MmExMTkxNTlmNDc5ODM1MDhiYzM2OGE0Yix2eTI4TGdmbA%3D%3D&b=t%3ANYUWSMP8glLS4tRmPIbrNA&m=1) on its own, so it can comment on pull requests, create issues, or do anything else a user with its permissions could do.

### Getting Hooked

Webhooks have become a fundamental part of GitHub’s usefulness since their inclusion back in 2012. As they’ve iterated on their API over the years, they’ve expanded how much applications can do with them. But because this has been iterative, webhooks are kind of a mess. Organization level events happen on their own webhook, while each individual repository is given its own hook as well. If you need to update the scope on all of your application’s hooks, you have to update each one individually.

With Integrations, webhooks now take center stage. Webhooks are created by default when an application is given access to a repository, but users have been given finer control over which which events to push, and what actions the Integration can do in response. This will save a ton of development effort from having to design your application to handle all of these different cases. I know we’re going to keep this in mind as we’re planning in the future.

### Room for Improvement

I think it’s safe to say that GitHub has been working very hard to make sure their next iteration of their API is very developer friendly. While implementation will be simplified, I can see a few issues that I hope they improve before it’s done.

As of right now, the authentication story with Integrations is very thin. The only way for a user to authenticate with your application without using OAuth is by requiring the user to click on a link from inside of GitHub. This has drawbacks compared to the traditional model of users navigating to your company’s site to log in. It’s unclear what the path will be for applications (like ours) that use GitHub OAuth but also want to take advantage of the improvements offered by Integrations.

Another issue could come from rate-limiting. Currently, each user’s individual access token has a limit of 5000 requests per hour, and your application has its own limit of 5000. Now, each installation of an Integration (onto a specific GitHub account or organization) has a limit of 5000, and that’s it. If you were already having rate-limiting issues, I don’t think this is going to help. I think this is move is intended to encourage Integrations to rely on the webhook data more, instead of requesting everything all the time.

### Conclusion

Since this is still a developer preview, all of this is subject to change. I think, however, that this is a preview of the fundamental changes GitHub is imagining for their API. We’re still very far away from this going into production. If you are about to start building a new application, I’d heavily suggest reading through [all of the differences](http://t.umblr.com/redirect?z=https%3A%2F%2Fdeveloper.github.com%2Fearly-access%2Fintegrations%2Fintegrations-vs-oauth-applications%2F&t=ZjkxYTJjZmM5NzVmMDBhNmFkZWI4ZWY5MWY3NzU4YWExYTlhOWY0Myx2eTI4TGdmbA%3D%3D&b=t%3ANYUWSMP8glLS4tRmPIbrNA&m=1). Building it as a new Integration may save you a bunch of development time, but I’m not suggesting it’s production-ready. It’s still a preview, after all. Overall, we’re excited to see these changes (and the GraphQL changes!), and can’t wait to implement them.
