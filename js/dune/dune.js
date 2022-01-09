include('/lib/base/dbg.js');
include('/lib/math/fn.js');

function createCell(row, data, isInput, isHeader) {
    var tag = isHeader ? 'TH' : 'TD';
    var cell = document.createElement(tag);
    var className = row.parentNode.className;
    cell.className = className;
    if (isInput) {
        var input = document.createElement('INPUT');
        input.setAttribute('type', 'numeric');
        input.setAttribute('value', data);
        input.addEventListener('change', update);
        input.className = className;
        cell.appendChild(input);
    } else {
        if (data != undefined) cell.innerHTML = data;
    }
    
    row.appendChild(cell);
    return cell;
}

//*****************************************************************************
function Production(name, rate, unit) {
    this.name = name;
    this.rate = rate;
    this.unit = unit;
    this.output = 0;
    this.efficiency = 0;
    this.bonus = {};
}

Production.update = function update(product) {
};

Production.prototype.update = function update(factor, bonus) {
    this.efficiency = factor*(bonus + Object.values(this.bonus).reduce((p, c) => p+c, 0));
    this.output = this.efficiency * this.rate;
};

Production.prototype.addCells = function addCells(row) {
    createCell(row, this.name);
    createCell(row, '000000.00');
    createCell(row, '000.00');
};


//*****************************************************************************
function Building(name, count, production) {
    this.name = name;
    this.count = count;
    this.production = production;
    this.row = null;
    this.delta = 0;
}

Building.createTable = function createTable(id, data, disabled) {
    var tab = document.createElement('TABLE');
    tab.id = id; tab.className = id;
    tab.datasource = data;
    // create header
    var tr = document.createElement('TR'); tab.appendChild(tr);
    createCell(tr, 'Name', false, true);
    createCell(tr, 'Anzahl', false, true);
    createCell(tr, '%', false, true);
    createCell(tr, 'Produktion', false, true).setAttribute('colspan', 3);

    // data rows
    for (var i=0; i<data.length; i++) {
        data[i].row = data[i].toRow(tab, disabled);
    }

    // free
    var tr = document.createElement('TR'); tab.appendChild(tr);
    createCell(tr, 'Frei'); createCell(tr, 0);
    createCell(tr, '&nbsp;').setAttribute('colspan', 4);;

    // total
    var tr = document.createElement('TR'); tab.appendChild(tr);
    createCell(tr, 'Total');
    var cell = createCell(tr, 0, true);
    cell.id = 'total';
    tab.tbTotal = cell.children[0];
    createCell(tr, '&nbsp;').setAttribute('colspan', 4);
    
    return tab;
};
Building.update = function update(tab, total, isCalculated) {
    var land = 0;
    var windtrap = 0;
    for (var i=0; i<tab.datasource.length; i++) {
        var b = tab.datasource[i];
        land += b.count;
        if (b.name == 'Windfalle') windtrap = b.count;
    }
    var l = tab.rows.length;
    if (!total) {
        total = land;
        tab.rows[l-1].cells[1].children[0].value = total;
    }
    tab.rows[l-2].cells[1].innerHTML = total - land;
    tab.datasource.total = total;
    
    var wb = 3 * windtrap/total;
    var efficiency = 1 + wb;
    for (var i=0; i<tab.datasource.length; i++) {
        var b = tab.datasource[i];
        b.update(efficiency, total, isCalculated);
    }
};
Building.interpolate = function interpolate(from, to, target) {
    var f = (target.total - from.total)/(to.total - from.total);
    for (var i=0; i<from.length; i++) {
        var bf = from[i];
        var bt = to[i];
        var bc = target[i];
        bc.count = Math.floor(Fn.lerp(bf.count, bt.count, f));
        bc.delta = bc.count - bf.count;
    }
};

