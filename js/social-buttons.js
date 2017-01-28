/*============================================================================
  Social Icon Buttons v1.0
  Author:
    Carson Shold | @cshold
    http://www.carsonshold.com
  MIT License
==============================================================================*/
window.CSbuttons = window.CSbuttons || {};

$(function() {
  CSbuttons.cache = {
    $shareButtons: $('.social-sharing')
  }
});

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
  xhr.open("GET", path, true);
  xhr.send();
}

CSbuttons.init = function () {
  CSbuttons.socialSharing();
}

CSbuttons.socialSharing = function () {
  var buttons = CSbuttons.cache.$shareButtons,
    shareLinks = buttons.find('a'),
    permalink = buttons.attr('data-url'),
    legacyUrl = buttons.attr('data-legacy-url');

  // Get share stats from respective APIs
  var twitLink = document.getElementsByClassName('share-twitter')[0],
      linkedinLink = document.getElementsByClassName('share-linkedin')[0],
      hackerNewsLink = document.getElementsByClassName('share-hackernews')[0];

  if (twitLink) {
    twitterTotal = 0;
    loadJSON(
      // path
      'https://opensharecount.com/count.json?url=' + legacyUrl + '&callback=',
      // success
      function(data) {
        twitterTotal += data.count;
      },
      // error
      function(xhr) { console.error(xhr);}
    );
    loadJSON(
      // path
      'https://opensharecount.com/count.json?url=' + permalink + '&callback=',
      // success
      function(data) {
        twitterTotal += data.count;
        var shareCount = twitLink.getElementsByClassName('share-count')[0];
        shareCount.innerText = twitterTotal;
        shareCount.classList.add('is-loaded');
      },
      // error
      function(xhr) { console.error(xhr);}
    );
  };

  if (linkedinLink) {
    linkedinTotal = 0;
    $.getJSON('http://www.linkedin.com/countserv/count/share?url=' + legacyUrl + '&callback=?')
      .done(function(data) {
        linkedinTotal += data.count;
      });
    $.getJSON('http://www.linkedin.com/countserv/count/share?url=' + permalink + '&callback=?')
      .done(function(data) {
        linkedinTotal += data.count;
        var shareCount = linkedinLink.getElementsByClassName('share-count')[0];
        shareCount.innerText = linkedinTotal;
        shareCount.classList.add('is-loaded');
      });
  };

  if (hackerNewsLink) {
    if (legacyUrl) {
      loadJSON(
        // path
        'http://hn.algolia.com/api/v1/search?query=' + legacyUrl + '&restrictSearchableAttributes=url',
        // success
        function(data) {
          hackerNewsLink.href = "https://news.ycombinator.com/item?id=" + data.hits[0].objectID;
          var shareCount = hackerNewsLink.getElementsByClassName('share-count')[0];
          shareCount.innerText = data.hits[0].points;
          shareCount.classList.add('is-loaded');
          if (shareCount.innerText > 0) {
            hackerNewsLink.classList.remove('hidden');
          }
        },
        // error
        function(xhr) { console.error(xhr);}
      );
    }
    if (!legacyUrl) {
      loadJSON(
        // path
        'http://hn.algolia.com/api/v1/search?query=' + permalink + '&restrictSearchableAttributes=url',
        // success
        function(data) {
          hackerNewsLink.href = "https://news.ycombinator.com/item?id=" + data.hits[0].objectID;
          var shareCount = hackerNewsLink.getElementsByClassName('share-count')[0];
          shareCount.innerText = data.hits[0].points;
          shareCount.classList.add('is-loaded');
          if (shareCount.innerText > 0) {
            debugger;
            hackerNewsLink.classList.remove('hidden');
          }
        },
        // error
        function(xhr) { console.error(xhr);}
      );
    };
  }

  // Share popups
  shareLinks.on('click', function(e) {
    var el = $(this),
        popup = el.attr('class').replace('-','_'),
        link = el.attr('href'),
        w = 700,
        h = 400;

    // Set popup sizes
    switch (popup) {
      case 'share_twitter':
        h = 300;
        break;
    }

    if (popup === 'share_twitter') {
      return // Don't do anything
    }

    if (popup) {
      e.preventDefault();
      window.open(link, popup, 'width=' + w + ', height=' + h);
    }
  });
}

$(function() {
  window.CSbuttons.init();
});
