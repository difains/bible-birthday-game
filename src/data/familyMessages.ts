import { FamilyMember } from '../utils/gameState';

interface FamilyMessage {
    greeting: string;
    message: string;
    blessing: string;
}

export const familyMessages: Record<FamilyMember['type'], FamilyMessage> = {
    mom: {
        greeting: '사랑하는 우리 아이야~',
        message: '생일 축하해! 오늘 하루도 하나님의 사랑 안에서 행복하길 바래.',
        blessing: '엄마가 항상 기도할게. 사랑해! 💕'
    },
    dad: {
        greeting: '우리 자랑스러운 아이야!',
        message: '생일 축하한다! 네가 이렇게 훌륭하게 자라줘서 감사해.',
        blessing: '앞으로도 하나님과 함께 멋진 인생을 살아가길! 💪'
    },
    grandma: {
        greeting: '아이고, 우리 손주~',
        message: '생일 축하해! 할머니가 많이 보고 싶었어.',
        blessing: '하나님의 복이 항상 함께 하길 기도해. 🙏'
    },
    grandpa: {
        greeting: '우리 귀한 손주야!',
        message: '생일 진심으로 축하하네.',
        blessing: '건강하고 지혜롭게 자라거라. 할아버지가 축복해! ✨'
    },
    brother: {
        greeting: '누나/형! (아니면 언니/오빠?)',
        message: '생일 축하해~! 선물은... 마음으로!',
        blessing: '오늘 하루 즐겁게 보내! 🎈'
    },
    sister: {
        greeting: '오빠/언니! (아니면 형/누나?)',
        message: '생일 축하해요~! 사랑해요!',
        blessing: '오늘은 특별히 안 싸울게요! 🎀'
    },
    older_brother: {
        greeting: '동생아!',
        message: '생일 축하해! 많이 컸구나.',
        blessing: '형/오빠로서 항상 응원할게! 💙'
    },
    older_sister: {
        greeting: '우리 동생~',
        message: '생일 축하해! 벌써 이만큼 자랐네.',
        blessing: '언니/누나가 항상 편이야! 💜'
    },
    husband: {
        greeting: '여보~',
        message: '생일 축하해요! 당신을 만나 너무 행복해요.',
        blessing: '앞으로도 함께 행복하게 살아요. 사랑해요! 💑'
    },
    wife: {
        greeting: '자기야~',
        message: '생일 축하해! 당신이 있어 매일이 감사해.',
        blessing: '오늘 하루 특별하게 보내자! 사랑해! 💏'
    },
    son: {
        greeting: '아들아!',
        message: '생일 축하해! 네가 우리 가정의 기쁨이야.',
        blessing: '하나님 안에서 훌륭한 사람으로 자라거라! 🌟'
    },
    daughter: {
        greeting: '딸아~',
        message: '생일 축하해! 네가 있어서 매일이 행복해.',
        blessing: '하나님의 사랑받는 딸로 빛나길! ⭐'
    }
};

export function getFamilyMessage(type: FamilyMember['type'], playerName: string): string[] {
    const msg = familyMessages[type];
    return [
        msg.greeting,
        `${playerName}아, ${msg.message}`,
        msg.blessing
    ];
}
