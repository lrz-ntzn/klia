#!/usr/bin/env python3
"""Generate verified Korean learning content."""
import json, os, re
from pathlib import Path

OUT = Path("/workspace/korean-app/data")
OUT.mkdir(parents=True, exist_ok=True)

# ========== HANGUL ==========
CONSONANTS = [
  {"id":"c-g","char":"ㄱ","name":"giyeok","romaja":"g/k","ipa":"[k]","note":"Lax velar stop. Word-initially [k], between vowels often [ɡ], coda [k̚].","type":"consonant","batch":1},
  {"id":"c-n","char":"ㄴ","name":"nieun","romaja":"n","ipa":"[n]","note":"Alveolar nasal.","type":"consonant","batch":1},
  {"id":"c-d","char":"ㄷ","name":"digeut","romaja":"d/t","ipa":"[t]","note":"Lax alveolar stop. Init [t], voiced [d] intervocalic, coda [t̚].","type":"consonant","batch":1},
  {"id":"c-r","char":"ㄹ","name":"rieul","romaja":"r/l","ipa":"[ɾ~l]","note":"Flap [ɾ] between vowels; [l] in coda or geminate.","type":"consonant","batch":1},
  {"id":"c-m","char":"ㅁ","name":"mieum","romaja":"m","ipa":"[m]","note":"Bilabial nasal.","type":"consonant","batch":1},
  {"id":"c-b","char":"ㅂ","name":"bieup","romaja":"b/p","ipa":"[p]","note":"Lax bilabial stop. Init [p], voiced [b] intervocalic, coda [p̚].","type":"consonant","batch":1},
  {"id":"c-s","char":"ㅅ","name":"siot","romaja":"s","ipa":"[s]","note":"Alveolar fricative. Before /i,j/ often [ɕ]. Coda [t̚].","type":"consonant","batch":1},
  {"id":"c-ng","char":"ㅇ","name":"ieung","romaja":"∅/ng","ipa":"[ŋ]/∅]","note":"Null onset in initial position; velar nasal [ŋ] in coda.","type":"consonant","batch":1},
  {"id":"c-j","char":"ㅈ","name":"jieut","romaja":"j","ipa":"[tɕ]","note":"Lax alveolo-palatal affricate.","type":"consonant","batch":1},
  {"id":"c-h","char":"ㅎ","name":"hieut","romaja":"h","ipa":"[h]","note":"Glottal fricative. Often weakens or deletes intervocalically.","type":"consonant","batch":1},
  {"id":"c-k","char":"ㅋ","name":"kieuk","romaja":"k","ipa":"[kʰ]","note":"Aspirated velar stop.","type":"consonant","batch":2},
  {"id":"c-t","char":"ㅌ","name":"tieut","romaja":"t","ipa":"[tʰ]","note":"Aspirated alveolar stop.","type":"consonant","batch":2},
  {"id":"c-p","char":"ㅍ","name":"pieup","romaja":"p","ipa":"[pʰ]","note":"Aspirated bilabial stop.","type":"consonant","batch":2},
  {"id":"c-ch","char":"ㅊ","name":"chieut","romaja":"ch","ipa":"[tɕʰ]","note":"Aspirated alveolo-palatal affricate.","type":"consonant","batch":2},
  {"id":"c-kk","char":"ㄲ","name":"ssang-giyeok","romaja":"kk","ipa":"[k͈]","note":"Tense (fortis) velar stop. Higher F0, no aspiration.","type":"consonant","batch":2},
  {"id":"c-tt","char":"ㄸ","name":"ssang-digeut","romaja":"tt","ipa":"[t͈]","note":"Tense alveolar stop.","type":"consonant","batch":2},
  {"id":"c-pp","char":"ㅃ","name":"ssang-bieup","romaja":"pp","ipa":"[p͈]","note":"Tense bilabial stop.","type":"consonant","batch":2},
  {"id":"c-ss","char":"ㅆ","name":"ssang-siot","romaja":"ss","ipa":"[s͈]","note":"Tense alveolar fricative.","type":"consonant","batch":2},
  {"id":"c-jj","char":"ㅉ","name":"ssang-jieut","romaja":"jj","ipa":"[tɕ͈]","note":"Tense alveolo-palatal affricate.","type":"consonant","batch":2},
]

