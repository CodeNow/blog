---
layout: post
title: Testing your app on a budget
author: forrest_j
category: Engineering
excerpt: 'Despite our best efforts bugs will be with us forever. Human error, limited data sets, and perhaps most importantly time keep us from finding all the issues. We must try. So we deploy numerous approaches to finding them. Which reminds me of the saying about advertising attributed to John Wanamaker.'
legacy_url: http://blog.runnable.com/post/141863901521/testing-your-app-on-a-budget
---

<p class="p">Despite our best efforts bugs will be with us forever. Human error, limited data sets, and perhaps most importantly time keep us from finding all the issues. We must try. So we deploy numerous approaches to finding them. Which reminds me of the saying about advertising attributed to John Wanamaker.</p>

<blockquote class="blockquote"><p class="p">Half the money I spend on advertising is wasted; the trouble is I don't know which half.</p></blockquote>

<p class="p">That same sense of uncertainty can creep into software testing too.</p>

<p class="p">Exhaustive testing certainly gives you the best chance. Look at the largest software as a service company and you’ll find things like the <a class="link" href="https://developer.salesforce.com/blogs/engineering/2013/05/here-comes-the-hammer.html">Hammer team</a>. The Salesforce.com Hammer team dedicates itself to regression testing all customer functional tests before each major release. Running, diffing, root causing, and fixing any issues among the more than 60 million functional tests (2013). They find and fix issues that literally are 1 in a million. It is worth it for companies and customers at that scale.</p>

<p class="p">But most of us are at a much smaller scale and budget. In general the smaller the customer segment, adoption, budget, or contract, the more concise your testing.  So here are 5 ways to make the most of your testing time.</p>

<h3 class="h3">Automated Unit Testing</h3>

<p class="p">First off, there is no replacement for unit testing. Any code can be assumed broken if it isn’t tested. Automated CI and unit testing offers a direct and quick way to accomplish testing. Good small orthogonal tests make the best impact. There is certainly some debate on unit testing style. In my opinion, you can go with a <a class="link" href="http://blog.stevensanderson.com/2009/08/24/writing-great-unit-tests-best-and-worst-practises/">TDD approach</a> and use them as specification or look at them as design validation. You’ll still be better for it.</p>

<h3 class="h3">Getting the Ratios Right</h3>

<p class="p">So how do you optimize your automation coverage? I assume most people reading this are familiar with the <a class="link" href="http://martinfowler.com/bliki/TestPyramid.html">test pyramid</a>. As soon as you see it, it makes perfect sense. It’s an embodiment of not only good ratios, ala the food pyramid, but that time is precious. The base of the pyramid is unit testing. Unit gives you focused testing on the smallest possible code. Faster tests with less complexity give you more opportunity to fix issues and easier problems to identify. As you go up the pyramid it gets slower and more complicated.</p>

<img class="img post-graphic" src="http://static.tumblr.com/mpxyjs6/kLro4sdcz/pyramid.png" width="570" height="420" alt="Test Pyramid">

<p>Even when you don’t live up to the gold standard, the model gives direction on how to tailor your tests or refactor your code.</p>

<h3 class="h3">DogFood</h3>

<p class="p">If applicable you should use your product to get things done. First hand experience with dogfooding your app illuminates everything with bright lines. The trick is making sure you keep the feature set focused on what the real customers want.</p>

<h3 class="h3">Bug Hunt</h3>

<p class="p">Testing is much more fun when you put it in the context of a game. Take a specific time and get the team to identify test debt or tricky areas. Start a timer and get to testing. The sky's the limit on how to organize these events. You could compete/collaborate on bugs found, code covered, tests written, performance improved, treasure hunts, bingo, etc… You could even figure out a way to map capture the flag to testing. Seriously, just try it. Any friendly game will be a welcome approach.</p>

<p class="p">At Runnable we call them Bug Hunts and use them around milestones to augment the normal testing. The competitive and lighthearted nature brings out creativity and bug finds. At its root it changes everyone's perspective, broadens thinking, and adds fun incentives.</p>

<h3 class="h3">Canary Tests</h3>

<p class="p">One other approach that economizes on the tight time constraints are synthetic transactions or canary tests. In a small team or product it's likely not worth spending time on rich end to end tests. The product, feature, or technology are all more likely to change. Instead focus on a small set of tests you can run on your production environment. You can use them to alert on any production issue. The value of investment vs. customer experience aligns perfectly.  Obviously you should run them before you deploy but they primarily monitor production quality.</p>

<img class="img post-graphic" src="http://static.tumblr.com/mpxyjs6/TBao4sdgp/canary.png" width="570" height="540" alt="Canary Example">

<p class="caption">An illustrated example of a canary, inspired by what Runnable uses.</p>

<p class="p">At Runnable we use 3 primary canary tests. Each follow a core user flow (build, logs, and source control integration). They also are built up of only a handful essential steps in that user’s experience. They also take special attention to make sure the state is cleaned up after each run. They’ve proved very accurate at identifying real production issues. Each of them run on timers in our batch processing system. They use APIs to update our DataDog reporting and then trigger PagerDuty on any issues.</p>

<p class="p">Most of these items work double duty which help you economize your efforts. For unit testing it often doubles as specification, dogfooding its your service, and canary tests are production monitoring. Each approach can help make a solid improvement in your testing. Depending on context there are tons of other tools to bring to bear to the bug search. In future posts we’ll cover even more than these core tools.</p>
