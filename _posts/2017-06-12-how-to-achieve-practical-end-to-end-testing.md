---
layout: post
title: 'How to Achieve Practical End-to-End Testing With Docker Compose'
author: praful_r
category: Engineering
excerpt: 'Now that Kubernetes and Docker support software defined orchestration, end-to-end (E2E) testing has finally become a practical reality. We’ll walk through the biggest issue with maintaining and running E2E tests: the speed and hassle of spinning up a full-stack environment. Then we’ll cover how containerization solves single service environment problems, but not the full-stack environment problems E2E tests need. And finally, introduce software defined orchestration as the panacea and exemplify the practicality of this approach through an example.'
date: 2017-06-12 12:00:00 -0800
---

Now that Kubernetes and Docker support software-defined orchestration, end-to-end (E2E) testing has finally become a practical reality. The speed and hassle of spinning up a full-stack environment is the biggest issue with maintaining and running E2E tests. Containerization solves the issues for single service environments, but not the full-stack problems E2E tests have. Let’s walk through these issues, and finally introduce software defined orchestration as the panacea and exemplify the practicality of this approach.

Most modern apps are maintained as a collection of services that a development team authors and maintains. For these teams, automated tests fall under two categories:

1. Unit Tests: Tests that run against just 1 of the services (with connections to databases and datastores).
2. End-to-end Tests: Tests that run against a collection of the services.

### The Need for Speed

Gone are the days when sprints were locked down and there were several days allocated for tests before shipping a product. Today’s development practices call for breakneck development speeds.The requirement of speed comes from 2 workflow requirements:

1. Test execution: For contemporary developers, turning business needs into shipped features is a daily regimen. This calls for a revamp on how testing is handled in the software delivery process. With such speedy deliveries, developers require quick isolated executions of their tests. And in an ideal world, they would be able to verify the results of their tests immediately after pushing a change so that they can continue to push their change to production.
2. Test maintenance: As the code and UI evolve, tests need to be updated with new assertions and cases. Any iterations require testing with short execution times.

The long wait time and effort it takes to spin up a full-stack environment is the major reason teams are unable to implement a maintainable automated E2E testing workflow.

### Ideal Tests Environments

1. Repeatable configuration: Minimal work should be required to set up the dependencies and versions of the required OS and tools. The environment should also be ready to run the code and test, including having the data required for this test seeded and ready to be used.
2. Isolated: During the execution of the test, there should be no unplanned script/binary/service running in the environment.

### Vanilla Containerization and Unit Tests

Before Docker and containerization, developers used shared databases for their unit tests and the tear up/down of their full-stack environments was managed by scripts (such as Chef and Ansible).

With Docker containers, developers now have an easy way to spin up sandboxed environments with one or two services running. In a Dockerfile, you can configure your service under test, its basic dependencies, and the test framework. Once defined, the desired environment and test framework can spin up instantly after only building the updated portions of code. This enables speedy test spin up as one iterates through development.

Now developers can easily maintain and run tests such as unit/BDD/functional to match today’s ship speeds. However, E2E tests require more than simple containerized environments. E2E tests require the successful launch of multiple services, each running in their own containerized environments with their own dependencies.

### Enter Docker Compose & Kubernetes Helm: Software Defined Orchestration

Developers needed a way to tie containers together so they can service their full-stack E2E tests. To solve that problem, open source communities came up with new formats to define container orchestration in files. The two most popular formats right now are Docker Compose and Kubernetes Helm.

The main functionality of these orchestration formats include:

* Being able to bring up and down multiple containers based on container images, as a single group.
* Being able to set run-time properties such as file system mounts, environment variables, commands and ports on each container. Setting the command is required to inject scripts to connect containers together.

With these orchestration formats, developers can now instantly spin up isolated full-stack environments locally to match their iteration speed. Armed with this, any teammate can author, run, and improve E2E tests with the same level of convenience and ease as unit tests.

### Trying It Yourself With Docker Compose

Let’s try this with a 3-tier app. The hardest part of the process is coming up with the initial Compose file. Here is a high-level diagram of what we are trying to instantiate with this Compose file:

![](images/posts/2017-06-12-ss1.png){:width="750"}

<p class="caption">Figure 1: E2E test topology.</p>

#### First: System Under Test

The first step is to ensure that your app is able to spin up using Compose syntax. In this example, our app is a 3-tier app composed of a Web, API, and DB container.

```yaml
version: '2'
services:
  db:
    build: Dockerfile.db
    ports:
      - '27017:27017'
  api:
    build: Dockerfile.api
    command: wait_for_it.sh localhost:27017 && npm start
    ports:
      - '3000:3000'
    links:
      - 'db'
    environment:
      - MONGODB_HOST: db
  web:
    build: Dockerfile.web
    command: wait_for_it.sh localhost:3000 && npm start
    ports:
      - '80:80'
    links:
      - 'api'
    environment:
      - API_HOST: api
```

<p class="caption">Figure 2: E2E test Docker Compose file excerpt for “System Under Test”.</p>

#### Second: Selenium Chrome &  E2E Test Agent

Next, we configure the 2 extra containers we need to run E2E tests: the headless browser (Selenium/Chrome) and the service actually running the test (e2e).

```yaml
chrome:
  image: selenium/standalone-chrome
  links:
    - 'web'
  ports:
    - '4444:4444'
  command: wait_for_it.sh localhost:80 && /opt/bin/entry_point.sh

e2e:
  build: Dockerfile.e2e
  command: wait_for_it.sh localhost:4444 && npm test
```

<p class="caption">Figure 3: E2E test Docker Compose file excerpt for “headless browser agent & test agent”.</p>

The tests that run in the e2e service are set up to look for the headless browser at “chrome:4444”. Excerpt from Selenium test:

```javascript
if (process.env.NODE_ENV === 'docker') {
  driver = new webdriver.Builder()
    .usingServer('http://chrome:4444/wd/hub/')
    .forBrowser('chrome')
    .build()
} else {
  driver = new webdriver.Builder()
    .forBrowser('chrome')
    .build()
}

describe('todo app', () => {
  before(function () {
    this.timeout(50000)
    return driver.navigate().to(process.env.WEB_URL || 'http://localhost')
  })

  it('renders the proper notification', () => {
    return driver.findElement(By.className('small'))
      .then(element => element.getText())
      .then(value => expect(value).to.equal('Each branch gets its own database. Check it out and then head back to Runnable.'))
  })

  it('can add a todo', () => {
    return driver.findElement(By.className('input')).sendKeys('Hello')
```

<div class="grid-block code-overflow code-end">...</div>

<p class="caption">Figure 4: Selenium test excerpt for “headless browser agent & test agent”.</p>

#### Third: Ensuring the service dependency order.

An issue when working with multiple services is startup ordering, which is the position in the startup process of your stack. A service might depend on another service to be running before spinning up successfully; like if a service has to connect to a database. To ensure this dependency, we can execute a simple script that waits and retries to connect to a dependent service.

In this example, we will use the commonly used [`wait-for-it.sh`](https://github.com/vishnubob/wait-for-it). Appending this script to a container CMD ensures that a required service is up and running (accepting TCP connections) before the service in question starts up. For example, you can use the command `wait_for_it.sh localhost:27017 && npm start` to ensure that the database is up before the API service. This means that the service will first wait for the `27017` port to be active before trying to start.

### Conclusion

Armed with a Compose file like the one above, a developer can instantly spin up an environment to the execute the test in `Dockerfile.e2e` just by running `docker-compose build` and `docker-compose up`. This makes maintaining and verifying E2E tests as easy as unit tests.
