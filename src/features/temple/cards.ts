import type { TarotDrawnCard } from './types';

const positions = ['过去', '现在', '可能的方向'];

const majorArcana = [
  { name: '愚者', meaning: '新的旅程、信任与未知' },
  { name: '魔术师', meaning: '意志、行动与资源整合' },
  { name: '女祭司', meaning: '直觉、秘密与内在声音' },
  { name: '女皇', meaning: '滋养、创造与丰盛' },
  { name: '皇帝', meaning: '秩序、边界与责任' },
  { name: '教皇', meaning: '传统、学习与精神指引' },
  { name: '恋人', meaning: '选择、关系与价值一致' },
  { name: '战车', meaning: '推进、掌控与胜利意志' },
  { name: '力量', meaning: '温柔的勇气与自我驯服' },
  { name: '隐者', meaning: '独处、寻找与内在灯火' },
  { name: '命运之轮', meaning: '转变、周期与时机' },
  { name: '正义', meaning: '平衡、因果与清明判断' },
  { name: '倒吊人', meaning: '暂停、换位与放下执念' },
  { name: '死神', meaning: '结束、蜕变与更新' },
  { name: '节制', meaning: '调和、耐心与流动' },
  { name: '恶魔', meaning: '束缚、欲望与看见阴影' },
  { name: '高塔', meaning: '震动、崩塌与真相显露' },
  { name: '星星', meaning: '希望、疗愈与远方的光' },
  { name: '月亮', meaning: '迷雾、梦境与不确定' },
  { name: '太阳', meaning: '明朗、生命力与坦诚' },
  { name: '审判', meaning: '回应召唤、复盘与重生' },
  { name: '世界', meaning: '完成、整合与新的边界' },
];

export function drawTarotCards(rng = Math.random): TarotDrawnCard[] {
  const deck = [...majorArcana];

  return positions.map((position) => {
    const index = Math.floor(rng() * deck.length);
    const [card] = deck.splice(index, 1);

    return {
      name: card.name,
      arcana: 'major',
      orientation: rng() < 0.5 ? 'upright' : 'reversed',
      position,
      meaning: card.meaning,
    };
  });
}
