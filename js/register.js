/** Speech style: polite 해요체, formal 합쇼체, casual 반말. */

const FORMAL = [
  [/배고파요/g, '배고픕니다'],
  [/앉으세요/g, '앉으십시오'],
  [/먹으세요/g, '먹으십시오'],
  [/읽으세요/g, '읽으십시오'],
  [/들으세요/g, '들으십시오'],
  [/마시세요/g, '마시십시오'],
  [/오세요/g, '오십시오'],
  [/가세요/g, '가십시오'],
  [/보세요/g, '보십시오'],
  [/주세요/g, '주십시오'],
  [/하세요/g, '하십시오'],
  [/쓰지 마세요/g, '쓰지 마십시오'],
  [/학생이에요/g, '학생입니다'],
  [/아니에요/g, '아닙니다'],
  [/민수예요/g, '민수입니다'],
  [/갈 거예요/g, '갈 겁니다'],
  [/올 거예요/g, '올 겁니다'],
  [/볼 거예요/g, '볼 겁니다'],
  [/줄 거예요/g, '줄 겁니다'],
  [/할 거예요/g, '할 겁니다'],
  [/먹을 거예요/g, '먹을 겁니다'],
  [/마실 거예요/g, '마실 겁니다'],
  [/읽을 거예요/g, '읽을 겁니다'],
  [/들을 거예요/g, '들을 겁니다'],
  [/쓸 거예요/g, '쓸 겁니다'],
  [/살 거예요/g, '살 겁니다'],
  [/알 거예요/g, '알 겁니다'],
  [/모를 거예요/g, '모를 겁니다'],
  [/있을 거예요/g, '있을 겁니다'],
  [/없을 거예요/g, '없을 겁니다'],
  [/공부할 거예요/g, '공부할 겁니다'],
  [/수 있어요/g, '수 있습니다'],
  [/수 없어요/g, '수 없습니다'],
  [/싶어요/g, '싶습니다'],
  [/지 않아요/g, '지 않습니다'],
  [/안 먹어요/g, '안 먹습니다'],
  [/안 가요/g, '안 갑니다'],
  [/안 와요/g, '안 옵니다'],
  [/안 봐요/g, '안 봅니다'],
  [/안 들어요/g, '안 듣습니다'],
  [/안 써요/g, '안 씁니다'],
  [/안 살아요/g, '안 삽니다'],
  [/먹었어요/g, '먹었습니다'],
  [/갔어요/g, '갔습니다'],
  [/왔어요/g, '왔습니다'],
  [/봤어요/g, '봤습니다'],
  [/했어요/g, '했습니다'],
  [/마셨어요/g, '마셨습니다'],
  [/들었어요/g, '들었습니다'],
  [/썼어요/g, '썼습니다'],
  [/읽었어요/g, '읽었습니다'],
  [/몰랐어요/g, '몰랐습니다'],
  [/살았어요/g, '살았습니다'],
  [/있었어요/g, '있었습니다'],
  [/없었어요/g, '없었습니다'],
  [/공부해요/g, '공부합니다'],
  [/좋아해요/g, '좋아합니다'],
  [/만나요/g, '만납니다'],
  [/먹어요/g, '먹습니다'],
  [/마셔요/g, '마십니다'],
  [/들어요/g, '듣습니다'],
  [/읽어요/g, '읽습니다'],
  [/써요/g, '씁니다'],
  [/살아요/g, '삽니다'],
  [/알아요/g, '압니다'],
  [/몰라요/g, '모릅니다'],
  [/앉아요/g, '앉습니다'],
  [/있어요/g, '있습니다'],
  [/없어요/g, '없습니다'],
  [/가요/g, '갑니다'],
  [/와요/g, '옵니다'],
  [/봐요/g, '봅니다'],
  [/줘요/g, '줍니다'],
  [/해요/g, '합니다'],
  [/이에요/g, '입니다'],
  [/예요/g, '입니다'],
];

