function getXMLHttpRequest() {
    var xhr = null;
     
    if (window.XMLHttpRequest || window.ActiveXObject) {
        if (window.ActiveXObject) {
            try {
                xhr = new ActiveXObject("Msxml2.XMLHTTP");
            } catch(e) {
                xhr = new ActiveXObject("Microsoft.XMLHTTP");
            }
        } else {
            xhr = new XMLHttpRequest(); 
        }
    } else {
        alert("Votre navigateur ne supporte pas l'objet XMLHTTPRequest...");
        return null;
    }
    return xhr;
}

function getCookie(c_name) {
	var c_value = document.cookie;
	var c_start = c_value.indexOf(" " + c_name + "=");
	if (c_start == -1)
		c_start = c_value.indexOf(c_name + "=");
	if (c_start == -1)
	  c_value = null;
	else
	{
		c_start = c_value.indexOf("=", c_start) + 1;
		var c_end = c_value.indexOf(";", c_start);
		if (c_end == -1)
			c_end = c_value.length;
		c_value = unescape(c_value.substring(c_start,c_end));
	}
	return c_value;
}

function setCookie(c_name,value,exdays) {
	var exdate=new Date();
	exdate.setDate(exdate.getDate() + exdays);
	var c_value=escape(value) + ((exdays==null) ? "" : "; expires="+exdate.toUTCString());
	document.cookie=c_name + "=" + c_value;
}

function Tileset(url) {
	this.image = new Image();
	this.image.tsReference = this;
	this.image.onload = function() {
		if(!this.complete)
			throw new Error("Erreur lors du chargement du tileset.");
		this.tsReference.width = this.width / 32;
	}
	this.image.src = url;
}

Tileset.prototype.drawTile = function(nb, context, x, y) {
	var xSpriteTile = nb % this.width;
	if(xSpriteTile == 0)
		xSpriteTile = this.width;
	
	var ySpriteTile = Math.ceil(nb / this.width);
	var xSource = (xSpriteTile - 1) * 32;
	var ySource = (ySpriteTile - 1) * 28;

	context.drawImage(this.image, xSource, ySource, 32, 28, x, y, 32, 32);
}

function Map(name) {
	var xhr = getXMLHttpRequest();
	
	xhr.open("GET", '../maps/' + name, false);
	xhr.send(null);
	if(xhr.readyState != 4 || (xhr.status != 200 && xhr.status != 0)) // Code == 0 en local
		throw new Error("Impossible de charger la carte nommée \"" + name + "\" (code HTTP : " + xhr.status + ").");
	var JsonData = xhr.responseText;
	var mapData = JSON.parse(JsonData);
	this.tileset = new Tileset("../images/crops_tileset_final.png");
	this.map = mapData.map;
}

Map.prototype.drawMap = function(context, frame) {
    for(var i = 0; i < 13 ; i++) {
        var line = this.map[i];
		var y = i * 28;
		if (i % 2 == 0) {
			for(var j = 0, k = 10 ; j < k ; j++) {
				this.tileset.drawTile(line[j], context, (j * 32) - 16, (y - 16) - (i * 16));
			}
		}
		else {
			for(var j = 0, k = 10 ; j < k ; j++) {
				this.tileset.drawTile(line[j], context, j * 32, (y - 16) - (i * 16));
			}
		}
	}
}

var DIRECTION = {
    "BAS"    : 0,
    "GAUCHE" : 1,
    "DROITE" : 2,
    "HAUT"   : 3
}
 
function Farmer(url, x, y, direction) {
	this.x = x;
	this.y = y;
	this.direction = direction;

	this.image = new Image();
	this.image.referenceDuPerso = this;
	this.image.onload = function() {
        if(!this.complete) 
            throw "Erreur de chargement du sprite nommé \"" + url + "\".";
         
		this.referenceDuPerso.largeur = this.width / 4;
		this.referenceDuPerso.hauteur = this.height / 6;
	}
	this.image.src = "../images/" + url;
}

