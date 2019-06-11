var taskId = 0;
var data = {};
var finished = 0;
window.onload = () => {
    for (var i=0; i<4; i++) {
        var worker = new Worker('worker.js');
        worker.id = i;
        worker.onmessage = function(e) {
            var msg = e.data;
            switch (msg.type) {
                case 0: // task request: {type:0, id:i}
                    console.log(`#${msg.id}/${this.id} requests a task`);
                    if (taskId < 20) {
                        this.postMessage({type:1, taskId:taskId++});
                    } else {
                        this.terminate();
                    }
                    break;
                case 1: // task complete: {type:1, id:i, taskId:j, data:d}
                    console.log(`#${msg.id}/${this.id} task #${msg.taskId} finished with value ${msg.data}`);
                    data[msg.taskId] = msg.data;
                    finished++;
                    if (finished == taskId) {
                        console.log('All tasks are complete');
                    }
                    break;
            }
        };
        // initialize worker
        var msg = {type:0, id:worker.id};
        worker.postMessage(msg);
    }
};