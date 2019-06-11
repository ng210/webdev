var id = 0;
var taskId = 0;
onmessage = e => {
    var msg = e.data;
    switch (msg.type) {
        case 0: // initialize: {type:0, id:worker.id} => task request: {type:0, id:i}
            console.log(`initialize #${msg.id}`);
            id = msg.id;
            setTimeout(function() {
                postMessage({type:0, id:id});
            }, Math.random()*3000 + 2000);
            break;
        case 1: // task assigned: {type:1, taskId:i} => task complete {type:1, id:i, taskId:j, data:d}
            console.log(`task assigned: ${msg.taskId}`);
            setTimeout(function() {
                postMessage({type:1, id:id, taskId:taskId, data:id*+100*taskId});
            }, Math.random()*3000 + 2000);
            break;
    }
};