Farmer.prototype.drawFarmer = function(context) {
	var posx = 0;
	var posy = 0;
	
	// Impaire
	if (this.y == 0) {
		posx = (this.x * 32) - 16;
		posy = - 16;
	}
	else if (this.y % 2 != 0) {
		posx = (this.x * 32);
		posy = ((this.y * 28)/2) - 22;
	}
	// Paire
	else {
		posx = (this.x * 32) - 16;
		posy = ((this.y * 28) / 2) - 24;
	}
	socket.emit('new_coord', {"posx": this.x, "posy": this.y, "id": getCookie("idplayer")});
/*	socket.on('new_pos_grid', function (pos_grid) {
		for (var i = 1; i < pos_grid.length; i++) {
			if (i == getCookie("idplayer")) {
				i++; }
			var tmp = i + 1;
			console.log(tmp);
			console.log(pos_grid[2][0]);
			console.log(pos_grid[2][1]);
			context.drawImage(this.image, 0, this.direction * this.hauteur, this.largeur, this.hauteur, parseInt(pos_grid[tmp][0]), parseInt(pos_grid[tmp][1]), this.largeur, this.hauteur);
		}
	});*/
	context.drawImage(this.image, 0, this.direction * this.hauteur, this.largeur, this.hauteur,
    posx, posy, this.largeur, this.hauteur);
	context.drawImage(this.image, 0, 4 * this.hauteur, this.largeur, this.hauteur,
    posx, posy, this.largeur, this.hauteur);
	context.drawImage(this.image, 0, 5 * this.hauteur, this.largeur, this.hauteur,
    posx, posy, this.largeur, this.hauteur);
}

Farmer.prototype.getCoordonneesAdjacentes = function(direction)  {
    var coord = {'x' : this.x, 'y' : this.y};
    switch(direction) {
        case DIRECTION.BAS : 
            coord.y++;
            break;
        case DIRECTION.GAUCHE : 
            coord.x--;
            break;
        case DIRECTION.DROITE : 
            coord.x++;
            break;
        case DIRECTION.HAUT : 
            coord.y--;
            break;
    }
    return coord;
}

Farmer.prototype.move = function(direction) {
    // On change la direction du personnage
    this.direction = direction;

    // On vérifie que la case demandée est bien située dans la carte
    var prochaineCase = this.getCoordonneesAdjacentes(direction);

    // On effectue le déplacement
    this.x = prochaineCase.x;
    this.y = prochaineCase.y;
         
    return true;
}

function showPanel(currentTile) {
	node = document.getElementById("pannel");
	switch(currentTile) {
	case 5 :
		node.style.visibility = "visible";
		node.innerHTML = "What do you want to plant / build?<br/><br/><br/><br/>Carottes :<br/>Prix : 2<br/>Press c to plant!<br/><br/>Radis :<br/>Prix : 4<br/>Press r to plant!<br/><br/>Navets :<br/>Prix : 6<br/>Press n to plant!<br/><br/>Cold Storage :<br/>Prix : 50<br/>Press f to build!<br/><br/>Barn :<br/>Prix : 10<br/>Press b to build!<br/><br/>Silo :<br/>Prix : 20<br/>Press e to plant!<br/><br/>";
		break;
	case 1 : case 2 : case 3 :
		node.style.visibility = "visible";
		node.innerHTML = "Harvesting current Tile!";
		break;
	case 9 : case 10 : case 11 :
		node.style.visibility = "visible";
		node.innerHTML = "Crops not mature yet!";
		break;
	case 39 :
		node.style.visibility = "visible";
		node.innerHTML = "Cold Storage";
	case 38 :
		node.style.visibility = "visible";
		node.innerHTML = "Silo";
	case 37 :
		node.style.visibility = "visible";
		node.innerHTML = "Barn";
	default :
		return true;
	}
}

Map.prototype.eventTile = function (farmer) {
	currentTile = this.map[farmer.y][farmer.x];
	showPanel(currentTile);
}

var mapJsonData = new Map("../maps/map"+getCookie("idplayer")+".json");
var farmer = new Farmer("charset-resized.png", 3,3, DIRECTION.HAUT);
var frame = parseInt(getCookie("idplayer"));

