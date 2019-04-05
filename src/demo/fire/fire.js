//******************************************************************************
// Settings
	var _settings = {
		width: 320,
		height: 200,
		zoom: 4,
		fps: 25,
		wind: 80,
		intensity: 50,
		damping: 0.1
	};

//******************************************************************************
// Globals
	var _cursorPos = new Vector2(_settings.width/2, _settings.height/2);
	var _offsetPos = new Vector2(0,0);
	var _image = GE.image('fire.gif');
	var _heatMaps = [];
	var _heatMapWidth = 0;
	var _heatMapHeight = 0;
	var _heatCanvas = null;
	var _heatContext = null;
	var _filter = [
		0.0, 0.0, 0.0,
		0.0, 1.0, 0.0,
		0.0, 0.0, 0.0
	];
//******************************************************************************
function initHeatMaps()
{
	var arr1 = [], arr2 = [];
	if (_heatCanvas == null)
	{
		_heatCanvas = $$('canvas');
		_heatContext = _heatCanvas.getContext('2d');
		_heatContext.clearRect(0, 0, _heatMapWidth, _heatMapHeight);
	}
	_heatCanvas.setAttribute('width', _heatMapWidth);
	_heatCanvas.setAttribute('height', _heatMapHeight);

	for (var i=0;i<_heatMapWidth*_heatMapHeight;i++)
	{
		arr1.push(0.0);
		arr2.push(0.0);
	}
	_heatMaps.push(arr1);
	_heatMaps.push(arr2);
}
//******************************************************************************
function init()
{
	Demo.init(_settings);
	$('title').innerHTML = 'Fire';
	$('RestartBtn').setAttribute('disabled', true);
	initHeatMaps();
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
			initHeatMaps();
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
function update(f)
{
	// update heatmap;
	for (var y=0;y<_heatMapHeight;y++)
	{
		for (var x=0;x<_heatMapWidth;x++)
		{
			applyFilter(x, y, f);
		}
	}
}
//******************************************************************************
function render(f)
{
	GE.frontContext.clearRect(0, 0, _settings.width, _settings.height);
	var src = GE.backContext.getImageData(0, 0, _settings.width, _settings.height);
	var dst = GE.frontContext.getImageData(0, 0, _settings.width, _settings.height);
	var stride = _settings.width*4;

	var ix = 0;
	for (var h=1;h<_settings.height-1;h++)
	{
		for (var w=1;w<_settings.width-1;w++)
		{
			dst.data[ix+0] = src.data[ix+0];
			dst.data[ix+1] = src.data[ix+1];
			dst.data[ix+2] = src.data[ix+2];
			dst.data[ix+3] = 255;
			ix += 4;
		}
	}
	GE.frontContext.putImageData(dst, 0, 0);
}
//******************************************************************************
function applyFilter(x, y)
{
	var v, x1 = x-1, x2= x+2, y1 = y-1, y2 = y+2;
	if (x == 0) x1 = x;
	else if (x == _settings.width-1) x2 = x;
	if (y == 0) y1 = y;
	else if (y == _settings.height-1) y2 = y;

	var ix = 0;
	for (var y=y1;y<y2;y++)
	{
		for (var x=x1;x<x2;x++)
		{
			ix = y*_settings.width + x;
			v += src[ix1 + j]
		}
		ix1 += _settings.width;
	}
	dst[w+h*_settings.width] = v;
}