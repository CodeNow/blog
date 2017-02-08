---
layout: post
title: 'How We Made Builds Faster for Our New Users'
author: sohail_a
category: Engineering
excerpt: '<p class="p">We’re always trying to eliminate points of drop-off in our onboarding flow — we want to show value as quickly as possible to new users. Recently, we applied some unconventional methods to make this happen.</p><p class="p">The first thing a user experiences in Runnable is our demo. Our app builds environments for git branches. We want users to see what that’s like right off the bat, so we start them off with a demo application. Since it’s tied to a repository on their own GitHub account, we can’t build it in advance, which means they have to wait for it to build.</p>'
---

We’re always trying to [eliminate points of drop-off](http://blog.runnable.com/post/151976507756/how-to-improve-your-user-onboarding-flow) in our onboarding flow — we want to show value as quickly as possible to new users. Recently, we applied some unconventional methods to make this happen.

The first thing a user experiences in Runnable is our demo. Our app builds environments for git branches. We want users to see what that’s like right off the bat, so we start them off with a demo application. Since it’s tied to a repository on their own GitHub account, we can’t build it in advance, which means they have to wait for it to build.

On average, building this demo application would take two minutes, while some faster builds took only one minute. But we saw that one in four users who started their first build would drop off before the one-minute mark. To get more people to see the demo, we were going to have to speed up our builds.

### Our first attempt: Baking Docker images into our AMIs

The first thing we attacked was the time spent pulling down Docker images. All our demo apps are based on images from Docker Hub. We couldn’t make these download any faster, but since we had [our own EC2 instance dock pool](how-were-spinning-up-our-aws-infrastructure-80-faster), we *could* download them in advance.

So on every Docker host we created, we [pre-pulled the most commonly used Docker images](how-we-pre-bake-docker-images-to-reduce-infrastructure-spin-up-time) before allocating it to a new user. This sped up builds for our demo apps (and for common web frameworks, databases, key-value stores, etc.) by shifting the download time from during the build to during dock spin-up — a great trade because we spin up docks in advance for our users.

Why is this important? Let me give you an example. In the not so distant past, we had a small incident where a pool of Docker hosts had cached an older version of our image-builder service. As a result of this stale image, the first build for a group of customers was unnecessarily delayed by 26 seconds in order to pull the proper version. When we are dealing with user drop-off, every second counts, let alone 26 of them.

### Getting it right: Building app dependencies into our Docker images

The above step helped, but not as much as we had hoped. We still had to wait for the Docker image build to install necessary OS packages/libraries and codebase dependencies/libraries. In order to build an image on a brand new machine, you first have to go through several slow steps:

1. Pull down the base image: `FROM ruby:2.3.1`
2. Install OS packages: `RUN apt-get update && apt-get install …`
3. Install Codebase dependencies: `RUN bundle install`

These steps can add up. Here is where we had to get a bit messy and take things one step further. Instead of caching base images from Docker Hub, we decided to create custom base images specifically for our demo applications, and cache those. These base images would include all the necessary OS and codebase dependencies, making builds much faster.

*Note: We chose this approach because fast builds were especially important to us in this case. This probably isn’t the case for your application. Baking dependencies into your Dockerfiles is not a good practice — even though it can speed up builds, you’ll end up with stale libraries and dependencies, which can have severe implications on your codebase.*

Here’s what we did:

First, we had to write the Dockerfile for our new base image. This time, it would also include our demo app’s OS and codebase dependencies:

```
FROM ruby:2.3.1
# Install OS dependencies
RUN apt-get update -qq && apt-get install -y build-essential libpq-dev nodejs
RUN mkdir /app
WORKDIR /app
# Cache dependency install
ADD Gemfile /app/Gemfile
ADD Gemfile.lock /app/Gemfile.lock
RUN bundle install
```

Then we built this image and pushed it to our registry:

```
$ docker build . -t runnable/rails-starter
  ...
$ docker push runnable/rails-starter
```

Now we could base our demo apps on this new base image:

```
FROM runnable/rails-starter
# Add repository
ADD . /app
# Run migrations and start server
EXPOSE 3000
CMD rake db:migrate && rails server -b 0.0.0.0
```

### Conclusion

By caching so much in our base images, we ended up losing a lot of useful info in the build logs for our demo apps. This is an unfortunate loss of transparency, but in our case it has been worth it. These steps reduced our average demo build times from two minutes down to thirty seconds, significantly reducing drop-off. Sometimes unconventional methods are worth the trade-offs.
