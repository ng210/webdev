var frame = 0;

class WhiteNoiseProcessor extends AudioWorkletProcessor {
    process (inputs, outputs, parameters) {
      const output = outputs[0]
      output.forEach(channel => {
        for (let i = 0; i < channel.length; i++) {
          channel[i] = Math.sin(2*Math.PI/1000*frame++);
        }
      })
      return true
    }
  }
  
  registerProcessor('white-noise-processor', WhiteNoiseProcessor)