Building.prototype.update = function update(efficiency, land, isCalculated) {
    var count = this.count.toFixed(0);
    if (isCalculated && this.delta) count += `(${this.delta})`;
    this.row.cells[1].children[0].value = count;    //this.count.toFixed(0);
    this.row.cells[2].children[0].value = (100*this.count/land).toFixed(2);
    if (this.production) {
        var ratio = this.count/land;
        var boost = 3.75 * ratio * ratio;
        if (boost > .6) boost = .6;
        var mb = 1;
        if (land >= 3000) mb += 0.02*(1 + (land-3000)/250);
        this.production.update(mb, efficiency + boost);
        var output = this.production.output * this.count;
        this.row.cells[4].innerHTML = `${('            ' + output.toFixed(2)).slice(-12)} ${(this.production.unit + '  ').substr(0, 2)}`;
        this.row.cells[5].innerHTML = (100*this.production.efficiency).toFixed(2) + '%';
    }
};

Building.prototype.toRow = function toRow(tab, disabled) {
    var tr = document.createElement('TR'); tab.appendChild(tr);
    createCell(tr, this.name);
    var cell = createCell(tr, 0, true);
    cell.id = `${this.name}_count`; cell.building = this;
    if (disabled) cell.children[0].setAttribute('disabled', 1);
    cell = createCell(tr, '00.00', true);
    cell.id = `${this.name}_percent`; cell.building = this;
    if (disabled) cell.children[0].setAttribute('disabled', 1);
    if (this.production) this.production.addCells(tr);
    else {
        var cell = createCell(tr, '–');
        cell.setAttribute('colspan', 3);
        cell.style.textAlign = 'center';
    }
    return tr;
};


//*****************************************************************************
var house = 'Atreides';

var currentBuildings = [
    new Building('Windfalle', 90, null),
    new Building('Raffinerie', 1000, new Production('Melange', 180, 'kg')),
    new Building('Ofen', 0, new Production('Stahl', 36, 't')),
    new Building('Silo', 90, new Production('Spice', 19, 'g')),
    new Building('Zollstation', 0, null),
   
    new Building('Bauhof', 0, null),
    new Building('Leichte Waffenfabrik', 0, null),
    new Building('Schwere Waffenfabrik', 810, null),
    new Building('Forschungszentrum', 1620, null),

    new Building('Werkstatt', 305, null),
    new Building('Wor', 225, null),
    new Building('Kaserne', 0, null),
    new Building('Vorposten', 180, null),
    new Building('Geschützturm', 180, null),
    new Building('Raketenturm', 0, null)
];

var calculatedBuildings = [
    new Building('Windfalle', 0, null),
    new Building('Raffinerie', 0, new Production('Melange', 180, 'kg')),
    new Building('Ofen', 0, new Production('Stahl', 36, 't')),
    new Building('Silo', 0, new Production('Spice', 19, 'g')),
    new Building('Zollstation', 0, null),
   
    new Building('Bauhof', 0, null),
    new Building('Leichte Waffenfabrik', 0, null),
    new Building('Schwere Waffenfabrik', 0, null),
    new Building('Forschungszentrum', 0, null),

    new Building('Werkstatt', 0, null),
    new Building('Wor', 0, null),
    new Building('Kaserne', 0, null),
    new Building('Vorposten', 0, null),
    new Building('Geschützturm', 0, null),
    new Building('Raketenturm', 0, null)
];

var plannedBuildings = [
    new Building('Windfalle', 240, null),
    new Building('Raffinerie', 1056, new Production('Melange', 180, 'kg')),
    new Building('Ofen', 0, new Production('Stahl', 36, 't')),
    new Building('Silo', 144, new Production('Spice', 19, 'g')),
    new Building('Zollstation', 0, null),
   
    new Building('Bauhof', 0, null),
    new Building('Leichte Waffenfabrik', 0, null),
    new Building('Schwere Waffenfabrik', 336, null),
    new Building('Forschungszentrum', 528, null),

    new Building('Werkstatt', 0, null),
    new Building('Wor', 0, null),
    new Building('Kaserne', 0, null),
    new Building('Vorposten', 0, null),
    new Building('Geschützturm', 96, null),
    new Building('Raketenturm', 0, null)
];

