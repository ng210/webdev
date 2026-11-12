const SIZE = 5
const DELAY = 100

const lamps = []
const counts = [
    10, 4, 15, 7, 2,
    8, 31, 0, 23, 2,
    4, 9, 3, 26, 4,
    0, 67, 2, 9, 11,
    4, 23, 5, 0, 7
]


const ctr = document.querySelector('div.cells')
ctr.style.display = 'grid'
ctr.style.gridTemplateColumns = `repeat(${SIZE}, 1fr)`
ctr.style.gridTemplateRows = `repeat(${SIZE}, 1fr)`

let ix = 0
for (let j=0; j<SIZE; j++) {
    for (let i=0; i<SIZE; i++) {
        const div = document.createElement('div')
        div.className = 'off'
        const input = document.createElement('input')
        const span = document.createElement('span')
        const lamp = { div, input, span, i, j, count: counts[ix], toggled: 0 }
        input.type = 'number'
        input.value = counts[ix]
        span.innerText = counts[ix] + '/0'
        input.lamp = lamp
        input.addEventListener('change', function(event) {
            this.lamp.count = Number(this.value)
            this.lamp.span.innerText = this.lamp.count + '/' + this.lamp.toggled
        })
        div.appendChild(input)
        div.appendChild(span)
        ctr.appendChild(div)
        lamps[ix++] = lamp
    }
}

function reset(value) {
    for (let ix=0; ix<SIZE**2; ix++) {
        const lamp = lamps[ix]
        const val = value ?? counts[ix]
        lamp.count = val
        lamp.toggled = 0
        lamp.input.value = val
        lamp.span.innerText = val + '/0'
        lamp.div.className = 'off'
    }
}

function toggle(lamp) {
    if (lamp.div.className == 'on') {
        lamp.div.className = 'off'
    } else {
        lamp.div.className = 'on'
    }
    lamp.toggled++
    lamp.span.innerText = lamp.count + '/' + lamp.toggled
}

function onClick() {
    if (timer) {
        clearInterval(timer)
        timer = null
    } else {
        timer = setInterval(update, DELAY)
    }
}

let timer = null
function update() {
    let hasFinished = true
    for (let ix=0; ix<SIZE**2; ix++) {
        const lamp = lamps[ix]
        if (lamp.count == 0) continue
        lamp.count--
        // left
        if (lamp.i > 0) toggle(lamps[ix-1])
        // right
        if (lamp.i < SIZE-1) toggle(lamps[ix+1])
        // top
        if (lamp.j > 0) toggle(lamps[ix-SIZE])
        // bottom
        if (lamp.j < SIZE-1) toggle(lamps[ix+SIZE])
        // center
        toggle(lamps[ix])
        hasFinished = false
    }

    if (hasFinished) {
        clearInterval(timer)
        timer = null
    }
}    