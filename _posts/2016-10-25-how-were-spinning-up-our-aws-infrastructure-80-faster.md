---
layout: post
title: How We’re Spinning up Our AWS Infrastructure 80% Faster
author: henry_m
category: Engineering
excerpt: 'After our announcement of general availability, our team started focusing on improving our onboarding flow. A key bottleneck was the time it took for us to spin up infrastructure for each new user. This could take up to ten minutes, delaying their initial exposure to our product. We knew we were facing a common problem: reducing the amount of time that it takes to add resources and servers to your infrastructure.'
---

After our announcement of general availability, our team started focusing on improving our onboarding flow. A key bottleneck was the time it took for us to spin up infrastructure for each new user. This could take up to ten minutes, delaying their initial exposure to our product. We knew we were facing a common problem: reducing the amount of time that it takes to add resources and servers to your infrastructure.

### Our Solution

Our solution to this problem was to introduce a pool of EC2 instances that would provide ready hosts for a variety of uses that we could not predict, preventing us from having to fully configure each instance when it is launched.

Our AWS Auto Scaling Group (ASG) launch configuration was unique to each user and uploaded whenever a new ASG was created. Then we would prep each instance to run dockerized containers. The longest part of our ten-minute provisioning process was the "instance launch" step. We needed to remove it from our process while still preserving the isolated nature of our users’ environments.

The most elegant approach we considered involved rewriting our entire server configuration script and containerizing our dock services, which a new microservice would be responsible for. However, time constraints and the risks associated with introducing new elements into our architecture led us to seek solutions within AWS. We were able to change how new ASGs and instances were created by utilizing the `user-data` feature to run shell scripts on the instances with the new Amazon [EC2 Run Command](https://aws.amazon.com/blogs/aws/new-ec2-run-command-remote-instance-management-at-scale/). This reduced our spin-up time for new users by about 80%.

### Implementation

The most integral step in implementing this process was to first create a new launch configuration for pool instances to receive commands via the AWS Simple Systems Manager (SSM). This allowed us to set up the SSM agent and run the following command when launching the pool instances:

{% highlight javascript %}
#!/bin/bash
cd /tmp
curl https://amazon-ssm-us-{your-region}.s3.amazonaws.com/latest/debian_amd64/amazon-ssm-agent.deb -o amazon-ssm-agent.deb
dpkg -i amazon-ssm-agent.deb
start amazon-ssm-agent
{% endhighlight %}

Once the new Launch Configuration is created and the Pool ASG is created, we can pull a new ready instance from our configured pool, attach it to an ASG, and initialize it for a new user. I’ve simplified and consolidated the code for this considerably, but here is the basic approach using the AWS SDK and Auto Scaling API interface:

{% highlight javascript %}
static attachHealthyInstance (asgToAttachInstance) => {
  return autoscalingAPI.describeAutoScalingGroups({
    AutoScalingGroupNames: [ process.env.DOCK_POOL_ASG_NAME ]
  })
  .then((groupInfo) => {
    let healthyInstance = groupInfo.AutoScalingGroups[0].Instances.find((instance) => {
      return instance.HealthStatus === 'Healthy' && instance.LifecycleState === 'InService'
    })
    return autoscalingAPI.detachInstances({
      AutoScalingGroupName: process.env.DOCK_POOL_ASG_NAME,
      InstanceIds: [ healthyInstance.InstanceId ],
      ShouldDecrementDesiredCapacity: false
    })
  })
  .then((instance) => {
    autoscalingAPI.attachInstances(asgToAttachInstance, instance.InstanceId)
  })
}
{% endhighlight %}

So far, we’ve only detached an instance from the pool and attached it to an ASG. After having configured the SSM-agent to run on the pool instances, we can run an initialization bash script and specifically call the Amazon EC2 Run Command. At a minimum, the Simple Systems Management Service expects JSON as input for its <code class="monospace">sendCommand</code> method to indicate which SSM document to execute and which instances to execute them on. Our usage also requires that we send parameters to run the SSM AWS-RunShellScript Document to run our bash script In the following example, we just want to run a simple <code class="monospace">ifconfig</code> command on a working instance:</p>

{% highlight javascript %}
{
  DocumentName: 'AWS-RunShellScript',
  InstanceIds: [ 'i-00cbd295' ],
  Parameters: {
    commands: [ 'ifconfig' ],
    executionTimeout: [ '10' ]
  }
}
{% endhighlight %}

The commands to be run should be sent as an array of commands in string form, which the AWS-RunShellScript would run in sequence. The other parameters for this command are the working directory for the script in and an execution timeout, after which a command will be considered unsuccessful.

It is important to verify that the SSM agent is running. We can do this by SSHing into the instance and checking the processes. Be advised that if it is not running, and you attempt to send a command to a healthy instance, you will get an unhelpful `InvalidInstanceId` error from the API.

### Testing

Now, to test this functionality, we encounter an interesting problem. Testing with the AWS SDK can be difficult because the methods need to be wrapped before they can be stubbed. Packages like [aws-sdk-mock](https://www.npmjs.com/package/aws-sdk-mock) exist because AWS SDK methods cannot be stubbed out by traditional means. The simplest solution is to just export the module, and then stub out all of the methods within the test.

{% highlight javascript %}
const sdk = moduleThatUsesSDK.getSDK()
const sdkMethods = [
  'createLaunchConfiguration',
  'describeLaunchConfigurations',
  'deleteLaunchConfiguration',
  'createAutoScalingGroup',
  'deleteAutoScalingGroup',
  'describeAutoScalingGroups',
  'updateAutoScalingGroup'
]
sdkMethods.forEach((method) => sinon.stub(sdk, method))
{% endhighlight %}

Now we have everything we need — our Launch Configuration, our user script to send to the SSM Agent, and the unit tests to go along with them. This approach cut down our infrastructure spin-up time for new users from ten minutes down to two.

### Conclusion

This approach to creating a new infrastructure for our users is not without its disadvantages. Pulling prepared instances from a large pool will always result in higher costs and increase complexity compared with spinning up new instances on an as-needed basis. However, optimizations can always be made, and the effect on user experience is more than offset. Of course we can also also utilize this server pool to reduce the time it takes to scale out our ASGs out when necessary. We are excited to further improve the user flow and shave as much time from first click to available infrastructure as possible.
