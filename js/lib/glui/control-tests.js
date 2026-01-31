import { getConsole, Colors } from '../console/console.js'
import Test from '../test/test.js'
import Control from './control/control.js'
import StaticControl from './control/static-control.js'
import PanelControl from './control/panel-control.js'
import ButtonControl from './control/button-control.js'
import RangeControl from './control/range-control.js'
import HtmlView from './control/html/html-view.js'
import HtmlStaticView from './control/html/html-static-view.js'
import HtmlRangeView from './control/html/html-range-view.js'
import HtmlButtonView from './control/html/html-button-view.js'

class ControlTest extends Test {
    #cons = null;

    static colors = ['black', 'gray', 'white', 'red', 'green', 'blue', 'yellow', 'brown'];
    static dataSource = {
        static2: '2nd static control',
        button1: { value: 'Click Me!' },
        range1: { min: 0.0, max: 2.0, step: 0.5, value: 1.0 },
        colors: { value: ControlTest.colors[1] },
        dropdown1: ControlTest.colors
    };
    body = null;
    controls = {};

    onChange(e) {
        let ctrl = Control.getControl(e.target);
        this.cons.writeln(`${e.type}: ${ctrl.value}`);
    }

    static handler(event, ctrl) {
        this.cons.writeln(`generic handler: '${event.type}' triggered on control '${ctrl.id}'.`);
        return true;    // stop event propagation
    }

    async createControl(id, type, dataSource = null, dataField = 'value') {
        let ctrl = null;
        switch (type) {
            case 'panel':
                ctrl = new PanelControl(id);
                await ctrl.setView(new HtmlView());
                break;
            case 'static':
                ctrl = new StaticControl(id);
                ctrl.on('click', ControlTest.handler, this);
                ctrl.parent = this.body;
                await ctrl.setView(new HtmlStaticView());
                break;
            case 'button':
                ctrl = new ButtonControl(id);
                ctrl.parent = this.body;
                await ctrl.setView(new HtmlButtonView());
                break;
            case 'range':
                ctrl = new RangeControl(id);
                ctrl.parent = this.body;
                await ctrl.setView(new HtmlRangeView());
                break;
            default:
                throw new Error(`Unknown control type: ${type}`);
        }
        if (dataSource) {
            ctrl.dataBind(dataSource, dataField);
        }


        this.cons.writeln(`Created control: ${ctrl.id} (${type}) [${ctrl.getVisual('width')}, ${ctrl.getVisual('height')}]`);
        return ctrl;
    }

    async setupAll() {
        this.#cons = await getConsole();
        //Control.ui = HtmlElem;
        this.body = new PanelControl('body');
        await this.body.setView(new HtmlView(document.body));
        this.body.onClick = event => this.cons.writeln(`Body.onClick: ${event.target.id} clicked!`);
    }

    teardownAll() {

    }

    async testControls() {
        let ds = ControlTest.dataSource;
        let static1 = await this.createControl(
            'static1',
            'static',
            { value: '1st static control' });
        static1.onClick = event => this.cons.writeln(`static1.onClick: ${event.target.id} clicked!`);

        let static2 = await this.createControl(
            'static2',
            'static',
            ControlTest.dataSource,
            'static2');
        static2.addVisual('color', 'red');
        static2.onPointerenter = event => event.target.addVisualClass('highlight');
        static2.onPointerleave = event => event.target.removeVisualClass('highlight');

        let button1 = await this.createControl(
            'button1',
            'button',
            ControlTest.dataSource.button1);
        button1.onPointerdown = event => {
            this.cons.writeln(`button1.onPointerdown (${event.target.id})`);
            return false; // allow event propagation
        };
        button1.on('click', event => {
            this.cons.writeln(`button1.onClick (${event.target.id})`);
            return false; // allow event propagation
        });
        button1.addDragging();
        button1.onDragging = event => {
            button1.setPosition(event.x, event.y);
            //this.cons.writeln(`button1.onDrag (${event.target.id}): x=${event.x}, y=${event.y}`);
        };

        let range1 = await this.createControl(
            'range1',
            'range',
            ControlTest.dataSource.range1);
        range1.source = ControlTest.dataSource.range1;
        range1.on('change', event => this.cons.writeln(`range1 change: ${range1.value}`), this);
        range1.on('changed', event => this.cons.writeln(`range1 changed: ${range1.value}`), this);

        let static3 = await this.createControl(
            'static3',
            'static',
            ControlTest.dataSource.colors);
        static3.addVisualClass('range-value');

        let range2 = await this.createControl(
            'colors',
            'range',
            static3);
        range2.source = ControlTest.colors;
        range2.onClick = event => true;
        // range2.on('change', event => {
        //         this.cons.writeln(`range2 change: ${range2.value}`);
        //         return false;
        //     }, this);
        // range2.on('changed', event => {
        //         this.cons.writeln(`range2 changed: ${range2.value}`);
        //         //event.target.view.update();
        //     }, this);



        for (let ctrlId in this.controls) {
            let ctrl = this.controls[ctrlId];
            this.isEqual(`${ctrl.id} value is ${ctrl.value}`, ctrl.value, ds[ctrlId].value);
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