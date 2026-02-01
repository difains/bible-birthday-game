import Phaser from 'phaser';
import { gameState } from '../utils/gameState';

export class ChurchScene extends Phaser.Scene {
    private player!: Phaser.Physics.Arcade.Sprite;
    private joystickBase!: Phaser.GameObjects.Image;
    private joystickThumb!: Phaser.GameObjects.Image;
    private isJoystickActive: boolean = false;
    private joystickVector: Phaser.Math.Vector2 = new Phaser.Math.Vector2(0, 0);
    private playerSpeed: number = 120;
    private altarZone!: Phaser.GameObjects.Zone;
    private celebrationTriggered: boolean = false;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private mapWidth: number = 0;
    private mapHeight: number = 0;
    private playerGender: string = 'male';
    private minimap!: Phaser.GameObjects.Container;
    private minimapPlayerDot!: Phaser.GameObjects.Graphics;
    private familyPositions: { x: number; y: number }[] = [];

    constructor() {
        super({ key: 'ChurchScene' });
    }

    create(): void {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        this.celebrationTriggered = false;
        this.isJoystickActive = false;
        this.joystickVector.set(0, 0);
        this.familyPositions = [];

        const playerData = gameState.getPlayerData();
        this.playerGender = playerData?.gender || 'male';

        this.cameras.main.fadeIn(500);

        this.createOpenWorldChurch(width, height);
        this.createFamilyNPCs();
        this.createPlayer();
        this.createAltarZone();
        this.createMinimap();
        this.createUI();
        this.createVirtualJoystick();
        this.createActionButtons();

        if (this.input.keyboard) {
            this.cursors = this.input.keyboard.createCursorKeys();
        }
    }

