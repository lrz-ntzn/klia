/* Flashcard decks for building real Korean sentences. English prompt by default. */

const DIG = ['', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구'];
const SMALL = ['', '십', '백', '천'];
const NAT_ONES = ['', '하나', '둘', '셋', '넷', '다섯', '여섯', '일곱', '여덟', '아홉'];
const NAT_TENS = ['', '열', '스물', '서른', '마흔', '쉰', '예순', '일흔', '여든', '아흔'];

export function sino(n) {
  if (n === 0) return '영';
  const chunk = (x) => {
    let s = '';
    const units = [1000, 100, 10, 1];
    for (let i = 0; i < 4; i++) {
      const d = Math.floor(x / units[i]) % 10;
      if (!d) continue;
      const unit = SMALL[3 - i];
      s += (d === 1 && unit ? '' : DIG[d]) + unit;
    }
    return s;
  };
  if (n < 10000) return chunk(n);
  const man = Math.floor(n / 10000);
  const rest = n % 10000;
  return (man === 1 ? '만' : chunk(man) + '만') + chunk(rest);
}

export function native(n) {
  if (n < 1 || n > 99) return '';
  return NAT_TENS[Math.floor(n / 10)] + NAT_ONES[n % 10];
}

/** Short form used before a counter. 20 alone is 스무; 21 is 스물한. */
export function nativeCounter(n) {
  const tens = Math.floor(n / 10);
  const ones = n % 10;
  const short = { 1: '한', 2: '두', 3: '세', 4: '네' };
  if (n === 20) return '스무';
  const head = NAT_TENS[tens];
  if (short[ones]) return head + short[ones];
  return native(n);
}

function card(partial) {
  return { kind: 'reveal', ...partial };
}

function explain(partial) {
  return { kind: 'explain', ...partial };
}

function choice(partial) {
  return { kind: 'choice', ...partial };
}

function morph(id, prompt, parts, note, speak) {
  const answer = parts.map(p => p.t).join('');
  return card({
    id, prompt, answer, morphs: parts, note,
    speak: speak || answer.replace(/\s+/g, ' ').trim(),
    group: 'Conjugation',
  });
}

const S = (t) => ({ t, k: 'stem' });
const E = (t) => ({ t, k: 'end' });
const T = (t) => ({ t, k: 'tense' });
const N = (t) => ({ t, k: 'neg' });

function pronouns() {
  const g = 'Pronouns';
  const cards = [
    card({ id: 'p-jeo', group: g, register: 'polite', prompt: 'I / me', answer: '저', speak: '저', note: 'Humble “I”. Use it with people you are not close to, and with strangers.' }),
    card({ id: 'p-na', group: g, register: 'casual', prompt: 'I / me', answer: '나', speak: '나', note: 'Casual “I”. Fine with close friends. Too blunt for a teacher or a stranger.' }),
    card({ id: 'p-je', group: g, register: 'polite', prompt: 'my', answer: '제', speak: '제', note: '저의 contracts to 제. 제 이름 is “my name” in polite speech.' }),
    card({ id: 'p-nae', group: g, register: 'casual', prompt: 'my', answer: '내', speak: '내', note: '나의 contracts to 내. Family and school often use 우리 instead. See the 우리 card.' }),
    card({ id: 'p-dangsin', group: g, register: 'polite', prompt: 'you', answer: '당신', speak: '당신', note: 'Koreans rarely say 당신 to someone’s face. It can sound cold, or oddly intimate. Use the person’s name plus 씨, or a title.' }),
    card({ id: 'p-neo', group: g, register: 'casual', prompt: 'you', answer: '너', speak: '너', note: 'Casual “you”. Only with close friends or children. With anyone else it is rude.' }),
    card({ id: 'p-ssi', group: g, register: 'polite', prompt: 'you (preferred: name + 씨)', answer: '민수 씨', speak: '민수 씨', note: 'Name + 씨 is the normal way to say “you”. 민수 씨, 커피 드실래요?' }),
    card({ id: 'p-title', group: g, register: 'polite', prompt: 'you (a title)', answer: '선생님', speak: '선생님', note: 'Titles replace “you”: 선생님 teacher, 사장님 boss, 고객님 customer.' }),
    card({ id: 'p-geu', group: g, register: 'written', prompt: 'he', answer: '그', speak: '그', note: 'Mostly written. In speech, use the name or 그 사람.' }),
    card({ id: 'p-geunyeo', group: g, register: 'written', prompt: 'she', answer: '그녀', speak: '그녀', note: 'Mostly written. In speech, use the name or 그 여자 / 그 사람.' }),
    card({ id: 'p-person', group: g, register: 'polite', prompt: 'that person (spoken “he/she”)', answer: '그 사람', speak: '그 사람', note: 'The ordinary spoken way to point at someone already in the conversation.' }),
    card({ id: 'p-jeohui', group: g, register: 'polite', prompt: 'we (humble, excluding the listener)', answer: '저희', speak: '저희', note: '저희 lowers your own side. 저희 회사 is “our company” when talking to a customer.' }),
    card({ id: 'p-uri', group: g, register: 'both', prompt: 'we', answer: '우리', speak: '우리', note: 'Can include the listener. Also the normal word for “my” with family, school, and country.' }),
    card({ id: 'p-deul', group: g, register: 'written', prompt: 'they', answer: '그들', speak: '그들', note: 'Mostly written. Speech uses the names, or 그 사람들.' }),
    card({ id: 'p-i', group: g, register: 'both', prompt: 'this (near me)', answer: '이', speak: '이', note: '이 sits in front of a noun: 이 책 this book.' }),
    card({ id: 'p-igeot', group: g, register: 'polite', prompt: 'this thing', answer: '이것', speak: '이것', note: '이 + 것. Casual speech says 이거.' }),
    card({ id: 'p-igeo', group: g, register: 'casual', prompt: 'this thing', answer: '이거', speak: '이거', note: 'Casual form of 이것.' }),
    card({ id: 'p-geu-that', group: g, register: 'both', prompt: 'that (near you)', answer: '그', speak: '그', note: '그 책 is “that book” near the listener. Same syllable as written “he”.' }),
    card({ id: 'p-geugeot', group: g, register: 'polite', prompt: 'that thing', answer: '그것', speak: '그것', note: '그 + 것. Casual speech says 그거.' }),
    card({ id: 'p-jeo-there', group: g, register: 'both', prompt: 'that over there', answer: '저', speak: '저', note: 'Same shape as polite “I”. 저 책 is “that book over there”. Context tells them apart.' }),
    card({ id: 'p-jeogeot', group: g, register: 'polite', prompt: 'that thing over there', answer: '저것', speak: '저것', note: '저 + 것. Casual speech says 저거.' }),
    card({ id: 'p-q-nugu', group: 'Question words', register: 'both', prompt: 'who', answer: '누구', speak: '누구', note: '누구예요? Who is it? The subject is often dropped.' }),
    card({ id: 'p-q-mwo', group: 'Question words', register: 'casual', prompt: 'what', answer: '뭐', speak: '뭐', note: 'Casual 뭐. Polite 무엇. 뭐 먹어요? What are you eating?' }),
    card({ id: 'p-q-eodi', group: 'Question words', register: 'both', prompt: 'where', answer: '어디', speak: '어디', note: '어디 가요? Where are you going? “You” is not said.' }),
    card({ id: 'p-q-eonje', group: 'Question words', register: 'both', prompt: 'when', answer: '언제', speak: '언제', note: '언제 만나요? When shall we meet?' }),
    explain({
      id: 'p-ex-drop',
      group: 'When do I need a pronoun?',
      prompt: 'When do I need a pronoun? Dropping',
      answer: '배고파요',
      speak: '배고파요',
      note: 'Korean omits subjects and objects when they are clear. 배고파요 means “I’m hungry”. 어디 가요? means “Where are you going?” The listener fills in who.',
    }),
    explain({
      id: 'p-ex-use',
      group: 'When do I need a pronoun?',
      prompt: 'When do I need a pronoun? Use one',
      answer: '저는 민수예요',
      speak: '저는 민수예요',
      note: 'Use a pronoun or a name for contrast (저는 커피를 안 마셔요), to introduce yourself (저는 민수예요), or when the listener could not guess who you mean. 는 marks that contrast.',
    }),
    explain({
      id: 'p-ex-uri',
      group: 'When do I need a pronoun?',
      prompt: 'When do I need a pronoun? 우리 for “my”',
      answer: '우리 엄마',
      speak: '우리 엄마',
      note: '우리 is the normal “my” for family, school, and country: 우리 엄마, 우리 학교, 우리나라. 제 엄마 sounds distant.',
    }),
    choice({
      id: 'p-q1', group: 'Would a Korean include the pronoun?',
      prompt: 'You tell a friend you are hungry. Include the pronoun?',
      choices: ['Drop it', 'Include it'], correct: 'Drop it', answer: '배고파요', speak: '배고파요',
      note: 'Drop it. 배고파요. You are obviously talking about yourself.',
    }),
    choice({
      id: 'p-q2', group: 'Would a Korean include the pronoun?',
      prompt: 'They are putting on a coat. You ask where they are going. Include the pronoun?',
      choices: ['Drop it', 'Include it'], correct: 'Drop it', answer: '어디 가요?', speak: '어디 가요?',
      note: 'Drop it. 어디 가요? “You” is the listener, so it is not said.',
    }),
    choice({
      id: 'p-q3', group: 'Would a Korean include the pronoun?',
      prompt: 'You introduce yourself to a class. Include the pronoun?',
      choices: ['Drop it', 'Include it'], correct: 'Include it', answer: '저는 민수예요', speak: '저는 민수예요',
      note: 'Include it. 저는 민수예요. A new topic needs to be named.',
    }),
    choice({
      id: 'p-q4', group: 'Would a Korean include the pronoun?',
      prompt: 'You drink tea, but Minsoo drinks coffee. Include the pronoun?',
      choices: ['Drop it', 'Include it'], correct: 'Include it', answer: '저는 차를 마셔요', speak: '저는 차를 마셔요',
      note: 'Include it, with 는, because you are contrasting two people. 저는 차를 마셔요. 민수는 커피를 마셔요.',
    }),
    choice({
      id: 'p-q5', group: 'Would a Korean include the pronoun?',
      prompt: 'You mention your mom. Which “my”?',
      choices: ['우리', '제'], correct: '우리', answer: '우리 엄마', speak: '우리 엄마',
      note: '우리 엄마. Family takes 우리, not 제, even when you mean “my”.',
    }),
    choice({
      id: 'p-q6', group: 'Would a Korean include the pronoun?',
      prompt: 'Several plans are in the air, and you clarify that you yourself are going. Include the pronoun?',
      choices: ['Drop it', 'Include it'], correct: 'Include it', answer: '저는 가요', speak: '저는 가요',
      note: 'Include it. 저는 가요. 는 puts the contrast on you.',
    }),
  ];
  return { id: 'pronouns', title: 'Pronouns', blurb: '저/나, when to drop them, and 우리', cards };
}

const VERB_MEANINGS = [
  ['가다', 'go'], ['오다', 'come'], ['먹다', 'eat'], ['마시다', 'drink'], ['하다', 'do'],
  ['공부하다', 'study'], ['보다', 'see / watch'], ['자다', 'sleep'], ['읽다', 'read'],
  ['쓰다', 'write / use'], ['듣다', 'listen / hear'], ['말하다', 'speak'], ['좋아하다', 'like'],
  ['있다', 'exist / have'], ['없다', 'not exist / not have'], ['이다', 'be (a noun)'],
  ['알다', 'know'], ['모르다', 'not know'], ['만나다', 'meet'], ['사다', 'buy'],
  ['일하다', 'work'], ['가르치다', 'teach'], ['배우다', 'learn'], ['살다', 'live'],
  ['앉다', 'sit'], ['주다', 'give'], ['기다리다', 'wait'], ['일어나다', 'get up'],
  ['입다', 'wear'], ['타다', 'ride'], ['만들다', 'make'], ['받다', 'receive'],
  ['열다', 'open'], ['닫다', 'close'], ['필요하다', 'need'], ['도와주다', 'help'],
  ['전화하다', 'phone'], ['걷다', 'walk'], ['생각하다', 'think'], ['팔다', 'sell'],
  ['놀다', 'hang out / play'], ['쉬다', 'rest'], ['요리하다', 'cook'],
];

function verbs() {
  const cards = VERB_MEANINGS.map(([ko, en]) => card({
    id: 'v-' + ko,
    group: 'Meanings',
    prompt: en,
    answer: ko,
    speak: ko,
    note: ko.endsWith('하다') ? '하다 verbs are “do X”. Conjugate the 하다 part: 해요, 했어요, 할 거예요.' : 'Dictionary form. Conjugation cards are next.',
  }));

  cards.push(explain({
    id: 'v-ex-present',
    group: 'Endings',
    prompt: 'Present polite: -아요 / -어요',
    answer: '가요 · 먹어요',
    speak: '가요',
    note: 'Stem vowel ㅏ or ㅗ takes -아요. Anything else takes -어요. 하다 becomes 해요. 가다 → 가요, 먹다 → 먹어요.',
  }));
  cards.push(explain({
    id: 'v-ex-past',
    group: 'Endings',
    prompt: 'Past polite: -았어요 / -었어요',
    answer: '갔어요 · 먹었어요',
    speak: '먹었어요',
    note: 'Build the 아/어 form, then add ㅆ어요. 가다 → 갔어요. 먹다 → 먹었어요.',
  }));
  cards.push(explain({
    id: 'v-ex-future',
    group: 'Endings',
    prompt: 'Future: -(으)ㄹ 거예요',
    answer: '갈 거예요 · 먹을 거예요',
    speak: '갈 거예요',
    note: 'After a vowel or ㄹ, use -ㄹ 거예요. After any other consonant, use -을 거예요.',
  }));
  cards.push(explain({
    id: 'v-ex-neg',
    group: 'Endings',
    prompt: 'Negation: 안 / -지 않아요',
    answer: '안 먹어요 · 먹지 않아요',
    speak: '안 먹어요',
    note: '안 goes right before the verb. -지 않아요 is the longer form, same meaning. 이다 does not take 안: say 아니에요. 있다’s natural negative is 없어요.',
  }));
  cards.push(explain({
    id: 'v-ex-want',
    group: 'Endings',
    prompt: 'Want: -고 싶어요',
    answer: '먹고 싶어요',
    speak: '먹고 싶어요',
    note: 'Stem + 고 싶어요. 먹다 → 먹고 싶어요. 하다 → 하고 싶어요.',
  }));
  cards.push(explain({
    id: 'v-ex-can',
    group: 'Endings',
    prompt: 'Can: -(으)ㄹ 수 있어요',
    answer: '갈 수 있어요 · 먹을 수 있어요',
    speak: '먹을 수 있어요',
    note: 'Same ㄹ/을 choice as the future. Then 수 있어요. “Cannot” is -(으)ㄹ 수 없어요.',
  }));
  cards.push(explain({
    id: 'v-ex-please',
    group: 'Endings',
    prompt: 'Please: -(으)세요',
    answer: '가세요 · 먹으세요',
    speak: '앉으세요',
    note: 'After a vowel, -세요. After a consonant, -으세요. ㄹ drops: 살다 → 사세요. The subject is left out.',
  }));

  const drills = [
    ['go-pr', 'go, present polite', [S('가'), E('요')], '가 + 아요 contracts to 가요.'],
    ['go-pa', 'go, past polite', [S('가'), T('ㅆ'), E('어요')], '갔어요.'],
    ['go-fu', 'go, future', [S('가'), T('ㄹ'), E(' 거예요')], 'Vowel stem, so -ㄹ 거예요.'],
    ['go-neg', 'go, not', [N('안 '), S('가'), E('요')], '안 sits before the verb. Longer form: 가지 않아요.'],
    ['go-want', 'want to go', [S('가'), E('고 '), T('싶'), E('어요')], 'Stem + 고 싶어요.'],
    ['go-can', 'can go', [S('가'), T('ㄹ'), E(' 수 있'), E('어요')], '갈 수 있어요.'],
    ['go-pls', 'please go', [S('가'), E('세요')], 'Vowel stem, so -세요, not -으세요.'],

    ['eat-pr', 'eat, present polite', [S('먹'), E('어요')], '먹 ends in a consonant, and the vowel is not ㅏ/ㅗ, so -어요.'],
    ['eat-pa', 'eat, past polite', [S('먹'), T('었'), E('어요')], '었 is the past ㅆ plus the 어 vowel.'],
    ['eat-fu', 'eat, future', [S('먹'), T('을'), E(' 거예요')], 'Consonant stem, so -을 거예요.'],
    ['eat-neg', 'eat, not', [S('먹'), E('지 '), N('않'), E('아요')], 'Short form: 안 먹어요. Both are correct.'],
    ['eat-want', 'want to eat', [S('먹'), E('고 '), T('싶'), E('어요')], ''],
    ['eat-can', 'can eat', [S('먹'), T('을'), E(' 수 있'), E('어요')], ''],
    ['eat-pls', 'please eat', [S('먹'), E('으세요')], 'Consonant stem, so -으세요.'],

    ['do-pr', 'do, present polite', [S('해'), E('요')], '하다 becomes 해요, not 하아요.'],
    ['do-pa', 'do, past polite', [S('했'), E('어요')], '했어요.'],
    ['do-fu', 'do, future', [S('할'), E(' 거예요')], '할 거예요.'],
    ['do-want', 'want to do', [S('하고 '), T('싶'), E('어요')], ''],
    ['do-pls', 'please do', [S('하'), E('세요')], '하세요.'],
    ['study-pr', 'study, present polite', [S('공부해'), E('요')], 'Only the 하다 part changes.'],
    ['study-fu', 'study, future', [S('공부할'), E(' 거예요')], ''],
    ['study-pls', 'please study', [S('공부하'), E('세요')], ''],

    ['drink-pr', 'drink, present polite', [S('마셔'), E('요')], '마시 + 어요 contracts to 마셔요.'],
    ['drink-pa', 'drink, past polite', [S('마셨'), E('어요')], ''],
    ['drink-pls', 'please drink', [S('마시'), E('세요')], '세요 starts with a consonant, so ㅡ does not drop. 마시세요.'],

    ['come-pr', 'come, present polite', [S('와'), E('요')], '오 + 아요 contracts to 와요.'],
    ['come-pa', 'come, past polite', [S('왔'), E('어요')], ''],
    ['come-pls', 'please come', [S('오'), E('세요')], '오세요.'],

    ['see-pr', 'see, present polite', [S('봐'), E('요')], '보 + 아요 contracts to 봐요.'],
    ['see-pa', 'see, past polite', [S('봤'), E('어요')], ''],
    ['see-fu', 'see, future', [S('볼'), E(' 거예요')], ''],

    ['read-pr', 'read, present polite', [S('읽'), E('어요')], '읽다 is regular.'],
    ['read-pa', 'read, past polite', [S('읽'), T('었'), E('어요')], ''],
    ['read-pls', 'please read', [S('읽'), E('으세요')], ''],

    ['write-pr', 'write, present polite', [S('써'), E('요')], 'ㅡ drops before 아/어. No vowel is left, so the ending is 어: 써요.'],
    ['write-pa', 'write, past polite', [S('썼'), E('어요')], ''],
    ['write-fu', 'write, future', [S('쓸'), E(' 거예요')], ''],
    ['write-pls', 'please write', [S('쓰'), E('세요')], 'Before 세요 the ㅡ stays: 쓰세요.'],

    ['listen-pr', 'listen, present polite', [S('들'), E('어요')], '듣다 is ㄷ-irregular: ㄷ becomes ㄹ before a vowel.'],
    ['listen-pa', 'listen, past polite', [S('들'), T('었'), E('어요')], ''],
    ['listen-fu', 'listen, future', [S('들'), T('을'), E(' 거예요')], ''],
    ['listen-pls', 'please listen', [S('들'), E('으세요')], '들으세요.'],

    ['live-pr', 'live, present polite', [S('살'), E('아요')], 'ㄹ stays before 아/어: 살아요.'],
    ['live-fu', 'live, future', [S('살'), E(' 거예요')], 'ㄹ + ㄹ becomes a single ㄹ: 살 거예요.'],
    ['live-pls', 'please live / please reside', [S('사'), E('세요')], 'ㄹ drops before ㅅ: 사세요.'],

    ['know-pr', 'know, present polite', [S('알아'), E('요')], '알다 keeps ㄹ before 아: 알아요.'],
    ['know-pls', 'please know / as you know…', [S('아'), E('세요')], 'ㄹ drops: 아세요.'],

    ['notknow-pr', 'not know, present polite', [S('몰라'), E('요')], '모르다 is 르-irregular: 르 + 아 becomes 라, and an extra ㄹ appears. 몰라요.'],
    ['notknow-pa', 'not know, past polite', [S('몰랐'), E('어요')], ''],
    ['notknow-fu', 'not know, future', [S('모를'), E(' 거예요')], 'Before ㄹ the 르 stays: 모를 거예요.'],

    ['give-pr', 'give, present polite', [S('줘'), E('요')], '주 + 어요 contracts to 줘요.'],
    ['give-pls', 'please give', [S('주'), E('세요')], '주세요.'],

    ['sit-pr', 'sit, present polite', [S('앉아'), E('요')], '앉다 is regular. The ㅈ is part of the stem.'],
    ['sit-pls', 'please sit', [S('앉'), E('으세요')], '앉으세요.'],

    ['be-c', 'be, after a consonant', [S('학생'), E('이에요')], '이다 after a consonant is 이에요. 학생이에요.'],
    ['be-v', 'be, after a vowel', [S('민수'), E('예요')], '이다 after a vowel is 예요. 민수예요.'],
    ['be-not', 'be, negative', [S('학생'), E('이 '), N('아니'), E('에요')], '이다 cannot take 안. Say 아니에요.'],

    ['have-pr', 'have / there is', [S('있'), E('어요')], '있어요.'],
    ['have-not', 'not have / there is not', [S('없'), E('어요')], '없어요 is the natural negative. 안 있어요 is rare.'],
  ];
  for (const [id, prompt, parts, note] of drills) {
    cards.push(morph('v-' + id, prompt, parts, note));
  }

  cards.push(explain({
    id: 'v-ex-b',
    group: 'Irregulars',
    prompt: 'ㅂ irregular',
    answer: '더워요',
    speak: '더워요',
    note: 'Before a vowel, ㅂ becomes 우 (덥다 → 더워요, 춥다 → 추워요). 돕다 and 곱다 become 와: 도와요. Before a consonant the ㅂ stays: 덥고, 돕지 않아요.',
  }));
  cards.push(morph('v-hot', 'hot, present polite (ㅂ irregular)', [S('더'), T('워'), E('요')], '덥다: ㅂ → 우, then 우 + 어 contracts to 워.'));
  cards.push(morph('v-help', 'help, present polite', [S('도와'), E('요')], '돕다 is the 와 type: 도와요. 도와주다 → 도와줘요.'));
  cards.push(explain({
    id: 'v-ex-d',
    group: 'Irregulars',
    prompt: 'ㄷ irregular',
    answer: '들어요',
    speak: '들어요',
    note: '듣다, 걷다, 묻다 (ask): ㄷ becomes ㄹ before a vowel. 듣다 → 들어요, 걷다 → 걸어요. 닫다 and 받다 are regular: 닫아요, 받아요.',
  }));
  cards.push(morph('v-walk', 'walk, present polite (ㄷ irregular)', [S('걸'), E('어요')], '걷다 → 걸어요.'));
  cards.push(morph('v-close', 'close, present polite (regular ㄷ)', [S('닫'), E('아요')], '닫다 is regular. Do not change ㄷ to ㄹ.'));
  cards.push(explain({
    id: 'v-ex-reu',
    group: 'Irregulars',
    prompt: '르 irregular',
    answer: '몰라요',
    speak: '몰라요',
    note: '모르다, 다르다, 빠르다, 부르다, 고르다. Before 아/어, 르 becomes ㄹ and an extra ㄹ is added: 몰라요, 달라요, 빨라요, 불러요.',
  }));
  cards.push(morph('v-diff', 'different, present polite (르 irregular)', [S('달라'), E('요')], '다르다 → 달라요.'));
  cards.push(explain({
    id: 'v-ex-eu',
    group: 'Irregulars',
    prompt: 'ㅡ drop',
    answer: '써요',
    speak: '써요',
    note: '쓰다, 크다, 바쁘다, 예쁘다. Drop ㅡ before 아/어, then pick 아 or 어 from the vowel that is left. 바쁘다 → 바빠요 (ㅏ). 예쁘다 → 예뻐요. 쓰다 and 크다 have no vowel left, so 어: 써요, 커요.',
  }));
  cards.push(morph('v-big', 'big, present polite (ㅡ drop)', [S('커'), E('요')], '크다 → 커요.'));
  cards.push(morph('v-busy', 'busy, present polite (ㅡ drop)', [S('바빠'), E('요')], '바쁘다 keeps the ㅏ: 바빠요.'));
  cards.push(explain({
    id: 'v-ex-ha',
    group: 'Irregulars',
    prompt: '하다 → 해요',
    answer: '해요',
    speak: '해요',
    note: 'Every 하다 verb does this: 공부하다 → 공부해요, 일하다 → 일해요, 좋아하다 → 좋아해요. Past 했어요, future 할 거예요, please 하세요.',
  }));
  cards.push(morph('v-like', 'like, present polite', [S('좋아해'), E('요')], '좋아하다 → 좋아해요.'));
  cards.push(morph('v-work', 'work, present polite', [S('일해'), E('요')], '일하다 → 일해요.'));
  return { id: 'verbs', title: 'Verbs', blurb: 'Starter verbs and the endings that build a sentence', cards };
}

function particles() {
  const rows = [
    ['은/는', 'topic', '민수는 학생이에요', '은 after a consonant, 는 after a vowel. Marks the topic, often contrast. 민수는 학생이에요.'],
    ['이/가', 'subject', '비가 와요', '이 after a consonant, 가 after a vowel. Marks the grammatical subject. 비가 와요.'],
    ['을/를', 'object', '물을 마셔요', '을 after a consonant, 를 after a vowel. Marks the object. 물을 마셔요.'],
    ['에', 'to / at / in (time or place)', '학교에 가요', 'Destination, location of something, or a time. 학교에 가요. 월요일에.'],
    ['에서', 'at / from (action)', '학교에서 공부해요', 'Where an action happens, or the start of a movement. 학교에서 공부해요.'],
    ['도', 'also / too', '저도 가요', 'Replaces 은/는, 이/가, or 을/를. 저도 가요. I am going too.'],
    ['의', 'of / ’s', '민수의 책', 'Possessive. Often pronounced [e]. In casual speech it is frequently dropped: 민수 책.'],
    ['와/과', 'and', '빵과 물', '과 after a consonant, 와 after a vowel. 빵과 물. 커피와 차.'],
    ['하고', 'and / with', '친구하고 만나요', 'Same job as 와/과, a little more spoken. 친구하고 만나요.'],
    ['(으)로', 'by / toward / with', '버스로 가요', '로 after a vowel or ㄹ, 으로 after any other consonant. Means, direction, or tool. 버스로 가요. 오른쪽으로.'],
  ];
  const cards = rows.map(([ko, en, ex, note], i) => card({
    id: 'pt-' + i,
    group: 'Particles',
    prompt: en,
    answer: ko,
    speak: ex,
    note: note + ' Example: ' + ex + '.',
  }));
  return { id: 'particles', title: 'Particles', blurb: '은/는, 을/를, 에, 에서, and the rest', cards };
}

function sinoDeck() {
  const ones = ['일', '이', '삼', '사', '오', '육', '칠', '팔', '구', '십'];
  const cards = ones.map((ko, i) => card({
    id: 'sn-' + (i + 1),
    group: '1 to 10',
    prompt: String(i + 1),
    answer: ko,
    speak: ko,
    note: 'Sino-Korean. Used for minutes, dates, money, phone numbers, floors.',
  }));
  [20, 30, 40, 50, 60, 70, 80, 90].forEach(n => {
    cards.push(card({
      id: 'sn-t-' + n, group: 'Tens', prompt: String(n), answer: sino(n), speak: sino(n),
      note: 'Tens are digit + 십. 20 is 이십, not 이십일.',
    }));
  });
  const samples = [15, 42, 100, 101, 110, 250, 1000, 2024, 10000, 35000];
  for (const n of samples) {
    cards.push(card({
      id: 'sn-s-' + n, group: '백, 천, 만', prompt: n.toLocaleString('en-US'), answer: sino(n), speak: sino(n),
      note: n === 100 ? '100 is 백, not 일백.' : n === 1000 ? '1,000 is 천, not 일천.' : n === 10000 ? '10,000 is 만, not 일만. Korean groups by 10,000, not 1,000.' : 'Read the digits with 십, 백, 천, 만. Skip zeros.',
    }));
  }
  return { id: 'sino', title: 'Numbers, Sino-Korean', blurb: '일 to 만, plus random drills', cards, random: 'sino' };
}

function nativeDeck() {
  const cards = [];
  for (let n = 1; n <= 10; n++) {
    cards.push(card({
      id: 'nn-' + n, group: '1 to 10', prompt: String(n), answer: native(n), speak: native(n),
      note: 'Native Korean. Used for counting things, people, age, and hours.',
    }));
  }
  [20, 30, 40, 50, 60, 70, 80, 90, 99].forEach(n => {
    cards.push(card({
      id: 'nn-t-' + n, group: 'Tens', prompt: String(n), answer: native(n), speak: native(n),
      note: n === 99 ? '아흔아홉 is 99, the top of this set. Hours and age stay inside 1–99.' : 'Native tens: 스물, 서른, 마흔, 쉰, 예순, 일흔, 여든, 아흔.',
    }));
  });
  cards.push(card({ id: 'nn-11', group: 'Tens', prompt: '11', answer: '열하나', speak: '열하나', note: '열 + 하나. There is no “열한” until a counter is added.' }));
  cards.push(card({ id: 'nn-25', group: 'Tens', prompt: '25', answer: '스물다섯', speak: '스물다섯', note: '스물 + 다섯. Age: 스물다섯 살.' }));
  const shorts = [
    [1, '한', '하나 becomes 한 before a counter. 한 명, 한 시.'],
    [2, '두', '둘 becomes 두. 두 개, 두 명.'],
    [3, '세', '셋 becomes 세. 세 시, 세 병.'],
    [4, '네', '넷 becomes 네. 네 권.'],
    [20, '스무', '스물 becomes 스무 only for exactly 20. 스무 살. 21 stays 스물한 살.'],
  ];
  for (const [n, ko, note] of shorts) {
    cards.push(card({
      id: 'nn-c-' + n, group: 'Before a counter', prompt: n + ' (before a counter)', answer: ko, speak: ko, note,
    }));
  }
  return { id: 'native', title: 'Numbers, Native Korean', blurb: '하나 to 아흔아홉, and 한/두/세/네/스무', cards, random: 'native' };
}

function systems() {
  const prompts = [
    ['3 o’clock', 'native', '세 시', 'Hours use native numbers, and the short form. 세 시, not 삼 시.'],
    ['30 minutes', 'sino', '삼십 분', 'Minutes are Sino-Korean. 삼십 분. 분 here means minutes.'],
    ['5 bottles of water', 'native', '물 다섯 병', 'Counting bottles uses native numbers. 5 does not shorten. 물 다섯 병.'],
    ['25 years old', 'native', '스물다섯 살', 'Age uses native numbers plus 살. 스물다섯 살.'],
    ['March', 'sino', '삼월', 'Months are Sino-Korean. March is 삼월, not 세 월.'],
    ['10,000 won', 'sino', '만 원', 'Money is Sino-Korean. 10,000 is 만. 만 원.'],
    ['room 302', 'sino', '삼백이 호', 'Room numbers are Sino-Korean. 삼백이 호.'],
    ['second floor', 'sino', '이 층', 'Floors are Sino-Korean. 이 층. First floor is 일 층.'],
    ['three people', 'native', '세 명', 'People use native numbers. 셋 shortens to 세. 세 명.'],
    ['7th day', 'sino', '칠 일', 'Dates use Sino-Korean. The 7th is 칠 일.'],
    ['2 cups of coffee', 'native', '커피 두 잔', '잔 is a cup or glass. 둘 shortens to 두. 커피 두 잔.'],
    ['4 books', 'native', '책 네 권', '권 counts books. 넷 shortens to 네. 책 네 권.'],
    ['1 dog', 'native', '개 한 마리', '마리 counts animals. 하나 shortens to 한. 개 한 마리.'],
    ['one time', 'native', '한 번', '번 counts occurrences. 한 번, 두 번.'],
    ['3 sheets of paper', 'native', '종이 세 장', '장 counts flat things: paper, tickets, sheets.'],
    ['2 things', 'native', '두 개', '개 is the generic counter for objects.'],
    ['3 teachers (honorific)', 'native', '선생님 세 분', '분 is the honorific counter for people. Still a native number. Not the 분 of minutes.'],
    ['2 years (duration)', 'sino', '이 년', 'Years of duration are Sino-Korean: 이 년. Age is different: 두 살.'],
  ];
  const cards = [
    explain({
      id: 'sys-rule',
      group: 'Rule',
      prompt: 'Which number system?',
      answer: '하나 · 일',
      speak: '하나',
      note: 'Native numbers count things, people, age, and hours. Sino numbers are for minutes, dates, months, money, phone numbers, floors, room numbers, and measurements. Before counters, 하나/둘/셋/넷/스물 shorten to 한/두/세/네/스무. Counters: 개 things, 명 people, 분 people (honorific), 살 age, 시 hours, 분 minutes, 병 bottles, 잔 cups, 권 books, 장 sheets, 마리 animals, 번 times, 층 floors, 원 won, 월 months, 일 days, 년 years.',
    }),
  ];
  prompts.forEach((row, i) => {
    const [prompt, system, answer, note] = row;
    cards.push({
      id: 'sys-' + i,
      kind: 'system',
      group: 'Trainer',
      prompt,
      system,
      answer,
      speak: answer,
      note,
    });
  });
  const counters = [
    ['개', 'things', '사과 세 개', 'Generic counter. Native number.'],
    ['명', 'people', '친구 두 명', 'Neutral people counter. Native number.'],
    ['분', 'people (honorific)', '선생님 세 분', 'Honorific people. Same syllable as “minute”, different job. Native number.'],
    ['살', 'years of age', '스물다섯 살', 'Age. Native number.'],
    ['시', 'o’clock', '세 시', 'Hours. Native number, short forms.'],
    ['분', 'minutes', '삼십 분', 'Minutes. Sino-Korean number.'],
    ['병', 'bottles', '물 다섯 병', 'Native number.'],
    ['잔', 'cups / glasses', '커피 두 잔', 'Native number.'],
    ['권', 'books', '책 네 권', 'Native number.'],
    ['장', 'sheets / tickets', '종이 세 장', 'Native number.'],
    ['마리', 'animals', '개 한 마리', 'Native number.'],
    ['번', 'times', '한 번', 'Native number.'],
    ['층', 'floors', '이 층', 'Sino-Korean number.'],
    ['원', 'won', '만 원', 'Sino-Korean number.'],
    ['월', 'months (names)', '삼월', 'Sino-Korean. March is 삼월. June and October are irregular: 유월, 시월.'],
    ['일', 'days of the month', '칠 일', 'Sino-Korean. The 7th is 칠 일.'],
    ['년', 'years (duration or a calendar year)', '이 년', 'Sino-Korean. Two years is 이 년. “Two years old” is 두 살.'],
  ];
  counters.forEach((row, i) => {
    cards.push(card({
      id: 'ctr-' + i,
      group: 'Counters',
      prompt: 'counter: ' + row[1],
      answer: row[0],
      speak: row[2],
      note: row[3] + ' Example: ' + row[2] + '.',
    }));
  });
  return { id: 'systems', title: 'Which number system?', blurb: 'Sino or native, then the full phrase', cards };
}

const COLORS = [
  ['빨간색', 'red', '#dc2626', '빨간', '빨개요', '빨갛다. Attributive 빨간 사과. Predicative 빨개요.'],
  ['주황색', 'orange', '#f97316', '', '', 'Noun. 주황색 셔츠, or 주황색이에요. No 빨간-style adjective.'],
  ['노란색', 'yellow', '#facc15', '노란', '노래요', '노랗다. 노란 바나나. 노래요.'],
  ['초록색', 'green', '#16a34a', '', '', 'Noun. 초록색 펜, or 초록색이에요.'],
  ['파란색', 'blue', '#2563eb', '파란', '파래요', '파랗다. 파란 하늘. 파래요. 파란색 is the noun.'],
  ['남색', 'navy', '#1e3a8a', '', '', 'Noun. 남색 재킷. Dark blue.'],
  ['보라색', 'purple', '#7c3aed', '', '', 'Noun. 보라색 꽃, or 보라색이에요.'],
  ['분홍색', 'pink', '#f9a8d4', '', '', 'Noun. 분홍색 꽃.'],
  ['검은색', 'black', '#111827', '까만', '까매요', '까맣다. 까만 고양이. 까매요. 검은색 is the noun.'],
  ['흰색', 'white', '#f8fafc', '하얀', '하얘요', '하얗다. 하얀 셔츠. 하얘요. 흰색 is the noun.'],
  ['회색', 'gray', '#6b7280', '', '', 'Noun. 회색 하늘.'],
  ['갈색', 'brown', '#92400e', '', '', 'Noun. 갈색 머리.'],
];

function colors() {
  const cards = COLORS.map((row, i) => {
    const [noun, en, swatch, attr, pred, note] = row;
    const answer = attr ? `${noun} · ${attr} · ${pred}` : noun;
    return card({
      id: 'c-' + i,
      group: 'Colors',
      prompt: en,
      answer,
      speak: noun,
      swatch,
      note,
    });
  });
  return { id: 'colors', title: 'Colors', blurb: 'Nouns plus 빨간 / 빨개요 where they exist', cards };
}

function calendar() {
  const days = [
    ['월요일', 'Monday', '월 means moon.'],
    ['화요일', 'Tuesday', '화 means fire.'],
    ['수요일', 'Wednesday', '수 means water.'],
    ['목요일', 'Thursday', '목 means wood.'],
    ['금요일', 'Friday', '금 means metal or gold.'],
    ['토요일', 'Saturday', '토 means earth or soil.'],
    ['일요일', 'Sunday', '일 means sun.'],
  ];
  const months = [
    ['일월', 'January', '1월. Also written 1월.'],
    ['이월', 'February', '2월.'],
    ['삼월', 'March', '3월.'],
    ['사월', 'April', '4월.'],
    ['오월', 'May', '5월.'],
    ['유월', 'June', 'Not 육월. 육 changes to 유 before 월.'],
    ['칠월', 'July', '7월.'],
    ['팔월', 'August', '8월.'],
    ['구월', 'September', '9월.'],
    ['시월', 'October', 'Not 십월. 십 changes to 시 before 월.'],
    ['십일월', 'November', '11월.'],
    ['십이월', 'December', '12월.'],
  ];
  const cards = [
    explain({
      id: 'cal-days',
      group: 'Days',
      prompt: 'Days of the week, the element hint',
      answer: '월요일',
      speak: '월요일',
      note: '월 moon, 화 fire, 수 water, 목 wood, 금 metal, 토 earth, 일 sun. Each day is element + 요일.',
    }),
  ];
  days.forEach((row, i) => cards.push(card({
    id: 'day-' + i, group: 'Days', prompt: row[1], answer: row[0], speak: row[0], note: row[2] + ' 요일 means “day of the week”.',
  })));
  cards.push(explain({
    id: 'cal-months',
    group: 'Months',
    prompt: 'Months, and two irregulars',
    answer: '유월 · 시월',
    speak: '유월',
    note: 'Months are Sino-Korean digit + 월. June is 유월, not 육월. October is 시월, not 십월. The others are regular: 일월 through 오월, 칠월, 팔월, 구월, 십일월, 십이월.',
  }));
  months.forEach((row, i) => cards.push(card({
    id: 'mon-' + i, group: 'Months', prompt: row[1], answer: row[0], speak: row[0], note: row[2],
  })));
  return { id: 'calendar', title: 'Days and months', blurb: '월요일 to 일요일, 일월 to 십이월', cards };
}

function timeWords() {
  const rows = [
    ['오늘', 'today'], ['어제', 'yesterday'], ['내일', 'tomorrow'], ['모레', 'the day after tomorrow'],
    ['그저께', 'the day before yesterday'], ['주', 'week'], ['이번 주', 'this week'], ['지난주', 'last week'],
    ['다음 주', 'next week'], ['주말', 'weekend'], ['평일', 'weekday'], ['달', 'month (native word)'],
    ['월', 'month (Sino-Korean word)'], ['이번 달', 'this month'], ['지난달', 'last month'], ['다음 달', 'next month'],
    ['년', 'year (Sino-Korean)'], ['해', 'year (native)'], ['올해', 'this year'], ['작년', 'last year'],
    ['내년', 'next year'], ['아침', 'morning'], ['점심', 'lunch / noon'], ['저녁', 'evening'],
    ['밤', 'night'], ['오전', 'a.m. / morning (clock)'], ['오후', 'p.m. / afternoon (clock)'],
    ['지금', 'now'], ['나중에', 'later'], ['날', 'day'], ['시간', 'hour / time'],
    ['분', 'minute'], ['초', 'second'],
  ];
  const cards = rows.map((row, i) => card({
    id: 'tm-' + i, group: 'Time words', prompt: row[1], answer: row[0], speak: row[0],
    note: row[0] === '달' ? '달 is the native word. 월 is the Sino-Korean word used in month names.' : row[0] === '해' ? '해 is the native word. 년 is Sino-Korean, used in 작년 and 내년.' : '',
  }));
  cards.push(card({
    id: 'tm-clock',
    group: 'Telling time',
    prompt: '3:30 p.m.',
    answer: '오후 세 시 삼십 분',
    speak: '오후 세 시 삼십 분',
    note: 'Hours are native (세 시). Minutes are Sino (삼십 분). 오후 is p.m. 오전 is a.m.',
  }));
  cards.push(card({
    id: 'tm-am',
    group: 'Telling time',
    prompt: '9:05 a.m.',
    answer: '오전 아홉 시 오 분',
    speak: '오전 아홉 시 오 분',
    note: '아홉 does not shorten before 시 (only 1–4 and 20 do). Minutes stay Sino: 오 분.',
  }));
  return { id: 'time', title: 'Time words', blurb: '오늘, 어제, 내일, and telling the time', cards };
}

function randomSinoCards(count = 8) {
  const cards = [];
  const used = new Set();
  while (cards.length < count) {
    const n = 1 + Math.floor(Math.random() * 99999);
    if (used.has(n)) continue;
    used.add(n);
    const answer = sino(n);
    const distractors = new Set([answer]);
    const nearby = [n + 1, Math.max(1, n - 1), n + 10, Math.abs(n - 100) || 11];
    for (const d of nearby) {
      if (d >= 1 && d <= 99999) distractors.add(sino(d));
    }
    if (n <= 99) distractors.add(native(n));
    const choices = [...distractors].slice(0, 4);
    while (choices.length < 4) choices.push(sino(1 + Math.floor(Math.random() * 999)));
    cards.push(choice({
      id: 'sn-r-' + n,
      group: 'Random drill',
      prompt: n.toLocaleString('en-US'),
      choices: shuffle(choices),
      correct: answer,
      answer,
      speak: answer,
      note: 'Sino-Korean reading of ' + n.toLocaleString('en-US') + '.',
    }));
  }
  return cards;
}

function randomNativeCards(count = 8) {
  const cards = [];
  const used = new Set();
  while (cards.length < count) {
    const n = 1 + Math.floor(Math.random() * 99);
    if (used.has(n)) continue;
    used.add(n);
    const answer = native(n);
    const opts = new Set([answer, nativeCounter(n) === answer ? native(Math.max(1, n - 1)) : nativeCounter(n)]);
    opts.add(sino(n));
    opts.add(native(n === 99 ? 1 : n + 1));
    const choices = [...opts].slice(0, 4);
    cards.push(choice({
      id: 'nn-r-' + n,
      group: 'Random drill',
      prompt: String(n),
      choices: shuffle(choices),
      correct: answer,
      answer,
      speak: answer,
      note: 'Native Korean counting form, not the counter short form.',
    }));
  }
  return cards;
}

function shuffle(list) {
  const arr = list.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const BUILDERS = [
  pronouns, verbs, particles, sinoDeck, nativeDeck, systems, colors, calendar, timeWords,
];

export function listDecks() {
  const decks = BUILDERS.map(fn => fn());
  decks.push({
    id: 'builder',
    title: 'Sentence builder',
    blurb: 'Drag tiles into Korean SOV order',
    cards: [],
    launch: 'syntax',
  });
  return decks;
}

export function getDeck(id) {
  const deck = listDecks().find(d => d.id === id);
  if (!deck) return null;
  if (deck.random === 'sino') return { ...deck, cards: deck.cards.concat(randomSinoCards()) };
  if (deck.random === 'native') return { ...deck, cards: deck.cards.concat(randomNativeCards()) };
  return deck;
}

export { shuffle };
