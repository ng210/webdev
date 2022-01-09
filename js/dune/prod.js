function format(n) {
    var arr = [];
    var i = 0;
    while (n != 0) {
        var r = n % 10;
        if (i > 0 && i % 3 == 0) arr.unshift('.');
        arr.unshift(r);
        n = (n - r)/10;
        i++;
    }
    return arr.join('');
}

var prod = {
    'melange': 351464,
    'spice': 4035,
    'solari': 374722
};
var store = {
    'melange': 10000000,
    'spice': 900000,
    'solari': 1527802
};
var target = {
    'melange': 15000000,
    'spice': 1500000
};
var price = {
    'melange': 1.1,
    'spice': 12.0
};

var tax = 0.14;

var mm = target.melange - store.melange;
var ms = target.spice - store.spice;
var t = 0;
if (mm/prod.melange < ms/prod.spice) {
    // sell melange to get spice
    // solari = (t * prod.melange - mm)*price.melange + store.solari + t * prod.solari;
    // solari = t * (prod.melange * price.melange + prod.solari) - mm * price.melange + store.solari;
    // ps = solari/price.spice;
    // ps = ms - t * prod.spice;
    // ms - t * prod.spice = solari/price.spice;
    // t * prod.spice = ms - solari/price.spice;
    // t * prod.spice = ms - (t * (prod.melange * price.melange + prod.solari)/price.spice - (mm * price.melange + store.solari)/price.spice);
    // t * prod.spice = ms - t * (prod.melange * price.melange + prod.solari)/price.spice + (mm * price.melange + store.solari)/price.spice;
    // t * prod.spice + t * (prod.melange * price.melange + prod.solari)/price.spice = ms + (mm * price.melange + store.solari)/price.spice;
    // t * (prod.spice + (prod.melange * price.melange + prod.solari)/price.spice) = ms + (mm * price.melange + store.solari)/price.spice;

    // t = (ms + mm * price.melange + store.solari)/price.spice)/(prod.spice + (prod.melange * price.melange + prod.solari)/price.spice);
    t = (ms + (mm * price.melange + store.solari)/price.spice)/(prod.spice + (prod.melange * price.melange + prod.solari)/price.spice);
} else {
    // sell spice to get melange
    // solari = t * (prod.spice * price.spice + prod.solari) - mm * price.spice + store.solari;
    // mm - t * prod.melange = solari/price.melange;
    // t * prod.melange = mm - (t * (prod.spice * price.spice + prod.solari) - mm * price.spice + store.solari)/price.melange;
    // t * prod.melange = mm - t * (prod.spice * price.spice + prod.solari)/price.melange + (mm * price.spice + store.solari)/price.melange;
    // t * (prod.melange + (prod.spice * price.spice + prod.solari)/price.melange) = mm + (mm * price.spice + store.solari)/price.melange;
    t = (mm + (mm * price.spice + store.solari)/price.melange)/(prod.melange + (prod.spice * price.spice + prod.solari)/price.melange);
}

console.log(t.toPrecision(4));
t = Math.ceil(t);
var pm = t * prod.melange;
var ps = t * prod.spice;
var pso = t * prod.solari;
console.log(`Melange produced: ${format(pm)} (${format(Math.ceil(pm/(1-tax)))})`);
console.log(`Spice produced: ${format(ps)} (${format(Math.ceil(ps/(1-tax)))})`);
console.log(`Solari produced: ${format(pso)}`);
if (mm < pm) {
    console.log('Melange to sell: ' + format(pm - mm));
} else {
    console.log('Spice to sell: ' + format(ps - ms));
}
