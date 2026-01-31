export interface BiblicalNPC {
    id: string;
    name: string;
    koreanName: string;
    greeting: string;
    message: string;
    blessing: string;
}

export const biblicalNPCs: BiblicalNPC[] = [
    {
        id: 'david',
        name: 'David',
        koreanName: '다윗',
        greeting: '샬롬! 나는 다윗이야.',
        message: '여호와는 나의 목자시니, 내게 부족함이 없으리로다.',
        blessing: '오늘도 찬양하며 하나님께 영광을 돌리자! 🎵'
    },
    {
        id: 'moses',
        name: 'Moses',
        koreanName: '모세',
        greeting: '평안하기를! 나는 모세라네.',
        message: '여호와께서 너와 함께 하시니 두려워 말라.',
        blessing: '약속의 땅을 향해 담대히 나아가거라! 🏔️'
    },
    {
        id: 'mary',
        name: 'Mary',
        koreanName: '마리아',
        greeting: '안녕하세요, 평화가 함께하길.',
        message: '내 마음이 주님을 찬양하며, 내 영이 구주 하나님을 기뻐합니다.',
        blessing: '주님의 은혜가 늘 함께하시길 기도해요. 🕊️'
    },
    {
        id: 'abraham',
        name: 'Abraham',
        koreanName: '아브라함',
        greeting: '환영하네, 젊은이여.',
        message: '믿음으로 나아가라. 하나님은 약속을 지키시는 분이시다.',
        blessing: '네 자손이 하늘의 별처럼 번성하리라! ⭐'
    },
    {
        id: 'joseph',
        name: 'Joseph',
        koreanName: '요셉',
        greeting: '반갑네! 나는 요셉이야.',
        message: '어려움 속에서도 하나님은 함께 계셨어.',
        blessing: '모든 일이 합력하여 선을 이루리라! 🌈'
    },
    {
        id: 'peter',
        name: 'Peter',
        koreanName: '베드로',
        greeting: '주의 평화가 함께하길!',
        message: '예수님을 따르는 것, 그것이 가장 중요하다네.',
        blessing: '너의 믿음 위에 교회가 세워지리라! ⚓'
    },
    {
        id: 'paul',
        name: 'Paul',
        koreanName: '바울',
        greeting: '은혜와 평강이 있기를!',
        message: '내가 그리스도와 함께 십자가에 못 박혔으니...',
        blessing: '선한 싸움을 싸우고, 믿음을 지키라! 📜'
    }
];

export function getBiblicalNPC(id: string): BiblicalNPC | undefined {
    return biblicalNPCs.find(npc => npc.id === id);
}
