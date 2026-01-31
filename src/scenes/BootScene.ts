import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    create(): void {
        // Show loading text
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        this.add.text(width / 2, height / 2 - 50, '축복의 날', {
            fontFamily: '"Gowun Batang", serif',
            fontSize: '32px',
            color: '#f5e6d3',
        }).setOrigin(0.5);

        this.add.text(width / 2, height / 2, 'Blessings Day', {
            fontFamily: '"Press Start 2P", cursive',
            fontSize: '12px',
            color: '#d4a574',
        }).setOrigin(0.5);

        const loading = this.add.text(width / 2, height / 2 + 80, '로딩 중...', {
            fontFamily: '"Gowun Batang", serif',
            fontSize: '16px',
            color: '#a08060',
        }).setOrigin(0.5);

        // Fade in effect
        this.cameras.main.fadeIn(500);

        // Tween for loading text
        this.tweens.add({
            targets: loading,
            alpha: 0.5,
            duration: 500,
            yoyo: true,
            repeat: -1
        });

        // Proceed to PreloadScene after brief delay
        this.time.delayedCall(1000, () => {
            this.scene.start('PreloadScene');
        });
    }
}
