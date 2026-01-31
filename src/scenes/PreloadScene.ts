import Phaser from 'phaser';

export class PreloadScene extends Phaser.Scene {
    private progressBar!: Phaser.GameObjects.Graphics;
    private progressBox!: Phaser.GameObjects.Graphics;

    constructor() {
        super({ key: 'PreloadScene' });
    }

    preload(): void {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Progress bar background
        this.progressBox = this.add.graphics();
        this.progressBox.fillStyle(0x3d2817, 0.8);
        this.progressBox.fillRoundedRect(width / 2 - 120, height / 2 - 15, 240, 30, 8);

        // Progress bar
        this.progressBar = this.add.graphics();

        // Loading text
        const loadingText = this.add.text(width / 2, height / 2 - 50, '에셋 로딩 중...', {
            fontFamily: '"Gowun Batang", serif',
            fontSize: '18px',
            color: '#f5e6d3'
        }).setOrigin(0.5);

        // Progress events
        this.load.on('progress', (value: number) => {
            this.progressBar.clear();
            this.progressBar.fillStyle(0xd4a574, 1);
            this.progressBar.fillRoundedRect(width / 2 - 115, height / 2 - 10, 230 * value, 20, 5);
        });

        this.load.on('complete', () => {
            this.progressBar.destroy();
            this.progressBox.destroy();
            loadingText.destroy();
        });

        // Generate placeholder graphics instead of loading external files
        this.createPlaceholderAssets();
    }

