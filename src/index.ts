import * as fabric from 'fabric/node';
import fs from 'fs';
import path from 'path';
import * as url from 'url';
import { logger } from './Logger.js';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

async function createImage(index: number, x: number, y: number, outputDir: string, font: string, brickImage: fabric.Image) {
    const canvas = new fabric.StaticCanvas(undefined, { width: 512, height: 512 });

    logger.info(`Creating image ${index} (${x},${y}).`);

    // Black background
    const background = new fabric.Rect({
        left: 0,
        top: 0,
        width: 512,
        height: 512,
        fill: 'black',
    });

    canvas.add(background);

    const image = await cloneImage(brickImage);

    // Add brick image
    canvas.add(image);

    // Text
    const text = new fabric.Text(`(${x},${y})`, {
        left: 256,
        top: 390,
        originX: 'center',
        originY: 'center',
        fontSize: 54,
        fill: 'white',
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

async function cloneImage(image: fabric.Image): Promise<fabric.Image> {
    const dataURL = await imageToDataURL(image);
    return dataURLToImage(dataURL);
}

async function dataURLToImage(dataURL: string): Promise<fabric.Image> {
    const image = await fabric.Image.fromURL(dataURL);
    return image;
}

/* Convert Image to data URL */
async function imageToDataURL(image: fabric.Image): Promise<string> {
    return image.toDataURL({
        format: 'png',
        left: 0,
        top: 0,
        width: image.width,
        height: image.height,
    });
}

async function processBatch(startIndex: number, batchSize: number, outputDir: string, font: string, brickImage: fabric.Image) {
    const promises = [];

    for (let i = 0; i < batchSize; i++) {
        const index = startIndex + i;
        const x = Math.floor(index / 100);
        const y = index % 100;
        promises.push(createImage(index, x, y, outputDir, font, brickImage));
    }

    await Promise.all(promises);

    logger.info(`Batch completed: ${startIndex} to ${startIndex + batchSize - 1}`);
}

async function main() {
    logger.info(`Initializing`);
    const outputDir = './output';
    const font = 'Press Start 2P';
    const batchSize = 20;
    const totalImages = 10000; // 100x100

    if (fs.existsSync(outputDir)) {
        fs.rmSync(outputDir, { recursive: true, force: true });
    }
    logger.info(`Making directory`);
    fs.mkdirSync(outputDir);

    try {
        logger.info(`Loading brick image`);
        const brickImage = await fabric.Image.fromURL(`file://${__dirname}../brick-image.png`);
        if (brickImage) {
            brickImage.scaleToWidth(512);
            brickImage.scaleToHeight(512);

            for (let startIndex = 0; startIndex < totalImages; startIndex += batchSize) {
                await processBatch(startIndex, batchSize, outputDir, font, brickImage);
            }

            logger.info(`Completed generating images`);
        } else {
            throw new Error('Failed to load brick image');
        }
    } catch (error) {
        logger.error(`Error loading brick image: ${error}`);
    }
    console.log('done');
}

(async () => {
    try {
        await main();
    } catch (error) {
        logger.error(`Error in main: ${error}`);
    }
})();