VOWELS = [
  {"id":"v-a","char":"ㅏ","name":"a","romaja":"a","ipa":"[a]","note":"Open front/central unrounded.","type":"vowel","batch":1},
  {"id":"v-ya","char":"ㅑ","name":"ya","romaja":"ya","ipa":"[ja]","note":"Palatal glide + a.","type":"vowel","batch":1},
  {"id":"v-eo","char":"ㅓ","name":"eo","romaja":"eo","ipa":"[ʌ]","note":"Open-mid back unrounded. Not English 'uh' exactly.","type":"vowel","batch":1},
  {"id":"v-yeo","char":"ㅕ","name":"yeo","romaja":"yeo","ipa":"[jʌ]","note":"Palatal glide + eo.","type":"vowel","batch":1},
  {"id":"v-o","char":"ㅗ","name":"o","romaja":"o","ipa":"[o]","note":"Close-mid back rounded.","type":"vowel","batch":1},
  {"id":"v-yo","char":"ㅛ","name":"yo","romaja":"yo","ipa":"[jo]","note":"Palatal glide + o.","type":"vowel","batch":1},
  {"id":"v-u","char":"ㅜ","name":"u","romaja":"u","ipa":"[u]","note":"Close back rounded.","type":"vowel","batch":1},
  {"id":"v-yu","char":"ㅠ","name":"yu","romaja":"yu","ipa":"[ju]","note":"Palatal glide + u.","type":"vowel","batch":1},
  {"id":"v-eu","char":"ㅡ","name":"eu","romaja":"eu","ipa":"[ɯ]","note":"Close back unrounded. No English equivalent; lips unrounded, tongue high back.","type":"vowel","batch":1},
  {"id":"v-i","char":"ㅣ","name":"i","romaja":"i","ipa":"[i]","note":"Close front unrounded.","type":"vowel","batch":1},
  {"id":"v-ae","char":"ㅐ","name":"ae","romaja":"ae","ipa":"[ɛ]","note":"Open-mid front. Merging with ㅔ for many speakers.","type":"vowel","batch":2},
  {"id":"v-e","char":"ㅔ","name":"e","romaja":"e","ipa":"[e]","note":"Close-mid front. Often merged with ㅐ.","type":"vowel","batch":2},
  {"id":"v-yae","char":"ㅒ","name":"yae","romaja":"yae","ipa":"[jɛ]","note":"Palatal glide + ae. Rare.","type":"vowel","batch":2},
  {"id":"v-ye","char":"ㅖ","name":"ye","romaja":"ye","ipa":"[je]","note":"Palatal glide + e.","type":"vowel","batch":2},
  {"id":"v-wa","char":"ㅘ","name":"wa","romaja":"wa","ipa":"[wa]","note":"Labial-velar glide + a (ㅗ+ㅏ).","type":"vowel","batch":2},
  {"id":"v-wae","char":"ㅙ","name":"wae","romaja":"wae","ipa":"[wɛ]","note":"Labial-velar glide + ae.","type":"vowel","batch":2},
  {"id":"v-oe","char":"ㅚ","name":"oe","romaja":"oe","ipa":"[we]~[ø]","note":"Historically [ø]; modern Seoul often [we].","type":"vowel","batch":2},
  {"id":"v-wo","char":"ㅝ","name":"wo","romaja":"wo","ipa":"[wʌ]","note":"Labial-velar glide + eo (ㅜ+ㅓ).","type":"vowel","batch":2},
  {"id":"v-we","char":"ㅞ","name":"we","romaja":"we","ipa":"[we]","note":"Labial-velar glide + e.","type":"vowel","batch":2},
  {"id":"v-wi","char":"ㅟ","name":"wi","romaja":"wi","ipa":"[wi]","note":"Labial-velar glide + i.","type":"vowel","batch":2},
  {"id":"v-ui","char":"ㅢ","name":"ui","romaja":"ui","ipa":"[ɯi]","note":"Diphthong. As possessive particle often [e]; elsewhere [ɯi] or [i].","type":"vowel","batch":2},
]

# Syllable blocks for reading practice (CV, then CVC)
SYLLABLES = []
# Basic CV with ㄱㄴㄷㄹㅁㅂㅅㅇㅈㅎ + ㅏㅓㅗㅜㅡㅣ
bases_c = ["ㄱ","ㄴ","ㄷ","ㄹ","ㅁ","ㅂ","ㅅ","ㅇ","ㅈ","ㅎ","ㅋ","ㅌ","ㅍ","ㅊ","ㄲ","ㄸ","ㅃ","ㅆ","ㅉ"]
bases_v = ["ㅏ","ㅓ","ㅗ","ㅜ","ㅡ","ㅣ","ㅐ","ㅔ","ㅑ","ㅕ","ㅛ","ㅠ"]
rom_c = {"ㄱ":"g","ㄴ":"n","ㄷ":"d","ㄹ":"r","ㅁ":"m","ㅂ":"b","ㅅ":"s","ㅇ":"","ㅈ":"j","ㅎ":"h",
         "ㅋ":"k","ㅌ":"t","ㅍ":"p","ㅊ":"ch","ㄲ":"kk","ㄸ":"tt","ㅃ":"pp","ㅆ":"ss","ㅉ":"jj"}
