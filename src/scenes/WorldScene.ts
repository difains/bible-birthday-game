import Phaser from 'phaser';
import { gameState } from '../utils/gameState';
import { biblicalNPCs } from '../data/biblicalNPCs';

export class WorldScene extends Phaser.Scene {
    private player!: Phaser.Physics.Arcade.Sprite;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private joystickBase!: Phaser.GameObjects.Image;
    private joystickThumb!: Phaser.GameObjects.Image;
    private isJoystickActive: boolean = false;
    private joystickVector: Phaser.Math.Vector2 = new Phaser.Math.Vector2(0, 0);
    private church!: Phaser.GameObjects.Image;
    private dialogBox!: Phaser.GameObjects.Container;
    private isDialogOpen: boolean = false;
    private npcs: Phaser.GameObjects.Sprite[] = [];
    private playerSpeed: number = 120;
    private canEnterChurch: boolean = false;
    private enterPrompt!: Phaser.GameObjects.Container;
    private currentDialogMessages: string[] = [];
    private currentDialogIndex: number = 0;
    private currentDialogName: string = '';

    constructor() {
        super({ key: 'WorldScene' });
    }

    create(): void {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Reset dialog state
        this.isDialogOpen = false;
        this.currentDialogMessages = [];
        this.currentDialogIndex = 0;

        this.cameras.main.fadeIn(500);

        // Create tilemap background with Nano Banana asset
        this.createBackground(width, height);

        // Create church
        this.createChurch(width);

        // Create biblical NPCs
        this.createBiblicalNPCs();

        // Create player
        this.createPlayer(width, height);

        // Create virtual joystick
        this.createVirtualJoystick();

        // Create action buttons
        this.createActionButtons();

        // Create dialog system
        this.createDialogBox();

        // Create enter prompt
        this.createEnterPrompt();

        // Create UI header
        this.createHeader();

        // Setup keyboard controls
        if (this.input.keyboard) {
            this.cursors = this.input.keyboard.createCursorKeys();
        }

        // Setup collision with church entrance
        this.physics.add.overlap(this.player, this.church, () => {
            this.canEnterChurch = true;
        });
    }

    private createBackground(width: number, height: number): void {
        const mapHeight = height * 2;

        // Use village_square as background if available
        if (this.textures.exists('village_square')) {
            const bg = this.add.image(width / 2, mapHeight / 2, 'village_square');
            bg.setDisplaySize(width, mapHeight);
        } else {
            // Fallback to tiles
            for (let y = 0; y < mapHeight; y += 32) {
                for (let x = 0; x < width; x += 32) {
                    const tile = Math.random() > 0.3 ? 'grass' : 'ground';
                    this.add.image(x + 16, y + 16, tile);
                }
            }
        }

        // Add trees for decoration
        const treePositions = [
            { x: 40, y: 100 },
            { x: width - 40, y: 150 },
            { x: 60, y: 300 },
            { x: width - 60, y: 350 },
            { x: 100, y: 500 },
            { x: width - 100, y: 550 }
        ];

        treePositions.forEach(pos => {
            this.add.image(pos.x, pos.y, 'tree').setScale(0.8);
        });

        // Set camera bounds
        this.cameras.main.setBounds(0, 0, width, height * 2);
        this.physics.world.setBounds(0, 0, width, height * 2);
    }

    private createChurch(width: number): void {
        // Use Nano Banana church exterior if available
        const textureKey = this.textures.exists('church_exterior') ? 'church_exterior' : 'church';
        this.church = this.add.image(width / 2, 80, textureKey);

        if (this.textures.exists('church_exterior')) {
            this.church.setDisplaySize(140, 140);
        } else {
            this.church.setScale(1.2);
        }

        this.physics.add.existing(this.church, true);

        // Church label
        this.add.text(width / 2, 160, '서울중앙교회', {
            fontFamily: '"Gowun Batang", serif',
            fontSize: '14px',
            color: '#f5e6d3',
            backgroundColor: '#2c1810aa',
            padding: { x: 8, y: 4 }
        }).setOrigin(0.5);
    }

