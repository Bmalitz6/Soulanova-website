'use strict';
(function(root){const catalog={
  "movements": [
    {
      "id": "overhead-reset",
      "name": "Shoulder Stretch",
      "category": "Upper body",
      "file": "IMG_4096.mov",
      "seconds": 28.433,
      "instruction": "Follow the demonstrated shoulder stretch within a comfortable range.",
      "status": "identified",
      "sha256": "de62b10902b60eea026ad970c9577c6c9a8b77a38a00fec74c5da63f06f14042",
      "approval_status": "Owner-approved for Production — exact reviewed SHA-256"
    },
    {
      "id": "overhead-shoulder",
      "name": "Overhead shoulder stretch",
      "category": "Upper body",
      "file": "IMG_4097.mov",
      "seconds": 29.067,
      "instruction": "Reach one arm overhead and gently bend the elbow; use the other hand to guide the stretch.",
      "status": "identified",
      "sha256": "8ea07fdbc8de8f1c30e8c3ca645c00e2903b061753f09c7816c91345800297d6",
      "approval_status": "Owner-approved for Production — exact reviewed SHA-256"
    },
    {
      "id": "overhead-reach",
      "name": "Overhead reach",
      "category": "Upper body",
      "file": "IMG_4098.mov",
      "seconds": 29,
      "instruction": "Reach both arms overhead and lengthen through the sides of the body.",
      "status": "identified",
      "sha256": "e5508186a3bed9c7e3868af88800db7bb5673a8cb8b5eb6a559d7d25d50e28a1",
      "approval_status": "Owner-approved for Production — exact reviewed SHA-256"
    },
    {
      "id": "forward-fold",
      "name": "Standing forward fold",
      "category": "Lower body",
      "file": "IMG_4099.mp4",
      "seconds": 35.042,
      "instruction": "Hinge gently at the hips and fold forward within a comfortable range.",
      "status": "identified",
      "sha256": "420766c54d90a97b78e1e624415d0f415d9ba3e0ac89253eb811129bf83d8e71",
      "approval_status": "Owner-approved for Production — exact reviewed SHA-256"
    },
    {
      "id": "hamstring-a",
      "name": "Standing hamstring stretch, variation A",
      "category": "Lower body",
      "file": "IMG_4100.mp4",
      "seconds": 29,
      "instruction": "Extend one leg forward with the heel down and hinge gently at the hips.",
      "status": "identified",
      "sha256": "51ac818a7a6e6c13a40a67187f319cd5dfca688f13e15637becbebaca81b553f",
      "approval_status": "Owner-approved for Production — exact reviewed SHA-256"
    },
    {
      "id": "hip-flexor-a",
      "name": "Staggered-stance hip-flexor stretch, variation A",
      "category": "Hips",
      "file": "IMG_4102.mp4",
      "seconds": 29,
      "instruction": "Use a staggered lunge stance and gently shift the hips forward while staying tall.",
      "status": "identified",
      "sha256": "5dae18420038711226d0867eed9639b555d3a7e20ee4c6b455934ec1e2652359",
      "approval_status": "Owner-approved for Production — exact reviewed SHA-256"
    },
    {
      "id": "hip-flexor-b",
      "name": "Staggered-stance hip-flexor stretch, variation B",
      "category": "Hips",
      "file": "IMG_4103.mp4",
      "seconds": 29,
      "instruction": "Use a staggered lunge stance and gently shift the hips forward while staying tall.",
      "status": "identified",
      "sha256": "e90cb34e31a28cb810011d02b5db0656385beef4a5dcbe5c2df76f3918cf6370",
      "approval_status": "Owner-approved for Production — exact reviewed SHA-256"
    },
    {
      "id": "figure-four-a",
      "name": "Standing figure-four stretch, variation A",
      "category": "Hips",
      "file": "IMG_4104.mov",
      "seconds": 27.733,
      "instruction": "Balance comfortably, cross one ankle over the opposite thigh, and sit back slightly.",
      "status": "identified",
      "sha256": "3df3b1e8579b8696a77dcf8a17867ee033ae3197465fc21fafd534fe2a1a6f16",
      "approval_status": "Owner-approved for Production — exact reviewed SHA-256"
    },
    {
      "id": "figure-four-b",
      "name": "Standing figure-four stretch, variation B",
      "category": "Hips",
      "file": "IMG_4105.mov",
      "seconds": 26.333,
      "instruction": "Balance comfortably, cross one ankle over the opposite thigh, and sit back slightly.",
      "status": "identified",
      "sha256": "55c6cd81b240cfbe192823ffd8b9bcd404e207fb1a72ac5174ddec675dbb87f6",
      "approval_status": "Owner-approved for Production — exact reviewed SHA-256"
    },
    {
      "id": "adductor",
      "name": "Lateral lunge / adductor stretch",
      "category": "Lower body",
      "file": "IMG_4106.mp4",
      "seconds": 29,
      "instruction": "Shift your hips toward one bent leg while the other leg stays long and comfortable.",
      "status": "identified",
      "sha256": "f979dd234a23dbc3a985dbf3a4ace006a3175f9288e3443306784ea41e7fa7e5",
      "approval_status": "Owner-approved for Production — exact reviewed SHA-256"
    },
    {
      "id": "shoulder-a",
      "name": "Cross-body shoulder stretch, variation A",
      "category": "Upper body",
      "file": "IMG_4107.mp4",
      "seconds": 29,
      "instruction": "Bring one arm across the chest and support it gently with the opposite arm.",
      "status": "identified",
      "sha256": "59ca2a8c7e6c396b7efcde94689f05a037f673578943b8d1a4a9d5486f80a2f5",
      "approval_status": "Owner-approved for Production — exact reviewed SHA-256"
    },
    {
      "id": "shoulder-b",
      "name": "Cross-body shoulder stretch, variation B",
      "category": "Upper body",
      "file": "IMG_4108.mov",
      "seconds": 29,
      "instruction": "Bring one arm across the chest and support it gently with the opposite arm.",
      "status": "identified",
      "sha256": "0f5cc134cc36bf77138cb30b0eb33b5503e259c73d3b239e91aa1e9da50c51d9",
      "approval_status": "Owner-approved for Production — exact reviewed SHA-256"
    },
    {
      "id": "calf-a",
      "name": "Standing calf stretch, variation A",
      "category": "Lower body",
      "file": "IMG_4111.mp4",
      "seconds": 29,
      "instruction": "Place one foot behind you and press the heel toward the floor as you lean gently forward.",
      "status": "identified",
      "sha256": "4d688dcacb9e280c8e1a0d87f78af431d5bcf6bc3ad60fe52c6029d38a0b37ee",
      "approval_status": "Owner-approved for Production — exact reviewed SHA-256"
    },
    {
      "id": "calf-b",
      "name": "Standing calf stretch, variation B",
      "category": "Lower body",
      "file": "IMG_4112.mp4",
      "seconds": 29,
      "instruction": "Place one foot behind you and press the heel toward the floor as you lean gently forward.",
      "status": "identified",
      "sha256": "a664c098552bcbd2096dac8fccb260efce683fdc6f7aa78d6b2a3b38100d1dfe",
      "approval_status": "Owner-approved for Production — exact reviewed SHA-256"
    },
    {
      "id": "standing-reset-4113",
      "name": "Calf Raises",
      "category": "Lower body",
      "file": "IMG_4113.mov",
      "seconds": 29.433,
      "instruction": "Follow the demonstrated calf raises at a comfortable pace.",
      "status": "identified",
      "sha256": "f1d36d4d25ea76baeb86a5f222f653646a1db6084be7ee1a4d2bed03ddf506b5",
      "approval_status": "Owner-approved for Production — exact reviewed SHA-256"
    },
    {
      "id": "standing-reset-4114",
      "name": "Toe Raises",
      "category": "Lower body",
      "file": "IMG_4114.mp4",
      "seconds": 29,
      "instruction": "Follow the demonstrated toe raises at a comfortable pace.",
      "status": "identified",
      "sha256": "2d837888dc6ba43aa822643b7f281b10156a6eb4bb5a9f87085d77ea9111a58f",
      "approval_status": "Owner-approved for Production — exact reviewed SHA-256"
    },
    {
      "id": "side-bend",
      "name": "Hip Rotations",
      "category": "Hips",
      "file": "IMG_4115.mp4",
      "seconds": 29,
      "instruction": "Follow the demonstrated hip rotations within a comfortable range.",
      "status": "identified",
      "sha256": "6d2fbd5c7f6a6960b20a3ef85aac972752c6a094e50f1bfa0ba3d84d139c9776",
      "approval_status": "Owner-approved for Production — exact reviewed SHA-256"
    },
    {
      "id": "hip-abduction",
      "name": "Hip Flexor",
      "category": "Hips",
      "file": "IMG_4117.mp4",
      "seconds": 29,
      "instruction": "Follow the demonstrated hip-flexor movement within a comfortable range.",
      "status": "identified",
      "sha256": "cb5c70acac6366203e147eefcdcf13f0bb872fdfece10ccf2f70b84456a84731",
      "approval_status": "Owner-approved for Production — exact reviewed SHA-256"
    },
    {
      "id": "knee-chest",
      "name": "Standing knee-to-chest stretch",
      "category": "Hips",
      "file": "IMG_4120.mp4",
      "seconds": 29,
      "instruction": "Stand tall with support nearby and gently draw one knee toward the chest.",
      "status": "identified",
      "sha256": "28779359e4eb6bf504bfafc3af85a489007c152bae3f2abc25b51b3f7185823c",
      "approval_status": "Owner-approved for Production — exact reviewed SHA-256"
    },
    {
      "id": "wide-stance-a",
      "name": "Wide-stance lateral stretch, variation A",
      "category": "Lower body",
      "file": "IMG_4121.mp4",
      "seconds": 29,
      "instruction": "Take a wide stance, bend one knee comfortably, and reach the arms outward.",
      "status": "identified",
      "sha256": "2e6df3e0084b9601dc4eb5df9383b22f8115c7e0cd0e314ec81fd727b8cdbc37",
      "approval_status": "Owner-approved for Production — exact reviewed SHA-256"
    },
    {
      "id": "wide-stance-b",
      "name": "Wide-stance lateral stretch, variation B",
      "category": "Lower body",
      "file": "IMG_4122.mp4",
      "seconds": 29,
      "instruction": "Take a wide stance, bend one knee comfortably, and reach the arms outward.",
      "status": "identified",
      "sha256": "2e5bc8cca60f4abc654a4bc0f27f82526f160d2ea5615156df297a890ba2fc89",
      "approval_status": "Owner-approved for Production — exact reviewed SHA-256"
    },
    {
      "id": "standing-reset-4123",
      "name": "Chest Stretch",
      "category": "Upper body",
      "file": "IMG_4123.mp4",
      "seconds": 28.708,
      "instruction": "Follow the demonstrated chest stretch within a comfortable range.",
      "status": "identified",
      "sha256": "29f542953962d8c172db79173394cf426f2fa811132e5eda05e2893b0ec72a48",
      "approval_status": "Owner-approved for Production — exact reviewed SHA-256"
    }
  ],
  "routines": [
    {
      "id": "full-body-gentle",
      "title": "Gentle Full-Body Reset",
      "level": "Beginner",
      "category": "Full body",
      "minutes": 5,
      "description": "A supported, unhurried introduction to shoulder, hip, and leg mobility.",
      "ids": [
        "overhead-reach",
        "overhead-reset",
        "shoulder-a",
        "hip-flexor-a",
        "hamstring-a",
        "calf-a",
        "standing-reset-4113",
        "standing-reset-4114",
        "standing-reset-4123"
      ],
      "collection": "level",
      "difficulty": "Beginner · gentle pace; support nearby"
    },
    {
      "id": "upper-body",
      "title": "Upper-Body Ease",
      "level": "Beginner",
      "category": "Upper body",
      "minutes": 3,
      "description": "Gentle shoulder, chest, and overhead movements. Stay in a comfortable range.",
      "ids": [
        "overhead-shoulder",
        "overhead-reach",
        "shoulder-a",
        "overhead-reset",
        "standing-reset-4123"
      ],
      "collection": "level",
      "difficulty": "Beginner · upper body; simple sequence"
    },
    {
      "id": "hips-and-legs",
      "title": "Hips & Legs",
      "level": "Intermediate",
      "category": "Lower body",
      "minutes": 4,
      "description": "A steady lower-body flow with a chair or wall nearby for balance.",
      "ids": [
        "hip-flexor-a",
        "figure-four-a",
        "adductor",
        "knee-chest",
        "calf-a",
        "side-bend",
        "hip-abduction"
      ],
      "collection": "level",
      "difficulty": "Intermediate · balance and lateral transitions"
    },
    {
      "id": "balanced-full-body-flow",
      "title": "Balanced Full-Body Flow",
      "level": "Intermediate",
      "category": "Full body",
      "minutes": 6,
      "description": "A longer sequence linking upper-body mobility with hips and legs.",
      "ids": [
        "overhead-shoulder",
        "shoulder-a",
        "side-bend",
        "hip-flexor-b",
        "wide-stance-a",
        "hamstring-a",
        "calf-a",
        "standing-reset-4113"
      ],
      "collection": "level",
      "difficulty": "Intermediate · longer linked sequence"
    },
    {
      "id": "complete-mobility-circuit",
      "title": "Complete Mobility Circuit",
      "level": "Advanced",
      "category": "Full body",
      "minutes": 7,
      "description": "A longer, continuous circuit. Use a stable support for standing balance movements and shorten any range that feels uncomfortable.",
      "ids": [
        "overhead-reach",
        "shoulder-b",
        "hip-flexor-a",
        "figure-four-a",
        "adductor",
        "wide-stance-b",
        "forward-fold",
        "calf-b",
        "standing-reset-4114"
      ],
      "collection": "level",
      "difficulty": "Advanced · nine movements; varied standing positions"
    },
    {
      "id": "extended-range-flow",
      "title": "Extended Range Flow",
      "level": "Advanced",
      "category": "Full body",
      "minutes": 8,
      "description": "The longest library sequence, combining all movement areas with deliberate transitions and balance support as needed.",
      "ids": [
        "overhead-reset",
        "overhead-shoulder",
        "overhead-reach",
        "shoulder-a",
        "shoulder-b",
        "side-bend",
        "hip-flexor-b",
        "figure-four-b",
        "knee-chest",
        "wide-stance-a",
        "hamstring-a",
        "standing-reset-4123"
      ],
      "collection": "level",
      "difficulty": "Advanced · longest program; twelve movements"
    },
    {
      "id": "lower-leg-foundations",
      "title": "Lower-Leg Foundations",
      "level": "Beginner",
      "collection": "level",
      "category": "Calves & ankles",
      "minutes": 0,
      "description": "A short, supported sequence for calf flexibility and the lower legs, ending with gentle ankle movement.",
      "difficulty": "Beginner · steady stance",
      "ids": [
        "calf-a",
        "calf-b",
        "standing-reset-4113",
        "standing-reset-4114"
      ]
    },
    {
      "id": "supported-hip-mobility",
      "title": "Supported Hips & Legs",
      "level": "Beginner",
      "collection": "level",
      "category": "Hips & legs",
      "minutes": 0,
      "description": "A steady, supported combination of hip mobility and simple ankle movement. Keep a chair or wall within reach and move without rushing.",
      "difficulty": "Beginner · support encouraged",
      "ids": [
        "hip-flexor-b",
        "side-bend",
        "knee-chest",
        "standing-reset-4113",
        "standing-reset-4114"
      ]
    },
    {
      "id": "gentle-standing-balance",
      "title": "Gentle Standing Balance",
      "level": "Beginner",
      "collection": "level",
      "category": "Balance & legs",
      "minutes": 0,
      "description": "A steady introduction to supported single-leg positions and simple lower-leg movements. Use a sturdy support throughout.",
      "difficulty": "Beginner · support encouraged",
      "ids": [
        "knee-chest",
        "figure-four-a",
        "standing-reset-4113",
        "standing-reset-4114"
      ]
    },
    {
      "id": "easy-chest-and-shoulders",
      "title": "Easy Chest & Shoulders",
      "level": "Beginner",
      "collection": "level",
      "category": "Shoulders & chest",
      "minutes": 0,
      "description": "An unhurried upper-body sequence through chest opening and comfortable shoulder mobility.",
      "difficulty": "Beginner · gentle upper-body range",
      "ids": [
        "standing-reset-4123",
        "shoulder-b",
        "shoulder-a"
      ]
    },
    {
      "id": "posterior-chain-mobility",
      "title": "Back-of-Leg Mobility",
      "level": "Intermediate",
      "collection": "level",
      "category": "Hamstrings & calves",
      "minutes": 0,
      "description": "A focused standing sequence for the hamstrings and calves, moving gradually from hips toward ankles.",
      "difficulty": "Intermediate · linked hamstring and calf sequence",
      "ids": [
        "forward-fold",
        "hamstring-a",
        "calf-a",
        "calf-b",
        "standing-reset-4114"
      ]
    },
    {
      "id": "lateral-hip-flow",
      "title": "Lateral Hip Flow",
      "level": "Intermediate",
      "collection": "level",
      "category": "Hips & inner thighs",
      "minutes": 0,
      "description": "Links hip rotation with a controlled lateral shift and a comfortable inner-thigh stretch.",
      "difficulty": "Intermediate · coordinated lateral transitions",
      "ids": [
        "hip-flexor-b",
        "side-bend",
        "adductor",
        "wide-stance-a",
        "calf-b"
      ]
    },
    {
      "id": "upper-body-length",
      "title": "Upper-to-Lower Lengthening",
      "level": "Intermediate",
      "collection": "level",
      "category": "Full body",
      "minutes": 0,
      "description": "A longer standing flow linking chest and shoulder mobility with a hip hinge, hip movement, and calf stretch.",
      "difficulty": "Intermediate · varied body areas and transitions",
      "ids": [
        "overhead-reset",
        "shoulder-b",
        "standing-reset-4123",
        "forward-fold",
        "calf-a",
        "hip-flexor-b"
      ]
    },
    {
      "id": "standing-mobility-circuit",
      "title": "Standing Mobility Circuit",
      "level": "Intermediate",
      "collection": "level",
      "category": "Full body",
      "minutes": 0,
      "description": "A varied standing circuit alternating between shoulder mobility, supported hip balance, a lateral stance, and back-of-leg stretches.",
      "difficulty": "Intermediate · varied standing positions",
      "ids": [
        "overhead-reset",
        "shoulder-a",
        "figure-four-b",
        "wide-stance-a",
        "hamstring-a",
        "calf-b"
      ]
    },
    {
      "id": "progressive-lower-body",
      "title": "Progressive Lower-Body Flow",
      "level": "Advanced",
      "collection": "level",
      "category": "Hips & legs",
      "minutes": 0,
      "description": "A longer lower-body sequence linking a hip hinge, staggered stance, balance, and lateral movement. Keep support within reach.",
      "difficulty": "Advanced · longer linked lower-body sequence",
      "ids": [
        "forward-fold",
        "hamstring-a",
        "hip-flexor-b",
        "figure-four-b",
        "adductor",
        "calf-b",
        "knee-chest"
      ]
    },
    {
      "id": "upper-to-lateral-flow",
      "title": "Upper-to-Lateral Flow",
      "level": "Advanced",
      "collection": "level",
      "category": "Shoulders & lateral body",
      "minutes": 0,
      "description": "Moves from overhead and chest mobility into a controlled wide-stance sequence, with room for steady transitions.",
      "difficulty": "Advanced · coordinated upper/lower transitions",
      "ids": [
        "overhead-reach",
        "shoulder-b",
        "standing-reset-4123",
        "side-bend",
        "wide-stance-a",
        "adductor"
      ]
    },
    {
      "id": "balance-and-hip-control",
      "title": "Balance & Hip Control",
      "level": "Advanced",
      "collection": "level",
      "category": "Hips & balance",
      "minutes": 0,
      "description": "A balance-focused hip sequence. Keep a sturdy support close and skip any position that feels unsteady.",
      "difficulty": "Advanced · balance emphasis; support required",
      "ids": [
        "figure-four-b",
        "knee-chest",
        "hip-abduction",
        "hip-flexor-b",
        "side-bend"
      ]
    },
    {
      "id": "standing-mobility-endurance",
      "title": "Standing Mobility Endurance",
      "level": "Advanced",
      "collection": "level",
      "category": "Full body",
      "minutes": 0,
      "description": "The longest varied standing circuit in this group, combining upper-body mobility, lower-leg movement, and hip work.",
      "difficulty": "Advanced · longer sequence and transitions",
      "ids": [
        "standing-reset-4113",
        "overhead-shoulder",
        "forward-fold",
        "standing-reset-4114",
        "hip-flexor-a",
        "shoulder-b",
        "wide-stance-b",
        "calf-a"
      ]
    },
    {
      "id": "quick-shoulders-chest",
      "title": "Quick Shoulders & Chest",
      "level": "Body Area",
      "collection": "body-area",
      "category": "Shoulders & chest",
      "minutes": 0,
      "description": "A brief upper-body selection covering cross-body shoulders, overhead reach, and chest mobility.",
      "difficulty": "Quick · upper body",
      "ids": [
        "overhead-shoulder",
        "shoulder-b",
        "standing-reset-4123"
      ]
    },
    {
      "id": "quick-hips",
      "title": "Quick Hip Mobility",
      "level": "Body Area",
      "collection": "body-area",
      "category": "Hips",
      "minutes": 0,
      "description": "A brief supported selection of the approved hip-flexor, hip-rotation, and knee-to-chest demonstrations.",
      "difficulty": "Quick · use support as needed",
      "ids": [
        "hip-flexor-a",
        "side-bend",
        "knee-chest"
      ]
    },
    {
      "id": "quick-supported-balance",
      "title": "Quick Supported Balance",
      "level": "Body Area",
      "collection": "body-area",
      "category": "Balance & hips",
      "minutes": 0,
      "description": "A short, supported sequence combining the approved knee-to-chest and figure-four positions with hip movement. Keep a stable support close.",
      "difficulty": "Quick · balance support required",
      "ids": [
        "figure-four-b",
        "knee-chest",
        "hip-abduction"
      ]
    },
    {
      "id": "quick-hamstrings",
      "title": "Quick Hamstrings",
      "level": "Body Area",
      "collection": "body-area",
      "category": "Hamstrings",
      "minutes": 0,
      "description": "A short hip-hinge and hamstring sequence using the approved forward fold and standing hamstring demonstration.",
      "difficulty": "Quick · back-of-leg focus",
      "ids": [
        "forward-fold",
        "hamstring-a",
        "calf-a"
      ]
    },
    {
      "id": "quick-inner-thighs",
      "title": "Quick Inner Thighs",
      "level": "Body Area",
      "collection": "body-area",
      "category": "Inner thighs",
      "minutes": 0,
      "description": "A brief supported lateral sequence centered on the approved adductor stretch and one wide-stance demonstration.",
      "difficulty": "Quick · comfortable stance width",
      "ids": [
        "adductor",
        "wide-stance-b",
        "hip-flexor-a"
      ]
    },
    {
      "id": "quick-full-body-reset",
      "title": "Quick Full-Body Reset",
      "level": "Body Area",
      "collection": "body-area",
      "category": "Full body",
      "minutes": 0,
      "description": "A short sampler linking chest, hip, and lower-leg movements from the approved library.",
      "difficulty": "Quick · mixed areas",
      "ids": [
        "standing-reset-4123",
        "hip-abduction",
        "standing-reset-4114",
        "overhead-reset"
      ]
    }
  ]
};
for(const movement of catalog.movements){movement.thumbnail='/app/stretching/thumbnails/'+encodeURIComponent(movement.id)+'.jpg';}
// Timings follow the approved demonstration lengths plus brief setup and transitions.
for(const routine of catalog.routines){
  routine.seconds=30+routine.ids.reduce((sum,id)=>sum+(catalog.movements.find(m=>m.id===id)?.seconds||0),0)+Math.max(0,routine.ids.length-1)*6;
  routine.minutes=Math.ceil(routine.seconds/60);
}
catalog.mediaUrl=function(file,sha256,publicBase){
  const approved=catalog.movements.find(m=>m.file===file&&m.sha256===sha256);
  if(!approved)throw new Error('Refusing unapproved SoulStretch media mapping');
  const local='/app/stretching/media/'+encodeURIComponent(file);
  if(typeof publicBase!=='string'||!publicBase.trim())return local;
  const base=new URL(publicBase.trim());
  if(base.protocol!=='https:'||base.username||base.password||base.search||base.hash)throw new Error('SoulStretch media base must be a clean HTTPS URL');
  if(!base.pathname.endsWith('/'))base.pathname+='/';
  return new URL(encodeURIComponent(sha256)+'/'+encodeURIComponent(file),base).href;
};
if(typeof module==='object'&&module.exports)module.exports=catalog;
if(root)root.SoulStretchCatalog=catalog;
})(typeof globalThis==='undefined'?this:globalThis);
