import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { PreloadScene } from './scenes/PreloadScene';
import { InputScene } from './scenes/InputScene';
import { WorldScene } from './scenes/WorldScene';
import { ChurchScene } from './scenes/ChurchScene';
import { CelebrationScene } from './scenes/CelebrationScene';

const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: 390,
    height: 844,
    backgroundColor: '#2c1810',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    pixelArt: true,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { x: 0, y: 0 },
            debug: false
        }
    },
    scene: [
        BootScene,
        PreloadScene,
        InputScene,
        WorldScene,
        ChurchScene,
        CelebrationScene
    ]
};

new Phaser.Game(config);