    private createOpenWorldChurch(screenWidth: number, screenHeight: number): void {
        if (this.textures.exists('church_interior')) {
            const texture = this.textures.get('church_interior');
            const frame = texture.getSourceImage();

            this.mapWidth = Math.max(frame.width, screenWidth * 1.5);
            this.mapHeight = Math.max(frame.height, screenHeight * 2);

            const bg = this.add.image(this.mapWidth / 2, this.mapHeight / 2, 'church_interior');
            bg.setDisplaySize(this.mapWidth, this.mapHeight);
        } else {
            this.mapWidth = screenWidth * 1.5;
            this.mapHeight = screenHeight * 2;

            for (let y = 0; y < this.mapHeight; y += 32) {
                for (let x = 0; x < this.mapWidth; x += 32) {
                    this.add.image(x + 16, y + 16, 'church_floor');
                }
            }

            const altarBg = this.add.graphics();
            altarBg.fillStyle(0x4a2c1a, 1);
            altarBg.fillRect(0, 0, this.mapWidth, 150);
            altarBg.lineStyle(4, 0xd4a574);
            altarBg.lineBetween(0, 150, this.mapWidth, 150);

            const cross = this.add.graphics();
            cross.fillStyle(0xffd700);
            cross.fillRect(this.mapWidth / 2 - 8, 30, 16, 100);
            cross.fillRect(this.mapWidth / 2 - 35, 50, 70, 16);
        }

        this.cameras.main.setBounds(0, 0, this.mapWidth, this.mapHeight);
        this.physics.world.setBounds(0, 0, this.mapWidth, this.mapHeight);

        this.add.text(this.mapWidth / 2, 130, '서울중앙교회', {
            fontFamily: '"Gowun Batang", serif',
            fontSize: '16px',
            color: '#ffd700',
            backgroundColor: '#4a2c1acc',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5).setDepth(10);

        this.addBirthdayDecorations();
    }

    private addBirthdayDecorations(): void {
        const balloonColors = [0xff69b4, 0x87ceeb, 0xffd700, 0x98fb98, 0xdda0dd];
        const balloonPositions = [
            { x: 50, y: 100 },
            { x: this.mapWidth - 50, y: 100 },
            { x: 100, y: 180 },
            { x: this.mapWidth - 100, y: 180 },
            { x: this.mapWidth / 2 - 120, y: 160 },
            { x: this.mapWidth / 2 + 120, y: 160 }
        ];

        balloonPositions.forEach((pos, i) => {
            const balloon = this.add.graphics();
            balloon.fillStyle(balloonColors[i % balloonColors.length]);
            balloon.fillCircle(0, 0, 18);
            balloon.lineStyle(2, 0x666666);
            balloon.lineBetween(0, 18, 0, 45);
            balloon.setPosition(pos.x, pos.y);
            balloon.setDepth(5);

            this.tweens.add({
                targets: balloon,
                y: pos.y - 12,
                duration: 1500 + i * 200,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        });

        this.add.text(this.mapWidth / 2, 70, '🎂 생일 축하합니다! 🎂', {
            fontFamily: '"Gowun Batang", serif',
            fontSize: '18px',
            color: '#ffd700',
            backgroundColor: '#8b0000cc',
            padding: { x: 15, y: 8 }
        }).setOrigin(0.5).setDepth(10);

        const cakeTexture = this.textures.exists('cake_img') ? 'cake_img' : 'cake';
        const cake = this.add.image(this.mapWidth / 2, 200, cakeTexture);
        if (this.textures.exists('cake_img')) {
            cake.setDisplaySize(80, 80);
        }
        cake.setDepth(5);
    }

    private createFamilyNPCs(): void {
        const family = gameState.getFamily();

        const positions = [
            { x: this.mapWidth * 0.25, y: 280 },
            { x: this.mapWidth * 0.5, y: 320 },
            { x: this.mapWidth * 0.75, y: 280 },
            { x: this.mapWidth * 0.35, y: 380 },
            { x: this.mapWidth * 0.65, y: 380 }
        ];

        family.forEach((member, index) => {
            if (index >= positions.length) return;

            const pos = positions[index];
            this.familyPositions.push(pos);

            const textureKey = this.textures.exists(`family_${member.type}`)
                ? `family_${member.type}`
                : 'player';

            const npc = this.add.sprite(pos.x, pos.y, textureKey);

            if (this.textures.exists(`family_${member.type}`)) {
                npc.setDisplaySize(56, 56);
            } else {
                npc.setScale(1.8);
            }

            npc.setData('familyType', member.type);
            npc.setData('familyLabel', member.label);
            npc.setDepth(8);

            this.add.text(pos.x, pos.y + 40, member.label, {
                fontFamily: '"Gowun Batang", serif',
                fontSize: '12px',
                color: '#f5e6d3',
                backgroundColor: '#2c1810cc',
                padding: { x: 4, y: 2 }
            }).setOrigin(0.5).setDepth(9);

            this.tweens.add({
                targets: npc,
                y: pos.y - 4,
                duration: 1000 + index * 100,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        });
    }

    private createPlayer(): void {
        const spriteKey = this.playerGender === 'male' ? 'player_male' : 'player_female';
        const hasSprite = this.textures.exists(spriteKey);

        const startX = this.mapWidth / 2;
        const startY = this.mapHeight * 0.8;

        // Get screen dimensions
        const screenHeight = this.cameras.main.height;
        const targetHeight = screenHeight * 0.10; // 10% of screen height

        if (hasSprite) {
            // Create sprite using frame 0 from spritesheet
            this.player = this.physics.add.sprite(startX, startY, spriteKey, 0);

            // Scale to achieve 10% screen height
            const frameHeight = 384;
            const scale = targetHeight / frameHeight;
            this.player.setScale(scale);

            // Create walk animations (shared with WorldScene)
            if (!this.anims.exists('walk_down')) {
                this.anims.create({
                    key: 'walk_down',
                    frames: this.anims.generateFrameNumbers(spriteKey, { start: 0, end: 7 }),
                    frameRate: 10,
                    repeat: -1
                });
            }

            if (!this.anims.exists('walk_left')) {
                this.anims.create({
                    key: 'walk_left',
                    frames: this.anims.generateFrameNumbers(spriteKey, { start: 8, end: 15 }),
                    frameRate: 10,
                    repeat: -1
                });
            }

            if (!this.anims.exists('walk_right')) {
                this.anims.create({
                    key: 'walk_right',
                    frames: this.anims.generateFrameNumbers(spriteKey, { start: 16, end: 23 }),
                    frameRate: 10,
                    repeat: -1
                });
            }

            if (!this.anims.exists('walk_up')) {
                this.anims.create({
                    key: 'walk_up',
                    frames: this.anims.generateFrameNumbers(spriteKey, { start: 24, end: 31 }),
                    frameRate: 10,
                    repeat: -1
                });
            }

            if (!this.anims.exists('idle')) {
                this.anims.create({
                    key: 'idle',
                    frames: [{ key: spriteKey, frame: 0 }],
                    frameRate: 1
                });
            }
        } else {
            this.player = this.physics.add.sprite(startX, startY, 'player');
            const scale = targetHeight / 32;
            this.player.setScale(scale);
        }

        this.player.setCollideWorldBounds(true);
        this.player.setDepth(10);
        this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    }

    private createAltarZone(): void {
        this.altarZone = this.add.zone(this.mapWidth / 2, 250, 250, 80);
        this.physics.add.existing(this.altarZone, true);

        this.physics.add.overlap(this.player, this.altarZone, () => {
            if (!this.celebrationTriggered) {
                this.celebrationTriggered = true;
                this.startCelebration();
            }
        });
    }

    private createMinimap(): void {
        const minimapWidth = 90;
        const minimapHeight = 120;
        const margin = 10;

        this.minimap = this.add.container(margin + minimapWidth / 2, 60 + minimapHeight / 2)
            .setScrollFactor(0)
            .setDepth(200);

        // Background
        const bg = this.add.graphics();
        bg.fillStyle(0x1a1a2e, 0.85);
        bg.fillRoundedRect(-minimapWidth / 2, -minimapHeight / 2, minimapWidth, minimapHeight, 8);
        bg.lineStyle(2, 0x4a90d9, 0.8);
        bg.strokeRoundedRect(-minimapWidth / 2, -minimapHeight / 2, minimapWidth, minimapHeight, 8);
        this.minimap.add(bg);

        // Church floor
        const mapGraphics = this.add.graphics();
        mapGraphics.fillStyle(0x654321, 0.6);
        mapGraphics.fillRoundedRect(-minimapWidth / 2 + 5, -minimapHeight / 2 + 5, minimapWidth - 10, minimapHeight - 10, 4);
        this.minimap.add(mapGraphics);

        // Altar marker (gold cross)
        const altarX = (this.mapWidth / 2 / this.mapWidth) * (minimapWidth - 10) - (minimapWidth - 10) / 2;
        const altarY = (200 / this.mapHeight) * (minimapHeight - 10) - (minimapHeight - 10) / 2;
        const altarMarker = this.add.graphics();
        altarMarker.fillStyle(0xffd700);
        altarMarker.fillRect(altarX - 2, altarY - 6, 4, 12);
        altarMarker.fillRect(altarX - 6, altarY - 2, 12, 4);
        this.minimap.add(altarMarker);

        // Family markers (pink)
        this.familyPositions.forEach(pos => {
            const famX = (pos.x / this.mapWidth) * (minimapWidth - 10) - (minimapWidth - 10) / 2;
            const famY = (pos.y / this.mapHeight) * (minimapHeight - 10) - (minimapHeight - 10) / 2;
            const famMarker = this.add.graphics();
            famMarker.fillStyle(0xff69b4);
            famMarker.fillCircle(famX, famY, 3);
            this.minimap.add(famMarker);
        });

        // Player dot (red)
        this.minimapPlayerDot = this.add.graphics();
        this.minimapPlayerDot.fillStyle(0xff4444);
        this.minimapPlayerDot.fillCircle(0, 0, 5);
        this.minimapPlayerDot.lineStyle(2, 0xffffff, 1);
        this.minimapPlayerDot.strokeCircle(0, 0, 5);
        this.minimap.add(this.minimapPlayerDot);

        // Label
        const label = this.add.text(0, minimapHeight / 2 - 12, '교회 내부', {
            fontFamily: '"Gowun Batang", serif',
            fontSize: '9px',
            color: '#ffffff'
        }).setOrigin(0.5);
        this.minimap.add(label);
    }

    private updateMinimap(): void {
        if (!this.minimapPlayerDot || !this.player) return;

        const minimapWidth = 90;
        const minimapHeight = 120;

        const playerX = (this.player.x / this.mapWidth) * (minimapWidth - 10) - (minimapWidth - 10) / 2;
        const playerY = (this.player.y / this.mapHeight) * (minimapHeight - 10) - (minimapHeight - 10) / 2;

        this.minimapPlayerDot.setPosition(playerX, playerY);
    }

    private createUI(): void {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        const playerName = gameState.getPlayerName();

        const header = this.add.container(0, 0).setScrollFactor(0).setDepth(150);

        const headerBg = this.add.graphics();
        headerBg.fillStyle(0x1a1a2e, 0.85);
        headerBg.fillRect(0, 0, width, 45);
        headerBg.lineStyle(2, 0x4a90d9);
        headerBg.lineBetween(0, 45, width, 45);

        const playerLabel = this.add.text(110, 12, `🧑 ${playerName}`, {
            fontFamily: '"Gowun Batang", serif',
            fontSize: '14px',
            color: '#ffffff'
        });

        const locationLabel = this.add.text(width - 12, 12, '⛪ 서울중앙교회', {
            fontFamily: '"Gowun Batang", serif',
            fontSize: '12px',
            color: '#87ceeb'
        }).setOrigin(1, 0);

        header.add([headerBg, playerLabel, locationLabel]);

        this.add.text(width / 2, height - 25, '💡 제단으로 이동하여 가족을 만나세요!', {
            fontFamily: '"Gowun Batang", serif',
            fontSize: '12px',
            color: '#ffd700',
            backgroundColor: '#2c1810cc',
            padding: { x: 8, y: 4 }
        }).setOrigin(0.5).setScrollFactor(0).setDepth(150).setName('hintText');
    }

    private createVirtualJoystick(): void {
        const height = this.cameras.main.height;
        const baseX = 80;
        const baseY = height - 100;

        this.joystickBase = this.add.image(baseX, baseY, 'joystick_base')
            .setScrollFactor(0)
            .setDepth(100)
            .setAlpha(0.6);

        this.joystickThumb = this.add.image(baseX, baseY, 'joystick_thumb')
            .setScrollFactor(0)
            .setDepth(101)
            .setAlpha(0.8);

        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            if (pointer.x < this.cameras.main.width / 2 && !this.celebrationTriggered) {
                this.isJoystickActive = true;
                this.joystickBase.setPosition(pointer.x, pointer.y);
                this.joystickThumb.setPosition(pointer.x, pointer.y);
                this.joystickBase.setAlpha(0.8);
                this.joystickThumb.setAlpha(1);
            }
        });

        this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
            if (this.isJoystickActive && pointer.isDown) {
                const maxDist = 40;
                const dx = pointer.x - this.joystickBase.x;
                const dy = pointer.y - this.joystickBase.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist <= maxDist) {
                    this.joystickThumb.setPosition(pointer.x, pointer.y);
                    this.joystickVector.set(dx / maxDist, dy / maxDist);
                } else {
                    const angle = Math.atan2(dy, dx);
                    this.joystickThumb.setPosition(
                        this.joystickBase.x + Math.cos(angle) * maxDist,
                        this.joystickBase.y + Math.sin(angle) * maxDist
                    );
                    this.joystickVector.set(Math.cos(angle), Math.sin(angle));
                }
            }
        });

        this.input.on('pointerup', () => {
            if (this.isJoystickActive) {
                this.isJoystickActive = false;
                this.joystickVector.set(0, 0);

                const baseX = 80;
                const baseY = this.cameras.main.height - 100;
                this.joystickBase.setPosition(baseX, baseY);
                this.joystickThumb.setPosition(baseX, baseY);
                this.joystickBase.setAlpha(0.6);
                this.joystickThumb.setAlpha(0.8);
            }
        });
    }

