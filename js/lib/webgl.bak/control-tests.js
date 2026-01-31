import Test from '../test/test.js'
import RangeControl from '../glui/control/range-control.js'
import WebGLRangeElem from './glui/webgl-range-elem.js'

class ControlTest extends Test {
    static colors = ['black', 'gray', 'white', 'red', 'green', 'blue', 'yellow', 'brown'];
    static dataSource = {
        range1: { min: 0, max: 10, step: 0.1, value: 5 },
        colors: { list: ControlTest.colors, value: 1 },
        dropdown1: ControlTest.colors
    };
    controls = [];

    onChange(e) {
        let elem = e.target;
        this.cons.writeln(`${e.type}: ${elem.value}`);
    }

    async setupAll() {
        let ctrl = new RangeControl('range1');
        ctrl.label = 'Range1';
        ctrl.uiElement = new WebGLRangeElem(ctrl);
        ctrl.dataBind(ControlTest.dataSource.range1);
        this.controls.push(ctrl);
        await ctrl.initialize();
        ctrl.addHandler('change', e => this.onChange(e));

        ctrl = new RangeControl('colors');
        ctrl.label = 'Colors';
        ctrl.uiElement = new WebGLRangeElem(ctrl);
        ctrl.dataBind(ControlTest.dataSource.colors);
        this.controls.push(ctrl);
        await ctrl.initialize();
        ctrl.addHandler('change', e => this.onChange(e));
    }

    teardownAll() {

    }

    testAddRangeControls() {
        let ctrl = this.controls[0];
        ctrl.uiElement.parent = document.body;
        let v = ControlTest.dataSource.range1.value;
        this.isEqual(`Range1 value is ${v}`, ctrl.value, v);

        ctrl = this.controls[1];
        ctrl.uiElement.parent = document.body;
        v = ControlTest.dataSource.colors.list[ControlTest.dataSource.colors.value];
        this.isEqual(`Range1 value is ${v}`, ctrl.value, v);
    }
}

export { ControlTest };