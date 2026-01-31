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

        const playerData = gameState.getPlayerData();
        this.playerGender = playerData?.gender || 'male';

        this.cameras.main.fadeIn(500);

        // Create open world church interior
        this.createOpenWorldChurch(width, height);

        // Create family NPCs
        this.createFamilyNPCs();

        // Create player
        this.createPlayer();

        // Create altar zone for triggering celebration
        this.createAltarZone();

        // Create UI
        this.createUI();

        // Create virtual joystick
        this.createVirtualJoystick();

        // Create action buttons
        this.createActionButtons();

        // Setup keyboard
        if (this.input.keyboard) {
            this.cursors = this.input.keyboard.createCursorKeys();
        }
    }

    private createOpenWorldChurch(screenWidth: number, screenHeight: number): void {
        // Open world: church interior is larger than screen
        if (this.textures.exists('church_interior')) {
            const texture = this.textures.get('church_interior');
            const frame = texture.getSourceImage();

            // Use image size as map size (scaled up for exploration)
            this.mapWidth = Math.max(frame.width, screenWidth * 1.5);
            this.mapHeight = Math.max(frame.height, screenHeight * 2);

            const bg = this.add.image(this.mapWidth / 2, this.mapHeight / 2, 'church_interior');
            bg.setDisplaySize(this.mapWidth, this.mapHeight);
        } else {
            // Fallback: create larger map
            this.mapWidth = screenWidth * 1.5;
            this.mapHeight = screenHeight * 2;

            // Floor tiles
            for (let y = 0; y < this.mapHeight; y += 32) {
                for (let x = 0; x < this.mapWidth; x += 32) {
                    this.add.image(x + 16, y + 16, 'church_floor');
                }
            }

            // Altar area at top
            const altarBg = this.add.graphics();
            altarBg.fillStyle(0x4a2c1a, 1);
            altarBg.fillRect(0, 0, this.mapWidth, 150);
            altarBg.lineStyle(4, 0xd4a574);
            altarBg.lineBetween(0, 150, this.mapWidth, 150);

            // Cross
            const cross = this.add.graphics();
            cross.fillStyle(0xffd700);
            cross.fillRect(this.mapWidth / 2 - 8, 30, 16, 100);
            cross.fillRect(this.mapWidth / 2 - 35, 50, 70, 16);
        }

        // Set world and camera bounds
        this.cameras.main.setBounds(0, 0, this.mapWidth, this.mapHeight);
        this.physics.world.setBounds(0, 0, this.mapWidth, this.mapHeight);

        // Church name at the altar
        this.add.text(this.mapWidth / 2, 130, '서울중앙교회', {
            fontFamily: '"Gowun Batang", serif',
            fontSize: '16px',
            color: '#ffd700',
            backgroundColor: '#4a2c1acc',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5).setDepth(10);

        // Birthday decorations
        this.addBirthdayDecorations();
    }

    private addBirthdayDecorations(): void {
        // Balloons around the altar
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

        // Banner
        this.add.text(this.mapWidth / 2, 70, '🎂 생일 축하합니다! 🎂', {
            fontFamily: '"Gowun Batang", serif',
            fontSize: '18px',
            color: '#ffd700',
            backgroundColor: '#8b0000cc',
            padding: { x: 15, y: 8 }
        }).setOrigin(0.5).setDepth(10);

        // Cake on altar
        const cakeTexture = this.textures.exists('cake_img') ? 'cake_img' : 'cake';
        const cake = this.add.image(this.mapWidth / 2, 200, cakeTexture);
        if (this.textures.exists('cake_img')) {
            cake.setDisplaySize(80, 80);
        }
        cake.setDepth(5);
    }

    private createFamilyNPCs(): void {
        const family = gameState.getFamily();

        // Spread family around the altar area
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

            // Name label
            this.add.text(pos.x, pos.y + 40, member.label, {
                fontFamily: '"Gowun Batang", serif',
                fontSize: '12px',
                color: '#f5e6d3',
                backgroundColor: '#2c1810cc',
                padding: { x: 4, y: 2 }
            }).setOrigin(0.5).setDepth(9);

            // Idle animation
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
        const sheetKey = this.playerGender === 'male' ? 'player_male_sheet' : 'player_female_sheet';
        const hasSheet = this.textures.exists(sheetKey);

        // Start player at bottom of the map
        const startX = this.mapWidth / 2;
        const startY = this.mapHeight * 0.8;

        if (hasSheet) {
            this.player = this.physics.add.sprite(startX, startY, sheetKey, 0);
            this.player.setDisplaySize(56, 56);

            const animKey = `player_${this.playerGender}_idle`;
            if (this.anims.exists(animKey)) {
                this.player.play(animKey);
            }
        } else {
            this.player = this.physics.add.sprite(startX, startY, 'player');
            this.player.setScale(1.8);
        }

        this.player.setCollideWorldBounds(true);
        this.player.setDepth(10);

        // Camera follows player
        this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    }

    private createAltarZone(): void {
        // Zone near the altar that triggers celebration
        this.altarZone = this.add.zone(this.mapWidth / 2, 250, 250, 80);
        this.physics.add.existing(this.altarZone, true);

        this.physics.add.overlap(this.player, this.altarZone, () => {
            if (!this.celebrationTriggered) {
                this.celebrationTriggered = true;
                this.startCelebration();
            }
        });
    }

    private createUI(): void {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        const playerName = gameState.getPlayerName();

        const header = this.add.container(0, 0).setScrollFactor(0).setDepth(150);

        const headerBg = this.add.graphics();
        headerBg.fillStyle(0x2c1810, 0.85);
        headerBg.fillRect(0, 0, width, 45);
        headerBg.lineStyle(2, 0xd4a574);
        headerBg.lineBetween(0, 45, width, 45);

        const playerLabel = this.add.text(12, 12, `🧑 ${playerName}`, {
            fontFamily: '"Gowun Batang", serif',
            fontSize: '14px',
            color: '#f5e6d3'
        });

        const locationLabel = this.add.text(width - 12, 12, '⛪ 서울중앙교회', {
            fontFamily: '"Gowun Batang", serif',
            fontSize: '12px',
            color: '#d4a574'
        }).setOrigin(1, 0);

        header.add([headerBg, playerLabel, locationLabel]);

        // Hint text
        this.add.text(width / 2, height - 25, '💡 제단으로 이동하여 가족을 만나세요!', {
            fontFamily: '"Gowun Batang", serif',
            fontSize: '12px',
            color: '#d4a574',
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

        // Back to world button
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

        // Update player animation
        const sheetKey = this.playerGender === 'male' ? 'player_male_sheet' : 'player_female_sheet';
        if (this.textures.exists(sheetKey)) {
            if (vx !== 0 || vy !== 0) {
                if (Math.abs(vy) > Math.abs(vx)) {
                    const animKey = vy < 0 ? `player_${this.playerGender}_walk_up` : `player_${this.playerGender}_walk_down`;
                    if (this.player.anims.currentAnim?.key !== animKey) {
                        this.player.play(animKey);
                    }
                } else {
                    const animKey = `player_${this.playerGender}_walk_side`;
                    if (this.player.anims.currentAnim?.key !== animKey) {
                        this.player.play(animKey);
                    }
                    this.player.setFlipX(vx < 0);
                }
            } else {
                const animKey = `player_${this.playerGender}_idle`;
                if (this.player.anims.currentAnim?.key !== animKey) {
                    this.player.play(animKey);
                }
            }
        }
    }
}
