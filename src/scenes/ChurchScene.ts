import Phaser from 'phaser';
import { gameState } from '../utils/gameState';

export class ChurchScene extends Phaser.Scene {
    private player!: Phaser.Physics.Arcade.Sprite;
    private joystickBase!: Phaser.GameObjects.Image;
    private joystickThumb!: Phaser.GameObjects.Image;
    private isJoystickActive: boolean = false;
    private joystickVector: Phaser.Math.Vector2 = new Phaser.Math.Vector2(0, 0);
    private playerSpeed: number = 100;
    private altarZone!: Phaser.GameObjects.Zone;
    private celebrationTriggered: boolean = false;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

    constructor() {
        super({ key: 'ChurchScene' });
    }

    create(): void {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Reset state
        this.celebrationTriggered = false;
        this.isJoystickActive = false;
        this.joystickVector.set(0, 0);

        this.cameras.main.fadeIn(500);

        // Create church interior
        this.createChurchInterior(width, height);

        // Create family NPCs
        this.createFamilyNPCs(width, height);

        // Create player
        this.createPlayer(width, height);

        // Create altar zone for triggering celebration
        this.createAltarZone(width);

        // Create UI
        this.createUI(width, height);

        // Create virtual joystick
        this.createVirtualJoystick();

        // Create action buttons
        this.createActionButtons();

        // Setup keyboard
        if (this.input.keyboard) {
            this.cursors = this.input.keyboard.createCursorKeys();
        }
    }

    private createChurchInterior(width: number, height: number): void {
        // Use Nano Banana church interior if available
        if (this.textures.exists('church_interior')) {
            const bg = this.add.image(width / 2, height / 2, 'church_interior');
            bg.setDisplaySize(width, height);
        } else {
            // Fallback: Floor tiles
            for (let y = 0; y < height; y += 32) {
                for (let x = 0; x < width; x += 32) {
                    this.add.image(x + 16, y + 16, 'church_floor');
                }
            }

            // Background decoration - altar area
            const altarBg = this.add.graphics();
            altarBg.fillStyle(0x4a2c1a, 1);
            altarBg.fillRect(0, 0, width, 120);
            altarBg.lineStyle(4, 0xd4a574);
            altarBg.lineBetween(0, 120, width, 120);

            // Cross
            const cross = this.add.graphics();
            cross.fillStyle(0xffd700);
            cross.fillRect(width / 2 - 6, 20, 12, 80);
            cross.fillRect(width / 2 - 25, 35, 50, 12);
        }

        // Church name
        this.add.text(width / 2, 110, '서울중앙교회', {
            fontFamily: '"Gowun Batang", serif',
            fontSize: '12px',
            color: '#f5e6d3'
        }).setOrigin(0.5).setDepth(10);

        // Decorative elements - pews (only if no background image)
        if (!this.textures.exists('church_interior')) {
            for (let row = 0; row < 3; row++) {
                for (let col = 0; col < 3; col++) {
                    const pewX = 60 + col * 120;
                    const pewY = 200 + row * 80;

                    const pew = this.add.graphics();
                    pew.fillStyle(0x654321);
                    pew.fillRect(pewX - 40, pewY, 80, 20);
                    pew.fillStyle(0x8b4513);
                    pew.fillRect(pewX - 35, pewY - 15, 5, 20);
                    pew.fillRect(pewX + 30, pewY - 15, 5, 20);
                }
            }
        }

        // Birthday decorations
        this.addBirthdayDecorations(width, height);
    }

