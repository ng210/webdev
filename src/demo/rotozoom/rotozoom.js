//******************************************************************************
// Settings
	var _settings = {
		width: 320,
		height: 200,
		fps: 25,
		zoom: 1,
		rotation: 2,
		interpolation: 0
	};
//******************************************************************************
// Globals
	var _cursorPos = new Vector2(_settings.width/2, _settings.height/2);
	var _offsetPos = new Vector2(0,0);
	var _image = GE.image('javascript.gif');
	var _imgSize = 0;
	var _zoom;
	var _angle;
	var _zoomD = 2*Math.PI/_settings.fps/17;
	var _angleD = 2*Math.PI/_settings.fps/11;

//******************************************************************************
// Constants
//******************************************************************************
function init()
{
	Demo.init(_settings);
	$('title').innerHTML = 'Rotozoom';
	$('RestartBtn').setAttribute('disabled', true);
	var el = $('interpolation');
	var parent = el.parentNode;
	parent.removeChild(el);
	parent.innerHTML = '<select id="interpolation" onchange="applySetting(this);"><option value="0"/>none</option><option value="1"/>linear</option><option value="2"/>sinusoid</option></select>';
	var el = $('interpolation');
	el.selectedIndex = _settings.interpolation;
	el.disabled = true;
	initHTML5();
	applySetting($('zoom'));
	applySetting($('rotation'));
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
	_imgSize = _settings.width*_settings.height*4;
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
		case 'interpolation':
			_settings[obj.id] = parseInt(obj.value);
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
		_cursorPos.x = GE.inputs.pos[0] - _offsetPos.x;
		_cursorPos.y = GE.inputs.pos[1] - _offsetPos.y;
		//$('info').innerHTML = _cursorPos.x.toPrecision(4)+','+_cursorPos.y.toPrecision(4);
	}
}
//******************************************************************************
function restart()
{
	;
}
function update(f)
{
	_zoom = (Math.sin(_zoomD*f)+1)*_settings.zoom;
	_angle = Math.cos(_angleD*f)*_settings.rotation;
}
//******************************************************************************
function render(f)
{
	GE.frontContext.clearRect(0, 0, _settings.width, _settings.height);
	var src = GE.backContext.getImageData(0, 0, _settings.width, _settings.height);
	var dst = GE.frontContext.getImageData(0, 0, _settings.width, _settings.height);
	var stride = _settings.width*4;
	var ix = 0, ix21, ix22, ix23, ix24;
	var ox = _cursorPos.x/2;
	var oy = _cursorPos.y/2;
	for (var y=0;y<_settings.height;y++)
	{
		for (var x=0;x<_settings.width;x++)
		{
			var rx2 = (_cursorPos.x + (x - _cursorPos.x) * Math.cos(_angle) - (y - _cursorPos.y) * Math.sin(_angle))*_zoom;
			var ry2 = (_cursorPos.y + (x - _cursorPos.x) * Math.sin(_angle) + (y - _cursorPos.y) * Math.cos(_angle))*_zoom;
			var cx1 = Math.floor(rx2);
			var cy1 = Math.floor(ry2);
			rx2 -= cx1; ry2 -= cy1;
			var rx1 = 1.0-rx2, ry1 = 1.0-ry2;
			cx1 = cx1 % _settings.width;
			if (cx1 < 0) cx1 += _settings.width;
			cy1 = cy1 % _settings.height;
			if (cy1 < 0) cy1 += _settings.height;
			var cx2 = (cx1 + 1) % _settings.width;
			var cy2 = (cy1 + 1) % _settings.height;
			ix21 = (cy1*stride + cx1*4);
			ix22 = (cy1*stride + cx2*4);
			ix23 = (cy2*stride + cx1*4);
			ix24 = (cy2*stride + cx2*4);
			
			for (var ci=0;ci<3;ci++)
			{
				var c1=src.data[ix21+ci];
				var c2=src.data[ix22+ci];
				var c3=src.data[ix23+ci];
				var c4=src.data[ix24+ci];
				dst.data[ix+ci] = (ry1*(c1*rx1+c2*rx2) + ry2*(c3*rx1+c4*rx2));
			}
			dst.data[ix+3] = 255;
			ix += 4;
		}
		//ix += 4;
	}
	GE.frontContext.putImageData(dst, 0, 0);
}
