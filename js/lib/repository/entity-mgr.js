include('repo-ns.js');
(function() {
    function EntityMgr(repository) {
        this.entityCache = {};
    }

    publish(EntityMgr, 'EntityMgr', Repository);
})();