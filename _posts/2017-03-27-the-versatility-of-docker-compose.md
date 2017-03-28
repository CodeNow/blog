---
layout: post
title: 'The Versatility of Docker Compose'
author: anton_p
category: Engineering
excerpt: '<div class="p">According to the <a href="https://docs.docker.com/compose/">official documentation</a>, Docker Compose is, “a tool for defining and running multi-container Docker applications.” However, I think one important detail is missing. Compose can also build your multi-container Docker applications.</div><div class="p">What is interesting is that Compose build and run functionality can be used completely independently. It isn’t opinionated, allowing it to be used it for different use cases and setups.</div><div class="p">I’m going to show you some of those use cases and how Compose can be beneficial in pretty much every setup.</div>'
date: 2017-03-27 17:30:00 -0800
---

According to the <a href="https://docs.docker.com/compose/">official documentation</a>, Docker Compose is, “a tool for defining and running multi-container Docker applications.” However, I think one important detail is missing. Compose can also *build* your multi-container Docker applications.

Docker Compose files are similar to Dockerfiles in that sense that they also have two sets of instructions: instructions for *building* images and instructions for *running* containers.

What is interesting is that Compose *build* and *run* functionality can be used completely independently. For example, you can just use Compose for building your applications or use it just for running if you already have images. It isn’t opinionated, allowing it to be used it for different use cases and setups.

I’m going to show you some of those use cases and how Compose can be beneficial in pretty much every setup.

### Architecture Agnostic

Docker Compose can be used for monolith and microservices architecture quite easily. Using Compose with monoliths is well documented. You can start with the official Compose Getting Started Guides ([Rails](https://docs.docker.com/compose/rails/), [Django](https://docs.docker.com/compose/django/), etc.) and you would be able to setup a monolith application connected to a database. Microservices are supported as well but have more variants that we are going to describe below.

### Repo-topology Agnostic
There are two main ways for people to organize source code around microservices architecture: the [monorepo](https://danluu.com/monorepo/) model and one-repo-per-service/multi-repo model (some variations of those two are also possible and are frequently met in the wild). Docker Compose works nicely with both.

#### Compose and Monorepos

Monorepos are more straightforward. In this case, you can use Compose for both building and running the same Docker applications. And all the builds can happen based on the local filesystem structure.

```yaml
version: '2'
  services:
  user-management-service:
    build:
      context: ./user-management-service
      dockerfile: Dockerfile
    ...
  billing-service:
    build:
      context: ./billing-service
      dockerfile: Dockerfile
    ...
  ...
```

#### Compose and Multi-Repos

Multi-repo setup has several options.

**Option number one** is to use a single Compose file just to run applications using images (and build images independently).

```yaml
version: '2'
services:
  user-management-service:
    image: example.com/user-management-service-image
    ...
  billing-service:
    image: example.com/billing-service-image
    ...
  ...
```

**Option number two** is to use one Compose file per repo/service. In this case, each Compose file will build one corresponding service and use images for other services.

```yaml
version: '2'
services:
  user-management-service:
    build: .
    ...
  billing-service:
    image: example.com/billing-service-image
    ...
  ...
```

**Option number three** is to have one global Compose file and use remote builds instead of images. This way Compose will *build* and *run* the whole stack.

```yaml
version: '2'
services:
  user-management-service:
    build: https://github.com/example/user-management-service#feature1
    ...
  billing-service:
    build: https://github.com/example/billing-service#feature1
    ...
  ...
```

There are several benefits to this last approach:

- You won’t need to create images in advance. Compose will build each service.
- You can build specific branches or commits for each service. So if you working on a feature that touches several services, all you need to do is to reference the correct branches.

### Environment Agnostic

Docker Compose is also environment agnostic, which means you can use it for:

- Local development: You can have reproducible build and run instructions for the whole stack.
- Staging and production: You can use the same file to run full staging and production environments.
- Testing: You can use Compose to define how to run your tests, from unit tests to end-to-end tests.

### Team Agnostic

Docker Compose can be used by different teams thanks to its versatility of features.

- Dev teams can use it to solve problems developers face: to run tests and to have reproducible and disposable dev environments.
- DevOps teams can use it to solve operation problems: to create builds, or to maintain and manage staging and production environments.

In a conclusion, I would like to say that Docker Compose is a very flexible tool. It can be used by teams with different architecture stacks and repositories topologies. It can be used by teams to solve different types of problems. This flexibility and lack of opinions (Docker Compose doesn’t try to dictate you how to do something) is a great advantage. However, this strength of Compose might be viewed in the future as its weakness, because flexibility might make the tool more difficult to learn, to establish best practices, and to know what features to avoid.
