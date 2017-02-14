---
layout: post
title: 'Pipelines vs. MapReduce to Speed Up Data Aggregation in MongoDB'
author: henry_m
category: Engineering
excerpt: '<p class="p">There has been a lot of protest related to pipelines recently, but there is one that we can all agree brings value and profit to our work: the MongoDB <a class="link" href="https://docs.mongodb.com/manual/core/aggregation-pipeline/">Aggregation Pipeline</a>. When MongoDB v2.2 was released, this performant method of data aggregation was introduced that utilizes stages to filter data and perform operations like grouping, sorting and transforming the output of each operator. This framework is an alternative to Mongo’s MapReduce functionality, and the output can be piped to a new collection or used to update specific documents.
</p>'
---

There has been a lot of protest related to pipelines recently, but there is one that we can all agree brings value and profit to our work: the MongoDB [Aggregation Pipeline](https://docs.mongodb.com/manual/core/aggregation-pipeline/). When MongoDB v2.2 was released, this performant method of data aggregation was introduced that utilizes stages to filter data and perform operations like grouping, sorting and transforming the output of each operator. This framework is an alternative to Mongo’s MapReduce functionality, and the output can be piped to a new collection or used to update specific documents.

### The Case for Pipelines

MongoDB still retains the MapReduce functionality, which offers more flexibility than the Aggregation Pipeline framework, but its queries are written in Javascript and were executed in a single thread using the SpiderMonkey engine. Since the introduction of the V8 engine in MongoDB v2.4, more than one thread could be used, but only if a MapReduce function was split into multiple jobs.

The Aggregation Pipeline is not subject to this limitation because it runs compiled C++ code, while MapReduce’s Javascript code is interpreted. Additionally, another optimization of the Aggregation Pipeline is the fact that it no longer needs to perform conversion on the BSON MongoDB documents into JSON for reading since it is not using Javascript. MapReduce operations are even slower because it must convert BSON’s supported doubles, 32-bit integers and 64-bit integers to Javascript’s one integer type for all numbers. This also delays the queries further if they include a write to the database as the numbers must be converted again.

### How We Use It

The framework is essential to avoid an extended database lock or tie up our event-driven architecture when Mongo is reading/writing in response to a user request. At Runnable, we sometimes have to iterate through all of our documents for items that share few commonalities, and we use the increased performance of the Aggregation Pipeline to accomplish that.

Just as a hypothetical, let’s say we have a database of half a million instances running as many applications, each having a unique container ID and a commit SHA in the document. We want to search all containers for a matching commit SHA, and we don’t have any other data that would allow us to find all of the instances running the application with that commit. To find these containers, we can use the Aggregation Pipeline.

A simple example is just getting the count of all records with a certain value. This code snippet shows how this is performed with both the Aggregation Pipeline and the native MongoDB MapReduce function:

```javascript
// mongodb aggregation pipeline
let records = Record.aggregate([
 {
   '$match' : {
     'user' : 'Kinbote'
   }
 },
 {
   '$group' : {
     _id : '$user',
     count: {
       $sum: 1
     }
   }
 }
])
.then((result) => {
  console.log(result)
})
```

```javascript
// mongodb mapReduce
let o = {};
o.map = function () {
 emit(this.user, 1)
};
o.reduce = function (k, vals) {
 return Array.sum(vals)
};
o.query = { user : 'Kinbote'}
Record.mapReduce(o, (err, result, stats) => {
 console.log('map reduce took %d ms', stats.processtime)
 console.log(result)
})
```

The average performance, measured over 10 queries of over 500,000 records, produces results of about 134ms for the Aggregate Pipeline query, and about 750ms for every MapReduce query producing the same count.

Let’s say we have a problem with our codebase, and we want to figure out where the issue lies. We are running isolated environments where our microservices are connected, and we find that certain applications in our stack are crashing and don’t want to debug each. We can use the Aggregation Pipeline to help us determine blame by searching for commits that have crashed on containers more than 50 times over the last week.

```javascript
let records = Record.aggregate([
 {
  '$match' : {
 numCrashes : { $gt : 50},
 createdAt : { $gte : new Date('2017-02-05T00:00:00Z')}
}
 },
 {
   '$group' : {
     _id : '$commitSha',
     count: {
       $sum: 1
     }
   }
 },
 {
   '$sort' : {
     count: -1
   }
 }
])
```

And the output:

```javascript
[ { _id: '8b01bfcc4ea87cda50cac018bc866638b68d3edb', count: 247 },
  { _id: '53604d1c9bf613c603c18c61ae2801ad3801b510', count: 94 },
  { _id: '1e2927eb89048ff72a3b294d30620c2035c5fdc1', count: 86 },
  { _id: 'cd3b63f7a85f3ad0f1eb97087d11c443f1b14fc8', count: 84 },
  { _id: 'a16a2cb0af851443cda9125ea3e4e2b50b3f65c6', count: 75},
  { _id: '1bac0d2cfe947d00abc68e077d7f3c3044bdae4', count: 62 },
  { _id: '4a582f3a22beea3b1287c709502abd29b2e83cb1', count:  62} ]
```

The average time to perform this query was 318ms, a lot quicker than the minutes or hours spent finding the unstable microservice in our stack. Comparatively, this query took an average of 1694ms for a MapReduce query on a database of 500,000 documents.

Sometimes, there is no avoiding MongoDBs MapReduce functionality, particularly if you need to make more customized queries. For that, there are [methods to optimize MapReduce](http://edgystuff.tumblr.com/post/54709368492/how-to-speed-up-mongodb-map-reduce-by-20x). For our needs, the Aggregation Pipeline is more than sufficient and makes it easy to create optimized queries.

Some things to keep in mind:

> Pipeline stages are limited to 100MB of RAM by default, so to prevent an error if that limit is exceeded the allowDiskUse option must be used.

> To make full use of MongoDB indexes, the $match operator must be used at the beginning of the pipeline. Using it any later would waste the optimizations that the Aggregation Pipeline can apply to the query.

