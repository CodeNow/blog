---
layout: post
title: 'Kops: Kubernetes the Easy Way'
author: henry_m
category: Engineering
excerpt: 'For those who are new to Kubernetes (commonly known as k8s) and want to begin playing around with their first pods, services, and deployments, there are <a href="/blog/kubernetes-how-do-i-do-that">many</a> <a href="https://kubernetes.io/docs/tutorials/stateless-application/hello-minikube/">tutorials</a> available for setting up a k8s installation using Minikube on their personal computers. While this is a great way to initially get experience working with k8s, eventually one will need to introduce their application stack to a production environment. Launching in a cloud environment like Google Cloud Platform (GCP) or Amazon Web Services (AWS) is facilitated using kops.'
date: 2017-06-30 15:00:00 -0800
---

For those who are new to Kubernetes (commonly known as k8s) and want to begin playing around with their first pods, services, and deployments, there are [many](https://runnable.com/blog/kubernetes-how-do-i-do-that) [tutorials](https://kubernetes.io/docs/tutorials/stateless-application/hello-minikube/) available for setting up a k8s installation using Minikube on their personal computers. While this is a great way to initially get experience working with k8s, eventually one will need to introduce their application stack to a production environment. Launching in a cloud environment like Google Cloud Platform (GCP) or Amazon Web Services (AWS) is facilitated using kops.

### Introducing Kops

[Kops](https://github.com/kubernetes/kops) is described as the “easiest way to get a production grade k8s cluster up and running,” and compared with the work entailed in Kelsey Hightower’s “[Kubernetes the Hard Way](https://github.com/kelseyhightower/kubernetes-the-hard-way)”, it certainly seems that way. I advise that everyone take a stab at that tutorial and go through each step in the setup process if they are more ops-inclined or want to get a better understanding of container orchestration using k8s.

While “the hard way” walks the user through the process of creating a highly-available cluster, kops automates most of that process away. It will perform at least 8 tasks including creating the subnet and DHCP options for your cluster, Auto Scaling Groups for your master and worker nodes, Launch Configurations for those nodes, IAM profiles and EBS volumes for your instances, and security groups for your network.

### Installing Kops and Creating a Cluster

To follow this guide, the first thing the user must do is [create an account](http://docs.aws.amazon.com/AmazonSimpleDB/latest/DeveloperGuide/AboutAWSAccounts.html) on AWS, and install the [AWS CLI](https://aws.amazon.com/cli/). You will also have to install kops on your own machine. For macOS users, you can use Homebrew:

```bash
brew update && brew install kops
```

And for Linux users:

```bash
wget https://github.com/kubernetes/kops/releases/download/1.6.1/kops-linux-amd64
chmod +x kops-linux-amd64
mv kops-linux-amd64 /usr/local/bin/kops
```

Now, we will have to create a subdomain to use with k8s, with the AWS Route53 DNS service. I used the subdomain kubernetes.mydomain.com, and created a hosted zone:

```bash
aws route53 create-hosted-zone --name kubernetes.mydomain.com --caller-reference 1
```

This will return information about the hosted zone, including a DelegationSet of name servers. I selected one with a .com top-level domain, and entered into my domain name registrar as an NS record.

We also have to create an S3 bucket, within which kops will store configuration for our cluster:

```bash
aws s3 mb s3://clusters.kubernetes.mydomain.com
```

Now, we should create the following variable in your current shell or your bash profile if you are only controlling one cluster:

```bash
export KOPS_STATE_STORE=s3://clusters.kubernetes.mydomain.com
```

Cool! We are ready to configure and launch the cluster that will run k8s for us:

```bash
kops create cluster --zones=us-west-2c us-west-2c.kubernetes.mydomain.com
```

You can also specify parameters like the subnet using the `--network-cidr` flag, or your AWS VPC with the `--vpc` flag.

### Let Kops Do The Work

While all of this can be scripted away and automated, it is very refreshing to have kops perform these tasks without the need for much input. However, if you need to exercise some hands-on configuration, the command `kops edit cluster $CLUSTER_NAME` will open Vim on your computer and allow you to edit the .yml that will create your cluster. Ditto for node instance groups using `kops edit ig --name=$CLUSTER_NAME nodes` or the master instance group using `kops edit ig --name=$CLUSTER_NAME $ZONE`.

If you are happy with the result, and aren’t creating infrastructure costs that will exceed your utility bill, enter the `kops update cluster` command using the `--yes` flag to actually perform the task and create the cluster if you have created the configuration. After allowing for some time for your NS Record to propagate to other DNS servers, Route53 will properly respond to requests. When your k8s cluster infrastructure is up and running type `kubectl get pods`. When you see `No resources found`, you are ready to start creating deployments/replica sets.

Anyone attempting to create a k8s cluster on GCP or AWS for the first time will likely want to go through [“Kubernetes the Hard Way](https://github.com/kelseyhightower/kubernetes-the-hard-way)”, just to get an idea of what is involved when creating a k8s cluster in the cloud. This will allow novices to learn about k8s’ reliance on services like DNS or an Etcd key-value store. Then, once the frustrations and improvising have yielded a better understanding of k8s, you will likely find yourself using kops to streamline the process considerably and get to experimenting with pods, service configuration and other application concerns rather than ops concerns. And you will know what to do when Sheriff John Brown comes for you. If you encounter any problems or have questions, please send an email to [henry@runnable.com](mailto:henry@runnable.com).
