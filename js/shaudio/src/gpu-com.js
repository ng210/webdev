include('/lib/webgl/webgl.js');

// ## GPU communication
// - Upload data
//   - shader program
//   - uniforms for constants and global variables
//   - buffers for samples
//     - samples created in previous run
//     - external samples
// - Download data
//   - buffers for feedback
//   - buffer of samples for playback

(function() {
    function GpuCom(app) {
        this.app = app;
    }

    GpuCom.create = async function gpucom_create(app) {
        return new GpuCom(app);
    };

    GpuCom.prototype.upload = function gpucom_upload() {

    };

    publish(GpuCom, 'GpuCom');
})();