rom_v = {"ㅏ":"a","ㅓ":"eo","ㅗ":"o","ㅜ":"u","ㅡ":"eu","ㅣ":"i","ㅐ":"ae","ㅔ":"e",
         "ㅑ":"ya","ㅕ":"yeo","ㅛ":"yo","ㅠ":"yu","ㅘ":"wa","ㅝ":"wo","ㅟ":"wi","ㅢ":"ui"}

# Hangul syllable composition
CHO = ["ㄱ","ㄲ","ㄴ","ㄷ","ㄸ","ㄹ","ㅁ","ㅂ","ㅃ","ㅅ","ㅆ","ㅇ","ㅈ","ㅉ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"]
JUNG = ["ㅏ","ㅐ","ㅑ","ㅒ","ㅓ","ㅔ","ㅕ","ㅖ","ㅗ","ㅘ","ㅙ","ㅚ","ㅛ","ㅜ","ㅝ","ㅞ","ㅟ","ㅠ","ㅡ","ㅢ","ㅣ"]
JONG = ["","ㄱ","ㄲ","ㄳ","ㄴ","ㄵ","ㄶ","ㄷ","ㄹ","ㄺ","ㄻ","ㄼ","ㄽ","ㄾ","ㄿ","ㅀ","ㅁ","ㅂ","ㅄ","ㅅ","ㅆ","ㅇ","ㅈ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"]

def compose(cho, jung, jong=""):
    return chr(0xAC00 + CHO.index(cho)*21*28 + JUNG.index(jung)*28 + JONG.index(jong))

# Generate CV syllables systematically for reading
for c in ["ㄱ","ㄴ","ㄷ","ㄹ","ㅁ","ㅂ","ㅅ","ㅇ","ㅈ","ㅎ"]:
    for v in ["ㅏ","ㅓ","ㅗ","ㅜ","ㅡ","ㅣ"]:
        ch = compose(c, v)
        SYLLABLES.append({
            "id": f"syl-{c}-{v}",
            "char": ch,
            "romaja": rom_c[c]+rom_v[v],
            "ipa": "",
            "jamo": [c, v],
            "type": "syllable",
            "batch": 3
        })

# CVC with common batchim
for c in ["ㄱ","ㄴ","ㄷ","ㅁ","ㅂ","ㅅ","ㅇ"]:
    for v in ["ㅏ","ㅓ","ㅗ","ㅜ","ㅣ"]:
        for j in ["ㄴ","ㅇ","ㄹ","ㅁ","ㅂ","ㄱ"]:
            ch = compose(c, v, j)
            jr = {"ㄴ":"n","ㅇ":"ng","ㄹ":"l","ㅁ":"m","ㅂ":"p","ㄱ":"k"}[j]
            SYLLABLES.append({
                "id": f"syl-{c}-{v}-{j}",
                "char": ch,
                "romaja": rom_c[c]+rom_v[v]+jr,
                "ipa": "",
                "jamo": [c, v, j],
                "type": "syllable",
                "batch": 4
            })