    private addBirthdayDecorations(width: number, _height: number): void {
        // Balloons
        const balloonColors = [0xff69b4, 0x87ceeb, 0xffd700, 0x98fb98, 0xdda0dd];
        const balloonPositions = [
            { x: 30, y: 80 },
            { x: width - 30, y: 80 },
            { x: 60, y: 150 },
            { x: width - 60, y: 150 },
            { x: width / 2 - 80, y: 130 },
            { x: width / 2 + 80, y: 130 }
        ];

        balloonPositions.forEach((pos, i) => {
            const balloon = this.add.graphics();
            balloon.fillStyle(balloonColors[i % balloonColors.length]);
            balloon.fillCircle(0, 0, 15);
            balloon.lineStyle(2, 0x666666);
            balloon.lineBetween(0, 15, 0, 35);
            balloon.setPosition(pos.x, pos.y);
            balloon.setDepth(5);

            // Floating animation
            this.tweens.add({
                targets: balloon,
                y: pos.y - 10,
                duration: 1500 + i * 200,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        });

        // Banner
        this.add.text(width / 2, 60, '🎂 생일 축하합니다! 🎂', {
            fontFamily: '"Gowun Batang", serif',
            fontSize: '14px',
            color: '#ffd700',
            backgroundColor: '#8b0000aa',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5).setDepth(10);

        // Cake on altar - use Nano Banana asset if available
        const cakeTexture = this.textures.exists('cake_img') ? 'cake_img' : 'cake';
        const cake = this.add.image(width / 2, 95, cakeTexture);
        if (this.textures.exists('cake_img')) {
            cake.setDisplaySize(64, 64);
        }
        cake.setDepth(5);
    }

    private createFamilyNPCs(width: number, _height: number): void {
        const family = gameState.getFamily();
        const spacing = width / (family.length + 1);

        family.forEach((member, index) => {
            const x = spacing * (index + 1);
            const y = 160;

            // Check for Nano Banana asset
            const textureKey = this.textures.exists(`family_${member.type}`)
                ? `family_${member.type}`
                : 'player';

            const npc = this.add.sprite(x, y, textureKey);

            if (this.textures.exists(`family_${member.type}`)) {
                npc.setDisplaySize(48, 48);
            } else {
                npc.setScale(1.5);
            }

            npc.setData('familyType', member.type);
            npc.setData('familyLabel', member.label);
            npc.setDepth(8);

            // Add name label
            this.add.text(x, y + 35, member.label, {
                fontFamily: '"Gowun Batang", serif',
                fontSize: '11px',
                color: '#f5e6d3',
                backgroundColor: '#2c181088',
                padding: { x: 4, y: 2 }
            }).setOrigin(0.5).setDepth(9);

            // Idle animation
            this.tweens.add({
                targets: npc,
                y: y - 3,
                duration: 1000 + index * 100,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        });
    }

    private createPlayer(width: number, height: number): void {
        // Use gender-specific player texture
        const playerData = gameState.getPlayerData();
        let textureKey = 'player';

        if (playerData?.gender === 'male' && this.textures.exists('player_male')) {
            textureKey = 'player_male';
        } else if (playerData?.gender === 'female' && this.textures.exists('player_female')) {
            textureKey = 'player_female';
        }

        this.player = this.physics.add.sprite(width / 2, height - 100, textureKey);

        if (textureKey !== 'player') {
            this.player.setDisplaySize(48, 48);
        } else {
            this.player.setScale(1.5);
        }

        this.player.setCollideWorldBounds(true);
        this.player.setDepth(10);
    }

    private createAltarZone(width: number): void {
        // Zone near the altar that triggers celebration
        this.altarZone = this.add.zone(width / 2, 170, 200, 60);
        this.physics.add.existing(this.altarZone, true);

        this.physics.add.overlap(this.player, this.altarZone, () => {
            if (!this.celebrationTriggered) {
                this.celebrationTriggered = true;
                this.startCelebration();
            }
        });
    }

    private createUI(width: number, height: number): void {
        const playerName = gameState.getPlayerName();

        const header = this.add.container(0, 0).setScrollFactor(0).setDepth(150);

        const headerBg = this.add.graphics();
        headerBg.fillStyle(0x2c1810, 0.8);
        headerBg.fillRect(0, 0, width, 45);

        const playerLabel = this.add.text(15, 12, `🧑 ${playerName}`, {
            fontFamily: '"Gowun Batang", serif',
            fontSize: '14px',
            color: '#f5e6d3'
        });

        const locationLabel = this.add.text(width - 15, 12, '⛪ 서울중앙교회', {
            fontFamily: '"Gowun Batang", serif',
            fontSize: '12px',
            color: '#d4a574'
        }).setOrigin(1, 0);

        header.add([headerBg, playerLabel, locationLabel]);

        // Hint text
        this.add.text(width / 2, height - 30, '💡 앞으로 이동하여 가족을 만나세요!', {
            fontFamily: '"Gowun Batang", serif',
            fontSize: '12px',
            color: '#d4a574'
        }).setOrigin(0.5).setDepth(150).setName('hintText');
    }

    private createVirtualJoystick(): void {
        const height = this.cameras.main.height;
        const baseX = 80;
        const baseY = height - 80;

        this.joystickBase = this.add.image(baseX, baseY, 'joystick_base')
            .setDepth(100)
            .setAlpha(0.6);

        this.joystickThumb = this.add.image(baseX, baseY, 'joystick_thumb')
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
                const baseY = this.cameras.main.height - 80;
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

        // Back to world button
        const backBtn = this.add.image(width - 80, height - 60, 'action_button')
            .setDepth(100)
            .setInteractive();

        this.add.text(width - 80, height - 60, '🚪', {
            fontSize: '24px'
        }).setOrigin(0.5).setDepth(101);

        backBtn.on('pointerdown', () => {
            if (!this.celebrationTriggered) {
                this.goBackToWorld();
            }
        });
    }

    private startCelebration(): void {
        // Hide hint
        const hint = this.children.getByName('hintText') as Phaser.GameObjects.Text;
        if (hint) hint.setVisible(false);

        // Stop player
        this.player.setVelocity(0, 0);

        // Transition to celebration scene
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
    }
}
