import * as fabric from 'fabric/node';
import fs from 'fs';
import path from 'path';
import { logger } from './Logger.js';

async function createImage(index: number, x: number, y: number, outputDir: string, font: string) {
    const canvas = new fabric.StaticCanvas(undefined, { width: 512, height: 512 });

    // Gradient Background with border and shadow
    const background = new fabric.Rect({
        left: 0,
        top: 0,
        width: 512,
        height: 512,
        rx: 20, // Rounded corners
        ry: 20, // Rounded corners
        fill: new fabric.Gradient({
            type: 'linear',
            coords: { x1: 0, y1: 0, x2: 512, y2: 512 },
            colorStops: [
                { offset: 0, color: '#f8fafc' },
                { offset: 1, color: '#e2e8f0' }
            ]
        }),
        shadow: new fabric.Shadow({
            color: 'rgba(0, 0, 0, 0.1)',
            blur: 10,
            offsetX: 5,
            offsetY: 5,
            affectStroke: true,
            includeDefaultValues: true,
        }),
    });
    canvas.add(background);

    // Text
    const text = new fabric.Text(`(${x},${y})`, {
        left: 256,
        top: 256,
        originX: 'center',
        originY: 'center',
        fontSize: 100, // Adjusted font size
        fill: '#1A1A1A',
        fontFamily: font,
    });

    canvas.add(text);

    const dataURL = canvas.toDataURL({
        format: 'png',
        multiplier: 1,
        quality: 1,
    });

    const base64Data = dataURL.replace(/^data:image\/png;base64,/, '');

    fs.writeFileSync(path.join(outputDir, `${index}.png`), base64Data, 'base64');
    logger.info(`Image ${index} (${x},${y}) created.`);
}

async function main() {
    logger.info(`Initializing`);
    const outputDir = './output';
    const font = 'Inconsolata'; // User-defined font, you can change this to any font you prefer

    if (fs.existsSync(outputDir)) {
        fs.rmSync(outputDir, { recursive: true, force: true });
    }

    fs.mkdirSync(outputDir);

    let index = 0;
    for (let x = 0; x < 100; x++) {
        for (let y = 0; y < 100; y++) {
            await createImage(index, x, y, outputDir, font);
            index++;
        }
    }

    logger.info(`Completed generating images`);
}

main().catch(error => {
    logger.error(`Error in main: ${error}`);
});