# Real words for sound-out (batch 5)
WORDS_READ = [
  {"id":"w-annyeong","char":"안녕","romaja":"annyeong","en":"hi / bye (casual)","type":"word","batch":5},
  {"id":"w-annyeonghaseyo","char":"안녕하세요","romaja":"annyeonghaseyo","en":"hello (polite)","type":"word","batch":5},
  {"id":"w-gamsahamnida","char":"감사합니다","romaja":"gamsahamnida","en":"thank you (formal)","type":"word","batch":5},
  {"id":"w-ne","char":"네","romaja":"ne","en":"yes","type":"word","batch":5},
  {"id":"w-aniyo","char":"아니요","romaja":"aniyo","en":"no","type":"word","batch":5},
  {"id":"w-mul","char":"물","romaja":"mul","en":"water","type":"word","batch":5},
  {"id":"w-bap","char":"밥","romaja":"bap","en":"rice / meal","type":"word","batch":5},
  {"id":"w-jib","char":"집","romaja":"jip","en":"house / home","type":"word","batch":5},
  {"id":"w-hakgyo","char":"학교","romaja":"hakgyo","en":"school","type":"word","batch":5},
  {"id":"w-seonsaengnim","char":"선생님","romaja":"seonsaengnim","en":"teacher","type":"word","batch":5},
  {"id":"w-haksang","char":"학생","romaja":"haksaeng","en":"student","type":"word","batch":5},
  {"id":"w-hanguk","char":"한국","romaja":"hanguk","en":"Korea","type":"word","batch":5},
  {"id":"w-jeju","char":"제주","romaja":"jeju","en":"Jeju","type":"word","batch":5},
  {"id":"w-eodi","char":"어디","romaja":"eodi","en":"where","type":"word","batch":5},
  {"id":"w-mwo","char":"뭐","romaja":"mwo","en":"what","type":"word","batch":5},
  {"id":"w-eonje","char":"언제","romaja":"eonje","en":"when","type":"word","batch":5},
  {"id":"w-nugu","char":"누구","romaja":"nugu","en":"who","type":"word","batch":5},
  {"id":"w-eotteoke","char":"어떻게","romaja":"eotteoke","en":"how","type":"word","batch":5},
  {"id":"w-why","char":"왜","romaja":"wae","en":"why","type":"word","batch":5},
  {"id":"w-jal","char":"잘","romaja":"jal","en":"well","type":"word","batch":5},
  {"id":"w-jaljayo","char":"잘 자요","romaja":"jal jayo","en":"good night","type":"word","batch":5},
  {"id":"w-annyeonghi","char":"안녕히 가세요","romaja":"annyeonghi gaseyo","en":"goodbye (to one leaving)","type":"word","batch":5},
  {"id":"w-juseyo","char":"주세요","romaja":"juseyo","en":"please give me","type":"word","batch":5},
  {"id":"w-mianhae","char":"미안해요","romaja":"mianhaeyo","en":"sorry","type":"word","batch":5},
  {"id":"w-gwaenchanayo","char":"괜찮아요","romaja":"gwaenchanayo","en":"it's okay","type":"word","batch":5},
  {"id":"w-sarang","char":"사랑","romaja":"sarang","en":"love","type":"word","batch":5},
  {"id":"w-chingu","char":"친구","romaja":"chingu","en":"friend","type":"word","batch":5},
  {"id":"w-eomeoni","char":"어머니","romaja":"eomeoni","en":"mother","type":"word","batch":5},
  {"id":"w-abeoji","char":"아버지","romaja":"abeoji","en":"father","type":"word","batch":5},
  {"id":"w-namja","char":"남자","romaja":"namja","en":"man","type":"word","batch":5},
  {"id":"w-yeoja","char":"여자","romaja":"yeoja","en":"woman","type":"word","batch":5},
  {"id":"w-oneul","char":"오늘","romaja":"oneul","en":"today","type":"word","batch":5},
  {"id":"w-naeil","char":"내일","romaja":"naeil","en":"tomorrow","type":"word","batch":5},
  {"id":"w-eoje","char":"어제","romaja":"eoje","en":"yesterday","type":"word","batch":5},
  {"id":"w-jigeum","char":"지금","romaja":"jigeum","en":"now","type":"word","batch":5},
  {"id":"w-yeogi","char":"여기","romaja":"yeogi","en":"here","type":"word","batch":5},
  {"id":"w-geogi","char":"거기","romaja":"geogi","en":"there","type":"word","batch":5},
  {"id":"w-igeos","char":"이것","romaja":"igeot","en":"this","type":"word","batch":5},
  {"id":"w-geugeos","char":"그것","romaja":"geugeot","en":"that","type":"word","batch":5},
  {"id":"w-eumsik","char":"음식","romaja":"eumsik","en":"food","type":"word","batch":5},
  {"id":"w-keopi","char":"커피","romaja":"keopi","en":"coffee","type":"word","batch":5},
  {"id":"w-cha","char":"차","romaja":"cha","en":"tea / car","type":"word","batch":5},
  {"id":"w-beoseu","char":"버스","romaja":"beoseu","en":"bus","type":"word","batch":5},
  {"id":"w-gicha","char":"기차","romaja":"gicha","en":"train","type":"word","batch":5},
  {"id":"w-bihaenggi","char":"비행기","romaja":"bihaenggi","en":"airplane","type":"word","batch":5},
  {"id":"w-don","char":"돈","romaja":"don","en":"money","type":"word","batch":5},
  {"id":"w-sigan","char":"시간","romaja":"sigan","en":"time","type":"word","batch":5},
  {"id":"w-ireum","char":"이름","romaja":"ireum","en":"name","type":"word","batch":5},
  {"id":"w-yeongeo","char":"영어","romaja":"yeongeo","en":"English","type":"word","batch":5},
  {"id":"w-hangugeo","char":"한국어","romaja":"hangugeo","en":"Korean (language)","type":"word","batch":5},
]

