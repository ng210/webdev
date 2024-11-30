var m1 = new Map();
m1.set('a', 1);
m1.set('b', 2);
print(m1);

var m2 = [['a', 1], ['b', 2]]
print(m2);

function print(m) {
    for (var kv of m) console.log(kv);
}