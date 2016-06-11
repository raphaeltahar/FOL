	var champ=document.getElementById('f').getElementsByTagName('button');
	for(i=0;i != champ.length;i++){
		champ[i].onmouseover=function(){this.nextSibling.style.display='inline'};
		champ[i].onmouseout=function(){this.nextSibling.style.display='none'};
	}

document.getElementById('my_title').onmouseover = function() {
	document.getElementById('desc').style.visibility= 'visible';
	document.getElementById('desc').innerHTML='That the easy mode, you start with 100 coins!';
}
document.getElementById('my_title1').onmouseover = function() {
	document.getElementById('desc').style.visibility= 'visible';
	document.getElementById('desc').innerHTML='That the easy mode, you start with 50 coins!';
}
document.getElementById('my_title2').onmouseover = function() {
	document.getElementById('desc').style.visibility= 'visible';
	document.getElementById('desc').innerHTML='That the easy mode, you start with 10 coins!';
}

