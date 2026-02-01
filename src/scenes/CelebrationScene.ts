import Phaser from 'phaser';
import { gameState, FamilyMember } from '../utils/gameState';
import { getFamilyMessage } from '../data/familyMessages';

export class CelebrationScene extends Phaser.Scene {
    private dialogBox!: Phaser.GameObjects.Container;
    private familyQueue: FamilyMember[] = [];
    private currentIndex: number = 0;
    private messageIndex: number = 0;
    private currentMessages: string[] = [];
    private isComplete: boolean = false;
    private confettiEmitters: Phaser.GameObjects.Particles.ParticleEmitter[] = [];
    private player!: Phaser.Physics.Arcade.Sprite;
    private joystickBase!: Phaser.GameObjects.Image;
    private joystickThumb!: Phaser.GameObjects.Image;
    private isJoystickActive: boolean = false;
    private joystickVector: Phaser.Math.Vector2 = new Phaser.Math.Vector2(0, 0);
    private playerSpeed: number = 100;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private familySprites: Phaser.GameObjects.Sprite[] = [];
    private isDialogActive: boolean = false;

    constructor() {
        super({ key: 'CelebrationScene' });
    }

    create(): void {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        this.cameras.main.fadeIn(500);

        // Reset state
        this.familyQueue = [...gameState.getFamily()];
        this.currentIndex = 0;
        this.messageIndex = 0;
        this.isComplete = false;
        this.isDialogActive = false;
        this.familySprites = [];
        this.confettiEmitters = [];
        this.isJoystickActive = false;
        this.joystickVector.set(0, 0);

        // Create celebration background
        this.createBackground(width, height);

        // Create family sprites
        this.createFamilySprites(width, height);

        // Create cake - use Nano Banana asset if available
        // 케이크.png: 768×1024 pixels
        if (this.textures.exists('cake_img')) {
            const cakeTexture = this.textures.get('cake_img');
            const cakeFrame = cakeTexture.getSourceImage();
            const cake = this.add.image(width / 2, height / 2 - 30, 'cake_img');

            // Scale to target height while maintaining aspect ratio
            const targetHeight = 120;
            const scale = targetHeight / cakeFrame.height;
            cake.setScale(scale);
            cake.setDepth(5);
        } else {
            const cake = this.add.image(width / 2, height / 2 - 30, 'cake');
            cake.setScale(1.5);
            cake.setDepth(5);
        }

        // Create dialog box
        this.createDialogBox(width, height);

        // Start confetti
        this.startConfetti(width, height);

        // Show first message after delay
        this.time.delayedCall(1000, () => {
            this.showNextFamilyMember();
        });

        // Setup keyboard
        if (this.input.keyboard) {
            this.cursors = this.input.keyboard.createCursorKeys();
        }
    }

    private createBackground(width: number, height: number): void {
        // Gradient background
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x4a2c1a, 0x4a2c1a, 0x2c1810, 0x2c1810);
        bg.fillRect(0, 0, width, height);

        // Decorative lights
        for (let i = 0; i < 20; i++) {
            const x = Phaser.Math.Between(20, width - 20);
            const y = Phaser.Math.Between(20, height / 3);
            const light = this.add.graphics();
            light.fillStyle(0xffd700, 0.6);
            light.fillCircle(0, 0, 3);
            light.setPosition(x, y);

            this.tweens.add({
                targets: light,
                alpha: 0.3,
                duration: 500 + Math.random() * 500,
                yoyo: true,
                repeat: -1
            });
        }

