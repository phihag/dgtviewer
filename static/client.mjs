import { Chessground } from './chessground/chessground.min.js';

let state = {}

function deepEqual(obj1, obj2) {
    // from https://stackoverflow.com/a/45683145/35070

    if(obj1 === obj2) // it's just the same object. No need to compare.
        return true;

    if(isPrimitive(obj1) && isPrimitive(obj2)) // compare primitives
        return obj1 === obj2;

    if(Object.keys(obj1).length !== Object.keys(obj2).length)
        return false;

    // compare objects with same number of keys
    for(let key in obj1)     {
        if(!(key in obj2)) return false; //other object doesn't have this prop
        if(!deepEqual(obj1[key], obj2[key])) return false;
    }

    return true;
}

function isPrimitive(obj) {
    return (obj !== Object(obj));
}

async function updateBoard(cg) {
    const response = await fetch('/board.json');
    if (response.status !== 200) {
        console.error(`HTTP ${response.status} for board`);
    }   
    const newState = response.json();
    if (! deepEqual(newState, state)) {
        state = newState;
        render(cg, state);
    }

    setTimeout(200, () => updateBoard(cg));
}

function render(cg, state) {
    cg.set({
        orientation: 'white',
        fen: state.fen,
        // lastMove: ['e2', 'e4']
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const cg = Chessground(document.getElementById('board'), {});

    updateBoard(cg);
});
