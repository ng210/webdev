"use strict";

var g_data = [];
var g_img = null;
var g_t = [
    'img/bugs_t1.gif',
    'img/mj_t1.gif'
];
var g_f = [
    'img/bugs_f1.gif',
];

window.onload = function() {
    var tab = document.getElementById('maths');
    g_img = document.createElement('img');
    // g_img.style.width = '64px';
    // g_img.style.height = '64px';
    g_img.style.position = 'absolute';
    g_img.src = 'img/blank.gif';
    for (var i=0; i<10; i++) {
        tab.appendChild(createRow(i));
    }
};

function createRow(ix) {
    var operation = Math.floor(Math.random()*4);
    var mask = Math.floor(Math.random()*(operation == 3 ? 4 : 3));
    var a, b, r = 0;
    var symbol = '';
    var res = 0;
    switch (operation) {
        case 0:
            a = Math.ceil(Math.random()*49) + 1;
            b = Math.ceil(Math.random()*49) + 1;
            symbol = '+';
            res = a + b;
            break;
        case 1:
            a = Math.ceil(Math.random()*49) + 1;
            b = Math.ceil(Math.random()*49) + 1;
            symbol = '-';
            if (a < b) {
                var tmp = a;
                a = b;
                b = tmp;
            }
            res = a - b;
            break;
        case 2:
            a = Math.ceil(Math.random()*9) + 1;
            b = Math.ceil(Math.random()*9) + 1;
            symbol = '*';
            res = a * b;
            break;
        case 3:
            a = Math.ceil(Math.random()*9) + 1;
            b = Math.ceil(Math.random()*9) + 1;
            r = (Math.ceil(Math.random()*9) + 1) % b;
            symbol = ':';
            var tmp = a;
            a = a * b + r;
            res = tmp;
            break;
    }
    var symbols = ['+', '-', '*', ':'];
    var row = document.createElement('tr');
    row.appendChild(createCell('#'+(ix+1), false, ix, 0));
    row.appendChild(createCell(a, mask == 0, ix, 0));
    row.appendChild(createCell(symbol, false, ix));
    row.appendChild(createCell(b, mask == 1, ix, 1));
    row.appendChild(createCell('=', false, ix));
    row.appendChild(createCell(res, mask == 2, ix, 2));
    if (operation == 3) {
        row.appendChild(createCell('R', false, ix));
        row.appendChild(createCell(r, mask == 3, ix, 3));
    } else {
        row.appendChild(createCell('&nbsp;', false, ix));
        row.appendChild(createCell('&nbsp;', false, ix));
    }
    var arr = [ a, b, res, r ];
    g_data.push(
        { 'cell': mask, 'value': arr[mask] }
    );
    return row;
}

function createCell(value, mask, row, col) {
    var cell = document.createElement('td');
    cell.innerHTML = mask ?
        '<input id="r'+row+'c'+col+'" type="text" value="?" maxlength="3" size="2" onchange="validate('+row+','+col+');"/>':
        value;
    return cell;
}

function validate(ix) {
    var tab = document.getElementById('maths');
    var row = tab.rows[ix];
    var data = g_data[ix];
    var id = 'r'+ix+'c'+data.cell;
    var input = document.getElementById(id);
    if (data.value == parseInt(input.value)) {
        row.style.backgroundColor = 'lightgreen';
        g_img.src = g_t[Math.floor(Math.random()*g_t.length)];
    } else {
        row.style.backgroundColor = '#ff6040';
        g_img.src = g_f[Math.floor(Math.random()*g_f.length)];
    }
    g_img.style.top = (tab.offsetTop + (tab.offsetHeight - 64) / 2) + 'px';
    g_img.style.left = (tab.offsetLeft + (tab.clientWidth - 64) / 2) + 'px';
    tab.appendChild(g_img);
    setTimeout(function() {
        g_img.parentNode.removeChild(g_img);
    }, 2000);
}