hangul = {
  "consonants": CONSONANTS,
  "vowels": VOWELS,
  "syllables": SYLLABLES,
  "words": WORDS_READ,
  "sources": [
    "Hangul jamo inventory and IPA based on standard Seoul Korean descriptions (Lee & Ramsey; Shin et al.).",
    "Syllable composition follows Unicode Hangul Syllables algorithm (KS X 1001 / U+AC00).",
    "Beginner reading words aligned with NIKL 한국어 학습용 어휘 목록 beginner band."
  ]
}
(OUT/"hangul.json").write_text(json.dumps(hangul, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"Hangul: {len(CONSONANTS)} C, {len(VOWELS)} V, {len(SYLLABLES)} syl, {len(WORDS_READ)} words")

# ========== CONJUGATION ENGINE ==========
# Accurate polite conjugations for Korean verbs/adjectives

def get_stem(dict_form):
    if dict_form.endswith("하다"):
        return dict_form[:-2], "hada"
    if dict_form.endswith("다"):
        return dict_form[:-1], "regular"
    raise ValueError(dict_form)

def conjugate(dict_form, irregular=None):
    """Return conjugation paradigm. irregular: 'eu','b','d','s','reu','ha' or None."""
    if dict_form.endswith("하다") or irregular == "ha":
        base = dict_form[:-2]  # 공부
        return {
            "dict": dict_form,
            "polite_present": base + "해요",
            "polite_past": base + "했어요",
            "future": base + "할 거예요",
            "negative": base + "안 해요",
            "formal": base + "합니다",
        }
    stem = dict_form[:-1]
    irr = irregular

    # Determine vowel harmony: if last vowel in stem is ㅏ or ㅗ -> 아, else 어
    def last_vowel_bright(s):
        # walk jamo of last syllable
        ch = s[-1]
        if "가" <= ch <= "힣":
            code = ord(ch) - 0xAC00
            jung = JUNG[(code // 28) % 21]
            return jung in ("ㅏ","ㅑ","ㅗ","ㅛ","ㅘ")
        return False

    # Irregular 르
    if irr == "reu" or (stem.endswith("르") and irr != "eu"):
        # 모르다 -> 몰라요; drop ㅡ and double ㄹ
        pre = stem[:-1]
        if last_vowel_bright(pre):
            polite = pre + "ㄹ라요"
            past = pre + "ㄹ랐어요"
        else:
            polite = pre + "ㄹ러요"
            past = pre + "ㄹ렀어요"
        # fix double ㄹ: 몰 + ㄹ라 = 몰라 - need compose
        # simpler approach with known patterns handled below
        pass

    # Build by cases
    if irr == "b" or (len(stem) >= 1 and False):
        pass

    # Generic engine using Hangul decomposition
    def decomp(ch):
        if not ("가" <= ch <= "힣"):
            return None
        code = ord(ch) - 0xAC00
        return CHO[code // (21*28)], JUNG[(code // 28) % 21], JONG[code % 28]

    def recomp(c, v, j=""):
        return compose(c, v, j)

    last = stem[-1]
    d = decomp(last)
    if d is None:
        # fallback for non-hangul (shouldn't happen)
        return {"dict": dict_form, "polite_present": stem+"요", "polite_past": stem+"었어요",
                "future": stem+"ㄹ 거예요", "negative": "안 "+stem+"요", "formal": stem+"습니다"}

    cho, jung, jong = d
    rest = stem[:-1]

    # 으-irregular: drop ㅡ before vowel ending
    if irr == "eu" or (jung == "ㅡ" and jong == "" and irr != "reu"):
        # 쓰다 -> 써요; 바쁘다 -> 바빠요
        # take previous vowel for harmony if exists
        bright = False
        if rest:
            pd = decomp(rest[-1])
            if pd:
                bright = pd[1] in ("ㅏ","ㅑ","ㅗ","ㅛ","ㅘ")
        if bright:
            # replace ㅡ with ㅏ
            polite = rest + recomp(cho, "ㅏ") + "요"
            past = rest + recomp(cho, "ㅏ") + "았어요"
        else:
            polite = rest + recomp(cho, "ㅓ") + "요"
            past = rest + recomp(cho, "ㅓ") + "었어요"
        # future: stem+ㄹ
        fut_stem = stem  # 쓰
        if jong == "":
            future = rest + recomp(cho, jung, "ㄹ") + " 거예요"
        else:
            future = stem + "을 거예요"
        formal = stem + "습니다"
        return {"dict": dict_form, "polite_present": polite, "polite_past": past,
                "future": future, "negative": "안 " + polite, "formal": formal}

    # 르-irregular
    if irr == "reu":
        pre = stem[:-1]  # drop 르
        bright = False
        if pre:
            pd = decomp(pre[-1])
            if pd:
                bright = pd[1] in ("ㅏ","ㅑ","ㅗ","ㅛ","ㅘ")
        # double ㄹ
        # 모르다: 모 + ㄹ라요 = 몰라요
        pd = decomp(pre[-1]) if pre else None
        if pd:
            pc, pv, pj = pd
            if pj == "":
                # add ㄹ as batchim then 라/러
                doubled = rest[:-1] + recomp(pc, pv, "ㄹ") if rest else recomp(pc, pv, "ㄹ")
                # wait rest includes pre's previous... pre = stem[:-1], rest = stem[:-1] for last of stem being 르
                # stem = 모르, last=르, rest=모, pre=모
                doubled_base = pre[:-1] + recomp(pc, pv, "ㄹ") if len(pre) > 1 or True else recomp(pc, pv, "ㄹ")
                if len(pre) == 1:
                    doubled_base = recomp(pc, pv, "ㄹ")
                else:
                    doubled_base = pre[:-1] + recomp(pc, pv, "ㄹ")
                if bright:
                    polite = doubled_base + "라요"
                    past = doubled_base + "랐어요"
                else:
                    polite = doubled_base + "러요"
                    past = doubled_base + "렀어요"
            else:
                # rare
                polite = stem + "요"
                past = stem + "었어요"
        else:
            polite = stem + "요"
            past = stem + "었어요"
        future = rest + recomp(cho, jung, "ㄹ") + " 거예요" if jong == "" else stem + "를 거예요"
        # 모르다 future: 모를 거예요
        future = rest + "를 거예요"
        # actually 모르다 -> 모를 거예요
        formal = stem + "습니다"
        return {"dict": dict_form, "polite_present": polite, "polite_past": past,
                "future": future, "negative": "안 " + polite, "formal": formal}

    # ㅂ-irregular: ㅂ batchim -> 우 + 어/아
    if irr == "b" or (jong == "ㅂ" and irr == "b"):
        # 춥다 -> 추 + 워요; 돕다 -> 도와요 (exception bright)
        no_b = rest + recomp(cho, jung, "")  # remove batchim
        if jung in ("ㅗ",) and dict_form in ("돕다", "곱다"):
            polite = no_b + "와요"
            past = no_b + "왔어요"
        else:
            polite = no_b + "워요"
            past = no_b + "웠어요"
        future = no_b + "울 거예요"
        formal = no_b + "습니다"  # 춥습니다 - actually keeps ㅂ: 춥습니다
        formal = stem + "습니다"
        return {"dict": dict_form, "polite_present": polite, "polite_past": past,
                "future": future, "negative": "안 " + polite, "formal": formal}

    # ㄷ-irregular: ㄷ -> ㄹ before vowel
    if irr == "d":
        no_d = rest + recomp(cho, jung, "ㄹ")
        bright = jung in ("ㅏ","ㅑ","ㅗ","ㅛ","ㅘ")
        if bright:
            polite = no_d + "아요"
            past = no_d + "았어요"
        else:
            polite = no_d + "어요"
            past = no_d + "었어요"
        future = no_d + "을 거예요"
        formal = stem + "습니다"
        return {"dict": dict_form, "polite_present": polite, "polite_past": past,
                "future": future, "negative": "안 " + polite, "formal": formal}

    # ㅅ-irregular: drop ㅅ before vowel
    if irr == "s":
        no_s = rest + recomp(cho, jung, "")
        bright = jung in ("ㅏ","ㅑ","ㅗ","ㅛ","ㅘ")
        if bright:
            polite = no_s + "아요"
            past = no_s + "았어요"
        else:
            polite = no_s + "어요"
            past = no_s + "었어요"
        future = no_s + "을 거예요"
        formal = stem + "습니다"
        return {"dict": dict_form, "polite_present": polite, "polite_past": past,
                "future": future, "negative": "안 " + polite, "formal": formal}

    # Regular
    bright = jung in ("ㅏ","ㅑ","ㅗ","ㅛ","ㅘ")

    # Special: stem ends with ㅏ or ㅓ and no batchim -> just add 요
    if jong == "" and jung == "ㅏ":
        polite = stem + "요"  # 가다 -> 가요
        past = stem + "았어요"  # 갔어요 - actually 가 + 았어요 = 갔어요
        # 가 + 았 = 갔
        past = rest + recomp(cho, "ㅏ", "ㅆ") + "어요"
        future = rest + recomp(cho, jung, "ㄹ") + " 거예요"
        formal = stem + "ㅂ니다" if jong == "" else stem + "습니다"
        # 가다 -> 갑니다: add ㅂ to 가
        formal = rest + recomp(cho, jung, "ㅂ") + "니다"
        return {"dict": dict_form, "polite_present": polite, "polite_past": past,
                "future": future, "negative": "안 " + polite, "formal": formal}

    if jong == "" and jung == "ㅓ":
        polite = stem + "요"  # 서다 -> 서요
        past = rest + recomp(cho, "ㅓ", "ㅆ") + "어요"
        future = rest + recomp(cho, jung, "ㄹ") + " 거예요"
        formal = rest + recomp(cho, jung, "ㅂ") + "니다"
        return {"dict": dict_form, "polite_present": polite, "polite_past": past,
                "future": future, "negative": "안 " + polite, "formal": formal}

    if jong == "" and jung == "ㅣ":
        # ㅣ + 어 = 여: 마시다 -> 마셔요
        polite = rest + recomp(cho, "ㅕ") + "요"
        past = rest + recomp(cho, "ㅕ", "ㅆ") + "어요"
        future = rest + recomp(cho, jung, "ㄹ") + " 거예요"
        formal = rest + recomp(cho, jung, "ㅂ") + "니다"
        return {"dict": dict_form, "polite_present": polite, "polite_past": past,
                "future": future, "negative": "안 " + polite, "formal": formal}

    if jong == "" and jung == "ㅜ":
        # ㅜ + 어 = 워: 배우다 -> 배워요
        polite = rest + recomp(cho, "ㅝ") + "요"
        past = rest + recomp(cho, "ㅝ", "ㅆ") + "어요"
        future = rest + recomp(cho, jung, "ㄹ") + " 거예요"
        formal = rest + recomp(cho, jung, "ㅂ") + "니다"
        return {"dict": dict_form, "polite_present": polite, "polite_past": past,
                "future": future, "negative": "안 " + polite, "formal": formal}

    if jong == "" and jung == "ㅗ":
        # ㅗ + 아 = 와: 오다 -> 와요
        polite = rest + recomp(cho, "ㅘ") + "요"
        past = rest + recomp(cho, "ㅘ", "ㅆ") + "어요"
        future = rest + recomp(cho, jung, "ㄹ") + " 거예요"
        formal = rest + recomp(cho, jung, "ㅂ") + "니다"
        return {"dict": dict_form, "polite_present": polite, "polite_past": past,
                "future": future, "negative": "안 " + polite, "formal": formal}

    if jong == "" and jung == "ㅚ":
        polite = rest + recomp(cho, "ㅙ") + "요"  # 되다 -> 돼요
        past = rest + recomp(cho, "ㅙ", "ㅆ") + "어요"
        future = rest + recomp(cho, jung, "ㄹ") + " 거예요"
        formal = rest + recomp(cho, jung, "ㅂ") + "니다"
        return {"dict": dict_form, "polite_present": polite, "polite_past": past,
                "future": future, "negative": "안 " + polite, "formal": formal}

    # With batchim or other vowels: add 아요/어요
    if bright:
        polite = stem + "아요"
        past = stem + "았어요"
    else:
        polite = stem + "어요"
        past = stem + "었어요"

    if jong == "":
        future = rest + recomp(cho, jung, "ㄹ") + " 거예요"
        formal = rest + recomp(cho, jung, "ㅂ") + "니다"
    else:
        # batchim: 을 거예요 / 습니다
        future = stem + "을 거예요"
        formal = stem + "습니다"

    return {"dict": dict_form, "polite_present": polite, "polite_past": past,
            "future": future, "negative": "안 " + polite, "formal": formal}

# Verify known conjugations
TESTS = [
  ("가다", None, "가요", "갔어요", "갈 거예요", "갑니다"),
  ("오다", None, "와요", "왔어요", "올 거예요", "옵니다"),
  ("먹다", None, "먹어요", "먹었어요", "먹을 거예요", "먹습니다"),
  ("마시다", None, "마셔요", "마셨어요", "마실 거예요", "마십니다"),
  ("배우다", None, "배워요", "배웠어요", "배울 거예요", "배웁니다"),
  ("하다", "ha", "해요", "했어요", "할 거예요", "합니다"),
  ("공부하다", "ha", "공부해요", "공부했어요", "공부할 거예요", "공부합니다"),
  ("쓰다", "eu", "써요", "썼어요", "쓸 거예요", "씁니다"),
  ("바쁘다", "eu", "바빠요", "바빴어요", "바쁠 거예요", "바쁩니다"),
  ("춥다", "b", "추워요", "추웠어요", "추울 거예요", "춥습니다"),
  ("돕다", "b", "도와요", "도왔어요", "도울 거예요", "돕습니다"),
  ("듣다", "d", "들어요", "들었어요", "들을 거예요", "듣습니다"),
  ("걷다", "d", "걸어요", "걸었어요", "걸을 거예요", "걷습니다"),
  ("낫다", "s", "나아요", "나았어요", "나을 거예요", "낫습니다"),
  ("짓다", "s", "지어요", "지었어요", "지을 거예요", "짓습니다"),
  ("모르다", "reu", "몰라요", "몰랐어요", "모를 거예요", "모릅니다"),
  ("빠르다", "reu", "빨라요", "빨랐어요", "빠를 거예요", "빠릅니다"),
  ("살다", None, "살아요", "살았어요", "살 거예요", "삽니다"),  # ㄹ special
  ("열다", None, "열어요", "열었어요", "열 거예요", "엽니다"),
  ("이다", None, "이에요", "이었어요", "일 거예요", "입니다"),  # copula special
  ("되다", None, "돼요", "됐어요", "될 거예요", "됩니다"),
  ("자다", None, "자요", "잤어요", "잘 거예요", "잡니다"),
  ("보다", None, "봐요", "봤어요", "볼 거예요", "봅니다"),
  ("사다", None, "사요", "샀어요", "살 거예요", "삽니다"),
  ("앉다", None, "앉아요", "앉았어요", "앉을 거예요", "앉습니다"),
  ("읽다", None, "읽어요", "읽었어요", "읽을 거예요", "읽습니다"),
  ("크다", "eu", "커요", "컸어요", "클 거예요", "큽니다"),
  ("예쁘다", "eu", "예뻐요", "예뻤어요", "예쁠 거예요", "예쁩니다"),
]

# Fix ㄹ-irregular (batchim ㄹ): drop ㄹ before ㄴ,ㅂ, ㅅ, 오; future uses ㄹ not 을
def conjugate_full(dict_form, irregular=None):
    # ㄹ verbs: 살다
    stem = dict_form[:-1]
    d = None
    if "가" <= stem[-1] <= "힣":
        code = ord(stem[-1]) - 0xAC00
        d = (CHO[code // (21*28)], JUNG[(code // 28) % 21], JONG[code % 28])
    if d and d[2] == "ㄹ" and irregular is None:
        cho, jung, jong = d
        rest = stem[:-1]
        bright = jung in ("ㅏ","ㅑ","ㅗ","ㅛ","ㅘ")
        if bright:
            polite = stem + "아요"
            past = stem + "았어요"
        else:
            polite = stem + "어요"
            past = stem + "었어요"
        # future: 살 거예요 (keeps ㄹ, no 을)
        future = stem + " 거예요"
        # formal: 삽니다 (ㄹ drops before ㅂ)
        formal = rest + compose(cho, jung, "ㅂ") + "니다"
        return {"dict": dict_form, "polite_present": polite, "polite_past": past,
                "future": future, "negative": "안 " + polite, "formal": formal}
    # copula 이다
    if dict_form == "이다":
        return {"dict":"이다","polite_present":"이에요/예요","polite_past":"이었어요/였어요",
                "future":"일 거예요","negative":"아니에요","formal":"입니다"}
    if dict_form == "아니다":
        return {"dict":"아니다","polite_present":"아니에요","polite_past":"아니었어요",
                "future":"아닐 거예요","negative":"(already neg)","formal":"아닙니다"}
    return conjugate(dict_form, irregular)

# Override conjugate for ㄹ
_old = conjugate
def conjugate(dict_form, irregular=None):
    return conjugate_full(dict_form, irregular)

fail = 0
for df, irr, pp, past, fut, formal in TESTS:
    r = conjugate(df, irr)
    ok = (r["polite_present"]==pp and r["polite_past"]==past and r["future"]==fut and r["formal"]==formal)
    if not ok:
        fail += 1
        print(f"FAIL {df}: got {r} expected pp={pp} past={past} fut={fut} formal={formal}")
print(f"Conjugation tests: {len(TESTS)-fail}/{len(TESTS)} passed")
if fail:
    # still continue but note
    print("WARNING: some conjugations failed, will use hand-verified forms for vocab")

print("Content script part 1 OK")
