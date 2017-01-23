---
layout: post
title: The Mysterious Case of the Leading Space
author: chris_n
category: Engineering
excerpt: 'We had just performed an overhaul of how we handled logging across our services at Runnable. It appeared to work as intended — log files were being rotated and sent over to Loggly. I later learned we had a bug that was causing logs to be improperly formatted.<br><br>“Logs aren’t formatting correctly for me.” My fellow engineer showed me what looked like JSON, which is what our various services produce as log output.<br><br>“Looks OK to me,” I offered trepidatiously.<br><br>“You would think so, but when I pipe it into Bunyan, nothing happens.”<br><br>Sure enough, <a href="https://github.com/trentm/node-bunyan" class="link">Bunyan</a> wasn’t re-formatting the JSON as expected.'
legacy_url: http://blog.runnable.com/post/143767821746/the-mysterious-case-of-the-leading-space
---

<p class="p">We had just performed an overhaul of how we handled logging across our services at Runnable. It appeared to work as intended — log files were being rotated and sent over to Loggly. I later learned we had a bug that was causing logs to be improperly formatted.</p>

<p class="p">“Logs aren’t formatting correctly for me.” My fellow engineer showed me what looked like JSON, which is what our various services produce as log output.</p>

<p class="p">“Looks OK to me,” I offered trepidatiously.</p>

<p class="p">“You would think so, but when I pipe it into Bunyan, nothing happens.”</p>

<p class="p">Sure enough, <a href="https://github.com/trentm/node-bunyan" class="link">Bunyan</a> wasn’t re-formatting the JSON as expected.</p>

<p class="p">Log formatting wasn’t an issue until I decided I’d stick my neck out and “fix it.” Before I joined Runnable, various services were started inside Docker containers that dumped standard output directly into log files. Outside those containers, on the host system, the rsyslog service would "follow" a given output file, pushing each new log message to our remote logging service (<a href="https://www.loggly.com/" class="link">Loggly</a>) as they happened.</p>

<p class="p">I quickly realized that this was going to cause trouble at scale. For one thing, logs were filling up our system volumes and we had no real way to rotate logs. So I had taken it upon myself to “fix” it.</p>

<p class="p">Undertaking this task involved making changes across all of our services: engineering would need to refactor what was being logged, and operations would have to handle how logs would end up being shipped to Loggly.</p>

<p class="p">So I rolled up my sleeves, dusted off my JavaScript books, checked out all of the repositories, and started to go through every blessed “lib/logger.js” one by one.</p>

<p class="p">Then another engineer at Runnable said to me, “Check this out, we can just use docker-engine’s syslog driver to send the output of whatever is running in the container to rsyslog.”</p>

<p class="p">Now I was left to tangle with rsyslog. “This will be a cinch,” I thought to myself.</p>

<p class="p">Nope.</p>

<p class="p">The devil, they say, is in the details.</p>

<p class="p">I saw no issue with the default output format for rsyslog to write logs into <code class="monospace">/var/log</code> on hosts. Doing so would produce output like this:</p>

<pre class="pre"><code class="monospace">Apr 29 21:55:11 ip-10-12-14-64 testapp: {"name":"deacon-blues", "pid":69, "hostname":"crimson.tide", "_id": "31337d43db33f", "level":30, "epoch":"this is the age of the exanding man", "theseWomen":"languid and bittersweet", "drink":"scotch whisky all night long", "die":"behind the wheels", "msg":"They call Alabama the Crimson Tide.", "time":"1977-09-23T15:15:15.015Z", "v":0}</code></pre>

<p class="p">And that’s good enough for me because:</p>

<pre class="pre"><code class="monospace"><span class="text-purple-light">/var/log$</span> grep deacon /var/log/syslog|sed 's/^.*name\"\:/{"name":/g'|jq "."
{
  "v": 0,
  "time": "1977-09-23T15:15:15.015Z",
  "name": "crimson.tide",
  "_id": "31337d43db33f",
  "level": 30,
  "epoch": "this is the age of the expanding man",
  "theseWomen": "languid and bittersweet",
  "drink": "scotch whisky all night long",
  "die": "behind the wheels",
  "msg": "They call Alabama the Crimson Tide."
}</code></pre>

<p class="p">But what’s good enough for me is not expedient for our engineers who are expecting something more like:</p>

<pre class="pre"><code class="monospace"><span class="text-purple-light">/var/log$</span> bunyan ~ubuntu/gibberish.json
[1977-09-23T15:15:15.015Z]  INFO: deacon-blues/69 on crimson.tide: They call Alabama the Crimson Tide. (_id=31337d43db33f, epoch="this is the age of the expanding man", theseWomen="languid and bittersweet", drink="scotch whisky all night long", die="behind the wheels")
[2016-03-31T08:32:12.511Z]  INFO: api/30 on api: a message (environment=pre-productionn, module=lib/middlewares/domains.js)
    branch: 5and3r52016

    --
    commit: SAN-31337-do-a-thing</code></pre>


