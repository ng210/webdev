import Test from '../test/test.js'
import PanelControl from './control/panel-control.js'
import RangeControl from './control/range-control.js'
import HtmlElem from './control/html/html-elem.js'
import HtmlRangeElem from './control/html/html-range-elem.js'

class ControlTest extends Test {
    static colors = ['black', 'gray', 'white', 'red', 'green', 'blue', 'yellow', 'brown'];
    static dataSource = {
        range1: { min: 0, max: 10, step: 0.1, value: 5 },
        colors: { list: ControlTest.colors, value: 1 },
        dropdown1: ControlTest.colors
    };
    body = null;
    controls = [];

    onChange(e) {
        let elem = e.target;
        this.cons.writeln(`${e.type}: ${elem.value}`);
    }

    async setupAll() {
        let ctrl = new PanelControl('body');
        ctrl.label = 'body';
        ctrl.uiElement = new HtmlElem(ctrl);
        ctrl.uiElement.elem = document.querySelector('body');
        await ctrl.initialize();
        this.body = ctrl;

        ctrl = new RangeControl('range1');
        ctrl.label = 'Range1';
        ctrl.uiElement = new HtmlRangeElem(ctrl);
        ctrl.dataBind(ControlTest.dataSource.range1);
        this.controls.push(ctrl);
        await ctrl.initialize();
        ctrl.addHandler('change', e => this.onChange(e));

        ctrl = new RangeControl('colors');
        ctrl.label = 'Colors';
        ctrl.uiElement = new HtmlRangeElem(ctrl);
        ctrl.dataBind(ControlTest.dataSource.colors);
        this.controls.push(ctrl);
        await ctrl.initialize();
        ctrl.addHandler('change', e => this.onChange(e));
    }

    teardownAll() {

    }

    testAddRangeControls() {
        let ctrl = this.controls[0];
        this.body.appendChild(ctrl);
        let v = ControlTest.dataSource.range1.value;
        this.isEqual(`Range1 value is ${v}`, ctrl.value, v);

        ctrl = this.controls[1];
        this.body.appendChild(ctrl);
        v = ControlTest.dataSource.colors.list[ControlTest.dataSource.colors.value];
        this.isEqual(`Range1 value is ${v}`, ctrl.value, v);
    }
}

export { ControlTest };