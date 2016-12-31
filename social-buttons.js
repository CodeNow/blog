/*============================================================================
  Social Icon Buttons v1.0
  Author:
    Carson Shold | @cshold
    http://www.carsonshold.com
  MIT License
==============================================================================*/
window.CSbuttons = window.CSbuttons || {};
var hi;

$(function() {
  CSbuttons.cache = {
    $shareButtons: $('.social-sharing')
  }
});

function loadJSON(path, success, error)
{
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function()
  {
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
  var $buttons = CSbuttons.cache.$shareButtons,
    $shareLinks = $buttons.find('a'),
    permalink = $buttons.attr('data-permalink'),
    permalink2 = permalink.replace('http://',''),
    legacyUrl = document.getElementsByClassName('legacy-url')[0].innerText;
    legacyUrl2 = legacyUrl.replace('http://',''),
    total = 0;

  // Get share stats from respective APIs
  var twitLink = $('.share-twitter'),
      linkedinLink = $('.share-linkedin'),
      hackerNewsLink = $('.share-hackernews');

  if (twitLink.length) {
    $.getJSON('https://opensharecount.com/count.json?url=' + legacyUrl + '&callback=?')
      .done(function(data) {
        total += data.count;
        $.getJSON('https://opensharecount.com/count.json?url=' + legacyUrl2 + '&callback=?')
        .done(function(data) {
          total += data.count;
          twitLink.find('.share-count').text(total).addClass('is-loaded');
        });
      });
  };

  if (linkedinLink.length) {
    $.getJSON('http://www.linkedin.com/countserv/count/share?url=' + legacyUrl + '&callback=?')
      .done(function(data) {
        linkedinLink.find('.share-count').text(data.count).addClass('is-loaded');
      });
  };

  if (hackerNewsLink.length) {
    loadJSON('http://hn.algolia.com/api/v1/search?query=' + legacyUrl + '&restrictSearchableAttributes=url', function(data) {hackerNewsLink.prop("href", "https://news.ycombinator.com/item?id=" + data.hits[0].objectID); hackerNewsLink.find('.share-count').text(data.hits[0].points).addClass('is-loaded'); }, function(xhr) { console.error(xhr); });
  };

  // Share popups
  $shareLinks.on('click', function(e) {
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
