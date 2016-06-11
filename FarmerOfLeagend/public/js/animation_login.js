var i = 0;

function slide_rideaux() {//move le log-in
	if (i<200) {//px pour disparaitre
	  mrr.style.right = parseInt(mrr.style.right)-5+'px';
	  mrl.style.left = parseInt(mrl.style.left)-5+'px';
	  i++;
	  setTimeout(slide_rideaux,20); // call doMove in 20msec
	}
  else {
 		document.getElementById("my_fdiv").style.zIndex ='3'; 
	}
}

function init_r() {
  mrr = document.getElementById('my_rid_r'); // get the "div" object
  mrl = document.getElementById('my_rid_l'); // get the "div" object
  mrr.style.right = '1px'; // set its initial position to 10px
  mrl.style.left = '1px'; // set its initial position to 10px
  slide_rideaux(); // start animating
}

 window.onload = init_r;