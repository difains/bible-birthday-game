import Phaser from 'phaser';
import { gameState, FAMILY_OPTIONS, AGE_OPTIONS, FamilyMember, PlayerData } from '../utils/gameState';

export class InputScene extends Phaser.Scene {
    private selectedGender: 'male' | 'female' = 'male';
    private selectedAge: string = 'young_adult';
    private selectedFamily: FamilyMember[] = [];
    private nameInput!: HTMLInputElement;
    private inputContainer!: HTMLDivElement;

    constructor() {
        super({ key: 'InputScene' });
    }

    create(): void {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        this.cameras.main.fadeIn(500);

        // Background gradient
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x2c1810, 0x2c1810, 0x4a2c1a, 0x4a2c1a);
        bg.fillRect(0, 0, width, height);

        // Title
        this.add.text(width / 2, 40, '✨ 축복의 날 ✨', {
            fontFamily: '"Gowun Batang", serif',
            fontSize: '28px',
            color: '#f5e6d3',
        }).setOrigin(0.5);

        this.add.text(width / 2, 70, '당신의 정보를 입력해주세요', {
            fontFamily: '"Gowun Batang", serif',
            fontSize: '14px',
            color: '#d4a574',
        }).setOrigin(0.5);

        // Create HTML DOM form for input
        this.createInputForm();
    }

    private createInputForm(): void {
        const width = this.cameras.main.width;

        // Create container
        this.inputContainer = document.createElement('div');
        this.inputContainer.id = 'input-container';
        this.inputContainer.style.cssText = `
      position: absolute;
      top: 100px;
      left: 50%;
      transform: translateX(-50%);
      width: ${width - 40}px;
      max-width: 320px;
      font-family: 'Gowun Batang', serif;
      color: #f5e6d3;
      overflow-y: auto;
      max-height: calc(100vh - 180px);
      padding: 0 10px 20px 10px;
    `;

        // Name input
        const nameSection = this.createSection('이름');
        this.nameInput = document.createElement('input');
        this.nameInput.type = 'text';
        this.nameInput.placeholder = '이름을 입력하세요';
        this.nameInput.style.cssText = this.getInputStyle();
        nameSection.appendChild(this.nameInput);
        this.inputContainer.appendChild(nameSection);

        // Gender selection
        const genderSection = this.createSection('성별');
        const genderBtns = document.createElement('div');
        genderBtns.style.cssText = 'display: flex; gap: 10px;';

        const maleBtn = this.createToggleButton('👦 남자', 'male', true);
        const femaleBtn = this.createToggleButton('👧 여자', 'female', false);

        maleBtn.onclick = () => {
            this.selectedGender = 'male';
            maleBtn.style.background = '#d4a574';
            maleBtn.style.color = '#2c1810';
            femaleBtn.style.background = '#5c3d2e';
            femaleBtn.style.color = '#f5e6d3';
        };

        femaleBtn.onclick = () => {
            this.selectedGender = 'female';
            femaleBtn.style.background = '#d4a574';
            femaleBtn.style.color = '#2c1810';
            maleBtn.style.background = '#5c3d2e';
            maleBtn.style.color = '#f5e6d3';
        };

        genderBtns.appendChild(maleBtn);
        genderBtns.appendChild(femaleBtn);
        genderSection.appendChild(genderBtns);
        this.inputContainer.appendChild(genderSection);

        // Age selection
        const ageSection = this.createSection('연령대');
        const ageSelect = document.createElement('select');
        ageSelect.style.cssText = this.getInputStyle();
        AGE_OPTIONS.forEach(opt => {
            const option = document.createElement('option');
            option.value = opt.value;
            option.textContent = opt.label;
            if (opt.value === 'young_adult') option.selected = true;
            ageSelect.appendChild(option);
        });
        ageSelect.onchange = () => {
            this.selectedAge = ageSelect.value;
        };
        ageSection.appendChild(ageSelect);
        this.inputContainer.appendChild(ageSection);

        // Family selection
        const familySection = this.createSection('가족 구성 (복수 선택)');
        const familyGrid = document.createElement('div');
        familyGrid.style.cssText = 'display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;';

        FAMILY_OPTIONS.forEach(member => {
            const btn = document.createElement('button');
            btn.textContent = member.label;
            btn.style.cssText = `
        padding: 10px 5px;
        background: #5c3d2e;
        border: 2px solid #d4a574;
        border-radius: 8px;
        color: #f5e6d3;
        font-family: 'Gowun Batang', serif;
        font-size: 13px;
        cursor: pointer;
        transition: all 0.2s;
      `;

            btn.onclick = () => {
                const index = this.selectedFamily.findIndex(f => f.type === member.type);
                if (index > -1) {
                    this.selectedFamily.splice(index, 1);
                    btn.style.background = '#5c3d2e';
                    btn.style.color = '#f5e6d3';
                } else {
                    this.selectedFamily.push(member);
                    btn.style.background = '#d4a574';
                    btn.style.color = '#2c1810';
                }
            };

            familyGrid.appendChild(btn);
        });

        familySection.appendChild(familyGrid);
        this.inputContainer.appendChild(familySection);

        // Start button
        const startBtn = document.createElement('button');
        startBtn.textContent = '🎮 게임 시작';
        startBtn.style.cssText = `
      width: 100%;
      padding: 15px;
      margin-top: 20px;
      background: linear-gradient(135deg, #d4a574 0%, #c49464 100%);
      border: none;
      border-radius: 12px;
      color: #2c1810;
      font-family: 'Gowun Batang', serif;
      font-size: 18px;
      font-weight: bold;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      transition: transform 0.2s, box-shadow 0.2s;
    `;

        startBtn.onmouseenter = () => {
            startBtn.style.transform = 'scale(1.02)';
            startBtn.style.boxShadow = '0 6px 16px rgba(0,0,0,0.4)';
        };
        startBtn.onmouseleave = () => {
            startBtn.style.transform = 'scale(1)';
            startBtn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
        };

        startBtn.onclick = () => this.startGame();
        this.inputContainer.appendChild(startBtn);

        document.body.appendChild(this.inputContainer);
    }

    private createSection(title: string): HTMLDivElement {
        const section = document.createElement('div');
        section.style.cssText = 'margin-bottom: 15px;';

        const label = document.createElement('div');
        label.textContent = title;
        label.style.cssText = 'margin-bottom: 8px; font-size: 14px; color: #d4a574;';
        section.appendChild(label);

        return section;
    }

    private createToggleButton(text: string, _value: string, selected: boolean): HTMLButtonElement {
        const btn = document.createElement('button');
        btn.textContent = text;
        btn.style.cssText = `
      flex: 1;
      padding: 12px;
      background: ${selected ? '#d4a574' : '#5c3d2e'};
      border: 2px solid #d4a574;
      border-radius: 8px;
      color: ${selected ? '#2c1810' : '#f5e6d3'};
      font-family: 'Gowun Batang', serif;
      font-size: 16px;
      cursor: pointer;
      transition: all 0.2s;
    `;
        return btn;
    }

    private getInputStyle(): string {
        return `
      width: 100%;
      padding: 12px;
      background: #5c3d2e;
      border: 2px solid #d4a574;
      border-radius: 8px;
      color: #f5e6d3;
      font-family: 'Gowun Batang', serif;
      font-size: 16px;
      outline: none;
      box-sizing: border-box;
    `;
    }

    private startGame(): void {
        const name = this.nameInput.value.trim();

        if (!name) {
            alert('이름을 입력해주세요!');
            return;
        }

        if (this.selectedFamily.length === 0) {
            alert('최소 한 명의 가족을 선택해주세요!');
            return;
        }

        const playerData: PlayerData = {
            name,
            gender: this.selectedGender,
            ageGroup: this.selectedAge as PlayerData['ageGroup'],
            family: this.selectedFamily
        };

        gameState.setPlayerData(playerData);

        // Remove HTML elements
        if (this.inputContainer) {
            this.inputContainer.remove();
        }

        // Transition to world
        this.cameras.main.fadeOut(500);
        this.time.delayedCall(500, () => {
            this.scene.start('WorldScene');
        });
    }

    shutdown(): void {
        if (this.inputContainer) {
            this.inputContainer.remove();
        }
    }
}
