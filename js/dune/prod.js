function format(n) {
    var parts = [];
    var isNegative = false;
    if (n < 0) {
        isNegative = true;
        n = -n;
    }
    if (n == 0) {
        parts.push(0);
    } else {
        while (n != 0) {
            var r = n % 1000;
            if (n > 1000) r = ('000'+r).slice(-3);
            parts.unshift(r);
            n = Math.trunc(n/1000);
        }
    }
    var text = parts.join('.');
    if (isNegative) text = '-'+text;
    return text;
}

var prod = {
    'melange': 3594,
    'spice': 13900,
    'stahl': 1532,
    'solari': 0
};
var store = {
    'melange': 0,
    'spice': 0,
    'stahl': 0,
    'solari': 0
};
var target = {
    'melange': 2500000,
    'spice': 250000
};
var price = {
    'melange': 1.4,
    'spice': 8.2,
    'stahl': 5.0
};
var result = {
    'melange': 0.0,
    'spice': 0.0,
    'stahl': 0.0,
    'solari': 0.0
};

var tax = 0.0;

var mm = target.melange - store.melange;
var ms = target.spice - store.spice;
var t = 0;

// missing = target - store
// T = missing/prod
// surplus = T.spice > T.melange ? (t*prod.melange - missing.melange)*price.melange : (t*prod.spice - missing.spice)*price.spice
// missing.melange*price.melange + missing.spice*price.spice = store.solari + t*prod.solari + (store.stahl + t*prod.stahl)*price.stahl + surplus
// missing.melange*price.melange + missing.spice*price.spice - store.solari - store.stahl*price.stahl = t*prod.solari + t*prod.stahl*price.stahl + surplus
var fixSum = mm*price.melange + ms*price.spice - store.solari - store.stahl*price.stahl;
var fixProd = prod.solari + prod.stahl*price.stahl;
if (prod.spice == 0 || ms/prod.spice > mm/prod.melange) {
// fixSum = t*fixProd + (t*prod.melange - missing.melange)*price.melange
// fixSum = t*fixProd + t*prod.melange*price.melange - missing.melange*price.melange
// fixSum + missing.melange*price.melange = t*(fixProd + prod.melange*price.melange)
    t = (mm*price.melange + fixSum) / (fixProd + prod.melange*price.melange);
} else {
// fixSum = t*fixProd + (t*prod.spice - missing.spice)*price.spice
// fixSum = t*fixProd + t*prod.spice*price.spice - missing.spice*price.spice
// fixSum + missing.spice*price.spice = t*(fixProd + prod.spice*price.spice)
    t = (ms*price.spice + fixSum) / (fixProd + prod.spice*price.spice);
}

console.log('Ticks: ' + t.toPrecision(4));
t = Math.ceil(t);
for (var i in prod) {
    result[i] = t*prod[i];
    print_stats(i);
}

function print_stats(key) {
    var label = key.charAt(0).toUpperCase() + key.substr(1);
    var worth = key != 'solari' ? ` (${format(result[key]*price[key])} Sol)` : '';
    console.log(`${label}\n store: ${format(store[key])}\n produced: ${format(result[key])}${worth}`);
    if (key == 'spice' || key == 'melange') {
        var miss = target[key] - store[key];
        if (result[key] < miss) {
            var buy = miss - result[key];
            console.log(` buy: ${format(buy)} (${format(buy*price[key])} Sol)`);
        } else {
            var sell = result[key] - miss;
            console.log(` sell: ${format(sell)} (${format(sell*price[key])} Sol)`);
        }
    } else if (key == 'stahl') {
        var sell = result[key] + store[key];
        console.log(` sell: ${format(sell)} (${format(sell*price[key])} Sol)`);
    }
}

