//******************************************************************************
// Settings
	var _settings = {
		width: 320,
		height: 256,
		fps: 20,
		zoom: 4,
		vx: 1.0,
		vy: 1.0
	};
//******************************************************************************
function init()
{
	Demo.init(_settings);
	$('title').innerHTML = 'Plasma effect';
	$('RestartBtn').setAttribute('disabled', true);
	initHTML5();
	_settings.vx = GE.fps*2*Math.PI/GE.front.width/10;
	_settings.vy = GE.fps*2*Math.PI/GE.front.height/10;
	GE.startStop();
}
//******************************************************************************
function applySetting(obj)
{
	switch (obj.id)
	{
		case 'vx':
			_settings[obj.id] = GE.fps*2*Math.PI/GE.front.width*parseFloat(obj.value)/10;
			break;
		case 'vy':
			_settings[obj.id] = GE.fps*2*Math.PI/GE.front.height*parseFloat(obj.value)/10;
			break;
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
		default:
			_settings[obj.id] = parseFloat(obj.value);
			break;
	}
	
}
//******************************************************************************
function putPixel(imgData, x, y, col)
{
	var ix = (x + y*_settings.width)*4;
	for (var i=0;i<_settings.zoom;i++)
	{
		if (i < _settings.height)
		{
			for (var j=0;j<_settings.zoom;j++)
			{
				if (j < _settings.width)
				{
					for (var c=0;c<4;c++)
					{
						imgData.data[ix+j*4+c] = col[c];
					}
				}
			}
		}
		ix += _settings.width*4;
	}
}
//******************************************************************************
function processInput()
{
	;
}
//******************************************************************************
function restart()
{
	;
}
//******************************************************************************
function initHTML5()
{
	GE.front.setAttribute('width',_settings.width);
	GE.front.setAttribute('height',_settings.height);
	HTML.applyStyle(GE.front, 'border:none;backgroundColor:black');
}
//******************************************************************************
function mapToColor(v)
{
	if (v<51)		{ r = 255;	g = 5*v;	b = 0;	} else
	if ((v -= 51)<51)	{ r = 255-5*v;	g = 255;	b = 0; } else	
	if ((v -= 51)<51)	{ r = 0;	g = 255;	b = 5*v; } else
	if ((v -= 51)<51)	{ r = 0;	g = 255-5*v;	b = 255; } else
	if ((v -= 51)<51)	{ r = 5*v;	g = 0;		b = 255-5*v; } else
				{ r = 255;	g = 255;	b = 255; }
	return [r, g, b, 256];
}
//******************************************************************************
function update(f)
{
}
//******************************************************************************
function render(f)
{
	GE.frontContext.clearRect(0, 0, GE.front.width, GE.front.height);

	var imgData = GE.frontContext.getImageData(0, 0, GE.front.width, GE.front.height);
	var vx = 2*Math.PI/GE.front.width;
	var vy = 2*Math.PI/GE.front.height;
	for (var i=0;i<GE.front.width;i+=_settings.zoom)
	{
		for (var j=0;j<GE.front.height;j+=_settings.zoom)
		{
			var dx = i/GE.front.width - (Math.sin(vy*j*Math.cos(_settings.vx*f))*0.5+0.5);
			var dy = j/GE.front.height - (Math.sin(vx*i*Math.sin(_settings.vy*f))*0.5+0.5);
			var v = Math.floor(Math.sqrt((dy*dy + dx*dx)/2)*255);
			c = mapToColor(v);
			putPixel(imgData, i, j, c);
		}
	}
	GE.frontContext.putImageData(imgData, 0, 0);
}