---
layout: post
title: Using a Slack Bot to Improve Customer Support
author: sohail_a
category: Engineering
excerpt: 'We rely heavily on <a href="https://slack.com/" class="link">Slack</a> for communication throughout our company, so it was only a matter of time before we started utilizing Slack bots to improve our customer support workflows. With <a href="https://scotch.io/tutorials/building-a-slack-bot-with-node-js-and-chuck-norris-super-powers#create-a-new-bot-on-your-slack-organization" class="link">some light reading</a> and a little programming, we’ve begun automating many mundane tasks which help us improve how we troubleshoot customer issues.'
legacy_url: http://blog.runnable.com/post/148678111226/using-a-slack-bot-to-improve-customer-support
---

We rely heavily on [Slack](https://slack.com/) for communication throughout our company, so it was only a matter of time before we started utilizing Slack bots to improve our customer support workflows. With [some light reading](https://scotch.io/tutorials/building-a-slack-bot-with-node-js-and-chuck-norris-super-powers#create-a-new-bot-on-your-slack-organization) and a little programming, we’ve begun automating many mundane tasks which help us improve how we troubleshoot customer issues.

### How we use it

One major factor our team uses to drive product development is bug fixes and feature requests based on customer demand. We get most of this information by providing support for our customers. We were running into bottlenecks with our old approach (it involves a Google spreadsheet), so we created a bot that helped us troubleshoot and capture feedback.

For example, if a customer contacts us regarding an issue with their Docker container, CustomerBot communicates with our internal API to gather information about that container directly from the URL they provide us.

<img src="https://s3-us-west-1.amazonaws.com/runnable-design/customerbot-1.png" class="post-graphic" width="660" height="351" alt="image">

With this information, we can check the status of that container’s Docker host, view logs, and — with the user’s permission — even interact with their container using Swarm.

After getting the customer running again, we want to capture feedback with any additional context to that customer to help drive product development.

<img src="https://s3-us-west-1.amazonaws.com/runnable-design/customerbot-2.png" class="post-graphic" width="660" height="90" alt="image">

This adds a tag, named after a JIRA ticket, to the company the customer is associated with in Intercom. It also appends a note to the company to provide context as to why they were tagged with that ticket.

When we need to generate a report of the feedback we’ve collected, we simply message CustomerBot:

<img src="https://s3-us-west-1.amazonaws.com/runnable-design/customerbot-3.png" class="post-graphic" width="660" height="233" alt="image">

CustomerBot responds with all our Intercom tags that correspond to JIRA tickets, ranked by which issues have been experienced by the most companies.

### How do I start?

Building your own bot is actually quite easy. There are several libraries out there for you to take advantage of, in all sorts of languages. We based our bot on [this library](https://github.com/mishk0/slack-bot-api) written by mishk0.

Programming with Slack RTM APIs basically involves listening to the events that are coming along the WebSocket and reacting to message events with a certain type `message.type === 'message'`. Your bot will receive all events from whichever channel `message.channel` is invited to, including direct messages. You can then parse your custom commands and arguments from the text `message.text`.

{% highlight javascript %}
class CustomerBot extends SlackBot {

  run () {
    this.on('start', this.onStart)
    this.on('message', this.onMessage)
    this.on('error', this.onError)
  }

  onStart () {
    console.log(`${this.name} is running...`)
  }

  onMessage (message) {
    if (this.isMessage(message)) {
      let words = message.text.split(' ')  // Split message into parseable chunks
      let command = words.shift()          // Let the first word of the message be the command
      message.text = words.join(' ')       // Combine the rest of the message for later use

      switch (command) {
        case 'help':
          console.log('Command: help')
          this.respond(message.channel, `Hey there, here are the available commands:\n
            \`tag\` Tag a company. _tag &lt;company&gt; &lt;ticket number&gt; &lt;notes&gt;_\n
            \`feedback\` Get current issues.\n
            \`funnel\` Get funnel statistics.`)
          break
        // TODO: Add more commands here.
      }
    }
  }
}
{% endhighlight %}

For each command, you can start to break out your own functions. This particular function gets all issues in JIRA that we have tagged companies in Intercom with.

{% highlight javascript %}
…
// Add to your onMessage switch case
case 'feedback':
  console.log('Command: feedback')
  this.getFeedback(message)
  break
…

// Add to your SlackBot class
getFeedback (message) {
  this.sendMessage(message.channel, 'Sending feedback shortly...')

  this.jira.searchJira('type = feedback', { maxResults: '1000' })
    .then(issue =&gt; {
      this.jira.getIssueTable(issue, this.intercom, (err, results) =&gt; {
        this.sendMessage(message.channel, this.jira.getMessageFromTable(results))
      })
    })
    .catch(err =&gt; {
      console.log(err)
      this.sendMessage(message.channel, '`Error` Something went wrong when querying JIRA. Please try again shortly.')
    })
}
…
{% endhighlight %}

By adding connections to several APIs, we can start to cross-reference information from different sources and filter out just what we need.

### Why a Slack bot?

Our answer to this question is a little biased. We are figuratively tied to the hip with Slack. So we figured that the most efficient place to provide us with real-time customer data and notifications would be our center of communication. Having CustomerBot in Slack comes with other benefits, too:

* We can use CustomerBot anytime and anywhere we can use Slack — on our laptops, tablets, and phones.
* Anyone in our team can use it by typing simple text commands.
* We can pull information from (and push information to) several sources and present it in a more readable and actionable way.

CustomerBot helps us troubleshoot issues and drive product improvements based on those issues. Associating bugs and feedback with specific customers helps us develop empathy and drives us to improve their experience more holistically. Using a Slack bot has enabled us to continue this practice as we grow our user base.
