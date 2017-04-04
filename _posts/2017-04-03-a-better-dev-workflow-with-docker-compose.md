---
layout: post
title: 'A Better Dev Workflow with Docker Compose'
author: sohail_a
category: Engineering
excerpt: 'As a follow-up to our previous post on <a href="the-versatility-of-docker-compose" class="link">the versatility of Docker Compose</a>, we wanted to emphasize how useful it can be to introduce Compose to your development workflow. Compose lets you take advantage of the benefits of Docker, while abstracting the complexity of your stack and of your Dockerfiles themselves. You may be used to running production images with Compose, but using it in development has benefits of its own.'
date: 2017-04-03 18:30:00 -0800
---

As a follow-up to our previous post on [the versatility of Docker Compose](the-versatility-of-docker-compose), we wanted to emphasize how useful it can be to introduce Compose to your development workflow. Compose lets you take advantage of the benefits of Docker, while abstracting the complexity of your stack and of your Dockerfiles themselves. You may be used to running production images with Compose, but using it in development has benefits of its own.

### Infrastructure as Code

Here’s an example `docker-compose.yml` file from a basic todo app:

```yaml
version: '2'
services:
  db:
    image: mongo
    ports:
      - "27017:27017"
  api:
    build: git@github.com/RunnableDemo/api.git
    ports:
      - "3000:3000"
    links:
      - "db"
    environment:
      MONGODB_HOST: db
  web:
    build: .
    ports:
      - "80:80"
    links:
      - "api"
    environment:
      API_HOST: api
```

This file “composes” all three tiers of our application (web, api, and db) in on easy-to-read file. In this example, our Compose file is tracked in the web repository. It builds the web repo from its local Dockerfile, and the api service is built from a Dockerfile in a remote git repository. This differs from production Compose files, which typically use pre-built images.

Each service in your Compose file is treated as a separate container that can be swapped in and out, so a developer can modify the file for their own purposes during development. For example, let’s say you are migrating your application database from using MongoDB to PostgreSQL. A developer can start a branch and modify the `db` service in the Compose file:

```yaml
version: '2'
services:
  db:
    image: postgres
    ports:
      - "5432:5432"
    ...
```

If other developers want to develop on this same branch, they can pull down the repository and invoke this new environment that’s conveniently tracked into source control.

### Portability

Compose lets you bring up a dev environment with one command: `docker-compose up`, and tear it down just as easily with `docker-compose down`. This allows any developer to pull down the web repository from GitHub, and just type `docker-compose up` to have the full stack application running without prior systems knowledge.

This is much different from just handing them a Dockerfile where they still need to build their images after each code change and also know how to run their images using the Docker daemon with the proper arguments.

Plus, when your `docker-compose.yml` lives in your repository, it can be used all over the place. You can create your own staging environments using Docker Cloud, Runnable, Sail, etc. with one Compose file.

### Testing

Another feature of using Compose for your development environments is that you can run your unit and end-to-end tests in a quick and repeatable fashion. Instead of running tests directly in your local OS, you can run them in an environment that very closely resembles your production environment, especially if you also use Docker in production.

To accomplish this, all you need to do is create a `command` override directive in your `docker-compose.e2e.yml`, and keep your existing Dockerfiles intact.

**E2E Tests (docker-compose.e2e.yml):**

```yaml
version: '2'
services:
  selenium:
    image: selenium/standalone-chrome
  web:
    ...
    command: npm run e2e
```

Then you would run your tests like so: `docker-compose up -f docker-compose.yml -f docker-compose.e2e.yml`. This command will inherit the infrastructure from your main docker-compose file and only override values from your test configuration.

Since these environments are disposable, you never need to worry about artifacts from previous builds or corrupt datasets. Each test runs in a brand new, clean environment.

### Drawbacks

Nothing is ever perfect, and with Compose there are a few speed bumps that you will run into. Image caching is very critical when building your images, as build times will affect development speed on your local machine. If you don’t cache dependencies and layer your Dockerfile efficiently, you’ll have to wait for slower builds when the cache is busted.

Another potential drawback is the tradeoff between development speed and the portability of your Compose file. Due to the nature of Docker, any file change requires a container to be rebuilt in order to add the latest code. To avoid this, you can mount your local filesystem to your containers using volumes, so modified files will be available without rebuilding:

```yaml
version: '2'
services:
  web:
    ...
    volumes:
      - ..:/app
```

This greatly speeds up development, but it makes your Compose environments non-idempotent and thus less portable.

### Conclusion

All things considered, the benefits outweigh the drawbacks. Using Docker Compose can significantly simplify the work needed to provision environments locally and repeatedly. For demanding application stacks that struggle to run on local dev, it’s just as easy to spin up your environment on the cloud.
