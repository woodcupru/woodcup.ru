$.fn.exists = function(callback) {
  var args = [].slice.call(arguments, 1);
  if (this.length) {
    callback.call(this, args);
  }
  return this;
};

function getRandom(min, max) {
  return Math.random() * (max - min) + min;
}


$(document).ready(function() {
    
$('#top_nav').exists(function () {
    
$(window).scroll(function() {
  
  // selectors
  var $window = $(window),
      $body = $('#top_nav'),
      $panel = $('.spyblock');

  var scroll = $window.scrollTop() + ($window.height() / 3);
 
  $panel.each(function () {
    var $this = $(this);
    if ($this.position().top <= scroll && $this.position().top + $this.height() > scroll) {

     $body.removeClass(function (index, css) {
        return (css.match (/(^|\s)bg-\S+/g) || []).join(' ');
      });
      $body.addClass('bg-' + $(this).data('color'));
    }
  });    
  
}).scroll();
    
});    
    

$('.image-popup').magnificPopup({
	type: 'image',
	closeOnContentClick: true,
	mainClass: 'mfp-img-mobile',
	image: {
		verticalFit: true
	}	
});


	$('.popup-youtube, .popup-vimeo, .popup-gmaps').magnificPopup({
		disableOn: 700,
		type: 'iframe',
		mainClass: 'mfp-fade',
		removalDelay: 160,
		preloader: false,

		fixedContentPos: false
	});


var list = document.getElementsByClassName('item');
for (var i = 0; i < list.length; i++) {

  // a = getRandom(30, 70) + '% ';
  // b = getRandom(30, 70) + '% ';
  // c = getRandom(30, 70) + '% ';
  // d = getRandom(30, 70) + '% ';

  // e = getRandom(30, 70) + '% ';
  // f = getRandom(30, 70) + '% ';
  // g = getRandom(30, 70) + '% ';
  // h = getRandom(30, 70) + '%';

  var src = list[i].getAttribute('data-src');
  list[i].style.backgroundImage="url('" + src + "')";
  // list[i].style.borderRadius = a+b+c+d+'/'+e+f+g+h;

}

var card_bg = document.getElementsByClassName('card_bg');
for (var i = 0; i < card_bg.length; i++) {

  a = getRandom(30, 70) + '% ';
  b = getRandom(30, 70) + '% ';
  c = getRandom(30, 70) + '% ';
  d = getRandom(30, 70) + '% ';

  e = getRandom(30, 70) + '% ';
  f = getRandom(30, 70) + '% ';
  g = getRandom(30, 70) + '% ';
  h = getRandom(30, 70) + '%';

  card_bg[i].style.borderRadius = a+b+c+d+'/'+e+f+g+h;
}

 
 
$('#switch-lang').css({'pointer-events':'none',
   'cursor':'default'}).attr('disabled','disabled');

  function langButtonListen() {
    $('#switch-lang').click(function (event) {
      event.preventDefault();
      $('[lang="ru"]').toggle();
      $('[lang="en"]').toggle();
      // Switch cookie stored language.
      if ($.cookie('lang') === 'en') {
        $.cookie('lang', 'zh', { expires: 7 });
      } else {
        $.cookie('lang', 'en', { expires: 7 });
      }
    });
    // Enable lang switching button.
    $('#switch-lang').css({'pointer-events':'auto',
     'cursor':'pointer'}).removeAttr('disabled');
  }

  // Check if language cookie already exists.
  if ($.cookie('lang')) {
    var lang = $.cookie('lang');
    if (lang === 'en') {
      $('[lang="ru"]').hide();
      langButtonListen();
    } else {
      $('[lang="en"]').hide();
      langButtonListen();
    }
  } else {
        
      $('[lang="ru"]').hide();
      $.cookie('lang', 'en', { expires: 7 });
      langButtonListen();
  }

    
    
});
