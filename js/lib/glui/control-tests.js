import { getConsole, Colors } from '../console/console.js'
import Test from '../test/test.js'
import Control from './control/control.js'
import PanelControl from './control/panel-control.js'
import RangeControl from './control/range-control.js'
import HtmlElem from './control/html/html-elem.js'
import HtmlStaticElem from './control/html/html-static-elem.js'
import HtmlRangeElem from './control/html/html-range-elem.js'
import HtmlButtonElem from './control/html/html-button-elem.js'

class ControlTest extends Test {
    #cons = null;

    static colors = ['black', 'gray', 'white', 'red', 'green', 'blue', 'yellow', 'brown'];
    static dataSource = {
        range1: { min: 0, max: 10, step: 0.1, value: 5 },
        colors: { list: ControlTest.colors, value: ControlTest.colors[1] },
        dropdown1: ControlTest.colors
    };
    body = null;
    controls = {};

    onChange(e) {
        let ctrl = Control.getControl(e.target);
        this.cons.writeln(`${e.type}: ${ctrl.value}`);
    }

    async createControl(id, label, type = 'range', dataSource = null) {
        let ctrl = null;
        switch (type) {
            case 'panel':
                ctrl = new PanelControl(id);
                ctrl.uiElement = new HtmlElem(ctrl);
                break;
            case 'static':
                ctrl = new StaticControl(id);
                ctrl.uiElement = new HtmlStaticElem(ctrl);
                break;
            case 'button':
                ctrl = new ButtonControl(id);
                ctrl.uiElement = new HtmlButtonElem(ctrl);
                break;
            case 'range':
                ctrl = new RangeControl(id);
                ctrl.uiElement = new HtmlRangeElem(ctrl);
                break;
            default:
                throw new Error(`Unknown control type: ${type}`);
        }
        ctrl.label = label;
        if (dataSource) {
            ctrl.dataBind(dataSource);
        }
        await ctrl.initialize();

        if (this.body != null) {
            this.body.appendChild(ctrl);
            this.controls[ctrl.id] = ctrl;
        }

        if (dataSource != null) {
            ctrl.dataBind(dataSource);
        }

        return ctrl;
    }

    async setupAll() {
        this.#cons = await getConsole();

        this.body = await this.createControl('body', '', 'panel');
        this.body.uiElement.elem = document.querySelector('body');
    }

    teardownAll() {

    }

    async testControls() {
        let ds = ControlTest.dataSource;
        let range1 = await this.createControl(
            'range1',
            'Range1',
            'range',
            ControlTest.dataSource.range1);
        range1.addHandler('change', this);

        let range2 = await this.createControl(
            'colors',
            'Colors',
            'range',
            ControlTest.dataSource.colors);
        range2.addHandler('change', this);


        for (let ctrlId in this.controls) {
            let ctrl = this.controls[ctrlId];
            this.isEqual(`${ctrl.label} value is ${ctrl.value}`, ctrl.value, ds[ctrlId].value);
        }

        this.#cons.writeln('');
        await this.#cons.waitButton('Continue');

        range1.uiElement.top = 80;
        range2.uiElement.top = 80;
        range2.uiElement.left = 100;
        range2.uiElement.width = 80;

        await this.#cons.waitButton('Next');

        // ctrl1 = this.controls[0];
        // this.body.appendChild(ctrl1);
        // let v = ControlTest.dataSource.range1.value;
        // this.isEqual(`Range1 value is ${v}`, ctrl1.value, v);

        // let ctrl2 = this.controls[1];
        // this.body.appendChild(ctrl2);
        // v = ControlTest.dataSource.colors.list[ControlTest.dataSource.colors.value];
        // this.isEqual(`Range1 value is ${v}`, ctrl2.value, v);

        // await this.#cons.waitButton('Continue');

        // ctrl1.uiElement.top = 80;
        // ctrl2.uiElement.top = 80;
        // ctrl2.uiElement.left = 100;
        // ctrl2.uiElement.width = 80;
    }
}

export { ControlTest };