<p class="p">We had arrived at the following format string as a rsyslog output template:</p>

<pre class="pre"><code class="monospace">$template Strip_Headers,"%msg%\n"</code></pre>

<p class="p">Which would produce output like this:</p>

<pre class="pre"><code class="monospace"><span class="text-purple-light">bash-3.2$</span> cat /tmp/scrubbable.json |bunyan
 {"name":"api","branch":"5and3r52016\n","commit":"SAN-31337-wub-a-lub-a-dub-dub\n","environment":"pre-prod","hostname":"api","pid":30,"module":"lib/models/apis/github.js","level":10,"tx":{"tid":"68a3798a-0e59-11e6-9f53-0a2ee7c3b2b9","url":"GET /instances/d29c258a-0e59-11e6-b223-0a2ee7c3b2b9/dependencies","reqStart":"2016-04-29T22:21:25.932Z","txMSDelta":349},"msg":"Github.prototype._runQueryAgainstCache checkDataAndRunAnyRequest - extending the caches expiration","time":"2016-04-29T22:21:26.349Z","src":{"file":"/api/lib/models/apis/github.js","line":446,"func":"cache304Response"},"v":0}
 {"name":"api","branch":"5and3r52016\n","commit":"SAN-31337-wub-a-lub-a-dub-dub\n","environment":"pre-prod","hostname":"api","pid":30,"module":"lib/routes/github/index.js","level":10,"tx":{"txTimestamp":"2016-04-29T22:21:26.425Z"},"statusCode":200,"msg":"cache miss","time":"2016-04-29T22:21:26.425Z","src":{"file":"/api/lib/routes/github/index.js","line":211,"func":"handleGithubCacheMissRes"},"v":0}</code></pre>

<p class="p">Looks like JSON to me, but not to Bunyan — which brings us back to the improper log formatting issue mentioned earlier.</p>

<p class="p">I stared at it. Another engineer stared at it. We stared at it together.</p>

<p class="p">The gears turned ever so slowly.</p>

<p class="p">“Is that a leading space in front on the curly bracket?”</p>

<p class="p">“Son of a…”</p>

<pre class="pre"><code class="monospace"><span class="text-purple-light">bash-3.2$</span> cat /tmp/scrubbable.json | sed 's/^ //g' | bunyan
[2016-04-29T22:21:26.349Z] TRACE: api/30 on api (/api/lib/models/apis/github.js:446 in cache304Response): Github.prototype._runQueryAgainstCache checkDataAndRunAnyRequest - extending the caches expiration (environment=pre-prod, module=lib/models/apis/github.js)
    branch: 5and3r52016

    --
    commit: SAN-31337-wub-a-lub-a-dub-dub

    --
    tx: {
      "tid": "68a3798a-0e59-11e6-9f53-0a2ee7c3b2b9",
      "url": "GET /instances/d29c258a-0e59-11e6-b223-0a2ee7c3b2b9/dependencies",
      "reqStart": "2016-04-29T22:21:25.932Z",
      "txMSDelta": 349
    }
[2016-04-29T22:21:26.425Z] TRACE: api/30 on api (/api/lib/routes/github/index.js:211 in handleGithubCacheMissRes): cache miss (environment=pre-prod, module=lib/routes/github/index.js, statusCode=200)
    branch: 5and3r52016

    --
    commit: SAN-31337-wub-a-lub-a-dub-dub

    --
    tx: {
      "txTimestamp": "2016-04-29T22:21:26.425Z"
    }</code></pre>

<h3 class="h3">You’ve Come A Long Way, %msg%</h3>

<p class="p">I’d succeeded in convincing everyone at Runnable that we needed to change how we were doing logging, went through several revisions of configurations to get away from simply dumping STDOUT into a file, and even written a couple of log modules for services we were upstarting.</p>

<p class="p">I felt like I had moved mountains. Logs were now rotating on the hour, we had a sane archiving mechanism in place, and we’d clean up log files we didn’t need any more. No longer would we lose track of file handles, or worse, have log files that grew to be many GB in size.</p>

<p class="p">Now all I had to do was get rid of a single leading space.</p>

<p class="p">I started to zero in on something called “the Property Replacer” and to my great chagrin realized that the solution had been one Google search away from me: “rsyslog leading space”. About three links down was <a href="http://kb.monitorware.com/how-remove-messages-prefix-t12116.html" class="link">this post</a> from a support forum.</p>

<p class="p">Now I had my answer. <code class="monospace">%msg%\n</code> becomes <code class="monospace">%msg:2:$:%\n</code>.</p>

<p class="p">What this statement does, effectively, is start printing the syslog <code class="monospace">MSG</code> field from the second character of the field to the end of the field.</p>

<p class="p">One configuration line, five added characters.</p>

<p class="p">Welcome to my world. The leading space was gone and Bunyan (and everyone else) was happy.</p>