const CASUAL = [
  [/배고파요/g, '배고파'],
  [/앉으세요/g, '앉아'],
  [/먹으세요/g, '먹어'],
  [/읽으세요/g, '읽어'],
  [/들으세요/g, '들어'],
  [/마시세요/g, '마셔'],
  [/오세요/g, '와'],
  [/가세요/g, '가'],
  [/보세요/g, '봐'],
  [/주세요/g, '줘'],
  [/하세요/g, '해'],
  [/학생이에요/g, '학생이야'],
  [/아니에요/g, '아니야'],
  [/민수예요/g, '민수야'],
  [/갈 거예요/g, '갈 거야'],
  [/올 거예요/g, '올 거야'],
  [/볼 거예요/g, '볼 거야'],
  [/줄 거예요/g, '줄 거야'],
  [/할 거예요/g, '할 거야'],
  [/먹을 거예요/g, '먹을 거야'],
  [/마실 거예요/g, '마실 거야'],
  [/읽을 거예요/g, '읽을 거야'],
  [/들을 거예요/g, '들을 거야'],
  [/쓸 거예요/g, '쓸 거야'],
  [/살 거예요/g, '살 거야'],
  [/알 거예요/g, '알 거야'],
  [/모를 거예요/g, '모를 거야'],
  [/있을 거예요/g, '있을 거야'],
  [/없을 거예요/g, '없을 거야'],
  [/공부할 거예요/g, '공부할 거야'],
  [/수 있어요/g, '수 있어'],
  [/싶어요/g, '싶어'],
  [/지 않아요/g, '지 않아'],
  [/안 먹어요/g, '안 먹어'],
  [/안 가요/g, '안 가'],
  [/안 와요/g, '안 와'],
  [/안 봐요/g, '안 봐'],
  [/안 들어요/g, '안 들어'],
  [/안 써요/g, '안 써'],
  [/안 살아요/g, '안 살아'],
  [/먹었어요/g, '먹었어'],
  [/갔어요/g, '갔어'],
  [/왔어요/g, '왔어'],
  [/봤어요/g, '봤어'],
  [/했어요/g, '했어'],
  [/마셨어요/g, '마셨어'],
  [/들었어요/g, '들었어'],
  [/썼어요/g, '썼어'],
  [/읽었어요/g, '읽었어'],
  [/몰랐어요/g, '몰랐어'],
  [/살았어요/g, '살았어'],
  [/있었어요/g, '있었어'],
  [/없었어요/g, '없었어'],
  [/공부해요/g, '공부해'],
  [/좋아해요/g, '좋아해'],
  [/만나요/g, '만나'],
  [/먹어요/g, '먹어'],
  [/마셔요/g, '마셔'],
  [/들어요/g, '들어'],
  [/읽어요/g, '읽어'],
  [/써요/g, '써'],
  [/살아요/g, '살아'],
  [/알아요/g, '알아'],
  [/몰라요/g, '몰라'],
  [/앉아요/g, '앉아'],
  [/있어요/g, '있어'],
  [/없어요/g, '없어'],
  [/가요/g, '가'],
  [/와요/g, '와'],
  [/봐요/g, '봐'],
  [/줘요/g, '줘'],
  [/해요/g, '해'],
  [/이에요/g, '이야'],
  [/예요/g, '야'],
];

export function speechStyle(state) {
  const value = state && state.register;
  return value === 'formal' || value === 'casual' ? value : 'polite';
}

export function shiftSpeech(text, register) {
  if (!text || register === 'polite' || !register) return text;
  let s = String(text);
  if (register === 'casual') {
    s = s.replace(/저희/g, '우리').replace(/저는/g, '나는').replace(/제가/g, '내가').replace(/저도/g, '나도').replace(/제는/g, '내는');
  }
  const rules = register === 'formal' ? FORMAL : CASUAL;
  for (const [re, to] of rules) s = s.replace(re, to);
  return s;
}

export function allowsCard(card, register) {
  if (!card || !card.register) return true;
  if (card.register === 'casual') return register === 'casual';
  if (card.register === 'polite') return register !== 'casual';
  return true;
}

export function presentCard(card, register) {
  if (!card) return card;
  const style = register === 'formal' || register === 'casual' ? register : 'polite';
  if (style === 'polite') return card;
  const answer = shiftSpeech(card.answer, style);
  const speak = shiftSpeech(card.speak || '', style);
  const accept = (card.accept || []).map(item => shiftSpeech(item, style));
  return {
    ...card,
    answer,
    speak: speak || answer,
    accept,
    morphs: null,
  };
}

export function tuneDrill(drill, register) {
  if (!drill || speechStyle({ register }) === 'polite') return drill;
  const tile = (item) => ({ ...item, text: shiftSpeech(item.text, register) });
  const line = (list) => (list || []).map(text => shiftSpeech(text, register));
  const answers = (drill.answers || [drill.answer]).map(line);
  return {
    ...drill,
    tiles: drill.tiles.map(tile),
    answer: line(drill.answer),
    answers,
    sov: shiftSpeech(drill.sov || '', register),
  };
}