        // Title
        const playerName = gameState.getPlayerName();
        this.add.text(width / 2, 50, `🎂 ${playerName}님의 생일을 축하합니다! 🎂`, {
            fontFamily: '"Gowun Batang", serif',
            fontSize: '16px',
            color: '#ffd700',
            align: 'center',
            wordWrap: { width: width - 40 }
        }).setOrigin(0.5).setDepth(100);
    }

    private createFamilySprites(width: number, height: number): void {
        const family = gameState.getFamily();
        const arcRadius = 120;
        const centerX = width / 2;
        const centerY = height / 2 - 100;
        const startAngle = Math.PI;
        const endAngle = 0;
        const angleStep = family.length > 1 ? (endAngle - startAngle) / (family.length - 1) : 0;

        // Map family member types to asset keys
        const familyAssetMap: Record<string, { key: string; isMale?: boolean }> = {
            'mom': { key: 'family_mom' },
            'dad': { key: 'family_dad' },
            'grandma': { key: 'family_grandma' },
            'grandpa': { key: 'family_dad' }, // fallback to dad
            'brother': { key: 'family_sibling', isMale: true },
            'sister': { key: 'family_sibling', isMale: false },
            'older_brother': { key: 'family_sibling', isMale: true },
            'older_sister': { key: 'family_sibling', isMale: false },
            'husband': { key: 'family_dad' },
            'wife': { key: 'family_mom' },
            'son': { key: 'family_sibling', isMale: true },
            'daughter': { key: 'family_sibling', isMale: false }
        };

        family.forEach((member, index) => {
            const angle = startAngle + angleStep * index;
            const x = centerX + Math.cos(angle) * arcRadius;
            const y = centerY + Math.sin(angle) * arcRadius * 0.5 + 50;

            const assetInfo = familyAssetMap[member.type] || { key: 'family_mom' };
            const textureKey = assetInfo.key;

            if (this.textures.exists(textureKey)) {
                const texture = this.textures.get(textureKey);
                const frame = texture.getSourceImage();

                const sprite = this.add.sprite(x, y, textureKey);

                // Crop to first pose only (all family images have multiple poses)
                // 엄마/아빠/할머니: 1920×768 (3 poses, 640px each)
                // 동생: 1280×768 (2 poses, 640px each - left=male, right=female)
                let cropX = 0;
                let cropWidth = 640;

                if (textureKey === 'family_sibling' && assetInfo.isMale === false) {
                    // Female sibling is on the right half
                    cropX = 640;
                }

                sprite.setCrop(cropX, 0, cropWidth, frame.height);

                // Scale to target height
                const targetHeight = 60;
                const scale = targetHeight / frame.height;
                sprite.setScale(scale);
                sprite.setDepth(10);
                sprite.setData('familyType', member.type);
                sprite.setData('familyLabel', member.label);

                // Add name label
                this.add.text(x, y + 40, member.label, {
                    fontFamily: '"Gowun Batang", serif',
                    fontSize: '11px',
                    color: '#f5e6d3',
                    backgroundColor: '#2c1810cc',
                    padding: { x: 4, y: 2 }
                }).setOrigin(0.5).setDepth(11);

                this.familySprites.push(sprite);
            } else {
                // Fallback to placeholder
                const sprite = this.add.sprite(x, y, 'player');
                sprite.setScale(1.3);
                sprite.setDepth(10);
                sprite.setData('familyType', member.type);
                sprite.setData('familyLabel', member.label);

                this.add.text(x, y + 40, member.label, {
                    fontFamily: '"Gowun Batang", serif',
                    fontSize: '11px',
                    color: '#f5e6d3',
                    backgroundColor: '#2c1810cc',
                    padding: { x: 4, y: 2 }
                }).setOrigin(0.5).setDepth(11);

                this.familySprites.push(sprite);
            }
        });
    }

    private createDialogBox(width: number, height: number): void {
        this.dialogBox = this.add.container(width / 2, height - 120)
            .setDepth(200);

        const bg = this.add.graphics();
        bg.fillStyle(0x3d2817, 0.95);
        bg.fillRoundedRect(-150, -55, 300, 110, 12);
        bg.lineStyle(3, 0xd4a574);
        bg.strokeRoundedRect(-150, -55, 300, 110, 12);

        const speakerText = this.add.text(-130, -40, '', {
            fontFamily: '"Gowun Batang", serif',
            fontSize: '14px',
            color: '#ffd700',
            fontStyle: 'bold'
        }).setName('speaker');

        const messageText = this.add.text(-130, -15, '', {
            fontFamily: '"Gowun Batang", serif',
            fontSize: '12px',
            color: '#f5e6d3',
            wordWrap: { width: 260 }
        }).setName('message');

        const continueBtn = this.add.text(110, 35, '▶ 다음', {
            fontFamily: '"Gowun Batang", serif',
            fontSize: '12px',
            color: '#d4a574'
        }).setInteractive().setName('continue');

        continueBtn.on('pointerdown', () => this.advanceDialog());

        this.dialogBox.add([bg, speakerText, messageText, continueBtn]);
        this.dialogBox.setVisible(false);
    }

    private startConfetti(width: number, _height: number): void {
        const colors = ['confetti_pink', 'confetti_gold', 'confetti_blue'];

        colors.forEach(color => {
            const particles = this.add.particles(0, 0, color, {
                x: { min: 0, max: width },
                y: -10,
                lifespan: 4000,
                speedY: { min: 50, max: 100 },
                speedX: { min: -30, max: 30 },
                scale: { start: 1, end: 0.5 },
                rotate: { min: 0, max: 360 },
                frequency: 200,
                quantity: 1,
                gravityY: 50
            });

            this.confettiEmitters.push(particles);
        });
    }

    private showNextFamilyMember(): void {
        if (this.currentIndex >= this.familyQueue.length) {
            this.showFinalMessage();
            return;
        }

        this.isDialogActive = true;
        const member = this.familyQueue[this.currentIndex];
        const playerName = gameState.getPlayerName();
        this.currentMessages = getFamilyMessage(member.type, playerName);
        this.messageIndex = 0;

        // Highlight current speaking family member
        this.familySprites.forEach((sprite, index) => {
            if (index === this.currentIndex) {
                sprite.setAlpha(1);
                this.tweens.add({
                    targets: sprite,
                    y: sprite.y - 10,
                    duration: 300,
                    yoyo: true,
                    repeat: 2
                });
            } else {
                sprite.setAlpha(0.5);
            }
        });

        this.updateDialogText(member.label);
        this.dialogBox.setVisible(true);
    }

    private updateDialogText(speaker: string): void {
        const speakerText = this.dialogBox.getByName('speaker') as Phaser.GameObjects.Text;
        const messageText = this.dialogBox.getByName('message') as Phaser.GameObjects.Text;
        const continueBtn = this.dialogBox.getByName('continue') as Phaser.GameObjects.Text;

        speakerText.setText(`💬 ${speaker}`);
        messageText.setText(this.currentMessages[this.messageIndex]);

        // Update button text based on remaining messages
        if (this.messageIndex >= this.currentMessages.length - 1) {
            if (this.currentIndex >= this.familyQueue.length - 1) {
                continueBtn.setText('▶ 완료');
            } else {
                continueBtn.setText('▶ 다음 가족');
            }
        } else {
            continueBtn.setText('▶ 다음');
        }
    }

    private advanceDialog(): void {
        if (this.isComplete) {
            this.startFreePlay();
            return;
        }

        this.messageIndex++;

        if (this.messageIndex >= this.currentMessages.length) {
            // Move to next family member
            this.currentIndex++;
            this.messageIndex = 0;
            this.showNextFamilyMember();
        } else {
            // Show next message from same family member
            const member = this.familyQueue[this.currentIndex];
            this.updateDialogText(member.label);
        }
    }

    private showFinalMessage(): void {
        this.isComplete = true;
        this.isDialogActive = false;
        const playerName = gameState.getPlayerName();

        const speakerText = this.dialogBox.getByName('speaker') as Phaser.GameObjects.Text;
        const messageText = this.dialogBox.getByName('message') as Phaser.GameObjects.Text;
        const continueBtn = this.dialogBox.getByName('continue') as Phaser.GameObjects.Text;

        speakerText.setText('🎉 모두 함께');
        messageText.setText(`${playerName}님, 생일 축하합니다!\n하나님의 축복이 늘 함께하시길! 🙏`);
        continueBtn.setText('▶ 자유 활동');

        // Make all family members visible
        this.familySprites.forEach(sprite => {
            sprite.setAlpha(1);
        });

        // Increase confetti
        this.confettiEmitters.forEach(emitter => {
            emitter.setFrequency(50);
        });
    }

    private startFreePlay(): void {
        // Hide dialog
        this.dialogBox.setVisible(false);
        this.isDialogActive = false;

        // Stop confetti gradually
        this.confettiEmitters.forEach(emitter => {
            emitter.setFrequency(500);
            this.time.delayedCall(3000, () => {
                emitter.stop();
            });
        });

        // Create player - use gender-specific texture
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        const playerData = gameState.getPlayerData();

        let textureKey = 'player';
        if (playerData?.gender === 'male' && this.textures.exists('player_male')) {
            textureKey = 'player_male';
        } else if (playerData?.gender === 'female' && this.textures.exists('player_female')) {
            textureKey = 'player_female';
        }

        this.player = this.physics.add.sprite(width / 2, height - 80, textureKey);

        if (textureKey !== 'player') {
            this.player.setDisplaySize(48, 48);
        } else {
            this.player.setScale(1.5);
        }

        this.player.setCollideWorldBounds(true);
        this.player.setDepth(20);

        // Create joystick
        this.createVirtualJoystick();

        // Create action buttons for free play
        this.createActionButtons();

        // Show free play message
        const freePlayMsg = this.add.text(width / 2, height - 30, '🎮 자유롭게 돌아다녀보세요!', {
            fontFamily: '"Gowun Batang", serif',
            fontSize: '12px',
            color: '#d4a574'
        }).setOrigin(0.5).setDepth(100);

        this.time.delayedCall(3000, () => {
            this.tweens.add({
                targets: freePlayMsg,
                alpha: 0,
                duration: 500,
                onComplete: () => freePlayMsg.destroy()
            });
        });
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
            if (pointer.x < this.cameras.main.width / 2 && this.isComplete && !this.isDialogActive) {
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

        // Punch button
        const punchBtn = this.add.image(width - 80, height - 60, 'action_button')
            .setDepth(100)
            .setInteractive();

        this.add.text(width - 80, height - 60, '👊', {
            fontSize: '24px'
        }).setOrigin(0.5).setDepth(101);

        punchBtn.on('pointerdown', () => {
            if (this.player) {
                this.tweens.add({
                    targets: this.player,
                    scaleX: this.player.scaleX * 1.3,
                    duration: 100,
                    yoyo: true
                });

                const effect = this.add.text(
                    this.player.x + 20,
                    this.player.y - 15,
                    '💥',
                    { fontSize: '20px' }
                ).setDepth(50);

                this.tweens.add({
                    targets: effect,
                    alpha: 0,
                    y: effect.y - 20,
                    duration: 400,
                    onComplete: () => effect.destroy()
                });
            }
        });

        // Pray button
        const prayBtn = this.add.image(width - 80, height - 130, 'action_button')
            .setDepth(100)
            .setInteractive();

        this.add.text(width - 80, height - 130, '🙏', {
            fontSize: '24px'
        }).setOrigin(0.5).setDepth(101);

        prayBtn.on('pointerdown', () => {
            if (this.player) {
                const effect = this.add.text(
                    this.player.x,
                    this.player.y - 30,
                    '✨',
                    { fontSize: '20px' }
                ).setOrigin(0.5).setDepth(50);

                this.tweens.add({
                    targets: effect,
                    alpha: 0,
                    y: effect.y - 40,
                    scale: 2,
                    duration: 800,
                    onComplete: () => effect.destroy()
                });
            }
        });

        // Back button
        const backBtn = this.add.image(width - 150, height - 95, 'action_button')
            .setDepth(100)
            .setInteractive();

        this.add.text(width - 150, height - 95, '🚪', {
            fontSize: '24px'
        }).setOrigin(0.5).setDepth(101);

        backBtn.on('pointerdown', () => {
            this.cameras.main.fadeOut(500);
            this.time.delayedCall(500, () => {
                this.scene.start('WorldScene');
            });
        });
    }

    update(): void {
        if (!this.isComplete || !this.player || this.isDialogActive) return;

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
