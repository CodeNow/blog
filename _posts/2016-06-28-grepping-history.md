---
layout: post
title: Grepping History
author: chris_n
category: Engineering
excerpt: 'In my estimation, the most useful Unix command will always and forever be <code class="monospace">grep</code>, but <code class="monospace">history</code> is also high on my list. Combined, the two form a dynamic duo that can be used to answer the question, “what did I come up with to solve x, y or z hacky problem from the command line?”'
legacy_url: http://blog.runnable.com/post/146427543251/grepping-history
---

<p class="p">In my estimation, the most useful Unix command will always and forever be <code class="monospace">grep</code>, but <code class="monospace">history</code> is also high on my list. Combined, the two form a dynamic duo that can be used to answer the question, “what did I come up with to solve x, y or z hacky problem from the command line?”</p>

<p class="p">In the good old, bad old days, this was a sport among sysadmins — who could chain the most elaborate series of commands to produce the most improbable result, using the humble Unix shell?</p>

<h4 class="h4">Obfuscated Forkbomb</h4>

<p class="p">Here’s one of my favorites. I certainly don’t claim authorship of it, and if you know what’s good for you, don’t ever run this:</p>

<div class="pre-label">Seriously, don’t run this:</div>
<pre class="pre"><code class="monospace no-wrap">:(){ :|: &amp; };:</code></pre>

<p class="p">The short answer is that the above command is the Unix emoticon for “your system is about to be very sad.”</p>

<p class="p">Here’s a more readable version:</p>

<div class="pre-label">Seriously, don’t run this:</div>
<pre class="pre"><code class="monospace no-wrap">forkbomb()
{
    forkbomb | \
    forkbomb &amp;
};
forkbomb</code></pre>

<h3 class="h3">The hunt for my longest command</h3>

<p class="p">I wanted to figure out what my most elaborate command was on my desktop, so I looked at my <code class="monospace">tcsh</code> history with hilarious results:</p>

<pre class="pre"><code class="monospace">chris@girlfriend [4:15]:1:~%<span class="text-purple"> find .history -type f -exec cat {} \; | awk 'length &gt; max_length { max_length = length; longest_line = $0 } END { print longest_line }'</span>
cat: .history/root-girlfriend.local.140317164504: Permission denied
E?I&amp;???#(eq??jUzlz?KJ?2}?u??Uf???9?s?]SU
      ?Ț????&lt;J?V???%렱1P?V????$^?\HR????0]t
[... more binary data garbage]</code></pre>


<p class="p">This command pipes my shell history into a simple <code class="monospace"><a href="https://www.gnu.org/software/gawk/manual/gawk.html" class="link" target="_blank">awk</a></code> program that compares each line to the longest known line. It registers the value of the current longest line into a variable, which is then printed once all the lines in my history have been searched.</p>

<p class="p">In this case, my <code class="monospace">tcsh</code> history seems to contain some binary data. I’ll have to clean that up, first by running the find command as root and piping it into the Unix utility <code class="monospace">strings</code>, which converts binary data to ASCII:</p>

<pre class="pre"><code class="monospace">chris@girlfriend [4:19]:3:~%<span class="text-purple"> sudo find .history -type f -exec cat {} \; | awk 'length &gt; max_length { max_length = length; longest_line = $0 } END { print longest_line }' | strings</span>
Password:
#(eq
[ ...ASCII gibberish]</code></pre>

<p class="p">More gibberish! Clearly I had pasted some binary nonsense into the command line, and it was written into my tcsh command history.</p>

<p class="p">Maybe I could exclude it? Let’s run <code class="monospace">strings</code> before <code class="monospace">awk</code> this time to weed out any multi-line binary gibberish.</p>

<pre class="pre"><code class="monospace">chris@girlfriend [4:19]:4:~%<span class="text-purple"> sudo find .history -type f -exec cat {} \; | strings | awk 'length &gt; max_length { max_length = length; longest_line = $0 } END { print longest_line }'</span>
1111poooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooee aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa</code></pre>

<p class="p">Still pretty noisy. (This might be the work of my cat.) I bet if I limited the search to lines containing the pipe character <code class="monospace">|</code> I’d come up with something more exciting.</p>

<pre class="pre"><code class="monospace">chris@girlfriend [4:22]:5:~%<span class="text-purple"> sudo find .history -type f -exec cat {} \; | strings | grep '|' | awk 'length &gt; max_length { max_length = length; longest_line = $0 } END { print longest_line }'</span>
curl -H "Authorization: Token token=REDACTED,provider=REDACTED" https://vip1-us-east-1.REDACTED:443/users/recommended | grep -q null &gt; /dev/null 2 &gt; &amp; 1</code></pre>

<p class="p">Great! A bunch of old auth tokens! ​<span class="strong">sigh</span>. Well, this isn’t what I was hoping for, but it leads me to an important lesson about logging your history.</p>

<h3 class="h3">The downside of logging your history</h3>

<p class="p">At some point or another, you’re bound to type in something that you don’t want in the hands of a malicious stranger. Therefore the moral of this story is to:</p>

<ol class="ol"><li class="li">
<p class="p">Yes, save your shell history indefinitely so you can go back to it when you want to remember how to do repetitive tasks that aren’t quite worthy of a full-blown shell script. This is how I set that up when I used to run Turbo Shell:</p>
<pre class="pre"><code class="monospace no-wrap">set history=1000
set savehist=(1000 merge)
set histdir=~/.history/${USER}/${HOST}/`date +%Y/%m/%d`
if ( ! -d ${histdir} ) then
  if ( -f ~/.history ) then
    mv ~/.history ~/.history-orig-`date +%Y%m%d`
  endif
  mkdir -p ${histdir}
endif
set histfile=${histdir}/`date +%H%M%S`</code></pre>
</li>

<li class="li"><p class="p">Save your history to a file, but restrict who can read it (mode <code class="monospace">0400</code>). If you are particularly security-conscious, encrypt your history file.</p></li>
<li class="li"><p class="p">Scrub sensitive data from your history. There’s nothing more humbling than a good <code class="monospace">history | grep AWS_SECRET</code> to spoil your day. Don’t forget to scrub your vim command history if you opened your history file up to do a bit of the old <code class="monospace">:%s/AWS_SECRET.*/nope/g</code>. Open the history in an editor, turn off that editor's command history, then search for known security tokens, like your password, your <code class="monospace">AWS_SECRET_KEY</code>, your GitHub login tokens, or any PII you’d want to scrub.</p></li>
<li class="li"><p class="p">If you happen upon some other chap or lady’s shell history and notice an out of place string of characters, like, say, <code class="monospace">!!!j4bb3rw0cky_123456!!!</code>, do be a mensch and let them know they accidentally pasted their password into their command prompt.</p></li></ol>