    private createBiblicalNPCs(): void {
        const width = this.cameras.main.width;

        const npcPositions = [
            { id: 'david', x: 80, y: 250, texture: 'biblical_david' },
            { id: 'moses', x: width - 80, y: 300, texture: 'biblical_moses' },
            { id: 'mary', x: 100, y: 450, texture: 'biblical_mary' },
            { id: 'abraham', x: width - 100, y: 500, texture: 'biblical_abraham' },
            { id: 'joseph', x: 150, y: 650, texture: 'biblical_joseph' },
            { id: 'peter', x: width - 150, y: 700, texture: 'biblical_peter' }
        ];

        npcPositions.forEach(pos => {
            const textureKey = this.textures.exists(pos.texture) ? pos.texture : 'player';
            const npc = this.add.sprite(pos.x, pos.y, textureKey);

            // Scale based on image size
            if (this.textures.exists(pos.texture)) {
                npc.setDisplaySize(48, 48);
            } else {
                npc.setScale(1.5);
            }

            npc.setData('npcId', pos.id);
            npc.setInteractive();

            // Add name label
            const npcData = biblicalNPCs.find(n => n.id === pos.id);
            if (npcData) {
                this.add.text(pos.x, pos.y + 35, npcData.koreanName, {
                    fontFamily: '"Gowun Batang", serif',
                    fontSize: '11px',
                    color: '#f5e6d3',
                    backgroundColor: '#2c181088',
                    padding: { x: 4, y: 2 }
                }).setOrigin(0.5);
            }

            // Add floating animation
            this.tweens.add({
                targets: npc,
                y: pos.y - 5,
                duration: 1500 + Math.random() * 500,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });

            this.npcs.push(npc);
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

        this.player = this.physics.add.sprite(width / 2, height * 1.5, textureKey);

        if (textureKey !== 'player') {
            this.player.setDisplaySize(48, 48);
        } else {
            this.player.setScale(1.5);
        }

        this.player.setCollideWorldBounds(true);
        this.player.setDepth(10);

        // Camera follows player
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    }

    private createVirtualJoystick(): void {
        const baseX = 80;
        const baseY = this.cameras.main.height - 100;

        this.joystickBase = this.add.image(baseX, baseY, 'joystick_base')
            .setScrollFactor(0)
            .setDepth(100)
            .setAlpha(0.6);

        this.joystickThumb = this.add.image(baseX, baseY, 'joystick_thumb')
            .setScrollFactor(0)
            .setDepth(101)
            .setAlpha(0.8);

        // Touch input for joystick
        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            if (pointer.x < this.cameras.main.width / 2 && !this.isDialogOpen) {
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
                this.joystickThumb.setPosition(this.joystickBase.x, this.joystickBase.y);
                this.joystickVector.set(0, 0);
                this.joystickBase.setAlpha(0.6);
                this.joystickThumb.setAlpha(0.8);

                // Reset joystick position
                const baseX = 80;
                const baseY = this.cameras.main.height - 100;
                this.joystickBase.setPosition(baseX, baseY);
                this.joystickThumb.setPosition(baseX, baseY);
            }
        });
    }