    private createPlaceholderAssets(): void {
        // Create placeholder textures programmatically
        // These will be replaced with actual assets later

        // Player placeholder (32x32)
        const playerGraphics = this.make.graphics({ x: 0, y: 0 });
        playerGraphics.fillStyle(0x4a90d9);
        playerGraphics.fillCircle(16, 12, 8); // Head
        playerGraphics.fillStyle(0x8b6914);
        playerGraphics.fillRect(8, 20, 16, 12); // Body
        playerGraphics.generateTexture('player', 32, 32);
        playerGraphics.destroy();

        // NPC placeholder
        const npcGraphics = this.make.graphics({ x: 0, y: 0 });
        npcGraphics.fillStyle(0xd4a574);
        npcGraphics.fillCircle(16, 12, 8);
        npcGraphics.fillStyle(0x6b4423);
        npcGraphics.fillRect(8, 20, 16, 12);
        npcGraphics.generateTexture('npc', 32, 32);
        npcGraphics.destroy();

        // Family member placeholders with different colors
        const familyColors: Record<string, number> = {
            mom: 0xff69b4,
            dad: 0x4169e1,
            grandma: 0x9370db,
            grandpa: 0x8b4513,
            brother: 0x32cd32,
            sister: 0xffd700,
            older_brother: 0x20b2aa,
            older_sister: 0xff6347,
            husband: 0x6495ed,
            wife: 0xdb7093,
            son: 0x00ced1,
            daughter: 0xf0e68c
        };

        Object.entries(familyColors).forEach(([key, color]) => {
            const g = this.make.graphics({ x: 0, y: 0 });
            g.fillStyle(color);
            g.fillCircle(16, 12, 8);
            g.fillStyle(0x8b6914);
            g.fillRect(8, 20, 16, 12);
            g.generateTexture(`family_${key}`, 32, 32);
            g.destroy();
        });

        // Biblical NPC placeholders
        const biblicalColors: Record<string, number> = {
            david: 0xffd700,
            moses: 0xf5f5dc,
            mary: 0x87ceeb,
            abraham: 0xdaa520,
            joseph: 0xff8c00,
            peter: 0x4682b4,
            paul: 0x8b0000
        };

        Object.entries(biblicalColors).forEach(([key, color]) => {
            const g = this.make.graphics({ x: 0, y: 0 });
            g.fillStyle(color);
            g.fillCircle(16, 12, 8);
            g.fillStyle(0x654321);
            g.fillRect(8, 20, 16, 12);
            g.generateTexture(`biblical_${key}`, 32, 32);
            g.destroy();
        });

        // Dialog box
        const dialogGraphics = this.make.graphics({ x: 0, y: 0 });
        dialogGraphics.fillStyle(0x3d2817, 0.95);
        dialogGraphics.fillRoundedRect(0, 0, 320, 120, 12);
        dialogGraphics.lineStyle(3, 0xd4a574);
        dialogGraphics.strokeRoundedRect(0, 0, 320, 120, 12);
        dialogGraphics.generateTexture('dialog_box', 320, 120);
        dialogGraphics.destroy();

        // Button
        const buttonGraphics = this.make.graphics({ x: 0, y: 0 });
        buttonGraphics.fillStyle(0x5c3d2e);
        buttonGraphics.fillRoundedRect(0, 0, 100, 40, 8);
        buttonGraphics.lineStyle(2, 0xd4a574);
        buttonGraphics.strokeRoundedRect(0, 0, 100, 40, 8);
        buttonGraphics.generateTexture('button', 100, 40);
        buttonGraphics.destroy();

        // Joystick base
        const joystickBase = this.make.graphics({ x: 0, y: 0 });
        joystickBase.fillStyle(0x3d2817, 0.5);
        joystickBase.fillCircle(50, 50, 50);
        joystickBase.lineStyle(2, 0xd4a574, 0.5);
        joystickBase.strokeCircle(50, 50, 50);
        joystickBase.generateTexture('joystick_base', 100, 100);
        joystickBase.destroy();

        // Joystick thumb
        const joystickThumb = this.make.graphics({ x: 0, y: 0 });
        joystickThumb.fillStyle(0xd4a574, 0.8);
        joystickThumb.fillCircle(25, 25, 25);
        joystickThumb.generateTexture('joystick_thumb', 50, 50);
        joystickThumb.destroy();

        // Action button
        const actionBtn = this.make.graphics({ x: 0, y: 0 });
        actionBtn.fillStyle(0x5c3d2e, 0.8);
        actionBtn.fillCircle(30, 30, 30);
        actionBtn.lineStyle(2, 0xd4a574);
        actionBtn.strokeCircle(30, 30, 30);
        actionBtn.generateTexture('action_button', 60, 60);
        actionBtn.destroy();

        // Ground tile
        const groundTile = this.make.graphics({ x: 0, y: 0 });
        groundTile.fillStyle(0x8b7355);
        groundTile.fillRect(0, 0, 32, 32);
        groundTile.lineStyle(1, 0x6b5344, 0.3);
        groundTile.strokeRect(0, 0, 32, 32);
        groundTile.generateTexture('ground', 32, 32);
        groundTile.destroy();

        // Grass tile
        const grassTile = this.make.graphics({ x: 0, y: 0 });
        grassTile.fillStyle(0x5a8a3a);
        grassTile.fillRect(0, 0, 32, 32);
        grassTile.fillStyle(0x4a7a2a);
        grassTile.fillRect(5, 5, 4, 8);
        grassTile.fillRect(20, 12, 4, 8);
        grassTile.fillRect(12, 20, 4, 8);
        grassTile.generateTexture('grass', 32, 32);
        grassTile.destroy();

        // Church building
        const church = this.make.graphics({ x: 0, y: 0 });
        church.fillStyle(0xf5f5dc);
        church.fillRect(16, 40, 96, 80); // Main building
        church.fillStyle(0x8b4513);
        church.fillTriangle(64, 0, 16, 40, 112, 40); // Roof
        church.fillStyle(0xffd700);
        church.fillRect(54, 10, 20, 25); // Cross
        church.fillRect(60, 5, 8, 35);
        church.fillStyle(0x654321);
        church.fillRect(44, 80, 40, 40); // Door
        church.generateTexture('church', 128, 128);
        church.destroy();

        // Church floor tile
        const churchFloor = this.make.graphics({ x: 0, y: 0 });
        churchFloor.fillStyle(0xdeb887);
        churchFloor.fillRect(0, 0, 32, 32);
        churchFloor.lineStyle(1, 0xcd853f, 0.5);
        churchFloor.strokeRect(0, 0, 32, 32);
        churchFloor.generateTexture('church_floor', 32, 32);
        churchFloor.destroy();

        // Cake
        const cake = this.make.graphics({ x: 0, y: 0 });
        cake.fillStyle(0xffc0cb);
        cake.fillRect(8, 24, 48, 24); // Bottom layer
        cake.fillStyle(0xffb6c1);
        cake.fillRect(14, 12, 36, 16); // Top layer
        cake.fillStyle(0xff69b4);
        cake.fillRect(28, 4, 8, 12); // Candle
        cake.fillStyle(0xffa500);
        cake.fillCircle(32, 2, 4); // Flame
        cake.generateTexture('cake', 64, 48);
        cake.destroy();

        // Tree
        const tree = this.make.graphics({ x: 0, y: 0 });
        tree.fillStyle(0x8b4513);
        tree.fillRect(24, 40, 16, 24); // Trunk
        tree.fillStyle(0x228b22);
        tree.fillCircle(32, 20, 24); // Foliage
        tree.fillStyle(0x2e8b2e);
        tree.fillCircle(24, 28, 16);
        tree.fillCircle(40, 28, 16);
        tree.generateTexture('tree', 64, 64);
        tree.destroy();

        // Confetti particle
        const confetti = this.make.graphics({ x: 0, y: 0 });
        confetti.fillStyle(0xff69b4);
        confetti.fillRect(0, 0, 8, 8);
        confetti.generateTexture('confetti_pink', 8, 8);
        confetti.clear();
        confetti.fillStyle(0xffd700);
        confetti.fillRect(0, 0, 8, 8);
        confetti.generateTexture('confetti_gold', 8, 8);
        confetti.clear();
        confetti.fillStyle(0x87ceeb);
        confetti.fillRect(0, 0, 8, 8);
        confetti.generateTexture('confetti_blue', 8, 8);
        confetti.destroy();
    }

    create(): void {
        // Transition to input scene
        this.cameras.main.fadeOut(300);
        this.time.delayedCall(300, () => {
            this.scene.start('InputScene');
        });
    }
}
