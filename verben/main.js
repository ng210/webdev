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
var g_ix = [];

window.onload = function() {
    var tab = document.getElementById('verbs');
    g_img = document.createElement('img');
    // g_img.style.width = '64px';
    // g_img.style.height = '64px';
    g_img.style.position = 'absolute';
    g_img.src = 'img/blank.gif';
    for (var i=0; i<50; i++) {
        tab.appendChild(createRow(i));
    }
};

function createRow(ix) {
    var mask = Math.floor(Math.random()*4);
    var vi = 0;
    do {
        vi = Math.floor(Math.random()*verbs.body.length);
        var found = false;
    } while (g_data.find(function(value, index, array) {
        return value.index == vi;
    }));
    g_data.push( { index: vi, cell: mask });
    var row = document.createElement('tr');
    row.appendChild(createCell('#'+(ix+1), false, ix, 0));
    row.appendChild(createCell(verbs.body[vi][0], mask == 0, ix, 0));
    row.appendChild(createCell(verbs.body[vi][1], mask == 1, ix, 1));
    row.appendChild(createCell(verbs.body[vi][2], mask == 2, ix, 2));
    row.appendChild(createCell(verbs.body[vi][3], mask == 3, ix, 3));
    return row;
}

function createCell(value, mask, row, col) {
    var cell = document.createElement('td');
    cell.innerHTML = mask ?
        '<input id="r'+row+'c'+col+'" type="text" value="?" onchange="validate('+row+','+col+');"/>':
        value;
    return cell;
}

function validate(ix) {
    var tab = document.getElementById('verbs');
    var row = tab.rows[ix];
    var answer = '';
    var data = g_data[ix];
    var id = 'r'+ix+'c'+data.cell;
    var input = document.getElementById(id);

    if (verbs.body[data.index][data.cell] == input.value.toLowerCase()) {
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
