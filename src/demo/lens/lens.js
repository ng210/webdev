//******************************************************************************
// Settings
	var _settings = {
		width: 320,
		height: 200,
		fps: 25,
		radius: 80,
		zoom: 50,
		interpolation: 3,
		size: 0.5
	};
//******************************************************************************
// Globals
	var _cursorPos = new Vector2(_settings.width/2, _settings.height/2);
	var _offsetPos = new Vector2(0,0);
	var _image = GE.image('lens.gif');
//******************************************************************************
// Constants
//******************************************************************************
function init()
{
	Demo.init(_settings);
	$('title').innerHTML = 'Lens';
	$('RestartBtn').setAttribute('disabled', true);
	_settings.zoom /= 100;
	var el = $('interpolation');
	var parent = el.parentNode;
	parent.removeChild(el);
	parent.innerHTML = '<select id="interpolation" onchange="applySetting(this);"><option value="0"/>none</option><option value="1"/>linear</option><option value="2"/>sinusoid</option><option value="3"/>cosinusoid</option></select>';
	$('interpolation').selectedIndex = _settings.interpolation;
	applySetting($('size'));
	initHTML5();
	GE.startStop();
}
//******************************************************************************
function initHTML5()
{
	GE.front.setAttribute('width', _settings.width);
	GE.front.setAttribute('height', _settings.height);
	HTML.applyStyle(GE.front, 'border:none;backgroundColor:black;cursor:none;');
	GE.back.setAttribute('width', _settings.width);
	GE.back.setAttribute('height', _settings.height);
	GE.backContext.drawImage(_image, 0, 0, _settings.width, _settings.height);
	var el = GE.front;

	_offsetPos.x = 0;
	_offsetPos.y = 0;
	while (el.offsetParent)
	{
		_offsetPos.x += el.offsetLeft;
		_offsetPos.y += el.offsetTop;
		el = el.offsetParent;
	}
}
//******************************************************************************
function applySetting(obj)
{
	switch (obj.id)
	{
		case 'width':
		case 'height':
			_settings[obj.id] = parseInt(obj.value);
			initHTML5();
			break;
		case 'fps':
			GE.fps = parseFloat(obj.value);
			GE.stop();
			GE.start();
			break;
		case 'zoom':
			var z = parseFloat(obj.value);
			if (z > 100) z = 100;
			if (z < 0) z = 0;
			_settings.zoom = 1-z/100;
			break;
		case 'interpolation':
			$('size').disabled = (obj.value != 3);
			_settings[obj.id] = parseInt(obj.value);
			break;
		case 'size':
			var s = _settings[obj.id] = parseFloat(obj.value);
			if (s < 0) s = 0;
			if (s > 1) s = 1;
			_settings.size = s;
			obj.value = s; 
			break;
		default:
			_settings[obj.id] = parseFloat(obj.value);
			break;
	}
}
//******************************************************************************
function processInput()
{
	if ((GE.inputs.target == GE.front)&&(GE.inputs.delta))
	{
		// get mouse delta
		var offset = GE.offset();
		_cursorPos.x = GE.inputs.pos[0] - offset[0];
		_cursorPos.y = GE.inputs.pos[1] - offset[1];
		$('info').innerHTML = _cursorPos.x.toPrecision(4)+','+_cursorPos.y.toPrecision(4);
	}
}
//******************************************************************************
function restart()
{
	;
}
//******************************************************************************
function update()
{
	;
}
//******************************************************************************
function render(f)
{
	GE.frontContext.clearRect(0, 0, _settings.width, _settings.height);
	var src = GE.backContext.getImageData(0, 0, _settings.width, _settings.height);
	var dst = GE.frontContext.getImageData(0, 0, _settings.width, _settings.height);
	var stride = _settings.width*4;
	var ix = 0, ix2;
	for (var y=0;y<_settings.height-1;y++)
	{
		var _dy = y-_cursorPos.y;
		for (var x=0;x<_settings.width-1;x++)
		{
			var dx = x-_cursorPos.x;
			var dy = _dy;
			var d = Math.sqrt(dx*dx + dy*dy);
			if (d > _settings.radius)
			{
				dst.data[ix+0] = src.data[ix+0];
				dst.data[ix+1] = src.data[ix+1];
				dst.data[ix+2] = src.data[ix+2];
				dst.data[ix+3] = 255;
			} else
			{
				var a = Math.atan(dy/dx);
				if (dx < 0) a = Math.PI+a;
				var v;
				switch (_settings.interpolation)
				{
					case 0: //y = z
						v = 0;
						//r = d*_settings.zoom;
						break;
					case 1: //y = (1-z)x+z
						v = d/_settings.radius;
						break;
					case 2: //y = (1-z)sin(PI/2*x)+z
						v = Math.sin(Math.PI/2*d/_settings.radius)/2+0.5;
						break;
					case 3: //y = (1-z)(0.5-cos(PI*x)*0.5)+z
						var b = d/_settings.radius;
						if (b < _settings.size) b = 0;
						else b = (b-_settings.size)/(1-_settings.size);
						v = (1-Math.cos(Math.PI*b))/2
						break;
				}
				var r = d*((1.0-_settings.zoom)*v+_settings.zoom);
				var rx2 = _cursorPos.x + Math.cos(a)*r;
				var ry2 = _cursorPos.y + Math.sin(a)*r;
				var nx = Math.floor(rx2);
				var ny = Math.floor(ry2);
				rx2 -= nx; ry2 -= ny;
				var rx1 = 1.0-rx2, ry1 = 1.0-ry2;
				ix2 = nx*4 + ny*stride;
				for (var ci=0;ci<3;ci++)
				{
					var c1=src.data[ix2+ci];
					var c2=src.data[ix2+4+ci];
					var c3=src.data[ix2+stride+ci];
					var c4=src.data[ix2+stride+4+ci];
					dst.data[ix+ci] = (ry1*(c1*rx1+c2*rx2) + ry2*(c3*rx1+c4*rx2));
				}
				dst.data[ix+3] = 255;
			}
			ix += 4;
		}
		ix += 4;
	}
	GE.frontContext.putImageData(dst, 0, 0);
}
