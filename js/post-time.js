window.addEventListener('DOMContentLoaded', function(){
  var timeEl = document.getElementsByTagName('time');

  if (timeEl) {
    for (i = 0; i < timeEl.length; i++) {
      timeEl[i].innerHTML = moment(timeEl[i].innerHTML, 'YYYYMMDD').fromNow();
    }
  }
});
