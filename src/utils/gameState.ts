// Game state management
export interface FamilyMember {
    type: 'mom' | 'dad' | 'grandma' | 'grandpa' | 'brother' | 'sister' |
    'older_brother' | 'older_sister' | 'husband' | 'wife' | 'son' | 'daughter';
    label: string;
}

export interface PlayerData {
    name: string;
    gender: 'male' | 'female';
    ageGroup: 'child' | 'teen' | 'young_adult' | 'adult' | 'senior';
    family: FamilyMember[];
}

export const FAMILY_OPTIONS: FamilyMember[] = [
    { type: 'mom', label: '엄마' },
    { type: 'dad', label: '아빠' },
    { type: 'grandma', label: '할머니' },
    { type: 'grandpa', label: '할아버지' },
    { type: 'brother', label: '남동생' },
    { type: 'sister', label: '여동생' },
    { type: 'older_brother', label: '형/오빠' },
    { type: 'older_sister', label: '누나/언니' },
    { type: 'husband', label: '남편' },
    { type: 'wife', label: '부인' },
    { type: 'son', label: '아들' },
    { type: 'daughter', label: '딸' }
];

export const AGE_OPTIONS = [
    { value: 'child', label: '어린이 (0-12세)' },
    { value: 'teen', label: '청소년 (13-19세)' },
    { value: 'young_adult', label: '청년 (20-35세)' },
    { value: 'adult', label: '장년 (36-60세)' },
    { value: 'senior', label: '어르신 (60세+)' }
];

class GameState {
    private static instance: GameState;
    private playerData: PlayerData | null = null;

    private constructor() { }

    static getInstance(): GameState {
        if (!GameState.instance) {
            GameState.instance = new GameState();
        }
        return GameState.instance;
    }

    setPlayerData(data: PlayerData): void {
        this.playerData = data;
    }

    getPlayerData(): PlayerData | null {
        return this.playerData;
    }

    getPlayerName(): string {
        return this.playerData?.name || '친구';
    }

    getFamily(): FamilyMember[] {
        return this.playerData?.family || [];
    }
}

export const gameState = GameState.getInstance();
