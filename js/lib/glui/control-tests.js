import RangeControl from './control/html/range-control.js'
import Test from '/js/lib/test/test.js'

class ControlTest extends Test {
    dataSource = {
        range1: 12,
        range2: { min: 0, max: 1.0, step: 0.1, value: 0.5 }
    };
    controls = [];

    onChange(e) {
        let elem = e.target;
        this.cons.writeln(`${e.type}: ${elem.value}`);
    }

    async setupAll() {
        let ctrl = new RangeControl('range1');
        ctrl.dataSource = this.dataSource.range1;
        this.controls.push(ctrl);
        await ctrl.initialize();
        ctrl.addHandler('change', e => this.onChange(e));

        ctrl = new RangeControl('range2');
        ctrl.dataSource = this.dataSource.range2;
        this.controls.push(ctrl);
        await ctrl.initialize();
        ctrl.addHandler('change', e => this.onChange(e));
    }

    teardownAll() {

    }

    testAddRangeControls() {
        let ctrl = this.controls[0];
        ctrl.append(document.body);
        this.isEqual(`Range1 value is ${this.dataSource.range1}`, ctrl.value, this.dataSource.range1);

        ctrl = this.controls[1];
        ctrl.append(document.body);
        this.isEqual(`Range2 value is ${this.dataSource.range2.value}`, ctrl.value, this.dataSource.range2.value);
    }
}

export { ControlTest };