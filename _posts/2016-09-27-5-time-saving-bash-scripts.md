---
layout: post
title: 5 Time-Saving Bash Scripts
author: jorge_s
category: Engineering
excerpt: 'A good developer is a lazy developer. A good developer should always hate doing the same things over and over again. One of the best ways to embrace the laziness and be more efficient is through writing good shell scripts. In this blog post, I’ll show some of the tricks I’ve recently learned while writing some more complex bash scripts.<br><br><em>Note: In this post I’ll be talking specifically about bash, since it’s what I use and what I prepared all examples with, but most of it should work with other shells.</em>'
legacy_url: http://blog.runnable.com/post/150987719051/5-time-saving-bash-scripts
---

A good developer is a lazy developer. A good developer should always hate doing the same things over and over again. One of the best ways to embrace the laziness and be more efficient is through writing good shell scripts. In this blog post, I’ll show some of the tricks I’ve recently learned while writing some more complex bash scripts.

_Note: In this post I’ll be talking specifically about bash, since it’s what I use and what I prepared all examples with, but most of it should work with other shells._

### 1. Programmatically declaring aliases

Often times, you’ll have a function that you always call with one of the same three or four parameters. Instead of writing the argument to the function every single time, you might want to just create a “function” that automatically calls the original function with those arguments. This is what aliases are for. They’re a bit like shortcuts to other functions.

Declaring them is pretty simple: `alias json="python -m json.tool"` but one of the nice things about aliases is that they can be declared programmatically. An example of where we use this is for calling our `deploy` function with our different environments. Instead of declaring them one by one, we can just loop over our environments and create aliases for them.

{% highlight javascript %}
export ENVS='delta gamma epsilon stage'
for tenv in $ENVS; do
  alias ${tenv}Deploy="deploy $tenv"
done
{% endhighlight %}

This is much better than creating individual functions for all of these, for which we might have to use `eval` since functions cannot be dynamically created.

### 2. Auto completion

One of my favorite features I’ve learned recently is autocompletion. Adding autocompletion for some of your own custom functions makes it much faster to use them. One example of how we use this is for looking up users and organizations internally. There are many ways of looking up users/organizations (environment, entity type, query parameters) and with this short autocompletion function we’re able to quickly see the parameters for this function.

{% highlight javascript %}
_bp_autocompletion()
{
  local cur environments entity_type query_parameter reply
  cur="${COMP_WORDS[COMP_CWORD]}"

  environments="${ENVS}"
  entity_type="organization user"
  query_parameter="id githubId name username all"

  if [[ ${cur} == -* || ${COMP_CWORD} -eq 1 ]] ; then
    reply=$environments
  elif [[ ${cur} == -* || ${COMP_CWORD} -eq 2 ]] ; then
    reply=$entity_type
  elif [[ ${cur} == -* || ${COMP_CWORD} -eq 3 ]] ; then
    reply=$query_parameter
  fi
  COMPREPLY=( $(compgen -W "${reply}" -- ${cur}) )
}
complete -F _bp_autocompletion bp
{% endhighlight %}

Here’s how this looks:

<img src="https://s3-us-west-1.amazonaws.com/runnable-design/autocompletion.gif" width="664" height="390">

### 3. Testing for falsy values

Testing for falsy values is tricky in bash. Unlike many dynamic languages, bash has different operations for checking the existence of a variable, checking if a variable is empty, and checking if a variable is `true` or `false` (which in bash is counterintuitively represented by `0` for `true` and `1` for `false`).

What in JavaScript might be represented by just `if (var) {}` can be represented by the following bash operations.

{% highlight javascript %}
if [[ $var ]];
if [[ -n "$var" ]];
if [[ -z "$var" ]];
if [[ -z "${var+x}" ]];
if $var;
if (($var));
if [[ $var == 0 ]];
if [[ $var == "" ]];
{% endhighlight %}

These have basically the following meaning:

{% highlight javascript %}
if [[ $var ]];
{% endhighlight %}

