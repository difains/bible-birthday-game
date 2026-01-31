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
    private enterPrompt!: Phaser.GameObjects.Container;
    private currentDialogMessages: string[] = [];
    private currentDialogIndex: number = 0;
    private currentDialogName: string = '';
    private playerGender: string = 'male';

    constructor() {
        super({ key: 'WorldScene' });
    }

    create(): void {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        this.isDialogOpen = false;
        this.currentDialogMessages = [];
        this.currentDialogIndex = 0;
        this.npcs = [];

        const playerData = gameState.getPlayerData();
        this.playerGender = playerData?.gender || 'male';

        this.cameras.main.fadeIn(500);

        this.createBackground(width, height);
        this.createChurch(width);
        this.createBiblicalNPCs();
        this.createPlayer(width, height);
        this.createVirtualJoystick();
        this.createActionButtons();
        this.createDialogBox();
        this.createEnterPrompt();
        this.createHeader();

        if (this.input.keyboard) {
            this.cursors = this.input.keyboard.createCursorKeys();
        }
    }

    private createBackground(width: number, height: number): void {
        const mapHeight = height * 2;

        if (this.textures.exists('village_square')) {
            // Get the actual texture dimensions
            const texture = this.textures.get('village_square');
            const frame = texture.getSourceImage();
            const imgWidth = frame.width;
            const imgHeight = frame.height;
            const imgRatio = imgWidth / imgHeight;

            // For portrait mode, we want to cover the width and let height extend
            // Calculate the height needed to maintain aspect ratio
            const displayWidth = width;
            const displayHeight = displayWidth / imgRatio;

            // Create multiple tiles to cover the map
            const tilesNeeded = Math.ceil(mapHeight / displayHeight) + 1;

            for (let i = 0; i < tilesNeeded; i++) {
                const bg = this.add.image(width / 2, displayHeight / 2 + i * displayHeight, 'village_square');
                bg.setDisplaySize(displayWidth, displayHeight);
            }
        } else {
            for (let y = 0; y < mapHeight; y += 32) {
                for (let x = 0; x < width; x += 32) {
                    const tile = Math.random() > 0.3 ? 'grass' : 'ground';
                    this.add.image(x + 16, y + 16, tile);
                }
            }
        }

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

        this.cameras.main.setBounds(0, 0, width, height * 2);
        this.physics.world.setBounds(0, 0, width, height * 2);
    }

    private createChurch(width: number): void {
        const textureKey = this.textures.exists('church_exterior') ? 'church_exterior' : 'church';
        this.church = this.add.image(width / 2, 80, textureKey);

        if (this.textures.exists('church_exterior')) {
            // Maintain aspect ratio
            const texture = this.textures.get('church_exterior');
            const frame = texture.getSourceImage();
            const ratio = frame.width / frame.height;
            const displayWidth = 160;
            this.church.setDisplaySize(displayWidth, displayWidth / ratio);
        } else {
            this.church.setScale(1.2);
        }

        this.physics.add.existing(this.church, true);

        this.add.text(width / 2, 170, 'Seoul Central Church', {
            fontFamily: '"Gowun Batang", serif',
            fontSize: '14px',
            color: '#f5e6d3',
            backgroundColor: '#2c1810aa',
            padding: { x: 8, y: 4 }
        }).setOrigin(0.5);
    }

    private createBiblicalNPCs(): void {
        const width = this.cameras.main.width;

        // Map NPC ids to their asset keys
        const npcAssetMap: Record<string, string> = {
            'david': 'biblical_david',
            'moses': 'biblical_moses',
            'mary': 'biblical_mary',
            'abraham': 'biblical_abraham',
            'joseph': 'biblical_joseph',
            'peter': 'biblical_peter'
        };

        const npcPositions = [
            { id: 'david', x: 80, y: 250 },
            { id: 'moses', x: width - 80, y: 300 },
            { id: 'mary', x: 100, y: 450 },
            { id: 'abraham', x: width - 100, y: 500 },
            { id: 'joseph', x: 150, y: 650 },
            { id: 'peter', x: width - 150, y: 700 }
        ];

        npcPositions.forEach(pos => {
            const textureKey = npcAssetMap[pos.id];
            const hasAsset = this.textures.exists(textureKey);
            const npc = this.add.sprite(pos.x, pos.y, hasAsset ? textureKey : 'player');

            if (hasAsset) {
                // Get actual texture size and scale appropriately
                const texture = this.textures.get(textureKey);
                const frame = texture.getSourceImage();
                const ratio = frame.width / frame.height;

                // For NPC images with multiple poses, use only half width
                if (pos.id === 'david' || pos.id === 'moses') {
                    // These have 2 poses side by side, so crop to show only first pose
                    npc.setCrop(0, 0, frame.width / 2, frame.height);
                    npc.setDisplaySize(60, 60 / ratio * 2);
                } else {
                    // Single pose NPCs
                    npc.setDisplaySize(60, 60 / ratio);
                }
            } else {
                npc.setScale(1.5);
            }

            npc.setData('npcId', pos.id);
            npc.setInteractive();

            const npcData = biblicalNPCs.find(n => n.id === pos.id);
            if (npcData) {
                this.add.text(pos.x, pos.y + 45, npcData.koreanName, {
                    fontFamily: '"Gowun Batang", serif',
                    fontSize: '11px',
                    color: '#f5e6d3',
                    backgroundColor: '#2c181088',
                    padding: { x: 4, y: 2 }
                }).setOrigin(0.5);
            }

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
        const sheetKey = this.playerGender === 'male' ? 'player_male_sheet' : 'player_female_sheet';
        const hasSheet = this.textures.exists(sheetKey);

        if (hasSheet) {
            this.player = this.physics.add.sprite(width / 2, height * 1.5, sheetKey, 0);
            this.player.setDisplaySize(48, 48);

            // Play idle animation
            const animKey = `player_${this.playerGender}_idle`;
            if (this.anims.exists(animKey)) {
                this.player.play(animKey);
            }
        } else {
            this.player = this.physics.add.sprite(width / 2, height * 1.5, 'player');
            this.player.setScale(1.5);
        }

        this.player.setCollideWorldBounds(true);
        this.player.setDepth(10);
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

        const talkBtn = this.add.image(width - 80, height - 130, 'action_button')
            .setScrollFactor(0)
            .setDepth(100)
            .setInteractive();

        this.add.text(width - 80, height - 130, 'Talk', {
            fontSize: '12px',
            color: '#ffffff'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(101);

        talkBtn.on('pointerdown', () => {
            this.tryTalkToNPC();
        });

        const actionBtn = this.add.image(width - 80, height - 60, 'action_button')
            .setScrollFactor(0)
            .setDepth(100)
            .setInteractive();

        this.add.text(width - 80, height - 60, 'Act', {
            fontSize: '12px',
            color: '#ffffff'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(101);

        actionBtn.on('pointerdown', () => {
            this.doPunchAnimation();
        });

        const enterBtn = this.add.image(width - 150, height - 95, 'action_button')
            .setScrollFactor(0)
            .setDepth(100)
            .setInteractive()
            .setVisible(false)
            .setName('enterBtn');

        this.add.text(width - 150, height - 95, 'Enter', {
            fontSize: '10px',
            color: '#ffffff'
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

        const continueText = this.add.text(130, 40, 'Next', {
            fontFamily: '"Gowun Batang", serif',
            fontSize: '12px',
            color: '#d4a574'
        }).setInteractive().setName('dialogContinue');

        continueText.on('pointerdown', () => {
            this.advanceDialog();
        });

        this.dialogBox.add([bg, nameText, messageText, continueText]);
    }

    private createEnterPrompt(): void {
        const width = this.cameras.main.width;

        this.enterPrompt = this.add.container(width / 2, 200)
            .setScrollFactor(0)
            .setDepth(150)
            .setVisible(false);

        const promptBg = this.add.graphics();
        promptBg.fillStyle(0x2c1810, 0.9);
        promptBg.fillRoundedRect(-100, -20, 200, 40, 8);
        promptBg.lineStyle(2, 0xd4a574);
        promptBg.strokeRoundedRect(-100, -20, 200, 40, 8);

        const promptText = this.add.text(0, 0, 'Enter Church', {
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

        const playerLabel = this.add.text(15, 15, playerName, {
            fontFamily: '"Gowun Batang", serif',
            fontSize: '16px',
            color: '#f5e6d3'
        });

        const locationLabel = this.add.text(width - 15, 15, 'Biblical Village', {
            fontFamily: '"Gowun Batang", serif',
            fontSize: '14px',
            color: '#d4a574'
        }).setOrigin(1, 0);

        header.add([headerBg, playerLabel, locationLabel]);
    }

    private tryTalkToNPC(): void {
        if (this.isDialogOpen) return;

        let nearestNPC: Phaser.GameObjects.Sprite | null = null;
        let nearestDist = 100;

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

        if (nearestNPC !== null) {
            const npcSprite = nearestNPC as Phaser.GameObjects.Sprite;
            const npcId = npcSprite.getData('npcId');
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

        // Show "Close" on last message
        if (this.currentDialogIndex >= this.currentDialogMessages.length - 1) {
            continueBtn.setText('Close');
        } else {
            continueBtn.setText('Next');
        }
    }

    private advanceDialog(): void {
        this.currentDialogIndex++;

        // If we've gone past all messages, close the dialog
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

        // Reset button text for next dialog
        const continueBtn = this.dialogBox.getByName('dialogContinue') as Phaser.GameObjects.Text;
        continueBtn.setText('Next');
    }

    private doPunchAnimation(): void {
        if (this.isDialogOpen) return;

        this.tweens.add({
            targets: this.player,
            scaleX: this.player.scaleX * 1.3,
            duration: 100,
            yoyo: true
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

        // Update player animation based on movement
        const sheetKey = this.playerGender === 'male' ? 'player_male_sheet' : 'player_female_sheet';
        if (this.textures.exists(sheetKey)) {
            if (vx !== 0 || vy !== 0) {
                // Walking
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
                // Idle
                const animKey = `player_${this.playerGender}_idle`;
                if (this.player.anims.currentAnim?.key !== animKey) {
                    this.player.play(animKey);
                }
            }
        }

        const distToChurch = Phaser.Math.Distance.Between(
            this.player.x, this.player.y,
            this.church.x, this.church.y + 60
        );

        const enterBtn = this.children.getByName('enterBtn') as Phaser.GameObjects.Image;
        const enterBtnIcon = this.children.getByName('enterBtnIcon') as Phaser.GameObjects.Text;

        if (distToChurch < 120) {
            this.enterPrompt.setVisible(true);
            if (enterBtn) enterBtn.setVisible(true);
            if (enterBtnIcon) enterBtnIcon.setVisible(true);
        } else {
            this.enterPrompt.setVisible(false);
            if (enterBtn) enterBtn.setVisible(false);
            if (enterBtnIcon) enterBtnIcon.setVisible(false);
        }
    }
}
