---
layout: post
title: Finding the Root Cause of Elusive Frontend Errors
author: ryan_k
category: Engineering
excerpt: Frontend applications always have a multitude of user interactions and flows for how a user can get to a particular state. Sometimes these states are not intended and errors happen. Errors can be incredibly difficult to track down, so a reliable process for finding the root cause of an error can save a lot of time and confusion. Our process involves using a few services in conjunction.
---

Frontend applications always have a multitude of user interactions and flows for how a user can get to a particular state. Sometimes these states are not intended and errors happen. Errors can be incredibly difficult to track down, so a reliable process for finding the root cause of an error can save a lot of time and confusion. Our process involves using a few services in conjunction.

### Raw Error Reporting

Raw error reporting is the foundation for any error handling process. Without it, we don’t know when an error has occurred. For this, we use [Rollbar](http://t.umblr.com/redirect?z=https%3A%2F%2Frollbar.com%2F&t=NGFkODdkMzJhMmY5YTYzZmMyMjA4YTJlMWFkNDUzNjdjZDJlOTRiOCxGSVIwZ0xxZw%3D%3D&b=t%3ANYUWSMP8glLS4tRmPIbrNA&m=1) and [TrackJS](https://trackjs.com/). They serve similar purposes, but each has its own strength.

Rollbar reports errors to our team through its Slack integration. It also triggers [PagerDuty](https://www.pagerduty.com/) alerts for particularly important errors. When addressing a particular error, it helps us identify when a bug was introduced and how often it happens. Rollbar lets us see global trends across particular deploys, which helps us identify the specific code version that introduced a given bug. We use Rollbar in all our microservices, so our reporting logic is consistent across the board.

Here, Rollbar is showing us a particular error that’s happening often, after a period of inactivity.

<img src="https://s3-us-west-1.amazonaws.com/runnable-design/error-graph.png" width="369" height="216">

From there, Rollbar can show us which deploy it thinks caused this error. This is a big step toward identifying the root cause.

<img src="https://s3-us-west-1.amazonaws.com/runnable-design/error-deploy.png" width="600" height="129">

Once we’ve gotten this far, we use TrackJS to take a closer look at what may be causing the error in the first place. One of the awesome features that TrackJS has is the ability to navigate a timeline of errors. This allows us to walk up the page and find the original error the user experienced so we can see if the one we’re looking at was really caused by an error that happened earlier.

<img src="https://s3-us-west-1.amazonaws.com/runnable-design/error-timeline.png" width="665" height="384">

Once we’re looking at the right error, we can check out the stack trace. Typically, this gives us a clear enough picture of the issue and is all we need to know to start addressing it. But sometimes, even with all this raw data, it can be hard to figure out how the user could have gotten into a particular state.

### When It’s Not Enough

Maybe an error was caused by the user taking actions with a specific timing or in a context that we didn’t anticipate. In some scenarios the only real way to reproduce an issue is to sit over the user’s shoulder and watch them interact with the application. In these cases, we use [FullStory](https://fullstory.com/), which allows you to see a video of a user’s interaction on your site, including the console output with any errors that occurred along the way.

We initially implemented FullStory to watch user interactions along our onboarding funnel. But once we had it implemented, we realized it was the perfect tool for helping us identify the root cause of errors that are particularly difficult to reproduce. Since all of our error tracking tools tag errors with the ID of the current user, we can find them in FullStory to see a replay of them encountering the error.

### The Combination

Bringing all these things together, we can now get timely notifications of errors, raw stack traces, HTTP request orders, and videos of user interactions. With all of this data, we’re equipped to isolate any issues and quickly start addressing them.

Of course, just responding to errors is not ideal. We try to have automated testing for every piece of code. As with any product though, users will use it in ways which you have not considered, finding novel ways to break your precious logic in the process. By using these tools in conjunction, you can triage any new states with ease.
