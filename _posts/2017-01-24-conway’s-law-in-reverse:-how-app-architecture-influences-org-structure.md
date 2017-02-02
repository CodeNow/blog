---
layout: post
title: Conway’s Law in Reverse&#58; How App Architecture Influences Org Structure
author: anton_p
category: Engineering
excerpt: 'In my previous two <a href="lessons-learned-while-building-microservices-part-i" class="link">blog</a> <a href="lessons-learned-while-building-microservices-part-ii" class="link">posts</a>, I explored how Runnable’s architecture evolved over the last two years. There’s no one-size-fits-all solution, but the microservices approach has yielded a lot of benefits for us. In this post, I’ll talk about how Conway’s law has worked in reverse for us, and what the results of that look like.'
legacy_url: http://blog.runnable.com/post/156299805556/conways-law-in-reverse-how-app-architecture
---

<p class="p">In my previous two <a href="lessons-learned-while-building-microservices-part-i" class="link">blog</a> <a href="lessons-learned-while-building-microservices-part-ii" class="link">posts</a>, I explored how Runnable’s architecture evolved over the last two years. There’s no one-size-fits-all solution, but the microservices approach has yielded a lot of benefits for us. In this post, I’ll talk about how Conway’s law has worked in reverse for us, and what the results of that look like.</p>

<p class="p"><a href="https://en.wikipedia.org/wiki/Conway's_law" class="link">Conway’s law</a> says that a company’s software architecture usually reflects its organizational structure. So if our architecture changed in the last couple years, does it mean that our organizational structure also changed? I would say yes. Here’s how it happened.</p>

<p class="p">When I joined Runnable in November 2014, our architecture was in an interesting state: it was mostly monolithic with a couple of microservices. So it was neither monolithic architecture nor microservice architecture. At that point, it could have develop in either direction.</p>

<p class="p">The same was true for our organizational structure. It was neither fully hierarchical, like in a traditional company, nor was it a modern flat structure. E.g. we could end up with a structure where we have strict, well-defined hierarchical layers and separation of responsibilities between layers and departments. We could end up with officers, VP of engineering, design, product, marketing titles. We could end up with separate isolated departments like design, engineering, marketing etc.</p>

<p class="p">But that is not what happened to us. Now we have a more flat organizational structure than we used to have in 2014. What caused this change? We didn't consciously decide to head in this direction — it happened naturally as a result of the architectural decisions we made. This is anecdotal data but that is how it worked for us.</p>

<p class="p">So the point is that Conway’s law works in reverse too. Changing your architecture will have a dramatic impact on your organizational structure. Those are two highly coupled things and you can change one through changing the other. So if you are not happy with the organizational structure of your company and you have no means to change it, maybe you can start rethinking your software architecture instead.</p>

<h3 class="h3">How we work at Runnable</h3>

<p class="p">Okay, so I claim here that our move to a microservice event-based architecture changed our organizational structure. Let's see how it works now and what benefits it brought us.</p>

<p class="p">What do I mean exactly by flat structure? In practice, it means that we don’t have much hierarchy or titles. Instead of titles, we have roles. Instead of hierarchy, we have individual contributors.</p>

<p class="p">People usually have some primary role in the company, but that can be changed. E.g. we don’t have a chief architect or CTO. We have people who mostly think about architecture, but that role can be assumed by anyone; anyone can contribute and everyone’s voice is equal. The same goes for marketing, analytics, etc. We have product-oriented engineers but the truth is anyone can switch to this role if there is a desire or need. We used to have a role for dealing with tech debt (when it was an important issue for us) and then ditched it when we solved the most important issues in that area. The same is true for other daily activities. If you want to organize company event — you can. If you want to decorate the office for the holidays, you can do it too. Have your idea, find people to help you, and execute it.</p>

<p class="p">I can define following characteristics of roles and their differences with titles:</p>

<ul class="ul"><li class="li"><p class="p">Roles are ephemeral. They can come and go when you don’t need them.</p></li>
<li class="li"><p class="p">A person can have multiple roles.</p></li>
<li class="li"><p class="p">The supply of roles is unlimited.</p></li>
<li class="li"><p class="p">The number of people per role is unlimited.</p></li>
</ul><p class="p">Roles give freedom and avenues for personal and professional growth in some particular area. They make people claim responsibility, care about their work and see that they can bring change on the everyday basis. People want to care about their work and people want to have an impact.</p>

<p class="p">My final thought is this. Our architecture is not ideal. The same is true for our organizational structure. However, we see it as an evolutionary process of constant improvement. We work on those two over time and it seems that they are tightly coupled anyway. Changes in one bring to life changes in another. Neither architecture nor organizational structure is fixed in modern companies. Exploration, innovation, tinkering, and discoveries are possible in both those areas. And the benefits of such an attitude are huge.</p>
