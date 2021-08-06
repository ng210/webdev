include('../ge.js');
include('/lib/data/repository.js');
(function() {
    function Repo() {
        this.repository = null;
    }

    Repo.prototype.register = async function register(definition) {
        if (typeof definition === 'string') {
            var res = await load(definition);
            if (res.error) {
                throw res.error;
            }
            definition = res.data;
        }
        this.repository.addSchema(definition);
    };

    Repo.create = async function create(definition) {
        var repo = new Repo();
        repo.repository = await Repository.create(definition);
        return repo;
    };

    publish(Repo, 'Repo', GE);
})();