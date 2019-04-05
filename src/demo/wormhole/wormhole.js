//******************************************************************************
// Settings
	var _settings = {
		 width: 400
		,height: 300
		,fps: 25
		,rings: 100
		,speed: 2
		//,interpolation: 3
		,radius: 0.8
		,size: 15
	};
//******************************************************************************
// Globals
	var _cursorPos = new Vector2(_settings.width/2, _settings.height/2);
	var _offsetPos = new Vector2(0,0);
	var _maxRadius = 0;
	var _radius = 0;
	var _dots = 50;
	var _rings = [];
	var _mouseActive = false;
	var _lastRing = null;
	
//******************************************************************************
// Constants
//******************************************************************************
function init()
{
	Demo.init(_settings);
	$('title').innerHTML = 'Wormhole';
	$('RestartBtn').setAttribute('disabled', true);
/*
	var el = $('interpolation');
	var parent = el.parentNode;
	parent.removeChild(el);
	parent.innerHTML = '<select id="interpolation" onchange="applySetting(this);"><option value="0"/>none</option><option value="1"/>linear</option><option value="2"/>sinusoid</option><option value="3"/>cosinusoid</option></select>';
	$('interpolation').selectedIndex = _settings.interpolation;
*/
	applySetting($('speed'));
	applySetting($('width'));
	applySetting($('rings'));
	applySetting($('radius'));
	initHTML5();
	GE.startStop();
}
//******************************************************************************
function initHTML5()
{
	GE.front.setAttribute('width', _settings.width);
	GE.front.setAttribute('height', _settings.height);
	HTML.applyStyle(GE.front, 'border:none;backgroundColor:#000000;cursor:none;');
}
//******************************************************************************
function initRings()
{
	if (_rings)
	{
		delete _rings;
	}
	_rings = [];
	for (var ri=0;ri<_settings.rings;ri++)
	{
		var c = Math.floor(Math.random()*8);
		var r = c & 1 ? 255 : 127;
		var g = c & 2 ? 255 : 127;
		var b = c & 4 ? 255 : 127;
		_rings.push([0.5, 0.5, _settings.size*ri/_settings.rings, ri, [r,g,b]]);
	}
	_lastRing = _rings[_settings.rings-1];
}
//******************************************************************************
function applySetting(obj)
{
	switch (obj.id)
	{
		case 'width':
		case 'height':
			_settings[obj.id] = parseInt(obj.value);
			_maxRadius = _settings.height < _settings.width ? _settings.height/2 : _settings.width/2;
			initHTML5();
			initRings();
			break;
		case 'fps':
			GE.fps = parseFloat(obj.value);
			GE.stop();
			GE.start();
			break;
		case 'rings':
			var c = parseInt(obj.value);
			_settings[obj.id] = c;
			initRings();
			break;
		case 'speed':
			var s = parseFloat(obj.value);
			if (s <= 0) s = 0.1;
			if (s > 10) s = 9.9;
			r = Math.round(r*10)/10;
			_settings[obj.id] = s/_settings.fps;
			break;
		case 'radius':
			var r = parseFloat(obj.value);
			if (r <= 0) r = 0.1;
			if (r > 3) r = 3;
			r = Math.round(r*10)/10;
			_radius = _maxRadius * r;
			_settings[obj.id] = r;
			initRings();
			break;
		case 'size':
			var s = parseInt(obj.value);
			_settings[obj.id] = s;
			initRings();
			break;			
/*
		case 'interpolation':
			$('size').disabled = (obj.value != 3);
			_settings[obj.id] = parseInt(obj.value);
			break;
*/
		default:
			_settings[obj.id] = parseFloat(obj.value);
			break;
	}
}
//******************************************************************************
function processInput()
{
	if (GE.inputs.target == GE.front)
	{
		_mouseActive = true;
		// get mouse delta
		var offset = GE.offset();
		_cursorPos.x = GE.inputs.pos[0] - offset[0];
		_cursorPos.y = GE.inputs.pos[1] - offset[1];
	} else
	{
		_mouseActive = false;
	}
}
//******************************************************************************
function restart()
{
	;
}
//******************************************************************************
function update(f)
{
	var cx, cy;
	if (_mouseActive)
	{
		cx = _cursorPos.x/_settings.width - 0.5;
		cy = _cursorPos.y/_settings.height - 0.5;
	} else
	{
		cx = _rings[0][0] - (_rings[0][0] - 1.5*Math.cos(f/10))/25;
		cy = _rings[0][1] - (_rings[0][1] - 1.5*Math.sin(f/10)*Math.cos(f/10))/25;
	}
	var ri = _lastRing[3];
	for (var r=0;r<_rings.length;r++)
	{
		var f2 = r/_rings.length; f2 *= f2;
		var f1 = 1-f2;
		_rings[ri][0] = cx*f1 + _rings[ri][0]*f2;
		_rings[ri][1] = cy*f1 + _rings[ri][1]*f2;
		_rings[ri][2] -= _settings.speed;
		if (_rings[ri][2] < -1/_settings.rings)
		{
			var c = Math.floor(Math.random()*8);
			var r = c & 1 ? 255 : 100;
			var g = c & 2 ? 255 : 100;
			var b = c & 4 ? 255 : 100;
			_rings[ri] = [_lastRing[0], _lastRing[1], _lastRing[2]+_settings.size/_settings.rings, ri, [r, g, b]];
			_lastRing = _rings[ri];
		}
		ri = _rings[ri][3] - 1;
		if (ri < 0) ri += _rings.length;
	}
}
//******************************************************************************
function render(f)
{
	update(f);
	GE.frontContext.clearRect(0, 0, _settings.width, _settings.height);
	var dst = GE.frontContext.getImageData(0, 0, _settings.width, _settings.height);
	var stride = _settings.width*4;
	var fi = Math.PI*Math.sin(f/100);
	var angleDiff = 2*Math.PI/_dots;
	var rad = _radius;
	for (var r=0;r<_rings.length;r++)
	{
		for (var d=0;d<_dots;d++)
		{
			//rad = 0.5*_radius/(_rings[r][2]+0.5);
			var x = _rings[r][0] + _settings.radius*Math.cos(fi);
			var y = _rings[r][1] + _settings.radius*Math.sin(fi);
			x = x/(_rings[r][2]+1.0);
			y = y/(_rings[r][2]+1.0);
			fi += angleDiff;
			if ((x > -0.5) && (x < 0.5) &&
			    (y > -0.5) && (y < 0.5))
			{
				var ix = Math.floor(_settings.height*(y+0.5))*stride + Math.floor(_settings.width*(x+0.5))*4;
				dst.data[ix+0] = _rings[r][4][0];
				dst.data[ix+1] = _rings[r][4][1];
				dst.data[ix+2] = _rings[r][4][2];
				var af = _rings[r][2]*0.5;
				dst.data[ix+3] = Math.floor(255/(af*af+1));
			}
		}
	}	
	GE.frontContext.putImageData(dst, 0, 0);
}