window.onload = function initMap() {
	var can = document.getElementById('canvas');
	var ctx = can.getContext('2d');

	mapJsonData.drawMap(ctx, frame);
	farmer.drawFarmer(ctx);
	window.onkeydown = function(event) {
		var e = event || window.event;
		var key = e.which || e.keyCode;
		switch(key) {
		case 38 : case 122 : case 119 : case 90 : case 87 : // Flèche haut, z, w, Z, W
			farmer.move(DIRECTION.HAUT);
			if (farmer.y < 0) {
				frame = frame - 1;
				farmer.y = 13;
				mapJsonData = new Map("../maps/map"+frame+".json");
				canvas.width = canvas.width;
				mapJsonData.drawMap(ctx, frame);
				farmer.drawFarmer(ctx);
				mapJsonData.eventTile(farmer);
			}
			canvas.width = canvas.width;
			mapJsonData.drawMap(ctx, frame);
			farmer.drawFarmer(ctx);
			mapJsonData.eventTile(farmer);
			break;
		case 40 : case 115 : case 83 : // Flèche bas, s, S
			farmer.move(DIRECTION.BAS);
			if (farmer.y > 12) {
				frame = frame + 1;
				farmer.y = 0;
				mapJsonData = new Map("../maps/map"+frame+".json");
				canvas.width = canvas.width;
				mapJsonData.drawMap(ctx, frame);
				farmer.drawFarmer(ctx);
				mapJsonData.eventTile(farmer);
			}
			canvas.width = canvas.width;
			mapJsonData.drawMap(ctx, frame);
			farmer.drawFarmer(ctx);
			mapJsonData.eventTile(farmer);
			break;
		case 37 : case 113 : case 97 : case 81 : case 65 : // Flèche gauche, q, a, Q, A
			farmer.move(DIRECTION.GAUCHE);
			canvas.width = canvas.width;
			mapJsonData.drawMap(ctx, frame);
			farmer.drawFarmer(ctx);
			mapJsonData.eventTile(farmer);
			break;
		case 39 : case 100 : case 68 : // Flèche droite, d, D
			farmer.move(DIRECTION.DROITE);
			canvas.width = canvas.width;
			mapJsonData.drawMap(ctx, frame);
			farmer.drawFarmer(ctx);
			mapJsonData.eventTile(farmer);
			break;
		case 82 : // r = Radis
			console.log("Radis");
			socket.emit('radis', {"x": farmer.x, "y": farmer.y, "frame": frame, "id": getCookie("idplayer")});
			socket.on('plant_radis', function(newJson) {
				mapJsonData = new Map("../maps/map"+frame+".json");
				mapJsonData.drawMap(ctx, frame);
				farmer.drawFarmer(ctx);
			});
			break;
		case 78 : // n = Navet
			console.log("Navet");
			socket.emit('navet', {"x": farmer.x, "y": farmer.y, "frame": frame, "id": getCookie("idplayer")});
			socket.on('plant_navet', function(newJson) {
				mapJsonData = new Map("../maps/map"+frame+".json");
				mapJsonData.drawMap(ctx, frame);
				farmer.drawFarmer(ctx);
			});
			break;
		case 67 : // c = Carotte
			console.log("Carotte");
			socket.emit('carotte', {"x": farmer.x, "y": farmer.y, "frame": frame, "id": getCookie("idplayer")});
			socket.on('plant_carotte', function(newJson) {
				mapJsonData = new Map("../maps/map"+frame+".json");
				mapJsonData.drawMap(ctx, frame);
				farmer.drawFarmer(ctx);
			});
			break;
		case 70 : // f = Cold Storage
			console.log("Clod Storage");
			socket.emit('cold', {"x": farmer.x, "y": farmer.y, "frame": frame, "id": getCookie("idplayer")});
			socket.on('plant_cold', function(newJson) {
				mapJsonData = new Map("../maps/map"+frame+".json");
				mapJsonData.drawMap(ctx, frame);
				farmer.drawFarmer(ctx);
			});
			break;
		case 69 : // e = Silo
			console.log("Silo");
			socket.emit('silo', {"x": farmer.x, "y": farmer.y, "frame": frame, "id": getCookie("idplayer")});
			socket.on('plant_silo', function(newJson) {
				mapJsonData = new Map("../maps/map"+frame+".json");
				mapJsonData.drawMap(ctx, frame);
				farmer.drawFarmer(ctx);
			});
			break;
		case 66 : // b = Barn
			console.log("Barn");
			socket.emit('barn', {"x": farmer.x, "y": farmer.y, "frame": frame, "id": getCookie("idplayer")});
			socket.on('plant_barn', function(newJson) {
				mapJsonData = new Map("../maps/map"+frame+".json");
				mapJsonData.drawMap(ctx, frame);
				farmer.drawFarmer(ctx);
			});
			break;
		case 72 : // h = Harvest
			console.log("Harvesting");
		break;
		default : 
			//alert(key);
			// Si la touche ne nous sert pas, nous n'avons aucune raison de bloquer son comportement normal.
			return true;
		}
		
	}
}
