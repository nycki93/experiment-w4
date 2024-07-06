import * as w4 from "./wasm4";

const smiley = memory.data<u8>([
    0b11000011,
    0b10000001,
    0b00100100,
    0b00100100,
    0b00000000,
    0b00100100,
    0b10011001,
    0b11000011,
]);

const playerW: u8 = 8;
const playerH: u8 = 8;
const playerSpeed = 10;

// player position, lower 4 bits are subpixels!
let playerX: u16;
let playerY: u16;
const SUBPIXEL_BITS: u8 = 4;

const leftBound: u16 = playerW / 2 << SUBPIXEL_BITS;
const rightBound: u16 = 160 - playerW / 2 << SUBPIXEL_BITS;
const upperBound: u16 = playerH / 2 << SUBPIXEL_BITS;
const lowerBound: u16 = 160 - playerH / 2 << SUBPIXEL_BITS;

export function start(): void {
    playerX = 80 << SUBPIXEL_BITS;
    playerY = 80 << SUBPIXEL_BITS;
}

export function update(): void {
    updatePlayer();
    draw();
}

function updatePlayer(): void {
    // check buttons
    const gamepad = load<u8>(w4.GAMEPAD1);

    // calculate momentum
    let speedMult: f64 = 1;
    if (gamepad & w4.BUTTON_2) speedMult = 2;
    let vX = 0;
    let vY = 0;
    if (gamepad & w4.BUTTON_RIGHT) vX += 1
    if (gamepad & w4.BUTTON_LEFT)  vX -= 1
    if (gamepad & w4.BUTTON_UP)    vY -= 1
    if (gamepad & w4.BUTTON_DOWN)  vY += 1
    
    // diagonal distance
    if (vX != 0 && vY != 0) {
        speedMult /= sqrt(2);
    }

    playerX = playerX + playerSpeed * speedMult * vX as u16;
    playerY = playerY + playerSpeed * speedMult * vY as u16;

    // player cannot walk off screen
    if (playerX < leftBound)  playerX = leftBound;
    if (playerX > rightBound) playerX = rightBound;
    if (playerY < upperBound) playerY = upperBound;
    if (playerY > lowerBound) playerY = lowerBound;
}

function draw(): void {
    // screen starts as checkerboard
    store<u16>(w4.DRAW_COLORS, 1);
    w4.rect(0, 0, 160, 160);
    store<u16>(w4.DRAW_COLORS, 2);
    for (let i: u8 = 0; i < 8; i += 1) {
        for (let j: u8 = 0; j < 8; j += 1) {
            if (i % 2 == j % 2) {
                // white square
            } else {
                // black square
                w4.rect(i * 20, j * 20, 20, 20);
            }
        }
    }
    store<u16>(w4.DRAW_COLORS, 0x21);
    w4.text("press z to fast", 4, 10);

    // draw the player
    store<u16>(w4.DRAW_COLORS, 4);
    const x = (playerX >> 4) - playerW / 2;
    const y = (playerY >> 4) - playerH / 2;
    w4.blit(smiley, x, y, playerW, playerH, w4.BLIT_1BPP);
}