Checks if a variable has been defined and is not empty. This is basically the equivalent of using `if [[ -n "$var" ]];`.

{% highlight javascript %}
if [[ -z "$var" ]];
{% endhighlight %}

This is the opposite of `-n`, checking if a variable is not defined or empty. An important variation of this is `if [[ -z "${var+x}" ]];`, which checks if a variable is unset (and evaluates to false if empty).

{% highlight javascript %}
if $var;
{% endhighlight %}

While this seems very similar to `[[ $var ]]`, this is actually evaluating the value of `$var` as a command and executing it. That is why setting `$var` to `true/false` works. These execute the commands in your shell and most systems have a `true/false` executable which just returns code `0/1`.

{% highlight javascript %}
if [[ $var == 0 ]];
{% endhighlight %}

Checks if the value of your variable is `0`. Keep in mind that everything in bash is treated as a string, so this is the equivalent of writing `if [[ $var == "0" ]];`

{% highlight javascript %}
if (($var));
{% endhighlight %}

This is an arithmetic operation. Since everything in bash is treated as a string, this operation first turns the value of the variable into a number and then returns a code `1` if its value is `0` or empty.

### 4. Working with JSON

Recently, I’ve found myself dealing more and more with JSON in the command line. Reading plain JSON without any formatting/indentation is really hard, so whenever I have display JSON I just add [`jq`](http://t.umblr.com/redirect?z=https%3A%2F%2Fstedolan.github.io%2Fjq%2F&t=NmU5ZTg4ZTMzMjVkNjQ5NDczMWYwMzI5ZDkwNTA4MmZkOTg0YjA4NixuWHhBWDVZZA%3D%3D&b=t%3ANYUWSMP8glLS4tRmPIbrNA&m=1) at the end in order to get a much nicer and easier to read output. Another alternative to this that works without installing dependencies is `python -m json.tool`, which formats JSON but doesn’t add any coloring or provide as nice of an API for extracting data from it.

An example for this is getting a user by their GitHub ID. In my `.bash_profile`, I’ve added the following function:

{% highlight javascript %}
function github::get_by_id
{
  local id = $1
  shift 1
  curl -sS "https://api.github.com/user/$id" | jq $@
}
{% endhighlight %}

This queries a user by their ID from GitHub and applies all other arguments to `jq`. So if I want the username for a GitHub user, I can just do `github::get_by_id 1981198 '.login'`.

Another cool thing you can do is use these tools with your clipboard. If you want to nicely display some JSON you just copied to your clipboard, you can just do `pbpaste | jq`. If you want to just prettify the JSON in your clipboard to paste somewhere else, you can just do `pbpaste | python -m json.tool | pbcopy`.

<img src="https://s3-us-west-1.amazonaws.com/runnable-design/json.gif" width="664" height="390">

### 5. Using `noti` for notifications

One of my favorite new tools to use in the command line is [`noti`](http://t.umblr.com/redirect?z=https%3A%2F%2Fgithub.com%2Fvariadico%2Fnoti&t=NTczMjE1YTY0OGE3NGNhZjMwMDM5NjgzNzgyNzg4ZjhiOTA3NTgzNixuWHhBWDVZZA%3D%3D&b=t%3ANYUWSMP8glLS4tRmPIbrNA&m=1), which provides native notifications for when a process is finished (amongst other things). Whenever I run a deploy, I make sure to run `noti`. Combined with the example from tip #1 (Programmatically declaring aliases), we can actually get notified after all our deploys by just adding the `noti` command at the beginning of our alias declaration:

{% highlight javascript %}
export ENVS='delta gamma epsilon stage'
for tenv in $ENVS; do
  alias ${tenv}Deploy="noti deploy $tenv"
done
{% endhighlight %}

Whenever the deploy has finished, I get a success/failure notification. It’s a great small tool to use when you don’t want to continually switch tabs to check up on something.

### Conclusion

The world of shell scripting is obviously huge and nearly never-ending. Every developer should constantly be improving. These are just some of my most recent findings. Hopefully, you’ll find them useful.
