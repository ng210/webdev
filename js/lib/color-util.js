export default class ColorUtil {
    static convertHslToRgb(hue, saturation, luminance) {
        if (hue[0] != undefined) {
            saturation = hue[1];
            luminance = hue[2];
            hue = hue[0];
        }
        const fn = n => {
            let k = (n + hue/30) % 12;
            let a = saturation * Math.min(luminance, 1.0 - luminance);
            return luminance - a * Math.max(-1.0, Math.min(k-3, 9-k, 1));
        };

        return [fn(0), fn(8), fn(4)];
    }

    static convertRgbToHsl(r, g, b) {
        if (r[0] != undefined) {
            g = r[1];
            b = r[2];
            r = r[0];
        }
        
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const ch = max - min;
        const l = (max + min) / 2;
      
        let h = 0, s = 0;
      
        if (max !== min) {
          
          s = l > 0.5 ? ch / (2 - max - min) : ch / (max + min);
      
          switch (max) {
            case r: h = (g - b) / ch + (g < b ? 6 : 0); break;
            case g: h = (b - r) / ch + 2; break;
            case b: h = (r - g) / ch + 4; break;
          }
      
          h /= 6;
        }

        return [h * 360, l, s];
    }
}