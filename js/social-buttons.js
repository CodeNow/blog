function socialSharing() {
  var buttons = document.getElementsByClassName('social-sharing')[0];
  var shareLinks = buttons.getElementsByTagName('a');
  var permalink = document.querySelectorAll('[data-url]')[0].getAttribute('data-url');
  var legacyUrl = document.querySelectorAll('[data-legacy-url]')[0].getAttribute('data-legacy-url');
  var twitterLink = document.getElementsByClassName('share-twitter')[0];
  var linkedInLink = document.getElementsByClassName('share-linkedin')[0];
  var hackerNewsLink = document.getElementsByClassName('share-hackernews')[0];

  function loadJSON(path, success, error) {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
      if (xhr.readyState === XMLHttpRequest.DONE) {
        if (xhr.status === 200) {
          if (success)
            success(JSON.parse(xhr.responseText));
        } else {
          if (error)
            error(xhr);
        }
      }
    };
    xhr.open('GET', path, true);
    xhr.send();
  }

  if (twitterLink) {
    var twitterShares = 0;
    var twitterCount = twitterLink.getElementsByClassName('share-count')[0];
    updateTwitterCount = function(data) {
      twitterShares += data.count;
      twitterCount.innerText = twitterShares;
      twitterCount.classList.add('is-loaded');
    }
    loadJSON(
      // path
      'https://opensharecount.com/count.json?url=' + legacyUrl + '&callback=',
      // success
      function(data) {
        updateTwitterCount(data);
      },
      // error
      function(xhr) { console.error(xhr);}
    );
    loadJSON(
      // path
      'https://opensharecount.com/count.json?url=' + permalink + '&callback=',
      // success
      function(data) {
        updateTwitterCount(data);
      },
      // error
      function(xhr) { console.error(xhr);}
    );
  };

  if (linkedInLink) {
    var linkedInShares = 0;
    var linkedInCount = linkedInLink.getElementsByClassName('share-count')[0];
    updateLinkedInCount = function(data) {
      linkedInShares += data.count;
      linkedInCount.innerText = linkedInShares;
      linkedInCount.classList.add('is-loaded');
    };
    if (legacyUrl) {
      var legacyUrlScript = document.createElement('script');
      legacyUrlScript.setAttribute('src',
      'https://www.linkedin.com/countserv/count/share?format=jsonp&callback=updateLinkedInCount&url=' + legacyUrl);
      document.body.appendChild(legacyUrlScript);
    }
    if (permalink) {
      var permalinkScript = document.createElement('script');
      permalinkScript.setAttribute('src',
      'https://www.linkedin.com/countserv/count/share?format=jsonp&callback=updateLinkedInCount&url=' + permalink);
      document.body.appendChild(permalinkScript);
    }
  }

  if (hackerNewsLink) {
    var hackerNewsCount = hackerNewsLink.getElementsByClassName('share-count')[0];
    updateHackerNewsCount = function(data) {
      hackerNewsLink.href = 'https://news.ycombinator.com/item?id=' + data.hits[0].objectID;
      hackerNewsCount.innerText = data.hits[0].points;
      hackerNewsCount.classList.add('is-loaded');
      if (hackerNewsCount.innerText > 0) {
        hackerNewsLink.classList.remove('hidden');
      }
    };
    if (legacyUrl) {
      loadJSON(
        // path
        'https://hn.algolia.com/api/v1/search?query=' + legacyUrl + '&restrictSearchableAttributes=url',
        // success
        function(data) {
          updateHackerNewsCount(data);
        },
        // error
        function(xhr) { console.error(xhr);}
      );
    }
    if (!legacyUrl) {
      loadJSON(
        // path
        'https://hn.algolia.com/api/v1/search?query=' + permalink + '&restrictSearchableAttributes=url',
        // success
        function(data) {
          updateHackerNewsCount(data);
        },
        // error
        function(xhr) { console.error(xhr);}
      );
    };
  }

  for (var i = 0; i < shareLinks.length; i++) {
    shareLinks[i].onclick = function(e) {
      e.preventDefault();
      window.open(this.href, 'share_window', 'width=700, height=400');
    }
  }
}

document.addEventListener('DOMContentLoaded', socialSharing());
