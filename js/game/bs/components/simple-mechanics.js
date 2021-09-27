include('./ge.js');
(function() {
    function SimpleMechanics() {
        // TODO: derive from Physics
    }

    SimpleMechanics.prototype.update = function update(obj, dt, args) {
        // p' = p + v*dt
        obj.next.position.set(obj.current.velocity.prodC(dt).add(obj.current.position));
    };

    publish(SimpleMechanics, 'SimpleMechanics', ge);
})();