    private createActionButtons(): void {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        const backBtn = this.add.image(width - 80, height - 80, 'action_button')
            .setScrollFactor(0)
            .setDepth(100)
            .setInteractive();

        this.add.text(width - 80, height - 80, '나가기', {
            fontFamily: '"Gowun Batang", serif',
            fontSize: '12px',
            color: '#ffffff'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(101);

        backBtn.on('pointerdown', () => {
            if (!this.celebrationTriggered) {
                this.goBackToWorld();
            }
        });
    }

    private startCelebration(): void {
        const hint = this.children.getByName('hintText') as Phaser.GameObjects.Text;
        if (hint) hint.setVisible(false);

        this.player.setVelocity(0, 0);

        this.time.delayedCall(500, () => {
            this.cameras.main.fadeOut(300);
            this.time.delayedCall(300, () => {
                this.scene.start('CelebrationScene');
            });
        });
    }

    private goBackToWorld(): void {
        this.cameras.main.fadeOut(500);
        this.time.delayedCall(500, () => {
            this.scene.start('WorldScene');
        });
    }

    update(): void {
        if (this.celebrationTriggered) {
            this.player.setVelocity(0, 0);
            if (this.anims.exists('idle')) {
                this.player.anims.play('idle', true);
            }
            return;
        }

        let vx = 0;
        let vy = 0;

        if (this.cursors) {
            if (this.cursors.left.isDown) vx = -1;
            else if (this.cursors.right.isDown) vx = 1;
            if (this.cursors.up.isDown) vy = -1;
            else if (this.cursors.down.isDown) vy = 1;
        }

        if (this.isJoystickActive) {
            vx = this.joystickVector.x;
            vy = this.joystickVector.y;
        }

        this.player.setVelocity(vx * this.playerSpeed, vy * this.playerSpeed);

        // Play walk animations based on direction
        const isMoving = vx !== 0 || vy !== 0;
        if (isMoving) {
            if (Math.abs(vy) > Math.abs(vx)) {
                if (vy > 0 && this.anims.exists('walk_down')) {
                    this.player.anims.play('walk_down', true);
                } else if (vy < 0 && this.anims.exists('walk_up')) {
                    this.player.anims.play('walk_up', true);
                }
            } else {
                if (vx > 0 && this.anims.exists('walk_right')) {
                    this.player.anims.play('walk_right', true);
                } else if (vx < 0 && this.anims.exists('walk_left')) {
                    this.player.anims.play('walk_left', true);
                }
            }
        } else {
            if (this.anims.exists('idle')) {
                this.player.anims.play('idle', true);
            }
        }

        this.updateMinimap();
    }
}