var Ui = {
    buildings: null,
    production: null,

    create: async function create() {
        var left = document.getElementById('left');
        var middle = document.getElementById('middle');
        var right = document.getElementById('right');
        this.currentBuildings = Building.createTable('current', currentBuildings)
        left.appendChild(this.currentBuildings);
        this.calculatedBuildings = Building.createTable('calculated', calculatedBuildings, true)
        middle.appendChild(this.calculatedBuildings);
        this.plannedBuildings = Building.createTable('planned', plannedBuildings);
        right.appendChild(this.plannedBuildings);
    },

    update: function() {
        // sum land, get windtrap size
        Building.update(this.currentBuildings);
        var total = parseInt(this.calculatedBuildings.rows[this.calculatedBuildings.rows.length-1].cells[1].children[0].value);
        Building.update(this.calculatedBuildings, 0, true);
        Building.update(this.plannedBuildings);
    }
};

function update(e) {
    var el = e.target;
    var cell = el.parentNode;
    var tab = cell.parentNode.parentNode;

    var b = cell.building;
    var l = tab.rows.length;
    var total = parseInt(tab.rows[l-1].cells[1].children[0].value);
    if (b) {
        var value = parseInt(el.value);
        if (isNaN(value)) value = 0;
        var count = cell.id.endsWith('count') ? value : Math.floor(total * value/100);
        var delta = count - b.count;
        b.count += delta;
        b.row.cells[1].children[0].value = b.count;
    }
    if (tab != Ui.calculatedBuildings) {
        Building.update(cell.parentNode.parentNode, total);
    } else {
        calculatedBuildings.total = total;
        Building.interpolate(currentBuildings, plannedBuildings, calculatedBuildings);
        Building.update(Ui.calculatedBuildings, total, true);
    }    
}

function setBonus(building, name, factor) {
    currentBuildings.find(x => x.name == building).production.bonus[name] = factor;
    calculatedBuildings.find(x => x.name == building).production.bonus[name] = factor;
    plannedBuildings.find(x => x.name == building).production.bonus[name] = factor;
}

async function onpageload(errors) {
    if (errors.length) {
        alert(errors);
    } else {
        Dbg.init('con');
        Dbg.prln('Dune calculator');
        Dbg.con.style.visibility = 'visible';

        // set house prod.bonus
        if (house == 'Atreides') setBonus('Raffinerie', 'house', .10);
        if (house == 'Harkonnen') setBonus('Ofen', 'house', .10);

        // set research #1
        setBonus('Raffinerie', 'rs1', .05);
        setBonus('Raffinerie', 'rs2', .10);
        setBonus('Raffinerie', 'rs3', .15);
        // setBonus('Raffinerie', 'rs4', .25);

        // setBonus('Ofen', 'rs1', .05);
        // setBonus('Ofen', 'rs2', .10);
        // setBonus('Ofen', 'rs3', .15);
        // setBonus('Ofen', 'rs4', .25);

        setBonus('Silo', 'rs1', .05);
        // setBonus('Silo', 'rs2', .10);
        // setBonus('Silo', 'rs3', .15);
        // setBonus('Silo', 'rs4', .25);

        setBonus('Raffinerie', 'sg1', .10);
        setBonus('Ofen', 'sg1', .10);
        setBonus('Silo', 'sg1', .10);

        await Ui.create();
        Ui.update();
        var p = parseInt(Ui.plannedBuildings.tbTotal.value), c = parseInt(Ui.currentBuildings.tbTotal.value);
        calculatedBuildings.total = Math.floor(p - c)/2 + c;
        Building.interpolate(currentBuildings, plannedBuildings, calculatedBuildings);
        Building.update(Ui.calculatedBuildings, 0, true);
    }
}