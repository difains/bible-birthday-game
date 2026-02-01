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
    private npcs: { sprite: Phaser.GameObjects.Sprite; x: number; y: number; id: string }[] = [];
    private playerSpeed: number = 150;
    private enterPrompt!: Phaser.GameObjects.Container;
    private currentDialogMessages: string[] = [];
    private currentDialogIndex: number = 0;
    private currentDialogName: string = '';
    private playerGender: string = 'male';
    private mapWidth: number = 0;
    private mapHeight: number = 0;
    private minimap!: Phaser.GameObjects.Container;
    private minimapPlayerDot!: Phaser.GameObjects.Graphics;

    constructor() {
        super({ key: 'WorldScene' });
    }

    create(): void {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        this.isDialogOpen = false;
        this.currentDialogMessages = [];
        this.currentDialogIndex = 0;
        this.currentDialogName = '';
        this.npcs = [];
        this.isJoystickActive = false;
        this.joystickVector.set(0, 0);

        const playerData = gameState.getPlayerData();
        this.playerGender = playerData?.gender || 'male';

        this.cameras.main.fadeIn(500);

        this.createOpenWorldMap(width, height);
        this.createChurch();
        this.createBiblicalNPCs();
        this.createPlayer();
        this.createMinimap();
        this.createVirtualJoystick();
        this.createActionButtons();
        this.createDialogBox();
        this.createEnterPrompt();
        this.createHeader();

        if (this.input.keyboard) {
            this.cursors = this.input.keyboard.createCursorKeys();
        }
    }

    private createOpenWorldMap(screenWidth: number, screenHeight: number): void {
        if (this.textures.exists('village_square')) {
            const texture = this.textures.get('village_square');
            const frame = texture.getSourceImage();

            this.mapWidth = Math.max(frame.width, screenWidth * 2.5);
            this.mapHeight = Math.max(frame.height, screenHeight * 3.5);

            const bg = this.add.image(this.mapWidth / 2, this.mapHeight / 2, 'village_square');
            bg.setDisplaySize(this.mapWidth, this.mapHeight);
        } else {
            this.mapWidth = screenWidth * 2.5;
            this.mapHeight = screenHeight * 3.5;

            for (let y = 0; y < this.mapHeight; y += 32) {
                for (let x = 0; x < this.mapWidth; x += 32) {
                    const tile = Math.random() > 0.3 ? 'grass' : 'ground';
                    this.add.image(x + 16, y + 16, tile);
                }
            }
        }

        const treePositions = [
            { x: 60, y: 200 },
            { x: this.mapWidth - 60, y: 250 },
            { x: 80, y: 500 },
            { x: this.mapWidth - 80, y: 550 },
            { x: 120, y: 800 },
            { x: this.mapWidth - 120, y: 850 }
        ];

        treePositions.forEach(pos => {
            if (pos.x < this.mapWidth && pos.y < this.mapHeight) {
                this.add.image(pos.x, pos.y, 'tree').setScale(0.9);
            }
        });

        this.cameras.main.setBounds(0, 0, this.mapWidth, this.mapHeight);
        this.physics.world.setBounds(0, 0, this.mapWidth, this.mapHeight);
    }

    private createChurch(): void {
        const hasChurchAsset = this.textures.exists('church_exterior');

        if (hasChurchAsset) {
            const texture = this.textures.get('church_exterior');
            const frame = texture.getSourceImage();
            const ratio = frame.width / frame.height;

            const displayHeight = 200;
            const displayWidth = displayHeight * ratio;

            this.church = this.add.image(this.mapWidth / 2, 150, 'church_exterior');
            this.church.setDisplaySize(displayWidth, displayHeight);
        } else {
            this.church = this.add.image(this.mapWidth / 2, 120, 'church');
            this.church.setScale(1.5);
        }

        this.church.setDepth(5);
        this.physics.add.existing(this.church, true);

        this.add.text(this.mapWidth / 2, this.church.y + this.church.displayHeight / 2 + 15, '서울중앙교회', {
            fontFamily: '"Gowun Batang", serif',
            fontSize: '16px',
            color: '#ffffff',
            backgroundColor: '#2c1810dd',
            padding: { x: 12, y: 6 }
        }).setOrigin(0.5).setDepth(10);
    }

    private createBiblicalNPCs(): void {
        const npcPositions = [
            { id: 'david', x: this.mapWidth * 0.18, y: 450 },
            { id: 'moses', x: this.mapWidth * 0.82, y: 550 },
            { id: 'mary', x: this.mapWidth * 0.25, y: 750 },
            { id: 'abraham', x: this.mapWidth * 0.75, y: 850 },
            { id: 'joseph', x: this.mapWidth * 0.2, y: 1100 },
            { id: 'peter', x: this.mapWidth * 0.8, y: 1200 }
        ];

        const npcAssetMap: Record<string, string> = {
            'david': 'biblical_david',
            'moses': 'biblical_moses',
            'mary': 'biblical_mary',
            'abraham': 'biblical_abraham',
            'joseph': 'biblical_joseph',
            'peter': 'biblical_peter'
        };

        npcPositions.forEach(pos => {
            const textureKey = npcAssetMap[pos.id];
            const hasAsset = this.textures.exists(textureKey);

            let npc: Phaser.GameObjects.Sprite;

            if (hasAsset) {
                const texture = this.textures.get(textureKey);
                const frame = texture.getSourceImage();

                npc = this.add.sprite(pos.x, pos.y, textureKey);
                const halfWidth = frame.width / 2;
                npc.setCrop(0, 0, halfWidth, frame.height);
                const targetHeight = 80;
                const scale = targetHeight / frame.height;
                npc.setScale(scale);
            } else {
                npc = this.add.sprite(pos.x, pos.y, 'player');
                npc.setScale(1.8);
            }

            npc.setData('npcId', pos.id);
            npc.setInteractive();
            npc.setDepth(8);

            const npcData = biblicalNPCs.find(n => n.id === pos.id);
            if (npcData) {
                this.add.text(pos.x, pos.y + 55, npcData.koreanName, {
                    fontFamily: '"Gowun Batang", serif',
                    fontSize: '13px',
                    color: '#ffffff',
                    backgroundColor: '#2c1810dd',
                    padding: { x: 6, y: 3 }
                }).setOrigin(0.5).setDepth(9);
            }

            this.tweens.add({
                targets: npc,
                y: pos.y - 5,
                duration: 1500 + Math.random() * 500,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });

            this.npcs.push({ sprite: npc, x: pos.x, y: pos.y, id: pos.id });
        });
    }

    private createPlayer(): void {
        const imageKey = this.playerGender === 'male' ? 'player_male' : 'player_female';
        const hasImage = this.textures.exists(imageKey);

        const startX = this.mapWidth / 2;
        const startY = this.mapHeight * 0.55;

        if (hasImage) {
            this.player = this.physics.add.sprite(startX, startY, imageKey);

            // Sprite sheet: 640x336, 8 columns x 4 rows of sprites, bottom ~40px is text banner
            // Each frame is approximately 80x74 pixels
            const texture = this.textures.get(imageKey);
            const frame = texture.getSourceImage();

            // Calculate actual sprite area (excluding text banner at bottom)
            const textBannerHeight = 40;
            const spriteAreaHeight = frame.height - textBannerHeight;
            const frameWidth = frame.width / 8;  // 8 columns
            const frameHeight = spriteAreaHeight / 4;  // 4 rows

            // Crop to first frame only
            this.player.setCrop(0, 0, frameWidth, frameHeight);

            // Set display size directly for the cropped area
            this.player.setDisplaySize(70, 70);

            // Adjust origin because crop affects bounding
            this.player.setOrigin(0.1, 0.1);
        } else {
            this.player = this.physics.add.sprite(startX, startY, 'player');
            this.player.setScale(2.5);
        }

        this.player.setCollideWorldBounds(true);
        this.player.setDepth(10);
        this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    }

    private createMinimap(): void {
        const minimapWidth = 100;
        const minimapHeight = 140;
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

        // Map ground
        const mapGraphics = this.add.graphics();
        mapGraphics.fillStyle(0x5a8a3a, 0.6);
        mapGraphics.fillRoundedRect(-minimapWidth / 2 + 5, -minimapHeight / 2 + 5, minimapWidth - 10, minimapHeight - 10, 4);
        this.minimap.add(mapGraphics);

        // Church marker (gold)
        const churchX = (this.mapWidth / 2 / this.mapWidth) * (minimapWidth - 10) - (minimapWidth - 10) / 2;
        const churchY = (150 / this.mapHeight) * (minimapHeight - 10) - (minimapHeight - 10) / 2;
        const churchMarker = this.add.graphics();
        churchMarker.fillStyle(0xffd700);
        churchMarker.fillCircle(churchX, churchY, 5);
        this.minimap.add(churchMarker);

        // NPC markers (cyan) - use stored positions
        this.npcs.forEach(npcData => {
            const npcX = (npcData.x / this.mapWidth) * (minimapWidth - 10) - (minimapWidth - 10) / 2;
            const npcY = (npcData.y / this.mapHeight) * (minimapHeight - 10) - (minimapHeight - 10) / 2;
            const npcMarker = this.add.graphics();
            npcMarker.fillStyle(0x00ffff);
            npcMarker.fillCircle(npcX, npcY, 4);
            this.minimap.add(npcMarker);
        });

        // Player dot (red)
        this.minimapPlayerDot = this.add.graphics();
        this.minimapPlayerDot.fillStyle(0xff4444);
        this.minimapPlayerDot.fillCircle(0, 0, 5);
        this.minimapPlayerDot.lineStyle(2, 0xffffff, 1);
        this.minimapPlayerDot.strokeCircle(0, 0, 5);
        this.minimap.add(this.minimapPlayerDot);

        // Label
        const label = this.add.text(0, minimapHeight / 2 - 12, '미니맵', {
            fontFamily: '"Gowun Batang", serif',
            fontSize: '10px',
            color: '#ffffff'
        }).setOrigin(0.5);
        this.minimap.add(label);
    }

    private updateMinimap(): void {
        if (!this.minimapPlayerDot || !this.player) return;

        const minimapWidth = 100;
        const minimapHeight = 140;

        const playerX = (this.player.x / this.mapWidth) * (minimapWidth - 10) - (minimapWidth - 10) / 2;
        const playerY = (this.player.y / this.mapHeight) * (minimapHeight - 10) - (minimapHeight - 10) / 2;

        this.minimapPlayerDot.setPosition(playerX, playerY);
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
            // Check if clicking on dialog button first
            if (this.isDialogOpen) {
                const width = this.cameras.main.width;
                const dialogY = this.cameras.main.height - 150;
                const btnCenterX = width / 2 + 110;
                const btnCenterY = dialogY + 39;

                if (pointer.x >= btnCenterX - 40 && pointer.x <= btnCenterX + 40 &&
                    pointer.y >= btnCenterY - 14 && pointer.y <= btnCenterY + 14) {
                    this.advanceDialog();
                    return;
                }
            }

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

        this.add.text(width - 80, height - 130, '대화', {
            fontFamily: '"Gowun Batang", serif',
            fontSize: '14px',
            color: '#ffffff'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(101);

        talkBtn.on('pointerdown', () => this.tryTalkToNPC());

        const actionBtn = this.add.image(width - 80, height - 60, 'action_button')
            .setScrollFactor(0)
            .setDepth(100)
            .setInteractive();

        this.add.text(width - 80, height - 60, '행동', {
            fontFamily: '"Gowun Batang", serif',
            fontSize: '14px',
            color: '#ffffff'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(101);

        actionBtn.on('pointerdown', () => this.doPunchAnimation());

        const enterBtn = this.add.image(width - 150, height - 95, 'action_button')
            .setScrollFactor(0)
            .setDepth(100)
            .setInteractive()
            .setVisible(false)
            .setName('enterBtn');

        this.add.text(width - 150, height - 95, '입장', {
            fontFamily: '"Gowun Batang", serif',
            fontSize: '12px',
            color: '#ffffff'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(101).setName('enterBtnIcon').setVisible(false);

        enterBtn.on('pointerdown', () => this.enterChurch());
    }

    private createDialogBox(): void {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        this.dialogBox = this.add.container(width / 2, height - 150)
            .setScrollFactor(0)
            .setDepth(200)
            .setVisible(false);

        const bg = this.add.graphics();
        bg.fillStyle(0x1a1a2e, 0.95);
        bg.fillRoundedRect(-155, -55, 310, 110, 12);
        bg.lineStyle(3, 0x4a90d9);
        bg.strokeRoundedRect(-155, -55, 310, 110, 12);

        const nameText = this.add.text(-140, -42, '', {
            fontFamily: '"Gowun Batang", serif',
            fontSize: '16px',
            color: '#ffd700',
            fontStyle: 'bold'
        }).setName('dialogName');

        const messageText = this.add.text(-140, -16, '', {
            fontFamily: '"Gowun Batang", serif',
            fontSize: '14px',
            color: '#f5e6d3',
            wordWrap: { width: 280 }
        }).setName('dialogMessage');

        const btnBg = this.add.graphics();
        btnBg.fillStyle(0x4a90d9, 0.9);
        btnBg.fillRoundedRect(70, 25, 80, 28, 6);

        const continueBtn = this.add.text(110, 39, '다음 ▶', {
            fontFamily: '"Gowun Batang", serif',
            fontSize: '14px',
            color: '#ffffff'
        }).setOrigin(0.5).setName('dialogContinue');

        this.dialogBox.add([bg, nameText, messageText, btnBg, continueBtn]);
    }

    private createEnterPrompt(): void {
        this.enterPrompt = this.add.container(this.cameras.main.width / 2, 55)
            .setScrollFactor(0)
            .setDepth(150)
            .setVisible(false);

        const promptBg = this.add.graphics();
        promptBg.fillStyle(0x1a1a2e, 0.9);
        promptBg.fillRoundedRect(-90, -18, 180, 36, 8);
        promptBg.lineStyle(2, 0xffd700);
        promptBg.strokeRoundedRect(-90, -18, 180, 36, 8);

        const promptText = this.add.text(0, 0, '⛪ 교회 입장하기', {
            fontFamily: '"Gowun Batang", serif',
            fontSize: '14px',
            color: '#ffd700'
        }).setOrigin(0.5);

        this.enterPrompt.add([promptBg, promptText]);
    }

    private createHeader(): void {
        const width = this.cameras.main.width;
        const playerName = gameState.getPlayerName();

        const header = this.add.container(0, 0).setScrollFactor(0).setDepth(150);

        const headerBg = this.add.graphics();
        headerBg.fillStyle(0x1a1a2e, 0.9);
        headerBg.fillRect(0, 0, width, 45);
        headerBg.lineStyle(2, 0x4a90d9);
        headerBg.lineBetween(0, 45, width, 45);

        const playerLabel = this.add.text(130, 12, `🧑 ${playerName}`, {
            fontFamily: '"Gowun Batang", serif',
            fontSize: '14px',
            color: '#ffffff'
        });

        const locationLabel = this.add.text(width - 12, 12, '📍 성경 마을', {
            fontFamily: '"Gowun Batang", serif',
            fontSize: '12px',
            color: '#87ceeb'
        }).setOrigin(1, 0);

        header.add([headerBg, playerLabel, locationLabel]);
    }

    private tryTalkToNPC(): void {
        if (this.isDialogOpen) return;

        let nearestNPC: { sprite: Phaser.GameObjects.Sprite; id: string } | null = null;
        let nearestDist = 120;

        this.npcs.forEach(npcData => {
            const dist = Phaser.Math.Distance.Between(
                this.player.x, this.player.y,
                npcData.sprite.x, npcData.sprite.y
            );
            if (dist < nearestDist) {
                nearestDist = dist;
                nearestNPC = npcData;
            }
        });

        if (nearestNPC !== null) {
            const npcId = (nearestNPC as { sprite: Phaser.GameObjects.Sprite; id: string }).id;
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
        this.currentDialogMessages = [...messages];
        this.currentDialogIndex = 0;

        this.dialogBox.setVisible(true);
        this.updateDialogDisplay();
    }

    private updateDialogDisplay(): void {
        const nameText = this.dialogBox.getByName('dialogName') as Phaser.GameObjects.Text;
        const messageText = this.dialogBox.getByName('dialogMessage') as Phaser.GameObjects.Text;
        const continueBtn = this.dialogBox.getByName('dialogContinue') as Phaser.GameObjects.Text;

        if (nameText) nameText.setText(this.currentDialogName);
        if (messageText && this.currentDialogMessages[this.currentDialogIndex]) {
            messageText.setText(this.currentDialogMessages[this.currentDialogIndex]);
        }

        if (continueBtn) {
            if (this.currentDialogIndex >= this.currentDialogMessages.length - 1) {
                continueBtn.setText('닫기 ✕');
            } else {
                continueBtn.setText('다음 ▶');
            }
        }
    }

    private advanceDialog(): void {
        if (!this.isDialogOpen) return;

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

        const continueBtn = this.dialogBox.getByName('dialogContinue') as Phaser.GameObjects.Text;
        if (continueBtn) continueBtn.setText('다음 ▶');
    }

    private doPunchAnimation(): void {
        if (this.isDialogOpen) return;

        this.tweens.add({
            targets: this.player,
            scaleX: this.player.scaleX * 1.3,
            duration: 100,
            yoyo: true
        });

        const effect = this.add.text(this.player.x + 30, this.player.y - 20, '💥', { fontSize: '24px' });
        this.tweens.add({
            targets: effect,
            alpha: 0,
            y: effect.y - 30,
            duration: 400,
            onComplete: () => effect.destroy()
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
        this.updateMinimap();

        const distToChurch = Phaser.Math.Distance.Between(
            this.player.x, this.player.y,
            this.church.x, this.church.y + this.church.displayHeight / 2
        );

        const enterBtn = this.children.getByName('enterBtn') as Phaser.GameObjects.Image;
        const enterBtnIcon = this.children.getByName('enterBtnIcon') as Phaser.GameObjects.Text;

        if (distToChurch < 180) {
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