    private createActionButtons(): void {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Talk button
        const talkBtn = this.add.image(width - 80, height - 130, 'action_button')
            .setScrollFactor(0)
            .setDepth(100)
            .setInteractive();

        this.add.text(width - 80, height - 130, '💬', {
            fontSize: '24px'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(101);

        talkBtn.on('pointerdown', () => {
            this.tryTalkToNPC();
        });

        // Action button (punch)
        const actionBtn = this.add.image(width - 80, height - 60, 'action_button')
            .setScrollFactor(0)
            .setDepth(100)
            .setInteractive();

        this.add.text(width - 80, height - 60, '👊', {
            fontSize: '24px'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(101);

        actionBtn.on('pointerdown', () => {
            this.doPunchAnimation();
        });

        // Enter church button (only visible near church)
        const enterBtn = this.add.image(width - 150, height - 95, 'action_button')
            .setScrollFactor(0)
            .setDepth(100)
            .setInteractive()
            .setVisible(false)
            .setName('enterBtn');

        this.add.text(width - 150, height - 95, '⛪', {
            fontSize: '24px'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(101).setName('enterBtnIcon').setVisible(false);

        enterBtn.on('pointerdown', () => {
            this.enterChurch();
        });
    }

    private createDialogBox(): void {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        this.dialogBox = this.add.container(width / 2, height - 180)
            .setScrollFactor(0)
            .setDepth(200)
            .setVisible(false);

        const bg = this.add.image(0, 0, 'dialog_box').setScale(1.05);

        const nameText = this.add.text(-140, -40, '', {
            fontFamily: '"Gowun Batang", serif',
            fontSize: '14px',
            color: '#d4a574',
            fontStyle: 'bold'
        }).setName('dialogName');

        const messageText = this.add.text(-140, -15, '', {
            fontFamily: '"Gowun Batang", serif',
            fontSize: '13px',
            color: '#f5e6d3',
            wordWrap: { width: 280 }
        }).setName('dialogMessage');

        const continueText = this.add.text(130, 40, '▶ 다음', {
            fontFamily: '"Gowun Batang", serif',
            fontSize: '12px',
            color: '#d4a574'
        }).setInteractive().setName('dialogContinue');

        // Setup click handler for continue button
        continueText.on('pointerdown', () => {
            this.advanceDialog();
        });

        this.dialogBox.add([bg, nameText, messageText, continueText]);
    }

    private createEnterPrompt(): void {
        const width = this.cameras.main.width;

        this.enterPrompt = this.add.container(width / 2, 180)
            .setScrollFactor(0)
            .setDepth(150)
            .setVisible(false);

        const promptBg = this.add.graphics();
        promptBg.fillStyle(0x2c1810, 0.9);
        promptBg.fillRoundedRect(-100, -20, 200, 40, 8);
        promptBg.lineStyle(2, 0xd4a574);
        promptBg.strokeRoundedRect(-100, -20, 200, 40, 8);

        const promptText = this.add.text(0, 0, '⛪ 교회 입장하기', {
            fontFamily: '"Gowun Batang", serif',
            fontSize: '14px',
            color: '#f5e6d3'
        }).setOrigin(0.5);

        this.enterPrompt.add([promptBg, promptText]);
    }

    private createHeader(): void {
        const width = this.cameras.main.width;
        const playerName = gameState.getPlayerName();

        const header = this.add.container(0, 0).setScrollFactor(0).setDepth(150);

        const headerBg = this.add.graphics();
        headerBg.fillStyle(0x2c1810, 0.8);
        headerBg.fillRect(0, 0, width, 50);
        headerBg.lineStyle(2, 0xd4a574);
        headerBg.lineBetween(0, 50, width, 50);

        const playerLabel = this.add.text(15, 15, `🧑 ${playerName}`, {
            fontFamily: '"Gowun Batang", serif',
            fontSize: '16px',
            color: '#f5e6d3'
        });

        const locationLabel = this.add.text(width - 15, 15, '📍 성경 마을', {
            fontFamily: '"Gowun Batang", serif',
            fontSize: '14px',
            color: '#d4a574'
        }).setOrigin(1, 0);

        header.add([headerBg, playerLabel, locationLabel]);
    }

    private tryTalkToNPC(): void {
        if (this.isDialogOpen) return;

        // Find nearest NPC
        let nearestNPC: Phaser.GameObjects.Sprite | null = null;
        let nearestDist = 80;

        this.npcs.forEach(npc => {
            const dist = Phaser.Math.Distance.Between(
                this.player.x, this.player.y,
                npc.x, npc.y
            );
            if (dist < nearestDist) {
                nearestDist = dist;
                nearestNPC = npc;
            }
        });

        if (nearestNPC) {
            const npcId = nearestNPC.getData('npcId');
            const npcData = biblicalNPCs.find(n => n.id === npcId);

            if (npcData) {
                this.showDialog(npcData.koreanName, [
                    npcData.greeting,
                    npcData.message,
                    npcData.blessing
                ]);
            }
        }
    }

    private showDialog(name: string, messages: string[]): void {
        this.isDialogOpen = true;
        this.currentDialogName = name;
        this.currentDialogMessages = messages;
        this.currentDialogIndex = 0;

        this.dialogBox.setVisible(true);
        this.updateDialogDisplay();
    }

    private updateDialogDisplay(): void {
        const nameText = this.dialogBox.getByName('dialogName') as Phaser.GameObjects.Text;
        const messageText = this.dialogBox.getByName('dialogMessage') as Phaser.GameObjects.Text;
        const continueBtn = this.dialogBox.getByName('dialogContinue') as Phaser.GameObjects.Text;

        nameText.setText(this.currentDialogName);
        messageText.setText(this.currentDialogMessages[this.currentDialogIndex]);

        // Update button text based on remaining messages
        if (this.currentDialogIndex >= this.currentDialogMessages.length - 1) {
            continueBtn.setText('▶ 닫기');
        } else {
            continueBtn.setText('▶ 다음');
        }
    }

    private advanceDialog(): void {
        this.currentDialogIndex++;

        if (this.currentDialogIndex >= this.currentDialogMessages.length) {
            this.closeDialog();
        } else {
            this.updateDialogDisplay();
        }
    }

    private closeDialog(): void {
        this.isDialogOpen = false;
        this.dialogBox.setVisible(false);
        this.currentDialogMessages = [];
        this.currentDialogIndex = 0;
        this.currentDialogName = '';

        // Reset button text
        const continueBtn = this.dialogBox.getByName('dialogContinue') as Phaser.GameObjects.Text;
        continueBtn.setText('▶ 다음');
    }

    private doPunchAnimation(): void {
        if (this.isDialogOpen) return;

        // Simple punch animation
        this.tweens.add({
            targets: this.player,
            scaleX: this.player.scaleX * 1.3,
            duration: 100,
            yoyo: true,
            onStart: () => {
                // Add punch effect
                const punchEffect = this.add.text(
                    this.player.x + 30,
                    this.player.y - 20,
                    '💥',
                    { fontSize: '24px' }
                );
                this.tweens.add({
                    targets: punchEffect,
                    alpha: 0,
                    y: punchEffect.y - 30,
                    duration: 400,
                    onComplete: () => punchEffect.destroy()
                });
            }
        });
    }

    private enterChurch(): void {
        if (this.isDialogOpen) return;

        this.cameras.main.fadeOut(500);
        this.time.delayedCall(500, () => {
            this.scene.start('ChurchScene');
        });
    }

    update(): void {
        if (this.isDialogOpen) {
            this.player.setVelocity(0, 0);
            return;
        }

        // Handle movement
        let vx = 0;
        let vy = 0;

        // Keyboard controls
        if (this.cursors) {
            if (this.cursors.left.isDown) vx = -1;
            else if (this.cursors.right.isDown) vx = 1;
            if (this.cursors.up.isDown) vy = -1;
            else if (this.cursors.down.isDown) vy = 1;
        }

        // Joystick controls
        if (this.isJoystickActive) {
            vx = this.joystickVector.x;
            vy = this.joystickVector.y;
        }

        // Apply velocity
        this.player.setVelocity(vx * this.playerSpeed, vy * this.playerSpeed);

        // Check if near church
        const distToChurch = Phaser.Math.Distance.Between(
            this.player.x, this.player.y,
            this.church.x, this.church.y + 60
        );

        const enterBtn = this.children.getByName('enterBtn') as Phaser.GameObjects.Image;
        const enterBtnIcon = this.children.getByName('enterBtnIcon') as Phaser.GameObjects.Text;

        if (distToChurch < 100) {
            this.enterPrompt.setVisible(true);
            if (enterBtn) enterBtn.setVisible(true);
            if (enterBtnIcon) enterBtnIcon.setVisible(true);
            this.canEnterChurch = true;
        } else {
            this.enterPrompt.setVisible(false);
            if (enterBtn) enterBtn.setVisible(false);
            if (enterBtnIcon) enterBtnIcon.setVisible(false);
            this.canEnterChurch = false;
        }
    }
}
